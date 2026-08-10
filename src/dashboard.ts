import { barChart, lineChart, valueBarChart } from './svg.js';
import type { AggRow, ScenAggRow } from './aggregate.js';
import type { TrendPoint } from './types.js';

const esc = (s: string): string =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const fmt = (v: number | null, unit = ''): string => (v === null ? '—' : `${v}${unit}`);
// rebuffer/드롭률(0~0.1대 소수)은 바 길이용으로 ‰ 정수화하고 원값을 display로 보존
const perMille = (v: number): number => Math.round(v * 1000);

function trendSection(history: TrendPoint[]): string {
  let h = '<section><h2>일일 스모크 추이</h2>\n' +
    '<p class="meta">매일 06:00 KST CI 측정 — hls_vod × hlsjs, unlimited, 30초 관찰.</p>\n';
  if (history.length === 0) return h + '<p>데이터 없음</p></section>\n';
  const ok = history.filter(p => p.startup_ms !== null);
  if (ok.length) {
    h += lineChart('startup ms', ok.map(p => ({ label: p.date.slice(5), value: p.startup_ms as number })));
  }
  const rb = history.filter(p => p.rebuffer_ratio !== null);
  if (rb.length) {
    h += lineChart('rebuffer ratio (‰)', rb.map(p => ({ label: p.date.slice(5), value: perMille(p.rebuffer_ratio as number) })));
  }
  const errors = history.filter(p => p.error !== null);
  if (errors.length) {
    h += '<h3>에러 런</h3>\n<table><tr><th>date</th><th>error</th></tr>\n' +
      errors.map(p => `<tr><td>${p.date}</td><td>${esc(p.error as string)}</td></tr>`).join('\n') +
      '\n</table>\n';
  }
  return h + '</section>\n';
}

function baselineTable(rows: AggRow[]): string {
  const cells = rows.map(r =>
    `<tr><td>${r.network}</td><td>${r.player}</td><td>${r.n}(${r.failures})</td>` +
    `<td>${fmt(r.startup_median, 'ms')}</td><td>${fmt(r.startup_p95, 'ms')}</td>` +
    `<td>${fmt(r.rebuffer_ratio_median)}</td><td>${fmt(r.rebuffer_session_pct, '%')}</td>` +
    `<td>${fmt(r.dropped_ratio_median)}</td><td>${fmt(r.twh_median, 'p')}</td></tr>`).join('\n');
  return `<details><summary>수치 표</summary><table>
<tr><th>network</th><th>player</th><th>n(실패)</th><th>startup 중앙값</th><th>startup P95</th><th>rebuffer ratio</th><th>rebuffer 세션%</th><th>드롭률</th><th>시간가중 해상도</th></tr>
${cells}</table></details>\n`;
}

function baselineSection(rows: AggRow[]): string {
  let h = '<section><h2>베이스라인 비교</h2>\n' +
    '<p class="meta">스트림 4종 × 네트워크 3단계 × 5회. 중앙값 + P95 (지표 정의: CTA-2066 준거 docs/metrics.md).</p>\n';
  if (rows.length === 0) return h + '<p>데이터 없음</p></section>\n';
  const streams = [...new Set(rows.map(r => r.streamId))];
  for (const s of streams) {
    const sr = rows.filter(r => r.streamId === s);
    h += `<h3>${s}</h3>\n`;
    for (const nw of [...new Set(sr.map(r => r.network))]) {
      const bars = sr.filter(r => r.network === nw && r.startup_median !== null && r.startup_p95 !== null)
        .map(r => ({ label: r.player, median: r.startup_median as number, p95: r.startup_p95 as number }));
      if (bars.length) h += barChart(`startup ms — ${nw} (중앙값/P95)`, bars);
    }
    const lbl = (r: AggRow) => `${r.network} ${r.player}`;
    const twh = sr.filter(r => r.twh_median !== null)
      .map(r => ({ label: lbl(r), value: r.twh_median as number, display: `${r.twh_median}p` }));
    if (twh.length) h += valueBarChart('시간가중 해상도 (중앙값)', twh);
    const rb = sr.filter(r => r.rebuffer_ratio_median !== null)
      .map(r => ({ label: lbl(r), value: perMille(r.rebuffer_ratio_median as number), display: String(r.rebuffer_ratio_median) }));
    if (rb.length) h += valueBarChart('rebuffer ratio (중앙값)', rb);
    const dr = sr.filter(r => r.dropped_ratio_median !== null)
      .map(r => ({ label: lbl(r), value: perMille(r.dropped_ratio_median as number), display: String(r.dropped_ratio_median) }));
    if (dr.length) h += valueBarChart('드롭률 (중앙값)', dr);
    h += baselineTable(sr);
  }
  return h + '</section>\n';
}

