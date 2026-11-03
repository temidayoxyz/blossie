import type { ImageMetadata } from 'astro';
import beauty from '../assets/images/topic-beauty.jpg';
import culture from '../assets/images/topic-culture.jpg';
import home from '../assets/images/topic-home.jpg';
import lifestyle from '../assets/images/topic-lifestyle.jpg';
import style from '../assets/images/topic-style.jpg';
import wellness from '../assets/images/topic-wellness.jpg';

export interface Topic {
  slug: string;
  name: string;
  category:
    | 'Lifestyle'
    | 'Beauty'
    | 'Personal Style'
    | 'Wellness'
    | 'Home & Living'
    | 'Culture';
  shortDescription: string;
  description: string;
  image: ImageMetadata;
  imageAlt: string;
}

export const topics: Topic[] = [
  {
    slug: 'lifestyle',
    name: 'Lifestyle',
    category: 'Lifestyle',
    shortDescription: 'Mornings, meals, rituals, and the texture of an ordinary day.',
    description:
      'The way a morning starts. A table set without occasion. The small habits that give a week its shape. Lifestyle at Blossie is not about doing more beautifully; it is about noticing what is already here.',
    image: lifestyle,
    imageAlt: 'An open book and a cup of coffee resting together in warm light.',
  },
  {
    slug: 'beauty',
    name: 'Beauty',
    category: 'Beauty',
    shortDescription: 'Skin, scent, and routines built on care rather than correction.',
    description:
      'We are interested in beauty as a daily practice rather than a problem to solve: the products that earn their place, the rituals that settle us, and the pleasure of looking after the skin we are in.',
    image: beauty,
    imageAlt: 'A collection of amber and cream skincare bottles arranged on a bathroom shelf.',
  },
  {
    slug: 'style',
    name: 'Personal Style',
    category: 'Personal Style',
    shortDescription: 'Clothes as a language — and the confidence to trust your own eye.',
    description:
      'Not trends for their own sake, but the quieter work of knowing what suits you, what you reach for, and why. Personal style is a conversation between memory, body, and the life you actually live.',
    image: style,
    imageAlt: 'A woman in a soft grey top standing in quiet, directional light.',
  },
  {
    slug: 'wellness',
    name: 'Wellness',
    category: 'Wellness',
    shortDescription: 'Rest, attention, and honest ways to feel at home in your days.',
    description:
      'Less optimisation, more listening. We write about rest without guilt, energy as a finite resource, and the small adjustments that make a life feel more spacious — without pretending there is one right way.',
    image: wellness,
    imageAlt: 'A warm bath scattered with petals, with candles resting on a wooden bath tray.',
  },
  {
    slug: 'home',
    name: 'Home & Living',
    category: 'Home & Living',
    shortDescription: 'Rooms that hold a life: light, objects, order, and quiet work.',
    description:
      'A home is never only a backdrop. It is the stage for breakfast, arguments, folded linen, and late-night reading. These are stories about making rooms that support the life inside them, not just the photograph of it.',
    image: home,
    imageAlt: 'Spring flowers and candles arranged on a table beside a soft pink sofa.',
  },
  {
    slug: 'culture',
    name: 'Culture',
    category: 'Culture',
    shortDescription: 'Books, tables, keepsakes, and the ways we make meaning together.',
    description:
      'The long lunch, the box of letters, the book pressed open on the arm of a chair. Culture here is the everyday material of memory and connection — what we read, save, share, and gather around.',
    image: culture,
    imageAlt: 'A woman reading on a bed in a bright room with plants and framed art.',
  },
];

export const topicsBySlug = new Map(topics.map((topic) => [topic.slug, topic]));

export const topicByCategory = new Map(
  topics.map((topic) => [topic.category, topic]),
);

export function getTopic(slug: string): Topic | undefined {
  return topicsBySlug.get(slug);
}

export function getTopicForCategory(category: string): Topic | undefined {
  return topicByCategory.get(
    category as
      | 'Lifestyle'
      | 'Beauty'
      | 'Personal Style'
      | 'Wellness'
      | 'Home & Living'
      | 'Culture',
  );
}

export const topicSlugs = topics.map((topic) => topic.slug);
