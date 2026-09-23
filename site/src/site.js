/* Site behaviour: theme toggle, documentation search, docs scroll-spy and copy buttons. No dependencies. */
(function () {
  'use strict';
  var doc = document.documentElement;
  var lang = doc.lang === 'zh' ? 'zh' : 'en';
  var root = doc.dataset.root || '', prefix = doc.dataset.prefix || '';
  function $(s, r) { return (r || document).querySelector(s); }
  function $$(s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); }
  function esc(s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }

  /* ---------------- theme ---------------- */
  var tt = $('.theme-toggle');
  if (tt) tt.addEventListener('click', function () {
    var next = doc.dataset.theme === 'dark' ? 'light' : 'dark';
    doc.dataset.theme = next;
    try { localStorage.setItem('sd-theme', next); } catch (e) { /* private mode */ }
  });
  try {
    matchMedia('(prefers-color-scheme: dark)').addEventListener('change', function (e) {
      if (!localStorage.getItem('sd-theme')) doc.dataset.theme = e.matches ? 'dark' : 'light';
    });
  } catch (e) { /* older browsers */ }

  /* ---------------- search ---------------- */
  var btn = $('.search-btn');
  if (btn) {
    var index = null, loading = null, overlay = null, input, list, active = 0, results = [];
    var isMac = /Mac|iPhone|iPad/.test(navigator.platform || '');
    var kbd = $('kbd', btn); if (kbd) kbd.textContent = isMac ? '⌘K' : 'Ctrl K';
    function load() {
      if (index) return Promise.resolve(index);
      if (!loading) loading = fetch(root + prefix + 'search-index.json').then(function (r) { return r.json(); }).then(function (j) { index = j; return j; });
      return loading;
    }
    function open() {
      if (overlay) return;
      overlay = document.createElement('div'); overlay.className = 'sx-mask';
      overlay.innerHTML = '<div class="sx" role="dialog" aria-modal="true"><div class="sx-in"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round"><circle cx="11" cy="11" r="6"/><path d="m20 20-4-4"/></svg><input type="text" autocomplete="off" spellcheck="false" placeholder="' + esc(btn.dataset.ph) + '"><kbd>Esc</kbd></div><div class="sx-list"></div><div class="sx-foot">' + esc(btn.dataset.hint) + '</div></div>';
      document.body.appendChild(overlay); document.body.style.overflow = 'hidden';
      input = $('input', overlay); list = $('.sx-list', overlay); input.focus();
      overlay.addEventListener('mousedown', function (e) { if (e.target === overlay) close(); });
      input.addEventListener('input', run);
      input.addEventListener('keydown', function (e) {
        if (e.key === 'ArrowDown') { e.preventDefault(); move(1); } else if (e.key === 'ArrowUp') { e.preventDefault(); move(-1); }
        else if (e.key === 'Enter') { e.preventDefault(); go(active); }
      });
      list.innerHTML = '<div class="sx-msg">' + esc(btn.dataset.loading) + '</div>';
      load().then(function () { if (overlay) run(); });
    }
    function close() { if (!overlay) return; overlay.remove(); overlay = null; document.body.style.overflow = ''; }
    function move(d) {
      if (!results.length) return; active = (active + d + results.length) % results.length;
      $$('.sx-item', list).forEach(function (n, i) { n.classList.toggle('on', i === active); if (i === active) n.scrollIntoView({ block: 'nearest' }); });
    }
    function go(i) { var r = results[i]; if (r) { close(); location.href = root + prefix + r.u; } }
    function terms(q) { return q.toLowerCase().split(/\s+/).filter(Boolean); }
    function score(e, ts) {
      var t = e.t.toLowerCase(), h = e.h.toLowerCase(), x = e.x.toLowerCase(), s = 0;
      for (var i = 0; i < ts.length; i++) {
        var w = ts[i], hit = false;
        if (t.indexOf(w) >= 0) { s += 8; hit = true; }
        if (h.indexOf(w) >= 0) { s += 6; hit = true; if (h === w) s += 4; }
        var p = x.indexOf(w);
        if (p >= 0) { s += 1 + Math.min(4, (x.split(w).length - 1)) * 0.5; hit = true; }
        if (!hit) return 0;
      }
      return s;
    }
    function snippet(x, ts) {
      var lo = x.toLowerCase(), p = -1;
      for (var i = 0; i < ts.length; i++) { p = lo.indexOf(ts[i]); if (p >= 0) break; }
      var from = Math.max(0, (p < 0 ? 0 : p) - 40), out = (from ? '…' : '') + x.slice(from, from + 140) + (x.length > from + 140 ? '…' : '');
      out = esc(out);
      ts.forEach(function (w) { if (w) out = out.replace(new RegExp(esc(w).replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'ig'), function (m) { return '<mark>' + m + '</mark>'; }); });
      return out;
    }
    function run() {
      var q = input.value.trim(); active = 0;
      if (!q) { results = []; list.innerHTML = ''; return; }
      var ts = terms(q), seen = {}, out = [];
      index.forEach(function (e) { var s = score(e, ts); if (s > 0) out.push({ e: e, s: s }); });
      out.sort(function (a, b) { return b.s - a.s; });
      results = []; out.forEach(function (o) { if (!seen[o.e.u] && results.length < 30) { seen[o.e.u] = 1; results.push({ u: o.e.u, e: o.e }); } });
      if (!results.length) { list.innerHTML = '<div class="sx-msg">' + esc(btn.dataset.empty) + ' “' + esc(q) + '”</div>'; return; }
      list.innerHTML = results.map(function (r, i) {
        return '<a class="sx-item' + (i === 0 ? ' on' : '') + '" href="' + root + prefix + r.u + '" data-i="' + i + '"><div class="sx-t"><b>' + esc(r.e.t) + '</b>' + (r.e.h ? '<span>› ' + esc(r.e.h) + '</span>' : '') + '</div><div class="sx-s">' + snippet(r.e.x, ts) + '</div></a>';
      }).join('');
      $$('.sx-item', list).forEach(function (a) {
        a.addEventListener('mousemove', function () { active = +a.dataset.i; $$('.sx-item', list).forEach(function (n, i) { n.classList.toggle('on', i === active); }); });
        a.addEventListener('click', function (e) { e.preventDefault(); go(+a.dataset.i); });
      });
    }
    btn.addEventListener('click', open); btn.addEventListener('mouseenter', load, { once: true });
    document.addEventListener('keydown', function (e) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); overlay ? close() : open(); }
      else if (e.key === 'Escape') close();
      else if (e.key === '/' && !overlay && !/input|textarea|select/i.test((e.target.tagName || ''))) { e.preventDefault(); open(); }
    });
  }

  /* ---------------- docs ---------------- */
  var toc = $('.toc');
  if (toc && $$('a', toc).length) {
    var links = $$('a', toc), heads = links.map(function (a) { return document.getElementById(decodeURIComponent(a.getAttribute('href').slice(1))); });
    var spy = function () {
      var cur = 0;
      heads.forEach(function (h, i) { if (h && h.getBoundingClientRect().top < 110) cur = i; });
      links.forEach(function (a, i) { a.classList.toggle('active', i === cur); });
    };
    window.addEventListener('scroll', spy, { passive: true }); spy();
  }
  function copy(text, b) {
    var done = lang === 'zh' ? '已复制' : 'Copied', orig = b.textContent;
    (navigator.clipboard ? navigator.clipboard.writeText(text) : Promise.reject()).then(function () { b.textContent = done; setTimeout(function () { b.textContent = orig; }, 1400); }, function () {});
  }
  $$('.article pre, .install-route pre, .quick-command pre, .steps pre').forEach(function (pre) {
    var code = $('code', pre); if (!code) return;
    pre.style.position = 'relative';
    var b = document.createElement('button'); b.type = 'button'; b.textContent = lang === 'zh' ? '复制' : 'Copy';
    b.style.cssText = 'position:absolute;top:8px;right:8px;padding:2px 9px;border:1px solid #334155;border-radius:6px;background:#1e293b;color:#cbd5e1;font-size:12px;cursor:pointer;opacity:0;transition:opacity .15s';
    pre.appendChild(b);
    if (matchMedia('(max-width: 720px)').matches) b.style.opacity = 1;
    pre.addEventListener('mouseenter', function () { b.style.opacity = 1; }); pre.addEventListener('mouseleave', function () { b.style.opacity = 0; });
    b.addEventListener('click', function () { copy(code.innerText, b); });
  });
  var mt = $('.menu-toggle');
  if (mt) mt.addEventListener('click', function () { $('.docs-nav').classList.toggle('open'); });

  /* ---------------- download ---------------- */
  var dl = $('#downloads');
  if (dl) {
    var ua = navigator.userAgent, plat = (navigator.userAgentData && navigator.userAgentData.platform) || navigator.platform || '';
    var os = /win/i.test(plat + ua) && !/darwin/i.test(plat + ua) ? 'windows' : /mac|iphone|ipad/i.test(plat + ua) ? 'macos' : 'linux';
    var card = $('[data-os="' + os + '"]', dl), tag = $('#recommend-tag');
    if (card) { card.classList.add('recommended'); if (tag) { $('h3', card).appendChild(tag); tag.classList.remove('hidden'); } }
    $$('[data-copy]', dl).forEach(function (b) { b.addEventListener('click', function () { copy(b.dataset.copy, b); }); });
  }

})();
