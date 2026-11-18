/**
 * 근로자 급여 공제 요율·한도 상수.
 *
 * 기준 연도: 2026년
 *
 * 출처
 *   - 국민연금공단 (nps.or.kr) 보험료율·기준소득월액 상·하한
 *   - 국민건강보험공단 (nhis.or.kr) 건강보험료율·장기요양보험료율
 *   - 근로복지공단/고용노동부 고용보험료율
 *   - 국세청 (nts.go.kr) 근로소득 간이세액표, 소득세법 (종합소득세율, 근로소득공제, 근로소득세액공제, 자녀세액공제)
 *
 * TODO: 소득세는 간이세액표 근사식이므로 국세청 간이세액표 실제 값과 대조해 오차 확인.
 */
export const PAYROLL_BASE_YEAR = 2026;

/**
 * 국민연금: 근로자 부담분 (사업주와 절반씩, 총 9.5%).
 * 2026년부터 매년 0.5%p씩 인상되어 2033년 총 13%가 될 예정 (매년 갱신 필요).
 */
export const PENSION = {
  employeeRate: 0.0475,
  /** 기준소득월액 하한/상한 (원). 매년 7월 변동. 2026.7~2027.6 적용값 */
  baseMin: 410_000,
  baseMax: 6_590_000,
} as const;

/** 건강보험: 근로자 부담분 (직장가입자, 보험료율 총 7.19%의 절반) */
export const HEALTH = {
  employeeRate: 0.03595,
} as const;

/** 장기요양보험: 건강보험료에 곱하는 비율. 2026년 13.14% (소득 대비 0.9448%) */
export const LONG_TERM_CARE = {
  rateOnHealthPremium: 0.1314,
} as const;

/** 고용보험: 근로자 부담분 (실업급여) */
export const EMPLOYMENT = {
  employeeRate: 0.009,
} as const;

/**
 * 소득세 근사 계산용 상수 (소득세법 기준, 간이세액표의 산식을 단순화한 근사).
 * 실제 간이세액표는 월급 구간별 표 값이라 이 계산과 몇 천~수만 원 차이날 수 있다.
 */
export const INCOME_TAX = {
  /** 인적공제: 공제대상 가족 1인당 기본공제 (원/년) */
  personalDeductionPerPerson: 1_500_000,
  /** 표준세액공제 (원/년) */
  standardTaxCredit: 130_000,
  /** 종합소득세율 구간: [과세표준 상한, 세율, 누진공제액] */
  brackets: [
    { upTo: 14_000_000, rate: 0.06, deduction: 0 },
    { upTo: 50_000_000, rate: 0.15, deduction: 1_260_000 },
    { upTo: 88_000_000, rate: 0.24, deduction: 5_760_000 },
    { upTo: 150_000_000, rate: 0.35, deduction: 15_440_000 },
    { upTo: 300_000_000, rate: 0.38, deduction: 19_940_000 },
    { upTo: 500_000_000, rate: 0.4, deduction: 25_940_000 },
    { upTo: 1_000_000_000, rate: 0.42, deduction: 35_940_000 },
    { upTo: Infinity, rate: 0.45, deduction: 65_940_000 },
  ],
  /** 근로소득공제 구간: 총급여 상한, 구간 기본액, 초과분 공제율, 구간 하한 */
  earnedIncomeDeduction: [
    { upTo: 5_000_000, base: 0, rate: 0.7, from: 0 },
    { upTo: 15_000_000, base: 3_500_000, rate: 0.4, from: 5_000_000 },
    { upTo: 45_000_000, base: 7_500_000, rate: 0.15, from: 15_000_000 },
    { upTo: 100_000_000, base: 12_000_000, rate: 0.05, from: 45_000_000 },
    { upTo: Infinity, base: 14_750_000, rate: 0.02, from: 100_000_000 },
  ],
  earnedIncomeDeductionCap: 20_000_000,
  /** 근로소득세액공제: 산출세액 130만원 이하 55%, 초과분 30% */
  earnedTaxCredit: {
    threshold: 1_300_000,
    lowRate: 0.55,
    highRate: 0.3,
    highBase: 715_000,
  },
  /** 근로소득세액공제 한도 (총급여 구간별) */
  earnedTaxCreditLimit: {
    tier1Max: 33_000_000,
    tier1Limit: 740_000,
    tier2Max: 70_000_000,
    tier2Reduce: 0.008,
    tier2Min: 660_000,
    tier3Max: 120_000_000,
    tier3Base: 660_000,
    tier3Reduce: 0.5,
    tier3Min: 500_000,
    tier4Base: 500_000,
    tier4Reduce: 0.5,
    tier4Min: 200_000,
  },
  /** 자녀세액공제 (8세 이상 20세 이하 자녀 기준): 1명 25만, 2명 55만, 3명부터 1명당 +40만 */
  childCredit: { one: 250_000, two: 550_000, perExtra: 400_000 },
  /** 지방소득세: 소득세의 10% */
  localTaxRate: 0.1,
} as const;
