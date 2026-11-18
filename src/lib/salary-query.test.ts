import { describe, it, expect } from 'vitest';
import { parseSalaryQuery, toSalaryQuery, validateSalary, SALARY_DEFAULTS } from './salary-query';

describe('salary-query', () => {
  it('빈 쿼리는 기본값', () => {
    expect(parseSalaryQuery('')).toEqual(SALARY_DEFAULTS);
  });
  it('쿼리 복원', () => {
    expect(parseSalaryQuery('?salary=50000000&nontax=100000&deps=3&kids=1')).toEqual({
      annualSalary: 50_000_000,
      monthlyNonTaxable: 100_000,
      dependents: 3,
      children: 1,
    });
  });
  it('잘못된 값은 기본값, 가족·자녀 정합성 보정', () => {
    const r = parseSalaryQuery('?salary=abc&deps=99&kids=50&nontax=-1');
    expect(r.annualSalary).toBe(SALARY_DEFAULTS.annualSalary);
    expect(r.monthlyNonTaxable).toBe(SALARY_DEFAULTS.monthlyNonTaxable);
    expect(r.dependents).toBe(20);
    expect(r.children).toBe(19);
  });
  it('쿼리 생성: 기본값이면 비움, 왕복 일치', () => {
    expect(toSalaryQuery(SALARY_DEFAULTS)).toBe('');
    const input = { annualSalary: 55_000_000, monthlyNonTaxable: 0, dependents: 2, children: 1 };
    expect(parseSalaryQuery(toSalaryQuery(input))).toEqual(input);
  });
  it('검증 메시지', () => {
    expect(validateSalary({ ...SALARY_DEFAULTS, annualSalary: 0 })).toBe('연봉을 입력해 주세요.');
    expect(validateSalary({ ...SALARY_DEFAULTS, annualSalary: -1 })).toBe('연봉은 0보다 커야 해요.');
    expect(validateSalary({ ...SALARY_DEFAULTS, annualSalary: 20_000_000_000 })).toContain('100억');
    expect(validateSalary(SALARY_DEFAULTS)).toBeNull();
  });
});
