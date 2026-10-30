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
// Pins the homepage downloads to the newest published release, so what visitors get by default is
// the version release.json names, and every file comes with its checksum.
const RELEASE = JSON.parse(readFileSync(join(ROOT, 'release.json'), 'utf8'));
const REPO = process.env.SITE_REPO || 'openJiuwen-ai/sciencediscovery';
const BRANCH = process.env.SITE_BRANCH || 'main';
const GH = `https://github.com/${REPO}`;
const LANGS = ['en', 'zh'];

// The opening block of 1ATP.pdb, shared by both languages: the left column's "file" folds open
// to the raw record, so the record itself has to be the real one.
const PDB_HEAD = [
  'HEADER    TRANSFERASE(PHOSPHOTRANSFERASE)         08-JAN-93   1ATP',
  'TITLE     2.2 ANGSTROM REFINED CRYSTAL STRUCTURE OF THE CATALYTIC SUBUNIT OF',
  'TITLE    2 CAMP-DEPENDENT PROTEIN KINASE COMPLEXED WITH MNATP AND A PEPTIDE',
  'TITLE    3 INHIBITOR',
  'COMPND    MOL_ID: 1;',
  'COMPND   2 MOLECULE: CAMP-DEPENDENT PROTEIN KINASE;',
  'COMPND   3 CHAIN: E;',
  'COMPND   4 EC: 2.7.1.37;',
  'COMPND   5 ENGINEERED: YES;',
  'COMPND   6 MOL_ID: 2;',
  'COMPND   7 MOLECULE: PEPTIDE INHIBITOR PKI(5-24);',
  'COMPND   8 CHAIN: I;',
  'COMPND   9 ENGINEERED: YES',
  'SOURCE    MOL_ID: 1;',
].join('\n');

