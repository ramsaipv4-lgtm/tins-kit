// scan-secrets.test.mjs — selftests for scripts/scan-secrets.mjs
// Every "secret" here is INVENTED and assembled from fragments at run time, so this file does not
// itself contain a string that a scanner (or a git host's push protection) would flag.
import { test } from 'node:test';
import { strict as assert } from 'node:assert';
import { spawnSync } from 'node:child_process';
import { mkdtempSync, writeFileSync, mkdirSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const SCRIPT = resolve(dirname(fileURLToPath(import.meta.url)), '..', 'scan-secrets.mjs');

// invented values
const FAKE_ENV_VALUE = ['Qv7mLx2', 'Pz9RtYb4', 'NcW8kJh3'].join('');
const FAKE_JWT = ['eyJhbGciOiJIUzI1NiIs' + 'InR5cCI6IkpXVCJ9', 'eyJzdWIiOiJpbnZlbnRl' + 'ZC10ZXN0Iiwicm9sZSI6Im5vbmUifQ', 'fakeSig_Zq81Lm3PxTt7vWk'].join('.');
const FAKE_SB = 'sb_' + 'secret_' + 'Zq81Lm3PxTt7vWkRb2Ny4Hc9';
const FAKE_AWS = 'AK' + 'IA' + 'QZ7XK3MV9TLP2NB4';
const FAKE_SK = 'sk-' + 'ant-' + 'api03-Zq81Lm3PxTt7vWkRb2Ny4Hc9';
const FAKE_PASSWORD_LINE = 'pass' + 'word=Tr0ub4dor&3xyzQ';
const FAKE_PEM = '-----BEGIN ' + 'RSA PRIVATE KEY-----';
const FAKE_URL = 'postgres' + '://app_user:Zq81Lm3PxTt7@db.invented.example:5432/app';
const FAKE_BLOB = ['Zq81Lm3PxTt7vWk', 'Rb2Ny4Hc9Dd5Ee6', 'Ff7Gg8Hh'].join('');

const scratch = mkdtempSync(join(tmpdir(), 'scan-secrets-test-'));
test.after(() => rmSync(scratch, { recursive: true, force: true }));

function run(args, input) {
  const r = spawnSync(process.execPath, [SCRIPT, ...args], { input, encoding: 'utf8', cwd: scratch });
  return { code: r.status, out: r.stdout + r.stderr };
}

function emptyRoot() {
  const d = mkdtempSync(join(scratch, 'root-'));
  return d;
}

test('provider shapes are each refused, with class and line, never the value', () => {
  const root = emptyRoot();
  const cases = [
    [FAKE_JWT, 'jwt'],
    [FAKE_SB, 'supabase-key'],
    [FAKE_AWS, 'aws-access-key-id'],
    [FAKE_SK, 'api-key-sk'],
    [FAKE_PASSWORD_LINE, 'secret-assignment'],
    [FAKE_PEM, 'private-key-block'],
    [FAKE_URL, 'url-credentials'],
    [FAKE_BLOB, 'high-entropy-token'],
  ];
  for (const [secret, cls] of cases) {
    const r = run(['--stdin', '--root', root], `line one\nthe value is ${secret} ok\n`);
    assert.equal(r.code, 1, `${cls} should exit 1: ${r.out}`);
    assert.match(r.out, new RegExp(`<stdin>:2: ${cls}`), cls);
    assert.ok(!r.out.includes(secret), `${cls}: value was printed`);
  }
});

test('ordinary ledger and prose text is NOT flagged (the old packet scanner flagged all of these)', () => {
  const root = emptyRoot();
  const prose = [
    'Edited SPEC.md and tins-kit/scripts/validate.mjs; see /mnt/c/Users/user/Desktop/Jayshankar/docs/x.md',
    'commit 0123456789abcdef0123456789abcdef01234567 and sha256 ' + 'ab'.repeat(32),
    'record sessions/20261002T101500Z-claude-ab12cd.md written',
    'uuid 123e4567-e89b-12d3-a456-426614174000',
    'the sb_secret_ prefix and the sk- prefix and AKIA ids are discussed here',
    'const pw = process.env.DB_PASSWORD; password=<redacted>; token: refresh; secret=true',
    'api_key = ${API_KEY} and password = changeme',
    'node scripts/session.mjs claim migration-number:0047',
    'a-long-kebab-case-identifier-made-of-ordinary-english-words-and-more',
    'postgres://user:password@localhost:5432/db',
  ].join('\r\n'); // CRLF on purpose
  const r = run(['--stdin', '--root', root], prose);
  assert.equal(r.code, 0, r.out);
});

test('verbatim .env value is refused; the variable NAME may be shown, the value never', () => {
  const root = emptyRoot();
  writeFileSync(join(root, '.env'), `ZETA_SECRET_KEY="${FAKE_ENV_VALUE}"\r\nVITE_DEMO_MODE=true\r\nPORT=3000\r\n`);
  const r = run(['--stdin', '--root', root], `x\ny\nleaked ${FAKE_ENV_VALUE}\n`);
  assert.equal(r.code, 1);
  assert.match(r.out, /<stdin>:3: env-value \(value of ZETA_SECRET_KEY\)/);
  assert.ok(!r.out.includes(FAKE_ENV_VALUE));
  // low-signal values never cause hits
  assert.equal(run(['--stdin', '--root', root], 'VITE_DEMO_MODE=true PORT=3000 true 3000').code, 0);
});

test('.env.example and nested .env files: templates ignored, nested ones loaded', () => {
  const root = emptyRoot();
  mkdirSync(join(root, 'scripts'));
  writeFileSync(join(root, '.env.example'), 'SOME_API_KEY=Aa1Bb2Cc3Dd4Ee5Ff6Gg7\n');
  writeFileSync(join(root, 'scripts', '.env.local'), `OTHER_TOKEN='${FAKE_ENV_VALUE}Zz'\n`);
  assert.equal(run(['--stdin', '--root', root], 'Aa1Bb2Cc3Dd4Ee5Ff6Gg7').code, 0);
  assert.equal(run(['--stdin', '--root', root], `x ${FAKE_ENV_VALUE}Zz`).code, 1);
});

test('multi-line quoted .env value (private key) is matched', () => {
  const root = emptyRoot();
  const body = 'MIIinventedLineOneZq81Lm3PxTt7vWk\nMIIinventedLineTwoRb2Ny4Hc9Dd5Ee6';
  writeFileSync(join(root, '.env'), `PRIV_KEY="${body}"\n`);
  const r = run(['--stdin', '--root', root], `see ${body.split('\n')[1]}\n`);
  assert.equal(r.code, 1);
  assert.match(r.out, /env-value/);
});

test('--no-env skips the verbatim check', () => {
  const root = emptyRoot();
  writeFileSync(join(root, '.env'), `ZETA_SECRET_KEY=${FAKE_ENV_VALUE}\n`);
  assert.equal(run(['--stdin', '--no-env', '--root', root], FAKE_ENV_VALUE).code, 0);
});

test('file and directory arguments; .env files inside a scanned directory are skipped', () => {
  const root = emptyRoot();
  const docs = join(root, 'docs');
  mkdirSync(docs);
  writeFileSync(join(docs, 'clean.md'), 'nothing here\n');
  writeFileSync(join(docs, 'dirty.md'), `a\nb\n${FAKE_AWS}\n`);
  writeFileSync(join(docs, '.env'), `ZETA_SECRET_KEY=${FAKE_ENV_VALUE}\n`);
  const r = run([docs, '--root', root]);
  assert.equal(r.code, 1);
  assert.match(r.out, /dirty\.md:3: aws-access-key-id/);
  assert.ok(!/clean\.md:/.test(r.out));
  assert.ok(!/\.env:/.test(r.out));
  assert.equal(run([join(docs, 'clean.md'), '--root', root]).code, 0);
});

test('--json carries class and line, never the value', () => {
  const root = emptyRoot();
  const r = run(['--stdin', '--json', '--root', root], `${FAKE_SK}\n`);
  assert.equal(r.code, 1);
  const j = JSON.parse(r.out);
  assert.equal(j.ok, false);
  assert.ok(j.findings.some((f) => f.line === 1 && f.class === 'api-key-sk'));
  assert.ok(j.findings.every((f) => Object.keys(f).sort().join() === 'class,file,line'));
  assert.ok(!r.out.includes(FAKE_SK));
});

test('usage errors exit 2: no input, unknown flag, missing path, bad --root', () => {
  const root = emptyRoot();
  assert.equal(run([]).code, 2);
  assert.equal(run(['--bogus', '--stdin']).code, 2);
  assert.equal(run([join(root, 'does-not-exist.md')]).code, 2);
  assert.equal(run(['--stdin', '--root', join(root, 'nope')], 'x').code, 2);
  assert.equal(run(['--root']).code, 2);
});

test('default root is the nearest ancestor with .git (spaces in path tolerated)', () => {
  const proj = join(emptyRoot(), 'my project');
  mkdirSync(join(proj, '.git'), { recursive: true });
  mkdirSync(join(proj, 'sub'));
  writeFileSync(join(proj, '.env'), `ZETA_SECRET_KEY=${FAKE_ENV_VALUE}\n`);
  const r = spawnSync(process.execPath, [SCRIPT, '--stdin'], { input: FAKE_ENV_VALUE, encoding: 'utf8', cwd: join(proj, 'sub') });
  assert.equal(r.status, 1);
  assert.match(r.stdout, /env-value/);
});

test('code that assigns a call result to a variable named token/secret is not a finding, a planted literal still is', () => {
  const code = run(['--stdin', '--no-env'], "const token = randomBytes(6).toString('hex');\nconst secret = makeId(8);\n");
  assert.equal(code.code, 0, code.out);
  const planted = run(['--stdin', '--no-env'], 'password=Hunter2xyz9Abcdef\n');
  assert.equal(planted.code, 1);
});
