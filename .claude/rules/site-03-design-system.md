---
paths:
  - "src/**"
---
<!-- 사본. 원본: SAUP 프로젝트 biz/web_dev/context/life-tools/03_디자인시스템.md — 이 파일을 직접 수정하지 말 것 -->
# life-tools(돈셈) 디자인 시스템

> 방향 확정, 토큰 값은 초안 — 미리보기로 보고 조정.

## 1. 방향
- **메인 컬러:** 신뢰감 있는 그린.
- **스타일:** 깔끔 + 살짝 둥글게. 넓은 여백, 부드러운 모서리, 그림자 거의 없음(구분은 면 색·테두리로).
- **다크모드:** 기기 설정(`prefers-color-scheme`) 따라 자동. 수동 전환 버튼 없음.
- **핵심 결과:** 큰 숫자 + 연한 그린 카드(`primary-soft` 배경).

## 2. 색 토큰 (WCAG AA 검증값)
| 토큰 | 라이트 | 다크 | 용도 |
|---|---|---|---|
| `--color-bg` | #f6f8f7 | #0e1412 | 페이지 배경 |
| `--color-surface` | #ffffff | #151d1a | 카드·입력 영역 |
| `--color-surface-2` | #eef2f0 | #1c2622 | 표 머리, 보조 면 |
| `--color-text` | #14201b | #e7eeea | 본문 |
| `--color-text-muted` | #4f5d57 | #9fb0a8 | 보조 텍스트 |
| `--color-border` | #d9e1dd | #2a3631 | 구분선(장식용) |
| `--color-border-strong` | #7f8d87 | #61716a | 입력칸 테두리 (3:1 이상) |
| `--color-primary` | #0b7a4b | #3fcf8e | 링크·버튼·결과 숫자 |
| `--color-primary-hover` | #08643d | #62dba3 | hover/active |
| `--color-primary-soft` | #e6f4ec | #173327 | 결과 카드·강조 배경 |
| `--color-on-primary` | #ffffff | #06140d | primary 위 글자 |
| `--color-danger` | #c4302b | #ff7b72 | 오류 |
| `--color-warning` | #8f5400 | #f0b44c | 주의 안내 |
| `--color-info` | #2152d9 | #7aa2ff | 정보 안내 |
- 색 값은 컴포넌트에 직접 쓰지 않고 토큰만 사용. 새 색이 필요하면 토큰을 먼저 추가하고 대비 검증.

## 3. 타이포그래피
- 글꼴: Pretendard(서브셋, `font-display: swap`) → 시스템 폰트 폴백.
- 숫자: 결과·표 숫자에 `font-variant-numeric: tabular-nums`.
- `word-break: keep-all`.

| 토큰 | 크기 | 굵기 | 줄간격 | 용도 |
|---|---|---|---|---|
| `--text-display` | 2.25rem | 800 | 1.2 | 핵심 결과 숫자 |
| `--text-h1` | 1.75rem | 700 | 1.3 | 페이지 제목 |
| `--text-h2` | 1.375rem | 700 | 1.4 | 섹션 제목 |
| `--text-h3` | 1.125rem | 600 | 1.4 | 소제목 |
| `--text-body` | 1rem | 400 | 1.7 | 본문 |
| `--text-small` | 0.875rem | 400 | 1.6 | 힌트·캡션 |
- 입력칸 글자는 16px 이상(iOS 자동 확대 방지).

## 4. 간격·모양·레이아웃
- 간격(4px 기반): `--space-1` 4 / `-2` 8 / `-3` 12 / `-4` 16 / `-5` 24 / `-6` 32 / `-7` 48 / `-8` 64 (px).
- 모서리: `--radius-sm` 8px(입력·버튼) / `--radius-md` 12px(카드) / `--radius-lg` 16px(결과 카드) / `--radius-full`(칩).
- 그림자: 기본 없음. 하단 고정 결과바에만 `--shadow-sticky` 1종.
- 브레이크포인트: 기본(모바일) / 768px / 1024px.
- 본문 최대 폭 `--content-max` 720px, 계산기 영역 `--wide-max` 960px. 좌우 여백 16px.
- 터치 영역 최소 44×44px. 모션 150~300ms, `prefers-reduced-motion`이면 제거.

## 5. 컴포넌트 목록 (`src/components/ui/`)
| 분류 | 컴포넌트 | 핵심 규칙 |
|---|---|---|
| 레이아웃 | `SiteHeader`, `SiteFooter`, `Breadcrumb`, `PageHeader`(H1·설명·갱신일), `Section`(H2 블록) | 페이지 구조는 site-01-planning §2 순서 |
| 입력 | `Field`(label·힌트·오류), `MoneyInput`(콤마·단위·한글 읽기), `Stepper`(−/+), `Segmented`(2~4개), `Chips`(빠른 입력), `Details`(상세 옵션 접기) | 모든 입력에 label, `inputmode="numeric"` |
| 결과 | `ResultHero`(큰 숫자 + soft 카드, aria-live), `ResultTable`(내역·합계), `StickyResultBar`(모바일), `CopyButton`, `ShareButton`, `Toast` | 결과 숫자 tabular-nums |
| 콘텐츠 | `Steps`, `DataTable`(caption·scope), `SourceList`(출처·기준일), `Notice`(info·warning), `FaqList`, `ChangeLog` | |
| 탐색 | `ToolCard`, `RelatedTools`, `CategoryHub` | |
| 광고 | `AdSlot`(라벨·고정 높이, 환경별 표시 규칙은 common-00-policy §1) | 입력·결과 블록 안에 배치 금지 |
| 버튼 | `Button` — primary / secondary(테두리) / ghost(텍스트), md(44px)·sm(36px) | 페이지당 primary 최소화 |

## 6. 구현 규칙
- 토큰은 `src/styles/tokens.css` 한 파일, 전역 기본 스타일은 `src/styles/base.css`.
- 컴포넌트 스타일은 각 `.astro` 파일 scoped style에서 토큰만 사용. 하드코딩된 색·px 금지.
- 아이콘: Lucide 필요한 것만 SVG 컴포넌트(`src/components/icons/`), 장식 아이콘은 `aria-hidden`.
- develop 빌드에만 `/design-system/` 쇼케이스 페이지(모든 토큰·컴포넌트 예시, noindex, sitemap 제외) — 사용자 검수용.
