import { describe, it, expect } from 'vitest';
import { calculateSalary } from './salary';
import { SALARY_DEFAULTS } from './salary-query';
import { viewOf, DEDUCTION_ROWS } from './salary-view';

describe('viewOf', () => {
  it('기본값 결과 문자열', () => {
    const r = calculateSalary(SALARY_DEFAULTS);
    const v = viewOf(r);
    expect(v.out.monthlyNet).toBe(`${r.monthlyNet.toLocaleString('ko-KR')}원`);
    expect(v.out.tableCaption).toContain('2026년 기준');
    expect(Object.keys(v.rows)).toHaveLength(DEDUCTION_ROWS.length + 2);
    expect(v.rows.monthlyNet.ratio).toMatch(/^\d+\.\d%$/);
  });
  it('NaN·undefined가 섞이지 않는다', () => {
    const v = viewOf(calculateSalary({ ...SALARY_DEFAULTS, annualSalary: 0 }));
    expect(JSON.stringify(v)).not.toMatch(/NaN|undefined/);
  });
});
