/* ════════════════════════════════════════════════════════════════
   ENNÉAGRAMME — illustrations génératives en noir et blanc
   Chaque élément <div class="art" data-style="…" data-n="…" data-seed="…">
   reçoit un dessin SVG calculé, toujours identique pour un même seed.

   data-style : "champ"   lignes de niveau autour de n centres qui s'attirent
                "cercles" cercles concentriques qui se superposent (moiré)
                "ennea"   ennéagramme recadré, un élément mis en avant
   data-n     : nombre de « présences » (1 soi, 2 couple, 3 triade, 5+ équipe)
   data-seed  : texte libre (le nom de l'article) → variation unique
   data-tone  : "light" (encre sur blanc, défaut) ou "dark" (blanc sur noir)
   ════════════════════════════════════════════════════════════════ */
(function () {
  'use strict';
  var NS = 'http://www.w3.org/2000/svg';
  var W = 640, H = 400;

  function hash(str) {
    var h = 2166136261;
    for (var i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); }
    return h >>> 0;
  }
  function rng(seed) {
    var a = seed || 1;
    return function () {
      a |= 0; a = a + 0x6D2B79F5 | 0;
      var t = Math.imul(a ^ a >>> 15, 1 | a);
      t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
      return ((t ^ t >>> 14) >>> 0) / 4294967296;
    };
  }
  function el(name, attrs) {
    var e = document.createElementNS(NS, name);
    for (var k in attrs) e.setAttribute(k, attrs[k]);
    return e;
  }
  function f1(v) { return Math.round(v * 10) / 10; }

  /* Centres : composition décentrée, jamais symétrique */
  function centres(n, r) {
    var out = [];
    if (n === 1) {
      out.push({ x: W * (0.58 + r() * 0.12), y: H * (0.45 + r() * 0.15), w: 1.15 });
    } else if (n === 2) {
      var cx = W * (0.5 + r() * 0.1), cy = H * (0.5 + (r() - 0.5) * 0.1);
      var d = W * (0.12 + r() * 0.05), a = (r() - 0.5) * 0.7;
      out.push({ x: cx - Math.cos(a) * d, y: cy - Math.sin(a) * d, w: 0.95 + r() * 0.2 });
      out.push({ x: cx + Math.cos(a) * d, y: cy + Math.sin(a) * d, w: 0.85 + r() * 0.2 });
    } else {
      var ox = W * (0.52 + r() * 0.08), oy = H * 0.5, rad = Math.min(W, H) * (n === 3 ? 0.24 : 0.3);
      var rot = r() * Math.PI * 2;
      for (var i = 0; i < n; i++) {
        var t = rot + i / n * Math.PI * 2 + (r() - 0.5) * 0.5;
        var rr = rad * (0.75 + r() * 0.4);
        out.push({ x: ox + Math.cos(t) * rr * 1.25, y: oy + Math.sin(t) * rr, w: (n > 3 ? 0.55 : 0.75) + r() * 0.3 });
      }
    }
    return out;
  }

  /* ───── 1. Champ : lignes de niveau (marching squares) ───── */
  function champ(svg, n, r, ink) {
    var cs = centres(n, r), step = 5, cols = Math.ceil(W / step) + 1, rows = Math.ceil(H / step) + 1;
    var ph = [r() * 6, r() * 6, r() * 6];
    var R0 = Math.min(W, H) * 0.16;
    var g = new Float32Array(cols * rows);
    for (var j = 0; j < rows; j++) for (var i = 0; i < cols; i++) {
      var x = i * step, y = j * step, v = 0;
      for (var k = 0; k < cs.length; k++) {
        var dx = x - cs[k].x, dy = y - cs[k].y;
        v += cs[k].w * R0 * R0 / (dx * dx + dy * dy + 40);
      }
      v *= 1 + 0.06 * Math.sin(x * 0.018 + ph[0]) * Math.cos(y * 0.021 + ph[1]) + 0.03 * Math.sin((x + y) * 0.035 + ph[2]);
      g[j * cols + i] = v;
    }
    var levels = [], L = 26;
    for (var l = 0; l < L; l++) levels.push(0.16 * Math.pow(1.17, l));
    var d = [];
    function lerp(a, b, va, vb, lv) { return a + (b - a) * ((lv - va) / (vb - va)); }
    for (var li = 0; li < levels.length; li++) {
      var lv = levels[li];
      for (j = 0; j < rows - 1; j++) for (i = 0; i < cols - 1; i++) {
        var a = g[j * cols + i], b = g[j * cols + i + 1], c = g[(j + 1) * cols + i + 1], e = g[(j + 1) * cols + i];
        var idx = (a > lv ? 8 : 0) | (b > lv ? 4 : 0) | (c > lv ? 2 : 0) | (e > lv ? 1 : 0);
        if (idx === 0 || idx === 15) continue;
        var x0 = i * step, y0 = j * step;
        var T = [lerp(x0, x0 + step, a, b, lv), y0], Rt = [x0 + step, lerp(y0, y0 + step, b, c, lv)],
            B = [lerp(x0, x0 + step, e, c, lv), y0 + step], Lf = [x0, lerp(y0, y0 + step, a, e, lv)];
        var segs = {
          1: [[Lf, B]], 2: [[B, Rt]], 3: [[Lf, Rt]], 4: [[T, Rt]], 5: [[Lf, T], [B, Rt]], 6: [[T, B]], 7: [[Lf, T]],
          8: [[Lf, T]], 9: [[T, B]], 10: [[T, Rt], [Lf, B]], 11: [[T, Rt]], 12: [[Lf, Rt]], 13: [[B, Rt]], 14: [[Lf, B]]
        }[idx];
        for (var s = 0; s < segs.length; s++) d.push('M' + f1(segs[s][0][0]) + ' ' + f1(segs[s][0][1]) + 'L' + f1(segs[s][1][0]) + ' ' + f1(segs[s][1][1]));
      }
    }
    svg.appendChild(el('path', { d: d.join(''), fill: 'none', stroke: ink, 'stroke-width': 0.9, 'stroke-linecap': 'round', 'vector-effect': 'non-scaling-stroke' }));
    cs.forEach(function (c) { svg.appendChild(el('circle', { cx: f1(c.x), cy: f1(c.y), r: 2.6, fill: ink })); });
  }

  /* ───── 2. Cercles : moiré de cercles concentriques ───── */
  function cercles(svg, n, r, ink) {
    var cs = centres(n, r), g = el('g', { fill: 'none', stroke: ink, 'stroke-width': 0.7, 'vector-effect': 'non-scaling-stroke' });
    var gap = 6 + r() * 2, count = n > 3 ? 26 : 34;
    cs.forEach(function (c) {
      for (var k = 1; k <= count; k++) g.appendChild(el('circle', { cx: f1(c.x), cy: f1(c.y), r: f1(k * gap * (n > 3 ? 0.85 : 1)) }));
    });
    svg.appendChild(g);
  }

  /* ───── 3. Ennéagramme recadré ───── */
  var P = { 9: [220, 44], 1: [333, 85], 2: [393, 189], 3: [373, 308], 4: [280, 386], 5: [160, 386], 6: [67, 308], 7: [47, 189], 8: [107, 85] };
  function pts(list) { return list.map(function (k) { return P[k].join(','); }).join(' '); }
  function ennea(svg, n, r, ink, seed) {
    var focus = { 1: 'point', 2: 'paire', 3: 'triangle' }[n] || 'hexade';
    var keys = Object.keys(P);
    var pick = keys[Math.floor(r() * 9)], pick2 = { 1: '7', 2: '8', 3: '6', 4: '1', 5: '7', 6: '3', 7: '5', 8: '2', 9: '3' }[pick];
    var s = 1.1 + r() * 0.35;
    /* point d'ancrage : l'élément mis en avant reste toujours dans le cadre */
    var ax = 220, ay = 220;
    if (focus === 'point') { ax = P[pick][0]; ay = P[pick][1]; }
    else if (focus === 'paire') { ax = (P[pick][0] + P[pick2][0]) / 2; ay = (P[pick][1] + P[pick2][1]) / 2; }
    else if (focus === 'triangle') { ay = 230; }
    var px = W * (0.42 + r() * 0.22), py = H * (focus === 'point' ? 0.42 + r() * 0.16 : 0.5);
    var tx = px - ax * s, ty = py - ay * s;
    var g = el('g', { transform: 'translate(' + f1(tx) + ' ' + f1(ty) + ') scale(' + f1(s) + ')', fill: 'none', stroke: ink, 'stroke-linejoin': 'round' });
    var faint = { 'stroke-width': 0.6, opacity: 0.35, 'vector-effect': 'non-scaling-stroke' };
    function add(name, attrs, strong) {
      var a = {}; for (var k in attrs) a[k] = attrs[k];
      var st = strong ? { 'stroke-width': 2.2, 'vector-effect': 'non-scaling-stroke' } : faint;
      for (k in st) a[k] = st[k];
      g.appendChild(el(name, a));
    }
    add('circle', { cx: 220, cy: 220, r: 176 }, focus === 'cercle');
    add('polygon', { points: pts([9, 3, 6]) }, focus === 'triangle');
    add('polyline', { points: pts([1, 4, 2, 8, 5, 7, 1]) }, focus === 'hexade');
    if (focus === 'paire') add('line', { x1: P[pick][0], y1: P[pick][1], x2: P[pick2][0], y2: P[pick2][1] }, true);
    keys.forEach(function (k) {
      var on = (focus === 'point' && k === pick) || (focus === 'paire' && (k === pick || k === pick2));
      g.appendChild(el('circle', { cx: P[k][0], cy: P[k][1], r: on ? 7 : 3, fill: ink, stroke: 'none' }));
      if (on) g.appendChild(el('circle', { cx: P[k][0], cy: P[k][1], r: 18, fill: 'none', stroke: ink, 'stroke-width': 1, 'vector-effect': 'non-scaling-stroke' }));
    });
    svg.appendChild(g);
  }

  /* ───── 4. Habillage du hero : grands cercles très légers, en dérive lente ───── */
  var HERO = {
    /* a : deux ondes qui se croisent à droite du titre */
    a: [{ x: .74, y: .52, k: 34, gap: 15 }, { x: .9, y: .3, k: 34, gap: 15 }],
    /* b : un seul halo, coupé par le coin haut droit */
    b: [{ x: 1.04, y: -.12, k: 80, gap: 12 }],
    /* c : trois petites présences (les trois centres) */
    c: [{ x: .68, y: .42, k: 18, gap: 11 }, { x: .83, y: .22, k: 18, gap: 11 }, { x: .86, y: .68, k: 18, gap: 11 }],
    /* d : deux très grandes ondes qui traversent toute la largeur */
    d: [{ x: .18, y: 1.15, k: 80, gap: 14 }, { x: .82, y: -.1, k: 80, gap: 14 }]
  };
  function hero(svg, variant, ink, centres) {
    var spec = HERO[variant] || HERO.a;
    /* data-centres="x,y,k,gap;x,y,k,gap" : composition propre à une page */
    if (centres) spec = centres.split(';').map(function (c) {
      var v = c.split(',').map(parseFloat); return { x: v[0], y: v[1], k: v[2], gap: v[3] };
    });
    spec.forEach(function (c, i) {
      var g = el('g', { class: 'drift drift--' + (i % 3), fill: 'none', stroke: ink, 'stroke-width': 0.8, 'vector-effect': 'non-scaling-stroke' });
      var wrap = el('g', { transform: 'translate(' + f1(c.x * W) + ' ' + f1(c.y * H) + ')' });
      for (var k = 1; k <= c.k; k++) g.appendChild(el('circle', { cx: 0, cy: 0, r: k * c.gap }));
      wrap.appendChild(g);
      svg.appendChild(wrap);
    });
  }

  function render(box) {
    if (box.firstChild) return;
    var style = box.getAttribute('data-style') || 'champ';
    var n = parseInt(box.getAttribute('data-n'), 10) || 1;
    var seedStr = box.getAttribute('data-seed') || 'enneagramme';
    var dark = box.getAttribute('data-tone') === 'dark';
    var ink = dark ? '#ffffff' : '#000000';
    var r = rng(hash(seedStr + style));
    /* la composition suit le format réel de l'emplacement (carte, bandeau…) */
    var ratio = box.clientWidth && box.clientHeight ? box.clientWidth / box.clientHeight : 1.6;
    H = 400; W = Math.round(H * Math.max(1, Math.min(ratio, style === 'hero' ? 6 : 3.2)));
    var svg = el('svg', { viewBox: '0 0 ' + W + ' ' + H, preserveAspectRatio: 'xMidYMid slice', 'aria-hidden': 'true', focusable: 'false' });
    if (style === 'hero') hero(svg, box.getAttribute('data-variant'), ink, box.getAttribute('data-centres'));
    else if (style === 'cercles') cercles(svg, n, r, ink);
    else if (style === 'ennea') ennea(svg, n, r, ink, seedStr);
    else champ(svg, n, r, ink);
    box.appendChild(svg);
  }

  function all() { Array.prototype.forEach.call(document.querySelectorAll('.art[data-style], .h-hero__art[data-style], .page-hero__art[data-style]'), render); }
  if (document.readyState !== 'loading') all(); else document.addEventListener('DOMContentLoaded', all);
  window.EnneaArt = { render: render, all: all };
})();