// ---------------------------------------------------------------- i18n
const T = {
  en: {
    name: 'ScienceDiscovery', tag: 'AI research workspace',
    nav: { home: 'Home', docs: 'Documentation' },
    langLabel: '中文',
    eyebrow: 'Open source · Apache-2.0 · Runs on your machine',
    h1: '<span class="h1-brand"><span class="h1-initial">S</span>cience<span class="h1-initial">D</span>iscovery</span><span class="h1-slogan">Your <em>all-in-one</em> AI research workspace</span>',
    lead: 'Papers, code, experiments, conclusions — all in one AI workspace instead of a dozen tools, and every conclusion and every number keeps a traceable record of the data, code and run behind it.',
    ctaDownload: 'Download ScienceDiscovery', ctaGh: 'View on GitHub',
    videoLabel: 'ScienceDiscovery screen recording',
    avatarUser: 'You',
    avatarAgent: 'Agent',
    avatarSd: 'SD',
    close: 'Close',
    filesMore: 'More files below',
    chatPlain: 'Generic agent',
    chatSd: 'ScienceDiscovery',
    feats: [
      {
        ic: 'plug', tag: 'Scientific MCP', doc: 'core/mcp-skills',
        title: 'One place to manage your scattered research tools',
        text: '<strong>Scientific MCP</strong> retrieves and downloads papers and data for you: no code to write, no API keys to wire up, no hopping between a dozen websites. Say what you need and the files land in your workspace.',
        ask: 'Find recent work on additives that improve perovskite stability, and grab the related crystal structures while you are at it.',
        plain: 'I will write some Python against the PubMed E-utilities API, or query the endpoints one by one with curl.',
        plain2: 'Writing the Python script',
        sd: 'PubMed MCP tools returned 63 papers; 9 survived relevance and citation screening and are saved in /workspace/lit/. Three structures came back from the PDB. Want a table of the additive families behind those 9 papers?',
        files: ['zhang2024_perovskite.pdf', 'liu2025_additives.pdf', '1ATP.pdb']
      }, {
        ic: 'dna', tag: 'Protein structures', doc: 'domains/antibody-design',
        title: 'View protein 3D structures',
        text: 'Drop a PDB file into the workspace and the artifact preview opens an interactive 3D structure in one click: rotate, zoom, a sequence panel, with protein, pocket and ligand atoms coloured automatically by layer.',
        ask: 'Please fetch the 1ATP file from RCSB PDB.',
        plain: '<p>Downloaded 1ATP from RCSB PDB.</p>'
          + '<p>Source: <code>https://files.rcsb.org/download/1ATP.pdb</code><br>Saved to: 1ATP.pdb (current working directory)</p>'
          + '<p>File check and summary</p>'
          + '<table><tbody><tr><th scope="row">File size</th><td>299,538 bytes / 3,698 lines</td></tr>'
          + '<tr><th scope="row">Format</th><td>PDB (v3.x)</td></tr>'
          + '<tr><th scope="row">Structure ID</th><td>1ATP</td></tr>'
          + '<tr><th scope="row">Title</th><td>2.2 Å refined crystal structure of the catalytic subunit of cAMP-dependent protein kinase complexed with MnATP and a peptide inhibitor</td></tr></tbody></table>',
        plainFold: { name: '1ATP.pdb', hint: 'Click to open the file', text: PDB_HEAD, note: 'The file has 3,698 lines; this is its opening block.' },
        sd: '<p>Fetching the 1ATP structure from RCSB PDB. I will look up the entry metadata and try a direct download at the same time.</p>'
          + '<div class="tool">Called mcp__pdb__lookup_structure</div>'
          + '<div class="tool">Called run_shell</div>'
          + '<div class="step">Thinking · round 1</div>'
          + '<p>The file downloaded (299,538 bytes) and its header confirms the official 1ATP entry. One more integrity check — record-type counts, ligands, file ending:</p>'
          + '<div class="tool">Called run_shell</div>'
          + '<div class="step">Thinking · round 2</div>'
          + '<p>Check passed: 2,913 ATOM and 157 HETATM records (3,070 atoms, matching RCSB deposited_atom_count=3070) and a clean MASTER/END tail. Registering the file as a project artifact:</p>',
        sdFold: { label: 'Artifact from this run', name: '1ATP.pdb', hint: 'Click to open the 3D view', viewer: 'viewer-1atp', structure: '1ATP.pdb', loading: 'Loading the 3D viewer (about 5 MB on first open)…', error: 'The 3D viewer could not load. The file itself is still readable in the left column.', caption: 'A real Mol* viewer, the same engine embedded in a ScienceDiscovery session: drag to rotate, scroll to zoom, and use the panels on both sides to change the representation, inspect the structure and its ligands, or export models.' }
      }, {
        ic: 'tree', tag: 'Evolve', doc: 'core/evolve',
        title: 'Auto-tune artifacts with a search algorithm, using fewer tokens',
        text: 'Hand over something measurable — a program, a parameter table, even a prompt — and it generates variants, scores each one, checks the winner on held-out data and returns the best version. Every variant keeps its code, score and run record, so you can roll back.',
        ask: 'Run just one LLM-SRBench task, lsr_transform_i.34.1_2_0, with flags matching era-srbench-deepseek-transform.',
        plain: '<p>Task analysed, writing a program to check the fit.</p>'
          + '<div class="step">Verification round 1</div>'
          + '<div class="step">…</div>'
          + '<div class="step">Verification round n</div>'
          + '<div class="step">Verification complete</div>',
        tally: '939,940 tokens spent',
        sd: '<div class="tool">Called create_evolve_run</div>'
          + '<p>Searching for the symbolic equation with the smallest NMSE on LLM-SRBench task lsr_transform_i.34.1_2_0 (input omega, c, v → output omega_0)…</p>',
        sdTally: '608,361 tokens spent', sdTallyIcon: 'down',
        sdTask: { ic: 'tree', label: 'Artifact from this run', name: 'Evolution task', hint: 'Click to see the run', viewer: 'viewer-evolve', image: 'sd-evolve.png', alt: 'Evolve program-evolution panel', caption: 'Evolve run panel: score curve, candidate log, search tree.' }
      }, {
        ic: 'graph', tag: 'Science Memory', doc: 'core/science-memory-reviewer',
        title: 'Every number 100% trustworthy, traceable on the spot',
        text: 'Runs, artifacts and claims all carry a version and an origin: open a claim and see which run, which dataset and which code produced it, together with the inputs and outputs of that moment.',
        ask: 'Search PubMed and bioRxiv for 2023–2025 papers comparing adult and paediatric hepatocyte gene expression, focused on immune pathways. Chart the top enriched pathways and flag where the studies disagree.',
        plain: '<div class="step">Thinking: The user wants a literature search...</div>'
          + '<div class="step">Updated task list 0/5 done · Search PubMed ...</div>'
          + '<div class="step">Web fetch...</div>'
          + '<div class="step">Web search...</div>'
          + '<p>Direction of inflammation with age ★★★: E25 (highest in fetal liver, falling through adulthood) vs L24/H23/R25 (rising again in the elderly) → in fact a U-shaped curve, with each pair covering one arm.</p>'
          + '<p>Is the paediatric-to-adult NAFLD programme portable? ★★: G23 contradicts itself — the gene set is almost entirely non-portable (17%), yet the core GO inflammation module is shared. Supporting evidence: E25 found that using adult liver as the control systematically masks paediatric IFALD signals.</p>',
        tally: 'Claim cannot be traced', tallyIcon: 'warn',
        sd: '<div class="step">Thinking · round 1</div>'
          + '<div class="tool">Called mcp__pubmed__prepare_paper_download</div>'
          + '<div class="tool">Called mcp__biorxiv__search_preprints</div>'
          + '<p>Is the paediatric liver pro-inflammatory, or immune-dysregulated and hypo-responsive?</p>'
          + '<p>Edgar: higher inflammatory potential (IL-1β secretion p&lt;0.05) <button class="ev" type="button" data-viewer="ev-1" aria-haspopup="dialog">[evidence1]<span class="ev-hint">Click to see the source</span></button>; Vance: IL-27-dominant with failed immune coordination, and the background literature reports lower Th1 cytokines in neonates <button class="ev" type="button" data-viewer="ev-6" aria-haspopup="dialog">[evidence6]<span class="ev-hint">Click to see the source</span></button>.</p>',
        sdTally: 'Claim fully traced', sdTallyIcon: 'check',
        evidence: [
          { viewer: 'ev-1', name: 'evidence1', image: 'e1.png', alt: 'The source behind citation evidence1', caption: 'The source behind citation [evidence1].' },
          { viewer: 'ev-6', name: 'evidence6', image: 'e6.png', alt: 'The source behind citation evidence6', caption: 'The source behind citation [evidence6].' }
        ]
      }
    ],
    learn: 'Learn more →',
    footNote: 'ScienceDiscovery is a workflow orchestration tool and does not embed any AI model.',
    footLinks: [['Documentation', 'docs/index.html']],
    dl: {
      latest: 'Latest release', notes: 'Release notes', recommended: 'Recommended for you', download: 'Download',
      linux: 'Linux', macos: 'macOS', windows: 'Windows',
      all: 'All releases on GitHub'
    },
    docs: {
      title: 'Documentation', menu: 'Menu', on: 'On this page', prev: 'Previous', next: 'Next',
      onlyOther: 'This page is only available in Chinese so far.', homeIntro: 'Start here, then dive into the features you need.',
      sections: { 'getting-started': 'Getting Started', core: 'Core Capabilities', domains: 'Domain Guides', 'setup-reference': 'More Features and Configuration' }
    }
  },
  zh: {
    name: 'ScienceDiscovery', tag: 'AI 科研工作台',
    nav: { home: '首页', docs: '文档' },
    langLabel: 'English',
    eyebrow: '开源 · Apache-2.0 · 全部在你的机器上跑',
    h1: '<span class="h1-brand"><span class="h1-initial">S</span>cience<span class="h1-initial">D</span>iscovery</span><span class="h1-slogan">你的<em>一站式</em> AI 科研工作站</span>',
    lead: '文献、代码、实验、结论，全部在一个 AI 工作站里完成，不必在十几个工具之间来回搬运；每一条结论、每一个数据都留有出处，随时可以追溯到当时的数据、代码和运行记录。',
    ctaDownload: '下载 ScienceDiscovery', ctaGh: '在 GitHub 查看',
    videoLabel: 'ScienceDiscovery 实机演示',
    avatarUser: '你',
    avatarAgent: 'Agent',
    avatarSd: 'SD',
    close: '关闭',
    filesMore: '还有更多文件',
    chatPlain: '通用 Agent',
    chatSd: 'ScienceDiscovery',
    feats: [
      {
        ic: 'plug', tag: '科学 MCP', doc: 'core/mcp-skills',
        title: '一站式管理你的碎片化科研工具',
        text: '科研文献、数据都能通过<strong>科学MCP</strong>检索、下载：不用写代码、不用配 API key，也不用在十几个网站之间手动翻找。说清你要什么，文件直接落到工作区里，又快又好。',
        ask: '帮我找近两年提升钙钛矿稳定性的添加剂研究，顺便把相关的晶体结构文件也取回来。',
        plain: '我先写一段 Python 调 PubMed 的 E-utilities 接口，或者用 curl 逐个查询。',
        plain2: '正在编写 Python 程序',
        sd: '已通过 PubMed MCP 工具检索到 63 篇，按相关性和引用筛出 9 篇并存入 /workspace/lit/；另有 3 个结构文件已从 PDB 取回。要我把这 9 篇里的添加剂类型做成对照表吗？',
        files: ['zhang2024_perovskite.pdf', 'liu2025_additives.pdf', '1ATP.pdb']
      }, {
        ic: 'dna', tag: '蛋白质结构', doc: 'domains/antibody-design',
        title: '支持查看蛋白质 3D 结构',
        text: '把 PDB 文件放进工作区，产物预览页点一下就能打开交互式 3D 结构：旋转、缩放、序列面板，蛋白、口袋、配体自动分层着色。',
        ask: '请你从 RCSB PDB 中获取 1ATP 文件。',
        plain: '<p>已从 RCSB PDB 成功下载 1ATP。</p>'
          + '<p>下载来源：<code>https://files.rcsb.org/download/1ATP.pdb</code><br>保存位置：1ATP.pdb（当前工作目录）</p>'
          + '<p>文件校验与内容摘要</p>'
          + '<table><tbody><tr><th scope="row">文件大小</th><td>299,538 字节 / 3,698 行</td></tr>'
          + '<tr><th scope="row">格式</th><td>PDB (v3.x)</td></tr>'
          + '<tr><th scope="row">结构 ID</th><td>1ATP</td></tr>'
          + '<tr><th scope="row">标题</th><td>2.2 Å 分辨率下 cAMP 依赖性蛋白激酶催化亚基与 MnATP 及肽抑制剂复合物的精修晶体结构</td></tr></tbody></table>',
        plainFold: { name: '1ATP.pdb', hint: '点击查看文件', text: PDB_HEAD, note: '文件共 3,698 行，此处只展开开头部分。' },
        sd: '<p>我来从 RCSB PDB 获取 1ATP 结构文件。先查询该结构的元数据，同时尝试直接下载。</p>'
          + '<div class="tool">已调用 mcp__pdb__lookup_structure</div>'
          + '<div class="tool">已调用 run_shell</div>'
          + '<div class="step">思考过程 · 第 1 轮</div>'
          + '<p>文件已成功下载（299,538 字节），头部信息确认为官方 1ATP 条目。再做一次完整性校验（记录类型统计、配体、文件结尾）：</p>'
          + '<div class="tool">已调用 run_shell</div>'
          + '<div class="step">思考过程 · 第 2 轮</div>'
          + '<p>校验通过：2,913 条 ATOM + 157 条 HETATM（共 3,070 个原子，与 RCSB 官方 deposited_atom_count=3070 一致），文件以 MASTER/END 正常收尾。现在将文件登记为项目产物：</p>',
        sdFold: { label: '本轮产物', name: '1ATP.pdb', hint: '点击展开 3D 结构', viewer: 'viewer-1atp', structure: '1ATP.pdb', loading: '正在加载 3D 查看器（首次打开需要下载约 5 MB）…', error: '3D 查看器没能加载，可以先用左侧的 1ATP.pdb 看文件内容。', caption: '真实的 Mol* 结构查看器，与 ScienceDiscovery 会话里内嵌的是同一个引擎：拖动旋转、滚轮缩放，左右两侧面板可切换表示方式、查看结构与配体、导出模型。' }
      }, {
        ic: 'tree', tag: '产物自进化', doc: 'core/evolve',
        title: '使用搜索算法对产物自动调优，消耗更少token',
        text: '给出一个可评价的产物——程序、参数表、甚至提示词都行——它会成批生成变体、逐个打分，再用留出数据检验，最后把得分最高的版本交给你。每个变体的代码、分数和运行记录都留了版本，随时可以回退。',
        ask: '只跑 LLM-SRBench 的一道题 lsr_transform_i.34.1_2_0，配置对齐 era-srbench-deepseek-transform 的旗标。',
        plain: '<p>完成题目分析，编写程序验证。</p>'
          + '<div class="step">第一轮验证</div>'
          + '<div class="step">…</div>'
          + '<div class="step">第 n 轮验证</div>'
          + '<div class="step">验证完成</div>',
        tally: 'token消耗939,940',
        sd: '<div class="tool">已调用 create_evolve_run</div>'
          + '<p>为 LLM-SRBench 题目 lsr_transform_i.34.1_2_0（输入 omega,c,v → 输出 omega_0）搜索 NMSE 最小的符号方程……</p>',
        sdTally: 'token消耗608,361', sdTallyIcon: 'down',
        sdTask: { ic: 'tree', label: '本轮产物', name: '演进任务', hint: '点击查看演进任务', viewer: 'viewer-evolve', image: 'sd-evolve.png', alt: 'Evolve 程序演进面板', caption: 'Evolve 程序演进面板：得分曲线、候选流水与搜索树。' }
      }, {
        ic: 'graph', tag: '结果可溯源', doc: 'core/science-memory-reviewer',
        title: '每个数据都 100% 可信，支持即时溯源',
        text: '运行、产物、结论都带版本和来源：这条结论出自哪次运行、哪份数据、哪段代码，点开就能看到当时的输入和输出。',
        ask: '检索 PubMed 与 bioRxiv 上 2023–2025 年比较成人与儿童肝实质细胞基因表达的论文，聚焦免疫相关通路。生成前几位富集通路的柱状图，并标出不同研究之间相互矛盾的结论。',
        plain: '<div class="step">思考:The user wants a literature search...</div>'
          + '<div class="step">更新任务清单0/5 已完成 · Search PubMed ...</div>'
          + '<div class="step">网页获取...</div>'
          + '<div class="step">网页搜索...</div>'
          + '<p>炎症随年龄的方向 ★★★：E25（胎儿最高→成人递减）vs L24/H23/R25（老年回升）→ 实为 U 型曲线，两篇各覆盖一段。</p>'
          + '<p>儿童-成人 NAFLD 程序是否可移植 ★★：G23 自身就矛盾——基因集合几乎不可移植（17%），但 GO 核心炎症模块共享。旁证：E25 发现用成人肝作对照会系统性掩盖儿童 IFALD 信号。</p>',
        tally: '结论无法溯源', tallyIcon: 'warn',
        sd: '<div class="step">思考过程 · 第 1 轮</div>'
          + '<div class="tool">已调用 mcp__pubmed__prepare_paper_download</div>'
          + '<div class="tool">已调用 mcp__biorxiv__search_preprints</div>'
          + '<p>儿科肝是「高炎症」还是「免疫失调/低应答」</p>'
          + '<p>Edgar：更高炎症潜能（IL-1β 分泌 p&lt;0.05）<button class="ev" type="button" data-viewer="ev-1" aria-haspopup="dialog">[evidence1]<span class="ev-hint">点击查看来源</span></button>，Vance：IL-27 主导、免疫协调失败；文献背景新生儿 Th1 细胞因子更低<button class="ev" type="button" data-viewer="ev-6" aria-haspopup="dialog">[evidence6]<span class="ev-hint">点击查看来源</span></button>。</p>',
        sdTally: '结论来源清晰', sdTallyIcon: 'check',
        evidence: [
          { viewer: 'ev-1', name: 'evidence1', image: 'e1.png', alt: '引用 evidence1 对应的原文证据', caption: '引用 [evidence1] 对应的原文证据。' },
          { viewer: 'ev-6', name: 'evidence6', image: 'e6.png', alt: '引用 evidence6 对应的原文证据', caption: '引用 [evidence6] 对应的原文证据。' }
        ]
      }
    ],
    learn: '了解更多 →',
    footNote: 'ScienceDiscovery 仅作为工作流编排工具，不内置任何 AI 模型。',
    footLinks: [['文档', 'docs/index.html']],
    dl: {
      latest: '最新版本', notes: '发布说明', recommended: '为你推荐', download: '下载',
      linux: 'Linux', macos: 'macOS', windows: 'Windows',
      all: '在 GitHub 查看全部版本'
    },
    docs: {
      title: '文档', menu: '目录', on: '本页内容', prev: '上一篇', next: '下一篇',
      onlyOther: '本页暂时只有英文版。', homeIntro: '从这里开始，再深入你需要的功能。',
      sections: { 'getting-started': '快速开始', core: '核心功能', domains: '领域教程', 'setup-reference': '更多功能与配置' }
    }
  }
};

