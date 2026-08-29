import rss from '@astrojs/rss';
import { getCollection } from 'astro:content';
import { SITE } from '../config';

/** One feed for everything, so a subscriber does not have to pick a section. */
export async function GET(context) {
  const sections = [
    ['papers', 'Paper'],
    ['writeups', 'Writeup'],
    ['competitions', 'Competition'],
    ['projects', 'Project'],
    ['notes', 'Note'],
  ];

  const items = [];

  for (const [name, label] of sections) {
    const entries = await getCollection(name);
    for (const entry of entries) {
      if (entry.data.draft) continue;
      items.push({
        title: `${label}: ${entry.data.title}`,
        pubDate: entry.data.date,
        description:
          entry.data.summary ??
          entry.data.verdict ??
          `${label} — ${entry.data.title}`,
        link: `/${name}/${entry.id}/`,
        categories: entry.data.tags ?? [],
      });
    }
  }

  items.sort((a, b) => b.pubDate.valueOf() - a.pubDate.valueOf());

  return rss({
    title: SITE.title,
    description: SITE.description,
    site: context.site ?? SITE.url,
    items,
    customData: '<language>en</language>',
  });
}
