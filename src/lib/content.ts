import { getCollection, type CollectionEntry } from 'astro:content';

/** Anything with a date and a draft flag. */
type Dated = { data: { date: Date; draft?: boolean } };

const isProd = import.meta.env.PROD;

/** Drafts are visible in `npm run dev`, hidden in the built site. */
export function visible<T extends Dated>(entries: T[]): T[] {
  return isProd ? entries.filter((e) => !e.data.draft) : entries;
}

export function byDateDesc<T extends Dated>(a: T, b: T): number {
  return b.data.date.valueOf() - a.data.date.valueOf();
}

/** getCollection + drafts filtered + newest first. Use this everywhere. */
export async function loadCollection<C extends 'papers' | 'writeups' | 'competitions' | 'projects' | 'notes'>(
  name: C
): Promise<CollectionEntry<C>[]> {
  const entries = await getCollection(name);
  return visible(entries as Dated[] as CollectionEntry<C>[]).sort(byDateDesc as never);
}

export function formatDate(date: Date): string {
  return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

export function formatMonth(date: Date): string {
  return date.toLocaleDateString('en-GB', { month: 'short', year: 'numeric' });
}

export function isoDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

/** Top-N tag counts across any set of entries. */
export function tagCounts(entries: { data: { tags?: string[] } }[]): [string, number][] {
  const counts = new Map<string, number>();
  for (const entry of entries) {
    for (const tag of entry.data.tags ?? []) {
      counts.set(tag, (counts.get(tag) ?? 0) + 1);
    }
  }
  return [...counts.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
}

export function slugifyTag(tag: string): string {
  return tag
    .toLowerCase()
    .replace(/[^a-z0-9/]+/g, '-')
    .replace(/\//g, '--')
    .replace(/^-+|-+$/g, '');
}

/** Best-effort first paragraph, for cards when no summary was written. */
export function excerpt(body: string | undefined, max = 180): string {
  if (!body) return '';
  const text = body
    .replace(/^---[\s\S]*?---/, '')
    .replace(/```[\s\S]*?```/g, '')
    .replace(/^\s*[#>|\-*].*$/gm, '')
    .replace(/!?\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/[*_`]/g, '')
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .find((p) => p.length > 40);
  if (!text) return '';
  return text.length > max ? text.slice(0, max).replace(/\s+\S*$/, '') + '…' : text;
}

/** 1st / 2nd / 3rd / 4th */
export function ordinal(n: number): string {
  const s = ['th', 'st', 'nd', 'rd'];
  const v = n % 100;
  return n + (s[(v - 20) % 10] ?? s[v] ?? s[0]);
}

export function rankClass(rank?: number): string {
  if (rank === 1) return 'rank rank--gold';
  if (rank === 2) return 'rank rank--silver';
  if (rank === 3) return 'rank rank--bronze';
  return 'rank';
}

/** "Top 4%" — only meaningful when we know the field size. */
export function topPercent(rank?: number, total?: number): number | null {
  if (!rank || !total || total <= 0) return null;
  return Math.max(1, Math.round((rank / total) * 100));
}
