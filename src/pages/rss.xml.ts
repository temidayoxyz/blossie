import rss from '@astrojs/rss';
import type { APIContext } from 'astro';
import { getAllArticles, getReadingTime } from '../lib/articles';

export const prerender = true;

export async function GET(context: APIContext) {
  const articles = await getAllArticles();
  const site = context.site ?? new URL('https://temidayoxyz.github.io');

  return rss({
    title: 'Blossie — The Journal',
    description:
      'Essays and notes on personal style, beauty, home, wellness, culture, and the lovely details of ordinary life.',
    site,
    xmlns: { atom: 'http://www.w3.org/2005/Atom' },
    customData: [
      '<language>en-us</language>',
      '<copyright>© Blossie</copyright>',
      `<atom:link href="${new URL('/rss.xml', site).toString()}" rel="self" type="application/rss+xml" />`,
    ].join(''),
    items: articles.map((article) => ({
      title: article.data.title,
      link: `/journal/${article.id}/`,
      pubDate: article.data.pubDate,
      description: article.data.excerpt,
      categories: [article.data.category, ...article.data.tags],
      author: article.data.author,
      customData: `<readingTime>${getReadingTime(article)} minutes</readingTime>`,
    })),
  });
}
