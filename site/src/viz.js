/* Scientific visualisation for the home-page demo: a tiny software 3D renderer (canvas 2D) with protein and
   crystal builders, plus SVG plots (volcano, heatmap, XRD). Dependency-free; all data is generated locally
   and illustrative. Exposed as window.SDViz. */
(function () {
  'use strict';
  var NS = 'http://www.w3.org/2000/svg';
  var TAU = Math.PI * 2;

  function rng(seed) { // mulberry32
    var a = seed >>> 0;
    return function () {
      a = (a + 0x6D2B79F5) >>> 0;
      var t = a;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  function gauss(r) { var u = 1 - r(), v = r(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(TAU * v); }
  function css(name) { return getComputedStyle(document.documentElement).getPropertyValue(name).trim(); }
  function hsl(h, s, l) { return 'hsl(' + h + ',' + s + '%,' + l + '%)'; }
  function sub(a, b) { return [a[0] - b[0], a[1] - b[1], a[2] - b[2]]; }
  function add(a, b) { return [a[0] + b[0], a[1] + b[1], a[2] + b[2]]; }
  function mul(a, k) { return [a[0] * k, a[1] * k, a[2] * k]; }
  function len(a) { return Math.sqrt(a[0] * a[0] + a[1] * a[1] + a[2] * a[2]); }
  function norm(a) { var l = len(a) || 1; return [a[0] / l, a[1] / l, a[2] / l]; }
  function dist(a, b) { return len(sub(a, b)); }
  function lerp(a, b, t) { return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t]; }

  /* ------------------------------------------------------------------ 3D viewer */
  function Viewer(canvas, opts) {
    opts = opts || {};
    this.cv = canvas; this.ctx = canvas.getContext('2d');
    this.yaw = opts.yaw != null ? opts.yaw : 0.6; this.pitch = opts.pitch != null ? opts.pitch : -0.35;
    this.zoom = opts.zoom || 1; this.auto = opts.auto !== false; this.scene = { atoms: [], bonds: [], ribbons: [], polys: [], lines: [], labels: [] };
    this.dirty = true; this.visible = true; this.center = [0, 0, 0]; this.size = 10;
    var me = this, drag = null;
    canvas.style.touchAction = 'none'; canvas.style.cursor = 'grab';
    canvas.addEventListener('pointerdown', function (e) { drag = { x: e.clientX, y: e.clientY }; canvas.setPointerCapture(e.pointerId); canvas.style.cursor = 'grabbing'; me.userTouched = true; });
    canvas.addEventListener('pointermove', function (e) {
      if (!drag) return;
      me.yaw += (e.clientX - drag.x) * 0.01; me.pitch = Math.max(-1.5, Math.min(1.5, me.pitch + (e.clientY - drag.y) * 0.01));
      drag.x = e.clientX; drag.y = e.clientY; me.dirty = true;
    });
    function end() { drag = null; canvas.style.cursor = 'grab'; }
    canvas.addEventListener('pointerup', end); canvas.addEventListener('pointercancel', end);
    if ('IntersectionObserver' in window) new IntersectionObserver(function (es) { me.visible = es[0].isIntersecting; }).observe(canvas);
    if ('ResizeObserver' in window) new ResizeObserver(function () { me.dirty = true; }).observe(canvas);
    new MutationObserver(function () { me.dirty = true; }).observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
    (function tick() {
      if (!canvas.isConnected) return;
      if (me.visible && (me.auto || me.dirty)) { if (me.auto && !drag) me.yaw += 0.006; me.render(); me.dirty = false; }
      requestAnimationFrame(tick);
    })();
  }
  Viewer.prototype.setScene = function (scene, center, size) {
    this.scene = scene; this.center = center || [0, 0, 0]; this.size = size || 10; this.dirty = true;
  };
  Viewer.prototype.render = function () {
    var cv = this.cv, ctx = this.ctx, dpr = window.devicePixelRatio || 1;
    var W = cv.clientWidth, H = cv.clientHeight;
    if (!W || !H) return;
    if (cv.width !== Math.round(W * dpr) || cv.height !== Math.round(H * dpr)) { cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr); }
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    var bg = css('--surface-subtle') || '#f8fafc', halo = css('--node-halo') || '#f8fafc', fg = css('--text-secondary') || '#475467';
    ctx.globalAlpha = 1; ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H);
    var cy = Math.cos(this.yaw), sy = Math.sin(this.yaw), cp = Math.cos(this.pitch), sp = Math.sin(this.pitch);
    var c = this.center, scale = Math.min(W, H) / (this.size * 2.3) * this.zoom, D = this.size * 5;
    function P(p) { // rotate about scene centre, then project
      var x = p[0] - c[0], y = p[1] - c[1], z = p[2] - c[2];
      var x1 = cy * x + sy * z, z1 = -sy * x + cy * z;
      var y2 = cp * y - sp * z1, z2 = sp * y + cp * z1;
      var k = D / (D - z2);
      return { x: W / 2 + x1 * scale * k, y: H / 2 - y2 * scale * k, z: z2, k: k * scale };
    }
    var sc = this.scene, items = [], zmin = 1e9, zmax = -1e9, i, it;
    function push(z, fn) { if (z < zmin) zmin = z; if (z > zmax) zmax = z; items.push({ z: z, fn: fn }); }
    var pcache = [];
    for (i = 0; i < sc.atoms.length; i++) { var a = sc.atoms[i]; a._p = P(a.p); (function (a) { push(a._p.z, function (al) { drawAtom(a, al); }); })(a); }
    for (i = 0; i < sc.bonds.length; i++) {
      var b = sc.bonds[i], pa = P(b.a), pb = P(b.b);
      (function (b, pa, pb) { push((pa.z + pb.z) / 2 - 0.01, function (al) { drawBond(b, pa, pb, al); }); })(b, pa, pb);
    }
    for (i = 0; i < sc.ribbons.length; i++) {
      var r = sc.ribbons[i], pts = r.pts, prev = P(pts[0].p);
      for (var j = 1; j < pts.length; j++) {
        var cur = P(pts[j].p);
        (function (p0, p1, pt) { push((p0.z + p1.z) / 2, function (al) { drawSeg(p0, p1, pt, al); }); })(prev, cur, pts[j]);
        prev = cur;
      }
    }
    for (i = 0; i < sc.polys.length; i++) {
      var pg = sc.polys[i], pp = pg.pts.map(P), zz = 0; pp.forEach(function (q) { zz += q.z; });
      (function (pg, pp) { push(zz / pp.length, function () { drawPoly(pg, pp); }); })(pg, pp);
    }
    for (i = 0; i < sc.lines.length; i++) {
      var l = sc.lines[i], la = P(l.a), lb = P(l.b);
      (function (l, la, lb) { push((la.z + lb.z) / 2 + 0.02, function () { drawLine(l, la, lb); }); })(l, la, lb);
    }
    items.sort(function (x, y) { return x.z - y.z; });
    var span = (zmax - zmin) || 1;
    for (i = 0; i < items.length; i++) { it = items[i]; it.fn(0.5 + 0.5 * ((it.z - zmin) / span)); }
    ctx.globalAlpha = 1;
    // labels last so they stay readable
    ctx.font = '600 11px ui-sans-serif, system-ui, sans-serif'; ctx.textBaseline = 'middle'; ctx.textAlign = 'center';
    for (i = 0; i < sc.labels.length; i++) {
      var lab = sc.labels[i], q = P(lab.p);
      ctx.lineWidth = 4; ctx.strokeStyle = halo; ctx.strokeText(lab.t, q.x, q.y); ctx.fillStyle = lab.c || fg; ctx.fillText(lab.t, q.x, q.y);
    }

    function drawAtom(a, al) {
      var p = a._p, r = Math.max(1.5, a.r * p.k);
      ctx.globalAlpha = a.alpha != null ? a.alpha : Math.min(1, al + 0.15);
      if (r > 5) {
        var g = ctx.createRadialGradient(p.x - r * 0.35, p.y - r * 0.35, r * 0.1, p.x, p.y, r);
        g.addColorStop(0, shade(a.c, 0.35)); g.addColorStop(0.55, a.c); g.addColorStop(1, shade(a.c, -0.35));
        ctx.fillStyle = g;
      } else ctx.fillStyle = a.c;
      ctx.beginPath(); ctx.arc(p.x, p.y, r, 0, TAU); ctx.fill();
      if (a.ring) { ctx.lineWidth = 2; ctx.strokeStyle = a.ring; ctx.beginPath(); ctx.arc(p.x, p.y, r + 2.5, 0, TAU); ctx.stroke(); }
    }
    function drawBond(b, pa, pb, al) {
      var w = Math.max(1, b.w * (pa.k + pb.k) / 2);
      ctx.globalAlpha = Math.min(1, al + 0.2); ctx.lineCap = 'round'; ctx.lineWidth = w;
      var mx = (pa.x + pb.x) / 2, my = (pa.y + pb.y) / 2;
      ctx.strokeStyle = b.c1; ctx.beginPath(); ctx.moveTo(pa.x, pa.y); ctx.lineTo(mx, my); ctx.stroke();
      ctx.strokeStyle = b.c2 || b.c1; ctx.beginPath(); ctx.moveTo(mx, my); ctx.lineTo(pb.x, pb.y); ctx.stroke();
    }
    function drawSeg(p0, p1, pt, al) {
      var w = Math.max(1, pt.w * (p0.k + p1.k) / 2);
      ctx.globalAlpha = Math.min(1, al + 0.2); ctx.lineCap = 'round';
      ctx.strokeStyle = 'rgba(0,0,0,.28)'; ctx.lineWidth = w + 1.6; ctx.beginPath(); ctx.moveTo(p0.x, p0.y); ctx.lineTo(p1.x, p1.y); ctx.stroke();
      ctx.strokeStyle = pt.c; ctx.lineWidth = w; ctx.beginPath(); ctx.moveTo(p0.x, p0.y); ctx.lineTo(p1.x, p1.y); ctx.stroke();
    }
    function drawPoly(pg, pp) {
      ctx.globalAlpha = pg.a; ctx.fillStyle = pg.c; ctx.beginPath(); ctx.moveTo(pp[0].x, pp[0].y);
      for (var k = 1; k < pp.length; k++) ctx.lineTo(pp[k].x, pp[k].y);
      ctx.closePath(); ctx.fill(); ctx.globalAlpha = Math.min(1, pg.a * 2.2); ctx.lineWidth = 0.8; ctx.strokeStyle = pg.c; ctx.stroke();
    }
    function drawLine(l, la, lb) {
      ctx.globalAlpha = l.alpha != null ? l.alpha : 0.9; ctx.strokeStyle = l.c; ctx.lineWidth = l.w || 1.2; ctx.lineCap = 'butt';
      if (l.dash) ctx.setLineDash(l.dash);
      ctx.beginPath(); ctx.moveTo(la.x, la.y); ctx.lineTo(lb.x, lb.y); ctx.stroke(); ctx.setLineDash([]);
    }
  };
  function shade(hex, amt) { // hex or hsl() -> lighter/darker
    var m = /^#([0-9a-f]{6})$/i.exec(hex);
    if (!m) return hex;
    var n = parseInt(m[1], 16), r = n >> 16, g = (n >> 8) & 255, b = n & 255, t = amt < 0 ? 0 : 255, p = Math.abs(amt);
    r = Math.round((t - r) * p + r); g = Math.round((t - g) * p + g); b = Math.round((t - b) * p + b);
    return 'rgb(' + r + ',' + g + ',' + b + ')';
  }

  /* ------------------------------------------------------------------ protein (illustrative helical bundle + ligand) */
  var EL = { C: '#8b95a5', N: '#3b82f6', O: '#ef4444', Cl: '#22c55e', S: '#eab308' };
  var RESNAMES = ['LEU 718', 'VAL 726', 'ALA 743', 'LYS 745', 'MET 793', 'THR 790', 'CYS 797', 'LEU 844', 'ASP 855', 'GLY 796'];

  function buildProtein() {
    var r = rng(11), K = 6, R = 10.5, n = 15, rad = 2.3, res = [], i, j;
    var helices = [];
    for (i = 0; i < K; i++) {
      var ang = i * TAU / K + 0.3, dir = i % 2 ? -1 : 1;
      var u = [Math.cos(ang), Math.sin(ang), 0], v = [-Math.sin(ang), Math.cos(ang), 0];
      var pts = [], ph = r() * TAU;
      for (j = 0; j < n; j++) {
        var th = ph + j * (100 * Math.PI / 180), z = dir * (j - (n - 1) / 2) * 1.5;
        var c = [R * u[0], R * u[1], z];
        pts.push({ p: add(c, add(mul(u, rad * Math.cos(th)), mul(v, rad * Math.sin(th)))), th: th, u: u, ss: 'H', axis: c });
      }
      helices.push(pts);
    }
    function loop(from, to, up) { // short loop bulging away from the axis
      var mid = lerp(from, to, 0.5), out = norm([mid[0], mid[1], 0]);
      var ctrl = add(mid, add(mul(out, 6), [0, 0, up * 5]));
      var out2 = [];
      for (var t = 1; t <= 4; t++) { var s = t / 5, a = lerp(from, ctrl, s), b = lerp(ctrl, to, s); out2.push({ p: lerp(a, b, s), ss: 'L' }); }
      return out2;
    }
    var chain = [];
    // N-terminal tail
    var h0 = helices[0][0].p;
    for (j = 3; j >= 1; j--) chain.push({ p: add(h0, [j * 1.6 + r(), -j * 1.2 + r(), -j * 1.4]), ss: 'L' });
    for (i = 0; i < K; i++) {
      helices[i].forEach(function (q) { chain.push(q); });
      if (i < K - 1) {
        var last = helices[i][n - 1].p, first = helices[i + 1][0].p;
        loop(last, first, i % 2 ? -1 : 1).forEach(function (q) { chain.push(q); });
      }
    }
    var hl = helices[K - 1][n - 1].p;
    for (j = 1; j <= 3; j++) chain.push({ p: add(hl, [j * 1.4, j * 0.8, j * 1.6 * (K % 2 ? 1 : -1)]), ss: 'L' });
    chain.forEach(function (q, idx) { q.idx = idx; q.t = idx / (chain.length - 1); });

    // smooth (Catmull-Rom) backbone for the ribbon
    var back = [], sub_ = 4;
    for (i = 0; i < chain.length - 1; i++) {
      var p0 = chain[Math.max(0, i - 1)].p, p1 = chain[i].p, p2 = chain[i + 1].p, p3 = chain[Math.min(chain.length - 1, i + 2)].p;
      for (var s = 0; s < sub_; s++) {
        var t = s / sub_, t2 = t * t, t3 = t2 * t, pt = [0, 0, 0];
        for (var d = 0; d < 3; d++) pt[d] = 0.5 * ((2 * p1[d]) + (-p0[d] + p2[d]) * t + (2 * p0[d] - 5 * p1[d] + 4 * p2[d] - p3[d]) * t2 + (-p0[d] + 3 * p1[d] - 3 * p2[d] + p3[d]) * t3);
        var near = t < 0.5 ? chain[i] : chain[i + 1];
        back.push({ p: pt, ss: near.ss, t: chain[i].t + (chain[i + 1].t - chain[i].t) * t });
      }
    }
    back.push({ p: chain[chain.length - 1].p, ss: chain[chain.length - 1].ss, t: 1 });

    // ligand: fused bicyclic core + anilino group + alkoxy tail (illustrative, EGFR-inhibitor-like)
    var atoms = [], bonds = [];
    function hex(cx, cy, a0) { var o = []; for (var k = 0; k < 6; k++) { var a = a0 + k * Math.PI / 3; o.push([cx + 1.4 * Math.cos(a), cy + 1.4 * Math.sin(a), 0]); } return o; }
    var ring1 = hex(-1.21, 0, Math.PI / 6), ring2 = hex(1.21, 0, Math.PI / 6 + Math.PI);
    function at(el, p) { atoms.push({ el: el, p: p }); return atoms.length - 1; }
    // ring1 (benzo): vertices 0..5 at 30,90,150,210,270,330 degrees around (-1.21,0)
    var i1 = ring1.map(function (p) { return at('C', p); });
    // ring2 (pyrimidine): vertices at 210.. around (1.21,0); share two atoms with ring1 -> skip duplicates
    var seen = {};
    ring1.forEach(function (p) { seen[Math.round(p[0] * 10) + ',' + Math.round(p[1] * 10)] = true; });
    var i2 = [];
    ring2.forEach(function (p, k) {
      var key = Math.round(p[0] * 10) + ',' + Math.round(p[1] * 10);
      if (seen[key]) return;
      i2.push(at(k === 3 || k === 5 ? 'N' : 'C', p));
    });
    var oPos = [-1.21 - 2.8, 0, 0.2], o = at('O', oPos);
    var e1 = at('C', [oPos[0] - 0.9, 1.2, 0.5]), e2 = at('C', [oPos[0] - 2.3, 1.0, 0.7]);
    var top = ring2.filter(function (p, k) { return Math.abs(p[1] - 1.212) < 0.05 || true; }).reduce(function (a, p) { return p[1] > a[1] ? p : a; }, [0, -9, 0]);
    var nAm = at('N', add(top, [0.3, 1.35, 0.3]));
    var d = norm([0.55, 0.85, 0.25]), ip = add(atoms[nAm].p, mul(d, 1.4)), ring3c = add(ip, mul(d, 1.4)), a0 = Math.atan2(d[1], d[0]) + Math.PI;
    var ring3 = [];
    for (var k = 0; k < 6; k++) { var aa = a0 + k * Math.PI / 3; ring3.push(at('C', [ring3c[0] + 1.4 * Math.cos(aa), ring3c[1] + 1.4 * Math.sin(aa), ring3c[2] + 0.35 * Math.sin(k)])); }
    var clDir = norm(sub(atoms[ring3[2]].p, ring3c)), cl = at('Cl', add(atoms[ring3[2]].p, mul(clDir, 1.75)));
    // centre the ligand
    var cen = [0, 0, 0]; atoms.forEach(function (a) { cen = add(cen, a.p); }); cen = mul(cen, 1 / atoms.length);
    atoms.forEach(function (a) { a.p = sub(a.p, cen); });
    for (i = 0; i < atoms.length; i++) for (j = i + 1; j < atoms.length; j++) if (dist(atoms[i].p, atoms[j].p) < 1.72) bonds.push([i, j]);

    // pocket residues: helix residues whose side chain points to the cavity
    var pocket = [];
    helices.forEach(function (h, hi) {
      var best = null;
      h.forEach(function (q, jj) {
        var inward = -Math.cos(q.th);
        var score = inward - Math.abs(q.p[2]) * 0.05;
        if (jj > 2 && jj < n - 3 && (!best || score > best.score)) best = { q: q, score: score, jj: jj };
      });
      pocket.push({ q: best.q, hi: hi, idx: chain.indexOf(best.q) });
    });
    // two ligand atoms form hydrogen bonds; other residues make hydrophobic contacts
    var nHinge = i2.filter(function (id) { return atoms[id].el === 'N'; })[0];
    var contacts = [{ atom: nHinge, type: 'hbond', d: 2.9, note: 'hinge' }, { atom: nAm, type: 'hbond', d: 3.1, note: 'gatekeeper' }];
    pocket.forEach(function (pk, k) {
      pk.name = RESNAMES[(k * 3 + 4) % RESNAMES.length]; if (k < 2) pk.name = ['MET 793', 'THR 790'][k];
      var inward = norm([-pk.q.u[0], -pk.q.u[1], 0]);
      if (k < 2) {
        var la = atoms[contacts[k].atom].p, out = norm(la);
        pk.tip = add(la, mul(out, contacts[k].d)); pk.type = 'hbond'; pk.d = contacts[k].d; pk.note = contacts[k].note; pk.atom = contacts[k].atom;
      } else {
        pk.tip = add(pk.q.p, add(mul(inward, 4.3), [0, 0, (k % 2 ? 1 : -1) * 0.8]));
        pk.type = 'vdw'; pk.d = [3.6, 3.9, 4.1, 3.7][(k - 2) % 4]; pk.note = 'hydrophobic';
      }
    });
    return { back: back, chain: chain, atoms: atoms, bonds: bonds, pocket: pocket, ligandCenterShift: cen };
  }

  function proteinScene(model, st) {
    var sc = { atoms: [], bonds: [], ribbons: [], polys: [], lines: [], labels: [] }, i;
    var pts = model.back.map(function (q) {
      var col = st.color === 'rainbow' ? hsl(Math.round(240 - q.t * 240), 78, 52) : (q.ss === 'H' ? '#e0605c' : '#9aa5b5');
      return { p: q.p, c: col, w: q.ss === 'H' ? 0.8 : 0.32 };
    });
    sc.ribbons.push({ pts: pts });
    if (st.ligand) {
      model.atoms.forEach(function (a) { sc.atoms.push({ p: a.p, r: a.el === 'Cl' ? 0.9 : 0.62, c: EL[a.el] }); });
      model.bonds.forEach(function (b) { var A = model.atoms[b[0]], B = model.atoms[b[1]]; sc.bonds.push({ a: A.p, b: B.p, w: 0.28, c1: EL[A.el], c2: EL[B.el] }); });
    }
    if (st.pocket) model.pocket.forEach(function (pk, k) {
      var sel = st.sel === k, base = pk.q.p, mid = lerp(base, pk.tip, 0.5);
      var wob = add(mid, [0.6 * Math.sin(k), 0.6 * Math.cos(k), 0.5]);
      var col = sel ? '#f59e0b' : '#b45cf0';
      sc.bonds.push({ a: base, b: wob, w: sel ? 0.34 : 0.24, c1: col });
      sc.bonds.push({ a: wob, b: pk.tip, w: sel ? 0.34 : 0.24, c1: col, c2: pk.type === 'hbond' ? EL.N : col });
      sc.atoms.push({ p: pk.tip, r: sel ? 0.55 : 0.4, c: col });
      sc.labels.push({ p: add(pk.q.p, [0, 1.6, 0]), t: pk.name, c: sel ? '#b45309' : null });
    });
    if (st.ligand && st.contacts) model.pocket.forEach(function (pk) {
      if (pk.type !== 'hbond') return;
      var la = model.atoms[pk.atom].p; sc.lines.push({ a: la, b: pk.tip, c: '#eab308', dash: [4, 3], w: 1.6 });
      sc.labels.push({ p: lerp(la, pk.tip, 0.5), t: pk.d.toFixed(1) + ' Å', c: '#a16207' });
    });
    return sc;
  }

  function pdbText(model) {
    var out = ['REMARK   Illustrative pocket model generated for the demo (not an experimental structure)'], n = 1;
    function f(v, w, d) { return (v >= 0 ? ' ' : '') && v.toFixed(d).padStart(w); }
    model.pocket.forEach(function (pk, k) {
      var nm = pk.name.split(' ');
      out.push('ATOM  ' + String(n++).padStart(5) + '  CA  ' + nm[0].padEnd(3) + ' A' + nm[1].padStart(4) + '    ' + f(pk.q.p[0], 8, 3) + f(pk.q.p[1], 8, 3) + f(pk.q.p[2], 8, 3) + '  1.00 20.00           C');
    });
    model.atoms.forEach(function (a, i) {
      out.push('HETATM' + String(n++).padStart(5) + ' ' + (a.el + (i + 1)).padEnd(4) + ' LIG B   1    ' + f(a.p[0], 8, 3) + f(a.p[1], 8, 3) + f(a.p[2], 8, 3) + '  1.00 20.00' + a.el.padStart(12));
    });
    out.push('END');
    return out.join('\n');
  }

  /* ------------------------------------------------------------------ crystal (cubic ABX3 perovskite, CsPbI3) */
  var CRY = { Cs: '#14b8c4', Pb: '#6b7686', I: '#a855f7' };
  function buildCrystal(n, a) {
    var atoms = [], key = {}, i, j, k;
    function put(el, x, y, z) {
      var id = el + x.toFixed(2) + ',' + y.toFixed(2) + ',' + z.toFixed(2);
      if (key[id]) return; key[id] = 1; atoms.push({ el: el, p: [x * a, y * a, z * a], f: [x, y, z] });
    }
    for (i = 0; i <= n; i++) for (j = 0; j <= n; j++) for (k = 0; k <= n; k++) put('Cs', i, j, k);
    for (i = 0; i < n; i++) for (j = 0; j < n; j++) for (k = 0; k < n; k++) {
      put('Pb', i + .5, j + .5, k + .5);
      put('I', i + .5, j + .5, k); put('I', i + .5, j + .5, k + 1);
      put('I', i + .5, j, k + .5); put('I', i + .5, j + 1, k + .5);
      put('I', i, j + .5, k + .5); put('I', i + 1, j + .5, k + .5);
    }
    return atoms;
  }
  function crystalScene(n, a, st) {
    var atoms = buildCrystal(n, a), sc = { atoms: [], bonds: [], ribbons: [], polys: [], lines: [], labels: [] };
    var half = n * a / 2, shift = [half, half, half], R = { Cs: 1.9, Pb: 1.2, I: 1.35 }, pbs = [], is = [];
    atoms.forEach(function (at) {
      var p = sub(at.p, shift);
      sc.atoms.push({ p: p, r: R[at.el] * (st.spacefill ? 1 : 0.55), c: CRY[at.el] });
      if (at.el === 'Pb') pbs.push(p); else if (at.el === 'I') is.push(p);
    });
    var half2 = a / 2 * 1.05;
    pbs.forEach(function (pb) {
      var nb = is.filter(function (q) { return dist(pb, q) < half2; });
      if (st.bonds) nb.forEach(function (q) { sc.bonds.push({ a: pb, b: q, w: 0.22, c1: CRY.Pb, c2: CRY.I }); });
      if (st.octa && nb.length === 6) {
        for (var i = 0; i < 6; i++) for (var j = i + 1; j < 6; j++) for (var k = j + 1; k < 6; k++) {
          var A = sub(nb[i], pb), B = sub(nb[j], pb), C = sub(nb[k], pb);
          // a face joins three mutually adjacent (orthogonal) vertices
          if (Math.abs(A[0] * B[0] + A[1] * B[1] + A[2] * B[2]) < 1e-3 && Math.abs(A[0] * C[0] + A[1] * C[1] + A[2] * C[2]) < 1e-3 && Math.abs(B[0] * C[0] + B[1] * C[1] + B[2] * C[2]) < 1e-3)
            sc.polys.push({ pts: [nb[i], nb[j], nb[k]], c: '#a855f7', a: 0.13 });
        }
      }
    });
    if (st.cell) {
      var s = n * a / 2, c = [[-s, -s, -s], [s, -s, -s], [s, s, -s], [-s, s, -s], [-s, -s, s], [s, -s, s], [s, s, s], [-s, s, s]];
      [[0, 1], [1, 2], [2, 3], [3, 0], [4, 5], [5, 6], [6, 7], [7, 4], [0, 4], [1, 5], [2, 6], [3, 7]].forEach(function (e) { sc.lines.push({ a: c[e[0]], b: c[e[1]], c: '#3b82f6', w: 1.3, alpha: 0.85 }); });
    }
    return { scene: sc, half: half };
  }
  function cifText(n, a) {
    return ['data_CsPbI3_cubic', '_symmetry_space_group_name_H-M   \'P m -3 m\'', '_cell_length_a    ' + a.toFixed(3), '_cell_length_b    ' + a.toFixed(3), '_cell_length_c    ' + a.toFixed(3),
      '_cell_angle_alpha 90', '_cell_angle_beta  90', '_cell_angle_gamma 90', 'loop_', ' _atom_site_label', ' _atom_site_type_symbol', ' _atom_site_fract_x', ' _atom_site_fract_y', ' _atom_site_fract_z',
      ' Cs1 Cs 0.0 0.0 0.0', ' Pb1 Pb 0.5 0.5 0.5', ' I1  I  0.5 0.5 0.0', ' I2  I  0.5 0.0 0.5', ' I3  I  0.0 0.5 0.5'].join('\n');
  }

  /* ------------------------------------------------------------------ SVG plots */
  function el(tag, attrs, parent, text) {
    var n = document.createElementNS(NS, tag);
    for (var k in attrs) n.setAttribute(k, attrs[k]);
    if (text != null) n.textContent = text;
    if (parent) parent.appendChild(n);
    return n;
  }
  var GENES = ['IFNG', 'STAT1', 'CXCL10', 'IRF1', 'GBP1', 'HLA-DRA', 'CD74', 'ALB', 'CYP3A4', 'SERPINA1', 'APOA1', 'TTR', 'FGB', 'HP', 'MT1G', 'CCL5', 'PTPRC', 'CD8A', 'LYZ', 'C3'];

  function volcanoData() {
    var r = rng(42), d = [], i;
    for (i = 0; i < 640; i++) {
      var fc = gauss(r) * 0.9, sig = Math.abs(fc) * (1.1 + r() * 1.1) + r() * 0.9;
      d.push({ g: i < GENES.length ? GENES[i] : 'G' + (1000 + i), fc: fc + (i < 10 ? 1.6 + r() : (i < GENES.length ? -1.5 - r() : 0)), y: (i < GENES.length ? 3 + r() * 5 : sig) });
    }
    return d;
  }
  function drawVolcano(svg, data, th, onHover, onPick) {
    while (svg.firstChild) svg.removeChild(svg.firstChild);
    var W = 560, H = 300, L = 44, B = 34, T = 12, Rr = 14, xs = 4.5, ymax = 9;
    function X(v) { return L + (v + xs) / (2 * xs) * (W - L - Rr); }
    function Y(v) { return H - B - v / ymax * (H - B - T); }
    var g;
    [0, 2, 4, 6, 8].forEach(function (v) { el('line', { x1: L, x2: W - Rr, y1: Y(v), y2: Y(v), 'class': 'g-grid' }, svg); el('text', { x: L - 6, y: Y(v) + 3, 'text-anchor': 'end', 'class': 'g-axis' }, svg, v); });
    [-4, -2, 0, 2, 4].forEach(function (v) { el('line', { x1: X(v), x2: X(v), y1: T, y2: H - B, 'class': 'g-grid' }, svg); el('text', { x: X(v), y: H - B + 14, 'text-anchor': 'middle', 'class': 'g-axis' }, svg, v); });
    el('text', { x: (L + W - Rr) / 2, y: H - 6, 'text-anchor': 'middle', 'class': 'g-axis' }, svg, 'log₂ fold change (adult vs paediatric)');
    var yl = el('text', { x: 12, y: (T + H - B) / 2, 'text-anchor': 'middle', 'class': 'g-axis', transform: 'rotate(-90 12 ' + ((T + H - B) / 2) + ')' }, svg, '−log₁₀ p');
    el('line', { x1: X(th.fc), x2: X(th.fc), y1: T, y2: H - B, 'class': 'g-base' }, svg); el('line', { x1: X(-th.fc), x2: X(-th.fc), y1: T, y2: H - B, 'class': 'g-base' }, svg);
    el('line', { x1: L, x2: W - Rr, y1: Y(th.p), y2: Y(th.p), 'class': 'g-base' }, svg);
    var up = 0, down = 0;
    data.forEach(function (d) {
      var hit = d.y >= th.p && Math.abs(d.fc) >= th.fc, col = !hit ? '#98a2b3' : d.fc > 0 ? '#e0605c' : '#3b82f6';
      if (hit) { if (d.fc > 0) up++; else down++; }
      var c = el('circle', { cx: X(Math.max(-xs + .1, Math.min(xs - .1, d.fc))), cy: Y(Math.min(ymax - .1, d.y)), r: hit ? 3.4 : 2.2, fill: col, opacity: hit ? 0.9 : 0.5, style: 'cursor:pointer' }, svg);
      c.addEventListener('mouseenter', function () { onHover(d, hit); }); c.addEventListener('click', function () { onPick(d, hit); });
    });
    data.slice(0, 8).forEach(function (d) {
      if (d.y >= th.p && Math.abs(d.fc) >= th.fc) el('text', { x: X(d.fc) + (d.fc > 0 ? 6 : -6), y: Y(Math.min(ymax - .3, d.y)) + 3, 'text-anchor': d.fc > 0 ? 'start' : 'end', 'class': 'g-lbl' }, svg, d.g);
    });
    return { up: up, down: down };
  }

  function drawHeatmap(svg, onHover) {
    while (svg.firstChild) svg.removeChild(svg.firstChild);
    var genes = ['IFNG', 'STAT1', 'CXCL10', 'IRF1', 'GBP1', 'CD74', 'ALB', 'CYP3A4', 'SERPINA1', 'APOA1', 'TTR', 'HP'], r = rng(5), cols = 10, cw = 34, ch = 19, L = 84, T = 34, i, j;
    for (j = 0; j < cols; j++) el('text', { x: L + j * cw + cw / 2, y: T - 8, 'text-anchor': 'middle', 'class': 'g-axis' }, svg, (j < 5 ? 'A' : 'P') + (j % 5 + 1));
    el('rect', { x: L, y: 6, width: cw * 5 - 3, height: 4, rx: 2, fill: '#e0605c' }, svg); el('rect', { x: L + cw * 5, y: 6, width: cw * 5 - 3, height: 4, rx: 2, fill: '#3b82f6' }, svg);
    el('text', { x: L + cw * 2.5, y: 22, 'text-anchor': 'middle', 'class': 'g-axis' }, svg, 'adult'); el('text', { x: L + cw * 7.5, y: 22, 'text-anchor': 'middle', 'class': 'g-axis' }, svg, 'paediatric');
    function color(z) { // blue - white - red
      var t = Math.max(-1, Math.min(1, z / 2)), a = Math.abs(t);
      var c = t < 0 ? [59, 130, 246] : [224, 96, 92], w = 244;
      return 'rgb(' + Math.round(w + (c[0] - w) * a) + ',' + Math.round(w + (c[1] - w) * a) + ',' + Math.round(w + (c[2] - w) * a) + ')';
    }
    for (i = 0; i < genes.length; i++) {
      el('text', { x: L - 8, y: T + i * ch + ch / 2 + 4, 'text-anchor': 'end', 'class': 'g-axis' }, svg, genes[i]);
      var sign = i < 6 ? 1 : -1;
      for (j = 0; j < cols; j++) {
        var z = (j < 5 ? sign : -sign) * (0.9 + r() * 0.9) + gauss(r) * 0.35;
        var rc = el('rect', { x: L + j * cw, y: T + i * ch, width: cw - 2, height: ch - 2, rx: 3, fill: color(z) }, svg);
        (function (g, s, z) { rc.addEventListener('mouseenter', function () { onHover(g, s, z); }); })(genes[i], (j < 5 ? 'A' : 'P') + (j % 5 + 1), z);
      }
    }
    // colour bar
    for (i = 0; i < 9; i++) el('rect', { x: L + 300 - 0, y: 0, width: 0, height: 0 }, svg);
    var lx = L + cols * cw + 14;
    for (i = 0; i < 9; i++) el('rect', { x: lx, y: T + i * 12, width: 10, height: 12, fill: color(2 - i * 0.5) }, svg);
    el('text', { x: lx + 15, y: T + 9, 'class': 'g-axis' }, svg, '+2'); el('text', { x: lx + 15, y: T + 9 * 12, 'class': 'g-axis' }, svg, '−2'); el('text', { x: lx, y: T - 8, 'class': 'g-axis' }, svg, 'z');
  }

  function xrdModel(a) {
    var hkl = [[1, 0, 0, 100], [1, 1, 0, 55], [1, 1, 1, 12], [2, 0, 0, 40], [2, 1, 0, 8], [2, 1, 1, 22], [2, 2, 0, 16], [3, 0, 0, 6], [3, 1, 0, 10]], pk = [];
    hkl.forEach(function (h) {
      var dd = a / Math.sqrt(h[0] * h[0] + h[1] * h[1] + h[2] * h[2]), s = 1.5406 / (2 * dd);
      if (s < 1) pk.push({ t: 2 * Math.asin(s) * 180 / Math.PI, i: h[3], l: '(' + h[0] + h[1] + h[2] + ')' });
    });
    return pk;
  }
  function drawXRD(svg, a, onHover) {
    while (svg.firstChild) svg.removeChild(svg.firstChild);
    var W = 560, H = 280, L = 40, B = 34, T = 14, Rr = 12, lo = 10, hi = 50, pk = xrdModel(a), r = rng(3), pts = [], x, i;
    function X(v) { return L + (v - lo) / (hi - lo) * (W - L - Rr); }
    function Y(v) { return H - B - v / 118 * (H - B - T); }
    [10, 20, 30, 40, 50].forEach(function (v) { el('line', { x1: X(v), x2: X(v), y1: T, y2: H - B, 'class': 'g-grid' }, svg); el('text', { x: X(v), y: H - B + 14, 'text-anchor': 'middle', 'class': 'g-axis' }, svg, v); });
    el('text', { x: (L + W - Rr) / 2, y: H - 6, 'text-anchor': 'middle', 'class': 'g-axis' }, svg, '2θ (°, Cu Kα)');
    var vals = [];
    for (x = lo; x <= hi; x += 0.05) {
      var y = 4 + r() * 1.6;
      pk.forEach(function (p) { var d = (x - p.t) / 0.13; y += p.i * Math.exp(-0.5 * d * d); });
      vals.push([x, y]);
    }
    var d = 'M' + vals.map(function (v) { return X(v[0]).toFixed(1) + ' ' + Y(v[1]).toFixed(1); }).join(' L');
    el('path', { d: d + ' L' + X(hi) + ' ' + Y(0) + ' L' + X(lo) + ' ' + Y(0) + ' Z', fill: 'var(--accent)', opacity: .14 }, svg);
    el('path', { d: d, fill: 'none', stroke: 'var(--accent)', 'stroke-width': 1.5 }, svg);
    pk.forEach(function (p) { if (p.t < hi) { el('text', { x: X(p.t), y: Y(p.i + 6) - 4, 'text-anchor': 'middle', 'class': 'g-lbl' }, svg, p.l); } });
    var cross = el('line', { x1: 0, x2: 0, y1: T, y2: H - B, stroke: 'var(--text-faint)', 'stroke-dasharray': '3 3', opacity: 0 }, svg);
    var hit = el('rect', { x: L, y: T, width: W - L - Rr, height: H - B - T, fill: 'transparent' }, svg);
    hit.addEventListener('mousemove', function (e) {
      var box = svg.getBoundingClientRect(), px = (e.clientX - box.left) / box.width * W, t = lo + (px - L) / (W - L - Rr) * (hi - lo);
      var yy = 4; pk.forEach(function (p) { var dd = (t - p.t) / 0.13; yy += p.i * Math.exp(-0.5 * dd * dd); });
      cross.setAttribute('x1', px); cross.setAttribute('x2', px); cross.setAttribute('opacity', 1); onHover(t, yy, pk);
    });
    hit.addEventListener('mouseleave', function () { cross.setAttribute('opacity', 0); });
    return pk;
  }

  window.SDViz = {
    Viewer: Viewer, buildProtein: buildProtein, proteinScene: proteinScene, pdbText: pdbText,
    crystalScene: crystalScene, cifText: cifText, volcanoData: volcanoData, drawVolcano: drawVolcano,
    drawHeatmap: drawHeatmap, drawXRD: drawXRD, xrdModel: xrdModel
  };
})();
