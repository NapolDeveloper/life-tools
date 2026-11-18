import type { APIRoute } from 'astro';
import { SITE_NAME, SITE_URL, TOOLS } from '../config';

const esc = (s: string): string =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const rfc822 = (iso: string): string => new Date(`${iso}T00:00:00+09:00`).toUTCString();
const abs = (path: string): string => new URL(path, SITE_URL).href;

export const GET: APIRoute = () => {
  const items = [...TOOLS]
    .sort((a, b) => b.published.localeCompare(a.published))
    .map(
      (t) => `    <item>
      <title>${esc(t.name)}</title>
      <link>${abs(`/${t.slug}/`)}</link>
      <guid isPermaLink="true">${abs(`/${t.slug}/`)}</guid>
      <pubDate>${rfc822(t.published)}</pubDate>
      <description>${esc(t.description)}</description>
    </item>`,
    )
    .join('\n');
  const latest = TOOLS.map((t) => t.updated).sort().at(-1) ?? TOOLS[0].published;
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${esc(SITE_NAME)} 새 소식</title>
    <link>${abs('/')}</link>
    <description>${esc(SITE_NAME)}의 새 계산기와 업데이트 소식이에요.</description>
    <language>ko</language>
    <lastBuildDate>${rfc822(latest)}</lastBuildDate>
    <atom:link href="${abs('/rss.xml')}" rel="self" type="application/rss+xml" />
${items}
  </channel>
</rss>
`;
  return new Response(xml, { headers: { 'Content-Type': 'application/rss+xml; charset=utf-8' } });
};
