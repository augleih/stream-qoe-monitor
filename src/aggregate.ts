import { median, p95 } from './stats.js';
import type { NetworkName, PlayerName, RunResult } from './types.js';

export interface AggRow {
  streamId: string;
  player: PlayerName;
  network: NetworkName;
  n: number;
  failures: number;
  startup_median: number | null;
  startup_p95: number | null;
  rebuffer_ratio_median: number | null;
  rebuffer_session_pct: number | null;
  dropped_ratio_median: number | null;
  twh_median: number | null;
}

export function aggregate(results: RunResult[]): AggRow[] {
  const groups = new Map<string, RunResult[]>();
  for (const r of results) {
    if (r.scenario !== null || r.rep < 1) continue;
    const key = `${r.streamId}|${r.player}|${r.network}`;
    const arr = groups.get(key) ?? [];
    arr.push(r);
    groups.set(key, arr);
  }

  const rows: AggRow[] = [];
  for (const [key, rs] of groups) {
    const [streamId, player, network] = key.split('|');
    const ok = rs.filter(r => r.error === null && r.metrics.startup_ms !== null);
    const startups = ok.map(r => r.metrics.startup_ms as number);
    const ratios = ok.map(r => r.metrics.rebuffer_ratio ?? 0);
    const drops = ok.map(r => r.metrics.dropped_ratio ?? 0);
    const twhs = ok.filter(r => r.metrics.time_weighted_height !== null)
      .map(r => r.metrics.time_weighted_height as number);
    const withRebuf = ok.filter(r => r.metrics.rebuffer_count > 0).length;
    rows.push({
      streamId,
      player: player as PlayerName,
      network: network as NetworkName,
      n: rs.length,
      failures: rs.length - ok.length,
      startup_median: startups.length ? median(startups) : null,
      startup_p95: startups.length ? p95(startups) : null,
      rebuffer_ratio_median: ratios.length ? median(ratios) : null,
      rebuffer_session_pct: ok.length ? Math.round((withRebuf / ok.length) * 100) : null,
      dropped_ratio_median: drops.length ? median(drops) : null,
      twh_median: twhs.length ? median(twhs) : null,
    });
  }
  return rows.sort((a, b) =>
    `${a.streamId}|${a.network}|${a.player}`.localeCompare(`${b.streamId}|${b.network}|${b.player}`));
}

interface SwitchInfo { t: number; height: number | null; }

function qualitySwitches(r: RunResult): SwitchInfo[] {
  return r.timeline
    .filter(e => e.type === 'quality_switch')
    .map(e => ({
      t: e.t,
      height: (e.detail as { height?: number | null } | undefined)?.height ?? null,
    }));
}

// 마지막 mark 이후 첫 화질 전환까지의 지연 (bw_drop=하향 반응, bw_recover=상향 지연)
export function abrReactionMs(r: RunResult): number | null {
  const marks = r.timeline.filter(e => e.type === 'mark');
  if (marks.length === 0) return null;
  const t = marks[marks.length - 1].t;
  const sw = qualitySwitches(r).find(s => s.t > t);
  return sw ? sw.t - t : null;
}

// 오버슈트: 상향 전환 후 10초 안에 하향 전환이 나온 횟수
export function overshoots(r: RunResult): number {
  const sw = qualitySwitches(r).filter(s => s.height !== null) as { t: number; height: number }[];
  let n = 0;
  for (let i = 1; i < sw.length; i++) {
    if (sw[i].height > sw[i - 1].height) {
      const down = sw.find(s => s.t > sw[i].t && s.t <= sw[i].t + 10_000 && s.height < sw[i].height);
      if (down) n += 1;
    }
  }
  return n;
}

// 결함 주입 후 회복 판정: 마지막 mark 시점 이후 currentTime이 3초 이상 전진했는가
export function recovered(r: RunResult): boolean | null {
  const marks = r.timeline.filter(e => e.type === 'mark');
  if (marks.length === 0) return null;
  const t = marks[marks.length - 1].t;
  const before = [...r.samples].reverse().find(s => s.t <= t);
  const after = r.samples[r.samples.length - 1];
  if (!before || !after || after.t <= before.t) return null;
  return after.ct - before.ct > 3;
}

export interface ScenAggRow {
  scenario: string;
  streamId: string;
  player: PlayerName;
  network: NetworkName;
  n: number;
  injected_n: number;        // 주입 마크가 있는 런
  timeout_n: number;         // trigger_timeout 마크
  not_injected_n: number;    // 마크가 전혀 없음 (armed-but-unfired) — 무효 데이터
  recovered_n: number;
  error_n: number;
  abr_median: number | null;             // injected 중
  rebuffer_count_median: number | null;  // injected 중
  rebuffer_time_median: number | null;   // injected 중
}

// 시나리오 런 집계: 재생 위치가 anchor에 도달했더라도 결함을 유발할 요청이 한 번도
// 오지 않으면(marks 없음) "회복"으로 잘못 세지 않도록 armed-but-unfired 런을
// not_injected_n으로 별도 분리한다 (injected/recovered/중앙값 계산에서 완전히 제외).
export function aggregateScenarios(results: RunResult[]): ScenAggRow[] {
  const groups = new Map<string, RunResult[]>();
  for (const r of results) {
    if (r.scenario === null || r.rep < 1) continue;
    const key = `${r.scenario}|${r.streamId}|${r.player}|${r.network}`;
    const arr = groups.get(key) ?? [];
    arr.push(r);
    groups.set(key, arr);
  }
  const rows: ScenAggRow[] = [];
  for (const [key, rs] of groups) {
    const [scenario, streamId, player, network] = key.split('|');
    const marks = (r: RunResult) => r.timeline.filter(e => e.type === 'mark');
    const hasTimeout = (r: RunResult) => marks(r).some(e => e.detail === 'trigger_timeout');
    const injected = rs.filter(r => !hasTimeout(r) && marks(r).length > 0);
    const timeouts = rs.filter(hasTimeout);
    const notInjectedN = rs.length - injected.length - timeouts.length;
    const abrs = injected.map(r => abrReactionMs(r)).filter((v): v is number => v !== null);
    rows.push({
      scenario, streamId,
      player: player as PlayerName,
      network: network as NetworkName,
      n: rs.length,
      injected_n: injected.length,
      timeout_n: timeouts.length,
      not_injected_n: notInjectedN,
      recovered_n: injected.filter(r => recovered(r) === true).length,
      error_n: rs.filter(r => r.error !== null).length,
      abr_median: abrs.length ? median(abrs) : null,
      rebuffer_count_median: injected.length ? median(injected.map(r => r.metrics.rebuffer_count)) : null,
      rebuffer_time_median: injected.length ? median(injected.map(r => r.metrics.rebuffer_time_ms)) : null,
    });
  }
  return rows.sort((a, b) =>
    `${a.scenario}|${a.streamId}|${a.network}|${a.player}`.localeCompare(`${b.scenario}|${b.streamId}|${b.network}|${b.player}`));
}
