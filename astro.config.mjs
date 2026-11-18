import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import { SITE_URL } from './src/config.ts';
import { PAGES } from './src/lib/pages.ts';

// 색인 대상(PAGES)만 sitemap에 넣는다. 404·design-system 등은 자동으로 제외된다.
const pageOf = (url) => PAGES.find((p) => p.path === new URL(url).pathname);

export default defineConfig({
  site: SITE_URL,
  output: 'static',
  trailingSlash: 'always',
  build: { format: 'directory', assets: 'assets' }, // '_'로 시작하는 폴더명을 거부하는 호스팅(미리보기)이 있어 assets 사용
  integrations: [
    sitemap({
      filter: (url) => Boolean(pageOf(url)),
      serialize: (item) => ({ ...item, lastmod: pageOf(item.url)?.lastmod }),
    }),
  ],
});
