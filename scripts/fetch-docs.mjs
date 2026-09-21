// Keeps ./sciencediscovery (a sparse, shallow checkout of the product repository) up to date.
// ./docs is a committed symlink to sciencediscovery/docs, so the site always renders the product's own docs.
//   node scripts/fetch-docs.mjs               clone if missing, otherwise fast-forward to the latest main
//   node scripts/fetch-docs.mjs --if-missing  clone only when the checkout is absent (used by `npm run build`)
import { execFileSync } from 'node:child_process'
import { existsSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const dir = join(root, 'sciencediscovery')
const repo = process.env.PRODUCT_REPO || 'https://github.com/openJiuwen-ai/sciencediscovery.git'
const branch = process.env.PRODUCT_BRANCH || 'main'
const git = (...args) => execFileSync('git', args, { stdio: 'inherit' })

if (!existsSync(join(dir, 'docs'))) {
  git('clone', '--depth', '1', '--branch', branch, '--filter=blob:none', '--sparse', repo, dir)
  git('-C', dir, 'sparse-checkout', 'set', 'docs')
} else if (!process.argv.includes('--if-missing')) {
  git('-C', dir, 'fetch', '--depth', '1', 'origin', branch)
  git('-C', dir, 'reset', '--hard', 'FETCH_HEAD')
}
console.log(`Product docs at ${execFileSync('git', ['-C', dir, 'rev-parse', '--short', 'HEAD'], { encoding: 'utf8' }).trim()} (${repo}@${branch})`)
