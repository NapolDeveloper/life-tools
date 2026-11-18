/**
 * 연말정산 계산기(2026년 귀속). 순수 함수. 흐름과 기준값은 docs/specs/year-end-tax.md, 값은 src/data/year-end-tax-2026.ts.
 * 근로소득공제·기본세율·근로소득세액공제·4대보험 추정은 salary.ts / payroll.ts를 재사용한다.
 */
import { INCOME_TAX } from '../data/payroll';
import {
  PERSONAL, CARD, HOUSING_SUBSCRIPTION, CHILD_CREDIT, PENSION_ACCOUNT, SPECIAL_CREDIT, RENT_CREDIT, MARRIAGE_CREDIT, STANDARD_CREDIT,
} from '../data/year-end-tax-2026';
import { calculateSalary, earnedIncomeDeduction, progressiveTax, earnedTaxCredit, floor10 } from './salary';

export interface YearEndInput {
  /** 세전 연봉 (원) */
  annualSalary: number;
  /** 월 비과세액 (원) */
  monthlyNonTaxable: number;
  /** 기본공제 인원 (본인 포함, 최소 1) */
  dependents: number;
  /** 70세 이상 인원 */
  seniors: number;
  /** 장애인 인원 */
  disabled: number;
  /** 기본공제 자녀 중 만 9세 이상 ~ 20세 이하 */
  children: number;
  /** 기본공제 자녀 중 만 8세 이하 (카드 한도 가산에만 쓴다) */
  youngChildren: number;
  /** 올해 출생·입양 자녀 순위: 0 없음 / 1 첫째 / 2 둘째 / 3 셋째 이상 */
  birthOrder: number;
  /** 이미 낸 소득세 연 합계. null이면 추정 */
  paidIncomeTax: number | null;
  /** 국민연금 본인 부담 연 합계. null이면 추정 */
  paidPension: number | null;
  /** 건강·장기요양·고용보험 본인 부담 연 합계. null이면 추정 */
  paidHealth: number | null;
  cardCredit: number;
  cardDebit: number;
  cardCulture: number;
  cardMarket: number;
  cardTransit: number;
  /** 본인·65세 이상·장애인·6세 이하 의료비 (한도 없음) */
  medicalSelf: number;
  /** 그 외 가족 의료비 (700만 한도) */
  medicalOther: number;
  eduSelf: number;
  /** 취학 전·초중고 교육비 합계와 인원 */
  eduKids: number;
  eduKidsCount: number;
  /** 대학생 교육비 합계와 인원 */
  eduUniv: number;
  eduUnivCount: number;
  insurance: number;
  donation: number;
  pensionSaving: number;
  irp: number;
  housingSubscription: number;
  rent: number;
  married: boolean;
}

export interface CardResult {
  /** 총 사용액 */
  usage: number;
  /** 최저사용금액 (총급여 25%) */
  minUsage: number;
  /** 최저사용금액을 채우고 남은 사용액에 공제율을 곱한 값 (한도 적용 전) */
  deductions: { credit: number; debit: number; culture: number; marketTransit: number };
  beforeLimit: number;
  baseLimit: number;
  extraLimit: number;
  /** 최종 공제액 */
  deduction: number;
}

export interface SettlementResult {
  totalSalary: number;
  earnedDeduction: number;
  earnedIncome: number;
  personalDeduction: number;
  pensionDeduction: number;
  insuranceDeduction: number;
  housingDeduction: number;
  cardDeduction: number;
  taxBase: number;
  calculatedTax: number;
  credits: {
    earned: number;
    child: number;
    birth: number;
    pension: number;
    insurance: number;
    medical: number;
    education: number;
    donation: number;
    rent: number;
    marriage: number;
    standard: number;
  };
  /** 세액공제 합계 (적용 전) / 산출세액 한도로 잘린 값 */
  creditsRaw: number;
  creditsApplied: number;
  determinedTax: number;
  localTax: number;
  /** 결정세액 + 지방소득세 */
  determinedTotal: number;
  paidIncomeTax: number;
  paidLocalTax: number;
  paidTotal: number;
  paidEstimated: boolean;
  /** (결정 − 기납부). 양수면 추가 납부, 음수면 환급 */
  diff: number;
  kind: 'refund' | 'extra' | 'even';
  /** 항목별 공제(보험·의료·교육·기부·월세)를 골랐는지, 표준세액공제를 골랐는지 */
  usedStandard: boolean;
  /** 두 경로의 결정세액(소득세) */
  pathTax: { itemized: number; standard: number };
  /** 항목별 공제 경로의 보험·의료·교육·기부·월세 세액공제 합계 */
  itemizedCreditSum: number;
  card: CardResult;
  /** 의료비 3% 문턱 금액 */
  medicalThreshold: number;
  medicalEligible: number;
  pensionEligible: number;
  /** 4대보험 추정 사용 여부 */
  insuranceEstimated: boolean;
}

