import { existsSync } from 'node:fs';
import { mkdir, readFile, readdir, writeFile } from 'node:fs/promises';
import { aggregate, aggregateScenarios } from '../aggregate.js';
import { renderDashboard } from '../dashboard.js';
import type { RunResult, TrendPoint } from '../types.js';

const files = (await readdir('results')).filter(f => f.endsWith('.json'));
const results: RunResult[] = [];
for (const f of files) {
  results.push(JSON.parse(await readFile(`results/${f}`, 'utf8')) as RunResult);
}

let history: TrendPoint[] = [];
if (existsSync('trends/history.jsonl')) {
  history = (await readFile('trends/history.jsonl', 'utf8')).trim().split('\n')
    .filter(Boolean).map(l => JSON.parse(l) as TrendPoint);
}

await mkdir('dashboard', { recursive: true });
await writeFile('dashboard/index.html', renderDashboard(aggregate(results), aggregateScenarios(results), history));
console.log(`wrote dashboard/index.html (results ${results.length}, trend ${history.length})`);
