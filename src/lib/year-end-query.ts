import type { YearEndInput } from './year-end-tax';

/** 계산기 기본값 (가장 흔한 값). 결과는 빌드 시 HTML에 미리 렌더링된다. */
export const YEAR_END_DEFAULTS: YearEndInput = {
  annualSalary: 40_000_000,
  monthlyNonTaxable: 200_000,
  dependents: 1,
  seniors: 0,
  disabled: 0,
  children: 0,
  youngChildren: 0,
  birthOrder: 0,
  paidIncomeTax: null,
  paidPension: null,
  paidHealth: null,
  cardCredit: 12_000_000,
  cardDebit: 4_000_000,
  cardCulture: 0,
  cardMarket: 0,
  cardTransit: 600_000,
  medicalSelf: 0,
  medicalOther: 0,
  eduSelf: 0,
  eduKids: 0,
  eduKidsCount: 0,
  eduUniv: 0,
  eduUnivCount: 0,
  insurance: 0,
  donation: 0,
  pensionSaving: 0,
  irp: 0,
  housingSubscription: 0,
  rent: 0,
  married: false,
};

export const YEAR_END_LIMITS = { maxAnnual: 10_000_000_000, maxCount: 20 } as const;

/** 공유 링크 쿼리 키 (짧게). 숫자만 담고 식별 정보는 담지 않는다. */
export const QUERY_KEYS: Record<keyof YearEndInput, string> = {
  annualSalary: 's',
  monthlyNonTaxable: 'nt',
  dependents: 'dp',
  seniors: 'sr',
  disabled: 'ds',
  children: 'ch',
  youngChildren: 'yc',
  birthOrder: 'bo',
  paidIncomeTax: 'pt',
  paidPension: 'pp',
  paidHealth: 'ph',
  cardCredit: 'cc',
  cardDebit: 'cd',
  cardCulture: 'cu',
  cardMarket: 'cm',
  cardTransit: 'ct',
  medicalSelf: 'm1',
  medicalOther: 'm2',
  eduSelf: 'e0',
  eduKids: 'e1',
  eduKidsCount: 'e1n',
  eduUniv: 'e2',
  eduUnivCount: 'e2n',
  insurance: 'in',
  donation: 'dn',
  pensionSaving: 'ps',
  irp: 'ir',
  housingSubscription: 'hs',
  rent: 'rt',
  married: 'mr',
};

const FIELDS = Object.keys(QUERY_KEYS) as (keyof YearEndInput)[];

/** 공유 링크 쿼리 -> 입력값. 잘못된 값은 기본값으로 대체한다. */
export function parseYearEndQuery(search: string): YearEndInput {
  const params = new URLSearchParams(search);
  const out: Record<string, number | boolean | null> = { ...YEAR_END_DEFAULTS };
  for (const k of FIELDS) {
    const raw = params.get(QUERY_KEYS[k]);
    if (k === 'married') {
      if (raw === '1') out.married = true;
      continue;
    }
    if (raw === null || !/^\d{1,12}$/.test(raw)) continue;
    out[k] = Number(raw);
  }
  const o = out as unknown as YearEndInput;
  o.dependents = Math.min(Math.max(1, o.dependents), YEAR_END_LIMITS.maxCount);
  o.birthOrder = Math.min(o.birthOrder, 3);
  o.seniors = Math.min(o.seniors, o.dependents);
  o.disabled = Math.min(o.disabled, o.dependents);
  o.children = Math.min(o.children, o.dependents - 1);
  o.youngChildren = Math.min(o.youngChildren, o.dependents - 1 - o.children);
  o.eduKidsCount = Math.min(o.eduKidsCount, YEAR_END_LIMITS.maxCount);
  o.eduUnivCount = Math.min(o.eduUnivCount, YEAR_END_LIMITS.maxCount);
  return o;
}

/** 입력값 -> 공유 링크 쿼리. 기본값과 같으면 빈 문자열, 다른 값만 담는다(null은 생략). */
export function toYearEndQuery(input: YearEndInput): string {
  const p = new URLSearchParams();
  for (const k of FIELDS) {
    const v = input[k];
    if (v === YEAR_END_DEFAULTS[k] || v === null) continue;
    p.set(QUERY_KEYS[k], typeof v === 'boolean' ? '1' : String(Math.floor(v)));
  }
  const s = p.toString();
  return s ? `?${s}` : '';
}

/** 오류 메시지. 문제가 없으면 null. */
export function validateYearEnd(input: YearEndInput): string | null {
  if (!(input.annualSalary > 0)) return input.annualSalary === 0 ? '연봉을 입력해 주세요.' : '연봉은 0보다 커야 해요.';
  if (input.annualSalary > YEAR_END_LIMITS.maxAnnual) return '연봉은 100억 원 이하로 입력해 주세요.';
  return null;
}
