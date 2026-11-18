import { PENSION, HEALTH, LONG_TERM_CARE, EMPLOYMENT, INCOME_TAX } from '../data/payroll';

export interface SalaryInput {
  /** 세전 연봉 (원) */
  annualSalary: number;
  /** 월 비과세액 (원). 식대 등 */
  monthlyNonTaxable: number;
  /** 부양가족 수 (본인 포함, 최소 1) */
  dependents: number;
  /** 20세 이하 자녀 수 (부양가족에 포함된 인원) */
  children: number;
}

export interface SalaryResult {
  monthlyGross: number;
  monthlyNonTaxable: number;
  monthlyTaxable: number;
  /** 월 공제 항목 */
  pension: number;
  health: number;
  longTermCare: number;
  employment: number;
  incomeTax: number;
  localTax: number;
  monthlyDeductionTotal: number;
  monthlyNet: number;
  /** 연간 합계 (월 값 x 12) */
  annualDeductionTotal: number;
  annualNet: number;
}

/** 10원 미만 절사 (보험료·세금 고지 관행) */
export const floor10 = (n: number): number => Math.floor(n / 10) * 10;

const clamp = (n: number, min: number, max: number): number => Math.min(Math.max(n, min), max);

/** 입력값 보정: 음수·NaN 제거, 정수화, 가족/자녀 수 정합성 */
export function normalizeInput(input: SalaryInput): SalaryInput {
  const num = (v: number): number => (Number.isFinite(v) && v > 0 ? Math.floor(v) : 0);
  const annualSalary = num(input.annualSalary);
  const monthlyNonTaxable = Math.min(num(input.monthlyNonTaxable), Math.floor(annualSalary / 12));
  const dependents = Math.max(1, num(input.dependents));
  const children = Math.min(num(input.children), dependents - 1);
  return { annualSalary, monthlyNonTaxable, dependents, children };
}

/** 근로소득공제 (원/년) */
export function earnedIncomeDeduction(totalSalary: number): number {
  const tier = INCOME_TAX.earnedIncomeDeduction.find((t) => totalSalary <= t.upTo)!;
  const value = tier.base + (totalSalary - tier.from) * tier.rate;
  return Math.floor(Math.min(value, INCOME_TAX.earnedIncomeDeductionCap));
}

/** 종합소득세율 적용 산출세액 (원/년) */
export function progressiveTax(taxBase: number): number {
  if (taxBase <= 0) return 0;
  const b = INCOME_TAX.brackets.find((x) => taxBase <= x.upTo)!;
  return Math.floor(taxBase * b.rate - b.deduction);
}

/** 근로소득세액공제 (한도 적용, 원/년) */
export function earnedTaxCredit(calculatedTax: number, totalSalary: number): number {
  const c = INCOME_TAX.earnedTaxCredit;
  const credit =
    calculatedTax <= c.threshold
      ? calculatedTax * c.lowRate
      : c.highBase + (calculatedTax - c.threshold) * c.highRate;
  const l = INCOME_TAX.earnedTaxCreditLimit;
  let limit: number;
  if (totalSalary <= l.tier1Max) limit = l.tier1Limit;
  else if (totalSalary <= l.tier2Max)
    limit = Math.max(l.tier1Limit - (totalSalary - l.tier1Max) * l.tier2Reduce, l.tier2Min);
  else if (totalSalary <= l.tier3Max)
    limit = Math.max(l.tier3Base - (totalSalary - l.tier2Max) * l.tier3Reduce, l.tier3Min);
  else limit = Math.max(l.tier4Base - (totalSalary - l.tier3Max) * l.tier4Reduce, l.tier4Min);
  return Math.floor(Math.min(credit, limit));
}

/** 자녀세액공제 (원/년) */
export function childTaxCredit(children: number): number {
  const c = INCOME_TAX.childCredit;
  if (children <= 0) return 0;
  if (children === 1) return c.one;
  return c.two + (children - 2) * c.perExtra;
}

export function calculateSalary(raw: SalaryInput): SalaryResult {
  const { annualSalary, monthlyNonTaxable, dependents, children } = normalizeInput(raw);

  const monthlyGross = Math.floor(annualSalary / 12);
  const monthlyTaxable = monthlyGross - monthlyNonTaxable;

  // 4대보험 (월, 근로자 부담분)
  const pensionBase = monthlyTaxable <= 0 ? 0 : clamp(monthlyTaxable, PENSION.baseMin, PENSION.baseMax);
  const pension = floor10(pensionBase * PENSION.employeeRate);
  const health = floor10(monthlyTaxable * HEALTH.employeeRate);
  const longTermCare = floor10(health * LONG_TERM_CARE.rateOnHealthPremium);
  const employment = floor10(monthlyTaxable * EMPLOYMENT.employeeRate);

  // 소득세 근사 (연 단위로 계산 후 12로 나눔)
  const totalSalary = monthlyTaxable * 12; // 총급여 = 비과세 제외
  const insuranceYear = (pension + health + longTermCare + employment) * 12;
  const taxBase = Math.max(
    0,
    totalSalary -
      earnedIncomeDeduction(totalSalary) -
      INCOME_TAX.personalDeductionPerPerson * dependents -
      insuranceYear,
  );
  const calculated = progressiveTax(taxBase);
  const credits =
    earnedTaxCredit(calculated, totalSalary) + childTaxCredit(children) + INCOME_TAX.standardTaxCredit;
  const yearlyTax = Math.max(0, calculated - credits);
  const incomeTax = floor10(yearlyTax / 12);
  const localTax = floor10(incomeTax * INCOME_TAX.localTaxRate);

  const monthlyDeductionTotal = pension + health + longTermCare + employment + incomeTax + localTax;
  const monthlyNet = monthlyGross - monthlyDeductionTotal;

  return {
    monthlyGross,
    monthlyNonTaxable,
    monthlyTaxable,
    pension,
    health,
    longTermCare,
    employment,
    incomeTax,
    localTax,
    monthlyDeductionTotal,
    monthlyNet,
    annualDeductionTotal: monthlyDeductionTotal * 12,
    annualNet: monthlyNet * 12,
  };
}
