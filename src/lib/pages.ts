import { CATEGORIES, TOOLS, LAST_UPDATED, SITE_NAME } from '../config';

/** 색인 대상 페이지 목록. OG 이미지·sitemap lastmod의 기준이다. 새 페이지를 만들면 여기에 추가한다. */
export interface PageMeta {
  path: string;
  /** OG 이미지 파일 이름 (/og/{slug}.png) */
  ogSlug: string;
  ogTitle: string;
  ogSubtitle: string;
  lastmod: string;
}

const latestTool = TOOLS.map((t) => t.updated).sort().at(-1) ?? LAST_UPDATED;

export const PAGES: PageMeta[] = [
  { path: '/', ogSlug: 'home', ogTitle: SITE_NAME, ogSubtitle: '급여·세금·노동 계산을 쉽게', lastmod: latestTool },
  ...CATEGORIES.map((c) => ({
    path: `/${c.slug}/`,
    ogSlug: c.slug,
    ogTitle: c.title,
    ogSubtitle: c.description.split('. ')[0].replace(/\.$/, '') + '.',
    lastmod: TOOLS.filter((t) => t.category === c.slug).map((t) => t.updated).sort().at(-1) ?? LAST_UPDATED,
  })),
  ...TOOLS.map((t) => ({
    path: `/${t.slug}/`,
    ogSlug: t.slug,
    ogTitle: t.name,
    ogSubtitle: t.description,
    lastmod: t.updated,
  })),
  { path: '/tools/', ogSlug: 'tools', ogTitle: '전체 계산기', ogSubtitle: '돈셈의 모든 계산기를 한곳에서 찾아보세요.', lastmod: latestTool },
  { path: '/about/', ogSlug: 'about', ogTitle: '돈셈 소개', ogSubtitle: '누가, 왜, 어떤 원칙으로 계산기를 만드는지 알려드려요.', lastmod: LAST_UPDATED },
  { path: '/privacy/', ogSlug: 'privacy', ogTitle: '개인정보처리방침', ogSubtitle: '입력한 값은 서버로 보내지 않아요.', lastmod: LAST_UPDATED },
  { path: '/terms/', ogSlug: 'terms', ogTitle: '이용약관', ogSubtitle: '서비스 이용 조건과 계산 결과의 성격을 안내해요.', lastmod: LAST_UPDATED },
  { path: '/contact/', ogSlug: 'contact', ogTitle: '문의', ogSubtitle: '오류 제보와 제안은 이메일로 받아요.', lastmod: LAST_UPDATED },
];

export const pageOf = (path: string): PageMeta | undefined => PAGES.find((p) => p.path === path);
