import { describe, it, expect, beforeAll } from 'vitest';
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { relativizeUrl, relativizeHtml, relativizeCss, relativizeTree, prefixFor, underscoreTopLevel } from './relativize.mjs';

describe('relativizeUrl', () => {
  it('루트와 슬래시로 끝나는 경로는 index.html을 붙인다', () => {
    expect(relativizeUrl('/', './')).toBe('./index.html');
    expect(relativizeUrl('/pay/', './')).toBe('./pay/index.html');
    expect(relativizeUrl('/pay/', '../')).toBe('../pay/index.html');
  });
  it('파일 경로·쿼리·해시 보존', () => {
    expect(relativizeUrl('/assets/a.css', '../')).toBe('../assets/a.css');
    expect(relativizeUrl('/salary/?salary=1#x', '../')).toBe('../salary/index.html?salary=1#x');
    expect(relativizeUrl('/#tools', './')).toBe('./index.html#tools');
  });
  it('프로토콜 상대·외부·해시는 그대로', () => {
    expect(relativizeUrl('//cdn.example.com/a.js', './')).toBeNull();
    expect(relativizeUrl('https://a.com/', './')).toBeNull();
    expect(relativizeUrl('#top', './')).toBeNull();
  });
});

describe('relativizeHtml', () => {
  it('href/src/action만 바꾸고 meta content·JSON-LD는 유지', () => {
    const html = [
      '<a href="/pay/">p</a><a href="/">h</a><a href="https://x.com/">x</a><a href="//x.com/y">y</a><a href="#a">a</a><a href="mailto:a@b.c">m</a>',
      '<script type="module" src="/assets/a.js"></script><form action="/x/"></form>',
      '<meta property="og:url" content="/pay/"><link rel="canonical" href="https://example.com/pay/">',
      '<script type="application/ld+json">{"url":"https://example.com/","item":"/pay/"}</script>',
      '<div style="background:url(/img/a.png)"></div><style>@font-face{src:url(/fonts/a.woff2)}</style>',
    ].join('');
    const out = relativizeHtml(html, '../');
    expect(out).toContain('href="../pay/index.html"');
    expect(out).toContain('href="../index.html"');
    expect(out).toContain('href="https://x.com/"');
    expect(out).toContain('href="//x.com/y"');
    expect(out).toContain('href="#a"');
    expect(out).toContain('href="mailto:a@b.c"');
    expect(out).toContain('src="../assets/a.js"');
    expect(out).toContain('action="../x/index.html"');
    expect(out).toContain('content="/pay/"');
    expect(out).toContain('href="https://example.com/pay/"');
    expect(out).toContain('"item":"/pay/"');
    expect(out).toContain('url(../img/a.png)');
    expect(out).toContain('url(../fonts/a.woff2)');
  });
});

describe('relativizeCss / relativizeTree', () => {
  it('css url(/...)', () => {
    expect(relativizeCss("a{src:url('/fonts/a.woff2') format('woff2')}b{c:url(data:x)}", '../')).toBe(
      "a{src:url('../fonts/a.woff2') format('woff2')}b{c:url(data:x)}",
    );
  });
  let root;
  beforeAll(() => {
    root = mkdtempSync(join(tmpdir(), 'rel-'));
    mkdirSync(join(root, 'pay'));
    mkdirSync(join(root, 'assets'));
    writeFileSync(join(root, 'index.html'), '<a href="/pay/">p</a>');
    writeFileSync(join(root, 'pay', 'index.html'), '<a href="/">h</a><link href="/assets/a.css">');
    writeFileSync(join(root, 'assets', 'a.css'), '@font-face{src:url(/fonts/a.woff2)}');
  });
  it('파일 위치별 접두어로 변환', () => {
    expect(prefixFor(root, join(root, 'index.html'))).toBe('./');
    expect(prefixFor(root, join(root, 'pay', 'index.html'))).toBe('../');
    relativizeTree(root);
    expect(readFileSync(join(root, 'index.html'), 'utf8')).toBe('<a href="./pay/index.html">p</a>');
    expect(readFileSync(join(root, 'pay', 'index.html'), 'utf8')).toBe('<a href="../index.html">h</a><link href="../assets/a.css">');
    expect(readFileSync(join(root, 'assets', 'a.css'), 'utf8')).toBe('@font-face{src:url(../fonts/a.woff2)}');
  });
  it('_로 시작하는 최상위 이름 감지', () => {
    mkdirSync(join(root, '_astro'));
    expect(underscoreTopLevel(root)).toEqual(['_astro']);
  });
});
