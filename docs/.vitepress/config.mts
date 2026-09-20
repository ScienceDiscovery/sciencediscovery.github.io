import { defineConfig } from 'vitepress'
import { readFileSync, readdirSync } from 'node:fs'
import { dirname, resolve, posix } from 'node:path'
import { fileURLToPath } from 'node:url'
import { slug } from 'github-slugger'

const docsRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const categories = {
  en: ['Tutorials', 'How-to guides', 'Reference', 'Explanation'],
  zh: ['教程 · Tutorial', '操作指南 · How-to', '参考 · Reference', '解释 · Explanation']
}
function sidebar(lang: 'en' | 'zh') {
  return [
    { text: lang === 'zh' ? '文档总览' : 'Documentation overview', link: `/${lang}/README` },
    ...['tutorial', 'how-to', 'reference', 'explanation'].map((category, index) => ({
      text: categories[lang][index], collapsed: index > 1,
      items: readdirSync(resolve(docsRoot, lang, category)).filter(name => name.endsWith('.md')).sort().map(name => ({
        text: readFileSync(resolve(docsRoot, lang, category, name), 'utf8').match(/^# (.+)/m)?.[1] ?? name,
        link: `/${lang}/${category}/${name.replace(/\.md$/, '')}`
      }))
    }))
  ]
}
function localTheme(lang: 'en' | 'zh') {
  const zh = lang === 'zh'
  return {
    nav: [
      { text: zh ? '下载' : 'Download', link: `/${lang}/#download` },
      { text: zh ? '部署' : 'Deployment', link: `/${lang}/how-to/deployment` },
      { text: zh ? '文档' : 'Documentation', link: `/${lang}/README` },
      { text: 'GitHub', link: 'https://github.com/openJiuwen-ai/sciencediscovery' }
    ],
    outline: { label: zh ? '本页内容' : 'On this page', level: [2, 3] as [number, number] },
    docFooter: { prev: zh ? '上一篇' : 'Previous page', next: zh ? '下一篇' : 'Next page' },
    sidebarMenuLabel: zh ? '文档目录' : 'Documentation menu',
    returnToTopLabel: zh ? '回到顶部' : 'Return to top',
    darkModeSwitchLabel: zh ? '外观' : 'Appearance'
  }
}

export default defineConfig({
  title: 'ScienceDiscovery',
  description: 'A research workspace for literature review, code, experiments, and scientific workflows.',
  base: '/',
  cleanUrls: false,
  // Keep the upstream Markdown paths readable both on GitHub and on Pages.
  srcExclude: ['**/node_modules/**'],
  head: [['link', { rel: 'icon', type: 'image/svg+xml', href: '/mark.svg' }], ['meta', { name: 'theme-color', content: '#147b66' }]],
  sitemap: { hostname: 'https://sciencediscovery.github.io' },
  locales: {
    en: { label: 'English', lang: 'en', link: '/en/', themeConfig: localTheme('en') },
    zh: { label: '简体中文', lang: 'zh-CN', link: '/zh/', description: '面向科学研究的工作台，连接文献调研、代码开发与实验探索。', themeConfig: localTheme('zh') }
  },
  themeConfig: {
    ...localTheme('en'),
    logo: '/mark.svg',
    // Some upstream explanation pages are Chinese-only. Switching to the locale
    // homepage keeps those pages from linking to a nonexistent translation.
    i18nRouting: false,
    search: { provider: 'local' },
    sidebar: { '/en/': sidebar('en'), '/zh/': sidebar('zh') },
    footer: { message: 'ScienceDiscovery · Open source under Apache 2.0', copyright: 'Built for scientific research.' }
  },
  markdown: {
    anchor: { slugify: slug },
    config(md) {
      // Upstream prose uses angle-bracket placeholders such as <hash>. Treat
      // those as text while retaining Vue support in our own landing pages.
      md.core.ruler.before('normalize', 'upstream-html-literals', state => {
        state.md.options.html = /(^|\/)index\.md$/.test(state.env.relativePath ?? '')
      })
      md.core.ruler.after('inline', 'product-source-links', state => {
        const relativePath = state.env.relativePath
        if (!relativePath) return
        for (const token of state.tokens) for (const child of token.children ?? []) {
          if (child.type !== 'link_open') continue
          const href = child.attrGet('href')
          if (!href || /^(?:[a-z]+:|\/|#)/i.test(href)) continue
          const target = posix.normalize(posix.join(posix.dirname(relativePath), href))
          if (target.startsWith('../')) {
            child.attrSet('href', `https://github.com/openJiuwen-ai/sciencediscovery/blob/main/${target.replace(/^\.\.\//, '')}`)
          }
        }
      })
    }
  }
})
