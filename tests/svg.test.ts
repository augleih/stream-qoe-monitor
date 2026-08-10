import { describe, expect, it } from 'vitest';
import { valueBarChart } from '../src/svg.js';

describe('valueBarChart', () => {
  it('제목·라벨·값 텍스트를 포함한 svg를 만든다', () => {
    const svg = valueBarChart('시간가중 해상도', [
      { label: 'unlimited hlsjs', value: 1056, display: '1056p' },
      { label: 'kbps600 hlsjs', value: 180, display: '180p' },
    ]);
    expect(svg).toContain('<svg');
    expect(svg).toContain('시간가중 해상도');
    expect(svg).toContain('unlimited hlsjs');
    expect(svg).toContain('1056p');
  });
  it('display가 없으면 value를 그대로 표기한다', () => {
    expect(valueBarChart('t', [{ label: 'a', value: 42 }])).toContain('>42<');
  });
  it('최대값 바가 플롯 폭을 가득 채운다', () => {
    const svg = valueBarChart('t', [{ label: 'max', value: 100 }, { label: 'half', value: 50 }]);
    const widths = [...svg.matchAll(/<rect[^>]*width="([\d.]+)"/g)].map(m => Number(m[1]));
    expect(widths[0]).toBeCloseTo(widths[1] * 2, 0);
  });
});
