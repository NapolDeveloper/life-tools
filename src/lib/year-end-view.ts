import type { SettlementResult, YearEndInput } from './year-end-tax';
import { won, percent } from './format';
import { YE_BASE_YEAR, PENSION_ACCOUNT, STANDARD_CREDIT, CARD } from '../data/year-end-tax-2026';

export interface YeRowDef {
  key: string;
  label: string;
  /** 빼는 항목이면 금액 앞에 −를 붙인다 */
  minus?: boolean;
  /** 0원이면 표에서 숨긴다 */
  optional?: boolean;
}

/** 결과 표 본문 행 (표시 순서). 위에서 아래로 계산이 흘러가는 순서다. */
export const YE_ROWS: YeRowDef[] = [
  { key: 'totalSalary', label: '총급여 (연봉 − 비과세)' },
  { key: 'earnedDeduction', label: '근로소득공제', minus: true },
  { key: 'earnedIncome', label: '근로소득금액' },
  { key: 'personalDeduction', label: '인적공제', minus: true },
  { key: 'pensionDeduction', label: '국민연금 보험료 공제', minus: true },
  { key: 'insuranceDeduction', label: '건강·장기요양·고용보험료 공제', minus: true },
  { key: 'housingDeduction', label: '주택청약 소득공제', minus: true, optional: true },
  { key: 'cardDeduction', label: '신용카드 등 소득공제', minus: true, optional: true },
  { key: 'taxBase', label: '과세표준' },
  { key: 'calculatedTax', label: '산출세액' },
  { key: 'credit_earned', label: '근로소득세액공제', minus: true, optional: true },
  { key: 'credit_child', label: '자녀세액공제', minus: true, optional: true },
  { key: 'credit_birth', label: '출산·입양 세액공제', minus: true, optional: true },
  { key: 'credit_pension', label: '연금계좌 세액공제', minus: true, optional: true },
  { key: 'credit_insurance', label: '보험료 세액공제', minus: true, optional: true },
  { key: 'credit_medical', label: '의료비 세액공제', minus: true, optional: true },
  { key: 'credit_education', label: '교육비 세액공제', minus: true, optional: true },
  { key: 'credit_donation', label: '기부금 세액공제', minus: true, optional: true },
  { key: 'credit_rent', label: '월세 세액공제', minus: true, optional: true },
  { key: 'credit_marriage', label: '결혼 세액공제', minus: true, optional: true },
  { key: 'credit_standard', label: '표준세액공제', minus: true, optional: true },
  { key: 'determinedTax', label: '결정세액 (소득세)' },
  { key: 'localTax', label: '지방소득세 (결정세액의 10%)' },
];

export const YE_TOTAL_ROWS: YeRowDef[] = [
  { key: 'determinedTotal', label: '내야 할 세금 (소득세 + 지방소득세)' },
  { key: 'paidTotal', label: '이미 낸 세금 (소득세 + 지방소득세)', minus: true },
  { key: 'settlement', label: '정산 결과 (환급 −, 추가 납부 +)' },
];

export interface YearEndView {
  out: Record<string, string>;
  rows: Record<string, { amount: string; ratio: string; hidden: boolean }>;
}

const minus = (n: number): string => (n > 0 ? `−${won(n)}` : won(0));

/** 절세 힌트(정보성). 계산된 사실만 쓰고 권유·확정 표현은 쓰지 않는다. 최대 3개. */
export function hintsOf(r: SettlementResult, input: YearEndInput): string[] {
  const hints: string[] = [];
  const c = r.card;
  if (c.usage < c.minUsage) {
    hints.push(`카드 사용액이 최저사용금액 ${won(c.minUsage)}에 ${won(c.minUsage - c.usage)} 모자라서 카드 소득공제가 아직 없어요.`);
  } else if (c.deduction < c.baseLimit) {
    const room = c.baseLimit - c.deduction;
    hints.push(`카드 소득공제는 ${won(c.deduction)}이고 기본한도 ${won(c.baseLimit)}까지 ${won(room)} 남았어요. 체크카드·현금영수증(공제율 ${CARD.rates.debit * 100}%)으로 채운다면 사용액 ${won(Math.ceil(room / CARD.rates.debit))}에 해당해요.`);
  } else {
    hints.push(`카드 소득공제가 기본한도 ${won(c.baseLimit)}에 닿았어요. 기본한도 안에서는 더 써도 공제액이 늘지 않아요.`);
  }
  const room = Math.max(0, PENSION_ACCOUNT.totalLimit - r.pensionEligible);
  const rate = r.totalSalary <= PENSION_ACCOUNT.rateBoundarySalary ? PENSION_ACCOUNT.rateLow : PENSION_ACCOUNT.rateHigh;
  if (room > 0) {
    hints.push(`연금저축·IRP 세액공제 대상 납입 한도(합산 ${won(PENSION_ACCOUNT.totalLimit)}, 연금저축은 ${won(PENSION_ACCOUNT.savingLimit)})까지 ${won(room)} 남았어요. 지금 공제율은 ${rate * 100}%예요.`);
  } else {
    hints.push(`연금저축·IRP 납입이 세액공제 대상 한도 ${won(PENSION_ACCOUNT.totalLimit)}에 닿았어요.`);
  }
  const medTotal = input.medicalSelf + input.medicalOther;
  if (medTotal > 0 && r.medicalEligible === 0) {
    hints.push(`의료비는 총급여의 3%(${won(r.medicalThreshold)})를 넘는 부분만 공제돼요. 지금은 문턱까지 ${won(Math.max(0, r.medicalThreshold - medTotal))} 남았어요.`);
  } else if (r.usedStandard) {
    hints.push(`보험료·의료비·교육비·기부금·월세 세액공제를 더한 값이 표준세액공제 ${won(STANDARD_CREDIT)}보다 커지면 항목별 공제로 자동 계산돼요. 지금 항목별 합계는 ${won(r.itemizedCreditSum)}이에요.`);
  }
  return hints.slice(0, 3);
}

