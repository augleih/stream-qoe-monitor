import { parseArgs } from 'node:util';
import { startServer } from '../server.js';
import { launchBrowser, runOne, saveResult } from '../runner.js';
import { STREAMS } from '../streams.js';
import type { NetworkName, PlayerName } from '../types.js';

const { values } = parseArgs({
  options: {
    player: { type: 'string' },
    stream: { type: 'string' },
    network: { type: 'string', default: 'unlimited' },
    observe: { type: 'string', default: '60000' },
    rep: { type: 'string', default: '1' },
  },
});

const stream = STREAMS.find(s => s.id === values.stream);
if (!stream || !values.player) {
  console.error('usage: npm run measure -- --player hlsjs --stream hls_vod [--network unlimited] [--observe 60000] [--rep 1]');
  process.exit(1);
}

const server = await startServer(process.cwd());
const browser = await launchBrowser();
try {
  const result = await runOne(browser, server.url, {
    player: values.player as PlayerName,
    stream,
    network: values.network as NetworkName,
    rep: Number(values.rep),
    observeMs: Number(values.observe),
  });
  const path = await saveResult(result);
  console.log(`saved ${path}`);
  console.log(JSON.stringify(result.metrics, null, 2));
  if (result.error) { console.error(`run error: ${result.error}`); process.exit(1); }
} finally {
  await browser.close();
  server.close();
}