function scenarioTable(rows: ScenAggRow[]): string {
  const fmtMs = (v: number | null) => (v === null ? '—' : `${v}ms`);
  const cells = rows.map(r =>
    `<tr><td>${r.streamId}</td><td>${r.player}</td><td>${r.network}</td><td>${r.n}</td>` +
    `<td>${r.recovered_n}/${r.injected_n}</td><td>${r.timeout_n}</td><td>${r.not_injected_n}</td>` +
    `<td>${fmtMs(r.abr_median)}</td><td>${r.overshoot_median ?? '—'}</td>` +
    `<td>${r.rebuffer_count_median ?? '—'}</td><td>${fmtMs(r.rebuffer_time_median)}</td><td>${r.error_n}</td></tr>`).join('\n');
  return `<details><summary>수치 표</summary><table>
<tr><th>stream</th><th>player</th><th>network</th><th>n</th><th>회복</th><th>트리거실패</th><th>미주입</th><th>ABR 반응</th><th>오버슈트</th><th>rebuffer 수</th><th>rebuffer 시간</th><th>에러</th></tr>
${cells}</table></details>\n`;
}

function scenarioSection(scenarios: ScenAggRow[]): string {
  let h = '<section><h2>결함·조건 변화 시나리오</h2>\n' +
    '<p class="meta">트리거는 재생 위치 기준. 회복 = 주입 후 currentTime 3초 초과 전진. ' +
    '주입 인지 집계: injected / trigger_timeout / 미주입.</p>\n';
  if (scenarios.length === 0) return h + '<p>데이터 없음</p></section>\n';
  for (const sc of [...new Set(scenarios.map(r => r.scenario))]) {
    const sr = scenarios.filter(r => r.scenario === sc);
    const lbl = (r: ScenAggRow) => `${r.streamId} ${r.player} (${r.network})`;
    h += `<h3>${sc}</h3>\n`;
    const rec = sr.filter(r => r.injected_n > 0)
      .map(r => ({ label: lbl(r), value: Math.round((r.recovered_n / r.injected_n) * 100), display: `${r.recovered_n}/${r.injected_n}` }));
    if (rec.length) h += valueBarChart('회복 (회복 n / 주입 n)', rec);
    const abr = sr.filter(r => r.abr_median !== null)
      .map(r => ({ label: lbl(r), value: r.abr_median as number, display: `${r.abr_median}ms` }));
    if (abr.length) h += valueBarChart('ABR 반응 ms (중앙값)', abr);
    const rbt = sr.filter(r => r.rebuffer_time_median !== null)
      .map(r => ({ label: lbl(r), value: r.rebuffer_time_median as number, display: `${r.rebuffer_time_median}ms` }));
    if (rbt.length) h += valueBarChart('rebuffer 시간 ms (중앙값)', rbt);
    const ov = sr.filter(r => r.overshoot_median !== null && (r.overshoot_median as number) > 0)
      .map(r => ({ label: lbl(r), value: r.overshoot_median as number }));
    if (ov.length) h += valueBarChart('오버슈트 (중앙값)', ov);
    h += scenarioTable(sr);
  }
  return h + '</section>\n';
}

export function renderDashboard(rows: AggRow[], scenarios: ScenAggRow[], history: TrendPoint[]): string {
  const baselineN = rows.reduce((s, r) => s + r.n, 0);
  const scenarioN = scenarios.reduce((s, r) => s + r.n, 0);
  const lastDate = history.length ? history[history.length - 1].date : null;
  return `<!doctype html>
<html lang="ko">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>stream-qoe-monitor 대시보드</title>
<style>
body{font-family:-apple-system,'Apple SD Gothic Neo','Malgun Gothic',sans-serif;max-width:720px;margin:0 auto;padding:16px;color:#0f172a;background:#ffffff}
h1{font-size:22px;margin-bottom:4px}
h2{font-size:18px;border-bottom:2px solid #e2e8f0;padding-bottom:4px;margin-top:36px}
h3{font-size:15px;margin-top:24px}
svg{display:block;margin:8px 0;max-width:100%;height:auto}
table{border-collapse:collapse;font-size:12px;margin:8px 0}
td,th{border:1px solid #cbd5e1;padding:3px 6px;text-align:right}
th{background:#f1f5f9}
details{margin:8px 0}
summary{cursor:pointer;font-size:13px;color:#475569}
.meta{color:#64748b;font-size:13px}
a{color:#2563eb}
</style>
</head>
<body>
<h1>stream-qoe-monitor 대시보드</h1>
<p class="meta">베이스라인 ${baselineN}회 · 시나리오 ${scenarioN}회 · 일일 스모크 ${history.length}회${lastDate ? ` (최근 ${lastDate})` : ''}
 — <a href="https://github.com/augleih/stream-qoe-monitor">github.com/augleih/stream-qoe-monitor</a></p>
${trendSection(history)}${baselineSection(rows)}${scenarioSection(scenarios)}</body>
</html>
`;
}
