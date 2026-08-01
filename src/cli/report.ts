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
await writeFile('report/summary.md', renderTables(rows) + renderScenarios(results));
console.log('wrote report/summary.json, report/summary.md');
