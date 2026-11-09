// {{NAME}} — library entry point. Keep the public surface small and listed in SPEC.md.
export function add(a, b) {
  if (!Number.isFinite(a) || !Number.isFinite(b)) throw new TypeError('add() needs two finite numbers');
  return a + b;
}