const num = (v: unknown): number => (typeof v === 'number' && Number.isFinite(v) && v > 0 ? Math.floor(v) : 0);
const nullable = (v: number | null | undefined): number | null => (v === null || v === undefined ? null : num(v));
const MAX_COUNT = 20;

/** 입력 보정: 음수·NaN 제거, 인원 수 정합성 */
export function normalizeInput(raw: YearEndInput): YearEndInput {
  const annualSalary = num(raw.annualSalary);
  const dependents = Math.min(Math.max(1, num(raw.dependents)), MAX_COUNT);
  const children = Math.min(num(raw.children), dependents - 1);
  const youngChildren = Math.min(num(raw.youngChildren), dependents - 1 - children);
  const eduKidsCount = Math.min(num(raw.eduKidsCount), MAX_COUNT);
  const eduUnivCount = Math.min(num(raw.eduUnivCount), MAX_COUNT);
  return {
    annualSalary,
    monthlyNonTaxable: Math.min(num(raw.monthlyNonTaxable), Math.floor(annualSalary / 12)),
    dependents,
    seniors: Math.min(num(raw.seniors), dependents),
    disabled: Math.min(num(raw.disabled), dependents),
    children,
    youngChildren,
    birthOrder: Math.min(num(raw.birthOrder), 3),
    paidIncomeTax: nullable(raw.paidIncomeTax),
    paidPension: nullable(raw.paidPension),
    paidHealth: nullable(raw.paidHealth),
    cardCredit: num(raw.cardCredit),
    cardDebit: num(raw.cardDebit),
    cardCulture: num(raw.cardCulture),
    cardMarket: num(raw.cardMarket),
    cardTransit: num(raw.cardTransit),
    medicalSelf: num(raw.medicalSelf),
    medicalOther: num(raw.medicalOther),
    eduSelf: num(raw.eduSelf),
    eduKids: num(raw.eduKids),
    eduKidsCount,
    eduUniv: num(raw.eduUniv),
    eduUnivCount,
    insurance: num(raw.insurance),
    donation: num(raw.donation),
    pensionSaving: num(raw.pensionSaving),
    irp: num(raw.irp),
    housingSubscription: num(raw.housingSubscription),
    rent: num(raw.rent),
    married: Boolean(raw.married),
  };
}

/** 인적공제 (원/년): 기본공제 + 70세 이상·장애인 추가공제 */
export function personalDeduction(dependents: number, seniors: number, disabled: number): number {
  return dependents * PERSONAL.basicPerPerson + seniors * PERSONAL.seniorExtra + disabled * PERSONAL.disabledExtra;
}

/** 카드 소득공제 기본한도 (총급여, 기본공제 자녀 수) */
export function cardBaseLimit(totalSalary: number, childCount: number): number {
  const low = totalSalary <= CARD.limitSalaryBoundary;
  const base = low ? CARD.baseLimitLow : CARD.baseLimitHigh;
  const add = Math.min(childCount * (low ? CARD.childAddLow : CARD.childAddHigh), low ? CARD.childAddLowMax : CARD.childAddHighMax);
  return base + add;
}

/**
 * 신용카드 등 소득공제.
 * 최저사용금액(총급여 25%)을 공제율 낮은 순서(신용 → 체크·현금 → 문화 → 전통시장·대중교통)로 먼저 차감하고,
 * 남은 사용액에 공제율을 곱한 뒤 기본한도와 추가한도를 적용한다.
 * 총급여 7,000만 초과면 문화 지출은 문화 공제율을 못 받으므로 신용카드 사용액에 합쳐 계산한다.
 */
