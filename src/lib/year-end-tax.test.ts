import { describe, it, expect } from 'vitest';
import {
  calculateYearEnd, normalizeInput, cardDeduction, cardBaseLimit, childCredit, birthCredit, medicalEligible, pensionEligible, donationCredit, personalDeduction,
  type YearEndInput,
} from './year-end-tax';
import { earnedTaxCredit } from './salary';
import { YEAR_END_DEFAULTS as D } from './year-end-query';

const calc = (o: Partial<YearEndInput> = {}) => calculateYearEnd({ ...D, ...o });
/** 비과세 0으로 총급여 = 연봉 */
const plain = (o: Partial<YearEndInput> = {}) => calc({ monthlyNonTaxable: 0, ...o });

describe('근로소득공제 구간 경계 (총급여 = 연봉, 비과세 0)', () => {
  it.each([
    [5_000_000, 3_500_000],
    [5_000_001, 3_500_000],
    [15_000_000, 7_500_000],
    [45_000_000, 12_000_000],
    [100_000_000, 14_750_000],
    [300_000_000, 18_750_000],
    [400_000_000, 20_000_000],
  ])('총급여 %i -> 공제 %i', (salary, deduction) => {
    expect(plain({ annualSalary: salary }).earnedDeduction).toBe(deduction);
  });
  it('구간 사이 값', () => {
    expect(plain({ annualSalary: 4_000_000 }).earnedDeduction).toBe(2_800_000);
    expect(plain({ annualSalary: 30_000_000 }).earnedDeduction).toBe(9_750_000);
  });
});

describe('근로소득세액공제 한도 경계 / 산출세액 130만', () => {
  it('산출세액 130만 이하 55%, 초과는 71.5만 + 초과분 30%', () => {
    expect(earnedTaxCredit(1_300_000, 20_000_000)).toBe(715_000);
    expect(earnedTaxCredit(1_300_100, 20_000_000)).toBe(715_030);
    expect(earnedTaxCredit(1_000_000, 20_000_000)).toBe(550_000);
  });
  it('총급여 3,300만 이하 한도 74만', () => expect(earnedTaxCredit(5_000_000, 33_000_000)).toBe(740_000));
  it('3,300만 초과~7,000만 한도는 74만에서 줄어 66만까지', () => {
    expect(earnedTaxCredit(5_000_000, 33_000_001)).toBe(739_999);
    expect(earnedTaxCredit(5_000_000, 43_000_000)).toBe(660_000);
    expect(earnedTaxCredit(5_000_000, 70_000_000)).toBe(660_000);
  });
  it('7,000만~1.2억 한도 66만에서 줄어 50만까지', () => {
    expect(earnedTaxCredit(9_000_000, 70_100_000)).toBe(610_000);
    expect(earnedTaxCredit(9_000_000, 80_000_000)).toBe(500_000);
    expect(earnedTaxCredit(9_000_000, 120_000_000)).toBe(500_000);
  });
  it('1.2억 초과 한도 50만에서 줄어 20만까지', () => {
    expect(earnedTaxCredit(30_000_000, 120_100_000)).toBe(450_000);
    expect(earnedTaxCredit(30_000_000, 130_000_000)).toBe(200_000);
    expect(earnedTaxCredit(30_000_000, 300_000_000)).toBe(200_000);
  });
});

describe('인적공제', () => {
  it('기본 150만 x 인원 + 70세 100만 + 장애인 200만', () => {
    expect(personalDeduction(3, 1, 1)).toBe(4_500_000 + 1_000_000 + 2_000_000);
  });
  it('결과에 반영', () => expect(calc({ dependents: 2, seniors: 1 }).personalDeduction).toBe(4_000_000));
});

