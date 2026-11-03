export const prerender = true;

import { getSearchDocuments } from '../lib/articles';

export async function GET() {
  const documents = await getSearchDocuments();

  return new Response(JSON.stringify(documents), {
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'public, max-age=3600',
    },
  });
}
