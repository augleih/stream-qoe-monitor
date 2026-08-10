import { describe, expect, it } from 'vitest';
import { renderScenarios } from '../src/report.js';
import type { ScenAggRow } from '../src/aggregate.js';

const row: ScenAggRow = {
  scenario: 'seg_404', streamId: 'hls_vod', player: 'hlsjs', network: 'unlimited',
  n: 5, injected_n: 5, timeout_n: 0, not_injected_n: 0, recovered_n: 4, error_n: 1,
  abr_median: 1200, overshoot_median: 0, rebuffer_count_median: 1, rebuffer_time_median: 800,
};

describe('renderScenarios', () => {
  it('집계 행 배열을 마크다운 표로 렌더한다', () => {
    const md = renderScenarios([row]);
    expect(md).toContain('| seg_404 | hls_vod | hlsjs | unlimited | 5 | 4/5 | 0 | 0 | 1200ms | 0 | 1 | 800ms | 1 |');
  });
  it('행이 없으면 빈 문자열을 반환한다', () => {
    expect(renderScenarios([])).toBe('');
  });
});
