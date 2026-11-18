import { describe, it, expect } from 'vitest';
import { parseYearEndQuery, toYearEndQuery, validateYearEnd, YEAR_END_DEFAULTS as D } from './year-end-query';

describe('공유 링크 쿼리', () => {
  it('기본값이면 빈 문자열', () => expect(toYearEndQuery(D)).toBe(''));
  it('왕복 변환', () => {
    const input = { ...D, annualSalary: 55_000_000, dependents: 4, children: 2, paidIncomeTax: 0, pensionSaving: 3_000_000, married: true, birthOrder: 2 };
    expect(parseYearEndQuery(toYearEndQuery(input))).toEqual(input);
  });
  it('null(추정)은 쿼리에 담지 않음', () => expect(toYearEndQuery({ ...D, annualSalary: 1 })).toBe('?s=1'));
  it('잘못된 값은 기본값, 인원 정합성 보정', () => {
    const r = parseYearEndQuery('?s=abc&dp=2&ch=5&yc=3&sr=9');
    expect(r.annualSalary).toBe(D.annualSalary);
    expect(r.children).toBe(1);
    expect(r.youngChildren).toBe(0);
    expect(r.seniors).toBe(2);
  });
  it('식별 정보가 될 만한 키는 없음(숫자만)', () => expect(parseYearEndQuery('?name=hong&s=30000000').annualSalary).toBe(30_000_000));
  it('검증 메시지', () => {
    expect(validateYearEnd({ ...D, annualSalary: 0 })).toBe('연봉을 입력해 주세요.');
    expect(validateYearEnd({ ...D, annualSalary: 20_000_000_000 })).toMatch(/100억/);
    expect(validateYearEnd(D)).toBeNull();
  });
});