export function cardDeduction(
  totalSalary: number,
  usage: { credit: number; debit: number; culture: number; market: number; transit: number },
  childCount: number,
): CardResult {
  const cultureOk = totalSalary <= CARD.cultureMaxSalary;
  const credit = usage.credit + (cultureOk ? 0 : usage.culture);
  const culture = cultureOk ? usage.culture : 0;
  const marketTransit = usage.market + usage.transit;
  const total = credit + usage.debit + culture + marketTransit;
  const minUsage = Math.floor(totalSalary * CARD.minUsageRate);

  let rest = minUsage;
  const take = (amount: number): number => {
    const used = Math.min(amount, rest);
    rest -= used;
    return amount - used;
  };
  const creditLeft = take(credit);
  const debitLeft = take(usage.debit);
  const cultureLeft = take(culture);
  const marketTransitLeft = take(marketTransit);

  const deductions = {
    credit: Math.floor(creditLeft * CARD.rates.credit),
    debit: Math.floor(debitLeft * CARD.rates.debit),
    culture: Math.floor(cultureLeft * CARD.rates.culture),
    marketTransit: Math.floor(marketTransitLeft * CARD.rates.market),
  };
  const beforeLimit = deductions.credit + deductions.debit + deductions.culture + deductions.marketTransit;
  const baseLimit = cardBaseLimit(totalSalary, childCount);
  const low = totalSalary <= CARD.limitSalaryBoundary;
  const extraLimit = low ? CARD.extraLimitLow : CARD.extraLimitHigh;
  const extraEligible = deductions.marketTransit + (low ? deductions.culture : 0);
  const over = Math.max(0, beforeLimit - baseLimit);
  const deduction = Math.min(beforeLimit, baseLimit) + Math.min(over, extraEligible, extraLimit);
  return { usage: total, minUsage, deductions, beforeLimit, baseLimit, extraLimit, deduction };
}

/** 자녀세액공제 (원/년). 만 9세 이상 자녀 수 기준 */
export function childCredit(children: number): number {
  if (children <= 0) return 0;
  if (children === 1) return CHILD_CREDIT.one;
  return CHILD_CREDIT.two + (children - 2) * CHILD_CREDIT.perExtra;
}

/** 출산·입양 세액공제 */
export function birthCredit(order: number): number {
  if (order <= 0) return 0;
  if (order === 1) return CHILD_CREDIT.birth.first;
  if (order === 2) return CHILD_CREDIT.birth.second;
  return CHILD_CREDIT.birth.third;
}

/** 의료비 세액공제 대상액. 총급여 3% 미달분은 '그 외 가족' 의료비에서 먼저 차감한다. */
export function medicalEligible(totalSalary: number, self: number, other: number): { threshold: number; eligible: number } {
  const threshold = Math.floor(totalSalary * SPECIAL_CREDIT.medicalThresholdRate);
  const otherAfter = Math.max(0, other - threshold);
  const left = Math.max(0, threshold - other);
  const selfAfter = Math.max(0, self - left);
  return { threshold, eligible: Math.min(otherAfter, SPECIAL_CREDIT.medicalOtherLimit) + selfAfter };
}

/** 연금계좌 세액공제 대상 납입액 */
export function pensionEligible(pensionSaving: number, irp: number): number {
  return Math.min(Math.min(pensionSaving, PENSION_ACCOUNT.savingLimit) + irp, PENSION_ACCOUNT.totalLimit);
}

/** 기부금 세액공제 (원) */
export function donationCredit(donation: number): number {
  const b = SPECIAL_CREDIT.donationHighBoundary;
  return Math.floor(Math.min(donation, b) * SPECIAL_CREDIT.donationRate + Math.max(0, donation - b) * SPECIAL_CREDIT.donationHighRate);
}

