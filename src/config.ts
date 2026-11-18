/** 사이트 전역 상수. 이름·도메인·이메일은 확정 후 여기만 바꾸면 된다. (빌드 환경 분기는 src/lib/env.ts) */
export const SITE_NAME = '돈셈';
export const SITE_NAME_EN = 'donsem';
export const SITE_TAGLINE = '급여·세금·노동 계산을 쉽게, 돈셈';
export const SITE_URL = 'https://example.com'; // TODO: 도메인 구매 후 교체 (플레이스홀더, donsem.com 1순위)
export const CONTACT_EMAIL = 'contact@example.com'; // TODO: 실제 문의 이메일로 교체 (플레이스홀더)
export const LAST_UPDATED = '2026-11-18'; // 정책 페이지·소개 페이지 시행/수정일

/**
 * 검색엔진 소유확인 메타 태그 값. 값이 있을 때만 <meta>를 출력한다 (common-01 §7).
 * 구글 Search Console / 네이버 서치어드바이저 / 빙 웹마스터 도구에서 발급받아 채운다.
 */
export const VERIFICATION = {
  google: '',
  naver: '',
  bing: '',
} as const;

/** GA4 측정 ID (G-XXXXXXXXXX). 비어 있으면 운영 빌드에서도 로드하지 않는다. 미리보기에서는 항상 로드하지 않는다. */
export const GA4_ID = '';

export type CategorySlug = 'pay' | 'tax' | 'work';

export interface Category {
  slug: CategorySlug;
  /** 내비·Breadcrumb에 쓰는 짧은 이름 */
  name: string;
  /** 허브 페이지 title (브랜드 제외) */
  title: string;
  /** 허브 페이지 description (80~120자) */
  description: string;
  /** 아직 만들지 않은 계산기 이름 (허브에 텍스트로만 표시) */
  planned: string[];
}

export const CATEGORIES: Category[] = [
  {
    slug: 'pay',
    name: '급여',
    title: '급여 계산기 모음',
    description:
      '연봉 실수령액, 시급과 주휴수당처럼 월급과 관련된 계산을 모았어요. 4대보험과 소득세를 뺀 실제 통장 금액을 바로 확인해 보세요.',
    planned: ['시급·주휴수당 계산기', '4대보험 계산기'],
  },
  {
    slug: 'tax',
    name: '세금',
    title: '세금 계산기 모음',
    description:
      '연말정산, 종합소득세, 퇴직소득세처럼 해마다 헷갈리는 세금 계산을 쉬운 말로 풀어 드려요. 준비되는 대로 계산기를 하나씩 더할게요.',
    planned: ['연말정산 계산기', '종합소득세 계산기', '퇴직소득세 계산기'],
  },
  {
    slug: 'work',
    name: '노동·고용',
    title: '노동·고용 계산기 모음',
    description:
      '퇴직금, 실업급여, 연차처럼 일하는 사람의 권리와 관련된 계산을 모아 둘 곳이에요. 법령 기준을 확인한 계산기부터 차례로 공개해요.',
    planned: ['퇴직금 계산기', '실업급여 계산기', '연차 계산기'],
  },
];

export interface Tool {
  slug: string;
  name: string;
  category: CategorySlug;
  /** 카드·RSS에 쓰는 한두 문장 설명 */
  description: string;
  /** 최초 공개일 (RSS pubDate) */
  published: string;
  /** 최종 갱신일 (sitemap lastmod, 페이지 표시) */
  updated: string;
}

/** 도구 목록. 새 계산기를 추가하면 여기에 추가하고, src/lib/pages.ts의 OG 정보도 함께 추가한다. */
export const TOOLS: Tool[] = [
  {
    slug: 'salary',
    name: '연봉 실수령액 계산기',
    category: 'pay',
    description: '연봉을 넣으면 4대보험과 소득세를 뺀 월 실수령액을 알려드려요.',
    published: '2026-11-18',
    updated: '2026-11-18',
  },
];

export const getCategory = (slug: CategorySlug): Category => CATEGORIES.find((c) => c.slug === slug)!;
export const toolsOf = (slug: CategorySlug): Tool[] => TOOLS.filter((t) => t.category === slug);
