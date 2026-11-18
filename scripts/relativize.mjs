// 미리보기 게시용: 루트 기준 절대경로(/...)를 파일 위치 기준 상대경로로 바꾼다. 의존성 없음.
// (아티팩트 호스팅은 루트 절대경로가 사이트 루트를 가리키지 않고, `_`로 시작하는 최상위 이름을 거부한다.)
import { readdirSync, readFileSync, writeFileSync, statSync } from 'node:fs';
import { join, relative, dirname, sep } from 'node:path';

/** root 기준으로 file이 있는 폴더에서 root까지의 상대 접두어. 루트면 './', 한 단계 아래면 '../' */
export function prefixFor(root, file) {
  const dir = relative(root, dirname(file));
  if (!dir) return './';
  return '../'.repeat(dir.split(sep).length);
}

/** '/'로 시작하는 내부 URL 하나를 변환. 변환 대상이 아니면 null. */
export function relativizeUrl(url, prefix) {
  if (!url.startsWith('/') || url.startsWith('//')) return null;
  const m = url.slice(1).match(/^([^?#]*)([?#].*)?$/s);
  let path = m[1];
  const tail = m[2] ?? '';
  if (path === '' || path.endsWith('/')) path += 'index.html';
  return `${prefix}${path}${tail}`;
}

const CSS_URL = /url\((["']?)(\/(?!\/)[^)"']*)\1\)/g;

export function relativizeCss(css, prefix) {
  return css.replace(CSS_URL, (all, q, u) => `url(${q}${relativizeUrl(u, prefix)}${q})`);
}

/** HTML: href/src/action 속성과 인라인 스타일·<style>의 url(/...)만 바꾼다. <meta content>·JSON-LD 등은 건드리지 않는다. */
export function relativizeHtml(html, prefix) {
  const attrs = html.replace(/(\s(?:href|src|action))=(["'])(\/[^"']*)\2/g, (all, attr, q, u) => {
    const r = relativizeUrl(u, prefix);
    return r === null ? all : `${attr}=${q}${r}${q}`;
  });
  return relativizeCss(attrs, prefix);
}

function* walk(dir) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) yield* walk(p);
    else yield p;
  }
}

/** root 아래 모든 .html/.css를 제자리에서 변환한다. */
export function relativizeTree(root) {
  let count = 0;
  for (const file of walk(root)) {
    const isHtml = file.endsWith('.html');
    if (!isHtml && !file.endsWith('.css')) continue;
    const src = readFileSync(file, 'utf8');
    const prefix = prefixFor(root, file);
    const out = isHtml ? relativizeHtml(src, prefix) : relativizeCss(src, prefix);
    if (out !== src) {
      writeFileSync(file, out);
      count++;
    }
  }
  return count;
}

/** `_`로 시작하는 최상위 이름이 남아 있으면 이름 목록을 돌려준다(호스팅이 거부함). */
export function underscoreTopLevel(root) {
  return readdirSync(root).filter((n) => n.startsWith('_'));
}
