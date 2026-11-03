// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

export default defineConfig({
  site: 'https://temidayoxyz.github.io',
  base: '/blossie',
  integrations: [sitemap()],
  compressHTML: true,
  build: {
    format: 'directory',
  },
  prefetch: {
    defaultStrategy: 'hover',
  },
});
