import { readFileSync } from 'node:fs';
import satori from 'satori';
import { Resvg } from '@resvg/resvg-js';
import { SITE_NAME, SITE_NAME_EN } from '../config';

/**
 * OG 이미지(1200x630 PNG) 빌드 시 생성. 외부 이미지 없이 도형·텍스트만 쓰고, 색은 tokens.css(라이트) 값을 읽어 쓴다.
 * 디자인 시스템 v2: 흰 배경 위 primary-weak 큰 카드, 워드마크 "돈셈"(700, primary), 제목 700.
 */
const root = process.cwd();
const tokens = readFileSync(`${root}/src/styles/tokens.css`, 'utf8');
const lightBlock = tokens.slice(0, tokens.indexOf('prefers-color-scheme: dark'));
/** --name: #hex 또는 var(--other) 를 hex로 풀어 돌려준다. */
const color = (name: string, depth = 0): string => {
  const m = lightBlock.match(new RegExp(`--${name}:\\s*(#[0-9a-fA-F]{6}|var\\(--[a-z0-9-]+\\))\\s*;`));
  if (!m || depth > 5) throw new Error(`token not found: ${name}`);
  const ref = m[1].match(/^var\(--([a-z0-9-]+)\)$/);
  return ref ? color(ref[1], depth + 1) : m[1];
};

const font = (file: string): Buffer => readFileSync(`${root}/node_modules/pretendard/dist/public/static/${file}`);
let fonts: { name: string; data: Buffer; weight: 400 | 700; style: 'normal' }[] | null = null;
const getFonts = () =>
  (fonts ??= [
    { name: 'Pretendard', data: font('Pretendard-Regular.otf'), weight: 400, style: 'normal' },
    { name: 'Pretendard', data: font('Pretendard-Bold.otf'), weight: 700, style: 'normal' },
  ]);

type Node = { type: string; props: Record<string, unknown> };
const h = (type: string, style: Record<string, unknown>, children?: unknown): Node => ({
  type,
  props: { style: { display: 'flex', ...style }, children },
});

export async function renderOg(title: string, subtitle: string): Promise<Buffer> {
  const primary = color('color-primary');
  const weak = color('color-primary-weak');
  const text = color('color-text');
  const sub = color('color-text-sub');
  const bg = color('color-bg');
  const deco1 = color('green-200');
  const deco2 = color('green-400');
  const titleSize = title.length > 18 ? 60 : title.length > 10 ? 72 : 88;

  const tree = h(
    'div',
    { width: 1200, height: 630, boxSizing: 'border-box', background: bg, padding: 40, position: 'relative' },
    [
      h(
        'div',
        {
          flexDirection: 'column',
          justifyContent: 'space-between',
          flex: 1,
          background: weak,
          borderRadius: 48,
          padding: '56px 72px',
          position: 'relative',
          overflow: 'hidden',
        },
        [
          // 장식: 우하단 원 도형 (green-200 / green-400, 텍스트 아님)
          h('div', { position: 'absolute', right: -110, bottom: -150, width: 480, height: 480, borderRadius: 240, background: deco1 }),
          h('div', { position: 'absolute', right: 90, bottom: 70, width: 140, height: 140, borderRadius: 70, background: deco2 }),
          h('div', { fontSize: 44, fontWeight: 700, color: primary }, SITE_NAME),
          h('div', { flexDirection: 'column', gap: 24, maxWidth: 800 }, [
            h('div', { fontSize: titleSize, fontWeight: 700, color: text, lineHeight: 1.25, wordBreak: 'keep-all', letterSpacing: '-0.02em' }, title),
            h('div', { fontSize: 32, fontWeight: 400, color: sub, lineHeight: 1.5, wordBreak: 'keep-all' }, subtitle),
          ]),
          h('div', { fontSize: 26, fontWeight: 700, color: sub }, SITE_NAME_EN),
        ],
      ),
    ],
  );

  const svg = await satori(tree as never, { width: 1200, height: 630, fonts: getFonts() });
  return Buffer.from(new Resvg(svg, { fitTo: { mode: 'width', value: 1200 } }).render().asPng());
}
