// Every project type scaffolds into a repo whose gate passes on day one, with the protocol in place.
import { test, after } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { KIT, cleanup, kit, project, vkit } from './helpers.mjs';

const dirs = [];
after(() => cleanup(...dirs));

for (const type of ['cli', 'library', 'web', 'content']) {
  test(`kit new --type ${type}: gate passes, AGENTS.md is the protocol, knowledge is vendored`, () => {
    const P = project(`type-${type}`, KIT, type); dirs.push(P.parent);
    const g = vkit(P.dir, ['gate']); assert.equal(g.code, 0, g.out);
    assert.equal(readFileSync(join(P.dir, 'AGENTS.md'), 'utf8'), readFileSync(join(KIT, 'ENTRY.md'), 'utf8'));
    for (const f of ['CLAUDE.md', 'docs/next.md', 'docs/PROJECT-BOOK.md', 'knowledge/README.md', '.tins/kit/src/knowledge.mjs', '.gitignore']) {
      assert.ok(existsSync(join(P.dir, f)), `${f} missing`);
    }
    assert.match(readFileSync(join(P.dir, 'SPEC.md'), 'utf8'), new RegExp(`type-${type}`));
  });
}

test('the kit itself: protocol files within budget, tree matches its stamp', () => {
  const l = kit(KIT, ['lint-kit']); assert.equal(l.code, 0, l.out);
});
