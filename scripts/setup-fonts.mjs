// Pretendard(OFL-1.1) 가변 동적 서브셋 woff2를 public/fonts/pretendard/로 복사하고
// src/styles/fonts.css(@font-face)를 생성한다. 패키지 버전을 올렸을 때만 `npm run fonts`로 다시 실행.
import { cpSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';

const dist = 'node_modules/pretendard/dist';
const out = 'public/fonts/pretendard';
mkdirSync(out, { recursive: true });
cpSync(`${dist}/web/variable/woff2-dynamic-subset`, out, { recursive: true });
cpSync(`${dist}/LICENSE.txt`, 'docs/licenses/Pretendard-OFL.txt');

let css = readFileSync(`${dist}/web/variable/pretendardvariable-dynamic-subset.css`, 'utf8');
css = css
  .replaceAll('./woff2-dynamic-subset/', '/fonts/pretendard/')
  .replaceAll("format('woff2-variations')", "format('woff2')");
writeFileSync(
  'src/styles/fonts.css',
  `/* 자동 생성: scripts/setup-fonts.mjs. 직접 수정하지 말 것. Pretendard Variable 동적 서브셋 (SIL OFL 1.1) */\n${css}`,
);
console.log('fonts ready');