export function calculateYearEnd(rawInput: YearEndInput): SettlementResult {
  const input = normalizeInput(rawInput);
  const totalSalary = input.annualSalary - Math.min(input.monthlyNonTaxable * 12, input.annualSalary);

  // 4대보험·소득세 추정 (salary.ts 재사용)
  const est = calculateSalary({
    annualSalary: input.annualSalary,
    monthlyNonTaxable: input.monthlyNonTaxable,
    dependents: input.dependents,
    children: input.children,
  });
  const insuranceEstimated = input.paidPension === null || input.paidHealth === null;
  const pensionPaid = input.paidPension ?? est.pension * 12;
  const healthPaid = input.paidHealth ?? (est.health + est.longTermCare + est.employment) * 12;

  // 소득공제
  const earnedDeductionAmount = earnedIncomeDeduction(totalSalary);
  const earnedIncome = Math.max(0, totalSalary - earnedDeductionAmount);
  const personal = personalDeduction(input.dependents, input.seniors, input.disabled);
  const housing =
    totalSalary <= HOUSING_SUBSCRIPTION.maxSalary
      ? Math.floor(Math.min(input.housingSubscription, HOUSING_SUBSCRIPTION.maxPaid) * HOUSING_SUBSCRIPTION.rate)
      : 0;
  const card = cardDeduction(
    totalSalary,
    { credit: input.cardCredit, debit: input.cardDebit, culture: input.cardCulture, market: input.cardMarket, transit: input.cardTransit },
    input.children + input.youngChildren,
  );
  const taxBase = Math.max(0, earnedIncome - personal - pensionPaid - healthPaid - housing - card.deduction);
  const calculatedTax = progressiveTax(taxBase);

  // 세액공제: 공통
  const common = {
    earned: earnedTaxCredit(calculatedTax, totalSalary),
    child: childCredit(input.children),
    birth: birthCredit(input.birthOrder),
    pension: Math.floor(
      pensionEligible(input.pensionSaving, input.irp) *
        (totalSalary <= PENSION_ACCOUNT.rateBoundarySalary ? PENSION_ACCOUNT.rateLow : PENSION_ACCOUNT.rateHigh),
    ),
    marriage: input.married ? MARRIAGE_CREDIT : 0,
  };
  const commonSum = common.earned + common.child + common.birth + common.pension + common.marriage;

  // 항목별 공제 경로
  const med = medicalEligible(totalSalary, input.medicalSelf, input.medicalOther);
  const eduEligible =
    input.eduSelf +
    Math.min(input.eduKids, input.eduKidsCount * SPECIAL_CREDIT.educationPerChildLimit) +
    Math.min(input.eduUniv, input.eduUnivCount * SPECIAL_CREDIT.educationPerUnivLimit);
  const rentRate = totalSalary <= RENT_CREDIT.rateBoundarySalary ? RENT_CREDIT.rateLow : RENT_CREDIT.rateHigh;
  const itemized = {
    insurance: Math.floor(Math.min(input.insurance, SPECIAL_CREDIT.insuranceLimit) * SPECIAL_CREDIT.insuranceRate),
    medical: Math.floor(med.eligible * SPECIAL_CREDIT.medicalRate),
    education: Math.floor(eduEligible * SPECIAL_CREDIT.educationRate),
    donation: donationCredit(input.donation),
    rent: totalSalary <= RENT_CREDIT.maxSalary ? Math.floor(Math.min(input.rent, RENT_CREDIT.maxRent) * rentRate) : 0,
  };
  const itemizedSum = itemized.insurance + itemized.medical + itemized.education + itemized.donation + itemized.rent;

  const tax = (credits: number): number => floor10(Math.max(0, calculatedTax - Math.min(credits, calculatedTax)));
  const itemizedTax = tax(commonSum + itemizedSum);
  const standardTax = tax(commonSum + STANDARD_CREDIT);
  // 같으면 표준세액공제(신청 항목이 없는 일반적인 경우)를 고른다
  const usedStandard = standardTax <= itemizedTax;

  const credits = usedStandard
    ? { ...common, insurance: 0, medical: 0, education: 0, donation: 0, rent: 0, standard: STANDARD_CREDIT }
    : { ...common, ...itemized, standard: 0 };
  const creditsRaw = Object.values(credits).reduce((a, b) => a + b, 0);
  const creditsApplied = Math.min(creditsRaw, calculatedTax);
  const determinedTax = usedStandard ? standardTax : itemizedTax;
  const localTax = floor10(determinedTax * INCOME_TAX.localTaxRate);
  const determinedTotal = determinedTax + localTax;

  // 기납부
  const paidEstimated = input.paidIncomeTax === null;
  const paidIncomeTax = input.paidIncomeTax ?? est.incomeTax * 12;
  const paidLocalTax = floor10(paidIncomeTax * INCOME_TAX.localTaxRate);
  const paidTotal = paidIncomeTax + paidLocalTax;
  const diff = determinedTotal - paidTotal;

  return {
    totalSalary,
    earnedDeduction: earnedDeductionAmount,
    earnedIncome,
    personalDeduction: personal,
    pensionDeduction: pensionPaid,
    insuranceDeduction: healthPaid,
    housingDeduction: housing,
    cardDeduction: card.deduction,
    taxBase,
    calculatedTax,
    credits,
    creditsRaw,
    creditsApplied,
    determinedTax,
    localTax,
    determinedTotal,
    paidIncomeTax,
    paidLocalTax,
    paidTotal,
    paidEstimated,
    diff,
    kind: diff < 0 ? 'refund' : diff > 0 ? 'extra' : 'even',
    usedStandard,
    pathTax: { itemized: itemizedTax, standard: standardTax },
    itemizedCreditSum: itemizedSum,
    card,
    medicalThreshold: med.threshold,
    medicalEligible: med.eligible,
    pensionEligible: pensionEligible(input.pensionSaving, input.irp),
    insuranceEstimated,
  };
}
