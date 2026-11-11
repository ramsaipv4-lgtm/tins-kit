// One-time local packaging utility. Does not promote or reinterpret source lessons.
import {readFileSync,writeFileSync,mkdirSync,readdirSync,existsSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const sourceKit=path.resolve(root,'..','tins-kit-next');
const out=path.join(root,'review-inputs');
if(existsSync(out)) throw new Error('Refusing to overwrite existing review-inputs');
const sha=b=>createHash('sha256').update(b).digest('hex');
const rows=[]; const bundles=[];
for(const name of readdirSync(path.join(sourceKit,'inbox')).filter(n=>n.startsWith('harvest-')).sort()) {
 const dir=path.join(sourceKit,'inbox',name); const manifest=JSON.parse(readFileSync(path.join(dir,'manifest.json'),'utf8'));
 bundles.push({name,provenance:manifest});
 for(const file of readdirSync(path.join(dir,'candidates')).filter(n=>n.endsWith('.md')).sort()) {
  const bytes=readFileSync(path.join(dir,'candidates',file));
  const recorded=manifest.files.find(f=>f.path===`candidates/${file}`);
  if(!recorded || recorded.sha256!==sha(bytes)) throw new Error(`Source manifest mismatch: ${name}/${file}`);
  rows.push({id:`H${String(rows.length+1).padStart(3,'0')}`,group:'historical',bundle:name,file,bytes,source:manifest.repo,revision:manifest.head});
 }
}
if(rows.length!==359) throw new Error(`Expected 359 historical candidates, got ${rows.length}`);
const pilot=path.resolve(root,'..','agent-control');
const revision=execFileSync('git',['-C',pilot,'rev-parse','HEAD'],{encoding:'utf8'}).trim();
const files=readdirSync(path.join(pilot,'knowledge','candidates')).filter(n=>n.endsWith('.md')).sort();
if(files.length!==10) throw new Error('Expected 10 pilot candidates');
files.forEach((file,i)=>rows.push({id:`P${String(i+1).padStart(3,'0')}`,group:'pilot',bundle:'agent-control-lessons',file,bytes:readFileSync(path.join(pilot,'knowledge','candidates',file)),source:'agent-control/knowledge/candidates',revision}));
mkdirSync(path.join(out,'candidates'),{recursive:true});
const entries=rows.map(({bytes,file,...r})=>{
 const dest=`candidates/${r.id}--${file}`;writeFileSync(path.join(out,dest),bytes);
 const body=bytes.toString('utf8'); const title=body.match(/^# (.+)$/m)?.[1]||file;
 return {...r,title,path:dest,sha256:sha(bytes)};
});
writeFileSync(path.join(out,'manifest.json'),JSON.stringify({format:'tins-review-inputs-v1',created:'2026-11-11',historical:359,pilot:10,total:369,entries,bundles},null,2)+'\n');
writeFileSync(path.join(out,'review-ledger.json'),JSON.stringify(entries.map(e=>({id:e.id,original_sha256:e.sha256,disposition:'unreviewed',reviewer:null,rationale:null,target_knowledge_id:null,evidence_inspected:[],verification:'unverified',license_privacy:'pending'})),null,2)+'\n');
const lines=['# Complete lesson review inputs','','359 historical candidates + 10 pilot candidates = 369. These are review inputs, not approved knowledge. Original bodies and license labels are preserved. Do not redistribute without privacy/license review. Nine secret-scanned omissions and 404 inventory-only narrative documents from the earlier harvest are not included as candidate bodies. External test/source citations may require the original repository; missing evidence must be recorded. No Agent Control product code or state is bundled.','','See [specification](../SPEC.md), [manifest](manifest.json), [review ledger](review-ledger.json). Run `node verify.mjs` from this directory to check hashes/counts. Dispositions begin unreviewed; no lesson has been promoted.','','| ID | Group | Candidate | Source bundle |','|---|---|---|---|'];
for(const e of entries)lines.push(`| ${e.id} | ${e.group} | [${e.title.replaceAll('|','/').replaceAll('[','(').replaceAll(']',')')}](${e.path}) | ${e.bundle} |`);
writeFileSync(path.join(out,'INDEX.md'),lines.join('\n')+'\n');
console.log(`Packaged ${entries.length} candidates; ${bundles.length} historical source manifests preserved.`);
