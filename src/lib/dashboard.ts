/**
 * Data shaping for the home-page dashboard.
 *
 * Everything here runs at build time. The pages get plain numbers; no chart
 * library ships to the browser.
 */

export type Section = 'writeups' | 'papers' | 'notes' | 'projects' | 'competitions';

/**
 * Categorical slots, assigned to the ENTITY and never cycled — writeups are
 * always slot 1 whether or not papers exist, so a section appearing later
 * never repaints the others.
 *
 * Hues and steps are the reference categorical palette, re-ordered to lead
 * warm (a pure re-order — no hex changed). Validated against this site's own
 * surfaces (#fdfbf7 / #1a1512), both modes: worst adjacent CVD ΔE 23.1 light /
 * 17.3 dark, worst adjacent normal-vision ΔE 24.0 light / 20.9 dark.
 * Light mode warns on aqua (2.72:1) and yellow (2.09:1) against cream, so the
 * relief rule applies — every chart here ships direct labels and a table view.
 */
export const SERIES: Record<Section, { slot: number; label: string; href: string }> = {
  writeups:     { slot: 1, label: 'Writeups',     href: '/writeups' },
  papers:       { slot: 2, label: 'Papers',       href: '/papers' },
  notes:        { slot: 3, label: 'Notes',        href: '/notes' },
  projects:     { slot: 4, label: 'Projects',     href: '/projects' },
  competitions: { slot: 5, label: 'Competitions', href: '/competitions' },
};

/** Draw order = slot order, so stacks are consistent across every column. */
export const SECTION_ORDER: Section[] = ['writeups', 'papers', 'notes', 'projects', 'competitions'];

export type Bucket = {
  key: string;        // "2026-08"
  label: string;      // "Aug"
  year: number;
  counts: Record<Section, number>;
  total: number;
};

/** Calendar months ending with the current one, oldest first. */
export function monthBuckets(
  items: { section: Section; date: Date }[],
  months = 12,
  now = new Date()
): Bucket[] {
  const buckets: Bucket[] = [];
  const start = new Date(now.getFullYear(), now.getMonth() - (months - 1), 1);

  for (let i = 0; i < months; i++) {
    const d = new Date(start.getFullYear(), start.getMonth() + i, 1);
    buckets.push({
      key: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`,
      label: d.toLocaleDateString('en-GB', { month: 'short' }),
      year: d.getFullYear(),
      counts: { writeups: 0, papers: 0, notes: 0, projects: 0, competitions: 0 },
      total: 0,
    });
  }

  const index = new Map(buckets.map((b) => [b.key, b]));
  for (const item of items) {
    const key = `${item.date.getFullYear()}-${String(item.date.getMonth() + 1).padStart(2, '0')}`;
    const bucket = index.get(key);
    if (!bucket) continue; // older than the window
    bucket.counts[item.section]++;
    bucket.total++;
  }

  return buckets;
}

/** Axis ticks on round numbers — 0, 2, 4 rather than 0, 1.67, 3.33. */
export function niceTicks(max: number, target = 4): number[] {
  if (max <= 0) return [0, 1];
  const raw = max / target;
  const mag = Math.pow(10, Math.floor(Math.log10(raw)));
  const step = [1, 2, 2.5, 5, 10].map((m) => m * mag).find((s) => s >= raw) ?? 10 * mag;
  const top = Math.ceil(max / step) * step;
  const ticks: number[] = [];
  for (let v = 0; v <= top + 1e-9; v += step) ticks.push(Math.round(v * 100) / 100);
  return ticks;
}

/**
 * Rect with rounded top corners and a square baseline — the mark spec for a
 * column. Returns an SVG path `d`.
 */
export function columnPath(x: number, y: number, w: number, h: number, r = 4): string {
  const radius = Math.max(0, Math.min(r, w / 2, h));
  return [
    `M${x} ${y + h}`,
    `V${y + radius}`,
    `Q${x} ${y} ${x + radius} ${y}`,
    `H${x + w - radius}`,
    `Q${x + w} ${y} ${x + w} ${y + radius}`,
    `V${y + h}`,
    'Z',
  ].join(' ');
}

/** Same, rotated: rounded right end, square at the left baseline. */
export function barPath(x: number, y: number, w: number, h: number, r = 4): string {
  const radius = Math.max(0, Math.min(r, h / 2, w));
  return [
    `M${x} ${y}`,
    `H${x + w - radius}`,
    `Q${x + w} ${y} ${x + w} ${y + radius}`,
    `V${y + h - radius}`,
    `Q${x + w} ${y + h} ${x + w - radius} ${y + h}`,
    `H${x}`,
    'Z',
  ].join(' ');
}
