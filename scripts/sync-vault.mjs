#!/usr/bin/env node
/**
 * sync-vault.mjs — copy opt-in notes from the Obsidian vault into src/content/.
 *
 * A note is published ONLY if its frontmatter says so:
 *
 *     ---
 *     published: true
 *     ---
 *
 * Nothing else leaves the vault. Everything under src/content/ is regenerated
 * on every run, so deleting `published: true` un-publishes the note.
 *
 * Override the vault location with:  VAULT="D:/path/to/vault" npm run sync
 */

import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import matter from 'gray-matter';

// ---------------------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------------------

const ROOT = path.resolve(import.meta.dirname, '..');

const VAULT =
  process.env.VAULT ??
  path.resolve(process.env.USERPROFILE ?? process.env.HOME ?? '', 'OneDrive/Desktop/study 2eme');

/** Vault folder -> content collection. First match wins. */
const SOURCES = [
  { dir: 'Recherche/02-Notes-de-Lecture', collection: 'papers' },
  { dir: 'Recherche/03-Mon-Papier', collection: 'papers' },
  { dir: 'CTF/01-Writeups', collection: 'writeups' },
  { dir: 'CTF/02-Machines', collection: 'writeups' },
  { dir: 'CTF/04-Competitions', collection: 'competitions' },
  { dir: 'Projets', collection: 'projects' },
  { dir: 'CTF/03-Reflexes', collection: 'notes' },
  { dir: 'explanations', collection: 'notes' },
  { dir: 'Notes', collection: 'notes' },
];

const COLLECTIONS = ['papers', 'writeups', 'competitions', 'projects', 'notes'];

/** Never publish these, whatever the frontmatter says. */
const SKIP_NAMES = [/^README\.md$/i, /^TEMPLATE/i, /^Template-/i, /^_/, /^\./];

const ASSET_DIR = path.join(ROOT, 'public', 'vault-assets');
const IMAGE_EXT = /\.(png|jpe?g|gif|svg|webp|avif)$/i;

// ---------------------------------------------------------------------------
// Field translation — your vault writes French keys, the site reads English.
// ---------------------------------------------------------------------------

const KEY_ALIASES = {
  titre: 'title',
  resume: 'summary',
  'résumé': 'summary',
  description: 'summary',
  categorie: 'category',
  'catégorie': 'category',
  plateforme: 'platform',
  niveau: 'difficulty',
  difficulte: 'difficulty',
  statut: 'status',
  'temps-jusqu-au-flag': 'timeToFlag',
  temps: 'timeToFlag',
  auteurs: 'authors',
  auteur: 'authors',
  lien: 'link',
  url: 'link',
  annee: 'year',
  'année': 'year',
  lieu: 'venue',
  conference: 'venue',
  classement: 'rank',
  rang: 'rank',
  place: 'rank',
  equipe: 'team',
  'équipe': 'team',
  'nombre-equipes': 'totalTeams',
  participants: 'totalTeams',
  points: 'points',
  score: 'score',
  organisateur: 'organizer',
  brouillon: 'draft',
  publie: 'published',
  'publié': 'published',
  techniques: 'techniques',
  technique: 'techniques',
  outils: 'stack',
  stack: 'stack',
  depot: 'repo',
  'dépôt': 'repo',
  demo: 'demo',
  'cours-lie': 'relatedCourse',
  passe: 'pass',
  verdict: 'verdict',
  domaine: 'topic',
  domain: 'topic',
  sujet: 'topic',
};

const DIFFICULTY = {
  facile: 'easy',
  moyen: 'medium',
  moyenne: 'medium',
  difficile: 'hard',
  insane: 'insane',
  easy: 'easy',
  medium: 'medium',
  hard: 'hard',
};

const CATEGORY = {
  web: 'web',
  crypto: 'crypto',
  cryptographie: 'crypto',
  pwn: 'pwn',
  binaire: 'pwn',
  reverse: 'reverse',
  rev: 'reverse',
  forensics: 'forensics',
  forensique: 'forensics',
  osint: 'osint',
  network: 'network',
  reseau: 'network',
  'réseau': 'network',
  misc: 'misc',
  divers: 'misc',
};

// ---------------------------------------------------------------------------
// Small helpers
// ---------------------------------------------------------------------------

const log = {
  info: (m) => console.log(`  ${m}`),
  ok: (m) => console.log(`  \x1b[32m+\x1b[0m ${m}`),
  skip: (m) => console.log(`  \x1b[90m-\x1b[0m ${m}`),
  warn: (m) => console.log(`  \x1b[33m!\x1b[0m ${m}`),
  err: (m) => console.log(`  \x1b[31mx\x1b[0m ${m}`),
};

function slugify(str) {
  return String(str)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);
}

