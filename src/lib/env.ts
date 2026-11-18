/**
 * 빌드 환경. PUBLIC_ENV=production(main) / preview(develop, 기본값).
 * preview: 전 페이지 noindex, 광고 회색 빈 자리, GA4 미로드. production: index, 광고 슬롯 렌더링 없음.
 */
export const PUBLIC_ENV: 'production' | 'preview' =
  import.meta.env.PUBLIC_ENV === 'production' ? 'production' : 'preview';
export const IS_PRODUCTION = PUBLIC_ENV === 'production';
