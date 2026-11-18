import type { SalaryInput } from './salary';

/** 계산기 기본값 (가장 흔한 값). 결과는 빌드 시 HTML에 미리 렌더링된다. */
export const SALARY_DEFAULTS: SalaryInput = {
  annualSalary: 40_000_000,
  monthlyNonTaxable: 200_000,
  dependents: 1,
  children: 0,
};

export const SALARY_LIMITS = {
  maxAnnual: 10_000_000_000,
  maxDependents: 20,
} as const;

const KEYS = { salary: 'annualSalary', nontax: 'monthlyNonTaxable', deps: 'dependents', kids: 'children' } as const;

/** 공유 링크 쿼리 -> 입력값. 잘못된 값은 기본값으로 대체한다. 식별 정보는 다루지 않는다(숫자만). */
export function parseSalaryQuery(search: string): SalaryInput {
  const params = new URLSearchParams(search);
  const out: SalaryInput = { ...SALARY_DEFAULTS };
  for (const [q, field] of Object.entries(KEYS) as [keyof typeof KEYS, keyof SalaryInput][]) {
    const raw = params.get(q);
    if (raw === null || !/^\d{1,12}$/.test(raw)) continue;
    out[field] = Number(raw);
  }
  out.dependents = Math.min(Math.max(1, out.dependents), SALARY_LIMITS.maxDependents);
  out.children = Math.min(out.children, out.dependents - 1);
  return out;
}

/** 입력값 -> 공유 링크 쿼리 ("?salary=..."). 기본값과 같으면 빈 문자열. */
export function toSalaryQuery(input: SalaryInput): string {
  const same = (Object.keys(SALARY_DEFAULTS) as (keyof SalaryInput)[]).every((k) => SALARY_DEFAULTS[k] === input[k]);
  if (same) return '';
  const p = new URLSearchParams();
  for (const [q, field] of Object.entries(KEYS)) p.set(q, String(Math.floor(input[field as keyof SalaryInput])));
  return `?${p.toString()}`;
}

/** 오류 메시지. 문제가 없으면 null. */
export function validateSalary(input: SalaryInput): string | null {
  if (!(input.annualSalary > 0)) return input.annualSalary === 0 ? '연봉을 입력해 주세요.' : '연봉은 0보다 커야 해요.';
  if (input.annualSalary > SALARY_LIMITS.maxAnnual) return '연봉은 100억 원 이하로 입력해 주세요.';
  return null;
}