describe('카드 소득공제', () => {
  const none = { credit: 0, debit: 0, culture: 0, market: 0, transit: 0 };
  it('최저사용금액(총급여 25%) 이하면 공제 0', () => {
    const r = cardDeduction(40_000_000, { ...none, credit: 10_000_000 }, 0);
    expect(r.minUsage).toBe(10_000_000);
    expect(r.deduction).toBe(0);
  });
  it('최저사용금액은 신용카드부터 차감하고 남은 금액에 공제율 적용', () => {
    // 총급여 4,000만 -> 최저 1,000만. 신용 800만이 먼저 모두 차감, 남은 200만은 체크 500만에서 차감 -> 체크 300만 x 30%
    const r = cardDeduction(40_000_000, { ...none, credit: 8_000_000, debit: 5_000_000 }, 0);
    expect(r.deductions).toEqual({ credit: 0, debit: 900_000, culture: 0, marketTransit: 0 });
    expect(r.deduction).toBe(900_000);
  });
  it('차감 순서: 신용 -> 체크 -> 문화 -> 전통시장·대중교통', () => {
    // 최저 1,000만. 신용 400만 + 체크 300만 + 문화 200만 = 900만 차감, 마지막 100만은 대중교통 200만에서 -> 100만 x 40%
    const r = cardDeduction(40_000_000, { ...none, credit: 4_000_000, debit: 3_000_000, culture: 2_000_000, transit: 2_000_000 }, 0);
    expect(r.deductions).toEqual({ credit: 0, debit: 0, culture: 0, marketTransit: 400_000 });
  });
  it('기본한도: 총급여 7,000만 이하 300만, 초과 250만', () => {
    expect(cardBaseLimit(70_000_000, 0)).toBe(3_000_000);
    expect(cardBaseLimit(70_000_001, 0)).toBe(2_500_000);
  });
  it('자녀 가산: 1인당 +50만(최대 +100만), 7,000만 초과 +25만(최대 +50만)', () => {
    expect([0, 1, 2, 3].map((n) => cardBaseLimit(50_000_000, n))).toEqual([3_000_000, 3_500_000, 4_000_000, 4_000_000]);
    expect([0, 1, 2, 3].map((n) => cardBaseLimit(80_000_000, n))).toEqual([2_500_000, 2_750_000, 3_000_000, 3_000_000]);
  });
  it('기본한도 적용', () => {
    // 총급여 4,000만, 최저 1,000만. 체크 3,000만 -> 2,000만 x 30% = 600만 -> 한도 300만(추가공제 대상 없음)
    const r = cardDeduction(40_000_000, { ...none, debit: 30_000_000 }, 0);
    expect(r.beforeLimit).toBe(6_000_000);
    expect(r.deduction).toBe(3_000_000);
  });
  it('추가한도: 대중교통·전통시장·문화 공제액은 기본한도를 넘어도 추가한도(300만)까지', () => {
    // 최저 1,000만을 신용 1,000만으로 채움. 체크 1,000만 -> 300만(기본 한도 꽉 참). 대중교통 500만 x 40% = 200만 -> 추가 200만
    const r = cardDeduction(40_000_000, { ...none, credit: 10_000_000, debit: 10_000_000, transit: 5_000_000 }, 0);
    expect(r.beforeLimit).toBe(5_000_000);
    expect(r.deduction).toBe(5_000_000);
  });
  it('추가공제는 한도 초과분과 추가공제 대상 공제액 중 작은 값', () => {
    // 체크 1,000만 -> 300만, 대중교통 100만 -> 40만: 합 340만, 기본 300만 초과 40만 -> 추가 40만 인정
    const r = cardDeduction(40_000_000, { ...none, credit: 10_000_000, debit: 10_000_000, transit: 1_000_000 }, 0);
    expect(r.deduction).toBe(3_400_000);
  });
  it('추가한도 상한 300만 / 7,000만 초과는 200만', () => {
    const low = cardDeduction(40_000_000, { ...none, credit: 10_000_000, debit: 10_000_000, transit: 30_000_000 }, 0);
    expect(low.deduction).toBe(3_000_000 + 3_000_000);
    const high = cardDeduction(80_000_000, { ...none, credit: 20_000_000, debit: 20_000_000, transit: 30_000_000 }, 0);
    expect(high.deduction).toBe(2_500_000 + 2_000_000);
  });
  it('7,000만 초과면 문화 지출은 신용카드 사용액으로 합산', () => {
    const r = cardDeduction(80_000_000, { ...none, credit: 20_000_000, culture: 5_000_000 }, 0);
    expect(r.deductions.culture).toBe(0);
    expect(r.deductions.credit).toBe(Math.floor(5_000_000 * 0.15));
  });
  it('자녀 수가 한도에 반영', () => {
    const r = calc({ annualSalary: 50_000_000, dependents: 3, children: 1, youngChildren: 1, cardDebit: 40_000_000, cardCredit: 0, cardTransit: 0 });
    expect(r.card.baseLimit).toBe(4_000_000);
  });
});

