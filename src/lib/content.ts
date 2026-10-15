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
export type CollectionName =
  | 'posts'
  | 'notes'
  | 'cheatsheets'
  | 'papers'
  | 'writeups'
  | 'competitions'
  | 'projects';

export async function loadCollection<C extends CollectionName>(
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

/** "6 min read", from the raw markdown body at ~220 words a minute. */
export function readingTime(body: string | undefined): string {
  if (!body) return '1 min read';
  const words = body
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/<[^>]+>/g, ' ')
    .split(/\s+/)
    .filter(Boolean).length;
  return `${Math.max(1, Math.round(words / 220))} min read`;
}

/**
 * Filter chips for a list page: every distinct value, most used first,
 * as { value: slug, label: original }.
 */
export function chipList(values: string[][]): { value: string; label: string }[] {
  const counts = new Map<string, { label: string; n: number }>();
  for (const list of values) {
    for (const label of new Set(list.filter(Boolean))) {
      const value = slugifyTag(label);
      if (!value) continue;
      const hit = counts.get(value);
      if (hit) hit.n++;
      else counts.set(value, { label, n: 1 });
    }
  }
  return [...counts.entries()]
    .sort((a, b) => b[1].n - a[1].n || a[1].label.localeCompare(b[1].label))
    .map(([value, { label }]) => ({ value, label }));
}

/** The matching `data-chips` string for one entry. */
export function chipAttr(values: (string | undefined)[]): string {
  return values.filter((v): v is string => !!v).map(slugifyTag).filter(Boolean).join(' ');
}

// ---------------------------------------------------------------------------
// Levels
// ---------------------------------------------------------------------------

export type Level = 'beginner' | 'intermediate' | 'advanced';

export const LEVELS: { value: Level; label: string; rank: number }[] = [
  { value: 'beginner', label: 'Beginner', rank: 1 },
  { value: 'intermediate', label: 'Intermediate', rank: 2 },
  { value: 'advanced', label: 'Advanced', rank: 3 },
];

/** 1 / 2 / 3 for sorting easy -> hard; 0 when the note has no level. */
export function levelRank(level?: string): number {
  return LEVELS.find((l) => l.value === level)?.rank ?? 0;
}

export function levelLabel(level?: string): string | undefined {
  return LEVELS.find((l) => l.value === level)?.label;
}

/** Posts sharing a series, in reading order. */
export function seriesOf<T extends { data: { series?: string; seriesOrder?: number; date: Date } }>(
  all: T[],
  series: string
): T[] {
  return all
    .filter((p) => p.data.series === series)
    .sort(
      (a, b) =>
        (a.data.seriesOrder ?? Infinity) - (b.data.seriesOrder ?? Infinity) ||
        a.data.date.valueOf() - b.data.date.valueOf()
    );
}

/** { beginner: 3, intermediate: 1, advanced: 0 } for the level buttons. */
export function levelCounts(entries: { data: { level?: string } }[]): Record<string, number> {
  const out: Record<string, number> = {};
  for (const e of entries) if (e.data.level) out[e.data.level] = (out[e.data.level] ?? 0) + 1;
  return out;
}
