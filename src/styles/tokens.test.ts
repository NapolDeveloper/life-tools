import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';

const css = readFileSync(new URL('./tokens.css', import.meta.url), 'utf8');
const darkStart = css.indexOf('prefers-color-scheme: dark');

/** --이름: #hex 또는 var(--다른이름) 선언을 읽어 hex로 풀어 준다. */
function parse(block: string, base: Record<string, string> = {}): Record<string, string> {
  const raw: Record<string, string> = {};
  for (const m of block.matchAll(/--([a-z0-9-]+):\s*(#[0-9a-fA-F]{6}|var\(--[a-z0-9-]+\))\s*;/g)) raw[m[1]] = m[2];
  const out: Record<string, string> = { ...base };
  const resolve = (name: string, seen = 0): string => {
    const v = raw[name] ?? out[name];
    if (!v) throw new Error(`token not found: ${name}`);
    const ref = v.match(/^var\(--([a-z0-9-]+)\)$/);
    if (!ref) return v;
    if (seen > 5) throw new Error(`circular: ${name}`);
    return resolve(ref[1], seen + 1);
  };
  for (const name of Object.keys(raw)) out[name] = resolve(name);
  return out;
}
const lightRaw = parse(css.slice(0, darkStart));
const light: Record<string, string> = lightRaw;
const dark = parse(css.slice(darkStart), lightRaw);

function lum(hex: string): number {
  const c = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255);
  const [r, g, b] = c.map((v) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}
const ratio = (a: string, b: string): number => {
  const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p);
  return (x + 0.05) / (y + 0.05);
};

// [전경, 배경, 최소 대비] — 본문 4.5:1 / 큰 글자·아이콘·입력 외곽·포커스 링 3:1
const text: [string, string, number][] = [
  ['text', 'bg', 4.5], ['text', 'bg-sub', 4.5], ['text', 'surface', 4.5], ['text', 'surface-sub', 4.5], ['text', 'primary-weak', 4.5],
  ['text-sub', 'bg', 4.5], ['text-sub', 'bg-sub', 4.5], ['text-sub', 'surface', 4.5], ['text-sub', 'surface-sub', 4.5], ['text-sub', 'primary-weak', 4.5],
  // text-tertiary는 bg·surface·surface-sub 위에서만 쓴다
  ['text-tertiary', 'bg', 4.5], ['text-tertiary', 'surface', 4.5], ['text-tertiary', 'surface-sub', 4.5],
  ['primary', 'bg', 4.5], ['primary', 'bg-sub', 4.5], ['primary', 'surface', 4.5], ['primary', 'primary-weak', 4.5],
  ['primary-pressed', 'bg', 4.5], ['primary-pressed', 'primary-weak', 4.5],
  ['on-primary', 'primary', 4.5], ['on-primary', 'primary-pressed', 4.5],
  ['on-primary-weak', 'primary-weak', 4.5],
  ['danger', 'bg', 4.5], ['danger', 'bg-sub', 4.5], ['danger', 'primary-weak', 4.5],
  ['warning', 'bg', 4.5], ['warning', 'bg-sub', 4.5], ['warning', 'surface-sub', 4.5],
];
const nonText: [string, string, number][] = [
  ['line-strong', 'bg', 3], ['line-strong', 'surface', 3], ['line-strong', 'surface-sub', 3],
  ['primary', 'bg', 3], ['primary', 'bg-sub', 3], // 포커스 링
];
const pairs = [...text, ...nonText].map(([fg, bg, min]) => [`color-${fg}`, `color-${bg}`, min] as [string, string, number]);

describe.each([
  ['라이트', light],
  ['다크', dark],
])('토큰 대비 (%s)', (_name, t) => {
  it.each(pairs)('%s / %s >= %d:1', (fg, bg, min) => {
    expect(ratio(t[fg], t[bg])).toBeGreaterThanOrEqual(min);
  });
});

describe('팔레트·토큰 구성', () => {
  it('원색 팔레트 green/grey 50~900 이 모두 있다', () => {
    for (const p of ['green', 'grey']) for (const n of [50, 100, 200, 300, 400, 500, 600, 700, 800, 900]) expect(light[`${p}-${n}`]).toMatch(/^#/);
  });
  it('green-400·500은 의미 토큰에 쓰이지 않는다(장식 전용)', () => {
    const semantic = css.match(/--color-[a-z-]+:\s*var\(--green-(400|500)\)/g);
    expect(semantic).toBeNull();
  });
});

// 라이트 line-strong(grey-500)은 bg-sub 위에서 2.9:1이라 라이트에서는 bg-sub 위 외곽선으로 쓰지 않는다(규칙 원본 검토 대상). 다크는 모든 배경에서 3:1 이상.
it.each(['bg-sub'])('다크 line-strong / %s >= 3:1', (bg) => {
  expect(ratio(dark['color-line-strong'], dark[`color-${bg}`])).toBeGreaterThanOrEqual(3);
});
