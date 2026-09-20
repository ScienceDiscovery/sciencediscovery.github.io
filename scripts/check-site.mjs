import { existsSync, readFileSync, readdirSync } from 'node:fs'
import { join, resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { createHash } from 'node:crypto'
import { parse } from 'parse5'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const dist = join(root, 'dist')
const manifest = JSON.parse(readFileSync(join(root, 'docs-source.json'), 'utf8'))
const failures = []
for (const [path, digest] of Object.entries(manifest.files)) {
  if (!existsSync(join(root, path)) || createHash('sha256').update(readFileSync(join(root, path))).digest('hex') !== digest) {
    failures.push(`Synced source has changed: ${path}. Update the product documentation, then sync again.`)
  }
}
function allFiles(path) {
  return readdirSync(path, { withFileTypes: true }).flatMap(entry => entry.isDirectory() ? allFiles(join(path, entry.name)) : [join(path, entry.name)])
}
const pages = new Map()
function visit(node, fn) {
  fn(node)
  for (const child of node.childNodes ?? []) visit(child, fn)
}
for (const path of allFiles(dist).filter(path => path.endsWith('.html'))) {
  const html = readFileSync(path, 'utf8')
  const ids = new Set(), links = []
  visit(parse(html), node => {
    const attrs = Object.fromEntries((node.attrs ?? []).map(attr => [attr.name, attr.value]))
    if (attrs.id) ids.add(attrs.id)
    if (node.tagName === 'a' && attrs.href) links.push(attrs.href)
    if (node.tagName === 'img' && attrs.src) links.push(attrs.src)
    if (node.tagName === 'script' && attrs.src) links.push(attrs.src)
    if (node.tagName === 'link' && attrs.href) links.push(attrs.href)
  })
  if (/\/resources\/|\/home\/|\/Users\//i.test(html)) failures.push(`Private reference in ${path.slice(dist.length)}`)
  pages.set(path, { ids, links })
}
let checked = 0
for (const [path, { links }] of pages) for (const href of links) {
  const url = new URL(href, `https://site.test${path.slice(dist.length)}`)
  if (url.origin !== 'https://site.test') continue
  const pathname = decodeURIComponent(url.pathname)
  const target = join(dist, pathname.endsWith('/') ? `${pathname}index.html` : pathname)
  checked++
  if (!existsSync(target)) failures.push(`${path.slice(dist.length)} → missing ${href}`)
  else if (url.hash && pages.has(target) && !pages.get(target).ids.has(decodeURIComponent(url.hash.slice(1)))) failures.push(`${path.slice(dist.length)} → missing anchor ${href}`)
}
if (failures.length) {
  console.error([...new Set(failures)].join('\n'))
  process.exitCode = 1
} else console.log(`Verified ${pages.size} HTML pages, ${checked} local links/assets, and ${Object.keys(manifest.files).length} unchanged source files.`)
