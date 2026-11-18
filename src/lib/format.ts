/** 숫자 표시 유틸 (서버 렌더링·브라우저 공용). */

export const num = (n: number): string => Math.round(n).toLocaleString('ko-KR');

/** 2,924,353원 */
export const won = (n: number): string => `${num(n)}원`;

/** 비율을 소수 1자리 퍼센트로. 분모가 0이면 "-" */
export const percent = (part: number, whole: number): string =>
  whole > 0 ? `${((part / whole) * 100).toFixed(1)}%` : '-';

/**
 * 한글 읽기. 40,000,000 -> "4,000만 원", 1,234,567 -> "123만 4,567원", 120,000,000 -> "1억 2,000만 원"
 * compact=true면 "원" 앞 공백을 없앤다("4,000만원").
 */
export function koreanAmount(value: number, compact = false): string {
  const n = Math.floor(value);
  if (!Number.isFinite(n) || n <= 0) return '0원';
  const eok = Math.floor(n / 100_000_000);
  const man = Math.floor((n % 100_000_000) / 10_000);
  const rest = n % 10_000;
  const parts: string[] = [];
  if (eok) parts.push(`${eok.toLocaleString('ko-KR')}억`);
  if (man) parts.push(`${man.toLocaleString('ko-KR')}만`);
  if (rest) parts.push(rest.toLocaleString('ko-KR'));
  const unit = rest ? '원' : compact ? '원' : ' 원';
  return `${parts.join(' ')}${unit}`;
}

/** 문자열에서 숫자만 뽑아 정수로. 비었으면 0. 12자리까지만 인정. */
export function parseDigits(text: string): number {
  const digits = text.replace(/\D/g, '').slice(0, 12);
  return digits ? Number(digits) : 0;
}
