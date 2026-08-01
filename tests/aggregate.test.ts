import { describe, expect, it } from 'vitest';
import { aggregate, recovered, abrReactionMs, overshoots } from '../src/aggregate.js';
import type { RunResult } from '../src/types.js';

function makeResult(over: Partial<RunResult> & { startup?: number | null }): RunResult {
  const { startup = 1000, ...rest } = over;
  return {
    runId: 'x', player: 'hlsjs', streamId: 'hls_vod', streamUrl: 'u',
    network: 'unlimited', rep: 1, scenario: null, startedAt: '2026-08-01T00:00:00Z',
    libVersion: '1', observeMs: 60000,
    metrics: {
      manifest_loaded_ms: 100, first_segment_ms: 300, metadata_ms: 500,
      first_frame_ms: startup, startup_ms: startup,
      breakdown: { manifest: 100, to_first_segment: 200, to_metadata: 200, to_first_frame: 500 },
      rebuffer_count: 0, rebuffer_time_ms: 0, rebuffer_ratio: 0,
      dropped_ratio: 0, time_weighted_height: 720,
    },
    timeline: [], samples: [], error: null,
    ...rest,
  };
}

describe('aggregate', () => {
  it('같은 그룹의 startup 중앙값과 P95를 계산한다', () => {
    const rows = aggregate([
      makeResult({ rep: 1, startup: 1000 }),
      makeResult({ rep: 2, startup: 2000 }),
      makeResult({ rep: 3, startup: 3000 }),
    ]);
    expect(rows).toHaveLength(1);
    expect(rows[0].startup_median).toBe(2000);
    expect(rows[0].startup_p95).toBe(3000);
    expect(rows[0].n).toBe(3);
    expect(rows[0].failures).toBe(0);
  });
  it('에러 런은 failures로 세고 통계에서 제외한다', () => {
    const rows = aggregate([
      makeResult({ rep: 1, startup: 1000 }),
      makeResult({ rep: 2, startup: null, error: 'boom' }),
    ]);
    expect(rows[0].n).toBe(2);
    expect(rows[0].failures).toBe(1);
    expect(rows[0].startup_median).toBe(1000);
  });
  it('scenario 런은 집계에서 제외한다', () => {
    const rows = aggregate([
      makeResult({ rep: 1 }),
      makeResult({ rep: 1, scenario: 'seg_404', runId: 'y' }),
    ]);
    expect(rows[0].n).toBe(1);
  });
  it('rep 0 (임시 측정) 런은 집계에서 제외한다', () => {
    const rows = aggregate([
      makeResult({ rep: 1 }),
      makeResult({ rep: 0, runId: 'adhoc' }),
    ]);
    expect(rows[0].n).toBe(1);
  });
  it('player가 다르면 다른 그룹이다', () => {
    const rows = aggregate([
      makeResult({ rep: 1 }),
      makeResult({ rep: 1, player: 'shaka', runId: 'z' }),
    ]);
    expect(rows).toHaveLength(2);
  });
  it('rebuffer 발생 세션 비율을 계산한다', () => {
    const withRebuf = makeResult({ rep: 1 });
    withRebuf.metrics.rebuffer_count = 2;
    const rows = aggregate([withRebuf, makeResult({ rep: 2 })]);
    expect(rows[0].rebuffer_session_pct).toBe(50);
  });
});

describe('recovered', () => {
  it('mark 이후 currentTime이 3초 넘게 전진하면 true', () => {
    const r = makeResult({});
    r.timeline = [{ t: 45000, type: 'mark', detail: 'offline_start' }];
    r.samples = [
      { t: 44000, ct: 43, buffer_s: 5, height: 720, dropped: 0, decoded: 100 },
      { t: 59000, ct: 55, buffer_s: 5, height: 720, dropped: 0, decoded: 200 },
    ];
    expect(recovered(r)).toBe(true);
  });
  it('전진하지 않으면 false', () => {
    const r = makeResult({});
    r.timeline = [{ t: 45000, type: 'mark', detail: 'offline_start' }];
    r.samples = [
      { t: 44000, ct: 43, buffer_s: 5, height: 720, dropped: 0, decoded: 100 },
      { t: 59000, ct: 43.5, buffer_s: 0, height: 720, dropped: 0, decoded: 100 },
    ];
    expect(recovered(r)).toBe(false);
  });
  it('mark가 없으면 null', () => {
    expect(recovered(makeResult({}))).toBe(null);
  });
});

describe('abrReactionMs', () => {
  it('mark 이후 첫 화질 전환까지의 지연', () => {
    const r = makeResult({});
    r.timeline = [
      { t: 5000, type: 'quality_switch', detail: { height: 720 } },
      { t: 30000, type: 'mark', detail: 'bw_drop_600k' },
      { t: 34500, type: 'quality_switch', detail: { height: 234 } },
    ];
    expect(abrReactionMs(r)).toBe(4500);
  });
  it('mark 이후 전환이 없으면 null', () => {
    const r = makeResult({});
    r.timeline = [{ t: 30000, type: 'mark', detail: 'bw_drop_600k' }];
    expect(abrReactionMs(r)).toBe(null);
  });
});

describe('overshoots', () => {
  it('상향 후 10초 내 하향이 오면 1회로 센다', () => {
    const r = makeResult({});
    r.timeline = [
      { t: 5000, type: 'quality_switch', detail: { height: 234 } },
      { t: 10000, type: 'quality_switch', detail: { height: 720 } },  // 상향
      { t: 15000, type: 'quality_switch', detail: { height: 234 } },  // 5초 만에 하향 → 오버슈트
    ];
    expect(overshoots(r)).toBe(1);
  });
  it('상향 후 10초 넘게 유지되면 0', () => {
    const r = makeResult({});
    r.timeline = [
      { t: 5000, type: 'quality_switch', detail: { height: 234 } },
      { t: 10000, type: 'quality_switch', detail: { height: 720 } },
      { t: 25000, type: 'quality_switch', detail: { height: 234 } },
    ];
    expect(overshoots(r)).toBe(0);
  });
});
