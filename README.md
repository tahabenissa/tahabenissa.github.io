# Blog

Personal site for papers, CTF writeups, competition results, projects and technical notes.
Content is written in Obsidian and published from the vault — the site never invents a place
to write, it reads what you already study from.

Built with [Astro](https://astro.build). No CMS, no database, no runtime.

---

## The one thing to remember

**A note goes public only when its frontmatter says so.**

```yaml
---
published: true
---
```

No flag, no page. The sync script wipes and regenerates `src/content/` on every run, so
deleting the flag un-publishes the note on the next publish.

---

## Publishing something

1. Write the note in Obsidian, in one of the folders below.
2. Set `published: true` in its frontmatter.
3. Run:

   ```bash
   npm run publish
   ```

That syncs the vault, builds (so a broken note fails on your machine, not in CI), commits
`src/content/`, and pushes. GitHub Actions deploys from there.

To see it locally before pushing:

```bash
npm run dev      # syncs, then serves at http://localhost:4321
```

Drafts (`draft: true`) are visible in `npm run dev` and hidden in the built site.

---

## Where content comes from

| Vault folder | Becomes | URL |
|---|---|---|
| `Recherche/02-Notes-de-Lecture/` | Papers | `/papers/…` |
| `Recherche/03-Mon-Papier/` | Papers | `/papers/…` |
| `CTF/01-Writeups/` | Writeups | `/writeups/…` |
| `CTF/02-Machines/` | Writeups | `/writeups/…` |
| `CTF/04-Competitions/` | Competitions | `/competitions/…` |
| `CTF/03-Reflexes/` | Notes | `/notes/…` |
| `explanations/` | Notes | `/notes/…` |
| `Notes/` | Notes | `/notes/…` |
| `Projets/` | Projects | `/projects/…` |

`README.md`, `Template-*`, `TEMPLATE*` and dotfiles are never published, flag or not.

Vault location is auto-detected. Override it:

```bash
VAULT="D:/some/other/vault" npm run sync
```

Edit the folder map in `scripts/sync-vault.mjs` (the `SOURCES` array).

---

## Frontmatter

French keys from your vault templates are translated automatically — `titre`→`title`,
`categorie`→`category`, `classement`→`rank`, `niveau`→`difficulty`, and so on. The full
map is `KEY_ALIASES` in `scripts/sync-vault.mjs`.

Only `published: true` is required. Everything else is optional and degrades gracefully —
a competition with no rank simply shows no rank. Missing `date` falls back to the file's
modification time, so old notes don't jump to the top every time you sync.

The templates in your vault (`CTF/05-Templates/`, `Recherche/02-Notes-de-Lecture/TEMPLATE-*`,
`Projets/Template-Projet.md`) already carry every field the site reads, commented.

### Competition ranks

Either form works:

```yaml
classement: 37
totalTeams: 1204
```

```yaml
classement: "37 / 1204"
```

Given both numbers, the site computes and shows "top 3%".

### Linking a writeup to a competition

Put the same string in both files:

```yaml
# CTF/04-Competitions/picoctf-2026.md
event: "picoCTF 2026"

# CTF/01-Writeups/some-challenge.md
event: "picoCTF 2026"
```

The competition page then lists its writeups, and each writeup links back.

---

## What the sync script will not publish

Even with `published: true`, a note is blocked if it contains a private key, an AWS access
key id, or a GitHub token. You get a red line in the output and the note is skipped.

It warns (but still publishes) on local Windows paths containing your username, anything
shaped like `password: …`, and IP addresses — usually fine for CTF targets, worth a glance.

Obsidian syntax is converted on the way out: `[[wikilinks]]` become real links when the
target is also published and plain text when it isn't, `![[image.png]]` embeds are copied
into `public/vault-assets/`, and callouts become blockquotes.

---

## Editing the site itself

| What | Where |
|---|---|
| Name, bio, links, nav | `src/config.ts` |
| Colours, type, spacing | `src/styles/global.css` (tokens at the top) |
| What fields a section accepts | `src/content.config.ts` |
| Vault folder map, field aliases | `scripts/sync-vault.mjs` |
| About page prose | `src/pages/about.astro` |

Dark mode is automatic from the OS, with a manual toggle that persists.

---

## Deploying

Push to `main`. `.github/workflows/deploy.yml` builds and deploys to GitHub Pages.

First time only, in the repo on GitHub: **Settings → Pages → Source → GitHub Actions**.

CI does *not* run the vault sync — the vault is on your machine. That is why `src/content/`
is committed to the repo, and why `npm run publish` exists.

For a custom domain later: set `site` in `astro.config.mjs` and `url` in `src/config.ts`,
add a `CNAME` file to `public/`, and point the DNS at GitHub Pages.
