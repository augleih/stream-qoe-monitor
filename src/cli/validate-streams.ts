import { startServer } from '../server.js';
import { launchBrowser, runOne } from '../runner.js';
import { validCombos } from '../matrix.js';

const server = await startServer(process.cwd());
const browser = await launchBrowser();
const lines: string[] = [];
try {
  for (const { player, stream } of validCombos()) {
    try {
      const r = await runOne(browser, server.url, {
        player, stream, network: 'unlimited', rep: 0, observeMs: 20_000,
      });
      lines.push(r.metrics.first_frame_ms !== null
        ? `OK    ${stream.id} × ${player}  first_frame ${r.metrics.first_frame_ms}ms`
        : `FAIL  ${stream.id} × ${player}  ${r.error ?? 'no first frame in 20s'}`);
    } catch (err) {
      lines.push(`CRASH ${stream.id} × ${player}  ${String(err).slice(0, 120)}`);
    }
    console.log(lines[lines.length - 1]);
  }
} finally {
  await browser.close();
  server.close();
}
const bad = lines.filter(l => !l.startsWith('OK'));
console.log(`\n${lines.length - bad.length}/${lines.length} combos OK`);
process.exit(bad.length ? 1 : 0);
