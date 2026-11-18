# life-tools (돈셈) — 개발 지침

급여·세금·노동 계산기 정적 사이트 "돈셈". 목적: 구글 애드센스 승인 및 수익.
원본 지침: SAUP 프로젝트 `biz/web_dev/개발지침_애드센스사이트.md`

## 컨텍스트 (필수로 읽을 것)
`.claude/rules/`가 개발 기준이다. **작업 전에 모두 읽는다**(서브에이전트 포함).
| 파일 | 내용 | 범위 |
|---|---|---|
| `common-00-policy.md` | 광고·콘텐츠 품질·개인정보·저작권·접근성 | 모든 애드센스 사이트 공통 |
| `common-01-seo.md` | URL·메타·구조화 데이터·색인·품질 게이트 | 공통 |
| `site-00-policy.md` | 계산 정확성·설명 분량·리소스 | 돈셈 전용 |
| `site-01-planning.md` | 도구 선정·페이지 구조·카테고리·브랜드 | 돈셈 전용 |
| `site-02-ux.md` | 입력·결과·모바일·문구 톤 | 돈셈 전용 |
| `site-03-design-system.md` | 토큰·컴포넌트·구현 규칙 | 돈셈 전용 |
- 이 파일들은 **사본**이다. 원본은 SAUP 프로젝트 `biz/web_dev/context/`. 레포에서 직접 고치지 않는다.
- 충돌 시 우선순위: common-00 > site-00 > 나머지.

## 모델 규칙 (필수)
- **기본값: 개발은 Sonnet.** 페이지·컴포넌트 추가, 계산 로직, 스타일, SEO 메타, 버그 수정, 테스트 작성 등 일반 개발은 모두 Sonnet으로 한다.
  - Opus 등 상위 모델 세션에서 작업을 받으면 직접 코딩하지 말고 Agent 도구를 `model: "sonnet"`으로 지정해 맡긴다. 상위 모델은 작업 선정·지시·검수·기록만 한다.
- **Opus는 아래 경우에만 사용한다.**
  1. 사용자가 해당 작업에 Opus를 명시적으로 요청한 경우
  2. 정말 고도화된 작업: 사이트 전체 아키텍처 설계·대규모 구조 변경, Sonnet이 2회 이상 시도해도 해결 못 한 문제
- Opus를 쓴 경우 WORKLOG.md에 작업명과 사유(1 또는 2)를 남긴다. 애매하면 Sonnet.

## 기술 기본
- 정적 빌드만 (Astro). 서버·DB 없음. 무료 호스팅(Cloudflare Pages / GitHub Pages).
- 빌드 환경 구분: `PUBLIC_ENV=preview`(develop, 기본값) / `PUBLIC_ENV=production`(main). preview는 noindex·광고 빈 슬롯·GA4 미로드.

## 브랜치·배포 흐름
- `main`: 운영. **사용자가 명시적으로 지시할 때만** develop → main PR을 만들고 머지한다.
- `develop`: 테스트. 기능 브랜치는 develop에서 따고(`feat/*`, `fix/*`), PR base는 develop.
- 기능 완료 → `npm test`·`npm run build`·품질 게이트(common-01-seo §6) 통과 → PR을 develop에 **자동 머지** → develop을 빌드해 미리보기 주소에 반영 → 사용자에게 보고.
- 실패 시 머지하지 않고 원인과 함께 보고.
- 미리보기 주소: Claude 아티팩트 (https://claude.ai/artifact/AtrnEngD1WjnXXyTC7Mfki). develop 빌드 결과(dist)를 같은 주소로 재게시. Cloudflare Pages 연결 후에는 develop 브랜치 미리보기 주소로 대체.

## 작업 규칙
- 한 회차 = 기능 1개(또는 페이지 1~2개). main·develop 직접 push 금지(문서성 변경 제외).
- 사용자 승인 필요한 일은 하지 않고 WORKLOG에 남긴다: 계정 생성, 애드센스 신청, 도메인 구매, 결제, 배포 설정, 약관 동의.
- 회차 종료 시 `WORKLOG.md`에 날짜 / 한 일 / 사용 모델 / 다음 할 일 / 사용자 확인 필요 항목 기록.
- 커밋 전 `npm run build` 통과 필수.
