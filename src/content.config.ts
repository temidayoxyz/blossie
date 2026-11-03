import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

const articles = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/articles' }),
  schema: ({ image }) =>
    z.object({
      title: z.string(),
      standfirst: z.string(),
      excerpt: z.string(),
      category: z.enum([
        'Lifestyle',
        'Beauty',
        'Personal Style',
        'Wellness',
        'Home & Living',
        'Culture',
      ]),
      pubDate: z.coerce.date(),
      author: z.string().default('The Blossie Editors'),
      cover: image(),
      coverAlt: z.string(),
      coverCaption: z.string().optional(),
      coverCredit: z.string().default('Photography via Pexels'),
      featured: z.boolean().default(false),
      editorsPick: z.boolean().default(false),
      tags: z.array(z.string()).default([]),
    }),
});

export const collections = { articles };
