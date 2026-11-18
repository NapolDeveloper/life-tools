---
paths:
  - "src/**"
---
<!-- 사본. 원본: SAUP 프로젝트 biz/web_dev/context/life-tools/03_디자인시스템.md — 이 파일을 직접 수정하지 말 것 -->
# life-tools(돈셈) 디자인 시스템 v2

> **시각 원본: Design System 아티팩트 "돈셈 디자인 시스템"** (https://claude.ai/artifact/BXPd63pVTd6Ham2upX3MnC). 이 문서는 방향과 규칙.

## 1. 방향
- **레퍼런스: 토스 앱·웹의 느낌.** 느낌(구성·여백·위계·말투)만 참고하고 토스 전용 폰트(Toss Product Sans)·로고·아이콘·고유 컴포넌트·문구를 복제하지 않는다.
- **색:** 토스의 파란 포인트 자리를 녹색으로. 나머지는 차분한 회색 계열.
- **원칙**
  1. 한 화면 한 메시지: 큰 제목, 핵심 숫자 하나를 가장 크게.
  2. 테두리 대신 면: 카드·입력은 테두리 없이 회색 면으로 구분, 그림자 없음. 섹션 사이는 회색 띠(8~12px)나 넓은 여백.
  3. 넉넉한 여백: 좌우 20px(모바일), 블록 간 32~48px.
  4. 크게 둥글게: 입력 12px, 버튼 16px, 카드 20px.
  5. 버튼은 꽉 차게: 주요 행동은 전체 폭 56px 버튼 1개.
  6. 누르는 느낌: 버튼·카드 탭 시 살짝 작아짐(scale 0.98, reduced-motion이면 생략).
- **다크모드:** 기기 설정 따라 자동.

## 2. 색 토큰 (AA 검증값)
### 원색 팔레트
| 녹색 | 값 | 회색 | 값 |
|---|---|---|---|
| green-50 | #ebfaf2 | grey-50 | #f8faf9 |
| green-100 | #d2f4e2 | grey-100 | #f1f4f3 |
| green-200 | #a6e8c6 | grey-200 | #e4e8e6 |
| green-300 | #6fd8a3 | grey-300 | #d0d6d3 |
| green-400 | #33c17f | grey-400 | #aeb7b3 |
| green-500 | #14a865 | grey-500 | #89938e |
| green-600 | #067f4d | grey-600 | #6a7570 |
| green-700 | #067043 | grey-700 | #4d5853 |
| green-800 | #065a37 | grey-800 | #323b37 |
| green-900 | #05432a | grey-900 | #1a201d |

### 의미 토큰 (컴포넌트는 이것만 사용)
| 토큰 | 라이트 | 다크 | 용도 |
|---|---|---|---|
| `bg` | #ffffff | #111614 | 페이지 배경 |
| `bg-sub` | grey-100 #f1f4f3 | #1a201d | 섹션 구분 띠, 입력칸 면, 보조 카드 |
| `surface` | #ffffff | #1a201d | 카드 |
| `surface-sub` | grey-50 #f8faf9 | #232b27 | 표 머리, 눌림 상태 |
| `text` | grey-900 #1a201d | #eef2f0 | 제목·본문 |
| `text-sub` | grey-700 #4d5853 | #a3aea9 | 설명·라벨 |
| `text-tertiary` | grey-600 #6a7570 | #8c9792 | 캡션·힌트 (흰/grey-50 위에서만) |
| `line` | grey-200 #e4e8e6 | #2b3430 | 구분선(장식) |
| `line-strong` | grey-500 #89938e | #6b7873 | 입력 외곽이 필요할 때(모든 배경에서 3:1 이상) |
| `primary` | green-600 #067f4d | #3fd38b | 주 버튼 배경·링크·핵심 숫자 |
| `primary-pressed` | green-700 #067043 | #24b871 | 눌림 |
| `primary-weak` | green-50 #ebfaf2 | #163526 | 보조 버튼 배경·결과 카드 배경 |
| `on-primary` | #ffffff | #06140d | primary 위 글자 |
| `on-primary-weak` | green-700 #067043 | #3fd38b | primary-weak 위 글자 |
| `danger` | #c4302b | #ff7b72 | 오류 |
| `warning` | #8f5400 | #f0b44c | 주의 |
- green-400·500은 아이콘·장식·그래프 전용(텍스트 금지).

## 3. 타이포그래피 (Pretendard)
| 토큰 | 크기/줄높이 | 굵기 | 용도 |
|---|---|---|---|
| `display` | 34/44px | 700 | 핵심 결과 숫자 |
| `title-1` | 26/36px | 700 | 페이지 제목(H1) |
| `title-2` | 22/31px | 700 | 섹션 제목(H2) |
| `title-3` | 19/27px | 600 | 소제목·카드 제목 |
| `body-1` | 17/26px | 400 | 본문·입력값 |
| `body-2` | 15/23px | 400 | 보조 설명·표 |
| `caption` | 13/19px | 400 | 힌트·각주 |
- 숫자 `tabular-nums`, 금액 숫자 600~700. 제목 자간 -0.02em. `word-break: keep-all`.

## 4. 간격·모양
- 간격: 4 / 8 / 12 / 16 / 20 / 24 / 32 / 40 / 48 / 64px (`space-1`~`space-10`).
- 모바일 좌우 여백 20px, 본문·계산기 최대 폭 640px.
- 모서리: `radius-sm` 8px / `radius-md` 12px(입력) / `radius-lg` 16px(버튼) / `radius-xl` 20px(카드) / `radius-full`(칩·스테퍼).
- 그림자 없음. 하단 고정 결과바만 상단 1px `line`.
- 버튼 높이: L 56px(주 행동, 전체 폭) / M 48px / S 36px.
- 터치 영역 최소 44×44px. 모션 150~250ms ease-out.

## 5. 컴포넌트 규칙
- **Button:** primary(녹색 채움) / weak(연녹색 면 + 녹색 글자) / grey(회색 면 + 진회색 글자) / text. 페이지당 primary 1개.
- **입력(MoneyInput 등):** 테두리 없는 `bg-sub` 면, 포커스 시 2px `primary` 링. 값 `body-1` 600, 단위 `text-sub`.
- **Chips:** `bg-sub` 면 + `radius-full`, 선택 시 `primary-weak` + `on-primary-weak`.
- **Stepper:** `bg-sub` 면 하나에 −/값/+.
- **ResultHero:** `primary-weak` 면 + `radius-xl`, 라벨 `body-2` `text-sub`, 숫자 `display` `primary`.
- **List/Table:** 행 사이 구분선 없이 여백, 합계 행만 굵게 + 위 1px `line`.
- **Section 구분:** 큰 블록 사이 `bg-sub` 띠(높이 12px, 전체 폭).
- **Notice:** `bg-sub` 면 + 아이콘, 왼쪽 굵은 선 장식 금지.
- **Header:** 흰 배경, 하단 경계 없음(스크롤 시에만 1px `line`), 로고 워드마크 "돈셈" `title-3` 700 `primary`.

## 6. 구현 규칙
- 코드 원본: `src/styles/tokens.css`(의미 토큰 + 원색 팔레트), 컴포넌트는 의미 토큰만 사용, 하드코딩 색·px 금지.
- 디자인 변경 순서: 아티팩트(또는 원본 문서)에서 결정 → 코드 반영 → 아티팩트를 코드 기준으로 다시 맞춤.
- develop 빌드에만 `/design-system/` 쇼케이스(noindex) 유지.
