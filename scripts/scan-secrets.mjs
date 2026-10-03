#!/usr/bin/env node
// scripts/scan-secrets.mjs
//
// Refuses text that contains a secret. Built for round-1 finding C1 (red team): the kit had no
// secret scanner, and the one scanner it had (scan-task-packet.mjs) checks methodology words, not
// credentials, and fires on ordinary ledger prose (SPEC.md, tins-kit/..., absolute paths).
//
// Three layers, in order of how much to trust a hit:
//   1. env-value   — a value loaded from the project's own `.env*` files appears VERBATIM in the
//                    scanned text. Near-zero false positives; this is the real leak class (an agent
//                    copies .env into a worktree, a test prints it, a ledger records the output).
//   2. provider shapes — JWTs, sb_secret_/sb_publishable_ keys, AWS key ids, sk- API keys, GitHub /
//                    Slack / Google / Stripe tokens, private-key blocks, passwords inside URLs.
//   3. heuristics  — generic `password=` / `secret=` / `token=` assignments with a random-looking
//                    value, and a conservative entropy check on long mixed-class tokens.
//
// A hit REFUSES the write. This tool never redacts-and-continues: redaction is a decision about
// someone else's text, and a half-scrubbed record is worse than none. Reword the text, or fix the
// leak, and re-run. There is deliberately no allowlist and no inline "ignore" marker — a marker a
// model can type is a marker a model can use to smuggle a secret through.
//
// NEVER prints a value. Output is: file, line number, finding class (plus, for env-value, the
// variable NAME — never its value).
//
// Usage:
//   node scripts/scan-secrets.mjs [--root <dir>] [--json] [--no-env] [--stdin] [paths...]
//
//   --stdin        read the text to scan from standard input
//   paths          files to scan; a directory is scanned recursively (skipping .git, node_modules,
//                  and `.env*` files themselves)
//   --root <dir>   where to look for `.env*` files. Default: the nearest ancestor of the cwd that
//                  contains `.git`, else the cwd.
//   --no-env       skip layer 1 (shape and heuristic checks only)
//   --json         machine-readable output
//
// Exit 0 clean · 1 findings · 2 usage error (nothing was scanned, so "clean" must not be assumed).
//
// Known limits (honest list): a secret that is base64- or URL-encoded, split across lines, or
// re-typed from memory with one character changed is not caught by layer 1; hex-only strings are
// not flagged by entropy (git shas look the same); layer 3 will occasionally flag a long random-
// looking identifier — reword it (truncate it) rather than looking for an override.
//
// Zero-dep Node ESM (D3). Cross-OS: node:path everywhere, CRLF tolerated.

import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { resolve, join, relative } from 'node:path';
import process from 'node:process';

const HELP = `scan-secrets.mjs — refuse text that contains a secret

  node scripts/scan-secrets.mjs [--root <dir>] [--json] [--no-env] [--stdin] [paths...]

  --stdin        read the text to scan from stdin (may be combined with paths)
  paths          files (or directories, recursively) to scan
  --root <dir>   directory to search for .env* files whose values must never appear verbatim.
                 Default: nearest ancestor of the cwd containing .git, else the cwd.
  --no-env       skip the .env verbatim check
  --json         machine-readable result
  --help         this text

Exit 0 clean / 1 findings / 2 usage error.
Prints the finding class and line number only. NEVER the value.`;

