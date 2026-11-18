/**
 * preload할 글꼴. 사이트에서 쓰는 글자만 담은 단일 서브셋(scripts/subset-fonts.py가 생성)이라 첫 화면의 글자를 한 번에 받는다.
 * 서브셋에 없는 글자는 Pretendard 동적 서브셋(fonts.css)이 이어서 맡는다.
 */
export const PRELOAD_FONTS = ['donsem-subset.woff2'];
