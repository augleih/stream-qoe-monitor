import { parseArgs } from 'node:util';
import { startServer } from '../server.js';
import { launchBrowser, runOne, saveResult } from '../runner.js';
import { SCENARIOS } from '../scenarios.js';
import { STREAMS } from '../streams.js';
import { recovered } from '../aggregate.js';
import type { NetworkName, PlayerName } from '../types.js';

const { values } = parseArgs({
  options: {
    scenario: { type: 'string' },
    player: { type: 'string' },
    stream: { type: 'string' },
    network: { type: 'string', default: 'unlimited' },
    observe: { type: 'string', default: '60000' },
    rep: { type: 'string', default: '1' },
  },
});

const scenario = values.scenario ? SCENARIOS[values.scenario] : undefined;
const stream = STREAMS.find(s => s.id === values.stream);
if (!scenario || !stream || !values.player) {
  console.error(`usage: npm run scenario -- --scenario <${Object.keys(SCENARIOS).join('|')}> --player hlsjs --stream hls_vod [--network unlimited]`);
  process.exit(1);
}

const server = await startServer(process.cwd());
const browser = await launchBrowser();
try {
  const r = await runOne(browser, server.url, {
    player: values.player as PlayerName,
    stream,
    network: values.network as NetworkName,
    rep: Number(values.rep),
    observeMs: Number(values.observe),
    scenario: values.scenario,
  }, scenario);
  const path = await saveResult(r);
  console.log(`saved ${path}`);
  console.log(`recovered: ${recovered(r)}  rebuffers: ${r.metrics.rebuffer_count} (${r.metrics.rebuffer_time_ms}ms)  error: ${r.error ?? '—'}`);
} finally {
  await browser.close();
  server.close();
}
