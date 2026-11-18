import { describe, it, expect } from 'vitest';
import {
  calculateSalary,
  normalizeInput,
  earnedIncomeDeduction,
  progressiveTax,
  childTaxCredit,
  floor10,
} from './salary';

const base = { annualSalary: 40_000_000, monthlyNonTaxable: 200_000, dependents: 1, children: 0 };

describe('helpers', () => {
  it('floor10 절사', () => expect(floor10(12_349)).toBe(12_340));
  it('근로소득공제 구간', () => {
    expect(earnedIncomeDeduction(4_000_000)).toBe(2_800_000);
    expect(earnedIncomeDeduction(30_000_000)).toBe(9_750_000);
    expect(earnedIncomeDeduction(1_000_000_000)).toBe(20_000_000);
  });
  it('산출세액 누진 구간', () => {
    expect(progressiveTax(0)).toBe(0);
    expect(progressiveTax(14_000_000)).toBe(840_000);
    expect(progressiveTax(30_000_000)).toBe(3_240_000);
  });
  it('자녀세액공제', () => {
    expect([0, 1, 2, 3].map(childTaxCredit)).toEqual([0, 250_000, 550_000, 950_000]);
  });
  it('입력 보정', () => {
    expect(normalizeInput({ annualSalary: -5, monthlyNonTaxable: NaN, dependents: 0, children: 3 })).toEqual({
      annualSalary: 0,
      monthlyNonTaxable: 0,
      dependents: 1,
      children: 0,
    });
  });
});

describe('calculateSalary', () => {
  it('연봉 4천 / 식대 20만 / 1인: 항목별 4대보험 값', () => {
    const r = calculateSalary(base);
    expect(r.monthlyGross).toBe(3_333_333);
    expect(r.monthlyTaxable).toBe(3_133_333);
    expect(r.pension).toBe(148_830); // 3,133,333 x 4.75% 절사
    expect(r.health).toBe(112_640); // x 3.595%
    expect(r.longTermCare).toBe(14_800); // 건보료 x 13.14%
    expect(r.employment).toBe(28_190); // x 0.9%
  });

  it('합계 항목 정합성', () => {
    const r = calculateSalary(base);
    const sum = r.pension + r.health + r.longTermCare + r.employment + r.incomeTax + r.localTax;
    expect(r.monthlyDeductionTotal).toBe(sum);
    expect(r.monthlyNet).toBe(r.monthlyGross - sum);
    expect(r.annualNet).toBe(r.monthlyNet * 12);
    expect(r.localTax).toBe(Math.floor((r.incomeTax * 0.1) / 10) * 10);
  });

  it('소득세는 대략 월 9~10만원 범위 (연봉 4천, 1인) - 근사 범위 확인', () => {
    const r = calculateSalary(base);
    expect(r.incomeTax).toBeGreaterThan(80_000);
    expect(r.incomeTax).toBeLessThan(120_000);
  });

  it('연봉이 높을수록 실수령액도 높다', () => {
    const a = calculateSalary({ ...base, annualSalary: 30_000_000 }).monthlyNet;
    const b = calculateSalary({ ...base, annualSalary: 50_000_000 }).monthlyNet;
    expect(b).toBeGreaterThan(a);
  });

  it('부양가족·자녀가 늘면 소득세가 줄거나 같다', () => {
    const one = calculateSalary(base).incomeTax;
    const family = calculateSalary({ ...base, dependents: 4, children: 2 }).incomeTax;
    expect(family).toBeLessThanOrEqual(one);
  });

  it('국민연금 상한 적용 (고연봉)', () => {
    const r = calculateSalary({ ...base, annualSalary: 200_000_000 });
    expect(r.pension).toBe(313_020); // 6,590,000 x 4.75%
  });

  it('연봉 0 이면 모든 값 0', () => {
    const r = calculateSalary({ ...base, annualSalary: 0 });
    expect(r.monthlyNet).toBe(0);
    expect(r.monthlyDeductionTotal).toBe(0);
  });

  it('연봉이 낮아 소득세가 0이어도 음수가 되지 않는다', () => {
    const r = calculateSalary({ ...base, annualSalary: 20_000_000 });
    expect(r.incomeTax).toBeGreaterThanOrEqual(0);
    expect(r.monthlyNet).toBeGreaterThan(0);
  });
});
