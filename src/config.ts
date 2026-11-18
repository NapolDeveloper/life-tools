/** 사이트 전역 상수. 이름·도메인·이메일은 확정 후 여기만 바꾸면 된다. */
export const SITE_NAME = '생활계산소'; // TODO: 임시 이름
export const SITE_TAGLINE = '월급·세금·생활 숫자를 쉽게 계산하는 무료 도구 모음';
export const SITE_URL = 'https://example.com'; // TODO: 실제 도메인 확정 후 교체 (플레이스홀더)
export const CONTACT_EMAIL = 'contact@example.com'; // TODO: 실제 문의 이메일로 교체 (플레이스홀더)
export const LAST_UPDATED = '2026-11-18'; // 정책 페이지 시행·수정일

export interface Tool {
  slug: string;
  name: string;
  description: string;
}

/** 도구 목록. 새 계산기를 추가하면 여기에 한 줄 추가. */
export const TOOLS: Tool[] = [
  {
    slug: 'salary',
    name: '연봉 실수령액 계산기',
    description: '연봉과 비과세액, 부양가족 수를 넣으면 4대보험·소득세를 뺀 월 실수령액을 알려줘요.',
  },
];
