# 외부 리소스 라이선스

공통 정책(common-00 §4): 글꼴·아이콘·라이브러리는 상업 이용이 가능한 오픈 라이선스만 쓴다. 이미지는 코드로 직접 생성한 것만 쓴다(외부 사진·스톡·AI 생성 이미지 없음).

## 글꼴·아이콘 (사이트에 포함되어 배포됨)

| 이름 | 용도 | 버전 | 라이선스 | 출처 | 비고 |
|---|---|---|---|---|---|
| Pretendard (가변, 동적 서브셋 woff2) | 웹폰트 1종 (본문·제목·숫자) | 1.3.9 (npm `pretendard`) | SIL Open Font License 1.1 | https://github.com/orioncactus/pretendard | `public/fonts/pretendard/`에 self-host. 사본: `docs/licenses/Pretendard-OFL.txt`. `font-display: swap`, 핵심 서브셋 preload |
| Donsem Subset (Pretendard 파생 단일 서브셋 woff2) | 사이트에서 쓰는 글자만 담은 글꼴 1파일 (성능) | Pretendard 1.3.9에서 생성 | SIL Open Font License 1.1 | `scripts/subset-fonts.py`(fontTools)로 `node_modules/pretendard`의 가변 TTF에서 생성, 굵기 400~700 | `public/fonts/donsem-subset.woff2`. 파생본이라 예약 글꼴 이름 조항을 피하려고 내부 이름을 "Donsem Subset"으로 바꿨고 저작권 문구는 유지. 서브셋에 없는 글자는 위 Pretendard 동적 서브셋이 맡음. 사본: `docs/licenses/Pretendard-OFL.txt` |
| Lucide 아이콘 (필요한 13개만 SVG 컴포넌트) | 버튼·안내 아이콘 | - | ISC | https://lucide.dev (https://github.com/lucide-icons/lucide) | `src/components/icons/`. 패키지 전체를 번들하지 않고 path만 옮겨 둠. 사본: `docs/licenses/Lucide-ISC.txt` |

## 빌드 도구 (사이트에 포함되지 않음, OG 이미지 생성용)

| 이름 | 용도 | 라이선스 | 출처 |
|---|---|---|---|
| satori | OG 이미지용 HTML-like 트리 -> SVG | MPL-2.0 | https://github.com/vercel/satori |
| @resvg/resvg-js | SVG -> PNG 변환 | MPL-2.0 | https://github.com/yisibl/resvg-js |
| Pretendard OTF (npm `pretendard`) | OG 이미지 렌더링용 폰트 (빌드 시에만 읽음) | OFL-1.1 | 위와 같음 |

## 프레임워크·도구 (개발 의존성)

| 이름 | 라이선스 |
|---|---|
| Astro, @astrojs/sitemap | MIT |
| Vitest | MIT |
| TypeScript | Apache-2.0 |
| Lighthouse (품질 점검용, `npx`로만 실행, 저장소에 포함하지 않음) | Apache-2.0 |

## 확인 이력

- 2026-11-18: 위 라이선스를 각 패키지의 package.json·LICENSE 기준으로 기록. 패키지를 추가하거나 버전을 올릴 때 이 문서를 함께 갱신한다.