describe('의료비 3% 차감 순서', () => {
  it('3% 미달액은 그 외 가족분에서 먼저 차감', () => {
    // 총급여 4,000만 -> 문턱 120만. 그 외 가족 100만, 본인 300만 -> 그 외 0, 남은 문턱 20만은 본인에서 -> 280만
    expect(medicalEligible(40_000_000, 3_000_000, 1_000_000)).toEqual({ threshold: 1_200_000, eligible: 2_800_000 });
  });
  it('그 외 가족 700만 한도', () => {
    expect(medicalEligible(40_000_000, 0, 10_000_000).eligible).toBe(7_000_000);
  });
  it('문턱 이하면 공제 없음', () => expect(medicalEligible(40_000_000, 1_000_000, 0).eligible).toBe(0));
  it('세액공제 15%', () => {
    const r = calc({ medicalSelf: 3_000_000, medicalOther: 1_000_000 });
    expect(r.medicalEligible).toBe(Math.floor((3_000_000 - (r.medicalThreshold - 1_000_000))));
  });
});

describe('세액공제 항목', () => {
  it('자녀세액공제 금액', () => expect([0, 1, 2, 3, 4].map(childCredit)).toEqual([0, 250_000, 550_000, 950_000, 1_350_000]));
  it('출산·입양 공제', () => expect([0, 1, 2, 3].map(birthCredit)).toEqual([0, 300_000, 500_000, 700_000]));
  it('연금계좌: 연금저축 600만, 합산 900만', () => {
    expect(pensionEligible(8_000_000, 0)).toBe(6_000_000);
    expect(pensionEligible(6_000_000, 5_000_000)).toBe(9_000_000);
    expect(pensionEligible(2_000_000, 1_000_000)).toBe(3_000_000);
  });
  it('연금계좌 공제율: 총급여 5,500만 이하 15%, 초과 12%', () => {
    expect(plain({ annualSalary: 55_000_000, pensionSaving: 6_000_000 }).credits.pension).toBe(900_000);
    expect(plain({ annualSalary: 55_000_001, pensionSaving: 6_000_000 }).credits.pension).toBe(720_000);
  });
  it('기부금 1,000만 초과분 30%', () => expect(donationCredit(12_000_000)).toBe(1_500_000 + 600_000));
  it('월세: 총급여 8,000만 이하만, 5,500만 이하 17%, 초과 15%, 1,000만 한도', () => {
    const a = plain({ annualSalary: 50_000_000, rent: 12_000_000 });
    expect(a.usedStandard).toBe(false);
    expect(a.credits.rent).toBe(1_700_000);
    expect(plain({ annualSalary: 60_000_000, rent: 6_000_000 }).credits.rent).toBe(900_000);
    expect(plain({ annualSalary: 80_000_001, rent: 6_000_000 }).credits.rent).toBe(0);
  });
  it('주택청약 소득공제: 7,000만 이하 300만 x 40%', () => {
    expect(plain({ annualSalary: 50_000_000, housingSubscription: 5_000_000 }).housingDeduction).toBe(1_200_000);
    expect(plain({ annualSalary: 70_000_001, housingSubscription: 3_000_000 }).housingDeduction).toBe(0);
  });
  it('결혼 50만, 자녀·출산 공제 반영', () => {
    const r = calc({ annualSalary: 80_000_000, married: true, dependents: 3, children: 1, birthOrder: 2 });
    expect(r.credits.marriage).toBe(500_000);
    expect(r.credits.child).toBe(250_000);
    expect(r.credits.birth).toBe(500_000);
  });
  it('교육비 인원별 한도', () => {
    const r = plain({ annualSalary: 80_000_000, dependents: 3, eduKids: 8_000_000, eduKidsCount: 2, eduUniv: 12_000_000, eduUnivCount: 1, eduSelf: 2_000_000 });
    // 본인 200 + 자녀 min(800, 600) + 대학 min(1200, 900) = 1,700만 x 15%
    expect(r.credits.education).toBe(2_550_000);
  });
});

describe('표준세액공제 자동 선택', () => {
  it('항목이 없으면 표준세액공제 13만', () => {
    const r = calc();
    expect(r.usedStandard).toBe(true);
    expect(r.credits.standard).toBe(130_000);
  });
  it('항목별 공제가 13만보다 크면 항목별 선택', () => {
    const r = calc({ annualSalary: 60_000_000, insurance: 1_000_000, donation: 2_000_000 });
    expect(r.usedStandard).toBe(false);
    expect(r.credits.standard).toBe(0);
    expect(r.credits.insurance).toBe(120_000);
    expect(r.credits.donation).toBe(300_000);
    expect(r.pathTax.itemized).toBeLessThan(r.pathTax.standard);
    expect(r.determinedTax).toBe(r.pathTax.itemized);
  });
  it('항목별 공제가 13만보다 작으면 표준세액공제', () => {
    const r = calc({ annualSalary: 60_000_000, insurance: 500_000 });
    expect(r.usedStandard).toBe(true);
    expect(r.determinedTax).toBe(r.pathTax.standard);
  });
});

