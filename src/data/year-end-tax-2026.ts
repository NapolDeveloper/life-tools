/**
 * 연말정산(2026년 귀속, 2027년 1~2월 정산) 기준값.
 *
 * 값마다 주석 형식:  기준 연도 / 근거 조문 / 출처 URL / 확인일 / verified
 *   - verified: 'confirmed'  = 정책브리핑(정부 공식)에서 직접 확인한 값
 *   - verified: 'needs-check' = 기존 연도 기준값이거나 법령 원문 대조가 아직 안 된 값 (docs/verification/year-end-tax.md 에 목록화)
 * 근로소득공제·기본세율·근로소득세액공제·4대보험 요율은 기존 payroll.ts 값을 그대로 쓴다(여기서 다시 정의하지 않음).
 */

export const YE_BASE_YEAR = 2026;
/** 확인일 (메인 세션이 정책브리핑 등으로 [확인]한 날) */
export const YE_AS_OF = '2026-11-18';

export type Verified = 'confirmed' | 'needs-check';

const LAW_INCOME = 'https://www.law.go.kr/%EB%B2%95%EB%A0%B9/%EC%86%8C%EB%93%9D%EC%84%B8%EB%B2%95';
const LAW_SPECIAL = 'https://www.law.go.kr/%EB%B2%95%EB%A0%B9/%EC%A1%B0%EC%84%B8%ED%8A%B9%EB%A1%80%EC%A0%9C%ED%95%9C%EB%B2%95';
const NTS_GUIDE = 'https://www.nts.go.kr/nts/cm/cntnts/cntntsView.do?mi=2304&cntntsId=238938';
const KOREA_KR_1 = 'https://www.korea.kr/news/policyNewsView.do?newsId=148953499';
const KOREA_KR_2 = 'https://www.korea.kr/news/policyNewsView.do?newsId=148957544';

/** 페이지 '계산 방식'에 노출하는 출처 (공공기관 원문만) */
export const YE_SOURCES = [
  { org: '국가법령정보센터', name: '소득세법', url: LAW_INCOME, note: '공제·세율·세액공제' },
  { org: '국가법령정보센터', name: '조세특례제한법', url: LAW_SPECIAL, note: '카드 소득공제·월세·결혼세액공제' },
  { org: '국세청', name: '연말정산 종합안내', url: NTS_GUIDE, note: '공제 항목과 계산 방식' },
  { org: '정책브리핑', name: '2025 세법개정안 확정 (2025-10-30)', url: KOREA_KR_1, note: '카드 소득공제 한도 상향 등' },
  { org: '정책브리핑', name: '2026년부터 달라지는 세법 (2026-01-06)', url: KOREA_KR_2, note: '초등 예체능 학원비·월세 주말부부 등' },
] as const;

/** 인적공제 (소득세법 §50·§51). 2026 귀속 / 확인일 2026-11-18 / needs-check */
export const PERSONAL = {
  basicPerPerson: 1_500_000,
  /** 70세 이상 추가공제 (1인) */
  seniorExtra: 1_000_000,
  /** 장애인 추가공제 (1인) */
  disabledExtra: 2_000_000,
} as const;

/**
 * 신용카드 등 소득공제 (조세특례제한법 §126의2).
 * 최저사용금액·공제율·추가한도: needs-check. 기본한도: confirmed (정책브리핑 2025-10-30, 2026-01-06, 2028.12.31까지).
 */
export const CARD = {
  minUsageRate: 0.25,
  rates: { credit: 0.15, debit: 0.3, culture: 0.3, market: 0.4, transit: 0.4 },
  /** 문화(도서·공연·박물관·미술관·영화·수영장·체력단련장) 30%는 총급여 7,000만 이하만 */
  cultureMaxSalary: 70_000_000,
  /** 기본한도 구분 총급여 */
  limitSalaryBoundary: 70_000_000,
  /** 기본한도: 총급여 7,000만 이하 300만, 초과 250만 (confirmed) */
  baseLimitLow: 3_000_000,
  baseLimitHigh: 2_500_000,
  /** 자녀 1인당 가산 (2026~2028 귀속, confirmed). 7,000만 이하 +50만(최대 +100만), 초과 +25만(최대 +50만) */
  childAddLow: 500_000,
  childAddLowMax: 1_000_000,
  childAddHigh: 250_000,
  childAddHighMax: 500_000,
  /** 추가한도 (needs-check): 7,000만 이하 전통시장·대중교통·문화 합산 300만 / 초과 전통시장·대중교통 합산 200만 */
  extraLimitLow: 3_000_000,
  extraLimitHigh: 2_000_000,
} as const;

/** 주택청약종합저축 소득공제 (조특법 §87). needs-check. 총급여 7,000만 이하 무주택 세대주, 납입 연 300만 한도 × 40% */
export const HOUSING_SUBSCRIPTION = { maxSalary: 70_000_000, maxPaid: 3_000_000, rate: 0.4 } as const;

