import {readFileSync,readdirSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
import assert from 'node:assert/strict';
const root=path.dirname(fileURLToPath(import.meta.url));
const manifest=JSON.parse(readFileSync(path.join(root,'manifest.json'),'utf8'));
const ledger=JSON.parse(readFileSync(path.join(root,'review-ledger.json'),'utf8'));
assert.equal(manifest.entries.length,369);
assert.equal(manifest.entries.filter(e=>e.group==='historical').length,359);
assert.equal(manifest.entries.filter(e=>e.group==='pilot').length,10);
assert.equal(new Set(manifest.entries.map(e=>e.id)).size,369);
assert.equal(ledger.length,369);assert.equal(new Set(ledger.map(e=>e.id)).size,369);
assert.equal(readdirSync(path.join(root,'candidates')).length,369);
for(const e of manifest.entries){
 const p=path.resolve(root,e.path);assert.ok(p.startsWith(root+path.sep));
 const hash=createHash('sha256').update(readFileSync(p)).digest('hex');
 assert.equal(hash,e.sha256,e.id);assert.equal(ledger.find(r=>r.id===e.id)?.original_sha256,hash,e.id);
}
for(const file of ['INDEX.md','../SPEC.md']){
 const p=path.resolve(root,file);const text=readFileSync(p,'utf8');
 for(const match of text.matchAll(/\]\(([^)]+)\)/g)){
  if(/^https?:/.test(match[1]))continue;
  readFileSync(path.resolve(path.dirname(p),match[1].split('#')[0]));
 }
}
console.log('PASS: 359 historical + 10 pilot candidates; all hashes, unique IDs, ledger coverage and document links verified.');
