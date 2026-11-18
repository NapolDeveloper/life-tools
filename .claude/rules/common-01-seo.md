---
paths:
  - "src/**"
  - "public/**"
  - "astro.config.*"
---
<!-- 사본. 원본: SAUP 프로젝트 biz/web_dev/context/공통/01_SEO기술규칙.md — 이 파일을 직접 수정하지 말 것 -->
# 공통 SEO 기술 규칙 (모든 애드센스 웹사이트)

> 정책 확인일: 2026-11-18 (6개월마다 재확인).

## 1. URL
- 소문자 영문 슬러그, 하이픈 구분, 끝 슬래시 통일, 평평한 구조(`/salary/`). 카테고리는 URL이 아니라 허브 페이지·Breadcrumb로 묶는다.
- 공개한 URL은 바꾸지 않는다. 불가피하면 301 리다이렉트.
- 공유용 쿼리 URL은 canonical을 쿼리 없는 주소로, sitemap 제외.

## 2. 메타
- `lang="ko"`, viewport(`width=device-width, initial-scale=1`, 확대 금지 옵션 사용 안 함).
- title: 페이지마다 고유, 핵심 키워드 앞, 브랜드 제외 한글 약 30자. 기준값이 매년 바뀌는 페이지만 `(YYYY년 기준)` 표기 — 갱신 시 연도·최종 갱신일·sitemap lastmod 함께 변경.
- description: 페이지마다 고유, 한글 80~120자.
- canonical: 절대 URL, 쿼리 제거.
- OG(og:title·description·url·type·image 1200×630·locale ko_KR·site_name) + Twitter summary_large_image. OG 이미지는 빌드 시 코드로 생성.
- 미리보기(develop) 빌드는 전 페이지 `noindex`, 운영(main) 빌드만 index. 환경변수로 분기.

## 3. 구조화 데이터 (JSON-LD)
- BreadcrumbList(전체), WebSite·Organization(홈), 페이지 성격에 맞는 타입(도구는 WebApplication, dateModified 포함).
- 화면 내용과 일치. 근거 없는 평점(aggregateRating) 금지.
- FAQPage: 구글 FAQ 리치 결과는 2026년 5월 모든 사이트에서 중단 — 마크업은 무해하나 효과 기대하지 않음. HowTo 사용 안 함.
- 배포 전 Rich Results Test / Schema Markup Validator 오류 0.

## 4. 본문·내부 링크
- H1 1개, H2는 페이지 블록과 일치. 표는 `<table>`·`<caption>`·`<th scope>`.
- Breadcrumb + 관련 페이지 + 카테고리 허브로 연결. 앵커 텍스트는 대상 키워드("여기" 금지). 고아 페이지 금지.
- 핵심 답(기본값 결과 등)은 HTML에 미리 렌더링.

## 5. 색인 파일
- sitemap: 색인 대상만, 정확한 lastmod.
- robots.txt: 전체 허용 + sitemap 절대 URL. Yeti·Daumoa·bingbot 차단 금지. 미리보기 환경은 Disallow 대신 meta noindex.
- RSS(`/rss.xml`), 커스텀 404(noindex, 인기 페이지 링크).

## 6. 품질 게이트
- Lighthouse 모바일 Performance·Accessibility·Best Practices 90 이상, SEO 100.
- Core Web Vitals: LCP ≤ 2.5초, INP ≤ 200ms, CLS ≤ 0.1 (75번째 백분위).
- 미달이면 develop 머지 보류.
- 이미지 WebP/AVIF·크기 명시·지연 로딩, 웹폰트 1종·preload, 서드파티 스크립트 async/defer, 광고 슬롯 높이 확보.

## 7. 도메인·검색엔진 등록
- 커스텀 도메인, HTTPS, www/비www 하나로 301 통일. `*.pages.dev` 등은 미리보기 전용.
- 등록: 구글 Search Console, 네이버 서치어드바이저, 다음 검색등록, 빙 웹마스터 도구(사용자 계정 작업). Claude는 소유확인 메타 태그 자리(config `VERIFICATION` 상수)·sitemap·RSS 준비.

## 8. 운영
- 월 1회 색인 오류·노출 키워드·CTR 점검 → `docs/seo-log.md`. 노출 많고 CTR 낮은 페이지는 title·description 개선.
