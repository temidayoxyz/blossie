import { getCollection, type CollectionEntry } from 'astro:content';
import { getTopicForCategory, type Topic } from '../data/topics';

export type Article = CollectionEntry<'articles'>;

const dateFormatter = new Intl.DateTimeFormat('en-US', {
  month: 'long',
  day: 'numeric',
  year: 'numeric',
  timeZone: 'UTC',
});

const shortDateFormatter = new Intl.DateTimeFormat('en-US', {
  month: 'short',
  day: 'numeric',
  year: 'numeric',
  timeZone: 'UTC',
});

const monthFormatter = new Intl.DateTimeFormat('en-US', {
  month: 'long',
  year: 'numeric',
  timeZone: 'UTC',
});

const monthOnlyFormatter = new Intl.DateTimeFormat('en-US', {
  month: 'long',
  timeZone: 'UTC',
});

const dayFormatter = new Intl.DateTimeFormat('en-US', {
  day: '2-digit',
  timeZone: 'UTC',
});

export function formatDate(date: Date): string {
  return dateFormatter.format(date);
}

export function formatShortDate(date: Date): string {
  return shortDateFormatter.format(date);
}

export function formatMonth(date: Date): string {
  return monthFormatter.format(date);
}

export function formatDay(date: Date): string {
  return dayFormatter.format(date);
}

export function getReadingTime(article: Article): number {
  const words = article.body?.trim().split(/\s+/).filter(Boolean).length ?? 0;
  return Math.max(1, Math.ceil(words / 220));
}

export function getArticleUrl(article: Article): string {
  return `/journal/${article.id}/`;
}

export function getTopicFor(article: Article): Topic | undefined {
  return getTopicForCategory(article.data.category);
}

export async function getAllArticles(): Promise<Article[]> {
  const articles = await getCollection('articles');
  return articles.sort(
    (a, b) => b.data.pubDate.valueOf() - a.data.pubDate.valueOf(),
  );
}

export async function getFeaturedArticle(): Promise<Article | null> {
  const articles = await getAllArticles();
  return (
    articles.find((article) => article.data.featured) ??
    articles[0] ??
    null
  );
}

export function getRelatedArticles(
  article: Article,
  articles: Article[],
  limit = 3,
): Article[] {
  const ranked = articles
    .filter((entry) => entry.id !== article.id)
    .map((entry) => {
      let score = 0;
      if (entry.data.category === article.data.category) score += 4;
      const sharedTags = entry.data.tags.filter((tag) =>
        article.data.tags.includes(tag),
      );
      score += sharedTags.length * 2;
      return { entry, score };
    })
    .sort(
      (a, b) =>
        b.score - a.score ||
        b.entry.data.pubDate.valueOf() - a.entry.data.pubDate.valueOf(),
    );

  return ranked.slice(0, limit).map(({ entry }) => entry);
}

export function getCategoryCounts(articles: Article[]): Map<string, number> {
  const counts = new Map<string, number>();
  for (const article of articles) {
    counts.set(article.data.category, (counts.get(article.data.category) ?? 0) + 1);
  }
  return counts;
}

export function getArchiveGroups(articles: Article[]): {
  year: number;
  months: {
    key: string;
    label: string;
    articles: Article[];
  }[];
}[] {
  const years = new Map<
    number,
    Map<string, { label: string; articles: Article[] }>
  >();

  for (const article of articles) {
    const year = article.data.pubDate.getUTCFullYear();
    const monthKey = `${year}-${String(article.data.pubDate.getUTCMonth() + 1).padStart(2, '0')}`;
    if (!years.has(year)) years.set(year, new Map());
    const months = years.get(year);
    if (!months) continue;
    if (!months.has(monthKey)) {
      months.set(monthKey, {
        label: monthOnlyFormatter.format(article.data.pubDate),
        articles: [],
      });
    }
    months.get(monthKey)?.articles.push(article);
  }

  return [...years.entries()]
    .sort(([a], [b]) => b - a)
    .map(([year, months]) => ({
      year,
      months: [...months.entries()]
        .sort(([a], [b]) => b.localeCompare(a))
        .map(([key, value]) => ({
          key,
          label: value.label,
          articles: value.articles,
        })),
    }));
}

export function stripMarkdown(markdown: string): string {
  return markdown
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/!\[[^\]]*\]\([^)]*\)/g, ' ')
    .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
    .replace(/[#>*_~`|-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export async function getSearchDocuments(): Promise<
  {
    title: string;
    url: string;
    category: string;
    excerpt: string;
    standfirst: string;
    tags: string[];
    date: string;
    readingTime: number;
    body: string;
  }[]
> {
  const articles = await getAllArticles();
  return articles.map((article) => ({
    title: article.data.title,
    url: getArticleUrl(article),
    category: article.data.category,
    excerpt: article.data.excerpt,
    standfirst: article.data.standfirst,
    tags: article.data.tags,
    date: article.data.pubDate.toISOString(),
    readingTime: getReadingTime(article),
    body: stripMarkdown(article.body ?? '').slice(0, 12000),
  }));
}
