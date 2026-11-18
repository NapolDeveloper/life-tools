import { describe, it, expect } from 'vitest';
import { won, num, percent, koreanAmount, parseDigits } from './format';

describe('format', () => {
  it('won/num', () => {
    expect(won(2_924_353)).toBe('2,924,353원');
    expect(num(0)).toBe('0');
  });
  it('percent', () => {
    expect(percent(148_830, 3_333_333)).toBe('4.5%');
    expect(percent(1, 0)).toBe('-');
  });
  it('한글 읽기', () => {
    expect(koreanAmount(40_000_000)).toBe('4,000만 원');
    expect(koreanAmount(40_000_000, true)).toBe('4,000만원');
    expect(koreanAmount(1_234_567)).toBe('123만 4,567원');
    expect(koreanAmount(120_000_000)).toBe('1억 2,000만 원');
    expect(koreanAmount(200_000)).toBe('20만 원');
    expect(koreanAmount(9_999)).toBe('9,999원');
    expect(koreanAmount(0)).toBe('0원');
    expect(koreanAmount(NaN)).toBe('0원');
  });
  it('parseDigits', () => {
    expect(parseDigits('40,000,000원')).toBe(40_000_000);
    expect(parseDigits('')).toBe(0);
    expect(parseDigits('abc')).toBe(0);
  });
});
