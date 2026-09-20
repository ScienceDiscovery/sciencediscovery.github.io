import { execFileSync } from 'node:child_process'
import { copyFileSync, existsSync, mkdirSync, readFileSync, readdirSync, unlinkSync, writeFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { createHash } from 'node:crypto'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const source = process.argv[2] && resolve(process.argv[2])
if (!source || source === root || !existsSync(join(source, 'docs/en/README.md'))) {
  throw new Error('Usage: npm run sync:docs -- <product-repository> (a separate, read-only source checkout)')
}
const revision = execFileSync('git', ['-C', source, 'rev-parse', 'HEAD'], { encoding: 'utf8' }).trim()
const changes = execFileSync('git', ['-C', source, 'status', '--porcelain', '--', 'docs', 'LICENSE'], { encoding: 'utf8' })
if (changes.trim()) throw new Error('Commit the source documentation changes before syncing a reproducible snapshot.')
const paths = execFileSync('git', ['-C', source, 'ls-files', '-z', '--', 'docs', 'LICENSE'], { encoding: 'utf8' }).split('\0').filter(Boolean)
const manifestPath = join(root, 'docs-source.json')
const previous = existsSync(manifestPath) ? JSON.parse(readFileSync(manifestPath, 'utf8')).files : {}
const files = {}
for (const path of paths) {
  // Only product-owned files are replaced; landing pages and theme stay local.
  if (path.includes('/.vitepress/') || /docs\/(en\/|zh\/)?index\.md$/.test(path)) throw new Error(`Reserved website path: ${path}`)
  const target = join(root, path)
  mkdirSync(dirname(target), { recursive: true })
  copyFileSync(join(source, path), target)
  files[path] = createHash('sha256').update(readFileSync(target)).digest('hex')
}
for (const path of Object.keys(previous)) {
  if (!files[path] && paths.length && (path.startsWith('docs/') || path === 'LICENSE')) unlinkSync(join(root, path))
}
writeFileSync(manifestPath, JSON.stringify({ repository: 'https://gitcode.com/openJiuwen/sciencediscovery', revision, files }, null, 2) + '\n')
console.log(`Synced ${paths.length} files from ${revision}; source checkout was only read.`)