/** 자녀세액공제 (소득세법 §59의2). 금액 confirmed(2025년 귀속부터 상향). 나이 기준(2026 귀속 만 9세 이상)은 needs-check */
export const CHILD_CREDIT = {
  one: 250_000,
  two: 550_000,
  /** 3명째부터 1명당 */
  perExtra: 400_000,
  minAge: 9,
  /** 출산·입양 공제: 첫째 / 둘째 / 셋째 이상 (needs-check) */
  birth: { first: 300_000, second: 500_000, third: 700_000 },
} as const;

/** 연금계좌 세액공제 (소득세법 §59의3). needs-check */
export const PENSION_ACCOUNT = {
  savingLimit: 6_000_000,
  totalLimit: 9_000_000,
  rateLow: 0.15,
  rateHigh: 0.12,
  /** 총급여 5,500만 이하 15% */
  rateBoundarySalary: 55_000_000,
} as const;

/** 특별세액공제 (소득세법 §59의4). needs-check. 초등 1~2학년 예체능·대학생 소득요건 폐지는 confirmed(정책브리핑 2026-01-06) */
export const SPECIAL_CREDIT = {
  insuranceLimit: 1_000_000,
  insuranceRate: 0.12,
  medicalThresholdRate: 0.03,
  medicalOtherLimit: 7_000_000,
  medicalRate: 0.15,
  educationRate: 0.15,
  educationPerChildLimit: 3_000_000,
  educationPerUnivLimit: 9_000_000,
  donationRate: 0.15,
  donationHighRate: 0.3,
  donationHighBoundary: 10_000_000,
} as const;

/** 월세 세액공제 (조특법 §95의2). needs-check. 주말부부 각각 공제는 confirmed(정책브리핑 2026-01-06) */
export const RENT_CREDIT = {
  maxSalary: 80_000_000,
  rateBoundarySalary: 55_000_000,
  rateLow: 0.17,
  rateHigh: 0.15,
  maxRent: 10_000_000,
} as const;

/** 결혼세액공제 (조특법 §92의3). 2024~2026년 혼인신고 1회. needs-check */
export const MARRIAGE_CREDIT = 500_000;

/** 표준세액공제 (소득세법 §59의4⑨). needs-check. payroll.ts INCOME_TAX.standardTaxCredit 와 같은 값 */
export const STANDARD_CREDIT = 130_000;

export interface VerificationItem {
  item: string;
  value: string;
  basis: string;
  url: string;
  verified: Verified;
  /** 대조 방법 */
  how: string;
}

