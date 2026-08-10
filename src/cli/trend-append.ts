import { existsSync } from 'node:fs';
import { appendFile, mkdir, readFile, writeFile } from 'node:fs/promises';
import { renderTrendMd, trendChartSvg } from '../trend.js';
import type { TrendPoint } from '../types.js';

// CI 전용: 방금 실행된 스모크 런의 결과 1건을 history에 추가하고 trend 산출물을 재생성한다.
const args = process.argv.slice(2);
const get = (k: string): string => {
  const i = args.indexOf(k);
  if (i === -1 || !args[i + 1]) throw new Error(`missing ${k}`);
  return args[i + 1];
};
const runId = Number(get('--run-id'));
const file = get('--file');

await mkdir('trends', { recursive: true });
const historyPath = 'trends/history.jsonl';
const points: TrendPoint[] = existsSync(historyPath)
  ? (await readFile(historyPath, 'utf8')).trim().split('\n').filter(Boolean).map(l => JSON.parse(l) as TrendPoint)
  : [];

if (points.some(p => p.runId === runId)) {
  console.log(`run ${runId} already in history — skip append`);
} else {
  const d = JSON.parse(await readFile(file, 'utf8'));
  const point: TrendPoint = {
    runId,
    date: new Date().toISOString().slice(0, 10),
    startup_ms: d.metrics?.startup_ms ?? null,
    rebuffer_ratio: d.metrics?.rebuffer_ratio ?? null,
    error: d.error ?? null,
  };
  await appendFile(historyPath, JSON.stringify(point) + '\n');
  points.push(point);
  console.log(`appended run ${runId} (${point.date}): startup ${point.startup_ms}ms`);
}

await mkdir('report/charts', { recursive: true });
await writeFile('report/charts/trend_startup.svg', trendChartSvg(points));
await writeFile('report/trend.md', renderTrendMd(points));
console.log('wrote report/trend.md, report/charts/trend_startup.svg');
