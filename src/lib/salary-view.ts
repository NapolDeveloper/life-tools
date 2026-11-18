import type { SalaryResult } from './salary';
import { won, percent } from './format';
import { PAYROLL_BASE_YEAR } from '../data/payroll';

/** 결과 표에 나오는 공제 항목 (표시 순서). */
export const DEDUCTION_ROWS = [
  { key: 'pension', label: '국민연금' },
  { key: 'health', label: '건강보험' },
  { key: 'longTermCare', label: '장기요양보험' },
  { key: 'employment', label: '고용보험' },
  { key: 'incomeTax', label: '소득세' },
  { key: 'localTax', label: '지방소득세' },
] as const;

export const TOTAL_ROWS = [
  { key: 'monthlyDeductionTotal', label: '공제 합계' },
  { key: 'monthlyNet', label: '월 실수령액' },
] as const;

export interface SalaryView {
  /** data-out 속성 이름 -> 표시 문자열 */
  out: Record<string, string>;
  /** 표 행 key -> 금액·비율 */
  rows: Record<string, { amount: string; ratio: string }>;
}

/** 계산 결과를 화면 문자열로 바꾼다. 서버 렌더링(기본값)과 브라우저 갱신이 같은 함수를 쓴다. */
export function viewOf(r: SalaryResult): SalaryView {
  const rows: SalaryView['rows'] = {};
  for (const { key } of [...DEDUCTION_ROWS, ...TOTAL_ROWS]) {
    const v = r[key];
    rows[key] = { amount: won(v), ratio: percent(v, r.monthlyGross) };
  }
  return {
    out: {
      monthlyNet: won(r.monthlyNet),
      annualNet: won(r.annualNet),
      monthlyDeductionTotal: won(r.monthlyDeductionTotal),
      heroCaption: `세전 월급 ${won(r.monthlyGross)} · 비과세 ${won(r.monthlyNonTaxable)} 기준`,
      tableCaption: `월 기준, 세전 월급 ${won(r.monthlyGross)} 대비 비율 (${PAYROLL_BASE_YEAR}년 기준)`,
    },
    rows,
  };
}
