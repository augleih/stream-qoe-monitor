import { parseArgs } from 'node:util';
import { existsSync } from 'node:fs';
import { startServer } from '../server.js';
import { launchBrowser, runOne, runId, saveResult } from '../runner.js';
import { SCENARIOS } from '../scenarios.js';
import { STREAMS } from '../streams.js';
import type { NetworkName, PlayerName, RunSpec } from '../types.js';

const { values } = parseArgs({
  options: {
    reps: { type: 'string', default: '5' },
    observe: { type: 'string', default: '60000' },
    filter: { type: 'string', default: '' },
  },
});

// 1단계 배치와 동일한 분배: 결함 4종은 VOD, manifest_fail은 라이브, bw_recover는 kbps600 시작
interface BatchEntry { scenario: string; player: PlayerName; streamId: string; network: NetworkName; }
const ENTRIES: BatchEntry[] = [];
for (const [streamId, players] of [
  ['hls_vod', ['hlsjs', 'shaka']],
  ['dash_vod', ['dashjs', 'shaka']],
] as [string, PlayerName[]][]) {
  for (const player of players) {
    for (const scenario of ['seg_404', 'seg_delay', 'offline_3s', 'bw_drop']) {
      ENTRIES.push({ scenario, player, streamId, network: 'unlimited' });
    }
    ENTRIES.push({ scenario: 'bw_recover', player, streamId, network: 'kbps600' });
  }
}
for (const [streamId, players] of [
  ['hls_live', ['hlsjs', 'shaka']],
  ['dash_live', ['dashjs', 'shaka']],
] as [string, PlayerName[]][]) {
  for (const player of players) {
    ENTRIES.push({ scenario: 'manifest_fail', player, streamId, network: 'unlimited' });
  }
}

const reps = Number(values.reps);
const specs: RunSpec[] = [];
for (const e of ENTRIES) {
  const stream = STREAMS.find(s => s.id === e.streamId);
  if (!stream) throw new Error(`unknown stream ${e.streamId}`);
  for (let rep = 1; rep <= reps; rep++) {
    specs.push({ player: e.player, stream, network: e.network, rep, observeMs: Number(values.observe), scenario: e.scenario });
  }
}

const filtered = specs.filter(s => runId(s).includes(values.filter!));
const pending = filtered.filter(s => !existsSync(`results/${runId(s)}.json`));
console.log(`scenario-batch: total ${filtered.length}, done ${filtered.length - pending.length}, pending ${pending.length}`);

const server = await startServer(process.cwd());
const browser = await launchBrowser();
let failures = 0;
try {
  for (const [i, spec] of pending.entries()) {
    const id = runId(spec);
    process.stdout.write(`[${i + 1}/${pending.length}] ${id} ... `);
    try {
      const r = await runOne(browser, server.url, spec, SCENARIOS[spec.scenario!]);
      await saveResult(r);
      if (r.error !== null) failures += 1;
      console.log(r.error ? `ERROR ${r.error.slice(0, 80)}` : `ok rebuf ${r.metrics.rebuffer_count}`);
    } catch (err) {
      failures += 1;
      console.log(`FAILED ${String(err).slice(0, 120)}`);
    }
  }
} finally {
  await browser.close();
  server.close();
}
console.log(failures ? `${failures} runs failed — 재실행 시 실패분만 재시도` : 'all runs complete');
process.exitCode = failures ? 1 : 0;
