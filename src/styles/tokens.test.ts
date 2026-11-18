import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';

const css = readFileSync(new URL('./tokens.css', import.meta.url), 'utf8');
const darkStart = css.indexOf('prefers-color-scheme: dark');

function parse(block: string): Record<string, string> {
  const out: Record<string, string> = {};
  for (const m of block.matchAll(/--color-([a-z0-9-]+):\s*(#[0-9a-fA-F]{6})/g)) out[m[1]] = m[2];
  return out;
}
const light = parse(css.slice(0, darkStart));
const dark = { ...light, ...parse(css.slice(darkStart)) };

function lum(hex: string): number {
  const c = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255);
  const [r, g, b] = c.map((v) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}
const ratio = (a: string, b: string): number => {
  const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p);
  return (x + 0.05) / (y + 0.05);
};

// [전경, 배경, 최소 대비]
const pairs: [string, string, number][] = [
  ['text', 'bg', 4.5],
  ['text', 'surface', 4.5],
  ['text', 'surface-2', 4.5],
  ['text-muted', 'bg', 4.5],
  ['text-muted', 'surface', 4.5],
  ['text-muted', 'surface-2', 4.5],
  ['primary', 'bg', 4.5],
  ['primary', 'surface', 4.5],
  ['primary', 'primary-soft', 4.5],
  ['primary-hover', 'surface', 4.5],
  ['on-primary', 'primary', 4.5],
  ['on-primary', 'primary-hover', 4.5],
  ['text', 'primary-soft', 4.5],
  ['danger', 'surface', 4.5],
  ['danger', 'bg', 4.5],
  ['warning', 'surface', 4.5],
  ['warning', 'surface-2', 4.5],
  ['info', 'surface', 4.5],
  ['info', 'surface-2', 4.5],
  ['border-strong', 'surface', 3],
  ['border-strong', 'bg', 3],
];

describe.each([
  ['라이트', light],
  ['다크', dark],
])('토큰 대비 (%s)', (_name, t) => {
  it.each(pairs)('%s / %s >= %d:1', (fg, bg, min) => {
    expect(ratio(t[fg], t[bg])).toBeGreaterThanOrEqual(min);
  });
});
