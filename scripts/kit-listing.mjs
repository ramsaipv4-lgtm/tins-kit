#!/usr/bin/env node
// scripts/kit-listing.mjs
//
// List every pattern, prompt, schema, template, script, and lib module in the
// kit. The "what's in the kit?" one-liner.
//
// Usage:
//   node scripts/kit-listing.mjs                  # full listing
//   node scripts/kit-listing.mjs --kind=patterns # just one kind
//   node scripts/kit-listing.mjs --json          # JSON output (the single source of counts for other tools)
//   node scripts/kit-listing.mjs --root=<dir>    # list another kit tree
//
// --json shape: { <kind>: { title, count, items:[{path,title,...}] }, ..., counts: { <kind>: n, ..., total: n } }.
// `counts` is the one authoritative tally: every file is counted in exactly one kind. (Earlier versions counted
// lib/patterns twice, once as "patterns" and again inside "lib", and counted scripts/_lib inside "scripts".)

import { readdirSync, statSync, existsSync, readFileSync } from 'node:fs';
import { resolve, join, relative, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import process from 'node:process';

const args = process.argv.slice(2);
const kindArg = args.find((a) => a.startsWith('--kind='));
const onlyKind = kindArg ? kindArg.split('=')[1] : null;
const jsonOut = args.includes('--json');

const rootArg = args.find((a) => a.startsWith('--root='));
const kitRoot = rootArg ? resolve(rootArg.slice(7)) : resolve(fileURLToPath(new URL('.', import.meta.url)), '..');

let parsePatternFile;
try {
  ({ parsePatternFile } = await import('./_lib/pattern-meta.mjs'));
} catch (e) {
  console.error('ERROR: scripts/_lib/pattern-meta.mjs is missing next to this script. Copy the whole scripts/_lib directory.');
  process.exit(2);
}

const KINDS = [
  { kind: 'patterns', dir: 'lib/patterns', ext: '.md', title: 'Patterns (architect recipes)' },
  { kind: 'prompts', dir: 'prompts', ext: '.md', title: 'Prompts (LLM session scripts)' },
  { kind: 'schemas', dir: 'schemas', ext: '.json', title: 'Schemas (JSON Schema)' },
  { kind: 'templates', dir: 'templates', ext: null, title: 'Templates (consumer starter files)' },
  { kind: 'scripts', dir: 'scripts', ext: '.mjs', title: 'Scripts (CLI tools)', flat: true },
  { kind: 'script-libs', dir: 'scripts/_lib', ext: '.mjs', title: 'Script libraries (shared by the CLI tools)', flat: true },
  { kind: 'lib', dir: 'lib', ext: null, title: 'Lib modules (code + tests)', skipDirs: ['patterns'] },
  { kind: 'docs', dir: 'docs', ext: '.md', title: 'Docs (workflows + conventions)' },
];

function walk(dir, ext, files = [], opts = {}) {
  if (!existsSync(dir)) return files;
  for (const f of readdirSync(dir).sort()) {
    const full = join(dir, f);
    const stat = statSync(full);
    if (stat.isDirectory()) {
      if (opts.flat) continue;
      if (f === 'tests' || f === 'archive' || f === 'node_modules' || (opts.skipDirs || []).includes(f)) continue;
      walk(full, ext, files, opts);
    } else if (!ext || f.endsWith(ext)) {
      files.push(full);
    }
  }
  return files;
}

function titleFromPath(p) {
  // Try to extract a "# title" or "/* title */" from the first 5 lines
  try {
    const text = readFileSync(p, 'utf8').replace(/\r/g, '').slice(0, 1000);
    // a pattern file starts with YAML front matter: read the title from the body after it
    const md = (p.endsWith('.md') ? parsePatternFile(readFileSync(p, 'utf8')).body : text).match(/^#\s+(.+?)\s*$/m);
    if (md) return md[1].trim();
    const js = text.match(/^\/\*\s*([\s\S]+?)\s*\*\//);
    if (js) return js[1].split('\n')[0].trim();
    const sql = text.match(/^--\s+(.+?)$/m);
    if (sql) return sql[1].trim();
  } catch {}
  return null;
}

const result = {};
for (const { kind, dir, ext, title, flat, skipDirs } of KINDS) {
  if (onlyKind && onlyKind !== kind) continue;
  const files = walk(join(kitRoot, dir), ext, [], { flat, skipDirs });
  result[kind] = {
    title,
    count: files.length,
    items: files.map((f) => {
      const item = { path: relative(kitRoot, f).split(sep).join('/'), title: titleFromPath(f) };
      if (kind === 'patterns') {
        const { meta } = parsePatternFile(readFileSync(f, 'utf8'));
        item.frontMatter = meta !== null;
        item.status = meta && meta.status ? meta.status : null;
      }
      return item;
    }),
  };
}
const counts = {};
for (const [k, v] of Object.entries(result)) counts[k] = v.count;
counts.total = Object.values(counts).reduce((a, b) => a + b, 0);

if (jsonOut) {
  console.log(JSON.stringify({ ...result, counts }, null, 2));
} else {
  console.log(`tins-kit — what's in the kit?\n`);
  for (const [kind, info] of Object.entries(result)) {
    console.log(`## ${info.title} (${info.count})`);
    for (const item of info.items) {
      const t = item.title ? `  — ${item.title.slice(0, 70)}` : '';
      console.log(`  ${item.path}${t}`);
    }
    console.log('');
  }
  console.log(`Total: ${counts.total} files across ${Object.keys(result).length} categories.`);
}
