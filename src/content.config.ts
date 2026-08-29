import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

/** Fields every publishable note shares. */
const common = {
  title: z.string(),
  date: z.coerce.date(),
  updated: z.coerce.date().optional(),
  summary: z.string().optional(),
  tags: z.array(z.string()).default([]),
  draft: z.boolean().default(false),
  featured: z.boolean().default(false),
  /** Set by the sync script so a page can link back to the source note. */
  source: z.string().optional(),
};

// --- Papers I read + my notes on them -------------------------------------
const papers = defineCollection({
  loader: glob({ base: './src/content/papers', pattern: '**/*.{md,mdx}' }),
  schema: z.object({
    ...common,
    authors: z.array(z.string()).default([]),
    venue: z.string().optional(),          // "USENIX Security 2023"
    year: z.number().optional(),
    link: z.string().optional(),           // DOI or arXiv URL
    /** How deeply you read it — matches the 3-pass method in your vault. */
    pass: z.union([z.literal(1), z.literal(2), z.literal(3)]).optional(),
    rating: z.number().min(1).max(5).optional(),
    verdict: z.string().optional(),        // one-line takeaway, shown on the card
    relatedCourse: z.string().optional(),
  }),
});

// --- CTF challenge / machine writeups --------------------------------------
const writeups = defineCollection({
  loader: glob({ base: './src/content/writeups', pattern: '**/*.{md,mdx}' }),
  schema: z.object({
    ...common,
    category: z
      .enum(['web', 'crypto', 'pwn', 'reverse', 'forensics', 'osint', 'network', 'misc'])
      .default('misc'),
    platform: z.string().optional(),       // picoctf, hackthebox, tryhackme, rootme...
    event: z.string().optional(),          // links a writeup to a competition
    difficulty: z.enum(['easy', 'medium', 'hard', 'insane']).optional(),
    points: z.number().optional(),
    solved: z.boolean().default(true),
    timeToFlag: z.string().optional(),     // "01h20"
    techniques: z.array(z.string()).default([]),
  }),
});

// --- Competitions and where I placed ---------------------------------------
const competitions = defineCollection({
  loader: glob({ base: './src/content/competitions', pattern: '**/*.{md,mdx}' }),
  schema: z.object({
    ...common,
    event: z.string(),                     // "picoCTF 2026"
    organizer: z.string().optional(),
    format: z.enum(['jeopardy', 'attack-defense', 'king-of-the-hill', 'other']).default('jeopardy'),
    team: z.string().optional(),
    teamSize: z.number().optional(),
    rank: z.number().optional(),
    totalTeams: z.number().optional(),
    score: z.number().optional(),
    maxScore: z.number().optional(),
    solvedCount: z.number().optional(),
    percentile: z.number().optional(),     // computed by sync if rank+totalTeams given
    scope: z.enum(['international', 'national', 'regional', 'university', 'online']).optional(),
    url: z.string().optional(),
    certificate: z.string().optional(),    // path to an image in /public
  }),
});

// --- Personal projects ------------------------------------------------------
const projects = defineCollection({
  loader: glob({ base: './src/content/projects', pattern: '**/*.{md,mdx}' }),
  schema: z.object({
    ...common,
    status: z.enum(['active', 'shipped', 'paused', 'archived']).default('active'),
    role: z.string().optional(),
    stack: z.array(z.string()).default([]),
    repo: z.string().optional(),
    demo: z.string().optional(),
    cover: z.string().optional(),
    /** The numbers that make a project credible. "94.2% F1 on CIC-IDS2017" */
    results: z.array(z.string()).default([]),
  }),
});

// --- Standalone technical notes (concepts, reflexes, deep dives) -----------
const notes = defineCollection({
  loader: glob({ base: './src/content/notes', pattern: '**/*.{md,mdx}' }),
  schema: z.object({
    ...common,
    /** web, crypto, forensics, linux, network... free-form on purpose. */
    topic: z.string().optional(),
    /** "reflex" = a short first-moves checklist. "deep-dive" = the long form. */
    kind: z.enum(['reflex', 'deep-dive', 'note']).default('note'),
  }),
});

export const collections = { papers, writeups, competitions, projects, notes };
