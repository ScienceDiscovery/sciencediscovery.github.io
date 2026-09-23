// Builds the static site (home, docs, downloads) into website/dist for GitHub Pages.
// Docs are rendered from ../docs/{en,zh}; a page missing in one language falls back to the other.
import { readFileSync, writeFileSync, mkdirSync, cpSync, existsSync, readdirSync, statSync, rmSync } from 'node:fs';
import { dirname, join, relative, resolve, posix, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { marked, Marked } from 'marked';
import hljs from 'highlight.js';
import GithubSlugger from 'github-slugger';
import { createHash } from 'node:crypto';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(HERE, '..');
const DOCS = join(ROOT, 'docs');
const DIST = join(ROOT, 'dist');
const RELEASE = JSON.parse(readFileSync(join(ROOT, 'release.json'), 'utf8'));
const REPO = process.env.SITE_REPO || 'openJiuwen-ai/sciencediscovery';
const BRANCH = process.env.SITE_BRANCH || 'feat/jiuwenswarm';
const GH = `https://github.com/${REPO}`;
const LANGS = ['en', 'zh'];

// ---------------------------------------------------------------- i18n
const T = {
  en: {
    name: 'ScienceDiscovery', tag: 'AI research workspace',
    nav: { home: 'Home', docs: 'Documentation', download: 'Download' },
    langLabel: '中文',
    eyebrow: 'Open source · Apache-2.0',
    h1: 'The AI workspace for <em>scientific research</em>',
    lead: 'From literature review and hypotheses to code, experiments and tuning — plan, execute, evolve and trace every result in one sandboxed environment.',
    ctaDownload: 'Download', ctaDocs: 'Read the docs', ctaGh: 'View on GitHub',
    demoHint: 'Everything above is interactive — click a node, replay a run, switch views.',
    demoUrl: '127.0.0.1:4310',
    featTitle: 'Built for the whole research loop',
    featSub: 'One local workspace that plans the work, runs it safely, searches for better answers, and remembers where every conclusion came from.',
    feats: [
      ['flask', 'Sandboxed code exploration', 'Agents write, debug and run Python, R and shell inside a fail-closed Bubblewrap / Seatbelt sandbox with managed scientific environments.', 'developer-docs/sandbox-execution', 'Sandbox'],
      ['tree', 'Idea Tree', 'A self-directed research engine that proposes, designs, independently scores and prunes candidate ideas, then feeds insights back into the next round.', 'core/idea-tree', 'Idea Tree'],
      ['dna', 'Evolve', 'Improve a program by repeated search: write variants, score each one against your metric, keep what works, and verify on held-out data.', 'core/evolve', 'Evolve'],
      ['graph', 'Memory graph', 'ScienceMemory records tasks and citations as a clickable graph, so "where did this conclusion come from" always has an answer.', 'developer-docs/science-memory', 'Memory graph'],
      ['users', 'Subagents & skills', 'A main agent decomposes complex work and dispatches specialised subagents, drawing on a library of domain skills loaded progressively.', 'developer-docs/subagent-orchestration', 'Subagents'],
      ['plug', 'Connectors & MCP', 'One-click literature and data connectors, custom MCP servers, PDF extraction and a governed permission and review flow.', 'developer-docs/science-connectors', 'Connectors']
    ],
    learn: 'Learn more →',
    ctaBoxTitle: 'Run it on your own machine',
    ctaBoxSub: 'A single binary, no cloud account. Start the stack and open the UI in your browser.',
    footNote: 'ScienceDiscovery is a workflow orchestration tool and does not embed any AI model.',
    footLinks: [['Documentation', 'docs/index.html'], ['Download', 'download/index.html']],
    demo: {
      task: ['Task', 'Session', 'Literature → analysis → report', 'Replay'],
      tree: ['Idea Tree', 'Idea Tree', 'Improve perovskite lifetime', 'Inspect random node'],
      evolve: ['Evolve', 'Program evolution', 'Minimise f(x,y) in 200 calls', 'Replay search'],
      memory: ['Memory graph', 'ScienceMemory', 'Trace a report back to its sources', 'Trace random node'],
      agents: ['Subagents', 'Orchestration', 'Four specialists, one goal', 'Restart'],
      projects: 'Projects', sessions: 'Sessions',
      sess: ['Perovskite stability', 'Kinase screening', 'Benchmark tuning'],
      prompt: 'Survey additives that improve perovskite stability and build a degradation model.',
      reply: 'I will search three databases, read the key papers, fit a model in the sandbox and write a cited report.',
      running: 'running', done: 'done',
      final: 'Report ready: 9 claims, each linked to its evidence in the memory graph.',
      rootDesc: 'Research goal. Child ideas are designed, scored independently and aggregated.',
      best: 'best so far', evaluated: 'evaluated', score: 'Score',
      dims: ['Viability', 'Stability', 'Sustainability'], parent: 'Parent',
      lineage: 'Lineage', lineageHint: 'Click any node to trace what it depends on.',
      legend: [['#22a06b', 'strong'], ['#2563eb', 'evaluated'], ['#d19a32', 'weak']],
      best2: 'best', nodes: 'nodes'
    },
    dl: {
      title: 'Download ScienceDiscovery', sub: 'Pick the package for your system. Everything runs locally; no account is needed.',
      latest: 'Latest release', notes: 'Release notes', recommended: 'Recommended for you',
      linux: ['Linux', 'x86_64 and aarch64 · needs bubblewrap'], macos: ['macOS', 'Apple Silicon and Intel · Seatbelt sandbox'], windows: ['Windows', 'Windows 10 / 11 · x64'],
      soon: 'Prebuilt package not published yet', build: 'Build from source', buildLink: 'docs/getting-started/deployment.html',
      docker: 'Docker (Linux)', dockerLink: 'docs/getting-started/deployment.html#docker-deployment',
      startTitle: 'After downloading',
      startSteps: 'Make the binary executable and start the stack, then open the <code>Open to sign in</code> URL printed in the terminal.',
      startCode: 'chmod +x ./ScienceDiscovery-*-linux-x86_64\n./ScienceDiscovery-*-linux-x86_64 serve',
      note: 'Prebuilt binaries are currently published for Linux. macOS users can run ScienceDiscovery from source today — see the build guide.',
      all: 'All releases on GitHub'
    },
    docs: {
      title: 'Documentation', menu: 'Menu', on: 'On this page', prev: 'Previous', next: 'Next',
      onlyOther: 'This page is only available in Chinese so far.', homeIntro: 'Start here, then dive into the features you need.',
      groups: 'Guides', allDocs: 'All documents',
      sections: { start: 'Getting started', core: 'Core features', domain: 'Domain tutorials', ref: 'Reference', explain: 'Explanation', howto: 'How-to guides', 'advanced-setup': 'Advanced setup', 'developer-docs': 'Developer docs', domains: 'Domain guides', 'getting-started': 'Getting started' }
    }
  },
  zh: {
    name: 'ScienceDiscovery', tag: 'AI 科研工作台',
    nav: { home: '首页', docs: '文档', download: '下载' },
    langLabel: 'English',
    eyebrow: '开源 · Apache-2.0',
    h1: '面向<em>科学研究</em>的 AI 工作台',
    lead: '从文献调研、假设提出，到代码开发、实验试错与调参——在同一个沙箱环境里规划、执行、进化，并追溯每一个结果。',
    ctaDownload: '下载', ctaDocs: '阅读文档', ctaGh: '在 GitHub 查看',
    demoHint: '上面的界面都可以操作——点击节点、重放运行、切换视图。',
    demoUrl: '127.0.0.1:4310',
    featTitle: '覆盖完整的科研闭环',
    featSub: '一个本地工作台：规划任务、安全执行、搜索更优解，并记住每个结论的来源。',
    feats: [
      ['flask', '沙箱内自主代码探索', 'Agent 在 fail-closed 的 Bubblewrap / Seatbelt 沙箱中编写、调试并运行 Python、R 与 Shell，并使用受管科学计算环境。', 'developer-docs/sandbox-execution', '沙箱'],
      ['tree', 'Idea Tree', '自主研究引擎：提出、设计、独立评分并筛选候选想法，再把洞察回传给下一轮。', 'core/idea-tree', 'Idea Tree'],
      ['dna', 'Evolve 程序演进', '通过反复搜索改进程序：写出变体、按你的指标逐个评分、保留有效者，并在留出集上验证。', 'core/evolve', 'Evolve'],
      ['graph', '记忆图谱', 'ScienceMemory 把任务链与引用链记录成可点击的图，“这个结论从哪来”总能回答。', 'developer-docs/science-memory', '记忆图谱'],
      ['users', 'Subagent 与技能', '主 Agent 拆解复杂任务并派发专业 Subagent，按需渐进加载领域技能库。', 'developer-docs/subagent-orchestration', 'Subagent'],
      ['plug', '连接器与 MCP', '一键接入文献与数据连接器，支持自定义 MCP、PDF 抽取，以及受控的权限与评审流程。', 'developer-docs/science-connectors', '连接器']
    ],
    learn: '了解更多 →',
    ctaBoxTitle: '在你自己的机器上运行',
    ctaBoxSub: '单个可执行文件，无需云账号。启动服务，在浏览器中打开界面。',
    footNote: 'ScienceDiscovery 仅作为工作流编排工具，不内置任何 AI 模型。',
    footLinks: [['文档', 'docs/index.html'], ['下载', 'download/index.html']],
    demo: {
      task: ['任务', '会话', '文献 → 分析 → 报告', '重放'],
      tree: ['Idea Tree', 'Idea Tree', '提升钙钛矿寿命', '随机查看节点'],
      evolve: ['Evolve', '程序演进', '在 200 次调用内最小化 f(x,y)', '重放搜索'],
      memory: ['记忆图谱', 'ScienceMemory', '把报告追溯到原始来源', '随机追溯节点'],
      agents: ['Subagent', '编排', '四位专家，一个目标', '重新开始'],
      projects: '项目', sessions: '会话',
      sess: ['钙钛矿稳定性', '激酶筛选', '基准调优'],
      prompt: '调研能提升钙钛矿稳定性的添加剂，并建立衰减模型。',
      reply: '我会检索三个数据库、精读关键论文、在沙箱里拟合模型，最后写出带引用的报告。',
      running: '运行中', done: '完成',
      final: '报告已生成：9 条结论，均在记忆图谱中关联到证据。',
      rootDesc: '研究目标。子想法会被设计、独立评分并聚合。',
      best: '当前最优', evaluated: '已评估', score: '得分',
      dims: ['活性', '稳定性', '可持续性'], parent: '父节点',
      lineage: '溯源链', lineageHint: '点击任意节点，查看它依赖的上游。',
      legend: [['#22a06b', '优'], ['#2563eb', '已评估'], ['#d19a32', '较弱']],
      best2: '最优', nodes: '节点'
    },
    dl: {
      title: '下载 ScienceDiscovery', sub: '选择适合你系统的安装包。全部本地运行，无需账号。',
      latest: '最新版本', notes: '发布说明', recommended: '为你推荐',
      linux: ['Linux', 'x86_64 与 aarch64 · 需要 bubblewrap'], macos: ['macOS', 'Apple 芯片与 Intel · Seatbelt 沙箱'], windows: ['Windows', 'Windows 10 / 11 · x64'],
      soon: '暂未发布预编译包', build: '从源码构建', buildLink: 'docs/getting-started/deployment.html',
      docker: 'Docker（Linux）', dockerLink: 'docs/getting-started/deployment.html#docker-部署',
      startTitle: '下载之后',
      startSteps: '赋予可执行权限并启动服务，然后在浏览器中打开终端输出的 <code>Open to sign in</code> 链接。',
      startCode: 'chmod +x ./ScienceDiscovery-*-linux-x86_64\n./ScienceDiscovery-*-linux-x86_64 serve',
      note: '目前预编译二进制仅发布 Linux 版本。macOS 用户现在可以从源码运行，详见构建指南。',
      all: '在 GitHub 查看全部版本'
    },
    docs: {
      title: '文档', menu: '目录', on: '本页内容', prev: '上一篇', next: '下一篇',
      onlyOther: '本页暂时只有英文版。', homeIntro: '从这里开始，再深入你需要的功能。',
      groups: '指南', allDocs: '全部文档',
      sections: { start: '快速开始', core: '核心功能', domain: '领域教程', ref: '参考', explain: '原理说明', howto: '操作指南', 'advanced-setup': '高级配置', 'developer-docs': '开发文档', domains: '领域指南', 'getting-started': '快速开始' }
    }
  }
};

// Curated navigation. Keys are doc paths relative to docs/<lang>, without ".md".
const NAV = [
  ['start', [
    ['getting-started/quick-start', { en: 'Quick start', zh: '快速开始' }],
    ['getting-started/deployment', { en: 'Build from source & deploy', zh: '源码构建与部署' }],
    ['reference/runtime-behavior', { en: 'Basic features & runtime', zh: '基础功能与运行机制' }],
    ['reference/builtin-tools', { en: 'Built-in tools', zh: '内置工具' }],
    ['developer-docs/web-frontend', { en: 'Web interface', zh: 'Web 界面' }]
  ]],
  ['core', [
    ['reference/configuration', { en: 'Configure models & settings', zh: '配置模型与系统设置' }],
    ['core/idea-tree', { en: 'Idea Tree', zh: 'Idea Tree' }],
    ['core/evolve', { en: 'Evolve', zh: 'Evolve 程序演进' }],
    ['domains/evolve-a-solution', { en: 'Tutorial: evolve a solution', zh: '教程：演进出一个解' }],
    ['domains/run-an-evolution-search', { en: 'Run an evolution search', zh: '运行演进搜索' }],
    ['developer-docs/science-memory', { en: 'Memory graph', zh: '记忆图谱' }],
    ['advanced-setup/science-memory-setup', { en: 'Set up the memory graph', zh: '配置记忆图谱' }],
    ['developer-docs/subagent-orchestration', { en: 'Subagents', zh: 'Subagent 编排' }],
    ['developer-docs/skill-progressive-disclosure', { en: 'Skills', zh: '技能渐进披露' }],
    ['advanced-setup/configure-custom-mcp', { en: 'Custom MCP servers', zh: '自定义 MCP' }],
    ['advanced-setup/configure-network-proxy', { en: 'Network proxy', zh: '网络代理' }]
  ]],
  ['domain', [
    ['domains/literature-research', { en: 'Literature research', zh: '文献调研' }],
    ['domains/evolve-a-solution', { en: 'Algorithm & program optimisation', zh: '算法与程序优化' }]
  ]]
];

// ---------------------------------------------------------------- icons (same stroke style as the app)
const svg = (d, s = 20) => `<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${d}</svg>`;
const IC = {
  brand: '<path d="M10 2v7.53L4.65 18.35a2 2 0 0 0 1.71 3.03h11.28a2 2 0 0 0 1.71-3.03L14 9.53V2"/><path d="M8.5 2h7"/><path d="M7.3 15h9.4"/>',
  flask: '<path d="M10 2v7.53L4.65 18.35a2 2 0 0 0 1.71 3.03h11.28a2 2 0 0 0 1.71-3.03L14 9.53V2"/><path d="M8.5 2h7"/><path d="M7.3 15h9.4"/>',
  tree: '<circle cx="12" cy="5" r="2.5"/><circle cx="5.5" cy="19" r="2.5"/><circle cx="18.5" cy="19" r="2.5"/><path d="M12 7.5v4M12 11.5H5.5v5M12 11.5h6.5v5"/>',
  dna: '<path d="M6 3c0 6 12 6 12 12s-12 6-12 6"/><path d="M18 3c0 6-12 6-12 12"/><path d="M8 7h8M8 17h8"/>',
  graph: '<circle cx="6" cy="6" r="2.5"/><circle cx="18" cy="8" r="2.5"/><circle cx="12" cy="18" r="2.5"/><path d="M8.2 7l7.6.7M7 8.3l4 7.6M16.8 10l-3.8 6"/>',
  users: '<circle cx="9" cy="8" r="3"/><path d="M3 20c0-3.3 2.7-6 6-6s6 2.7 6 6"/><path d="M16 5.2a3 3 0 0 1 0 5.6M18.5 14.5c1.6.8 2.5 2.7 2.5 5.5"/>',
  plug: '<path d="M9 2v5M15 2v5M6 7h12v4a6 6 0 0 1-12 0V7zM12 17v5"/>',
  task: '<path d="M4 5h16v11H9l-5 4z"/>',
  github: '<path d="M9 19c-4.3 1.4-4.3-2.5-6-3m12 5v-3.5c0-1 .1-1.4-.5-2 2.8-.3 5.5-1.4 5.5-6a4.6 4.6 0 0 0-1.3-3.2 4.2 4.2 0 0 0-.1-3.2s-1.1-.3-3.5 1.3a12.3 12.3 0 0 0-6.2 0C6.5 2.8 5.4 3.1 5.4 3.1a4.2 4.2 0 0 0-.1 3.2A4.6 4.6 0 0 0 4 9.5c0 4.6 2.7 5.7 5.5 6-.6.6-.6 1.2-.5 2V21"/>',
  download: '<path d="M12 3v12M7 10l5 5 5-5M4 20h16"/>',
  book: '<path d="M4 4.5A2.5 2.5 0 0 1 6.5 2H20v17H6.5A2.5 2.5 0 0 0 4 21.5z"/><path d="M4 21.5V4.5"/>',
  linux: '<path d="M12 3c-2 0-3 1.8-3 4 0 1.5-.4 2.4-1.3 3.8C6.5 12.500 5.500 14 5.500 16c0 1 .5 1.700 1.500 2 .5 1.500 1.700 3 5 3s4.500-1.500 5-3c1-.3 1.500-1 1.500-2 0-2-1-3.500-2.200-5.200C15.400 9.400 15 8.500 15 7c0-2.200-1-4-3-4z"/>',
  apple: '<path d="M16.500 12.500c0-2.200 1.800-3.200 1.900-3.300-1-1.500-2.600-1.700-3.200-1.700-1.400-.1-2.600.8-3.300.8-.7 0-1.700-.8-2.800-.8-1.400 0-2.800.8-3.500 2.100-1.500 2.600-.4 6.500 1.100 8.600.7 1 1.600 2.200 2.700 2.100 1.100 0 1.500-.7 2.800-.7s1.700.7 2.800.7c1.200 0 1.900-1 2.600-2.100.8-1.200 1.100-2.300 1.200-2.400-.1 0-2.300-.9-2.300-3.300zM14.300 6c.6-.7 1-1.700.9-2.700-.9 0-1.900.6-2.500 1.300-.5.600-1 1.600-.9 2.600 1 .1 1.900-.5 2.500-1.200z"/>',
  windows: '<path d="M3 5.500l7.500-1v7H3zM11.500 4.400L21 3v8.500h-9.500zM3 12.500h7.500v7L3 18.500zM11.500 12.500H21V21l-9.500-1.400z"/>'
};

// ---------------------------------------------------------------- markdown
const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

function walk(dir, out = []) {
  for (const f of readdirSync(dir)) {
    const p = join(dir, f);
    if (statSync(p).isDirectory()) walk(p, out); else out.push(p);
  }
  return out;
}

// key -> {en?: path, zh?: path}
const sources = {};
for (const lang of LANGS) {
  const base = join(DOCS, lang);
  for (const f of walk(base).filter((p) => p.endsWith('.md'))) {
    const key = relative(base, f).split(sep).join('/').replace(/\.md$/, '');
    (sources[key] ??= {})[lang] = f;
  }
}
const keyFor = (k) => (k === 'README' ? 'index' : k.replace(/\/README$/, '/index'));
const outPath = (k) => keyFor(k) + '.html';

function h1Of(md) { const m = md.match(/^#\s+(.+)$/m); return m ? m[1].replace(/[`*_]/g, '').trim() : ''; }

// relative URL from page (directory of `from`) to a dist-relative target
const rel = (from, to) => posix.relative(posix.dirname(from), to) || '.';

function makeRenderer(ctx) {
  const toc = [];
  const slugger = new GithubSlugger();
  const renderer = {
    html({ text }) { return esc(text); },
    heading({ tokens, depth }) {
      const text = this.parser.parseInline(tokens);
      const id = slugger.slug(text.replace(/<[^>]+>/g, '')) || 'section';
      if (depth === 2 || depth === 3) toc.push({ depth, id, text: text.replace(/<[^>]+>/g, '') });
      return `<h${depth} id="${id}">${text}</h${depth}>\n`;
    },
    code({ text, lang }) {
      const l = (lang || '').split(/\s/)[0];
      const body = l && hljs.getLanguage(l) ? hljs.highlight(text, { language: l }).value : esc(text);
      return `<pre><code class="hljs${l ? ' language-' + l : ''}">${body}</code></pre>\n`;
    },
    link({ href, title, tokens }) {
      const url = ctx.link(href);
      const ext = /^https?:/.test(url);
      return `<a href="${esc(url)}"${title ? ` title="${esc(title)}"` : ''}${ext ? ' target="_blank" rel="noopener"' : ''}>${this.parser.parseInline(tokens)}</a>`;
    },
    image({ href, title, text }) {
      return `<img src="${esc(ctx.image(href))}" alt="${esc(text)}"${title ? ` title="${esc(title)}"` : ''} loading="lazy">`;
    },
    table(token) {
      return `<div class="table-wrap">${marked.Renderer.prototype.table.call(this, token)}</div>`;
    },
    blockquote({ tokens }) {
      const html = this.parser.parse(tokens);
      const m = html.match(/^<p>\s*\[!(NOTE|TIP|WARNING|IMPORTANT|CAUTION)\]\s*(?:<br>)?\s*/i);
      if (!m) return `<blockquote>${html}</blockquote>\n`;
      const kind = m[1].toLowerCase();
      return `<div class="callout ${kind}"><p class="t">${kind.toUpperCase()}</p><p>${html.slice(m[0].length)}</div>\n`;
    }
  };
  return { renderer, toc };
}

function renderDoc(md, srcFile, lang, pagePath) {
  const srcDir = dirname(srcFile);
  const ctx = {
    link(href) {
      if (!href || /^(https?:|mailto:)/.test(href)) return href;
      const [pathPart, hash = ''] = href.split('#');
      const anchorAliases = { 'sandbox-and-system-requirements': 'sandbox-and-host-requirements' };
      if (!pathPart && hash) return '#' + (anchorAliases[hash] || hash);
      const abs = resolve(srcDir, decodeURI(pathPart));
      const frag = hash ? '#' + (anchorAliases[hash] || hash) : '';
      const m = abs.match(/[\\/]docs[\\/](en|zh)[\\/](.+)\.md$/);
      if (m) {
        const k = m[2].split(sep).join('/');
        if (sources[k]) return rel(pagePath, pathOf(lang, 'docs/' + outPath(k))) + frag;
      }
      const r = relative(ROOT, abs).split(sep).join('/');
      if (r.startsWith('..')) return href;
      const isDir = existsSync(abs) && statSync(abs).isDirectory();
      return `${GH}/${isDir ? 'tree' : 'blob'}/${BRANCH}/${r}${frag}`;
    },
    image(src) {
      if (/^https?:/.test(src)) return src;
      const abs = resolve(srcDir, decodeURI(src));
      const r = relative(join(DOCS, 'images'), abs).split(sep).join('/');
      if (!r.startsWith('..')) return rel(pagePath, 'docs/images/' + r);
      return `${GH}/raw/${BRANCH}/${relative(ROOT, abs).split(sep).join('/')}`;
    }
  };
  const { renderer, toc } = makeRenderer(ctx);
  const html = new Marked({ renderer, gfm: true }).parse(md);
  return { html, toc };
}

// ---------------------------------------------------------------- extra strings
const X = {
  en: {
    deploy: 'Deployment', searchPh: 'Search documentation', searchBtn: 'Search', searchEmpty: 'No results for', searchHint: '↑↓ to navigate · Enter to open · Esc to close', searchLoading: 'Loading index…',
    theme: 'Toggle dark mode',
    docsQuick: 'Quick start'
  },
  zh: {
    deploy: '部署', searchPh: '搜索文档', searchBtn: '搜索', searchEmpty: '没有找到', searchHint: '↑↓ 选择 · Enter 打开 · Esc 关闭', searchLoading: '正在加载索引…',
    theme: '切换深色模式',
    docsQuick: '快速开始'
  }
};
const D = {
  en: {
    title: 'Deploy ScienceDiscovery', sub: 'Three independent paths. Pick one and do not mix them.',
    tabs: ['Prebuilt binary', 'Docker', 'From source'], recommended: 'Recommended',
    reqTitle: 'Requirements',
    bin: { h: 'Prebuilt single-file binary', p: 'One executable per architecture. It embeds Node, Python, the web UI and micromamba, so Bubblewrap is the only host dependency.',
      req: [['OS', 'Linux x86_64 or aarch64'], ['Host dependency', 'bubblewrap 0.6+ (unprivileged user namespaces)'], ['Network', 'first launch installs uv and Python deps from a PyPI mirror']],
      steps: ['Install Bubblewrap.', 'Download the binary for your architecture from the download page and make it executable.', 'Start the stack.', 'Open the “Open to sign in” URL printed in the terminal, then verify the API.'],
      code: ['sudo apt-get install -y bubblewrap   # Debian / Ubuntu\nsudo dnf install -y bubblewrap       # Fedora / RHEL / openEuler', 'chmod +x ./ScienceDiscovery-*-linux-x86_64', './ScienceDiscovery-*-linux-x86_64 serve', 'curl -fsS http://127.0.0.1:4310/health'], link: 'getting-started/deployment.html#single-file-binary-deployment', linkText: 'Binary deployment in the full guide' },
    docker: { h: 'Docker Compose', p: 'One image holds the complete stack. Good for container-based operations on a Linux host.',
      req: [['OS', 'Linux x86_64 or aarch64'], ['Software', 'Docker Engine 24+ and Compose v2'], ['Kernel', 'unprivileged user namespaces for the Bubblewrap sandbox']],
      steps: ['Clone the repository and prepare the environment file and data directory.', 'Build and start.', 'Read the sign-in URL from the logs and check health.'],
      code: ['git clone https://github.com/openJiuwen-ai/sciencediscovery.git && cd sciencediscovery\ncp .env.docker.example .env\nmkdir -p data', 'docker compose build\ndocker compose up -d', 'docker compose logs | grep "Open to sign in"\ncurl -fsS http://127.0.0.1:4310/health'], link: 'getting-started/deployment.html#docker-deployment', linkText: 'Docker deployment in the full guide' },
    src: { h: 'Local source mode', p: 'Runs ordinary host processes from a checkout. Best for development and debugging; supported on Linux and macOS.',
      req: [['Toolchain', 'Node.js 22.19+, pnpm 11.1.2, Python 3, uv 0.9+, Git, curl'], ['Linux sandbox', 'Bubblewrap 0.6+ (0.8+ recommended)'], ['macOS sandbox', 'built-in Seatbelt (/usr/bin/sandbox-exec)']],
      steps: ['Clone the repository.', 'Install, build and start every service.', 'Later starts can skip the build.'],
      code: ['git clone https://github.com/openJiuwen-ai/sciencediscovery.git\ncd sciencediscovery', './scripts/start-stack.sh --mode local', './scripts/start-stack.sh --mode local --no-build'], link: 'getting-started/deployment.html#local-mode-source-checkout', linkText: 'Local mode in the full guide' },
    after: 'After it starts', afterCards: [['Sign in', 'Open the “Open to sign in” URL from the startup output. The browser saves the local service token automatically. Keep the URL private.', 'getting-started/quick-start.html#2-start-sciencediscovery'], ['Configure a model', 'Add a task model under System configuration → Global defaults. ScienceDiscovery embeds no model of its own.', 'getting-started/quick-start.html#3-configure-a-task-model'], ['Run a first task', 'Submit a scientific task and follow the results in the workspace.', 'getting-started/quick-start.html#4-run-a-first-scientific-task']],
    portsTitle: 'Default ports', ports: [['4310', 'Control API and Web UI'], ['4311', 'Runner (loopback only)']],
    warn: 'ScienceDiscovery is not a multi-user production service. The API, runner and gateway listen on loopback by default and the API uses one bearer token without TLS. Exposing it on another interface must be an explicit choice on a trusted network.',
    full: 'Read the full deployment guide'
  },
  zh: {
    title: '部署 ScienceDiscovery', sub: '三种相互独立的路径，选择其一，不要混用。',
    tabs: ['预编译二进制', 'Docker', '源码运行'], recommended: '推荐',
    reqTitle: '前置条件',
    bin: { h: '预编译单文件二进制', p: '每种架构一个可执行文件，内含 Node、Python、Web 界面与 micromamba，宿主机只需安装 Bubblewrap。',
      req: [['系统', 'Linux x86_64 或 aarch64'], ['宿主依赖', 'bubblewrap 0.6+（需非特权用户命名空间）'], ['网络', '首次启动会从 PyPI 镜像安装 uv 与 Python 依赖']],
      steps: ['安装 Bubblewrap。', '在下载页获取对应架构的二进制并赋予可执行权限。', '启动服务。', '打开终端输出的“Open to sign in”链接，并检查 API。'],
      code: ['sudo apt-get install -y bubblewrap   # Debian / Ubuntu\nsudo dnf install -y bubblewrap       # Fedora / RHEL / openEuler', 'chmod +x ./ScienceDiscovery-*-linux-x86_64', './ScienceDiscovery-*-linux-x86_64 serve', 'curl -fsS http://127.0.0.1:4310/health'], link: 'getting-started/deployment.html#单文件二进制部署', linkText: '完整指南中的二进制部署' },
    docker: { h: 'Docker Compose', p: '一个镜像包含完整服务栈，适合 Linux 主机上的容器化运维。',
      req: [['系统', 'Linux x86_64 或 aarch64'], ['软件', 'Docker Engine 24+ 与 Compose v2'], ['内核', 'Bubblewrap 沙箱需要非特权用户命名空间']],
      steps: ['克隆仓库，准备环境文件与数据目录。', '构建并启动。', '从日志读取登录链接并检查健康状态。'],
      code: ['git clone https://github.com/openJiuwen-ai/sciencediscovery.git && cd sciencediscovery\ncp .env.docker.example .env\nmkdir -p data', 'docker compose build\ndocker compose up -d', 'docker compose logs | grep "Open to sign in"\ncurl -fsS http://127.0.0.1:4310/health'], link: 'getting-started/deployment.html#docker-部署', linkText: '完整指南中的 Docker 部署' },
    src: { h: '本地源码模式', p: '从源码仓库直接运行宿主进程，适合开发与调试；支持 Linux 与 macOS。',
      req: [['工具链', 'Node.js 22.19+、pnpm 11.1.2、Python 3、uv 0.9+、Git、curl'], ['Linux 沙箱', 'Bubblewrap 0.6+（建议 0.8+）'], ['macOS 沙箱', '系统自带 Seatbelt（/usr/bin/sandbox-exec）']],
      steps: ['克隆仓库。', '安装、构建并启动全部服务。', '之后启动可跳过构建。'],
      code: ['git clone https://github.com/openJiuwen-ai/sciencediscovery.git\ncd sciencediscovery', './scripts/start-stack.sh --mode local', './scripts/start-stack.sh --mode local --no-build'], link: 'getting-started/deployment.html#本地模式源码检出', linkText: '完整指南中的本地模式' },
    after: '启动之后', afterCards: [['登录', '打开启动输出中的“Open to sign in”链接，浏览器会自动保存本地服务令牌。请勿泄露该链接。', 'getting-started/quick-start.html#2-启动-sciencediscovery'], ['配置模型', '在“系统配置 → 全局默认”中添加任务模型。ScienceDiscovery 本身不内置任何模型。', 'getting-started/quick-start.html#3-配置任务模型'], ['运行第一个任务', '提交一个科研任务，并在工作区查看结果。', 'getting-started/quick-start.html#4-完成第一次-agent-任务']],
    portsTitle: '默认端口', ports: [['4310', '控制 API 与 Web 界面'], ['4311', 'Runner（仅回环地址）']],
    warn: 'ScienceDiscovery 不是多用户生产服务。API、runner 与 gateway 默认只监听回环地址，API 使用单一 bearer token 且不终止 TLS。若要暴露到其他网卡，必须是在可信网络中的明确选择。',
    full: '阅读完整部署指南'
  }
};

// ---------------------------------------------------------------- page shell
const scriptTheme = `<script>(function(){try{var t=localStorage.getItem('sd-theme');if(!t)t=matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light';document.documentElement.dataset.theme=t}catch(e){}})()</script>`;
const rootOf = (pagePath) => rel(pagePath, 'index.html').replace(/index\.html$/, '');

function head(lang, title, pagePath, desc, extraCss = []) {
  const r = (p) => rel(pagePath, p);
  return `<!doctype html>
<html lang="${lang}" data-root="${rootOf(pagePath)}" data-prefix="${lang === 'zh' ? 'zh/' : ''}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(title)}</title>
<meta name="description" content="${esc(desc || T[lang].lead.replace(/<[^>]+>/g, ''))}">
<meta name="google-site-verification" content="Z04-sOshM5D2RBC0A6Vi_SK49QHi3iIlHYwQ2dhywg0" />
<link rel="icon" href="${r('favicon.svg')}" type="image/svg+xml">
${scriptTheme}
<link rel="stylesheet" href="${r('site.css')}">
${extraCss.map((c) => `<link rel="stylesheet" href="${r(c)}">`).join('\n')}
</head>`;
}

function topbar(lang, active, pagePath, otherPath) {
  const t = T[lang], x = X[lang];
  const p = (target) => rel(pagePath, (lang === 'zh' ? 'zh/' : '') + target);
  const item = (id, target, label) => `<a href="${p(target)}"${active === id ? ' class="active"' : ''}>${label}</a>`;
  return `<header class="topbar"><div class="topbar-inner">
<a class="brand" href="${p('index.html')}"><span class="brand-mark">${svg(IC.brand, 20)}</span><span class="brand-name">${t.name}</span></a>
<nav class="topnav">${item('home', 'index.html', t.nav.home)}${item('docs', 'docs/index.html', t.nav.docs)}${item('deploy', 'deployment/index.html', x.deploy)}${item('download', 'download/index.html', t.nav.download)}</nav>
<div class="topbar-actions">
<button class="search-btn" type="button" data-ph="${esc(x.searchPh)}" data-empty="${esc(x.searchEmpty)}" data-hint="${esc(x.searchHint)}" data-loading="${esc(x.searchLoading)}" aria-label="${esc(x.searchPh)}">${svg('<circle cx="11" cy="11" r="6"/><path d="m20 20-4-4"/>', 15)}<span>${x.searchBtn}</span><kbd>⌘K</kbd></button>
<a class="lang-switch" href="${rel(pagePath, otherPath)}" hreflang="${lang === 'zh' ? 'en' : 'zh'}">${t.langLabel}</a>
<button class="theme-toggle" type="button" aria-label="${esc(x.theme)}" title="${esc(x.theme)}">${svg('<path d="M20 14.5A8 8 0 1 1 9.500 4a6.500 6.500 0 0 0 10.500 10.500z"/>', 16).replace('<svg', '<svg class="moon"')}${svg('<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.900 4.900l1.400 1.400M17.700 17.700l1.400 1.400M2 12h2M20 12h2M4.900 19.100l1.400-1.400M17.700 6.300l1.400-1.400"/>', 16).replace('<svg', '<svg class="sun"')}</button>
<a class="icon-link" href="${GH}" target="_blank" rel="noopener">${svg(IC.github, 16)}<span>GitHub</span></a></div>
</div></header>`;
}

function footer(lang, pagePath) {
  const t = T[lang], x = X[lang];
  const p = (target) => rel(pagePath, (lang === 'zh' ? 'zh/' : '') + target);
  return `<footer class="footer"><div class="wrap"><span>© ScienceDiscovery · Apache-2.0 · ${t.footNote}</span>
<span><a href="${p('docs/index.html')}">${t.nav.docs}</a> &nbsp;·&nbsp; <a href="${p('deployment/index.html')}">${x.deploy}</a> &nbsp;·&nbsp; <a href="${p('download/index.html')}">${t.nav.download}</a> &nbsp;·&nbsp; <a href="${GH}">GitHub</a></span></div></footer>`;
}

const pathOf = (lang, page) => (lang === 'zh' ? 'zh/' : '') + page;
const other = (lang, page) => pathOf(lang === 'zh' ? 'en' : 'zh', page);

// ---------------------------------------------------------------- home
function home(lang) {
  const t = T[lang], x = X[lang];
  const page = 'index.html', pagePath = pathOf(lang, page);
  const r = (p) => rel(pagePath, p);
  const docLink = (k) => rel(pagePath, pathOf(lang, 'docs/' + keyFor(k) + '.html'));
  const feats = t.feats.map(([ic, title, text, doc]) => `<a class="card" href="${docLink(doc)}"><div class="ico">${svg(IC[ic], 20)}</div><h3>${title}</h3><p>${text}</p><span class="more">${t.learn}</span></a>`).join('');
  return head(lang, `${t.name} — ${t.tag}`, pagePath, null, ['demo.css']) + `
<body>
${topbar(lang, 'home', pagePath, other(lang, page))}
<main class="wrap">
<section class="hero">
<span class="eyebrow">${svg(IC.flask, 14)}${t.eyebrow}</span>
<h1>${t.h1}</h1>
<p class="lead">${t.lead}</p>
<div class="hero-cta"><a class="btn primary" href="${r(pathOf(lang, 'download/index.html'))}">${svg(IC.download, 17)}${t.ctaDownload}</a><a class="btn" href="${r(pathOf(lang, 'docs/index.html'))}">${svg(IC.book, 17)}${t.ctaDocs}</a><a class="btn" href="${r(pathOf(lang, 'deployment/index.html'))}">${x.deploy}</a></div>
</section>
<div class="app" id="demo" aria-label="Interactive product demo"></div>
<p class="demo-hint">${t.demoHint}</p>
<section class="section"><h2>${t.featTitle}</h2><p class="sub">${t.featSub}</p><div class="grid">${feats}</div></section>
<section class="cta"><h2>${t.ctaBoxTitle}</h2><p class="sub">${t.ctaBoxSub}</p><div class="hero-cta"><a class="btn primary" href="${r(pathOf(lang, 'download/index.html'))}">${t.ctaDownload}</a><a class="btn" href="${r(pathOf(lang, 'docs/getting-started/quick-start.html'))}">${x.docsQuick}</a></div></section>
</main>
${footer(lang, pagePath)}
<script src="${r('site.js')}"></script>
<script src="${r('viz.js')}"></script>
<script src="${r('demo.js')}"></script>
</body></html>`;
}

// ---------------------------------------------------------------- deployment
function deployment(lang) {
  const t = T[lang], d = D[lang];
  const page = 'deployment/index.html', pagePath = pathOf(lang, page);
  const r = (p) => rel(pagePath, p);
  const doc = (p) => rel(pagePath, pathOf(lang, 'docs/' + p));
  const modes = [['bin', d.bin, 0], ['docker', d.docker, 1], ['src', d.src, 2]];
  const tabs = modes.map(([id, , i]) => `<button role="tab" aria-selected="${i === 0}" data-mode="${id}">${d.tabs[i]}${i === 0 ? ` <span class="badge blue" style="margin-left:4px">${d.recommended}</span>` : ''}</button>`).join('');
  const panels = modes.map(([id, m, i]) => `<section class="mode-panel${i === 0 ? ' active' : ''}" data-panel="${id}">
<h2>${m.h}</h2><p>${m.p}</p>
<div class="reqs">${m.req.map(([k, v]) => `<div class="req-item"><b>${k.toUpperCase()}</b>${v}</div>`).join('')}</div>
<ol>${m.steps.map((s, k) => `<li>${s}<pre><code>${esc(m.code[k] || '')}</code></pre></li>`).join('')}</ol>
<a class="readmore" href="${doc(m.link)}">${m.linkText} →</a>
${id === 'bin' ? `<p style="margin:12px 0 0"><a class="btn small primary" href="${r(pathOf(lang, 'download/index.html'))}">${svg(IC.download, 15)}${t.nav.download}</a></p>` : ''}
</section>`).join('');
  const after = d.afterCards.map(([h, p, l]) => `<a class="card" href="${doc(l)}"><h3>${h}</h3><p>${p}</p></a>`).join('');
  const ports = d.ports.map(([n, v]) => `<div class="req-item"><b>${n}</b>${v}</div>`).join('');
  return head(lang, `${d.title} — ${t.name}`, pagePath, d.sub) + `
<body>
${topbar(lang, 'deploy', pagePath, other(lang, page))}
<main class="deploy">
<section class="page-head"><h1>${d.title}</h1><p>${d.sub}</p></section>
<div class="tabs-row"><div class="mode-tabs" role="tablist">${tabs}</div></div>
${panels}
<div class="warn">${d.warn}</div>
<h2 class="h">${d.after}</h2><div class="grid">${after}</div>
<h2 class="h">${d.portsTitle}</h2><div class="reqs" style="grid-template-columns:repeat(2,minmax(0,1fr))">${ports}</div>
<p style="margin-top:28px;text-align:center"><a class="btn" href="${doc('getting-started/deployment.html')}">${svg(IC.book, 16)}${d.full}</a></p>
</main>
${footer(lang, pagePath)}
<script src="${r('site.js')}"></script>
</body></html>`;
}

// ---------------------------------------------------------------- download (pinned to release.json, with checksums)
const OS_OF = (name) => (/win/i.test(name) && !/darwin/i.test(name) ? 'windows' : /mac|darwin/i.test(name) ? 'macos' : 'linux');
function download(lang) {
  const t = T[lang], d = t.dl;
  const page = 'download/index.html', pagePath = pathOf(lang, page);
  const r = (p) => rel(pagePath, p);
  const lk = (x) => rel(pagePath, pathOf(lang, x));
  const by = { windows: [], macos: [], linux: [] };
  for (const b of RELEASE.binaries) by[b.os || OS_OF(b.name)].push(b);
  const file = (b) => `<div><a class="file" href="${esc(b.url)}"><span>${b.os === 'macos' || OS_OF(b.name) === 'macos' ? 'macOS' : 'Linux'} ${b.arch}</span><small>${b.size ? Math.round(b.size / 1e6) + ' MB' : svg(IC.download, 14)}</small></a><div class="sha"><span>SHA256</span><code title="${b.sha256}">${b.sha256}</code><button type="button" data-copy="${b.sha256}">${lang === 'zh' ? '复制' : 'Copy'}</button></div></div>`;
  const soon = (label) => `<span class="file off"><span>${label}</span><small>${d.soon}</small></span>`;
  const build = `<a class="file" href="${lk(d.buildLink)}"><span>${d.build}</span><small>→</small></a>`;
  const docker = `<a class="file" href="${lk(d.dockerLink)}"><span>${d.docker}</span><small>→</small></a>`;
  const col = (os, icon, info, extra, fallback) => `<div class="os" data-os="${os}"><div class="ico">${svg(IC[icon], 24)}</div><h3>${info[0]}</h3><p class="req">${info[1]}</p><div class="files">${by[os].length ? by[os].map(file).join('') : fallback}${extra}</div></div>`;
  return head(lang, `${d.title} — ${t.name}`, pagePath, d.sub) + `
<body>
${topbar(lang, 'download', pagePath, other(lang, page))}
<main class="wrap" id="downloads">
<section class="page-head"><h1>${d.title}</h1><p>${d.sub}</p>
<div class="ver-row"><span>${d.latest}: <b>${RELEASE.version}</b></span><span>·</span><a href="${esc(RELEASE.url)}" target="_blank" rel="noopener">${d.notes}</a></div></section>
<span class="pill blue hidden" id="recommend-tag">${d.recommended}</span>
<div class="os-grid">
${col('macos', 'apple', d.macos, build, soon('Apple Silicon · Intel'))}
${col('linux', 'linux', d.linux, docker, '')}
</div>
<p class="note">${d.note}</p>
<section class="steps"><h2>${d.startTitle}</h2><p>${d.startSteps}</p><pre><code>${esc(d.startCode)}</code></pre>
<p style="margin:14px 0 0"><a href="${lk('deployment/index.html')}">${X[lang].deploy} →</a> &nbsp;·&nbsp; <a href="${GH}/releases" target="_blank" rel="noopener">${d.all} →</a></p></section>
</main>
${footer(lang, pagePath)}
<script src="${r('site.js')}"></script>
</body></html>`;
}

// ---------------------------------------------------------------- docs
const stripTags = (h) => h.replace(/<[^>]+>/g, ' ').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&amp;/g, '&').replace(/\s+/g, ' ').trim();
const INDEX = { en: [], zh: [] };
function indexDoc(lang, k, title, html) {
  const url = `docs/${outPath(k)}`;
  for (const part of html.split(/(?=<h[1-6] id=")/)) {
    const m = part.match(/^<h([1-6]) id="([^"]+)">([\s\S]*?)<\/h\1>/);
    const level = m ? +m[1] : 0;
    const heading = m && level > 1 ? stripTags(m[3]) : '';
    const body = stripTags(m ? part.slice(m[0].length) : part);
    if (!body && !heading) continue;
    const u = url + (m && level > 1 ? '#' + m[2] : '');
    for (let i = 0; i === 0 || i < body.length; i += 900) INDEX[lang].push({ u, t: title, h: heading, x: body.slice(i, i + 900) });
  }
}

function docNav(lang, activeKey) {
  const t = T[lang], S = t.docs.sections;
  const used = new Set();
  const linkFor = (k, text, fromPath) => `<a href="${rel(fromPath, pathOf(lang, 'docs/' + outPath(k)))}"${k === activeKey ? ' class="active"' : ''}>${esc(text)}</a>`;
  return (fromPath) => {
    let html = '';
    for (const [sec, items] of NAV) {
      const rows = items.filter(([k]) => sources[k]);
      html += `<h4>${S[sec].toUpperCase()}</h4>` + rows.map(([k, l]) => { used.add(k); return linkFor(k, l[lang], fromPath); }).join('');
    }
    const rest = Object.keys(sources).filter((k) => k !== 'README' && !k.endsWith('/README') && !k.startsWith('architecture')).sort();
    const bySec = {};
    for (const k of rest) (bySec[k.split('/')[0]] ??= []).push(k);
    for (const top of Object.keys(bySec).sort()) {
      const ks = bySec[top] || [];
      if (!ks.length) continue;
      const open = ks.includes(activeKey) ? ' open' : '';
      html += `<details${open}><summary>${t.docs.allDocs.toUpperCase()} · ${top}</summary>` + ks.map((k) => linkFor(k, titleOf(k, lang), fromPath)).join('') + '</details>';
    }
    return html;
  };
}
const titleCache = {};
function titleOf(k, lang) {
  const c = (titleCache[lang] ??= {});
  if (c[k]) return c[k];
  const src = sources[k][lang] || sources[k][lang === 'en' ? 'zh' : 'en'];
  return (c[k] = h1Of(readFileSync(src, 'utf8')) || k);
}

function docPage(k, lang, order) {
  const t = T[lang], dd = t.docs;
  const src = sources[k][lang] || sources[k][lang === 'en' ? 'zh' : 'en'];
  const fallback = !sources[k][lang];
  const page = 'docs/' + outPath(k), pagePath = pathOf(lang, page);
  const md = readFileSync(src, 'utf8');
  const { html, toc } = renderDoc(md, src, lang, pagePath);
  const title = titleOf(k, lang);
  indexDoc(lang, k, title, html);
  const nav = docNav(lang, k)(pagePath);
  const i = order.indexOf(k);
  const pn = (kk, cls, lab) => kk ? `<a class="${cls}" href="${rel(pagePath, pathOf(lang, 'docs/' + outPath(kk)))}"><small>${lab}</small>${esc(titleOf(kk, lang))}</a>` : '<span style="flex:1"></span>';
  const tocHtml = toc.length > 1 ? `<aside class="toc"><b>${dd.on.toUpperCase()}</b>${toc.map((x) => `<a class="l${x.depth}" href="#${x.id}">${x.text}</a>`).join('')}</aside>` : '<aside class="toc"></aside>';
  return head(lang, `${title} — ${t.name}`, pagePath) + `
<body>
${topbar(lang, 'docs', pagePath, other(lang, page))}
<button class="btn small menu-toggle">${dd.menu}</button>
<div class="docs"><nav class="docs-nav">${nav}</nav>
<article class="article">${fallback ? `<div class="banner">${dd.onlyOther}</div>` : ''}${html}
<div class="pager">${pn(order[i - 1], 'prev', dd.prev)}${pn(order[i + 1], 'next', dd.next)}</div></article>
${tocHtml}</div>
${footer(lang, pagePath)}
<script src="${rel(pagePath, 'site.js')}"></script>
</body></html>`;
}

function docsHome(lang, order) {
  const t = T[lang], dd = t.docs, S = dd.sections;
  const page = 'docs/index.html', pagePath = pathOf(lang, page);
  const card = (k, l) => `<a class="card" href="${rel(pagePath, pathOf(lang, 'docs/' + outPath(k)))}"><h3>${esc(l || titleOf(k, lang))}</h3></a>`;
  const secs = NAV.map(([sec, items]) => `<h2>${S[sec]}</h2><div class="grid">${items.filter(([k]) => sources[k]).map(([k, l]) => card(k, l[lang])).join('')}</div>`).join('');
  const curated = new Set(NAV.flatMap(([, items]) => items.map(([k]) => k)));
  const remaining = order.filter((k) => !curated.has(k));
  const groups = [...new Set(remaining.map((k) => k.split('/')[0]))].sort();
  const refs = groups.map((top) => `<h2>${dd.allDocs} · ${S[top] || top}</h2><div class="grid">${remaining.filter((k) => k.startsWith(top + '/')).map((k) => card(k)).join('')}</div>`).join('');
  return head(lang, `${dd.title} — ${t.name}`, pagePath) + `
<body>
${topbar(lang, 'docs', pagePath, other(lang, page))}
<main class="docs-home"><h1>${dd.title}</h1><p style="color:var(--muted)">${dd.homeIntro}</p>${secs}${refs}</main>
${footer(lang, pagePath)}
<script src="${rel(pagePath, 'site.js')}"></script>
</body></html>`;
}

// ---------------------------------------------------------------- write
// GitHub Pages caches assets for minutes: version the local CSS/JS URLs by content so a redeploy is never
// served as new HTML with stale styles.
const ASSET_V = {};
for (const f of ['site.css', 'site.js', 'demo.css', 'demo.js', 'viz.js']) ASSET_V[f] = createHash('sha256').update(readFileSync(join(HERE, 'src', f))).digest('hex').slice(0, 10);
const versioned = (html) => html.replace(/(src|href)="([^"]*?)((?:site|demo|viz)\.(?:css|js))"/g, (m, attr, dir, f) => `${attr}="${dir}${f}?v=${ASSET_V[f]}"`);
const SITE_ORIGIN = (process.env.SITE_URL || 'https://sciencediscovery.github.io').replace(/\/$/, '');
const sitemapPages = []; // populated as pages are written; 404.html and JSON are excluded

function write(p, content) {
  if (p.endsWith('.html')) {
    content = versioned(content);
    if (p !== '404.html') sitemapPages.push(p);
  }
  const full = join(DIST, p);
  mkdirSync(dirname(full), { recursive: true });
  writeFileSync(full, content);
}

rmSync(DIST, { recursive: true, force: true });
mkdirSync(DIST, { recursive: true });
for (const f of ['site.css', 'site.js', 'demo.css', 'demo.js', 'viz.js']) cpSync(join(HERE, 'src', f), join(DIST, f));
cpSync(join(DOCS, 'images'), join(DIST, 'docs', 'images'), { recursive: true });
write('favicon.svg', `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><rect width="32" height="32" rx="8" fill="#2563eb"/><g transform="translate(6 6) scale(.83)" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${IC.brand}</g></svg>`);
write('.nojekyll', '');
write('404.html', '<meta charset="utf-8"><meta http-equiv="refresh" content="0;url=./"><a href="./">ScienceDiscovery</a>');

const curated = [...new Set(NAV.flatMap(([, items]) => items.map(([k]) => k)))].filter((k) => sources[k]);
const remaining = Object.keys(sources).filter((k) => !curated.includes(k) && k !== 'README' && !k.endsWith('/README') && !k.startsWith('architecture')).sort();
const order = [...curated, ...remaining];

let pages = 0;
for (const lang of LANGS) {
  write(pathOf(lang, 'index.html'), home(lang));
  write(pathOf(lang, 'deployment/index.html'), deployment(lang));
  write(pathOf(lang, 'download/index.html'), download(lang));
  write(pathOf(lang, 'docs/index.html'), docsHome(lang, order));
  for (const k of order) { write(pathOf(lang, 'docs/' + outPath(k)), docPage(k, lang, order)); pages++; }
  write(pathOf(lang, 'search-index.json'), JSON.stringify(INDEX[lang]));
}

// Sitemap + robots.txt. English and Chinese pages that mirror the same content declare each other
// via hreflang so search engines index the pair as one entry rather than two competing pages.
const today = new Date().toISOString().slice(0, 10);
const altOf = (p) => (p.startsWith('zh/') ? p.slice(3) : 'zh/' + p);
const urlset = sitemapPages.map((p) => {
  const loc = `${SITE_ORIGIN}/${p}`;
  const alt = sitemapPages.includes(altOf(p))
    ? `\n    <xhtml:link rel="alternate" hreflang="${p.startsWith('zh/') ? 'zh' : 'en'}" href="${SITE_ORIGIN}/${p}"/>\n    <xhtml:link rel="alternate" hreflang="${p.startsWith('zh/') ? 'en' : 'zh'}" href="${SITE_ORIGIN}/${altOf(p)}"/>`
    : '';
  return `  <url>\n    <loc>${loc}</loc>\n    <lastmod>${today}</lastmod>${alt}\n  </url>`;
}).join('\n');
write('sitemap.xml', `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">\n${urlset}\n</urlset>\n`);
write('robots.txt', `User-agent: *\nAllow: /\n\nSitemap: ${SITE_ORIGIN}/sitemap.xml\n`);

console.log(`built ${pages} doc pages, ${INDEX.en.length + INDEX.zh.length} search entries, ${sitemapPages.length} sitemap URLs -> ${relative(process.cwd(), DIST)}`);
