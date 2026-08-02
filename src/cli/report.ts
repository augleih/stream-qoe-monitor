import { mkdir, readFile, readdir, writeFile } from 'node:fs/promises';
import { aggregate } from '../aggregate.js';
import { renderScenarios, renderTables } from '../report.js';
import { barChart } from '../svg.js';
import type { RunResult } from '../types.js';

const files = (await readdir('results')).filter(f => f.endsWith('.json'));
const results: RunResult[] = [];
for (const f of files) {
  results.push(JSON.parse(await readFile(`results/${f}`, 'utf8')) as RunResult);
}
console.log(`loaded ${results.length} results`);

const rows = aggregate(results);
await mkdir('report', { recursive: true });
await writeFile('report/summary.json', JSON.stringify(rows, null, 2));

await mkdir('report/charts', { recursive: true });
const chartLinks: string[] = [];
const groups = new Map<string, typeof rows>();
for (const row of rows) {
  const key = `${row.streamId}_${row.network}`;
  const arr = groups.get(key) ?? [];
  arr.push(row);
  groups.set(key, arr);
}
for (const [key, groupRows] of groups) {
  const bars = groupRows
    .filter(r => r.startup_median !== null && r.startup_p95 !== null)
    .map(r => ({ label: r.player, median: r.startup_median as number, p95: r.startup_p95 as number }));
  if (bars.length === 0) continue;
  const file = `charts/startup_${key}.svg`;
  await writeFile(`report/${file}`, barChart(`startup ms — ${key} (중앙값/P95)`, bars));
  chartLinks.push(`![startup ${key}](${file})`);
}

// Build summary.md with optional observations
let summaryContent = renderTables(rows) + '\n## 차트\n\n' + chartLinks.join('\n\n') + '\n' + renderScenarios(results);
try {
  const observations = await readFile('report/observations.md', 'utf8');
  summaryContent += '\n' + observations;
} catch {
  // observations.md doesn't exist, continue without it
}
await writeFile('report/summary.md', summaryContent);
console.log('wrote report/summary.json, report/summary.md');
