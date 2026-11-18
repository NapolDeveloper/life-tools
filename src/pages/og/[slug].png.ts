import type { APIRoute, GetStaticPaths } from 'astro';
import { PAGES } from '../../lib/pages';
import { renderOg } from '../../lib/og';

export const getStaticPaths: GetStaticPaths = () =>
  PAGES.map((p) => ({ params: { slug: p.ogSlug }, props: { title: p.ogTitle, subtitle: p.ogSubtitle } }));

export const GET: APIRoute = async ({ props }) => {
  const png = await renderOg(props.title, props.subtitle);
  return new Response(new Uint8Array(png), { headers: { 'Content-Type': 'image/png' } });
};