// The product documentation owns these reader-facing groups. Listed pages keep
// a useful reading order; new pages in the same directory are appended automatically.
const DOC_GROUPS = [
  ['getting-started', ['getting-started/deployment', 'getting-started/quick-start']],
  ['core', ['core/README', 'core/evolve', 'core/execution-workspaces', 'core/idea-tree']],
  ['domains', ['domains/README', 'domains/evolve-a-solution', 'domains/run-an-evolution-search', 'domains/literature-research']],
  ['setup-reference', [
    'advanced-setup/README', 'advanced-setup/configure-custom-mcp', 'advanced-setup/configure-network-proxy', 'advanced-setup/science-memory-setup',
    'reference/README', 'reference/configuration', 'reference/rest-api', 'reference/runtime-behavior', 'reference/builtin-tools', 'reference/web-tools', 'reference/jiuwenswarm-migration-status'
  ]]
];

// Implementation notes are still built and linked from the core pages, but they are no longer a
// reader-facing group, so neither the sidebar nor the documentation index lists them.
const DOC_HIDDEN_GROUPS = ['developer-docs'];

// A panel that shows a screenshot is sized from the picture itself: the stylesheet multiplies the
// height left for the image by this ratio, so the dialog hugs the image instead of sitting in a
// wide empty box. Read straight from the PNG header (IHDR), so replacing the file is enough.
function shotRatio(file) {
  const png = readFileSync(join(HERE, 'src', 'media', file));
  return (png.readUInt32BE(16) / png.readUInt32BE(20)).toFixed(4);
}

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
  // Tux: the head-and-body silhouette with the beak, eyes and belly patch, so the Linux card reads
  // as the classic penguin rather than a rounded blob.
  linux: '<path d="M12 2.6c-1.9 0-3.1 1.6-3.1 3.9 0 1-.3 1.7-.9 2.5-1.4 1.9-2.2 3.6-2.2 5.6 0 2.9 2.5 5.1 6.2 5.1s6.2-2.2 6.2-5.1c0-2-.8-3.7-2.2-5.6-.6-.8-.9-1.5-.9-2.5 0-2.3-1.2-3.9-3.1-3.9z"/><ellipse cx="12" cy="15.2" rx="2.5" ry="3.1"/><circle cx="10.5" cy="6.2" r=".6" fill="currentColor" stroke="none"/><circle cx="13.5" cy="6.2" r=".6" fill="currentColor" stroke="none"/><path d="M10.7 7.9h2.6l-1.3 1.9z" fill="currentColor" stroke="none"/>',
  apple: '<path d="M16.500 12.500c0-2.200 1.800-3.200 1.900-3.300-1-1.500-2.600-1.700-3.200-1.700-1.400-.1-2.600.8-3.300.8-.7 0-1.700-.8-2.800-.8-1.400 0-2.800.8-3.500 2.100-1.500 2.600-.4 6.500 1.100 8.600.7 1 1.600 2.200 2.700 2.100 1.100 0 1.500-.7 2.800-.7s1.700.7 2.800.7c1.200 0 1.900-1 2.600-2.100.8-1.200 1.100-2.300 1.200-2.400-.1 0-2.300-.9-2.300-3.300zM14.300 6c.6-.7 1-1.700.9-2.700-.9 0-1.900.6-2.500 1.300-.5.600-1 1.600-.9 2.600 1 .1 1.900-.5 2.500-1.200z"/>',
  windows: '<path d="M3 5.500l7.500-1v7H3zM11.500 4.400L21 3v8.500h-9.500zM3 12.500h7.500v7L3 18.500zM11.500 12.500H21V21l-9.500-1.400z"/>',
  warn: '<path d="M10.3 3.9 1.8 18.5A2 2 0 0 0 3.5 21.5h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z"/><path d="M12 9v4.5"/><path d="M12 17.2h.01"/>',
  check: '<rect x="3" y="3" width="18" height="18" rx="3.5"/><path d="m8 12.4 2.7 2.6L16 9.5"/>',
  down: '<rect x="3" y="3" width="18" height="18" rx="3.5"/><path d="M12 7.2v9.6"/><path d="m8.2 13 3.8 3.8L15.8 13"/>'
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
// A group normally maps to one documentation directory; setup-reference folds two of them into a
// single rail entry, so it needs both prefixes to discover the pages that are not listed by name.
const GROUP_PREFIXES = { 'setup-reference': ['advanced-setup', 'reference'] };
const prefixesOf = (group) => GROUP_PREFIXES[group] || [group];
function groupItems(group) {
  const listed = DOC_GROUPS.find(([name]) => name === group)?.[1] || [];
  const available = Object.keys(sources).filter((k) => prefixesOf(group).some((p) => k.startsWith(p + '/')));
  return [...listed.filter((k) => sources[k]), ...available.filter((k) => !listed.includes(k)).sort()];
}

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