function walk(dir) {
  const out = [];
  if (!fs.existsSync(dir)) return out;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name.startsWith('.')) continue;
      out.push(...walk(full));
    } else if (entry.name.endsWith('.md')) {
      out.push(full);
    }
  }
  return out;
}

/** Every file in the vault, indexed by basename — used to resolve embeds. */
let assetIndex = null;
function findAsset(name) {
  if (!assetIndex) {
    assetIndex = new Map();
    const stack = [VAULT];
    while (stack.length) {
      const dir = stack.pop();
      let entries;
      try {
        entries = fs.readdirSync(dir, { withFileTypes: true });
      } catch {
        continue;
      }
      for (const e of entries) {
        if (e.name.startsWith('.')) continue;
        const full = path.join(dir, e.name);
        if (e.isDirectory()) stack.push(full);
        else if (IMAGE_EXT.test(e.name) && !assetIndex.has(e.name)) assetIndex.set(e.name, full);
      }
    }
  }
  return assetIndex.get(name) ?? null;
}

function truthy(value) {
  if (value === true) return true;
  if (typeof value === 'string') return ['true', 'yes', 'oui', '1'].includes(value.toLowerCase());
  return false;
}

function toArray(value) {
  if (value === undefined || value === null || value === '') return [];
  if (Array.isArray(value)) return value.map((v) => String(v).trim()).filter(Boolean);
  return String(value)
    .split(/[,;]/)
    .map((v) => v.trim())
    .filter(Boolean);
}

function toNumber(value) {
  if (value === undefined || value === null || value === '') return undefined;
  const n = Number(String(value).replace(/[^\d.-]/g, ''));
  return Number.isFinite(n) ? n : undefined;
}

function toDate(value, fallbackFile) {
  if (value instanceof Date && !isNaN(value)) return value;
  if (value) {
    const d = new Date(value);
    if (!isNaN(d)) return d;
  }
  // No date in the note — use the file's own mtime rather than today, so
  // re-syncing does not keep bumping old notes to the top of the list.
  return fs.statSync(fallbackFile).mtime;
}

// ---------------------------------------------------------------------------
// Safety net — an opt-in flag is only as good as what is inside the file.
// ---------------------------------------------------------------------------

const BLOCKERS = [
  { re: /-----BEGIN (RSA |OPENSSH |EC |DSA |PGP )?PRIVATE KEY-----/, what: 'a private key' },
  { re: /\b(AKIA|ASIA)[0-9A-Z]{16}\b/, what: 'an AWS access key id' },
  { re: /\bgh[pousr]_[A-Za-z0-9]{20,}\b/, what: 'a GitHub token' },
];

const WARNINGS = [
  { re: /\bC:\\Users\\[A-Za-z0-9._-]+/i, what: 'a local Windows path with your username' },
  { re: /\b(?:password|passwd|mot de passe)\s*[:=]\s*\S{4,}/i, what: 'what looks like a password' },
  { re: /\b\d{1,3}(?:\.\d{1,3}){3}\b/, what: 'an IP address (fine for CTF targets, check it is not yours)' },
];

function screen(text, label) {
  for (const { re, what } of BLOCKERS) {
    if (re.test(text)) {
      log.err(`${label} — NOT published: contains ${what}`);
      return false;
    }
  }
  for (const { re, what } of WARNINGS) {
    if (re.test(text)) log.warn(`${label} — contains ${what}`);
  }
  return true;
}

// ---------------------------------------------------------------------------
// Frontmatter normalisation
// ---------------------------------------------------------------------------

function normalizeKeys(data) {
  const out = {};
  for (const [key, value] of Object.entries(data)) {
    out[KEY_ALIASES[key.toLowerCase()] ?? key] = value;
  }
  return out;
}

