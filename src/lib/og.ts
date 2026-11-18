import { readFileSync } from 'node:fs';
import satori from 'satori';
import { Resvg } from '@resvg/resvg-js';
import { SITE_NAME, SITE_NAME_EN } from '../config';

/** OG 이미지(1200x630 PNG) 빌드 시 생성. 외부 이미지 없이 도형·텍스트만 쓰고, 색은 tokens.css(라이트) 값을 읽어 쓴다. */
const root = process.cwd();
const tokens = readFileSync(`${root}/src/styles/tokens.css`, 'utf8');
const lightBlock = tokens.slice(0, tokens.indexOf('prefers-color-scheme: dark'));
const color = (name: string): string => {
  const m = lightBlock.match(new RegExp(`--color-${name}:\\s*(#[0-9a-fA-F]{6})`));
  if (!m) throw new Error(`token not found: ${name}`);
  return m[1];
};

const font = (file: string): Buffer => readFileSync(`${root}/node_modules/pretendard/dist/public/static/${file}`);
let fonts: { name: string; data: Buffer; weight: 400 | 700 | 800; style: 'normal' }[] | null = null;
const getFonts = () =>
  (fonts ??= [
    { name: 'Pretendard', data: font('Pretendard-Regular.otf'), weight: 400, style: 'normal' },
    { name: 'Pretendard', data: font('Pretendard-Bold.otf'), weight: 700, style: 'normal' },
    { name: 'Pretendard', data: font('Pretendard-ExtraBold.otf'), weight: 800, style: 'normal' },
  ]);

type Node = { type: string; props: Record<string, unknown> };
const h = (type: string, style: Record<string, unknown>, children?: unknown): Node => ({
  type,
  props: { style: { display: 'flex', ...style }, children },
});

export async function renderOg(title: string, subtitle: string): Promise<Buffer> {
  const primary = color('primary');
  const soft = color('primary-soft');
  const text = color('text');
  const muted = color('text-muted');
  const bg = color('bg');
  const titleSize = title.length > 18 ? 60 : title.length > 10 ? 72 : 88;

  const tree = h(
    'div',
    { width: 1200, height: 630, boxSizing: 'border-box', background: bg, padding: 56, position: 'relative' },
    [
      // 장식: 우하단 원 도형 (primary-soft / primary)
      h('div', { position: 'absolute', right: -120, bottom: -140, width: 460, height: 460, borderRadius: 230, background: soft }),
      h('div', { position: 'absolute', right: 70, bottom: 60, width: 150, height: 150, borderRadius: 75, background: primary, opacity: 0.9 }),
      h(
        'div',
        {
          flexDirection: 'column',
          justifyContent: 'space-between',
          flex: 1,
          background: color('surface'),
          border: `2px solid ${color('border')}`,
          borderRadius: 32,
          padding: '56px 64px',
          position: 'relative',
        },
        [
          h('div', { alignItems: 'center', gap: 16 }, [
            h('div', { width: 20, height: 20, borderRadius: 10, background: primary }),
            h('div', { fontSize: 36, fontWeight: 800, color: primary }, SITE_NAME),
          ]),
          h('div', { flexDirection: 'column', gap: 24, maxWidth: 820 }, [
            h('div', { fontSize: titleSize, fontWeight: 800, color: text, lineHeight: 1.25, wordBreak: 'keep-all' }, title),
            h('div', { fontSize: 32, fontWeight: 400, color: muted, lineHeight: 1.5, wordBreak: 'keep-all' }, subtitle),
          ]),
          h('div', { fontSize: 26, fontWeight: 700, color: muted }, SITE_NAME_EN),
        ],
      ),
    ],
  );

  const svg = await satori(tree as never, { width: 1200, height: 630, fonts: getFonts() });
  return Buffer.from(new Resvg(svg, { fitTo: { mode: 'width', value: 1200 } }).render().asPng());
}