/** docs/verification/year-end-tax.md '검증 필요' 표와 같은 내용. 페이지에는 노출하지 않는다. */
export const YE_VERIFICATION: VerificationItem[] = [
  { item: '근로소득공제 구간·한도', value: '70%/350만+40%/750만+15%/1,200만+5%/1,475만+2%, 한도 2,000만', basis: '소득세법 §47', url: LAW_INCOME, verified: 'needs-check', how: '법령 원문 §47 대조 (payroll.ts 재사용)' },
  { item: '기본세율 구간', value: '6~45% 8구간', basis: '소득세법 §55', url: LAW_INCOME, verified: 'needs-check', how: '법령 원문 §55 대조 (payroll.ts 재사용)' },
  { item: '인적공제 기본·추가', value: '1인 150만, 70세 이상 +100만, 장애인 +200만', basis: '소득세법 §50·§51', url: LAW_INCOME, verified: 'needs-check', how: '법령 원문 §50·§51 대조' },
  { item: '카드 최저사용금액', value: '총급여 × 25%', basis: '조특법 §126의2', url: LAW_SPECIAL, verified: 'needs-check', how: '법령 원문 + 국세청 연말정산 종합안내' },
  { item: '카드 공제율', value: '신용 15% / 체크·현금영수증 30% / 문화 30%(총급여 7,000만 이하) / 전통시장·대중교통 40%', basis: '조특법 §126의2', url: LAW_SPECIAL, verified: 'needs-check', how: '법령 원문 대조, 7,000만 초과 문화 지출 처리(신용카드로 합산) 국세청 확인' },
  { item: '카드 최저사용금액 차감 순서', value: '신용 → 체크·현금 → 문화 → 전통시장·대중교통', basis: '조특법 §126의2, 시행령', url: NTS_GUIDE, verified: 'needs-check', how: '국세청 연말정산 종합안내 계산 방식 대조' },
  { item: '카드 기본한도', value: '7,000만 이하 300만(+자녀 1인 50만, 최대 +100만) / 초과 250만(+25만, 최대 +50만)', basis: '조특법 §126의2 (2025 개정, 2028.12.31까지)', url: KOREA_KR_2, verified: 'confirmed', how: '정책브리핑 2025-10-30, 2026-01-06 (확인일 2026-11-18)' },
  { item: '카드 추가한도', value: '7,000만 이하 전통시장·대중교통·문화 300만 / 초과 전통시장·대중교통 200만', basis: '조특법 §126의2', url: LAW_SPECIAL, verified: 'needs-check', how: '법령 원문 대조' },
  { item: '주택청약 소득공제', value: '총급여 7,000만 이하, 연 300만 × 40%', basis: '조특법 §87', url: LAW_SPECIAL, verified: 'needs-check', how: '법령 원문 + 무주택 세대주 요건 안내 문구 확인' },
  { item: '근로소득세액공제·한도', value: '130만 이하 55%, 초과 71.5만+30%, 한도 74만/66만/50만/20만', basis: '소득세법 §59', url: LAW_INCOME, verified: 'needs-check', how: '법령 원문 §59 대조 (salary.ts 재사용)' },
  { item: '자녀세액공제 금액', value: '1명 25만, 2명 55만, 3명 이상 55만+초과 1인 40만', basis: '소득세법 §59의2 (2025 귀속부터)', url: KOREA_KR_1, verified: 'confirmed', how: '정책브리핑 2025-10-30 (확인일 2026-11-18)' },
  { item: '자녀세액공제 나이 기준', value: '2026 귀속 만 9세 이상 ~ 20세 이하 (2017년생 처리 포함)', basis: '소득세법 §59의2 부칙 경과규정', url: LAW_INCOME, verified: 'needs-check', how: '부칙 경과규정 원문 대조' },
  { item: '출산·입양 공제', value: '첫째 30만 / 둘째 50만 / 셋째 이상 70만', basis: '소득세법 §59의2③', url: LAW_INCOME, verified: 'needs-check', how: '법령 원문 대조' },
  { item: '연금계좌 한도·공제율', value: '연금저축 600만, 합산 900만, 15% (총급여 5,500만 초과 12%)', basis: '소득세법 §59의3', url: LAW_INCOME, verified: 'needs-check', how: '법령 원문 대조 (종합소득 4,500만 기준을 근로소득만이면 총급여 5,500만으로 환산)' },
  { item: '보험료 세액공제', value: '보장성 보험 12%, 100만 한도', basis: '소득세법 §59의4①', url: LAW_INCOME, verified: 'needs-check', how: '법령 원문 대조' },
  { item: '의료비 세액공제', value: '총급여 3% 초과분 15%, 그 외 가족 700만 한도, 3% 미달액은 그 외 가족분에서 먼저 차감', basis: '소득세법 §59의4②', url: LAW_INCOME, verified: 'needs-check', how: '법령 원문 + 국세청 계산 방식(미달액 차감 순서) 대조' },
  { item: '교육비 세액공제', value: '15%, 취학 전·초중고 1인 300만, 대학 1인 900만, 본인 한도 없음', basis: '소득세법 §59의4③', url: LAW_INCOME, verified: 'needs-check', how: '법령 원문 대조' },
  { item: '교육비 2026 변경', value: '초등 1~2학년 예체능 학원비 포함, 대학생 자녀 소득요건 폐지', basis: '소득세법 시행령 (2026 개정)', url: KOREA_KR_2, verified: 'confirmed', how: '정책브리핑 2026-01-06 (확인일 2026-11-18)' },
  { item: '기부금 세액공제', value: '1,000만 이하 15%, 초과분 30%', basis: '소득세법 §59의4④', url: LAW_INCOME, verified: 'needs-check', how: '법령 원문 대조 (고향사랑·정치자금 특례, 소득금액 한도는 범위 밖)' },
  { item: '월세 세액공제', value: '총급여 8,000만 이하, 5,500만 이하 17%·초과 15%, 연 1,000만 한도', basis: '조특법 §95의2', url: LAW_SPECIAL, verified: 'needs-check', how: '법령 원문 대조' },
  { item: '월세 주말부부 각각 공제', value: '부부 합산 1,000만 한도', basis: '조특법 §95의2 (2026 개정)', url: KOREA_KR_2, verified: 'confirmed', how: '정책브리핑 2026-01-06 (확인일 2026-11-18), FAQ 안내만' },
  { item: '결혼세액공제', value: '2024~2026 혼인신고 시 1회 50만', basis: '조특법 §92의3', url: LAW_SPECIAL, verified: 'needs-check', how: '법령 원문 대조' },
  { item: '표준세액공제', value: '13만 (항목별 공제와 비교해 유리한 쪽 자동 선택)', basis: '소득세법 §59의4⑨', url: LAW_INCOME, verified: 'needs-check', how: '법령 원문 대조, 사회보험료·주택청약 공제는 표준세액공제와 함께 적용되는지 국세청 확인' },
  { item: '결정세액·지방소득세 절사', value: '결정세액 10원 미만 절사, 지방소득세 = 결정세액 × 10% 10원 미만 절사', basis: '지방세법 §92 등', url: LAW_INCOME, verified: 'needs-check', how: '홈택스 미리보기 결과와 대조' },
];
