export const prerender = true;

import type { APIContext } from 'astro';

export function GET(context: APIContext) {
  const site = context.site ?? new URL('https://temidayoxyz.github.io');
  const base = site.toString().replace(/\/$/, '');

  const body = [
    'User-agent: *',
    'Allow: /',
    '',
    `Sitemap: ${base}/sitemap-index.xml`,
    '',
  ].join('\n');

  return new Response(body, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
    },
  });
}
