/* Home-page product replica: sidebar sessions, timeline, workspace panel, artifact viewer, and seven scripted
   scenarios (literature, Idea Tree, Evolve, memory graph, protein, crystal, data). Everything is illustrative. */
(function () {
  'use strict';
  var root = document.getElementById('demo');
  if (!root || !window.SDViz) return;
  var V = window.SDViz, NS = 'http://www.w3.org/2000/svg';
  var lang = document.documentElement.lang === 'zh' ? 'zh' : 'en';
  function L(en, zh) { return { en: en, zh: zh }; }
  function t(o) { return o == null ? '' : typeof o === 'string' ? o : (o[lang] || o.en); }
  function esc(s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }
  function h(tag, cls, html) { var n = document.createElement(tag); if (cls) n.className = cls; if (html != null) n.innerHTML = html; return n; }
  function sv(tag, attrs, parent, text) { var n = document.createElementNS(NS, tag); for (var k in attrs) n.setAttribute(k, attrs[k]); if (text != null) n.textContent = text; if (parent) parent.appendChild(n); return n; }
  function $(s, r) { return (r || root).querySelector(s); }
  function $$(s, r) { return Array.prototype.slice.call((r || root).querySelectorAll(s)); }

  var IC = {
    folder: '<path d="M3 6a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>',
    chat: '<path d="M4 5h16v11H9l-5 4z"/>', search: '<circle cx="11" cy="11" r="6"/><path d="m20 20-4-4"/>',
    spark: '<path d="m12 3 1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8z"/>',
    file: '<path d="M6 3h8l4 4v14H6z"/><path d="M14 3v4h4"/>', gear: '<circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M4.2 4.2l2.1 2.1M17.7 17.7l2.1 2.1M2 12h3M19 12h3M4.2 19.8l2.1-2.1M17.7 6.3l2.1-2.1"/>',
    chev: '<path d="m9 6 6 6-6 6"/>', check: '<path d="m5 12 5 5 9-10"/>', send: '<path d="M4 12 20 4l-4 16-4-6z"/>',
    upload: '<path d="M12 16V4M7 9l5-5 5 5M4 20h16"/>', shield: '<path d="M12 3 5 6v6c0 4 3 7 7 9 4-2 7-5 7-9V6z"/><path d="m9 12 2 2 4-4"/>',
    x: '<path d="M6 6l12 12M18 6 6 18"/>', user: '<circle cx="12" cy="8" r="3.5"/><path d="M5 20c0-4 3-6 7-6s7 2 7 6"/>',
    bot: '<rect x="5" y="8" width="14" height="11" rx="3"/><path d="M12 4v4M9 13h.01M15 13h.01"/>', tool: '<path d="M14 6a4 4 0 0 0-5 5L3 17l4 4 6-6a4 4 0 0 0 5-5l-3 3-3-3z"/>',
    flask: '<path d="M10 2v7.5L4.7 18.4a2 2 0 0 0 1.7 3h11.2a2 2 0 0 0 1.7-3L14 9.500V2"/><path d="M8.500 2h7M7.300 15h9.400"/>',
    tree: '<circle cx="12" cy="5" r="2.500"/><circle cx="5.500" cy="19" r="2.500"/><circle cx="18.500" cy="19" r="2.500"/><path d="M12 7.500v4M12 11.500H5.500v5M12 11.500h6.500v5"/>',
    dna: '<path d="M6 3c0 6 12 6 12 12s-12 6-12 6"/><path d="M18 3c0 6-12 6-12 12"/><path d="M8 7h8M8 17h8"/>',
    graph: '<circle cx="6" cy="6" r="2.500"/><circle cx="18" cy="8" r="2.500"/><circle cx="12" cy="18" r="2.500"/><path d="M8.200 7l7.600.7M7 8.300l4 7.600M16.800 10l-3.800 6"/>',
    atom: '<circle cx="12" cy="12" r="1.600"/><ellipse cx="12" cy="12" rx="9" ry="3.800"/><ellipse cx="12" cy="12" rx="9" ry="3.800" transform="rotate(60 12 12)"/><ellipse cx="12" cy="12" rx="9" ry="3.800" transform="rotate(120 12 12)"/>',
    cube: '<path d="m12 3 8 4.500v9L12 21l-8-4.500v-9z"/><path d="m4 7.500 8 4.500 8-4.500M12 12v9"/>',
    chart: '<path d="M4 20V4M4 20h16"/><circle cx="9" cy="14" r="1.200"/><circle cx="13" cy="9" r="1.200"/><circle cx="17" cy="12" r="1.200"/><circle cx="8" cy="8" r="1.200"/>'
  };
  function ic(n, s) { return '<svg width="' + (s || 16) + '" height="' + (s || 16) + '" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + IC[n] + '</svg>'; }

  /* ------------------------------------------------------------------ UI strings */
  var S = {
    sub: L('Local research environment', '本地科研运行环境'), projects: L('Projects', '项目'), sessions: L('Sessions', '会话'),
    search: L('Search', '搜索'), usage: L('Usage', '用量'), files: L('Files', '文件'), settings: L('System settings', '系统设置'),
    empty1: L('Session workspace ready', '会话工作区已就绪'), empty2: L('What shall we research?', '我们要研究什么？'),
    empty3: L('Press Run analysis, or pick another session on the left.', '点击“运行分析”，或在左侧选择其他会话。'),
    model: L('Task model', '任务模型'), send: L('Enter to send · Shift+Enter for newline', 'Enter 发送 · Shift+Enter 换行'),
    approval: L('Ask before risky operations', '危险操作时询问'), specialist: L('Coordinator', '协调器'),
    run: L('Run analysis', '运行分析'), running: L('Running…', '运行中…'), again: L('Run again', '再次运行'),
    placeholder: L('Ask anything about your research…', '描述你的研究问题…'),
    workspace: L('Workspace', '工作区'), wsFiles: L('Workspace files', '工作区文件'), drop: L('Drop files', '拖放文件'), dropHint: L('text and binary · 1 GiB max', '文本与二进制 · 单个 1 GiB'),
    artifacts: L('Artifacts', '产物'), paper: L('Paper reader', '论文阅读'), parsed: L('parsed', '已解析'), prov: L('Provenance record', '溯源记录'),
    iso: L('Isolated execution', '隔离执行'), reviewer: L('Reviewer Specialist', '评审专家'), builtin: L('Built-in Specialist', '内置专家'), level: L('Level', '级别'), quick: L('Quick', '快速'),
    runReview: L('Run review', '运行评审'), reviewing: L('Reviewing…', '评审中…'),
    on: L('On', '开启'), done: L('done', '完成'), runningS: L('running', '运行中'), plan: L('PLAN', '计划'),
    preview: L('Preview', '预览'), provenance: L('Provenance', '溯源'), taskChain: L('View task chain', '查看任务链'), artChain: L('View artifact chain', '查看产物链'),
    version: L('version', '版本'), close: L('Close', '关闭')
  };

  /* ------------------------------------------------------------------ shell */
  var SESSIONS = [
    { id: 'lit', ic: 'chat', title: L('Liver expression survey', '肝脏表达文献调研'), prompt: L('Search PubMed and bioRxiv for papers published 2023-2025 comparing gene expression in adult vs paediatric liver parenchymal cells. Focus on immune-related pathways. Generate a pathway enrichment bar chart for the top pathways and flag contradictory findings across studies.', '检索 PubMed 与 bioRxiv 上 2023–2025 年比较成人与儿童肝实质细胞基因表达的论文，聚焦免疫相关通路。生成前几位富集通路的柱状图，并标出不同研究之间相互矛盾的结论。') },
    { id: 'tree', ic: 'tree', title: L('Perovskite stability ideas', '钙钛矿稳定性构思'), prompt: L('/idea-tree Improve the operational stability of perovskite solar cells under humidity and heat', '/idea-tree 提升钙钛矿太阳能电池在湿热条件下的运行稳定性') },
    { id: 'evolve', ic: 'dna', title: L('Lossless compression', '无损压缩算法设计'), prompt: L('/evolve Minimise the compressed byte size of text: compress(text)->bytes / decompress(bytes)->str, stdlib only, exact round-trip required.', '/evolve 最小化文本压缩后的字节数：compress(text)->bytes / decompress(bytes)->str，仅限标准库，必须精确还原。') },
    { id: 'memory', ic: 'graph', title: L('Report provenance', '报告溯源'), prompt: L('Trace every claim in report.md back to its evidence and the code that produced it.', '把 report.md 中的每条结论追溯到证据以及生成它的代码。') },
    { id: 'protein', ic: 'atom', title: L('Kinase pocket inspection', '激酶口袋检视'), prompt: L('Find the ligand-binding pocket of the kinase domain, list the lining residues and show hydrogen bonds to the inhibitor in 3D.', '找出激酶结构域的配体结合口袋，列出内衬残基，并在 3D 中显示与抑制剂的氢键。') },
    { id: 'crystal', ic: 'cube', title: L('CsPbI3 crystal structure', 'CsPbI₃ 晶体结构'), prompt: L('Build the cubic CsPbI3 perovskite, check the Goldschmidt tolerance factor and simulate its powder XRD pattern.', '构建立方相 CsPbI₃ 钙钛矿，检查 Goldschmidt 容忍因子，并模拟其粉末 XRD 图谱。') },
    { id: 'data', ic: 'chart', title: L('Differential expression', '差异表达分析'), prompt: L('Run differential expression between adult and paediatric samples, then draw a volcano plot and a heatmap of the top genes.', '对成人与儿童样本做差异表达分析，绘制火山图并画出前几位基因的热图。') }
  ];

  root.innerHTML =
    '<div class="chrome"><i></i><i></i><i></i><span class="url">127.0.0.1:4310</span></div>' +
    '<div class="shell"><aside class="sb"></aside><section class="main"><header class="topline"></header><div class="scroll" id="scroll"></div>' +
    '<div class="composer"><div class="ta" id="ta"></div><div class="cbar"></div></div></section><aside class="ws"></aside></div>';

  var sb = $('.sb'), topline = $('.topline'), scroll = $('#scroll'), ta = $('#ta'), cbar = $('.cbar'), ws = $('.ws'), shell = $('.shell');
  sb.innerHTML =
    '<div class="sb-brand"><span class="brand-mark">' + ic('flask', 18) + '</span><div><strong>ScienceDiscovery</strong><small>' + t(S.sub) + '</small></div></div>' +
    '<div class="sb-label proj">' + t(S.projects).toUpperCase() + '<span class="n">2</span></div>' +
    '<div class="sb-item active proj"><span class="ic">' + ic('folder') + '</span><span>biomnibench</span></div>' +
    '<div class="sb-label">' + t(S.sessions).toUpperCase() + '<span class="n">' + SESSIONS.length + '</span></div><div id="sess" style="min-height:0;overflow-y:auto"></div>' +
    '<div class="sb-spacer"></div><div class="sb-bottom">' +
    '<div class="sb-item"><span class="ic">' + ic('search') + '</span><span>' + t(S.search) + '</span><span class="kbd">Ctrl K</span></div>' +
    '<div class="sb-item"><span class="ic">' + ic('spark') + '</span><span>' + t(S.usage) + '</span></div>' +
    '<div class="sb-item"><span class="ic">' + ic('file') + '</span><span>' + t(S.files) + '</span><span class="cnt">113</span></div>' +
    '<div class="sb-item"><span class="ic">' + ic('gear') + '</span><span>' + t(S.settings) + '</span></div></div>';
  cbar.innerHTML =
    '<span class="mdl"><span class="dot-ok"></span>' + t(S.model) + '<span class="fsel">GLM-5.2 · GLM-5.2</span></span>' +
    '<span class="hint">' + t(S.send) + '</span><span class="fsel opt">' + t(S.approval) + '</span><span class="fsel opt">' + t(S.specialist) + '</span>' +
    '<button class="run" id="run">' + ic('send', 15) + '<span>' + t(S.run) + '</span></button>';
  var sess = $('#sess');
  SESSIONS.forEach(function (s) {
    var b = h('button', 'sb-item', '<span class="ic">' + ic(s.ic) + '</span><span>' + esc(t(s.title)) + '</span>');
    b.dataset.id = s.id; b.addEventListener('click', function () { select(s.id, true); }); sess.appendChild(b);
  });

  /* ------------------------------------------------------------------ state + player */
  var cur = null, runId = 0, state, tokenTimer;
  function fresh() { return { artifacts: [], parsed: 0, tokens: 0, running: false, reviewed: null }; }
  function fmtTok(n) { return n >= 1000 ? (n / 1000).toFixed(1) + 'K' : String(n); }
  function renderTop() {
    var s = SESSIONS.filter(function (x) { return x.id === cur; })[0];
    topline.innerHTML = '<span>biomnibench</span><span>›</span><b>' + esc(t(s.title)) + '</b><span class="sp"></span><span class="usage">' + t(S.usage).toUpperCase() + '<b id="tok">' + fmtTok(state.tokens) + '</b></span><span class="dot-ok"></span>';
  }
  function setTokens(n) { state.tokens = n; var e = $('#tok'); if (e) e.textContent = fmtTok(n); }

  function makeCtx(my) {
    var ctx = {
      wait: function (ms) { return new Promise(function (res, rej) { setTimeout(function () { my === runId ? res() : rej('cancel'); }, ms); }); },
      alive: function () { return my === runId; },
      add: function (node, kind) {
        var row = h('div', 'tl'), rail = h('div', 'tl-rail'), dot = h('div', 'tl-dot ' + (kind === 'user' ? 'user' : kind === 'done' ? 'ok' : ''), ic(kind === 'user' ? 'user' : kind === 'done' ? 'check' : kind === 'tool' ? 'tool' : 'bot', 12));
        rail.appendChild(dot); var body = h('div', 'tl-body'); body.appendChild(node); row.appendChild(rail); row.appendChild(body);
        scroll.appendChild(row); scroll.scrollTop = scroll.scrollHeight; return row;
      },
      user: function (text) { return ctx.add(h('div', 'bubble', esc(text)), 'user'); },
      say: function (html) { return ctx.add(h('div', 'say', html), 'asst'); },
      tok: function (n) { var from = state.tokens, to = from + n, i = 0; clearInterval(tokenTimer); tokenTimer = setInterval(function () { i++; setTokens(Math.round(from + (to - from) * i / 10)); if (i >= 10) clearInterval(tokenTimer); }, 60); },
      plan: function (items) {
        var c = h('div', 'card-x plan', '<h5>' + t(S.plan) + '</h5>'), ul = h('ul'), lis = items.map(function (x) { var li = h('li', '', '<span class="cb">' + ic('check', 10) + '</span><span>' + esc(t(x)) + '</span>'); ul.appendChild(li); return li; });
        c.appendChild(ul); ctx.add(c, 'asst');
        return { set: function (i, st) { lis[i].className = st; } };
      },
      tool: async function (o) {
        var c = h('div', 'card-x' + (o.open ? ' open' : ''));
        var head = h('div', 'tool-h', '<span class="chev">' + ic('chev', 13) + '</span><span class="tn">' + o.n + '</span><span class="ta">' + esc(t(o.a)) + '</span>' + (o.sandbox ? '<span class="badge blue">' + t(S.iso) + '</span>' : '') + '<span class="ts run"><span class="spin"></span></span>');
        var body = h('div', 'tool-b', ''); c.appendChild(head); c.appendChild(body);
        head.addEventListener('click', function () { c.classList.toggle('open'); });
        ctx.add(c, 'tool'); if (o.tok) ctx.tok(o.tok);
        await ctx.wait(o.ms || 1000);
        body.innerHTML = o.r || ''; var st = $('.ts', head); st.className = 'ts'; st.textContent = t(S.done) + ' · ' + ((o.ms || 1000) / 1000).toFixed(1) + ' s';
        if (o.after) o.after();
      },
      artifact: function (a) { state.artifacts.push(a); renderWs(); },
      final: function (node) { return ctx.add(node, 'done'); }
    };
    return ctx;
  }

  var typing = null;
  function showPrompt(text, animate, done) {
    clearInterval(typing);
    var full = t(text);
    if (!animate) { ta.innerHTML = full ? esc(full) : '<span class="ph">' + esc(t(S.placeholder)) + '</span>'; if (done) done(); return; }
    var i = 0, step = Math.max(2, Math.round(full.length / 34));
    typing = setInterval(function () { i += step; ta.innerHTML = esc(full.slice(0, i)) + '<span class="caret"></span>'; if (i >= full.length) { clearInterval(typing); ta.innerHTML = esc(full); setTimeout(done, 350); } }, 28);
  }

  function emptyState() {
    scroll.innerHTML = '<div class="empty"><div class="kick">' + t(S.empty1) + '</div><h2>' + t(S.empty2) + '</h2><p>' + t(S.empty3) + '</p></div>';
  }

  function select(id, autoplay) {
    runId++; clearInterval(typing); clearInterval(tokenTimer); closeModal();
    cur = id; state = fresh(); renderTop(); renderWs(); emptyState();
    $$('.sb-item', sess).forEach(function (b) { b.classList.toggle('active', b.dataset.id === id); });
    var s = SESSIONS.filter(function (x) { return x.id === id; })[0];
    showPrompt(s.prompt, false); setRun(false);
    if (autoplay) setTimeout(function () { if (cur === id) play(); }, 250);
  }
  function setRun(running, finished) {
    var b = $('#run'); b.disabled = running; $('span', b).textContent = running ? t(S.running) : finished ? t(S.again) : t(S.run);
  }
  function play() {
    var my = ++runId, s = SESSIONS.filter(function (x) { return x.id === cur; })[0];
    state = fresh(); state.running = true; renderTop(); renderWs(); clearInterval(tokenTimer);
    scroll.innerHTML = ''; setRun(true); closeModal();
    showPrompt(s.prompt, true, function () {
      if (my !== runId) return;
      var ctx = makeCtx(my);
      ta.innerHTML = '<span class="ph">' + esc(t(S.placeholder)) + '</span>';
      ctx.user(t(s.prompt));
      SCEN[s.id](ctx).then(function () { if (my === runId) { state.running = false; setRun(false, true); } }, function (e) { if (e !== 'cancel') { console.error(e); } });
    });
  }
  $('#run').addEventListener('click', play);

  /* ------------------------------------------------------------------ workspace column */
  var expanded = { art: true, paper: false, prov: false };
  function renderWs() {
    var arts = state.artifacts, revHtml = '';
    ws.innerHTML =
      '<div class="ws-h"><h3>' + t(S.workspace) + '</h3><span class="sp"></span><span class="pill-n">' + t(S.wsFiles) + '</span><span class="pill-n">' + (113 + arts.length) + '</span></div>' +
      '<div class="drop"><span style="color:var(--accent)">' + ic('upload', 16) + '</span><span><b>' + t(S.drop) + '</b><br>' + t(S.dropHint) + '</span></div>' +
      '<div class="acc' + (expanded.art ? ' open' : '') + '" data-k="art"><button class="acc-h"><span class="chev">' + ic('chev', 13) + '</span>' + t(S.artifacts) + '<span class="n">' + arts.length + '</span></button><div class="acc-b"></div></div>' +
      '<div class="rev"><div class="rev-t"><span class="ico">' + ic('shield', 18) + '</span><div><b>' + t(S.reviewer) + '</b><small>' + t(S.builtin) + '</small></div><span class="badge">' + t(S.on) + '</span></div>' +
      '<div class="rev-l"><span>' + t(S.level) + '</span><b>' + t(S.quick) + '</b></div><button class="go">' + t(S.runReview) + '</button><div class="rev-out"></div></div>' +
      '<div class="acc' + (expanded.paper ? ' open' : '') + '" data-k="paper"><button class="acc-h"><span class="chev">' + ic('chev', 13) + '</span>' + t(S.paper) + '<span class="n">' + state.parsed + ' ' + t(S.parsed) + '</span></button><div class="acc-b"></div></div>' +
      '<div class="acc" data-k="prov"><button class="acc-h"><span class="chev">' + ic('chev', 13) + '</span>' + t(S.prov) + '</button><div class="acc-b" style="font-size:11.5px;color:var(--muted)"></div></div>' +
      '<div class="iso"><span>' + ic('shield', 15) + '</span><span><b>' + t(S.iso) + '</b> · Epoch b23a2db4</span></div>';
    var list = $('.acc[data-k=art] .acc-b', ws);
    arts.forEach(function (a) {
      var b = h('button', 'file-r', '<span style="color:var(--text-faint)">' + ic('file', 14) + '</span><span>' + esc(a.name) + '</span><em>' + esc(a.size) + '</em>');
      b.addEventListener('click', function () { openArtifact(a); }); list.appendChild(b);
    });
    if (!arts.length) list.innerHTML = '<div style="padding:6px;color:var(--text-faint);font-size:11.5px">—</div>';
    $('.acc[data-k=paper] .acc-b', ws).innerHTML = state.parsed ? '<div style="padding:4px 6px;font-size:11.5px;color:var(--text-secondary)">' + state.parsed + ' PDF · evidence extracted<br><span style="color:var(--text-faint)">Hepatology 2024 · Nat Commun 2024 · bioRxiv 2025 …</span></div>' : '<div style="padding:6px;color:var(--text-faint);font-size:11.5px">—</div>';
    $('.acc[data-k=prov] .acc-b', ws).innerHTML = arts.length ? arts.length + ' × artifact → tool call → sandbox epoch' : '—';
    $$('.acc-h', ws).forEach(function (bt) { bt.addEventListener('click', function () { var a = bt.parentNode; a.classList.toggle('open'); expanded[a.dataset.k] = a.classList.contains('open'); }); });
    var go = $('.go', ws), out = $('.rev-out', ws);
    if (state.reviewed) out.innerHTML = state.reviewed;
    go.addEventListener('click', function () {
      go.disabled = true; go.textContent = t(S.reviewing); var my = runId;
      setTimeout(function () {
        if (my !== runId) return;
        state.reviewed = '<ul style="margin:0;padding:0">' + (REVIEW[cur] || REVIEW.lit).map(function (x) { return '<li>' + esc(t(x)) + '</li>'; }).join('') + '</ul>';
        go.disabled = false; go.textContent = t(S.runReview); out.innerHTML = state.reviewed;
      }, 1300);
    });
  }
  var REVIEW = {
    lit: [L('Claim 4 relies on a bioRxiv preprint: mark as not peer-reviewed.', '结论 4 依赖 bioRxiv 预印本：需标注未经同行评审。'), L('Cohort sizes differ 3× between two of the cited studies.', '两篇被引研究的队列规模相差 3 倍。')],
    protein: [L('Contacts computed on a demo model: verify against an experimental structure.', '接触基于演示模型计算：请对照实验结构核验。')],
    crystal: [L('t = 0.85 is below 0.9: the cubic phase is expected only at high temperature.', 't = 0.85 低于 0.9：立方相预计仅在高温下稳定。')],
    data: [L('Multiple-testing correction (BH) applied; 3 genes sit near the p threshold.', '已做 BH 多重检验校正；有 3 个基因接近 p 阈值。')],
    tree: [L('Pruned branch “Encapsulation layers” scored below the viability floor.', '“封装层”分支低于可行性阈值，已剪枝。')],
    evolve: [L('Held-out score (0.9682) is within 0.001 of the search score: no overfit signal.', '留出集得分 0.9682 与搜索得分相差不到 0.001：无过拟合迹象。')],
    memory: [L('All 6 claims have at least one supporting evidence node.', '6 条结论均至少有一个支撑证据节点。')]
  };

  /* ------------------------------------------------------------------ artifact modal */
  function hash(s) { var x = 2166136261; for (var i = 0; i < s.length; i++) { x ^= s.charCodeAt(i); x = Math.imul(x, 16777619); } return (x >>> 0).toString(16).padStart(8, '0'); }
  function closeModal() { var m = $('.mask'); if (m) m.remove(); }
  function openArtifact(a) {
    closeModal();
    var m = h('div', 'mask'), d = h('div', 'modal');
    d.innerHTML = '<div class="modal-h"><div><div class="kick">' + esc(a.kind.toUpperCase()) + '</div><h3>' + esc(a.name) + '</h3></div><span class="sp"></span><span class="fsel">' + t(S.version) + ' v1 · Sep 20 2026</span><button class="x" aria-label="' + t(S.close) + '">' + ic('x', 15) + '</button></div>' +
      '<div class="modal-tabs"><button class="on" data-t="p">' + t(S.preview) + '</button><button data-t="v">' + t(S.provenance) + '</button><button data-t="m">' + t(S.taskChain) + '</button><button data-t="m">' + t(S.artChain) + '</button></div><div class="modal-b"></div>';
    m.appendChild(d); root.appendChild(m);
    var body = $('.modal-b', d);
    function show(tab) {
      $$('.modal-tabs button', d).forEach(function (b, i) { b.classList.toggle('on', (tab === 'p' && i === 0) || (tab === 'v' && i === 1)); });
      if (tab === 'p') { body.innerHTML = a.preview(); $$('.barpair i', body).forEach(function (i) { i.style.width = i.dataset.w + '%'; }); }
      else body.innerHTML = '<dl class="kv"><dt>Produced by</dt><dd>' + esc(a.by) + '</dd><dt>Sandbox</dt><dd>Bubblewrap · epoch b23a2db4</dd><dt>Inputs</dt><dd>' + esc(a.inputs || '—') + '</dd><dt>SHA-256</dt><dd>' + hash(a.name) + hash(a.by).slice(0, 4) + '…</dd><dt>Session</dt><dd>' + esc(t(SESSIONS.filter(function (s) { return s.id === cur; })[0].title)) + '</dd></dl>';
    }
    show('p');
    $$('.modal-tabs button', d).forEach(function (b) { b.addEventListener('click', function () { if (b.dataset.t === 'm') { closeModal(); select('memory', true); } else show(b.dataset.t); }); });
    $('.x', d).addEventListener('click', closeModal); m.addEventListener('click', function (e) { if (e.target === m) closeModal(); });
  }
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') closeModal(); });
  function pre(text) { return '<pre>' + esc(text) + '</pre>'; }

  /* ------------------------------------------------------------------ shared pieces */
  var PATHWAYS = [['Interferon signalling', 38, 21], ['Antigen presentation', 29, 17], ['Complement cascade', 24, 26], ['Cytochrome P450 metabolism', 18, 31], ['Bile acid synthesis', 12, 22], ['Lipid metabolism', 27, 33]];
  function barsHtml() {
    return '<div class="bars">' + PATHWAYS.map(function (p) {
      return '<div class="barrow"><span class="lb">' + p[0] + '</span><span class="barpair"><i class="a" data-w="' + p[1] / 40 * 100 + '"></i><i class="p" data-w="' + p[2] / 40 * 100 + '"></i></span><span>' + p[1] + '/' + p[2] + '</span></div>';
    }).join('') + '</div><div class="legend"><span><i style="background:var(--accent)"></i>' + (lang === 'zh' ? '成人' : 'adult') + '</span><span><i style="background:var(--teal)"></i>' + (lang === 'zh' ? '儿童' : 'paediatric') + '</span></div>';
  }
  function growBars(node) { setTimeout(function () { $$('.barpair i', node).forEach(function (i) { i.style.width = i.dataset.w + '%'; }); }, 60); }
  var CSV_PATH = 'pathway,adult_genes,paediatric_genes,fdr\n' + PATHWAYS.map(function (p, i) { return p[0] + ',' + p[1] + ',' + p[2] + ',' + (0.0004 * (i + 1)).toFixed(4); }).join('\n');
  function csvTable(csv) {
    var rows = csv.split('\n').map(function (r) { return r.split(','); });
    return '<div style="overflow:auto;max-height:300px"><table class="tbl"><thead><tr>' + rows[0].map(function (c) { return '<th>' + esc(c) + '</th>'; }).join('') + '</tr></thead><tbody>' +
      rows.slice(1, 40).map(function (r) { return '<tr>' + r.map(function (c) { return '<td>' + esc(c) + '</td>'; }).join('') + '</tr>'; }).join('') + '</tbody></table></div>';
  }
  var PY_ENRICH = 'import pandas as pd\nfrom gseapy import enrichr\n\ndeg = pd.read_csv("adult_vs_paediatric.csv")\nres = enrichr(gene_list=deg.query("padj < 0.05").gene.tolist(),\n              gene_sets="Reactome_2022", organism="human")\nres.results.head(14).to_csv("pathway_counts.csv", index=False)';

  /* ------------------------------------------------------------------ scenarios */
  var SCEN = {};

  SCEN.lit = async function (c) {
    await c.wait(500);
    c.say(t(L('I will search two databases, read the key papers, run an enrichment analysis in the sandbox and write a cited report.', '我会检索两个数据库、精读关键论文、在沙箱里做富集分析，最后写出带引用的报告。')));
    c.tok(1800);
    var plan = c.plan([L('Search the literature', '检索文献'), L('Read the key papers', '精读关键论文'), L('Enrichment analysis and chart', '富集分析并作图'), L('Cross-check contradictions', '交叉核对矛盾结论')]);
    plan.set(0, 'doing');
    await c.tool({ n: 'literature.search', a: L('PubMed · bioRxiv — “liver parenchymal adult paediatric immune”', 'PubMed · bioRxiv —“肝实质 成人 儿童 免疫”'), ms: 1400, tok: 2600,
      r: '38 records · 2023–2025 · 12 selected<pre>Hepatology 2024 — Age-dependent immune gene programmes in hepatocytes\nNat Commun 2024 — Single-cell atlas of paediatric liver\nbioRxiv 2025 — Interferon tone across the liver lifespan</pre>' });
    plan.set(0, 'done'); plan.set(1, 'doing');
    await c.tool({ n: 'paper.read', a: L('12 PDFs · extract tables and claims', '12 篇 PDF · 抽取表格与结论'), ms: 1500, tok: 4200, r: '12 parsed · 47 evidence spans · 9 candidate claims', after: function () { state.parsed = 12; renderWs(); } });
    plan.set(1, 'done'); plan.set(2, 'doing');
    await c.tool({ n: 'python.run', a: 'enrichment.py', sandbox: true, open: true, ms: 1900, tok: 3300,
      r: pre(PY_ENRICH) + pre('top pathways (FDR < 0.05): 14\nadult-enriched: interferon signalling, antigen presentation\npaediatric-enriched: CYP450, bile-acid synthesis'),
      after: function () {
        c.artifact({ name: 'enrichment.py', kind: 'code', size: '0.6 KB', by: 'python.run #3', inputs: 'adult_vs_paediatric.csv', preview: function () { return pre(PY_ENRICH); } });
        c.artifact({ name: 'pathway_counts.csv', kind: 'csv', size: '1.1 KB', by: 'python.run #3', inputs: 'enrichment.py', preview: function () { return csvTable(CSV_PATH); } });
        c.artifact({ name: 'enrichment_bar.png', kind: 'png', size: '38 KB', by: 'python.run #3', inputs: 'pathway_counts.csv', preview: function () { return barsHtml(); } });
      } });
    plan.set(2, 'done'); plan.set(3, 'doing');
    await c.tool({ n: 'report.write', a: 'report.md · 9 claims with citations', ms: 1000, tok: 2100, r: '9 claims · 2 flagged as contradictory across studies',
      after: function () { c.artifact({ name: 'report.md', kind: 'md', size: '6.2 KB', by: 'report.write #4', inputs: 'pathway_counts.csv', preview: function () { return pre('# Adult vs paediatric liver: immune pathways\n\n1. Interferon signalling is enriched in adult hepatocytes [Hepatology 2024, Table 2].\n2. CYP450 metabolism is higher in paediatric samples [Nat Commun 2024, Fig 3].\n...\n\n> Flag: claims 4 and 7 conflict between cohorts.'); } }); } });
    plan.set(3, 'done');
    await c.wait(300);
    var f = h('div', 'card-x final', '<p><b>' + t(L('Report ready.', '报告已生成。')) + '</b> ' + t(L('Adult tissue is enriched for interferon signalling and antigen presentation; paediatric tissue for xenobiotic metabolism.', '成人组织富集干扰素信号与抗原呈递，儿童组织富集外源物代谢。')) + '</p>' + barsHtml() +
      '<div class="chips"><span class="badge warn">' + t(L('2 contradictory findings flagged', '标出 2 处矛盾结论')) + '</span><button class="chip" id="open-memory">' + t(S.taskChain) + '</button></div>');
    c.final(f); growBars(f); $('#open-memory', f).addEventListener('click', function () { select('memory', true); });
    c.tok(900);
  };

  /* --- Idea Tree --- */
  var TREE = [
    { id: 'r', p: null, x: 320, y: 34, en: 'Perovskite stability', zh: '钙钛矿稳定性' },
    { id: 'A', p: 'r', x: 110, y: 108, s: .72, d: [.8, .7, .65], en: 'Passivation additives', zh: '钝化添加剂', why: L('Surface defects drive moisture ingress; additives are cheap to test.', '表面缺陷是水汽入侵的通道，添加剂便于快速验证。') },
    { id: 'B', p: 'r', x: 320, y: 108, s: .86, d: [.9, .88, .8], en: '2D/3D heterostructure', zh: '2D/3D 异质结构', why: L('A 2D capping layer blocks ion migration while keeping the 3D absorber.', '2D 覆盖层阻止离子迁移，同时保留 3D 吸收层。') },
    { id: 'C', p: 'r', x: 530, y: 108, s: .48, d: [.4, .7, .35], en: 'Encapsulation layers', zh: '封装层设计', why: L('Effective but does not address intrinsic instability; pruned.', '有效但没有解决本征不稳定，已剪枝。'), prune: 1 },
    { id: 'A1', p: 'A', x: 100, y: 188, s: .78, d: [.82, .76, .74], en: 'Ionic-liquid additives', zh: '离子液体添加剂', why: L('Ionic liquids bind both A-site and halide vacancies.', '离子液体可同时钝化 A 位与卤素空位。') },
    { id: 'B1', p: 'B', x: 260, y: 188, s: .91, d: [.94, .9, .88], en: 'Bulky-cation capping', zh: '大体积阳离子封端', why: L('Bulky ammonium forms an ultra-thin 2D phase at grain boundaries.', '大体积铵盐在晶界形成超薄 2D 相。') },
    { id: 'B2', p: 'B', x: 390, y: 188, s: .83, d: [.86, .8, .82], en: 'Graded 2D interlayer', zh: '梯度 2D 中间层', why: L('Graded thickness relieves interfacial strain.', '梯度厚度缓解界面应力。') },
    { id: 'A1a', p: 'A1', x: 70, y: 268, s: .74, d: [.76, .72, .74], en: 'Co-additive blend', zh: '共添加剂组合', why: L('Marginal gain over single additive.', '相比单一添加剂增益有限。') },
    { id: 'B1a', p: 'B1', x: 210, y: 268, s: .94, d: [.96, .93, .92], en: 'Fluorinated spacers', zh: '氟化间隔阳离子', best: 1, why: L('Fluorination raises hydrophobicity and lowers formation energy of the 2D phase.', '氟化提高疏水性并降低 2D 相形成能。') },
    { id: 'B1b', p: 'B1', x: 330, y: 268, s: .88, d: [.9, .87, .86], en: 'Thermal-cycling co-design', zh: '热循环协同设计', why: L('Matches expansion coefficients across layers.', '匹配各层热膨胀系数。') }
  ];
  var TREE_ORDER = ['A', 'B', 'C', 'B1', 'B2', 'A1', 'B1a', 'B1b', 'A1a'];
  var DIMS = [L('Viability', '活性'), L('Stability', '稳定性'), L('Sustain.', '可持续性')];
  function tcol(s) { return s >= .85 ? '#22a06b' : s >= .6 ? '#2563eb' : '#d19a32'; }

  SCEN.tree = async function (c) {
    await c.wait(500);
    c.say(t(L('Starting an Idea Tree research run: up to 3 rounds, 3 candidates per round. Each candidate is designed, scored by three independent evaluators and aggregated.', '启动 Idea Tree 研究：最多 3 轮，每轮 3 个候选。每个候选会被设计，由三位独立评估者打分并聚合。')));
    c.tok(1500);
    var card = h('div', 'rc'), paused = false, stopped = false, n = 0, round = 1;
    card.innerHTML = '<div class="rc-h"><div><div class="kick">IDEA TREE</div><h4>' + t(L('Improve the operational stability of perovskite solar cells', '提升钙钛矿太阳能电池的运行稳定性')) + '</h4></div><span class="sp"></span><div class="ctl"><button class="btn-s" id="tp">' + t(L('Pause', '暂停')) + '</button><button class="btn-s" id="ts">' + t(L('Stop', '结束')) + '</button></div></div>' +
      '<div class="rc-stats"><div>' + t(L('Status', '状态')) + '<b id="tst">' + t(L('Running', '运行中')) + '</b></div><div>' + t(L('Round', '轮次')) + '<b id="trd">1 / 3</b></div><div>' + t(L('Candidates', '候选')) + '<b id="tcn">0 / 9</b></div><div>' + t(L('Depth', '深度')) + '<b>3</b></div></div>' +
      '<div class="rc-b"><div class="plot"><svg viewBox="0 0 640 306"></svg></div><div class="side" id="tside"></div></div>';
    c.add(card, 'asst');
    var svg = $('svg', card), side = $('#tside', card), map = {}, groups = {}, edges = {}, sel = null;
    TREE.forEach(function (nd) { map[nd.id] = nd; });
    TREE.forEach(function (nd) {
      if (!nd.p) return; var p = map[nd.p];
      edges[nd.id] = sv('path', { d: 'M' + p.x + ' ' + (p.y + 20) + ' C' + p.x + ' ' + (p.y + 55) + ' ' + nd.x + ' ' + (nd.y - 55) + ' ' + nd.x + ' ' + (nd.y - 20), 'class': 'g-edge', 'stroke-width': 1.6, opacity: 0 }, svg);
    });
    TREE.forEach(function (nd) {
      var g = sv('g', { 'class': 'gnode ghost', transform: 'translate(' + nd.x + ',' + nd.y + ')', opacity: nd.p ? 0 : 1 }, svg);
      groups[nd.id] = g; sv('circle', { r: 19, fill: '#2563eb', stroke: '#fff', 'stroke-width': 2 }, g);
      nd.tx = sv('text', { 'text-anchor': 'middle', y: 4, fill: '#fff', 'font-size': 11, 'font-weight': 700 }, g, nd.p ? '' : '★');
      sv('text', { 'text-anchor': 'middle', y: 36, 'class': 'g-lbl' }, g, t(nd));
      g.addEventListener('click', function () { pick(nd); });
    });
    groups.r.classList.remove('ghost');
    function pick(nd) {
      sel = nd; Object.keys(groups).forEach(function (k) { groups[k].classList.remove('sel'); }); groups[nd.id].classList.add('sel');
      if (!nd.p) { side.innerHTML = '<h5>' + t(nd) + '</h5>' + t(L('Research goal. Children are designed, scored by three independent evaluators and aggregated into one score.', '研究目标。子想法被设计、由三位独立评估者打分并聚合为一个分数。')); return; }
      if (nd.s == null || !nd.done) { side.innerHTML = '<h5>' + t(nd) + '</h5>' + t(L('Evaluating…', '评估中…')); return; }
      side.innerHTML = '<h5>' + t(nd) + '</h5><span class="badge' + (nd.best ? '' : ' blue') + '">' + (nd.best ? t(L('best so far', '当前最优')) : nd.prune ? t(L('pruned', '已剪枝')) : t(L('evaluated', '已评估'))) + '</span>' +
        '<div style="margin:8px 0 4px;color:var(--text-strong);font-size:15px;font-weight:700">' + nd.s.toFixed(2) + '</div>' +
        nd.d.map(function (v, i) { return '<div class="dim"><span>' + t(DIMS[i]) + '</span><span class="b"><i style="width:' + Math.round(v * 100) + '%"></i></span><em>' + v.toFixed(2) + '</em></div>'; }).join('') +
        '<p style="margin:8px 0 0">' + t(nd.why) + '</p>';
    }
    $('#tp', card).addEventListener('click', function () { paused = !paused; this.textContent = paused ? t(L('Resume', '继续')) : t(L('Pause', '暂停')); $('#tst', card).textContent = paused ? t(L('Paused', '已暂停')) : t(L('Running', '运行中')); });
    $('#ts', card).addEventListener('click', function () { stopped = true; });
    async function gate() { while (paused && c.alive()) await c.wait(200); }
    for (var i = 0; i < TREE_ORDER.length && !stopped; i++) {
      var nd = map[TREE_ORDER[i]]; await gate();
      round = Math.floor(i / 3) + 1; $('#trd', card).textContent = round + ' / 3';
      groups[nd.id].setAttribute('opacity', 1); edges[nd.id].setAttribute('opacity', 1); groups[nd.id].classList.add('pulse'); pick(nd);
      c.tok(2200); await c.wait(1200);
      await gate();
      nd.done = 1; groups[nd.id].classList.remove('ghost', 'pulse'); groups[nd.id].querySelector('circle').setAttribute('fill', tcol(nd.s)); nd.tx.textContent = nd.s.toFixed(2);
      if (nd.prune) groups[nd.id].style.opacity = .55;
      n++; $('#tcn', card).textContent = n + ' / 9'; pick(nd); await c.wait(350);
    }
    $('#tst', card).textContent = stopped ? t(L('Stopped', '已结束')) : t(L('Completed', '已完成')); $('#tp', card).disabled = true; $('#ts', card).disabled = true;
    var best = map.B1a; groups.B1a.querySelector('circle').setAttribute('stroke', '#f59e0b'); groups.B1a.querySelector('circle').setAttribute('stroke-width', 3); pick(best);
    c.say('<b>' + t(L('Best idea: ', '最优想法：')) + '</b>' + t(best) + ' (' + best.s.toFixed(2) + '). ' + t(L('Insights from rounds 1–2 favoured 2D/3D heterostructures over encapsulation.', '第 1–2 轮的洞察表明 2D/3D 异质结构优于封装方案。')));
  };

  /* --- Evolve --- */
  var CANDS = [[.44, -1, 'baseline'], [.4595, 0], [.9001, 0], [.2539, 0], [.4581, 0], [.2757, 0], [0, 0], [.4797, 1], [.3677, 1], [.9001, 2], [.3179, 2], [.9674, 2], [.9561, 2], [.9001, 2], [.073, 2], [.9682, 11], [.967, 11]];
  var EVO_TITLES = ['Lossless text codec', 'BWT + MTF + Huffman', 'LZ77 window + range coder', 'Order-2 context mixing', 'Dictionary preseed', 'PPM-style predictor', 'Arithmetic coder v2'];
  SCEN.evolve = async function (c) {
    await c.wait(500);
    c.say(t(L('Proposing a program-evolution search: the baseline scores 0.44. I will expand 16 candidates across parent programs and verify the winner on held-out data.', '发起程序演进搜索：基线得分 0.44。我会在父程序之间扩展 16 个候选，并在留出集上验证最优者。')));
    c.tok(1400);
    var card = h('div', 'rc'), shown = 0, selRow = null, tab = 'graph', best = -1, done = false;
    card.innerHTML = '<div class="rc-h"><div><div class="kick">' + t(L('PROGRAM EVOLUTION', '程序演进')) + '</div><h4>' + t(L('Minimise compressed byte size · stdlib only · exact round-trip', '最小化压缩字节数 · 仅标准库 · 精确还原')) + '</h4></div><span class="sp"></span><span class="badge" id="est">' + t(L('Running', '运行中')) + '</span></div>' +
      '<div class="rc-stats"><div>' + t(L('Algorithm', '算法')) + '<b>era</b></div><div>' + t(L('Expansions', '扩展次数')) + '<b id="eex">0 / 16</b></div><div>' + t(L('Depth', '深度')) + '<b>3</b></div><div>Token<b id="etk">0</b></div></div>' +
      '<div class="rc-tabs"><button class="on" data-t="graph">' + t(L('Graph', '图')) + '</button><button data-t="table">' + t(L('Table', '表格')) + '</button></div>' +
      '<div class="rc-b"><div class="plot" id="eleft"></div><div class="side pipe" id="epipe"><h5>' + t(L('Candidate pipeline', '候选流水')) + '</h5><div id="erows"></div></div></div>';
    c.add(card, 'asst');
    var left = $('#eleft', card), rows = $('#erows', card);
    function evoName(i) { return EVO_TITLES[i % EVO_TITLES.length]; }
    function draw() {
      if (tab === 'table') {
        left.innerHTML = '<div style="overflow:auto;max-height:290px"><table class="tbl"><thead><tr><th>#</th><th>' + t(L('Parent', '父'))+ '</th><th>' + t(L('Candidate', '候选')) + '</th><th>' + t(L('Score', '得分')) + '</th></tr></thead><tbody>' +
          CANDS.slice(0, shown).map(function (d, i) { return '<tr><td>#' + i + '</td><td>' + (d[1] < 0 ? '—' : '#' + d[1]) + '</td><td>' + evoName(i) + '</td><td>' + d[0].toFixed(4) + '</td></tr>'; }).join('') + '</tbody></table></div>';
        return;
      }
      left.innerHTML = ''; var W = 560, H = 262, Lm = 40, B = 30, T = 14, R = 14, N = 16;
      var svg = sv('svg', { viewBox: '0 0 ' + W + ' ' + H }, left);
      function X(i) { return Lm + i / N * (W - Lm - R); } function Y(v) { return H - B - v / 1.02 * (H - B - T); }
      [0, .25, .5, .75, 1].forEach(function (v) { sv('line', { x1: Lm, x2: W - R, y1: Y(v), y2: Y(v), 'class': 'g-grid' }, svg); sv('text', { x: Lm - 6, y: Y(v) + 3, 'text-anchor': 'end', 'class': 'g-axis' }, svg, v.toFixed(2)); });
      sv('line', { x1: Lm, x2: W - R, y1: Y(.44), y2: Y(.44), 'class': 'g-base' }, svg); sv('text', { x: W - R - 2, y: Y(.44) - 5, 'text-anchor': 'end', 'class': 'g-axis' }, svg, t(L('baseline', '基线')));
      var b = 0, path = '';
      for (var i = 0; i < shown; i++) { if (CANDS[i][0] > b) b = CANDS[i][0]; path += (i ? ' L' : 'M') + X(i) + ' ' + Y(b) + (i < shown - 1 ? ' L' + X(i + 1) + ' ' + Y(b) : ''); }
      if (path) sv('path', { d: path, fill: 'none', stroke: 'var(--accent)', 'stroke-width': 2.4 }, svg);
      var run = 0;
      for (i = 0; i < shown; i++) {
        var s = CANDS[i][0], isBest = s > run; if (isBest) run = s;
        var dot = s === 0 ? sv('circle', { cx: X(i), cy: Y(0), r: 4.5, fill: 'none', stroke: '#b3312f', 'stroke-width': 2 }, svg) : sv('circle', { cx: X(i), cy: Y(s), r: isBest ? 4.6 : 3.2, fill: isBest ? 'var(--accent)' : '#98a2b3', opacity: isBest ? 1 : .8 }, svg);
        if (selRow === i) sv('circle', { cx: X(i), cy: Y(s), r: 8, fill: 'none', stroke: '#f59e0b', 'stroke-width': 2 }, svg);
        (function (i) { dot.style.cursor = 'pointer'; dot.addEventListener('click', function () { selRow = i; draw(); rowsDraw(); }); })(i);
      }
      if (done) { sv('circle', { cx: X(N), cy: Y(.9682), r: 5, fill: '#0f7b57', stroke: 'var(--surface-subtle)', 'stroke-width': 2 }, svg); sv('text', { x: X(N) - 8, y: Y(.9682) + 18, 'text-anchor': 'end', 'class': 'g-lbl' }, svg, t(L('held-out 0.9682', '留出集 0.9682'))); }
      [0, 4, 8, 12, 16].forEach(function (i) { sv('text', { x: X(i), y: H - B + 15, 'text-anchor': 'middle', 'class': 'g-axis' }, svg, '#' + i); });
      var lg = h('div', 'legend', '<span><i style="background:var(--accent)"></i>' + t(L('best so far', '当前最优')) + '</span><span><i style="background:#98a2b3"></i>rollout</span><span><i style="border:2px solid #b3312f;background:none;width:8px;height:8px"></i>' + t(L('failed to run', '没跑起来')) + '</span>');
      lg.style.padding = '0 10px 8px'; left.appendChild(lg);
    }
    function rowsDraw() {
      var run = 0; rows.innerHTML = '';
      CANDS.slice(0, shown).forEach(function (d, i) {
        var nb = d[0] > run ? (i ? 'new best' : '') : (i ? 'no lift' : ''); if (d[0] > run) run = d[0];
        if (d[0] === 0) nb = 'failed';
        var r = h('div', 'prow' + (selRow === i ? ' sel' : ''), '<b>#' + i + '</b><span class="fr">' + (d[1] < 0 ? '' : (lang === 'zh' ? '来自 #' : 'from #') + d[1]) + '</span><span>' + evoName(i) + '</span><span class="sc">' + d[0].toFixed(4) + '</span>' + (i ? '<span class="nb' + (nb === 'new best' ? ' best' : '') + '">' + (nb === 'new best' ? t(L('becomes best', '成为当前最优')) : nb === 'failed' ? t(L('did not run', '未跑起来')) : t(L('no clear lift', '提升不显著'))) + '</span>' : ''));
        r.addEventListener('click', function () { selRow = i; draw(); rowsDraw(); }); rows.appendChild(r);
      });
      rows.parentNode.scrollTop = rows.parentNode.scrollHeight;
    }
    $$('.rc-tabs button', card).forEach(function (b) { b.addEventListener('click', function () { tab = b.dataset.t; $$('.rc-tabs button', card).forEach(function (x) { x.classList.toggle('on', x === b); }); draw(); }); });
    draw();
    for (var i = 0; i < CANDS.length; i++) {
      await c.wait(i ? 620 : 400); shown = i + 1; selRow = i; $('#eex', card).textContent = Math.max(0, shown - 1) + ' / 16'; $('#etk', card).textContent = fmtTok(Math.round(shown * 5400)); c.tok(300); draw(); rowsDraw();
    }
    done = true; selRow = null; $('#est', card).textContent = t(L('Completed', '已完成')); draw();
    c.artifact({ name: 'candidate.py', kind: 'code', size: '3.4 KB', by: 'evolve #15', inputs: 'candidate #11', preview: function () { return pre('"""Lossless text compression via BWT + MTF + RLE + Huffman."""\nimport heapq\nfrom collections import Counter\n\n\ndef _build_codes(freq):\n    heap = [(f, i, None, None) for i, (b, f) in enumerate(freq.items())]\n    heapq.heapify(heap)\n    ...'); } });
    c.say('<b>' + t(L('Search finished. ', '搜索完成。')) + '</b>' + t(L('Candidate #15 scores 0.9682 on held-out data (baseline 0.44). The gain came from the BWT-based lineage started at #2.', '候选 #15 在留出集上得分 0.9682（基线 0.44）。提升来自 #2 开启的 BWT 谱系。')));
  };

  /* --- Memory graph --- */
  var MG = {
    nodes: [
      { id: 'goal', x: 50, y: 62, c: '#7c3aed', en: 'ResearchGoal', zh: '研究目标', d: L('Compare adult vs paediatric liver immune programmes', '比较成人与儿童肝脏免疫程序') },
      { id: 't1', x: 150, y: 34, c: '#2563eb', en: 'Task: search', zh: '任务：检索', d: L('Search PubMed and bioRxiv', '检索 PubMed 与 bioRxiv') },
      { id: 't2', x: 150, y: 104, c: '#2563eb', en: 'Task: analyse', zh: '任务：分析', d: L('Enrichment analysis', '富集分析') },
      { id: 'c1', x: 250, y: 34, c: '#0f8aa6', en: 'literature.search', zh: 'literature.search', d: L('Tool call #1 · 38 records', '工具调用 #1 · 38 条记录') },
      { id: 'c2', x: 250, y: 104, c: '#0f8aa6', en: 'python.run', zh: 'python.run', d: L('Tool call #3 · sandbox epoch b23a2db4', '工具调用 #3 · 沙箱 epoch b23a2db4') },
      { id: 'code', x: 350, y: 78, c: '#64748b', en: 'enrichment.py', zh: 'enrichment.py', d: L('Code produced by python.run', 'python.run 生成的代码') },
      { id: 'csv', x: 350, y: 138, c: '#22a06b', en: 'pathway_counts.csv', zh: 'pathway_counts.csv', d: L('Artifact · 14 pathways', '产物 · 14 条通路') },
      { id: 'rep', x: 540, y: 150, c: '#22a06b', en: 'report.md', zh: 'report.md', d: L('Final report · 9 claims', '最终报告 · 9 条结论') },
      { id: 'pA', x: 150, y: 226, c: '#0f8aa6', en: 'Hepatology 2024', zh: 'Hepatology 2024', d: L('Paper · Age-dependent immune gene programmes', '论文 · 年龄依赖的免疫基因程序') },
      { id: 'pB', x: 150, y: 272, c: '#0f8aa6', en: 'Nat Commun 2024', zh: 'Nat Commun 2024', d: L('Paper · Single-cell atlas of paediatric liver', '论文 · 儿童肝脏单细胞图谱') },
      { id: 'eA', x: 270, y: 226, c: '#d64545', en: 'Evidence: Table 2', zh: '证据：表 2', d: L('“IFN-γ response genes up 2.1× in adults”', '“成人 IFN-γ 响应基因上调 2.1 倍”') },
      { id: 'eB', x: 270, y: 272, c: '#d64545', en: 'Evidence: Fig 3', zh: '证据：图 3', d: L('“CYP3A4 higher in paediatric hepatocytes”', '“儿童肝细胞 CYP3A4 更高”') },
      { id: 'k1', x: 400, y: 226, c: '#d19a32', en: 'Claim 1', zh: '结论 1', d: L('Interferon signalling is enriched in adults', '成人组织富集干扰素信号') },
      { id: 'k2', x: 400, y: 272, c: '#d19a32', en: 'Claim 2', zh: '结论 2', d: L('CYP450 metabolism is enriched in paediatric samples', '儿童样本富集 CYP450 代谢') }
    ],
    edges: [['goal', 't1', 'next', 'task'], ['goal', 't2', 'next', 'task'], ['t1', 'c1', 'next', 'task'], ['t2', 'c2', 'next', 'task'], ['c2', 'code', 'produces', 'task'], ['c2', 'csv', 'produces', 'task'],
      ['pA', 'eA', 'extracts', 'cite'], ['pB', 'eB', 'extracts', 'cite'], ['eA', 'k1', 'supports', 'cite'], ['eB', 'k2', 'supports', 'cite'], ['csv', 'k1', 'supports', 'cite'], ['k1', 'rep', 'stated_in', 'cite'], ['k2', 'rep', 'stated_in', 'cite'], ['csv', 'rep', 'used_in', 'task']]
  };
  SCEN.memory = async function (c) {
    await c.wait(500);
    c.say(t(L('ScienceMemory recorded this session as two chains: the <b>task chain</b> (what was run) and the <b>citation chain</b> (what each claim rests on). Click any node to trace its lineage.', 'ScienceMemory 把本会话记录成两条链：<b>任务链</b>（做了什么）和<b>引用链</b>（每条结论依据什么）。点击任意节点查看其溯源。')));
    c.tok(900);
    var card = h('div', 'rc'), filter = 'all', selId = 'rep';
    card.innerHTML = '<div class="rc-h"><div><div class="kick">SCIENCEMEMORY</div><h4>' + t(L('Task chain and citation chain', '任务链与引用链')) + '</h4></div></div><div class="chips" style="padding:0 14px 8px;margin:0">' +
      [['all', L('All', '全部')], ['task', L('Task chain', '任务链')], ['cite', L('Citation chain', '引用链')]].map(function (f) { return '<button class="chip' + (f[0] === 'all' ? ' on' : '') + '" data-f="' + f[0] + '">' + t(f[1]) + '</button>'; }).join('') +
      '</div><div class="rc-b"><div class="plot"><svg viewBox="0 0 640 306"></svg></div><div class="side" id="mside"></div></div>';
    c.add(card, 'asst');
    var svg = $('svg', card), side = $('#mside', card), groups = {}, lines = [], map = {};
    sv('defs', {}, svg).innerHTML = '<marker id="marr" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto"><path d="M0 0L10 5L0 10z" style="fill:var(--edge)"/></marker>';
    MG.nodes.forEach(function (n) { map[n.id] = n; });
    MG.edges.forEach(function (e) {
      var a = map[e[0]], b = map[e[1]], dx = b.x - a.x, dy = b.y - a.y, l = Math.sqrt(dx * dx + dy * dy), ux = dx / l, uy = dy / l;
      var ln = sv('line', { x1: a.x + ux * 20, y1: a.y + uy * 20, x2: b.x - ux * 22, y2: b.y - uy * 22, 'class': 'g-edge', 'stroke-width': 1.5, 'marker-end': 'url(#marr)' }, svg);
      var lb = sv('text', { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 - 4, 'text-anchor': 'middle', 'class': 'g-axis' }, svg, e[2]);
      lines.push({ e: e, ln: ln, lb: lb });
    });
    MG.nodes.forEach(function (n) {
      var g = sv('g', { 'class': 'gnode', transform: 'translate(' + n.x + ',' + n.y + ')' }, svg); groups[n.id] = g;
      sv('circle', { r: 18, fill: n.c, stroke: '#fff', 'stroke-width': 2 }, g); sv('text', { 'text-anchor': 'middle', y: 34, 'class': 'g-lbl' }, g, t(n));
      g.addEventListener('click', function () { selId = n.id; paint(); });
    });
    function paint() {
      var up = {}; up[selId] = 1; var ch = true;
      while (ch) { ch = false; MG.edges.forEach(function (e) { if (up[e[1]] && !up[e[0]]) { up[e[0]] = 1; ch = true; } }); }
      function inChain(id) { return filter === 'all' || MG.edges.some(function (e) { return e[3] === filter && (e[0] === id || e[1] === id); }); }
      Object.keys(groups).forEach(function (k) { groups[k].style.opacity = up[k] && inChain(k) ? 1 : .2; groups[k].classList.toggle('sel', k === selId); });
      lines.forEach(function (o) { var on = up[o.e[0]] && up[o.e[1]] && (filter === 'all' || o.e[3] === filter); o.ln.style.opacity = on ? 1 : .15; o.lb.style.opacity = on ? 1 : .15; });
      var n = map[selId], names = MG.nodes.filter(function (x) { return up[x.id] && x.id !== selId; }).map(function (x) { return t(x); });
      side.innerHTML = '<h5>' + t(n) + '</h5><p style="margin:0 0 8px">' + t(n.d) + '</p><h5>' + t(L('Depends on', '依赖于')) + '</h5><p style="margin:0">' + (names.length ? names.join(' → ') : '—') + '</p>';
    }
    $$('.chip', card).forEach(function (b) { b.addEventListener('click', function () { filter = b.dataset.f; $$('.chip', card).forEach(function (x) { x.classList.toggle('on', x === b); }); paint(); }); });
    paint();
    await c.wait(400);
    c.say(t(L('Every claim in <code>report.md</code> resolves to at least one evidence span and the paper it came from.', '<code>report.md</code> 中的每条结论都能追溯到至少一处证据及其来源论文。')));
  };

  /* --- Protein --- */
  var PROT = null;
  SCEN.protein = async function (c) {
    if (!PROT) PROT = V.buildProtein();
    await c.wait(500);
    c.say(t(L('I will load the kinase domain, detect the pocket, list contacts to the inhibitor and render the result in 3D.', '我会加载激酶结构域、检测口袋、列出与抑制剂的接触，并在 3D 中呈现。')));
    c.tok(1500);
    await c.tool({ n: 'structure.load', a: L('kinase domain · chain A (demo model)', '激酶结构域 · A 链（演示模型）'), ms: 1100, tok: 2100, r: '116 residues · 6 helices · 1 ligand (21 heavy atoms)' });
    await c.tool({ n: 'pocket.detect', a: L('probe radius 1.4 Å', '探针半径 1.4 Å'), sandbox: true, ms: 1500, tok: 2600, r: pre('pocket 1  volume 612 Å3  depth 9.8 Å\nlining residues: ' + PROT.pocket.map(function (p) { return p.name; }).join(', ')),
      after: function () {
        c.artifact({ name: 'pocket.pdb', kind: 'pdb', size: '2.8 KB', by: 'pocket.detect #2', inputs: 'kinase_domain.pdb', preview: function () { return pre(V.pdbText(PROT)); } });
        var csv = 'residue,type,distance_A,note\n' + PROT.pocket.map(function (p) { return p.name + ',' + p.type + ',' + p.d.toFixed(1) + ',' + p.note; }).join('\n');
        c.artifact({ name: 'contacts.csv', kind: 'csv', size: '0.3 KB', by: 'pocket.detect #2', inputs: 'pocket.pdb', preview: function () { return csvTable(csv); } });
      } });
    var st = { color: 'rainbow', pocket: 1, contacts: 1, ligand: 1, sel: -1 }, viewer;
    var card = h('div', 'rc');
    card.innerHTML = '<div class="rc-h"><div><div class="kick">' + t(L('MOLECULAR VIEWER', '分子查看器')) + '</div><h4>' + t(L('Kinase domain · ligand pocket (illustrative model)', '激酶结构域 · 配体口袋（演示模型）')) + '</h4></div></div>' +
      '<div class="ctrl" style="display:flex;flex-wrap:wrap;gap:6px;padding:0 14px 10px" id="pctl"></div>' +
      '<div class="rc-b"><div class="plot"><canvas style="display:block;width:100%;height:320px"></canvas></div><div class="side" id="pside"><h5>' + t(L('Pocket residues', '口袋残基')) + '</h5><div id="prows"></div><div class="legend" style="margin-top:8px"><span><i style="background:' + '#8b95a5' + '"></i>C</span><span><i style="background:#3b82f6"></i>N</span><span><i style="background:#ef4444"></i>O</span><span><i style="background:#22c55e"></i>Cl</span></div></div></div>' +
      '<div style="padding:0 14px 12px;color:var(--text-faint);font-size:11.5px">' + t(L('Drag to rotate. Structure is generated locally for illustration, not an experimental model.', '拖动旋转。结构在本地生成，仅作示意，并非实验模型。')) + '</div>';
    c.add(card, 'asst');
    viewer = new V.Viewer($('canvas', card), { yaw: .5, pitch: -.3, zoom: 1.05 });
    function scene() { viewer.setScene(V.proteinScene(PROT, st), [0, 0, 0], 17); }
    function chip(label, key, val, radio) { var b = h('button', 'chip' + ((radio ? st[key] === val : st[key]) ? ' on' : ''), t(label)); b.addEventListener('click', function () { if (radio) st[key] = val; else st[key] = st[key] ? 0 : 1; ctl(); scene(); }); return b; }
    function ctl() {
      var box = $('#pctl', card); box.innerHTML = '';
      [chip(L('Rainbow', '彩虹色'), 'color', 'rainbow', 1), chip(L('Secondary structure', '二级结构'), 'color', 'ss', 1), chip(L('Pocket residues', '口袋残基'), 'pocket'), chip(L('Contacts', '接触'), 'contacts'), chip(L('Ligand', '配体'), 'ligand')].forEach(function (b) { box.appendChild(b); });
      var a = h('button', 'chip' + (viewer.auto ? ' on' : ''), t(L('Auto-rotate', '自动旋转'))); a.addEventListener('click', function () { viewer.auto = !viewer.auto; ctl(); }); box.appendChild(a);
    }
    function rows() {
      var box = $('#prows', card); box.innerHTML = '';
      PROT.pocket.forEach(function (p, i) {
        var r = h('div', 'prow' + (st.sel === i ? ' sel' : ''), '<b style="grid-column:1/3">' + p.name + '</b><span style="grid-column:3;color:var(--text-faint)">' + (p.type === 'hbond' ? 'H-bond ' : 'vdW ') + p.d.toFixed(1) + ' Å</span><span class="nb" style="grid-column:1/5;margin-top:-4px">' + (p.note === 'hinge' ? t(L('hinge region', '铰链区')) : p.note === 'gatekeeper' ? t(L('gatekeeper', '守门残基')) : t(L('hydrophobic pocket', '疏水口袋'))) + '</span>');
        r.addEventListener('click', function () { st.sel = st.sel === i ? -1 : i; viewer.auto = false; rows(); ctl(); scene(); }); box.appendChild(r);
      });
    }
    ctl(); rows(); scene();
    await c.wait(500);
    c.say(t(L('Two hydrogen bonds anchor the inhibitor (2.9 Å to the hinge residue, 3.1 Å to the gatekeeper); the remaining contacts are hydrophobic.', '两个氢键固定抑制剂（与铰链残基 2.9 Å，与守门残基 3.1 Å），其余接触为疏水作用。')));
  };

  /* --- Crystal --- */
  SCEN.crystal = async function (c) {
    await c.wait(500);
    c.say(t(L('I will build the cubic perovskite, evaluate the tolerance factor with Shannon radii and simulate the powder XRD pattern.', '我会构建立方钙钛矿，用 Shannon 半径评估容忍因子，并模拟粉末 XRD 图谱。')));
    c.tok(1400);
    await c.tool({ n: 'materials.lookup', a: 'CsPbI3 · Pm-3m', ms: 1000, tok: 1700, r: 'a = 6.29 Å · Z = 1 · high-temperature α phase' });
    var tf = (1.88 + 2.20) / (Math.SQRT2 * (1.19 + 2.20));
    await c.tool({ n: 'python.run', a: 'pymatgen · tolerance factor', sandbox: true, open: true, ms: 1500, tok: 2500,
      r: pre('rA, rB, rX = 1.88, 1.19, 2.20   # Shannon radii (A)\nt  = (rA + rX) / (sqrt(2) * (rB + rX))\nmu = rB / rX\nprint(round(t, 3), round(mu, 3))\n# -> ' + tf.toFixed(3) + ' 0.541'),
      after: function () { c.artifact({ name: 'CsPbI3.cif', kind: 'cif', size: '0.6 KB', by: 'python.run #2', inputs: 'materials.lookup #1', preview: function () { return pre(V.cifText(2, 6.29)); } }); } });
    var st = { n: 2, a: 6.29, octa: 1, bonds: 1, cell: 1, spacefill: 0, tab: 'struct' }, viewer, card = h('div', 'rc');
    card.innerHTML = '<div class="rc-h"><div><div class="kick">' + t(L('CRYSTAL VIEWER', '晶体查看器')) + '</div><h4>CsPbI₃ · ' + t(L('cubic perovskite, Pm-3m', '立方钙钛矿，Pm-3m')) + '</h4></div></div>' +
      '<div class="rc-tabs"><button class="on" data-t="struct">' + t(L('Structure', '结构')) + '</button><button data-t="xrd">' + t(L('XRD pattern', 'XRD 图谱')) + '</button></div>' +
      '<div class="ctrl" style="display:flex;flex-wrap:wrap;gap:6px;align-items:center;padding:0 14px 10px" id="cctl"></div>' +
      '<div class="rc-b"><div class="plot" id="cview"></div><div class="side" id="cside"></div></div>';
    c.add(card, 'asst');
    var view = $('#cview', card), side = $('#cside', card), cvs = null;
    function info() {
      var a = st.a, V3 = a * a * a;
      side.innerHTML = '<h5>' + t(L('Cell', '晶胞')) + '</h5><div class="dim" style="grid-template-columns:1fr auto"><span>' + t(L('Formula', '化学式')) + '</span><em>CsPbI₃</em></div>' +
        '<div class="dim" style="grid-template-columns:1fr auto"><span>' + t(L('Lattice a', '晶格常数 a')) + '</span><em>' + a.toFixed(2) + ' Å</em></div><div class="dim" style="grid-template-columns:1fr auto"><span>V</span><em>' + V3.toFixed(1) + ' Å³</em></div>' +
        '<div class="dim" style="grid-template-columns:1fr auto"><span>Pb–I</span><em>' + (a / 2).toFixed(2) + ' Å</em></div><div class="dim" style="grid-template-columns:1fr auto"><span>' + t(L('Tolerance t', '容忍因子 t')) + '</span><em>' + tf.toFixed(2) + '</em></div>' +
        '<div class="legend" style="margin-top:8px"><span><i style="background:#14b8c4"></i>Cs</span><span><i style="background:#6b7686"></i>Pb</span><span><i style="background:#a855f7"></i>I</span></div>' +
        '<p style="margin:8px 0 0;color:var(--muted)">' + t(L('t < 0.9: the cubic phase is only expected at high temperature.', 't < 0.9：立方相预计只在高温下稳定。')) + '</p>';
    }
    function rescene() { var r = V.crystalScene(st.n, st.a, st); viewer.setScene(r.scene, [0, 0, 0], r.half * 1.5 + 4); }
    function mount() {
      view.innerHTML = '';
      if (st.tab === 'struct') { cvs = h('canvas'); cvs.style.cssText = 'display:block;width:100%;height:320px'; view.appendChild(cvs); viewer = new V.Viewer(cvs, { yaw: .7, pitch: -.35 }); rescene(); }
      else {
        var svg = sv('svg', { viewBox: '0 0 560 280' }); view.appendChild(svg); var ro = h('div', '', ''); ro.style.cssText = 'padding:0 12px 10px;font-size:12px;color:var(--text-secondary)'; ro.textContent = t(L('Hover the pattern to read 2θ and intensity.', '在图谱上悬停读取 2θ 与强度。')); view.appendChild(ro);
        V.drawXRD(svg, st.a, function (tt, y, pk) { var near = pk.filter(function (p) { return Math.abs(p.t - tt) < 0.6; })[0]; ro.textContent = '2θ = ' + tt.toFixed(2) + '°  ·  I = ' + y.toFixed(0) + (near ? '  ·  ' + near.l : ''); });
      }
    }
    function ctl() {
      var box = $('#cctl', card); box.innerHTML = '';
      if (st.tab === 'struct') {
        [1, 2, 3].forEach(function (n) { var b = h('button', 'chip' + (st.n === n ? ' on' : ''), n + '×' + n + '×' + n); b.addEventListener('click', function () { st.n = n; ctl(); rescene(); }); box.appendChild(b); });
        [['octa', L('Octahedra', '八面体')], ['bonds', L('Bonds', '化学键')], ['cell', L('Cell', '晶胞')], ['spacefill', L('Space-filling', '空间填充')]].forEach(function (o) { var b = h('button', 'chip' + (st[o[0]] ? ' on' : ''), t(o[1])); b.addEventListener('click', function () { st[o[0]] = st[o[0]] ? 0 : 1; ctl(); rescene(); }); box.appendChild(b); });
      }
      var lab = h('label', '', 'a <input type="range" min="6.0" max="6.6" step="0.01" value="' + st.a + '" style="accent-color:var(--accent);vertical-align:middle;width:120px"> <b>' + st.a.toFixed(2) + ' Å</b>'); lab.style.cssText = 'display:flex;align-items:center;gap:8px;font-size:12px;color:var(--text-secondary);margin-left:6px';
      $('input', lab).addEventListener('input', function () { st.a = parseFloat(this.value); $('b', lab).textContent = st.a.toFixed(2) + ' Å'; info(); if (st.tab === 'struct') rescene(); else mount(); });
      box.appendChild(lab);
    }
    $$('.rc-tabs button', card).forEach(function (b) { b.addEventListener('click', function () { st.tab = b.dataset.t; $$('.rc-tabs button', card).forEach(function (x) { x.classList.toggle('on', x === b); }); ctl(); mount(); }); });
    info(); ctl(); mount();
    await c.wait(500);
    c.say(t(L('With t = 0.85 the cubic α phase sits at the edge of stability, which is consistent with its tendency to distort into the non-perovskite δ phase at room temperature. The simulated (100) reflection appears at 2θ ≈ 14.1°.', 't = 0.85 时立方 α 相处于稳定边缘，这与其在室温下畸变为非钙钛矿 δ 相的倾向一致。模拟的 (100) 衍射峰位于 2θ ≈ 14.1°。')));
  };

  /* --- Data --- */
  SCEN.data = async function (c) {
    await c.wait(500);
    c.say(t(L('I will run differential expression on 640 genes, apply Benjamini–Hochberg correction and plot the result.', '我会对 640 个基因做差异表达分析，进行 Benjamini–Hochberg 校正，并绘图。')));
    c.tok(1300);
    var data = V.volcanoData();
    await c.tool({ n: 'python.run', a: 'deseq2.py · adult vs paediatric', sandbox: true, open: true, ms: 1700, tok: 3000,
      r: pre('import pandas as pd\nfrom pydeseq2.dds import DeseqDataSet\n\ndds = DeseqDataSet(counts=counts, metadata=meta, design_factors="age_group")\ndds.deseq2()\nres = DeseqStats(dds, contrast=["age_group", "adult", "paediatric"]).summary()'),
      after: function () {
        var csv = 'gene,log2FC,neg_log10_p\n' + data.slice(0, 30).map(function (d) { return d.g + ',' + d.fc.toFixed(2) + ',' + d.y.toFixed(2); }).join('\n');
        c.artifact({ name: 'degs.csv', kind: 'csv', size: '38 KB', by: 'python.run #1', inputs: 'counts.csv, meta.csv', preview: function () { return csvTable(csv); } });
      } });
    var th = { fc: 1, p: 1.3 }, tab = 'volcano', card = h('div', 'rc');
    card.innerHTML = '<div class="rc-h"><div><div class="kick">' + t(L('DATA VIEWER', '数据查看器')) + '</div><h4>' + t(L('Adult vs paediatric liver · differential expression', '成人 vs 儿童肝脏 · 差异表达')) + '</h4></div></div>' +
      '<div class="rc-tabs"><button class="on" data-t="volcano">' + t(L('Volcano', '火山图')) + '</button><button data-t="heat">' + t(L('Heatmap', '热图')) + '</button></div>' +
      '<div id="dctl" style="display:flex;flex-wrap:wrap;gap:14px;padding:0 14px 10px;font-size:12px;color:var(--text-secondary)"></div><div class="rc-b"><div class="plot" id="dview"></div><div class="side" id="dside"></div></div>';
    c.add(card, 'asst');
    var view = $('#dview', card), side = $('#dside', card), ctl = $('#dctl', card);
    function summary(u, d) { side.innerHTML = '<h5>' + t(L('Significant genes', '显著基因')) + '</h5><div class="dim" style="grid-template-columns:1fr auto"><span style="color:#e0605c">▲ ' + t(L('up in adult', '成人上调')) + '</span><em>' + u + '</em></div><div class="dim" style="grid-template-columns:1fr auto"><span style="color:#3b82f6">▼ ' + t(L('down in adult', '成人下调')) + '</span><em>' + d + '</em></div><div id="dhov" style="margin-top:8px;color:var(--muted)">' + t(L('Hover a point for details.', '悬停数据点查看详情。')) + '</div>'; }
    var vsvg = null;
    function drawV() {
      var r = V.drawVolcano(vsvg, data, th, function (d, hit) { var e = $('#dhov', card); if (e) e.innerHTML = '<b style="color:var(--text-strong)">' + d.g + '</b><br>log₂FC ' + d.fc.toFixed(2) + '<br>−log₁₀ p ' + d.y.toFixed(2) + (hit ? '' : ' · ' + t(L('below threshold', '未达阈值'))); }, function () {});
      summary(r.up, r.down);
    }
    function paint() {
      view.innerHTML = ''; ctl.innerHTML = '';
      if (tab === 'volcano') {
        vsvg = sv('svg', { viewBox: '0 0 560 300' }); view.appendChild(vsvg);
        function slider(label, key, min, max, step) {
          var l = h('label', '', label + ' <input type="range" min="' + min + '" max="' + max + '" step="' + step + '" value="' + th[key] + '" style="accent-color:var(--accent);vertical-align:middle;width:110px"> <b>' + th[key].toFixed(1) + '</b>');
          $('input', l).addEventListener('input', function () { th[key] = parseFloat(this.value); $('b', l).textContent = th[key].toFixed(1); drawV(); }); ctl.appendChild(l);
        }
        slider('|log₂FC| ≥', 'fc', 0, 3, 0.1); slider('−log₁₀ p ≥', 'p', 0, 5, 0.1);
        drawV();
      } else {
        var s2 = sv('svg', { viewBox: '0 0 560 292' }); view.appendChild(s2);
        side.innerHTML = '<h5>' + t(L('Top genes (z-score)', '前列基因（z 分数）')) + '</h5><div id="dhov" style="color:var(--muted)">' + t(L('Hover a cell for the value.', '悬停单元格查看数值。')) + '</div>';
        V.drawHeatmap(s2, function (g, sname, z) { var e = $('#dhov', card); if (e) e.innerHTML = '<b style="color:var(--text-strong)">' + g + '</b> · ' + sname + '<br>z = ' + z.toFixed(2); });
      }
    }
    $$('.rc-tabs button', card).forEach(function (b) { b.addEventListener('click', function () { tab = b.dataset.t; $$('.rc-tabs button', card).forEach(function (x) { x.classList.toggle('on', x === b); }); paint(); }); });
    paint();
    await c.wait(500);
    c.say(t(L('Interferon-response genes (IFNG, STAT1, CXCL10) are up in adults while metabolic genes (ALB, CYP3A4) are down. Drag the sliders to change the thresholds.', '干扰素响应基因（IFNG、STAT1、CXCL10）在成人中上调，代谢基因（ALB、CYP3A4）下调。拖动滑块可调整阈值。')));
  };

  /* ------------------------------------------------------------------ boot */
  select('lit', false);
  var started = false;
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(function (es) { if (es[0].isIntersecting && !started) { started = true; play(); } }, { threshold: .3 }).observe(root);
  } else { play(); }
})();