/** Drop hierarchical tags that only repeat a structured field, and empty stubs. */
function cleanTags(raw) {
  return toArray(raw)
    .map((t) => t.replace(/^#/, '').trim())
    .filter((t) => t && !/\/$/.test(t))
    .filter((t) => !/^(statut|status|plateforme|platform|niveau)\//i.test(t))
    .map((t) => t.replace(/^(ctf|technique|topic|tag)\//i, ''))
    .filter(Boolean);
}

function buildFrontmatter(collection, fm, file, sourceRel) {
  const title =
    fm.title ??
    fm.event ??
    path.basename(file, '.md').replace(/[-_]/g, ' ');

  const base = {
    title: String(title).trim(),
    date: toDate(fm.date, file),
    summary: fm.summary ? String(fm.summary).trim() : undefined,
    tags: cleanTags(fm.tags),
    draft: truthy(fm.draft),
    featured: truthy(fm.featured),
    source: sourceRel.replace(/\\/g, '/'),
  };
  if (fm.updated) base.updated = toDate(fm.updated, file);

  if (collection === 'papers') {
    return {
      ...base,
      authors: toArray(fm.authors),
      venue: fm.venue ? String(fm.venue) : undefined,
      year: toNumber(fm.year),
      link: fm.link ? String(fm.link) : undefined,
      pass: [1, 2, 3].includes(toNumber(fm.pass)) ? toNumber(fm.pass) : undefined,
      rating: toNumber(fm.rating),
      verdict: fm.verdict ? String(fm.verdict).trim() : undefined,
      relatedCourse: fm.relatedCourse ? String(fm.relatedCourse) : undefined,
    };
  }

  if (collection === 'writeups') {
    const cat = CATEGORY[String(fm.category ?? '').toLowerCase()] ?? 'misc';
    const diff = DIFFICULTY[String(fm.difficulty ?? '').toLowerCase()];
    const statusRaw = String(fm.status ?? '').toLowerCase();
    return {
      ...base,
      category: cat,
      platform: fm.platform ? String(fm.platform) : undefined,
      event: fm.event ? String(fm.event) : undefined,
      difficulty: diff,
      points: toNumber(fm.points),
      solved: statusRaw ? !/non|unsolved|echec|abandon/.test(statusRaw) : true,
      timeToFlag: fm.timeToFlag ? String(fm.timeToFlag) : undefined,
      techniques: toArray(fm.techniques),
    };
  }

  if (collection === 'competitions') {
    // The vault template writes rank as "3 / 412" — accept that as well as
    // separate rank / totalTeams fields.
    let rank = toNumber(fm.rank);
    let total = toNumber(fm.totalTeams);
    const pair = String(fm.rank ?? '').match(/^\s*(\d+)\s*\/\s*(\d+)\s*$/);
    if (pair) {
      rank = Number(pair[1]);
      total = total ?? Number(pair[2]);
    }
    if (rank === 0) rank = undefined;
    if (total === 0) total = undefined;
    return {
      ...base,
      event: String(fm.event ?? title).trim(),
      organizer: fm.organizer ? String(fm.organizer) : undefined,
      format: ['jeopardy', 'attack-defense', 'king-of-the-hill', 'other'].includes(fm.format)
        ? fm.format
        : 'jeopardy',
      team: fm.team ? String(fm.team) : undefined,
      teamSize: toNumber(fm.teamSize),
      rank,
      totalTeams: total,
      score: toNumber(fm.score),
      maxScore: toNumber(fm.maxScore),
      solvedCount: toNumber(fm.solvedCount),
      percentile: rank && total ? Math.max(1, Math.round((rank / total) * 100)) : undefined,
      scope: ['international', 'national', 'regional', 'university', 'online'].includes(fm.scope)
        ? fm.scope
        : undefined,
      url: fm.link ? String(fm.link) : undefined,
    };
  }

  if (collection === 'notes') {
    const name = path.basename(file, '.md');
    return {
      ...base,
      topic: fm.topic
        ? (CATEGORY[String(fm.topic).toLowerCase()] ?? String(fm.topic).toLowerCase())
        : undefined,
      kind: ['reflex', 'deep-dive', 'note'].includes(fm.kind)
        ? fm.kind
        : /^Reflexe?-/i.test(name)
          ? 'reflex'
          : 'note',
    };
  }

  // projects
  return {
    ...base,
    status: ['active', 'shipped', 'paused', 'archived'].includes(fm.status) ? fm.status : 'active',
    role: fm.role ? String(fm.role) : undefined,
    stack: toArray(fm.stack),
    repo: fm.repo ? String(fm.repo) : undefined,
    demo: fm.demo ? String(fm.demo) : undefined,
    cover: fm.cover ? String(fm.cover) : undefined,
    results: toArray(fm.results),
  };
}

/** gray-matter would happily write `key: undefined` — strip those first. */
function prune(obj) {
  return Object.fromEntries(
    Object.entries(obj).filter(([, v]) => v !== undefined && !(Array.isArray(v) && v.length === 0))
  );
}

// ---------------------------------------------------------------------------
// Body rewriting: Obsidian syntax -> plain Markdown
// ---------------------------------------------------------------------------

function rewriteBody(body, linkMap, label) {
  let out = body;

  // ![[image.png]] — copy the asset out of the vault and point at it.
  out = out.replace(/!\[\[([^\]|]+?)(?:\|[^\]]*)?\]\]/g, (whole, target) => {
    const name = target.trim();
    if (!IMAGE_EXT.test(name)) return '';
    const src = findAsset(name);
    if (!src) {
      log.warn(`${label} — embedded image not found in vault: ${name}`);
      return '';
    }
    const safe = slugify(path.basename(name, path.extname(name))) + path.extname(name).toLowerCase();
    fs.mkdirSync(ASSET_DIR, { recursive: true });
    fs.copyFileSync(src, path.join(ASSET_DIR, safe));
    return `![](/vault-assets/${safe})`;
  });

  // [[Note]] and [[Note|alias]] — internal link if published, plain text if not.
  out = out.replace(/\[\[([^\]|]+?)(?:\|([^\]]+))?\]\]/g, (whole, target, alias) => {
    const key = slugify(target.trim());
    const text = (alias ?? target).trim();
    const href = linkMap.get(key);
    return href ? `[${text}](${href})` : text;
  });

  // Obsidian callouts -> plain blockquote with a bold label.
  out = out.replace(/^>\s*\[!(\w+)\]\s*(.*)$/gm, (whole, kind, rest) => {
    const title = rest.trim() || kind.charAt(0).toUpperCase() + kind.slice(1).toLowerCase();
    return `> **${title}**`;
  });

  // Inline #tags at the start of a line are Obsidian bookkeeping, not prose.
  out = out.replace(/^#(?![# ])[\w\/-]+(\s+#[\w\/-]+)*\s*$/gm, '');

  return out.trim() + '\n';
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

function main() {
  console.log(`\nSyncing from vault: ${VAULT}`);

  if (!fs.existsSync(VAULT)) {
    console.error(`\n  Vault not found at ${VAULT}`);
    console.error(`  Set it explicitly:  VAULT="D:/your/vault" npm run sync\n`);
    process.exit(1);
  }

  // Pass 1 — find everything marked published, so wikilinks can resolve.
  const candidates = [];
  for (const { dir, collection } of SOURCES) {
    const abs = path.join(VAULT, dir);
    for (const file of walk(abs)) {
      const name = path.basename(file);
      if (SKIP_NAMES.some((re) => re.test(name))) continue;

      let parsed;
      try {
        parsed = matter(fs.readFileSync(file, 'utf8'));
      } catch (err) {
        log.err(`${name} — unreadable frontmatter (${err.message})`);
        continue;
      }

      const fm = normalizeKeys(parsed.data ?? {});
      if (!truthy(fm.published)) continue;

      const slug = slugify(fm.slug ?? path.basename(file, '.md'));
      candidates.push({ file, collection, fm, body: parsed.content, slug, dir });
    }
  }

  const linkMap = new Map(candidates.map((c) => [slugify(path.basename(c.file, '.md')), `/${c.collection}/${c.slug}`]));

  // Astro 5 keeps the content layer in node_modules/.astro. Its glob loader
  // does not reliably drop entries whose file disappeared between runs, so an
  // unpublished note would keep building. Clearing the cache here is what
  // makes "remove the flag" actually remove the page.
  for (const cache of [path.join(ROOT, 'node_modules', '.astro'), path.join(ROOT, '.astro')]) {
    fs.rmSync(cache, { recursive: true, force: true });
  }

  // Wipe generated content so unpublishing actually removes the page.
  for (const collection of COLLECTIONS) {
    const dir = path.join(ROOT, 'src', 'content', collection);
    fs.mkdirSync(dir, { recursive: true });
    for (const f of fs.readdirSync(dir)) {
      if (f.endsWith('.md') || f.endsWith('.mdx')) fs.unlinkSync(path.join(dir, f));
    }
  }

  // Pass 2 — write.
  const counts = { papers: 0, writeups: 0, competitions: 0, projects: 0, notes: 0 };
  const seen = new Set();
  let blocked = 0;

  for (const c of candidates) {
    const label = path.relative(VAULT, c.file).replace(/\\/g, '/');

    if (!screen(c.body, label)) {
      blocked++;
      continue;
    }

    let slug = c.slug;
    let n = 2;
    while (seen.has(`${c.collection}/${slug}`)) slug = `${c.slug}-${n++}`;
    seen.add(`${c.collection}/${slug}`);

    const data = prune(buildFrontmatter(c.collection, c.fm, c.file, label));
    const body = rewriteBody(c.body, linkMap, label);
    const out = path.join(ROOT, 'src', 'content', c.collection, `${slug}.md`);

    fs.writeFileSync(out, matter.stringify(body, data), 'utf8');
    counts[c.collection]++;
    log.ok(`${c.collection}/${slug}.md  \x1b[90m<- ${label}\x1b[0m`);
  }

  const total = Object.values(counts).reduce((a, b) => a + b, 0);
  console.log(
    `\n  ${total} published: ` +
      Object.entries(counts)
        .map(([k, v]) => `${v} ${k}`)
        .join(', ') +
      (blocked ? `  \x1b[31m(${blocked} blocked)\x1b[0m` : '')
  );

  if (total === 0) {
    console.log(
      `\n  Nothing to publish yet. Add this to a note's frontmatter:\n` +
        `\n      ---\n      published: true\n      ---\n`
    );
  }
  console.log('');
}

main();