// Upstream documentation can rename headings independently of this website.
// Keep links in the product docs pointing at the current rendered headings.
const DOC_ANCHOR_ALIASES = {
  en: {
    'developer-docs/architecture': { '25-responsibility-split': '4-service-and-sidecar-responsibilities' },
    'getting-started/deployment': {
      'docker-deployment': 'docker-deployment-linux-containers',
      'local-mode-source-checkout': 'local-source-mode-linux--macos'
    }
  },
  zh: {
    'developer-docs/architecture': { '25-职责切分核心原则': '4-服务与-sidecar-职责' },
    'getting-started/deployment': {
      'docker-部署': 'docker-部署linux-容器',
      '本地模式源码检出': '本地源码模式linux--macos'
    }
  }
};

function renderDoc(md, srcFile, lang, pagePath) {
  const srcDir = dirname(srcFile);
  const ctx = {
    link(href) {
      if (!href || /^(https?:|mailto:)/.test(href)) return href;
      const [pathPart, hash = ''] = href.split('#');
      const anchorAliases = { 'sandbox-and-system-requirements': 'sandbox-and-host-requirements' };
      if (!pathPart && hash) return '#' + (anchorAliases[hash] || hash);
      const abs = resolve(srcDir, decodeURI(pathPart));
      const m = abs.match(/[\\/]docs[\\/](en|zh)[\\/](.+)\.md$/);
      const k = m ? m[2].split(sep).join('/') : '';
      const targetAliases = DOC_ANCHOR_ALIASES[m?.[1]]?.[k] || {};
      const frag = hash ? '#' + (targetAliases[hash] || anchorAliases[hash] || hash) : '';
      if (m) {
        // A link into the other language's docs is a language switch ("English version", "中文版"),
        // so it keeps its own language: its anchor names the headings of that language, and the page
        // rendered at this language's URL can only carry this language's ids.
        if (sources[k]) return rel(pagePath, pathOf(m[1], 'docs/' + outPath(k))) + frag;
      }
      const r = relative(ROOT, abs).split(sep).join('/');
      if (r.startsWith('..')) return href;
      // Sample data and screenshots are published with the site, so a link to them must not send
      // the reader to GitHub for a file that is already served from this origin.
      const inDocs = relative(DOCS, abs).split(sep).join('/');
      if (!inDocs.startsWith('..') && /^(examples|images)\//.test(inDocs)) return rel(pagePath, 'docs/' + inDocs) + frag;
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
    searchPh: 'Search documentation', searchBtn: 'Search', searchEmpty: 'No results for', searchHint: '↑↓ to navigate · Enter to open · Esc to close', searchLoading: 'Loading index…',
    theme: 'Toggle dark mode',
    docsQuick: 'Quick start'
  },
  zh: {
    searchPh: '搜索文档', searchBtn: '搜索', searchEmpty: '没有找到', searchHint: '↑↓ 选择 · Enter 打开 · Esc 关闭', searchLoading: '正在加载索引…',
    theme: '切换深色模式',
    docsQuick: '快速开始'
  }
};
// ---------------------------------------------------------------- page shell
const scriptTheme = `<script>(function(){try{var t=localStorage.getItem('sd-theme');if(!t)t=matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light';document.documentElement.dataset.theme=t}catch(e){}})()</script>`;
// The English home page is the site root, so it is where a Chinese-reading visitor lands by default.
// It hands them to /zh/ unless they picked a language before: the language switcher stores
// 'sd-lang', and that stored choice outranks the browser language. Runs before the page paints so
// the English content never flashes.
const scriptLang = `<script>(function(){try{var c=localStorage.getItem('sd-lang');var n=((navigator.languages&&navigator.languages[0])||navigator.language||'').toLowerCase();if(c?c==='zh':n.slice(0,2)==='zh')location.replace('zh/')}catch(e){}})()</script>`;
const scriptLangFor = (lang, pagePath) => (lang === 'en' && pagePath === 'index.html' ? scriptLang : '');
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
${scriptLangFor(lang, pagePath)}
<link rel="stylesheet" href="${r('site.css')}">
${extraCss.map((c) => `<link rel="stylesheet" href="${r(c)}">`).join('\n')}
</head>`;
}

function topbar(lang, active, pagePath, otherPath) {
  const t = T[lang], x = X[lang];
  const p = (target) => rel(pagePath, (lang === 'zh' ? 'zh/' : '') + target);
  const item = (id, target, label) => `<a href="${p(target)}"${active === id ? ' class="active"' : ''}>${label}</a>`;
  return `<header class="topbar"><div class="topbar-inner">
<a class="brand" href="${p('index.html')}"><img class="brand-mark" src="${rel(pagePath, 'media/app-icon.png')}" alt="" width="36" height="36"><span class="brand-name">${t.name}</span></a>
<nav class="topnav">${item('home', 'index.html', t.nav.home)}${item('docs', 'docs/index.html', t.nav.docs)}</nav>
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
<span><a href="${p('docs/index.html')}">${t.nav.docs}</a> &nbsp;·&nbsp; <a href="${GH}">GitHub</a></span></div></footer>`;
}

const pathOf = (lang, page) => (lang === 'zh' ? 'zh/' : '') + page;
const other = (lang, page) => pathOf(lang === 'zh' ? 'en' : 'zh', page);

// ---------------------------------------------------------------- download
// What the homepage's download button reveals: the newest release as one card per system, so the
// visitor picks a platform instead of reading install steps. The panel unfolds inside the page
// under the hero, pushing the video down rather than floating over it. site.js marks the card
// matching the visitor's system, and each build is a chip labelled with its architecture that
// carries the checksum in its tooltip. Chips come from release.json, so a system without a
// published build simply shows no chip.
function downloadPanel(lang) {
  const t = T[lang], dl = t.dl;
  // The chip is a bare architecture label: the card already carries a download glyph, so a second
  // one in front of every build only adds noise.
  const chip = (b) => {
    // Windows is distributed outside the GitHub release, so its entry carries no checksum.
    const tip = b.sha256 ? `${dl.download} · SHA256 ${esc(b.sha256)}` : dl.download;
    return `<a class="file" href="${esc(b.url)}" title="${esc(tip)}">${esc(b.arch)}</a>`;
  };
  const chips = (re) => RELEASE.binaries.filter((b) => re.test(b.name)).sort((a, b) => Number(b.arch === 'x86_64') - Number(a.arch === 'x86_64')).map(chip).join('');
  // The tag lives in the Linux card until site.js moves it into whichever card is the visitor's.
  const card = (os, icon, name, re) => {
    const rows = chips(re);
    return `<div class="os" data-os="${os}">
<div class="ico">${svg(IC[icon], 20)}</div>
<h3>${name}${os === 'linux' ? ` <span id="recommend-tag" class="hidden">${dl.recommended}</span>` : ''}</h3>
${rows ? `<div class="files">${rows}</div>` : ''}
</div>`;
  };
  return `<div class="dl-reveal" id="download-panel">
<div class="dl-clip">
<div class="dl-panel">
<div class="os-grid" id="downloads">
${card('windows', 'windows', dl.windows, /-windows-|-win-/)}
${card('linux', 'linux', dl.linux, /-linux-/)}
</div>
</div>
<div class="ver-row dl-meta">${dl.latest} <b>v${esc(RELEASE.version)}</b> · <a href="${esc(RELEASE.url)}" target="_blank" rel="noopener">${dl.notes}</a> · <a href="${GH}/releases" target="_blank" rel="noopener">${dl.all} →</a></div>
</div>
</div>`;
}

// ---------------------------------------------------------------- home
function home(lang) {
  const t = T[lang];
  const page = 'index.html', pagePath = pathOf(lang, page);
  const r = (p) => rel(pagePath, p);
  const docLink = (k) => rel(pagePath, pathOf(lang, 'docs/' + keyFor(k) + '.html'));
  // Turns are marked with a square avatar rather than a name inside the bubble: the reader's own
  // words carry their avatar on the right, the agent's carries it on the left.
  const avatar = (sd) => `<span class="avatar${sd ? ' sd' : ''}">${sd ? t.avatarSd : t.avatarAgent}</span>`;
  const userTurn = (text) => `<div class="turn user"><div class="bubble user">${text}</div><span class="avatar">${t.avatarUser}</span></div>`;
  const botTurn = (text, sd, cls = '') => `<div class="turn bot">${avatar(sd)}<div class="bubble bot${cls ? ' ' + cls : ''}">${text}</div></div>`;
  // The reply is about files landing in the workspace, so name a few of them and let three dots
  // say the list keeps going.
  const FILE_IC = '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z"/><path d="M14 3v5h5"/></svg>';
  const fileList = (names) => `<span class="files">${names.map((n) => `<span class="file">${FILE_IC}${n}</span>`).join('')}</span><span class="files-more" title="${t.filesMore}">···</span>`;
  // A file the run produced or fetched opens in place. The two columns open to different things:
  // the generic agent can only show the raw record, ScienceDiscovery reveals the rendered artifact.
  // Both carry a hint and a glyph, because a bare file name reads as a label.
  const CHEV = '<svg class="chev" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m6 9 6 6 6-6"/></svg>';
  const fold = (name, hint, body) => `<details class="fold"><summary>${FILE_IC}${name}<span class="fold-hint">${hint}</span>${CHEV}</summary><div class="fold-body">${body}</div></details>`;
  // The hint that opens the viewer is the one readers must not miss, so it carries hint-live
  // (a colour cycle) while the plain column's hint stays quiet.
  const chipIcon = (f) => (f.ic ? svg(IC[f.ic], 13) : FILE_IC);
  const viewerChip = (f) => `<span class="fold-label">${f.label}</span><button class="file fold-open" type="button" data-viewer="${f.viewer}" aria-haspopup="dialog">${chipIcon(f)}${f.name}<span class="fold-hint hint-live">${f.hint}</span>${CHEV}</button>`;
  // What a chip opens is too large for the reading flow, so it lives in a modal with a way out.
  // Two kinds exist: a real Mol* viewer (bundle and structure fetched on first open) and a still
  // screenshot of an Evolve run.
  const viewerPanel = (f) => {
    // A screenshot panel carries its own aspect ratio so the dialog can be narrowed to the image;
    // the Mol* panel keeps the full 80vw because the viewer wants the room.
    const cls = f.structure ? 'viewer-dialog' : 'viewer-dialog shot-dialog';
    const style = f.structure ? '' : ` style="--shot-ratio:${shotRatio(f.image)}"`;
    const body = f.structure
      ? `<div class="viewer-stage" data-viewer-css="${r('vendor/molstar/molstar.css')}" data-viewer-lib="${r('vendor/molstar/molstar.js')}" data-viewer-src="${r('media/' + f.structure)}" data-viewer-error="${esc(f.error)}"><span class="viewer-msg">${f.loading}</span></div>`
      : `<div class="viewer-shot"><img src="${r('media/' + f.image)}" alt="${esc(f.alt)}" decoding="async"></div>`;
    return `<dialog class="${cls}" id="${f.viewer}"${style} aria-label="${esc(f.name)}"><div class="viewer-head"><span class="viewer-name">${chipIcon(f)}${f.name}</span><button class="viewer-close" data-close type="button" aria-label="${t.close}">✕</button></div><p class="viewer-note">${f.caption}</p>${body}</dialog>`;
  };
  // What the run cost is a per-column footnote, not part of the transcript: it sits under the
  // bubble, centred, so the two columns can be read against each other.
  const tally = (text, ic) => (text ? `<p class="tally">${ic ? svg(IC[ic], 16) : ''}${text}</p>` : '');
  const feats = t.feats.map((f) => `<article class="feature">
<span class="eyebrow">${svg(IC[f.ic], 14)}${f.tag}</span>
<h3>${f.title}</h3>
<p class="feature-text">${f.text}</p>
<div class="compare">
<figure class="chat${f.tally ? ' tallied' : ''}"><figcaption><span class="dot"></span>${t.chatPlain}</figcaption>
${userTurn(f.ask)}
${botTurn(`${f.plain}${f.plainFold ? fold(f.plainFold.name, f.plainFold.hint, `<pre>${esc(f.plainFold.text)}</pre><span class="fold-note">${f.plainFold.note}</span>`) : ''}`, false)}
${f.plain2 ? botTurn(`${f.plain2}<span class="pulse"></span>`, false, 'progress') : ''}
${tally(f.tally, f.tallyIcon)}
</figure>
<figure class="chat sd${f.sdTally ? ' tallied' : ''}"><figcaption><span class="dot"></span>${t.chatSd}</figcaption>
${userTurn(f.ask)}
${botTurn(`${f.sd}${f.files ? fileList(f.files) : ''}${f.sdFold ? viewerChip(f.sdFold) : ''}${f.sdTask ? viewerChip(f.sdTask) : ''}`, true)}
${tally(f.sdTally, f.sdTallyIcon)}
</figure>
</div>
${f.sdFold ? viewerPanel(f.sdFold) : ''}
${f.sdTask ? viewerPanel(f.sdTask) : ''}
${(f.evidence || []).map(viewerPanel).join('')}
<p class="feature-more"><a href="${docLink(f.doc)}">${t.learn}</a></p>
</article>`).join('\n');
  return head(lang, `${t.name} — ${t.tag}`, pagePath) + `
<body class="home">
<div class="aurora" aria-hidden="true"></div>
${topbar(lang, 'home', pagePath, other(lang, page))}
<main class="wrap">
<section class="quick-install">
<span class="eyebrow">${svg(IC.flask, 14)}${t.eyebrow}</span>
<h1>${t.h1}</h1><p class="lead">${t.lead}</p>
<div class="hero-cta"><button class="btn download" type="button" data-download-open aria-controls="download-panel" aria-expanded="false">${svg(IC.download, 18)}${t.ctaDownload}</button></div>
${downloadPanel(lang)}
</section>
<section class="home-video"><video src="${r('media/ScienceDiscovery.mp4')}" aria-label="${esc(t.videoLabel)}" autoplay muted loop playsinline controls preload="metadata"></video></section>
${feats}
</main>
${footer(lang, pagePath)}
<script src="${r('site.js')}"></script>
</body></html>`;
}

// ---------------------------------------------------------------- retired pages
// Older URLs that no longer have a page of their own point at a surviving one, so incoming links
// keep working. The label and the highlighted nav item follow whichever page they land on.
function legacyRedirect(lang, page, to, nav) {
  const t = T[lang], pagePath = pathOf(lang, page);
  const target = rel(pagePath, pathOf(lang, to));
  return head(lang, `${t.nav[nav]} — ${t.name}`, pagePath) + `
<meta http-equiv="refresh" content="0;url=${target}"></head>
<body>${topbar(lang, nav, pagePath, other(lang, page))}<main class="redirect"><p><a href="${target}">${t.nav[nav]}</a></p></main>${footer(lang, pagePath)}</body></html>`;
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
  const groupIcons = { 'getting-started': 'book', core: 'tree', domains: 'flask', 'setup-reference': 'plug' };
  const linkFor = (k, text, fromPath) => `<a href="${rel(fromPath, pathOf(lang, 'docs/' + outPath(k)))}"${k === activeKey ? ' class="active" aria-current="page"' : ''}>${esc(text)}</a>`;
  return (fromPath) => {
    return DOC_GROUPS.map(([group]) => {
      const keys = groupItems(group);
      const open = keys.includes(activeKey) ? ' open' : '';
      return `<details class="docs-nav-group"${open}><summary><span class="docs-nav-icon">${svg(IC[groupIcons[group]], 18)}</span><span class="docs-nav-title">${esc(S[group])}</span><span class="docs-nav-chevron" aria-hidden="true"></span></summary><div class="docs-nav-links">${keys.map((k) => linkFor(k, titleOf(k, lang), fromPath)).join('')}</div></details>`;
    }).join('');
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
  const groupAnchors = lang === 'en'
    ? { core: 'core-capabilities', domains: 'domain-guides' }
    : { core: '核心能力', domains: '领域指南' };
  const groups = DOC_GROUPS.map(([group]) => `<h2 id="${groupAnchors[group] || group}">${S[group]}</h2><div class="grid">${groupItems(group).map((k) => card(k)).join('')}</div>`).join('');
  return head(lang, `${dd.title} — ${t.name}`, pagePath) + `
<body>
${topbar(lang, 'docs', pagePath, other(lang, page))}
<main class="docs-home"><h1>${dd.title}</h1><p style="color:var(--muted)">${dd.homeIntro}</p>${groups}</main>
${footer(lang, pagePath)}
<script src="${rel(pagePath, 'site.js')}"></script>
</body></html>`;
}

// ---------------------------------------------------------------- write
// GitHub Pages caches assets for minutes: version the local CSS/JS URLs by content so a redeploy is never
// served as new HTML with stale styles. Mol* ships as a devDependency and is copied in below, so the
// viewer is served from this origin rather than a CDN.
const ASSET_V = {};
for (const f of ['site.css', 'site.js']) ASSET_V[f] = createHash('sha256').update(readFileSync(join(HERE, 'src', f))).digest('hex').slice(0, 10);
for (const f of ['molstar.css', 'molstar.js']) ASSET_V[f] = createHash('sha256').update(readFileSync(join(ROOT, 'node_modules', 'molstar', 'build', 'viewer', f))).digest('hex').slice(0, 10);
const versioned = (html) => html.replace(/(src|href|data-viewer-(?:css|lib))="([^"]*?)((?:site|molstar)\.(?:css|js))"/g, (m, attr, dir, f) => `${attr}="${dir}${f}?v=${ASSET_V[f]}"`);
const SITE_ORIGIN = (process.env.SITE_URL || 'https://sciencediscovery.github.io').replace(/\/$/, '');
const sitemapPages = []; // populated as pages are written; 404.html and JSON are excluded

function write(p, content, sitemap = true) {
  if (p.endsWith('.html')) {
    content = versioned(content);
    if (sitemap && p !== '404.html') sitemapPages.push(p);
  }
  const full = join(DIST, p);
  mkdirSync(dirname(full), { recursive: true });
  writeFileSync(full, content);
}

rmSync(DIST, { recursive: true, force: true });
mkdirSync(DIST, { recursive: true });
for (const f of ['site.css', 'site.js']) cpSync(join(HERE, 'src', f), join(DIST, f));
cpSync(join(HERE, 'src', 'fonts'), join(DIST, 'fonts'), { recursive: true });
cpSync(join(HERE, 'src', 'media'), join(DIST, 'media'), { recursive: true });
// The Mol* viewer is served from this origin: the site must not depend on a CDN at runtime.
mkdirSync(join(DIST, 'vendor', 'molstar'), { recursive: true });
for (const f of ['molstar.css', 'molstar.js']) cpSync(join(ROOT, 'node_modules', 'molstar', 'build', 'viewer', f), join(DIST, 'vendor', 'molstar', f));
cpSync(join(DOCS, 'images'), join(DIST, 'docs', 'images'), { recursive: true });
// The walkthrough links the sample data it asks readers to upload, so it has to ship with the page.
if (existsSync(join(DOCS, 'examples'))) cpSync(join(DOCS, 'examples'), join(DIST, 'docs', 'examples'), { recursive: true });
write('favicon.svg', `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><rect width="32" height="32" rx="8" fill="#2563eb"/><g transform="translate(6 6) scale(.83)" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${IC.brand}</g></svg>`);
write('.nojekyll', '');
write('404.html', '<meta charset="utf-8"><meta http-equiv="refresh" content="0;url=./"><a href="./">ScienceDiscovery</a>');

const order = DOC_GROUPS.flatMap(([group]) => groupItems(group));
// Each hidden group pages only against itself, so no pager link sends a reader into it.
const hiddenOrder = DOC_HIDDEN_GROUPS.flatMap((group) => groupItems(group));

let pages = 0;
for (const lang of LANGS) {
  write(pathOf(lang, 'index.html'), home(lang));
  write(pathOf(lang, 'deployment/index.html'), legacyRedirect(lang, 'deployment/index.html', 'docs/getting-started/deployment.html', 'docs'), false);
  write(pathOf(lang, 'download/index.html'), legacyRedirect(lang, 'download/index.html', 'index.html', 'home'), false);
  write(pathOf(lang, 'docs/index.html'), docsHome(lang, order));
  for (const k of order) { write(pathOf(lang, 'docs/' + outPath(k)), docPage(k, lang, order)); pages++; }
  for (const k of hiddenOrder) { write(pathOf(lang, 'docs/' + outPath(k)), docPage(k, lang, hiddenOrder), false); pages++; }
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
