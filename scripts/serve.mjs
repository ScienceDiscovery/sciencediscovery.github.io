// Minimal static preview server for dist/. Fails instead of silently choosing another port.
import { createServer } from 'node:http'
import { existsSync, readFileSync, statSync } from 'node:fs'
import { dirname, extname, join, normalize, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const dist = resolve(dirname(fileURLToPath(import.meta.url)), '..', 'dist')
const port = Number(process.env.PORT || 4173)
const types = { '.html': 'text/html; charset=utf-8', '.css': 'text/css', '.js': 'text/javascript', '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg' }
if (!existsSync(dist)) throw new Error('dist/ is missing. Run `npm run build` first.')
createServer((req, res) => {
  const pathname = decodeURIComponent(new URL(req.url, 'http://x').pathname)
  let file = normalize(join(dist, pathname))
  if (!file.startsWith(dist)) return res.writeHead(403).end()
  if (existsSync(file) && statSync(file).isDirectory()) file = join(file, 'index.html')
  if (!existsSync(file)) file = join(dist, '404.html')
  res.writeHead(existsSync(file) ? 200 : 404, { 'content-type': types[extname(file)] || 'application/octet-stream', 'cache-control': 'no-cache' })
  res.end(readFileSync(file))
}).listen(port, '127.0.0.1', () => console.log(`Preview at http://127.0.0.1:${port}/`)).on('error', (e) => { throw e })