// ---------------------------------------------------------------------------------------------
// layer 2: provider-shaped patterns. Each needs enough body that a bare mention in prose
// ("sb_secret_", "AKIA", "sk-") does not match.
// ---------------------------------------------------------------------------------------------
const SHAPES = [
  ['jwt', /\beyJ[A-Za-z0-9_-]{8,}\.eyJ[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]{8,}/],
  ['supabase-key', /\bsb_(?:secret|publishable)_[A-Za-z0-9_-]{16,}/],
  ['aws-access-key-id', /\b(?:AKIA|ASIA|AGPA|AIDA|AROA|ANPA)[A-Z0-9]{16}\b/],
  ['aws-secret-access-key', /aws_?secret_?access_?key["']?\s*[:=]\s*["']?[A-Za-z0-9/+=]{40}\b/i],
  ['api-key-sk', /\bsk-(?:ant-|proj-|live-|or-)[A-Za-z0-9_-]{16,}/],
  ['github-token', /\b(?:gh[pousr]_[A-Za-z0-9]{36,}|github_pat_[A-Za-z0-9_]{40,})/],
  ['slack-token', /\bxox[abprs]-[A-Za-z0-9-]{10,}/],
  ['google-api-key', /\bAIza[0-9A-Za-z_-]{35}\b/],
  ['stripe-key', /\b[sr]k_(?:live|test)_[0-9A-Za-z]{16,}/],
  ['private-key-block', /-----BEGIN (?:[A-Z0-9]+ )*PRIVATE KEY(?: BLOCK)?-----/],
];

// sk-<20+ chars> with no vendor infix is only a hit when the body is mixed letters+digits, because
// "sk-" also begins ordinary hyphenated words.
const SK_PLAIN = /\bsk-([A-Za-z0-9_-]{20,})/;

// scheme://user:password@host — the password part is what we judge.
const URL_CREDS = /\b[a-z][a-z0-9+.-]*:\/\/[^\s:/@<>"'`]+:([^\s@/<>"'`]{3,})@[^\s"'`]+/i;

// password=..., secret: ..., api_key = ..., token=...   (value taken up to whitespace/quote)
const ASSIGN =
  /\b(?:password|passwd|pwd|secret|client[_-]?secret|api[_-]?key|access[_-]?key|auth[_-]?token|access[_-]?token|refresh[_-]?token|private[_-]?key|token)["']?\s*[:=]\s*["']?([^\s"'`,;)}\]]{8,})/gi;

