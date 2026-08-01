import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, join, normalize, resolve } from 'node:path';

const MIME: Record<string, string> = {
  '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css',
  '.json': 'application/json', '.map': 'application/json', '.svg': 'image/svg+xml',
};

export function startServer(root: string, port = 0): Promise<{ url: string; close(): void }> {
  const absRoot = resolve(root);
  const srv = createServer(async (req, res) => {
    try {
      const path = normalize(decodeURIComponent((req.url ?? '/').split('?')[0]));
      const file = join(absRoot, path);
      if (!file.startsWith(absRoot)) { res.writeHead(403); res.end(); return; }
      const data = await readFile(file);
      res.writeHead(200, { 'content-type': MIME[extname(file)] ?? 'application/octet-stream' });
      res.end(data);
    } catch {
      res.writeHead(404); res.end();
    }
  });
  return new Promise(ok => srv.listen(port, () => {
    const addr = srv.address();
    if (addr === null || typeof addr === 'string') throw new Error('no port');
    ok({ url: `http://localhost:${addr.port}`, close: () => srv.close() });
  }));
}
