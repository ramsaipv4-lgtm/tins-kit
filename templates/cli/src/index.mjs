#!/usr/bin/env node
// {{NAME}} — a pure core (exported, tested) and a thin CLI wrapper.
import { pathToFileURL } from 'node:url';

export function greet(name) {
  if (!name) throw new Error('name is required');
  return `hello, ${name}`;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  try { console.log(greet(process.argv[2])); } catch (e) { console.error(e.message); process.exit(2); }
}
