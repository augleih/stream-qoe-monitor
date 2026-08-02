import type { CDPSession, Page } from 'playwright';
import { NETWORKS, OFFLINE } from './networks.js';
import type { Scenario } from './runner.js';

const SEG_RE = /\.(ts|mp4|m4s|m4a|m4v|cmfv|cmfa|aac)(\?|$)/;
const MANIFEST_RE = /\.(m3u8|mpd)(\?|$)/;
const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));

async function mark(page: Page, name: string): Promise<void> {
  await page.evaluate(
    n => (window as never as { __qoe: { mark(x: string): void } }).__qoe.mark(n),
    name,
  ).catch(() => {});
}

// 재생 위치가 sec초에 도달할 때까지 대기. 도달 못 하면 false (호출측이 trigger_timeout 마크)
async function waitForPlayback(page: Page, sec: number, timeoutMs = 55_000): Promise<boolean> {
  try {
    await page.waitForFunction(
      s => {
        const v = document.getElementById('video') as HTMLVideoElement | null;
        return v !== null && v.currentTime >= s;
      },
      sec, { timeout: timeoutMs },
    );
    return true;
  } catch {
    return false;
  }
}

// 결함 주입 기준: 벽시계·요청 횟수가 아닌 "재생 위치" — 플레이어·프로토콜 간 공정 비교 조건.
// (1단계에서 카운트 기준이 DASH는 재생 직후, HLS는 수십 초 후 발동하는 문제를 발견해 재설계)
export const SCENARIOS: Record<string, Scenario> = {
  // 재생 20초 도달 시 600kbps 하강 — ABR 하향 반응
  bw_drop: {
    run: async (page, cdp) => {
      if (!(await waitForPlayback(page, 20))) { await mark(page, 'trigger_timeout'); return; }
      await cdp.send('Network.emulateNetworkConditions', NETWORKS.kbps600);
      await mark(page, 'bw_drop_600k');
    },
  },

  // 재생 20초 도달 시 무제한 회복 — 상향 전환 지연 (--network kbps600으로 시작)
  bw_recover: {
    run: async (page, cdp) => {
      if (!(await waitForPlayback(page, 20))) { await mark(page, 'trigger_timeout'); return; }
      await cdp.send('Network.emulateNetworkConditions', NETWORKS.unlimited);
      await mark(page, 'bw_recover_unlimited');
    },
  },

  // 재생 15초 도달 후 첫 세그먼트 요청을 404로 — 재시도 확인
  seg_404: (() => {
    let armed = false;
    let injected = false;
    return {
      setup: async page => {
        armed = false; injected = false;
        await page.route(SEG_RE, async route => {
          if (armed && !injected) {
            injected = true;
            await mark(page, 'seg_404_injected');
            return route.fulfill({ status: 404, body: '' });
          }
          return route.fallback();
        });
      },
      run: async page => {
        if (!(await waitForPlayback(page, 15))) { await mark(page, 'trigger_timeout'); return; }
        armed = true;
      },
    };
  })(),

  // 재생 15초 도달 후 첫 세그먼트 요청을 5초 지연 — abandon 확인
  seg_delay: (() => {
    let armed = false;
    let injected = false;
    return {
      setup: async page => {
        armed = false; injected = false;
        await page.route(SEG_RE, async route => {
          if (armed && !injected) {
            injected = true;
            await mark(page, 'seg_delay_5s');
            await sleep(5_000);
          }
          return route.fallback();
        });
      },
      run: async page => {
        if (!(await waitForPlayback(page, 15))) { await mark(page, 'trigger_timeout'); return; }
        armed = true;
      },
    };
  })(),

  // 재생 30초 도달 시 네트워크 3초 완전 차단 — 자동 재개 확인
  offline_3s: {
    run: async (page, cdp, spec) => {
      if (!(await waitForPlayback(page, 30))) { await mark(page, 'trigger_timeout'); return; }
      await cdp.send('Network.emulateNetworkConditions', OFFLINE);
      await mark(page, 'offline_start');
      await sleep(3_000);
      await cdp.send('Network.emulateNetworkConditions', NETWORKS[spec.network]);
      await mark(page, 'offline_end');
    },
  },

  // 재생 10초 도달 후 매니페스트 요청 3회 차단 — 갱신 실패 내성 (시작 매니페스트는 이미 통과한 뒤)
  manifest_fail: (() => {
    let armed = false;
    let aborted = 0;
    return {
      setup: async page => {
        armed = false; aborted = 0;
        await page.route(MANIFEST_RE, async route => {
          if (armed && aborted < 3) {
            aborted += 1;
            await mark(page, `manifest_abort_${aborted}`);
            return route.abort('failed');
          }
          return route.fallback();
        });
      },
      run: async page => {
        if (!(await waitForPlayback(page, 10))) { await mark(page, 'trigger_timeout'); return; }
        armed = true;
      },
    };
  })(),
};
