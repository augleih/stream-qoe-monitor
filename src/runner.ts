import { chromium } from 'playwright';
import type { Browser, CDPSession, Page } from 'playwright';
import { mkdir, writeFile } from 'node:fs/promises';
import { NETWORKS } from './networks.js';
import type { RunResult, RunSpec } from './types.js';

export interface Scenario {
  setup?: (page: Page, cdp: CDPSession, spec: RunSpec) => Promise<void>;
  run?: (page: Page, cdp: CDPSession, spec: RunSpec) => Promise<void>;
}

export function runId(spec: RunSpec): string {
  const scen = spec.scenario ? `_${spec.scenario}` : '';
  return `${spec.stream.id}_${spec.player}_${spec.network}${scen}_r${spec.rep}`;
}

export async function launchBrowser(): Promise<Browser> {
  // Playwright 기본 Chromium은 H.264/AAC 미지원 → 반드시 chrome channel
  return chromium.launch({
    channel: 'chrome',
    args: ['--autoplay-policy=no-user-gesture-required'],
  });
}

export async function runOne(
  browser: Browser, baseUrl: string, spec: RunSpec, scenario?: Scenario,
): Promise<RunResult> {
  const startedAt = new Date().toISOString();
  const url = `${baseUrl}/player/index.html?player=${spec.player}` +
    `&src=${encodeURIComponent(spec.stream.url)}&observe=${spec.observeMs}`;

  let raw: {
    meta: { libVersion?: string };
    metrics: RunResult['metrics'];
    timeline: RunResult['timeline'];
    samples: RunResult['samples'];
    error: string | null;
  };

  const context = await browser.newContext(); // 회차마다 신규 — 캐시 이월 방지
  try {
    const page = await context.newPage();
    const cdp = await context.newCDPSession(page);
    await cdp.send('Network.enable');
    // 네트워크 조건은 페이지 진입 전 설정 (설계 원칙)
    await cdp.send('Network.emulateNetworkConditions', NETWORKS[spec.network]);

    if (scenario?.setup) await scenario.setup(page, cdp, spec);
    await page.goto(url);
    const running = scenario?.run ? scenario.run(page, cdp, spec).catch(() => {}) : null;
    await page.waitForFunction(
      () => (window as never as { __qoe?: { isDone(): boolean } }).__qoe?.isDone() === true,
      undefined, { timeout: spec.observeMs + 90_000 },
    );
    raw = await page.evaluate(
      () => (window as never as { __qoe: { result(): unknown } }).__qoe.result(),
    ) as typeof raw;
    if (running) await running;
  } finally {
    await context.close();
  }

  return {
    runId: runId(spec),
    player: spec.player,
    streamId: spec.stream.id,
    streamUrl: spec.stream.url,
    network: spec.network,
    rep: spec.rep,
    scenario: spec.scenario ?? null,
    startedAt,
    libVersion: raw.meta.libVersion ?? 'unknown',
    observeMs: spec.observeMs,
    metrics: raw.metrics,
    timeline: raw.timeline,
    samples: raw.samples,
    error: raw.error,
  };
}

export async function saveResult(r: RunResult, dir = 'results'): Promise<string> {
  await mkdir(dir, { recursive: true });
  const path = `${dir}/${r.runId}.json`;
  await writeFile(path, JSON.stringify(r, null, 2));
  return path;
}