describe('결정세액 하한 0 / 정산', () => {
  it('세액공제가 산출세액보다 커도 결정세액은 0, 기납부 전액 환급', () => {
    const r = calc({ annualSalary: 15_000_000, monthlyNonTaxable: 0, paidIncomeTax: 100_000 });
    expect(r.determinedTax).toBe(0);
    expect(r.localTax).toBe(0);
    expect(r.creditsApplied).toBeLessThanOrEqual(r.calculatedTax);
    expect(r.diff).toBe(-110_000);
    expect(r.kind).toBe('refund');
  });
  it('기납부가 적으면 추가 납부', () => {
    const r = calc({ paidIncomeTax: 100_000 });
    expect(r.kind).toBe('extra');
    expect(r.diff).toBe(r.determinedTotal - 110_000);
    expect(r.paidEstimated).toBe(false);
  });
  it('기납부를 비우면 간이세액 추정치를 쓰고 추정 표시', () => {
    const r = calc();
    expect(r.paidEstimated).toBe(true);
    expect(r.paidIncomeTax).toBe(1_140_240);
  });
  it('4대보험 직접 입력은 추정값을 덮어씀', () => {
    const r = calc({ paidPension: 1_000_000, paidHealth: 1_500_000 });
    expect(r.pensionDeduction).toBe(1_000_000);
    expect(r.insuranceDeduction).toBe(1_500_000);
    expect(r.insuranceEstimated).toBe(false);
    expect(calc().insuranceEstimated).toBe(true);
  });
  it('흐름 정합성: 과세표준 = 근로소득금액 - 공제들', () => {
    const r = calc();
    expect(r.taxBase).toBe(r.earnedIncome - r.personalDeduction - r.pensionDeduction - r.insuranceDeduction - r.housingDeduction - r.cardDeduction);
    expect(r.determinedTotal).toBe(r.determinedTax + r.localTax);
    expect(r.diff).toBe(r.determinedTotal - r.paidTotal);
  });
});

describe('입력 보정·예시 3건', () => {
  it('음수·NaN·인원 정합성', () => {
    const n = normalizeInput({ ...D, annualSalary: -1, dependents: 0, children: 5, seniors: 9, cardCredit: NaN });
    expect(n.annualSalary).toBe(0);
    expect(n.dependents).toBe(1);
    expect(n.children).toBe(0);
    expect(n.seniors).toBe(1);
    expect(n.cardCredit).toBe(0);
  });
  it('연봉 0이어도 NaN 없음', () => {
    const r = calc({ annualSalary: 0 });
    expect(Object.values(r).filter((v) => typeof v === 'number' && Number.isNaN(v))).toEqual([]);
  });
  it('예시 1: 연봉 3,000만, 자녀 0, 기본 카드 사용', () => {
    const r = calc({ annualSalary: 30_000_000 });
    expect([r.totalSalary, r.taxBase, r.calculatedTax, r.determinedTax, r.paidIncomeTax, r.diff]).toEqual([27_600_000, 11_823_120, 709_387, 189_220, 249_840, -66_680]);
  });
  it('예시 2: 연봉 5,000만, 자녀 2, 카드 많이', () => {
    const r = calc({ annualSalary: 50_000_000, dependents: 4, children: 2, cardCredit: 20_000_000, cardDebit: 10_000_000, cardMarket: 500_000, cardTransit: 1_200_000 });
    expect([r.taxBase, r.cardDeduction, r.calculatedTax, r.credits.child, r.determinedTax, r.diff]).toEqual([20_164_840, 4_680_000, 1_764_726, 550_000, 424_720, -772_150]);
  });
  it('예시 3: 연봉 7,000만, 연금저축 600만', () => {
    const r = calc({ annualSalary: 70_000_000, pensionSaving: 6_000_000 });
    expect([r.taxBase, r.calculatedTax, r.credits.pension, r.determinedTax, r.diff]).toEqual([46_401_440, 5_700_216, 720_000, 4_190_210, -791_940]);
  });
});
