import { parseArgs } from 'node:util';
import { existsSync } from 'node:fs';
import { startServer } from '../server.js';
import { launchBrowser, runOne, runId, saveResult } from '../runner.js';
import { validCombos } from '../matrix.js';
import type { NetworkName, RunSpec } from '../types.js';

const { values } = parseArgs({
  options: {
    networks: { type: 'string', default: 'unlimited' },
    reps: { type: 'string', default: '5' },
    observe: { type: 'string', default: '60000' },
    filter: { type: 'string', default: '' },
  },
});

const networks = values.networks!.split(',') as NetworkName[];
const reps = Number(values.reps);

const specs: RunSpec[] = [];
for (const network of networks) {
  for (const { player, stream } of validCombos()) {
    for (let rep = 1; rep <= reps; rep++) {
      specs.push({ player, stream, network, rep, observeMs: Number(values.observe) });
    }
  }
}

const filtered = specs.filter(s => runId(s).includes(values.filter!));
const pending = filtered.filter(s => !existsSync(`results/${runId(s)}.json`));
console.log(`matrix: total ${filtered.length}, done ${filtered.length - pending.length}, pending ${pending.length}`);
console.log(`estimated ${(pending.length * (Number(values.observe) / 1000 + 10) / 60).toFixed(0)} min\n`);

const server = await startServer(process.cwd());
const browser = await launchBrowser();
let failures = 0;
try {
  for (const [i, spec] of pending.entries()) {
    const id = runId(spec);
    process.stdout.write(`[${i + 1}/${pending.length}] ${id} ... `);
    try {
      const r = await runOne(browser, server.url, spec);
      await saveResult(r);
      if (r.error !== null) failures += 1;
      console.log(r.error
        ? `ERROR ${r.error}`
        : `startup ${r.metrics.startup_ms}ms rebuf ${r.metrics.rebuffer_count}`);
    } catch (err) {
      failures += 1;
      console.log(`FAILED ${String(err).slice(0, 120)}`);
    }
  }
} finally {
  await browser.close();
  server.close();
}
console.log(failures
  ? `\n${failures} runs failed — 같은 명령 재실행 시 실패분만 다시 시도한다`
  : '\nall runs complete');
process.exitCode = failures ? 1 : 0;
