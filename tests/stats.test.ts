import { describe, expect, it } from 'vitest';
import { median, p95 } from '../src/stats.js';

describe('median', () => {
  it('홀수 개수: 가운데 값', () => {
    expect(median([3, 1, 2])).toBe(2);
  });
  it('짝수 개수: 가운데 두 값의 평균', () => {
    expect(median([4, 1, 3, 2])).toBe(2.5);
  });
  it('입력 배열을 변형하지 않는다', () => {
    const xs = [3, 1, 2];
    median(xs);
    expect(xs).toEqual([3, 1, 2]);
  });
  it('빈 배열은 에러', () => {
    expect(() => median([])).toThrow();
  });
});

describe('p95 (nearest-rank)', () => {
  it('20개: 19번째 값', () => {
    const xs = Array.from({ length: 20 }, (_, i) => i + 1); // 1..20
    expect(p95(xs)).toBe(19);
  });
  it('5개: ceil(0.95*5)=5번째 값', () => {
    expect(p95([10, 20, 30, 40, 50])).toBe(50);
  });
  it('1개: 그 값', () => {
    expect(p95([7])).toBe(7);
  });
  it('빈 배열은 에러', () => {
    expect(() => p95([])).toThrow();
  });
});
