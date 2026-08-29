#!/usr/bin/env node
/**
 * publish.mjs — one command from "I marked a note published" to "it is live".
 *
 *   1. sync the vault into src/content/
 *   2. build, so a broken note fails here and not in CI
 *   3. commit the synced content and push
 *
 * GitHub Actions then rebuilds and deploys. Nothing is pushed if the build
 * fails or if nothing actually changed.
 */

import { execFileSync } from 'node:child_process';
import path from 'node:path';

const ROOT = path.resolve(import.meta.dirname, '..');
const run = (cmd, args, opts = {}) =>
  execFileSync(cmd, args, { cwd: ROOT, stdio: 'inherit', shell: true, ...opts });
const capture = (cmd, args) =>
  execFileSync(cmd, args, { cwd: ROOT, encoding: 'utf8', shell: true }).trim();

run('node', ['scripts/sync-vault.mjs']);

console.log('Building...');
run('npx', ['astro', 'build', '--silent']);

const changed = capture('git', ['status', '--porcelain', '--', 'src/content', 'public/vault-assets']);
if (!changed) {
  console.log('\nNothing changed since the last publish. Site is already up to date.\n');
  process.exit(0);
}

console.log('\nChanged:\n' + changed + '\n');

run('git', ['add', 'src/content', 'public/vault-assets']);
run('git', ['commit', '-m', '"content: sync from vault"']);
run('git', ['push']);

console.log('\nPushed. GitHub Actions is deploying — check the Actions tab.\n');
