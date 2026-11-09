// {{NAME}} — a dependency-free web server. The handler is pure and tested; listening is a thin wrapper.
import { createServer } from 'node:http';
import { pathToFileURL } from 'node:url';

export function handle(method, url) {
  if (method === 'GET' && url === '/') return { status: 200, type: 'text/html; charset=utf-8', body: '<!doctype html><title>{{NAME}}</title><h1>{{NAME}}</h1>' };
  if (method === 'GET' && url === '/health') return { status: 200, type: 'application/json', body: '{"ok":true}' };
  return { status: 404, type: 'text/plain; charset=utf-8', body: 'not found' };
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const port = Number(process.env.PORT || 3000);
  createServer((req, res) => {
    const r = handle(req.method, req.url);
    res.writeHead(r.status, { 'content-type': r.type }); res.end(r.body);
  }).listen(port, '127.0.0.1', () => console.log(`http://127.0.0.1:${port}/`));
}