/** 계산 결과를 화면 문자열로 바꾼다. 서버 렌더링(기본값)과 브라우저 갱신이 같은 함수를 쓴다. */
export function viewOf(r: SettlementResult, input: YearEndInput): YearEndView {
  const raw: Record<string, number> = {
    totalSalary: r.totalSalary,
    earnedDeduction: r.earnedDeduction,
    earnedIncome: r.earnedIncome,
    personalDeduction: r.personalDeduction,
    pensionDeduction: r.pensionDeduction,
    insuranceDeduction: r.insuranceDeduction,
    housingDeduction: r.housingDeduction,
    cardDeduction: r.cardDeduction,
    taxBase: r.taxBase,
    calculatedTax: r.calculatedTax,
    determinedTax: r.determinedTax,
    localTax: r.localTax,
    determinedTotal: r.determinedTotal,
    paidTotal: r.paidTotal,
    settlement: r.diff,
  };
  for (const [k, v] of Object.entries(r.credits)) raw[`credit_${k}`] = v;

  const rows: YearEndView['rows'] = {};
  for (const def of [...YE_ROWS, ...YE_TOTAL_ROWS]) {
    const v = raw[def.key];
    let amount: string;
    if (def.key === 'settlement') amount = v === 0 ? won(0) : `${v < 0 ? '−' : '+'}${won(Math.abs(v))}`;
    else amount = def.minus ? minus(v) : won(v);
    rows[def.key] = {
      amount,
      ratio: percent(Math.abs(v), r.totalSalary),
      hidden: def.optional === true && v === 0,
    };
  }

  const c = r.card;
  const heroLabel = r.kind === 'refund' ? '예상 환급액' : r.kind === 'extra' ? '예상 추가 납부액' : '예상 정산 차액';
  const badge = r.kind === 'refund' ? '환급 예상' : r.kind === 'extra' ? '추가 납부 예상' : '차액 없음';
  const cardNote =
    c.usage < c.minUsage
      ? '카드 사용액이 최저사용금액보다 적어서 공제가 없어요.'
      : c.deduction < c.beforeLimit
        ? '한도를 넘은 금액은 공제되지 않아요.'
        : '한도 안에서 모두 공제돼요.';
  const pathNote = r.usedStandard
    ? `표준세액공제 ${won(STANDARD_CREDIT)}이 항목별 공제보다 유리해서 이 방식으로 계산했어요. (항목별 공제 방식의 결정세액은 ${won(r.pathTax.itemized)}, 표준세액공제 방식은 ${won(r.pathTax.standard)})`
    : `보험료·의료비·교육비·기부금·월세 같은 항목별 공제가 표준세액공제 ${won(STANDARD_CREDIT)}보다 유리해서 이 방식으로 계산했어요. (항목별 ${won(r.pathTax.itemized)}, 표준세액공제 방식 ${won(r.pathTax.standard)})`;
  const hints = hintsOf(r, input);

  return {
    out: {
      heroLabel,
      diffAbs: won(Math.abs(r.diff)),
      stickyLabel: heroLabel,
      badge,
      heroCaption: `${YE_BASE_YEAR}년 귀속 · ${r.usedStandard ? '표준세액공제' : '항목별 공제'} 적용`,
      determinedTotal: won(r.determinedTotal),
      paidTotal: won(r.paidTotal),
      tableCaption: `연간 기준, 총급여 ${won(r.totalSalary)} 대비 비율 (${YE_BASE_YEAR}년 귀속)`,
      pathNote,
      cardUsage: won(c.usage),
      cardMin: won(c.minUsage),
      cardCredit: won(c.deductions.credit),
      cardDebit: won(c.deductions.debit),
      cardCulture: won(c.deductions.culture),
      cardMarketTransit: won(c.deductions.marketTransit),
      cardBefore: won(c.beforeLimit),
      cardBase: won(c.baseLimit),
      cardExtra: won(c.extraLimit),
      cardFinal: won(c.deduction),
      cardNote,
      hint1: hints[0] ?? '',
      hint2: hints[1] ?? '',
      hint3: hints[2] ?? '',
    },
    rows,
  };
}
