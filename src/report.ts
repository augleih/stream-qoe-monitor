import { aggregateScenarios } from './aggregate.js';
import type { AggRow } from './aggregate.js';
import type { RunResult } from './types.js';

const fmt = (v: number | null, unit = ''): string => (v === null ? '—' : `${v}${unit}`);

export function renderTables(rows: AggRow[]): string {
  const streams = [...new Set(rows.map(r => r.streamId))];
  let md = '# QoE 비교 결과\n\n지표 정의: docs/metrics.md (CTA-2066 준거). 통계: 중앙값 + P95 (평균 미사용).\n';
  for (const s of streams) {
    md += `\n## ${s}\n\n`;
    md += '| network | player | n(실패) | startup 중앙값 | startup P95 | rebuffer ratio | rebuffer 세션% | 드롭률 | 시간가중 해상도 |\n';
    md += '|---|---|---|---|---|---|---|---|---|\n';
    for (const r of rows.filter(r => r.streamId === s)) {
      md += `| ${r.network} | ${r.player} | ${r.n}(${r.failures}) | ${fmt(r.startup_median, 'ms')} | ${fmt(r.startup_p95, 'ms')} | ${fmt(r.rebuffer_ratio_median)} | ${fmt(r.rebuffer_session_pct, '%')} | ${fmt(r.dropped_ratio_median)} | ${fmt(r.twh_median, 'p')} |\n`;
    }
  }
  return md;
}

export function renderScenarios(results: RunResult[]): string {
  const rows = aggregateScenarios(results);
  if (rows.length === 0) return '';
  const fmtMs = (v: number | null) => (v === null ? '—' : `${v}ms`);
  let md = '\n## 결함·조건 변화 시나리오 결과 (반복 집계)\n\n';
  md += '트리거는 재생 위치 기준 (프로토콜 간 공정). 회복 = 주입 후 currentTime 3초 초과 전진. ' +
    '미주입=결함이 발동하지 않은 무효 런.\n\n';
  md += '| scenario | stream | player | network | n | 회복 | 트리거실패 | 미주입 | ABR 반응(중앙값) | rebuffer 수(중앙값) | rebuffer 시간(중앙값) | 에러 |\n';
  md += '|---|---|---|---|---|---|---|---|---|---|---|---|\n';
  for (const r of rows) {
    md += `| ${r.scenario} | ${r.streamId} | ${r.player} | ${r.network} | ${r.n} | ${r.recovered_n}/${r.injected_n} | ${r.timeout_n} | ${r.not_injected_n} | ${fmtMs(r.abr_median)} | ${r.rebuffer_count_median ?? '—'} | ${fmtMs(r.rebuffer_time_median)} | ${r.error_n} |\n`;
  }
  return md;
}
