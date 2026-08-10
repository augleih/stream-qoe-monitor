import { execFileSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { appendFile, mkdir, readFile, readdir, rm, writeFile } from 'node:fs/promises';
import { lineChart } from '../svg.js';
import type { TrendPoint } from '../types.js';

const gh = (args: string[]): string => execFileSync('gh', args, { encoding: 'utf8' });

await mkdir('trends', { recursive: true });
const historyPath = 'trends/history.jsonl';
const seen = new Set<number>();
if (existsSync(historyPath)) {
  for (const line of (await readFile(historyPath, 'utf8')).trim().split('\n').filter(Boolean)) {
    seen.add((JSON.parse(line) as TrendPoint).runId);
  }
}

const runs = JSON.parse(gh(['run', 'list', '--workflow', 'smoke', '--status', 'success',
  '--limit', '50', '--json', 'databaseId,createdAt'])) as { databaseId: number; createdAt: string }[];

let downloadFailures = 0;
for (const run of runs.reverse()) {
  if (seen.has(run.databaseId)) continue;
  const tmp = `trends/tmp-${run.databaseId}`;
  try {
    gh(['run', 'download', String(run.databaseId), '--name', 'smoke-result', '--dir', tmp]);
    const files = (await readdir(tmp)).filter(f => f.endsWith('.json'));
    if (files.length === 0) continue;

    // Prefer hls_vod_hlsjs_unlimited_r0.json if present; else if exactly one JSON, use it; else skip with log
    let selectedFile: string | null = null;
    if (files.includes('hls_vod_hlsjs_unlimited_r0.json')) {
      selectedFile = 'hls_vod_hlsjs_unlimited_r0.json';
    } else if (files.length === 1) {
      selectedFile = files[0];
    } else {
      console.log(`skip run ${run.databaseId}: old-format artifact with multiple JSON files (no r0 file)`);
      await rm(tmp, { recursive: true, force: true });
      continue;
    }

    const d = JSON.parse(await readFile(`${tmp}/${selectedFile}`, 'utf8'));
    const point: TrendPoint = {
      runId: run.databaseId,
      date: run.createdAt.slice(0, 10),
      startup_ms: d.metrics?.startup_ms ?? null,
      rebuffer_ratio: d.metrics?.rebuffer_ratio ?? null,
      error: d.error ?? null,
    };
    await appendFile(historyPath, JSON.stringify(point) + '\n');
    seen.add(run.databaseId);
    console.log(`collected run ${run.databaseId} (${point.date}): startup ${point.startup_ms}ms`);
  } catch (err) {
    downloadFailures++;
    console.log(`skip run ${run.databaseId}: ${String(err).slice(0, 100)}`);
  } finally {
    await rm(tmp, { recursive: true, force: true });
  }
}

const points: TrendPoint[] = (await readFile(historyPath, 'utf8')).trim().split('\n')
  .filter(Boolean).map(l => JSON.parse(l) as TrendPoint);
const ok = points.filter(p => p.startup_ms !== null);
console.log(`history: ${points.length} runs (${ok.length} with startup)`);

await mkdir('report/charts', { recursive: true });
await writeFile('report/charts/trend_startup.svg',
  lineChart('daily smoke — startup ms (hls_vod × hlsjs, unlimited)',
    ok.map(p => ({ label: p.date.slice(5), value: p.startup_ms as number }))));

let md = '# 일일 스모크 추이\n\n';
md += '매일 06:00 KST CI가 측정한 hls_vod × hlsjs (무제한 네트워크, 30초 관찰) 추이.\n\n';
md += '![trend](charts/trend_startup.svg)\n\n';
md += '| date | startup_ms | rebuffer_ratio | error |\n|---|---|---|---|\n';
for (const p of points) {
  md += `| ${p.date} | ${p.startup_ms ?? '—'} | ${p.rebuffer_ratio ?? '—'} | ${p.error ?? '—'} |\n`;
}
await writeFile('report/trend.md', md);
console.log('wrote report/trend.md, report/charts/trend_startup.svg');

if (downloadFailures > 0) {
  console.log(`${downloadFailures} runs failed to download — 재실행 시 재시도됨`);
  process.exitCode = 1;
}