const PLACEHOLDER =
  /^(?:<.*>|\$[{(]?.*|\{\{.*|%.*|\*+|x{3,}|\.{3,}|…|your[-_ ]?.*|changeme.*|change[-_]me.*|example.*|placeholder.*|redacted.*|dummy.*|fake.*|null|undefined|true|false|none)$/i;

function isPlaceholderOrCodeRef(v) {
  if (PLACEHOLDER.test(v)) return true;
  // a dotted/underscored identifier path is a code reference, not a literal: process.env.DB_PASSWORD
  if (/^[A-Za-z_$][\w$]*(?:[.:][A-Za-z_$][\w$]*)+$/.test(v)) return true;
  // a file path or url
  if (/^(?:\.{0,2}\/|[A-Za-z]:\\|https?:\/\/)/.test(v)) return true;
  // a function call or arrow expression is code, not a literal: `token = randomBytes(6).toString('hex')`
  // (found when the scanner flagged the kit's own session.mjs - a false positive that would teach a weak
  // model to distrust the gate). A planted literal has no call syntax and is still caught.
  if (/[A-Za-z_$][\w$]*\s*\(/.test(v) || /=>/.test(v)) return true;
  return false;
}

function classes(s) {
  let n = 0;
  if (/[a-z]/.test(s)) n++;
  if (/[A-Z]/.test(s)) n++;
  if (/[0-9]/.test(s)) n++;
  if (/[^A-Za-z0-9]/.test(s)) n++;
  return n;
}

function entropy(s) {
  const freq = new Map();
  for (const ch of s) freq.set(ch, (freq.get(ch) || 0) + 1);
  let h = 0;
  for (const c of freq.values()) {
    const p = c / s.length;
    h -= p * Math.log2(p);
  }
  return h;
}

// layer 3b: long token, mixed classes, high Shannon entropy. Conservative on purpose: it exists to
// catch an unlabelled random blob, not to police every long identifier.
const ENTROPY_MIN_LEN = 32;
const ENTROPY_MIN_BITS = 4.3;
const LONG_TOKEN = /[A-Za-z0-9_+=-]{32,}/g;

function entropyHits(line) {
  let hit = false;
  for (const m of line.matchAll(LONG_TOKEN)) {
    const t = m[0];
    const before = line[m.index - 1];
    const after = line[m.index + t.length];
    if (before === '/' || before === '\\' || after === '/' || after === '\\') continue; // path segment
    if (after === '.' && /[A-Za-z]/.test(line[m.index + t.length + 1] || '')) continue; // file.name
    if (/^[0-9a-fA-F-]+$/.test(t)) continue; // hex / uuid / git sha
    if (t.length < ENTROPY_MIN_LEN || classes(t) < 3) continue;
    if (!/[0-9]/.test(t) || !/[A-Za-z]/.test(t)) continue;
    // kebab/snake slugs made of ordinary words are identifiers, not keys
    const words = t.split(/[-_]/).filter(Boolean);
    if (words.length >= 4 && words.filter((w) => /^[a-z]{2,}$/.test(w)).length / words.length > 0.5) continue;
    if (entropy(t) >= ENTROPY_MIN_BITS) hit = true;
  }
  return hit;
}

// ---------------------------------------------------------------------------------------------
// layer 1: values from the project's .env* files
// ---------------------------------------------------------------------------------------------
const ENV_NAME_RE = /^(?:\.env(?:\..+)?|.+\.env)$/i;
const ENV_TEMPLATE_RE = /\.(?:example|sample|template|dist|defaults?)$/i;
const SECRETISH_NAME = /(?:KEY|SECRET|TOKEN|PASS|PWD|CRED|PRIVATE|AUTH|SALT|SIGN|DSN|CONN|DATABASE_URL|JWT|CERT)/i;
const SKIP_DIRS = new Set(['.git', 'node_modules', 'dist', 'build', '.next', '.venv', 'venv', '__pycache__', 'coverage', '.cache', 'vendor']);
const LOW_SIGNAL = /^(?:true|false|null|undefined|none|yes|no|on|off|development|production|test|staging|local|localhost|[0-9.:-]+)$/i;

function findEnvFiles(root, maxDepth = 4, maxDirs = 3000) {
  const found = [];
  let visited = 0;
  (function walk(dir, depth) {
    if (depth > maxDepth || visited++ > maxDirs) return;
    let entries;
    try {
      entries = readdirSync(dir, { withFileTypes: true });
    } catch {
      return;
    }
    for (const e of entries) {
      if (e.isDirectory()) {
        if (!SKIP_DIRS.has(e.name)) walk(join(dir, e.name), depth + 1);
      } else if (e.isFile() && ENV_NAME_RE.test(e.name) && !ENV_TEMPLATE_RE.test(e.name)) {
        found.push(join(dir, e.name));
      }
    }
  })(root, 0);
  return found;
}

// Minimal dotenv parser: KEY=value, `export KEY=value`, single/double quotes (double-quoted values
// may span lines), `# comment` lines and trailing ` # comment` on unquoted values.
function parseEnv(text) {
  const out = [];
  const s = text.replace(/\r\n?/g, '\n');
  let i = 0;
  while (i < s.length) {
    let eol = s.indexOf('\n', i);
    if (eol === -1) eol = s.length;
    const line = s.slice(i, eol);
    const m = line.match(/^\s*(?:export\s+)?([A-Za-z_][A-Za-z0-9_.-]*)\s*=\s?(.*)$/);
    if (!m || /^\s*#/.test(line)) {
      i = eol + 1;
      continue;
    }
    const name = m[1];
    let rest = m[2];
    let value;
    const q = rest.trimStart()[0];
    if (q === '"' || q === "'") {
      const body = rest.trimStart().slice(1);
      let end = body.indexOf(q);
      if (end !== -1) {
        value = body.slice(0, end);
        i = eol + 1;
      } else {
        // multi-line quoted value
        let j = eol + 1;
        let acc = body;
        let closed = false;
        while (j <= s.length && !closed) {
          let e2 = s.indexOf('\n', j);
          if (e2 === -1) e2 = s.length;
          const l2 = s.slice(j, e2);
          const k = l2.indexOf(q);
          if (k !== -1) {
            acc += '\n' + l2.slice(0, k);
            closed = true;
          } else acc += '\n' + l2;
          j = e2 + 1;
          if (e2 >= s.length) break;
        }
        value = acc;
        i = j;
      }
    } else {
      value = rest.replace(/\s+#.*$/, '').trim();
      i = eol + 1;
    }
    out.push([name, value]);
  }
  return out;
}

function envCandidates(file) {
  let text;
  try {
    text = readFileSync(file, 'utf8');
  } catch {
    return [];
  }
  const cands = [];
  for (const [name, raw] of parseEnv(text)) {
    const value = raw.replace(/\r/g, '');
    if (value.length < 8 || LOW_SIGNAL.test(value)) continue;
    const credUrl = /^[a-z][a-z0-9+.-]*:\/\/[^\s/@]+:[^\s/@]+@/i.test(value);
    const looksRandom = value.length >= 16 && classes(value) >= 2 && entropy(value) >= 3.0 && !/\s/.test(value);
    // a plain url or a short word in a non-secret-named variable is configuration, not a secret
    if (!(SECRETISH_NAME.test(name) || credUrl || looksRandom)) continue;
    const variants = new Set([value]);
    if (value.includes('\\n')) variants.add(value.replace(/\\n/g, '\n'));
    if (value.includes('\n')) {
      variants.add(value.replace(/\n/g, '\\n'));
      for (const l of value.split('\n')) if (l.trim().length >= 24) variants.add(l.trim());
    }
    for (const v of variants) cands.push({ name, value: v });
  }
  return cands;
}

function loadEnvValues(root) {
  const files = findEnvFiles(root);
  const byValue = new Map();
  for (const f of files) for (const c of envCandidates(f)) if (!byValue.has(c.value)) byValue.set(c.value, c.name);
  return { files: files.length, values: byValue };
}

// ---------------------------------------------------------------------------------------------
// scanning
// ---------------------------------------------------------------------------------------------
export function scanText(rawText, envValues) {
  const text = rawText.replace(/\r\n?/g, '\n');
  const findings = [];
  const seen = new Set();
  const add = (line, cls, source) => {
    const key = `${line}:${cls}`;
    if (seen.has(key)) return;
    seen.add(key);
    findings.push({ line, class: cls, ...(source ? { source } : {}) });
  };

  // layer 1 — verbatim env values (whole-text, so multi-line values work)
  if (envValues && envValues.size) {
    for (const [value, name] of envValues) {
      let idx = text.indexOf(value);
      while (idx !== -1) {
        add(text.slice(0, idx).split('\n').length, 'env-value', name);
        idx = text.indexOf(value, idx + value.length);
      }
    }
  }

  const lines = text.split('\n');
  lines.forEach((line, i) => {
    const n = i + 1;
    for (const [cls, re] of SHAPES) if (re.test(line)) add(n, cls);
    const sk = line.match(SK_PLAIN);
    if (sk && /[0-9]/.test(sk[1]) && /[A-Za-z]/.test(sk[1])) add(n, 'api-key-sk');
    const u = line.match(URL_CREDS);
    if (u && !isPlaceholderOrCodeRef(u[1]) && !/^(?:password|pass|pwd|secret)$/i.test(u[1])) add(n, 'url-credentials');
    for (const a of line.matchAll(ASSIGN)) {
      const v = a[1];
      if (isPlaceholderOrCodeRef(v)) continue;
      if (/[0-9]/.test(v) && /[A-Za-z]/.test(v)) add(n, 'secret-assignment');
      else if (/[^A-Za-z0-9._-]/.test(v) && /[A-Za-z]/.test(v) && v.length >= 10) add(n, 'secret-assignment');
    }
    if (entropyHits(line)) add(n, 'high-entropy-token');
  });
  findings.sort((a, b) => a.line - b.line);
  return findings;
}

function isProbablyBinary(buf) {
  const n = Math.min(buf.length, 4096);
  for (let i = 0; i < n; i++) if (buf[i] === 0) return true;
  return false;
}

function* expand(path, explicit) {
  let st;
  try {
    st = statSync(path);
  } catch (e) {
    throw new Error(`cannot read ${path}: ${e.code || e.message}`);
  }
  if (st.isDirectory()) {
    for (const e of readdirSync(path, { withFileTypes: true })) {
      if (e.isDirectory()) {
        if (!SKIP_DIRS.has(e.name)) yield* expand(join(path, e.name), false);
      } else if (e.isFile() && !ENV_NAME_RE.test(e.name)) {
        yield join(path, e.name);
      }
    }
  } else if (st.isFile()) {
    yield path;
  } else if (explicit) {
    throw new Error(`not a file or directory: ${path}`);
  }
}

function nearestGitRoot(start) {
  let d = resolve(start);
  for (;;) {
    if (existsSync(join(d, '.git'))) return d;
    const up = resolve(d, '..');
    if (up === d) return null;
    d = up;
  }
}

async function readStdin() {
  const chunks = [];
  for await (const c of process.stdin) chunks.push(c);
  return Buffer.concat(chunks).toString('utf8');
}

async function main() {
  const argv = process.argv.slice(2);
  const opts = { stdin: false, json: false, env: true, root: null, paths: [] };
  const usage = (msg) => {
    console.error(`scan-secrets: ${msg}\n\n${HELP}`);
    process.exit(2);
  };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--help' || a === '-h') {
      console.log(HELP);
      process.exit(0);
    } else if (a === '--stdin') opts.stdin = true;
    else if (a === '--json') opts.json = true;
    else if (a === '--no-env') opts.env = false;
    else if (a === '--root') {
      if (i + 1 >= argv.length) usage('--root needs a directory');
      opts.root = argv[++i];
    } else if (a.startsWith('--root=')) opts.root = a.slice('--root='.length);
    else if (a === '--') opts.paths.push(...argv.slice(i + 1)), (i = argv.length);
    else if (a.startsWith('--')) usage(`unknown option ${a}`);
    else opts.paths.push(a);
  }
  if (!opts.stdin && opts.paths.length === 0) usage('nothing to scan: give --stdin or at least one path');

  let root;
  if (opts.root !== null) {
    root = resolve(opts.root);
    let ok = false;
    try {
      ok = statSync(root).isDirectory();
    } catch {
      /* fallthrough */
    }
    if (!ok) usage(`--root is not a directory: ${opts.root}`);
  } else {
    root = nearestGitRoot(process.cwd()) || process.cwd();
  }

  let env = { files: 0, values: new Map() };
  if (opts.env) env = loadEnvValues(root);

  // collect inputs
  const inputs = []; // [label, text]
  try {
    if (opts.stdin) inputs.push(['<stdin>', await readStdin()]);
    for (const p of opts.paths) {
      for (const f of expand(resolve(p), true)) {
        const buf = readFileSync(f);
        if (buf.length > 4 * 1024 * 1024 || isProbablyBinary(buf)) continue;
        const label = relative(process.cwd(), f) || f;
        inputs.push([label, buf.toString('utf8')]);
      }
    }
  } catch (e) {
    usage(e.message);
  }

  const results = [];
  for (const [label, text] of inputs) {
    for (const f of scanText(text, env.values)) results.push({ file: label, ...f });
  }

  if (opts.json) {
    console.log(
      JSON.stringify(
        { ok: results.length === 0, scanned: inputs.length, envFiles: env.files, envValues: env.values.size, findings: results },
        null,
        2,
      ),
    );
  } else {
    if (opts.env && env.files === 0) {
      console.error(`scan-secrets: note — no .env* files found under ${root}; the verbatim check had nothing to match against.`);
    }
    for (const r of results) {
      console.log(`${r.file}:${r.line}: ${r.class}${r.source ? ` (value of ${r.source})` : ''}`);
    }
    console.log(
      results.length === 0
        ? `scan-secrets: clean (${inputs.length} input(s), ${env.values.size} .env value(s) checked)`
        : `scan-secrets: ${results.length} finding(s) — REFUSED. Values are never printed; remove the secret (and rotate it if it was ever committed or shared).`,
    );
  }
  process.exit(results.length === 0 ? 0 : 1);
}

import { pathToFileURL } from 'node:url';
if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  main().catch((e) => {
    console.error(`scan-secrets: ${e.message}`);
    process.exit(2);
  });
}
