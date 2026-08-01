import { mkdir, readFile, readdir, writeFile } from 'node:fs/promises';
import { aggregate } from '../aggregate.js';
import { renderScenarios, renderTables } from '../report.js';
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

// Build summary.md with optional observations
let summaryContent = renderTables(rows) + renderScenarios(results);
try {
  const observations = await readFile('report/observations.md', 'utf8');
  summaryContent += '\n' + observations;
} catch {
  // observations.md doesn't exist, continue without it
}
await writeFile('report/summary.md', summaryContent);
console.log('wrote report/summary.json, report/summary.md');
