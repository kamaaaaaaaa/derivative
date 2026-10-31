/* illustrations.js — иллюстрации слайдов 2–9 «Производная в физике».
   Стиль: спокойный печатный учебник на бумаге #ECEAE5 (контракт v2).
   Чистый JS, без зависимостей. Все кривые вычисляются по формулам (линейные шкалы).
   Единый пример: v0 = 20 м/с, a = 5 м/с², t_ост = 4 с, S = 40 м; s(t) = 20t − 2,5t². */
(function () {
  'use strict';

  var NS = 'http://www.w3.org/2000/svg';
  var hooks = window.slideHooks = window.slideHooks || {};

  var C = {
    ink: 'var(--ink, #2A2A2A)', navy: 'var(--navy, #2F3B6E)', navy2: 'var(--navy-2, #7A83A8)',
    marker: 'var(--marker, #CFCBC2)', muted: 'var(--muted, #6E6C67)', brick: 'var(--brick, #9A4A3C)',
    white: 'var(--white, #FFFFFF)', paper: 'var(--paper, #ECEAE5)',
    line: 'var(--line, rgba(42,42,42,0.18))', grid: 'var(--grid, rgba(42,42,42,0.10))'
  };
  var AXIS = 'rgba(42,42,42,0.55)';
  /* цвета величин: s — графит, v — navy, a — кирпич, j — navy-2 */
  var Q = { s: C.ink, v: C.navy, a: C.brick, j: C.navy2 };
  var SERIF = '"Times New Roman", "DejaVu Serif", "Noto Serif", serif';   // греческие буквы и обозначения функций
  var HEAD = 'var(--font-head, "Oswald", "Arial Narrow", sans-serif)';

  /* ---------- математика (единый пример) ---------- */
  var V0 = 20, A = 5, TST = V0 / A, SST = V0 * V0 / (2 * A);
  function sPath(t) { return V0 * t - A * t * t / 2; }          // s(t) = 20t − 2,5t²
  function vel(t) { return V0 - A * t; }                        // v(t) = s′(t) = 20 − 5t
  function sStop(t) { return t >= TST ? SST : sPath(Math.max(0, t)); }
  function vStop(t) { return t >= TST ? 0 : vel(Math.max(0, t)); }
  function smooth(u) { u = clamp(u, 0, 1); return u * u * (3 - 2 * u); }   // smoothstep
  function dsmooth(u) { return (u <= 0 || u >= 1) ? 0 : 6 * u * (1 - u); }

  /* ABS: моделирование проскальзывания колеса; ε — численная производная того же ω(t) */
  function simABS() {
    var p = { T: 2.1, w0: 66, ec: 16.7, pre: 0.1, k: 10, s0: 1.5, thr: -350, rr: 12, rmin: 50, hold: 0.08 };
    var dt = 0.001, n = Math.round(p.T / dt), t = [], w = [], wc = [], ph = [], ev = [], rel = [];
    var st = 'pre', sg = 0, ts = 0, i;
    for (i = 0; i <= n; i++) {
      var tt = i * dt, car = p.w0 - p.ec * tt;
      if (st === 'pre' && tt >= p.pre) st = 'apply';
      if (st === 'apply') sg += dt * p.k * (sg + p.s0);                      // проскальзывание растёт
      else if (st === 'release') {                                            // сброс давления
        sg -= dt * Math.max(p.rr * sg, p.rmin);
        if (sg <= 0) { sg = 0; st = 'hold'; ts = tt; rel.push(tt); }
      } else if (st === 'hold' && tt - ts >= p.hold) st = 'apply';
      var ww = Math.max(0, car - sg);
      t.push(tt); w.push(ww); wc.push(car);
      if (st === 'apply' && i > 0 && (w[i] - w[i - 1]) / dt < p.thr) { st = 'release'; ev.push(i); }
      ph.push(st);
    }
    var eps = w.map(function (_, j) {                                         // центральная разность
      var a = Math.max(0, j - 1), b = Math.min(n, j + 1);
      return (w[b] - w[a]) / ((b - a) * dt);
    });
    var ang = [0];                                                            // угол поворота = ∫ω dt
    for (i = 1; i <= n; i++) ang.push(ang[i - 1] + (w[i] + w[i - 1]) / 2 * dt);
    return { p: p, dt: dt, n: n, t: t, w: w, wc: wc, eps: eps, ph: ph, ev: ev, rel: rel, ang: ang };
  }

  /* Слайд 9: a(t) резкое и плавное; j(t) — численная производная a(t) */
  var J9 = { t0: 0.5, sharpDur: 0.05, smoothDur: 4 };
  function a9sharp(t) { return -5 * clamp((t - J9.t0) / J9.sharpDur, 0, 1); }
  function a9smooth(t) { return -5 * smooth((t - J9.t0) / J9.smoothDur); }
  function deriv(f, t, h) { h = h || 1e-3; return (f(t + h) - f(t - h)) / (2 * h); }

  /* ---------- утилиты ---------- */
  function clamp(x, a, b) { return x < a ? a : (x > b ? b : x); }
  function lin(d0, d1, r0, r1) { return function (v) { return r0 + (v - d0) * (r1 - r0) / (d1 - d0); }; }
  function eio(u) { u = clamp(u, 0, 1); return u < 0.5 ? 4 * u * u * u : 1 - Math.pow(-2 * u + 2, 3) / 2; }
  function eout(u) { u = clamp(u, 0, 1); return 1 - Math.pow(1 - u, 3); }
  function seg(ms, a, b) { return clamp((ms - a) / (b - a), 0, 1); }
  function fmt(v, d) {
    var s = Math.abs(v).toFixed(d);
    var neg = v < 0 && parseFloat(s) !== 0;
    return (neg ? '−' : '') + s.replace('.', ',');
  }
  function fmtTick(v) { return fmt(v, Math.abs(v - Math.round(v)) < 1e-9 ? 0 : (Math.abs(v * 10 - Math.round(v * 10)) < 1e-9 ? 1 : 2)); }
  function f2(v) { return (Math.round(v * 100) / 100).toString(); }

  function el(tag, a, p, st) {
    var e = document.createElementNS(NS, tag), k;
    if (a) for (k in a) if (a[k] != null) e.setAttribute(k, a[k]);
    if (st) for (k in st) e.style.setProperty(k, st[k]);
    if (p) p.appendChild(e);
    return e;
  }
  function attr(e, a) { for (var k in a) e.setAttribute(k, a[k]); return e; }
  function hel(tag, cls, p) { var e = document.createElement(tag); if (cls) e.className = cls; if (p) p.appendChild(e); return e; }
  /* текст: o = {size, fill, anchor, weight, italic, serif, head, halo} */
  function tx(p, x, y, str, o) {
    o = o || {};
    var e = el('text', { x: x, y: y, 'text-anchor': o.anchor || 'start', 'class': 'il-t' + (o.halo ? ' il-halo' : '') + (o.head ? ' il-head' : '') }, p,
      { fill: o.fill || C.ink, 'font-size': (o.size || 22) + 'px', 'font-weight': o.weight || 400 });
    if (o.italic) e.style.fontStyle = 'italic';
    if (o.serif) e.style.fontFamily = SERIF;
    if (str != null) e.textContent = str;
    return e;
  }
  /* многоцветная строка: parts = [[текст, цвет, вес, размер, 'serif']] */
  function txs(p, x, y, parts, o) {
    var e = tx(p, x, y, null, o), spans = [];
    parts.forEach(function (q) {
      var s = el('tspan', null, e, { fill: q[1] || (o && o.fill) || C.ink });
      if (q[2]) s.style.fontWeight = q[2];
      if (q[3]) s.style.fontSize = q[3] + 'px';
      if (q[4] === 'serif') { s.style.fontFamily = SERIF; s.style.fontStyle = 'italic'; }
      s.textContent = q[0];
      spans.push(s);
    });
    e.spans = spans;
    return e;
  }
  /* «|j|…» с хорошо различимыми вертикальными чертами */
  function absJ(p, x, y, rest, o, pre) {
    var parts = [], bar = function () { return ['|', null, 300]; };
    if (pre) parts.push([pre]);
    parts.push(bar(), ['j', null, null, null, 'serif'], bar(), [rest[0]]);
    if (rest[1]) parts.push(bar(), [rest[1]], bar(), [rest[2] || '']);
    var e = txs(p, x, y, parts, o);
    e.spans.forEach(function (sp) { if (sp.textContent === '|') { sp.style.fontFamily = '"DejaVu Sans", Arial, sans-serif'; sp.style.fontStyle = 'normal'; } });
    return e;
  }
  function ln(p, x1, y1, x2, y2, stroke, w, extra) {
    var e = el('line', { x1: f2(x1), y1: f2(y1), x2: f2(x2), y2: f2(y2), 'stroke-width': w || 2, 'stroke-linecap': 'round' }, p, { stroke: stroke || C.muted });
    if (extra) attr(e, extra);
    return e;
  }
  function setLine(e, x1, y1, x2, y2) { attr(e, { x1: f2(x1), y1: f2(y1), x2: f2(x2), y2: f2(y2) }); }
  function pathD(fn, a, b, n, X, Y) {
    var d = '', i, t;
    for (i = 0; i <= n; i++) { t = a + (b - a) * i / n; d += (i ? 'L' : 'M') + f2(X(t)) + ' ' + f2(Y(fn(t))); }
    return d;
  }
  /* область под кривой до уровня y0 (для серо-бежевой заливки) */
  function areaD(fn, a, b, n, X, Y, y0) {
    if (b <= a) return '';
    return pathD(fn, a, b, n, X, Y) + 'L' + f2(X(b)) + ' ' + f2(Y(y0)) + 'L' + f2(X(a)) + ' ' + f2(Y(y0)) + 'Z';
  }
  function svgRoot(c, W, H, label) {
    var s = el('svg', { viewBox: '0 0 ' + W + ' ' + H, width: '100%', height: '100%', 'class': 'il-svg', role: 'img', 'aria-label': label, preserveAspectRatio: 'xMidYMid meet' });
    c.appendChild(s);
    s.defsEl = el('defs', null, s);
    return s;
  }
  function arrowMarker(svg, id, color) {
    var m = el('marker', { id: id, viewBox: '0 0 10 10', refX: 8, refY: 5, markerWidth: 9, markerHeight: 9, orient: 'auto-start-reverse', markerUnits: 'userSpaceOnUse' }, svg.defsEl);
    el('path', { d: 'M0 0 L10 5 L0 10 z' }, m, { fill: color || AXIS });
    return 'url(#' + id + ')';
  }
  function clipRect(svg, id, x, y, w, h) {
    var cp = el('clipPath', { id: id }, svg.defsEl);
    el('rect', { x: x, y: y, width: w, height: h }, cp);
    return 'url(#' + id + ')';
  }
  /* белая карточка с тонкой рамкой (или серо-бежевая, kind = 'marker') */
  function card(p, x, y, w, h, kind) {
    return el('rect', { x: x, y: y, width: w, height: h, rx: 14, 'class': 'il-card-svg' + (kind === 'marker' ? ' il-card-svg--marker' : '') }, p);
  }
  /* плашка-маркер за ключевой подписью. Для фрагмента-tspan границы берутся по позициям символов
     родительского <text> (getStartPositionOfChar/getEndPositionOfChar), пробелы по краям не учитываются.
     fit() вызывается в render и после загрузки шрифтов. */
  function mark(target, pad, before) {
    var host = before || target, r = el('rect', { rx: 2, width: 0, height: 0 }, null, { fill: C.marker });
    host.parentNode.insertBefore(r, host);
    var m = { r: r, t: target, pad: pad == null ? 10 : pad };
    if (target.tagName === 'tspan') {
      var par = target.parentNode, off = 0, n = par.childNodes, i;
      for (i = 0; i < n.length && n[i] !== target; i++) off += n[i].textContent.length;
      var s = target.textContent, a = s.length - s.replace(/^\s+/, '').length, b = s.replace(/\s+$/, '').length - 1;
      m.par = par; m.from = off + a; m.to = off + b;
    }
    fit(m);
    MARKS.push(m);
    return m;
  }
  function fit(m) {
    try {
      if (m.par) {
        var bb = m.par.getBBox(); if (!(bb.width > 0)) return;
        var x0 = m.par.getStartPositionOfChar(m.from).x, x1 = m.par.getEndPositionOfChar(m.to).x;
        attr(m.r, { x: f2(x0 - m.pad), y: f2(bb.y - 3), width: f2(x1 - x0 + 2 * m.pad), height: f2(bb.height + 6) });
      } else {
        var b = m.t.getBBox();
        if (b.width > 0) attr(m.r, { x: f2(b.x - m.pad), y: f2(b.y - 3), width: f2(b.width + 2 * m.pad), height: f2(b.height + 6) });
      }
    } catch (e) { /* элемент ещё не отрисован */ }
  }
  /* после загрузки веб-шрифтов ширина текста меняется — подгоняем все плашки заново */
  var MARKS = [];
  function fitAll() { MARKS.forEach(fit); }
  if (typeof document !== 'undefined' && document.fonts) {
    if (document.fonts.ready) document.fonts.ready.then(fitAll);
    if (document.fonts.addEventListener) document.fonts.addEventListener('loadingdone', fitAll);
    window.addEventListener('load', fitAll);
  }
  function fit(m) {
    try {
      var b = m.t.getBBox();
      if (b.width > 0) attr(m.r, { x: f2(b.x - m.pad), y: f2(b.y - 3), width: f2(b.width + 2 * m.pad), height: f2(b.height + 6) });
    } catch (e) { /* элемент ещё не отрисован */ }
  }
  function point(p, r, col) { return el('circle', { r: r || 8 }, p, { fill: C.white, stroke: col || C.navy, 'stroke-width': 3 }); }

  /* Оси с сеткой, делениями и подписями */
  function axes(svg, o, id) {
    var g = el('g', { 'class': 'il-axes' }, svg), X = o.X, Y = o.Y;
    var x0 = X(o.xmin), x1 = X(o.xmax), y0 = Y(o.ymin), y1 = Y(o.ymax);
    var ax = o.xAxisAt != null ? Y(o.xAxisAt) : y0, ay = o.yAxisAt != null ? X(o.yAxisAt) : x0;
    var mk = arrowMarker(svg, id + '-ax', AXIS);
    var xf = o.xfmt || fmtTick, yf = o.yfmt || fmtTick;
    if (o.grid !== false) {
      (o.xticks || []).forEach(function (t) { ln(g, X(t), y0, X(t), y1, C.grid, 1.5); });
      (o.yticks || []).forEach(function (v) { ln(g, x0, Y(v), x1, Y(v), C.grid, 1.5); });
    }
    ln(g, x0, ax, x1, ax, AXIS, 1.6, { 'marker-end': mk });
    ln(g, ay, y0, ay, y1, AXIS, 1.6, { 'marker-end': mk });
    (o.xticks || []).forEach(function (t) {
      ln(g, X(t), ax - 5, X(t), ax + 5, AXIS, 1.6);
      if (o.xTickLabels !== false) tx(g, X(t), ax + (o.xTickDy || 28), xf(t), { anchor: 'middle', size: o.tickSize || 20, fill: C.muted });
    });
    (o.yticks || []).forEach(function (v) {
      ln(g, ay - 5, Y(v), ay + 5, Y(v), AXIS, 1.6);
      tx(g, ay - 12, Y(v) + 7, yf(v), { anchor: 'end', size: o.tickSize || 20, fill: C.muted });
    });
    if (o.origin) tx(g, ay - 12, ax + 24, '0', { anchor: 'end', size: o.tickSize || 20, fill: C.muted });
    if (o.xlabel) {
      var xl = o.xlabelAt || { x: x1, y: ax + 54, anchor: 'end' };
      tx(g, xl.x, xl.y, o.xlabel, { anchor: xl.anchor, size: 22, fill: C.ink, italic: true });
    }
    if (o.ylabel) {
      var yl = o.ylabelAt || { x: ay + 16, y: y1 + 8, anchor: 'start' };
      tx(g, yl.x, yl.y, o.ylabel, { anchor: yl.anchor, size: 22, fill: C.ink, italic: true });
    }
    return g;
  }
  function rid(p) { return p + '-' + Math.random().toString(36).slice(2, 7); }

  /* ---------- раннер анимаций ---------- */
  function Runner(I) { this.I = I; this.raf = 0; }
  Runner.prototype.start = function () {
    var I = this.I, self = this, t0 = null;
    this.stop();
    if (window.REDUCED) { I.render(I.finalMs, true); return; }
    function fr(now) {
      if (t0 === null) t0 = now;
      var e = now - t0;
      if (isFinite(I.period)) {
        if (I.loop) e = e % I.period;
        else if (e >= I.period) { I.render(I.finalMs, false); self.raf = 0; return; }
      }
      I.render(e, false);
      self.raf = requestAnimationFrame(fr);
    }
    I.render(0, false);
    this.raf = requestAnimationFrame(fr);
  };
  Runner.prototype.stop = function () { if (this.raf) cancelAnimationFrame(this.raf); this.raf = 0; };

  var B = {};   // строители иллюстраций: id → function(container) → {root, render(ms), period, loop, finalMs}

  var B = {};   // строители: id → function(container) → {root, render(ms), period, loop, finalMs}

  /* ================= illu-2: секущая → касательная ================= */
  B['illu-2'] = function (c) {
    var W = 860, H = 620, P = rid('il2');
    var svg = svgRoot(c, W, H, 'График пути s(t): секущая превращается в касательную при Δt → 0');
    var X = lin(0, 4.45, 84, 834), Y = lin(0, 46, 552, 44);
    var t0 = 1.2, s0 = sPath(t0), v0 = vel(t0);
    var clip = clipRect(svg, P + '-c', 84, 30, 760, 522);
    axes(svg, { X: X, Y: Y, xmin: 0, xmax: 4.45, ymin: 0, ymax: 46, xticks: [1, 2, 3, 4], yticks: [10, 20, 30, 40], xlabel: 't, с', ylabel: 's, м', origin: true }, P);
    tx(svg, 112, 108, 's(t) = 20t − 2,5t²', { size: 26, fill: Q.s, weight: 600 });
    tx(svg, 112, 144, 't₀ = 1,2 с', { size: 22, fill: C.muted });

    var gl = el('g', { 'clip-path': clip }, svg);
    ln(gl, X(t0), Y(s0), X(t0), Y(0), C.muted, 1.5, { 'stroke-dasharray': '4 6' });
    ln(gl, X(t0), Y(s0), X(0), Y(s0), C.muted, 1.5, { 'stroke-dasharray': '4 6' });
    tx(svg, X(t0), Y(0) + 28, 't₀', { anchor: 'middle', size: 22, fill: C.ink, weight: 600 });
    var tri = el('polygon', { points: '' }, gl, { fill: C.marker, 'fill-opacity': 0.75 });
    el('path', { d: pathD(sPath, 0, 4, 200, X, Y), fill: 'none', 'stroke-width': 3.5, 'stroke-linecap': 'round' }, svg, { stroke: Q.s });
    var tang = ln(gl, 0, 0, 0, 0, C.navy, 3, { 'stroke-dasharray': '10 9' });
    var tA = -1, tB = 5;
    setLine(tang, X(tA), Y(s0 + v0 * (tA - t0)), X(tB), Y(s0 + v0 * (tB - t0)));
    var tangLbl = tx(svg, X(1.95) - 8, Y(s0 + v0 * (1.95 - t0)) - 18, 'касательная', { anchor: 'end', size: 22, fill: C.navy, weight: 600, halo: true });
    var sec = ln(gl, 0, 0, 0, 0, C.navy2, 3);
    var hL = ln(gl, 0, 0, 0, 0, C.navy2, 2), vL = ln(gl, 0, 0, 0, 0, C.navy2, 2);
    var dtL = tx(svg, 0, 0, 'Δt', { anchor: 'middle', size: 24, fill: C.ink, weight: 600, halo: true });
    var dsL = tx(svg, 0, 0, 'Δs', { anchor: 'start', size: 24, fill: C.ink, weight: 600, halo: true });
    var t1L = tx(svg, 0, 0, 't₀+Δt', { anchor: 'middle', size: 22, fill: C.navy2, weight: 600 });
    var t1G = ln(gl, 0, 0, 0, 0, C.navy2, 1.5, { 'stroke-dasharray': '4 6' });
    var secLbl = tx(svg, 0, 0, 'секущая', { anchor: 'start', size: 22, fill: C.navy2, weight: 600, halo: true });
    var p1 = el('circle', { r: 7 }, svg, { fill: C.navy2, stroke: C.paper, 'stroke-width': 2 });
    var p0 = point(svg, 8, C.navy); attr(p0, { cx: X(t0), cy: Y(s0) });

    card(svg, 456, 394, 378, 146);
    var l1 = tx(svg, 474, 428, '', { size: 21, fill: C.ink });
    var l3 = tx(svg, 474, 464, '', { size: 24, fill: C.navy2, weight: 600 });
    var pl = el('rect', { x: 466, y: 486, width: 358, height: 44, rx: 2 }, svg, { fill: C.marker });
    var l4 = tx(svg, 474, 516, '', { size: 26, fill: C.navy, weight: 600 });

    function render(ms) {
      var dt = ms < 700 ? 2.4 : 2.4 * (1 - eio((ms - 700) / 3000));
      var fin = dt < 0.003, tf = seg(ms, 3700, 4200);
      if (!fin) {
        var t1 = t0 + dt, s1 = sPath(t1), k = (s1 - s0) / dt;   // средняя скорость Δs/Δt
        setLine(sec, X(tA), Y(s0 + k * (tA - t0)), X(tB), Y(s0 + k * (tB - t0)));
        attr(p1, { cx: f2(X(t1)), cy: f2(Y(s1)) });
        attr(tri, { points: [X(t0), Y(s0), X(t1), Y(s0), X(t1), Y(s1)].map(f2).join(' ') });
        setLine(hL, X(t0), Y(s0), X(t1), Y(s0)); setLine(vL, X(t1), Y(s0), X(t1), Y(s1));
        var lo = clamp((dt - 0.3) / 0.35, 0, 1);
        attr(dtL, { x: f2((X(t0) + X(t1)) / 2), y: f2(Y(s0) + 30) }); dtL.style.opacity = lo;
        attr(dsL, { x: f2(X(t1) + 10), y: f2((Y(s0) + Y(s1)) / 2 + 8) }); dsL.style.opacity = lo;
        attr(t1L, { x: f2(X(t1)), y: f2(Y(0) + 54) }); t1L.style.opacity = clamp((dt - 0.4) / 0.3, 0, 1);
        setLine(t1G, X(t1), Y(s1), X(t1), Y(0)); t1G.style.opacity = 0.9;
        var ts = Math.min(t1 + 0.25, 4.1);
        attr(secLbl, { x: f2(X(ts) + 6), y: f2(Y(s0 + k * (ts - t0)) + 26) }); secLbl.style.opacity = lo;
        [sec, p1, tri, hL, vL].forEach(function (e) { e.style.opacity = 1; });
        l1.textContent = 'Δt = ' + fmt(dt, 2) + ' с,  Δs = ' + fmt(s1 - s0, 2) + ' м';
        l3.textContent = 'Δs/Δt = ' + fmt(k, 2) + ' м/с';
        var g = clamp(1 - dt / 0.8, 0, 1);
        tang.style.opacity = 0.35 + 0.45 * g;
        attr(tang, { 'stroke-dasharray': '10 9', 'stroke-width': 3 });
        tangLbl.style.opacity = 0.4 * g;
        l4.textContent = 'Δt → 0  ⇒  v(t₀) = ?'; l4.style.fill = C.muted; l4.style.opacity = 1;
        pl.style.opacity = 0;
      } else {
        [sec, p1, tri, hL, vL, dtL, dsL, t1L, t1G, secLbl].forEach(function (e) { e.style.opacity = 0; });
        l1.textContent = 'Δt → 0,  Δs → 0';
        l3.textContent = 'Δs/Δt → 14,00 м/с';
        l4.textContent = 's′(t₀) = v(t₀) = 14 м/с'; l4.style.fill = C.navy;
        tang.style.opacity = 1;
        attr(tang, { 'stroke-dasharray': 'none', 'stroke-width': 4 });
        tangLbl.style.opacity = 0.4 + 0.6 * tf;
        l4.style.opacity = 0.3 + 0.7 * tf;
        pl.style.opacity = tf;
      }
    }
    return { root: svg, render: render, period: 8200, loop: true, finalMs: 5000 };
  };

  /* ================= illu-3: цепочка производных ================= */
  B['illu-3'] = function (c) {
    var root = hel('div', 'il-chain', c);
    var CW = 340, CH = 290, GAP = 120;
    function s3(t) { return t < 0 ? V0 * t : sPath(t); }
    function v3(t) { return t < 0 ? V0 : vel(t); }
    var RT = 0.1;                                   // нажатие на тормоз длится 0,1 с (сглаженная ступенька)
    function a3(t) { return -A * smooth((t + RT / 2) / RT); }
    function j3(t) { return -A * dsmooth((t + RT / 2) / RT) / RT; }   // аналитическая a′(t), пик −75 м/с³
    var D = [
      { title: 's(t)', f: '= 20t − 2,5t²', cap: 'путь, м', col: Q.s, fn: s3, yr: [-14, 46], yt: [0, 40] },
      { title: 'v(t)', f: '= s′(t) = 20 − 5t', cap: 'скорость, м/с', col: Q.v, fn: v3, yr: [-5, 25], yt: [0, 20] },
      { title: 'a(t)', f: '= v′(t) = −5', cap: 'ускорение, м/с²', col: Q.a, fn: a3, yr: [-7.5, 2], yt: [0, -5] },
      { title: 'j(t)', f: '= a′(t)', cap: 'рывок, м/с³', col: Q.j, fn: j3, yr: [-9, 3], yt: [0] }
    ];
    var cards = [], arrows = [];
    D.forEach(function (d, i) {
      var cd = hel('div', 'il-card' + (i === 3 ? ' il-card--muted' : ''), root);
      cd.style.left = (i * (CW + GAP)) + 'px'; cd.style.width = CW + 'px'; cd.style.height = CH + 'px';
      var svg = svgRoot(cd, CW, CH, d.title + ' — ' + d.cap);
      var id = rid('il3-' + i);
      tx(svg, 22, 52, d.title, { size: 40, fill: d.col, italic: true, serif: true });
      tx(svg, 100, 48, d.f, { size: 21, fill: C.ink });
      if (i === 3) {
        el('rect', { x: 216, y: 66, width: 104, height: 32, rx: 2 }, svg, { fill: C.marker });
        tx(svg, 268, 89, 'слайд 9', { anchor: 'middle', size: 20, fill: C.ink });
      }
      var X = lin(-0.5, 4.35, 56, 322), Y = lin(d.yr[0], d.yr[1], 266, 104);
      axes(svg, { X: X, Y: Y, xmin: -0.5, xmax: 4.35, ymin: d.yr[0], ymax: d.yr[1], xAxisAt: 0, xticks: [0, 4], xfmt: function (v) { return v === 0 ? '' : fmtTick(v); }, yticks: d.yt, grid: false,
        xTickDy: 26, xlabel: 't, с', xlabelAt: { x: 324, y: Y(0) - 12, anchor: 'end' } }, id);
      ln(svg, X(0), Y(d.yr[0]), X(0), Y(d.yr[1]) + 10, C.muted, 1.2, { 'stroke-dasharray': '4 5' });
      var cl = clipRect(svg, id + '-c', 50, 96, 280, 174);
      var path = el('path', { d: pathD(d.fn, -0.5, 4, 900, X, Y), fill: 'none', 'stroke-width': 3.5, 'stroke-linejoin': 'round', 'stroke-linecap': 'round', pathLength: 1, 'clip-path': cl, 'stroke-dasharray': '1 1', 'stroke-dashoffset': 1 }, svg, { stroke: d.col });
      var extra = null;
      if (i === 3) {   // пик уходит за край — стрелка «всплеск»
        extra = el('g', null, svg);
        var mk = arrowMarker(svg, id + '-sp', Q.j);
        ln(extra, X(0) + 22, Y(-3), X(0) + 22, 262, Q.j, 2, { 'marker-end': mk });
        tx(extra, X(0) + 34, 238, 'всплеск', { size: 20, fill: C.ink, halo: true });
        tx(extra, X(0) + 34, 262, 'при нажатии', { size: 20, fill: C.ink, halo: true });
      }
      var cap = hel('div', 'il-cap', root);
      cap.style.left = (i * (CW + GAP)) + 'px'; cap.style.width = CW + 'px'; cap.style.top = (CH + 14) + 'px';
      cap.style.setProperty('--il-c', d.col);
      cap.innerHTML = '<i></i>' + d.cap;
      cards.push({ el: cd, path: path, extra: extra });
      if (i < 3) {
        var aw = hel('div', 'il-arrow', root);
        aw.style.left = (i * (CW + GAP) + CW) + 'px'; aw.style.width = GAP + 'px'; aw.style.height = CH + 'px';
        var as = svgRoot(aw, GAP, CH, 'производная по времени d/dt');
        var line = ln(as, 12, 150, 100, 150, C.navy, 3, { pathLength: 1, 'stroke-dasharray': '1 1', 'stroke-dashoffset': 1, 'stroke-linecap': 'butt' });
        var head = el('path', { d: 'M98 141 L114 150 L98 159 Z' }, as, { fill: C.navy });
        var lab = tx(as, 60, 126, 'd/dt', { anchor: 'middle', size: 28, fill: C.ink, italic: true, serif: true });
        arrows.push({ line: line, head: head, lab: lab });
      }
    });
    var STEP = 1200;
    function render(ms) {
      cards.forEach(function (cd, i) {
        var p = eout(seg(ms, i * STEP, i * STEP + 650));
        attr(cd.path, { 'stroke-dashoffset': f2(1 - p) });
        cd.el.classList.toggle('is-on', p > 0.02);
        if (cd.extra) cd.extra.style.opacity = p;
      });
      arrows.forEach(function (a, i) {   // стрелка прорисовывается один раз, по очереди
        var s0 = i * STEP + 600, p = eio(seg(ms, s0, s0 + 550));
        attr(a.line, { 'stroke-dashoffset': f2(1 - p) });
        a.head.style.opacity = p >= 0.98 ? 1 : 0;
        a.lab.style.opacity = 0.35 + 0.65 * p;
      });
    }
    return { root: root, render: render, period: 4400, loop: false, finalMs: 4400 };
  };

  /* ---------- машинка (вид сбоку, плоский силуэт): начало — передний бампер на уровне дороги ---------- */
  function carSide(p) {
    var g = el('g', null, p);
    el('path', { d: 'M-130 -14 L-130 -28 Q-129 -34 -120 -35 L-102 -37 Q-92 -52 -78 -53 L-50 -53 Q-40 -52 -30 -38 L-8 -34 Q0 -32 0 -24 L0 -14 Q0 -10 -4 -10 L-14 -10 A14 14 0 0 0 -42 -10 L-88 -10 A14 14 0 0 0 -116 -10 L-126 -10 Q-130 -10 -130 -14 Z' }, g,
      { fill: C.navy });
    el('path', { d: 'M-97 -38 Q-89 -49 -78 -49 L-66 -49 L-66 -38 Z M-62 -49 L-51 -49 Q-43 -48 -36 -38 L-62 -38 Z' }, g, { fill: C.paper });
    el('rect', { x: -6, y: -30, width: 6, height: 5, rx: 1 }, g, { fill: C.white });
    var bl = el('rect', { x: -132, y: -32, width: 6, height: 8, rx: 1 }, g, { fill: C.brick });
    var wheels = [-28, -102].map(function (cx) {
      var w = el('g', null, g);
      el('circle', { cx: cx, cy: -13, r: 12.5 }, w, { fill: C.ink });
      var rot = el('g', null, w);
      for (var k = 0; k < 3; k++) {
        var a = k * Math.PI / 3;
        ln(rot, cx + 8 * Math.cos(a), -13 + 8 * Math.sin(a), cx - 8 * Math.cos(a), -13 - 8 * Math.sin(a), C.marker, 2);
      }
      el('circle', { cx: cx, cy: -13, r: 3.5 }, rot, { fill: C.marker });
      return { rot: rot, cx: cx };
    });
    return { g: g, wheels: wheels, bl: bl };
  }

  /* ================= illu-4: модель торможения ================= */
  B['illu-4'] = function (c) {
    var W = 900, H = 640, P = rid('il4');
    var svg = svgRoot(c, W, H, 'Машина тормозит с 72 км/ч и останавливается через 40 м; график s(t)');
    card(svg, 16, 10, 868, 70);
    var rT = tx(svg, 40, 56, '', { size: 25, fill: C.ink });
    var rV = tx(svg, 222, 56, '', { size: 25, fill: Q.v, weight: 600 });
    var rS = tx(svg, 700, 56, '', { size: 25, fill: Q.s, weight: 600 });
    // дорога
    var XR = lin(0, 40, 200, 820), PXM = (820 - 200) / 40, GY = 186, RW = 12.5;
    el('rect', { x: 0, y: GY, width: W, height: 16 }, svg, { fill: C.marker });
    for (var m = -12; m <= 44; m += 3) el('rect', { x: f2(XR(m)), y: GY + 6, width: f2(PXM * 1.5), height: 4 }, svg, { fill: C.white });
    [0, 10, 20, 30, 40].forEach(function (m) {
      ln(svg, XR(m), GY + 18, XR(m), GY + 28, AXIS, 1.6);
      tx(svg, XR(m), GY + 52, m === 40 ? '40 м' : String(m), { anchor: 'middle', size: 20, fill: m === 40 ? C.ink : C.muted, weight: m === 40 ? 600 : 400 });
    });
    ln(svg, XR(40), 100, XR(40), GY, C.brick, 1.5, { 'stroke-dasharray': '5 6' });
    tx(svg, XR(40) + 8, 116, 'стоп', { size: 20, fill: C.brick });
    var car = carSide(svg);
    // график s(t)
    var X = lin(0, 4.6, 84, 862), Y = lin(0, 46, 580, 296);
    axes(svg, { X: X, Y: Y, xmin: 0, xmax: 4.6, ymin: 0, ymax: 46, xticks: [1, 2, 3, 4], yticks: [10, 20, 30, 40], origin: true,
      xlabel: 't, с', xlabelAt: { x: 862, y: 634, anchor: 'end' }, ylabel: 's, м' }, P);
    var area = el('path', { d: '' }, svg, { fill: C.marker, 'fill-opacity': 0.55 });
    ln(svg, X(0), Y(40), X(4.5), Y(40), C.muted, 1.5, { 'stroke-dasharray': '7 6' });
    ln(svg, X(4), Y(0), X(4), Y(40), C.muted, 1.5, { 'stroke-dasharray': '7 6' });
    var mS = mark(tx(svg, X(2.2), Y(40) - 12, 'S = 40 м', { anchor: 'middle', size: 24, fill: C.ink, weight: 600 }));
    var tl = txs(svg, X(4) - 10, Y(4), [['t', C.ink], ['ост', C.ink, null, 20], [' = 4 с', C.ink]], { anchor: 'end', size: 24, weight: 600, halo: true });
    tl.spans[1].setAttribute('baseline-shift', 'sub');
    tx(svg, X(1.55), Y(10), 's(t) = 20t − 2,5t²', { size: 22, fill: C.ink, halo: true });
    var curve = el('path', { d: '', fill: 'none', 'stroke-width': 3.5, 'stroke-linecap': 'round' }, svg, { stroke: Q.s });
    var dot = point(svg, 8, C.navy);
    var stopT = el('circle', { cx: X(4), cy: Y(40), r: 12 }, svg, { fill: 'none', stroke: C.navy, 'stroke-width': 2 });

    function render(ms) {
      var t = clamp((ms - 500) / 1000, 0, 4);
      var s = sStop(t), v = vStop(t);
      rT.textContent = 't = ' + fmt(t, 2) + ' с';
      rV.textContent = 'v = ' + fmt(v * 3.6, 1) + ' км/ч · ' + fmt(v, 1) + ' м/с';
      rS.textContent = 's = ' + fmt(s, 1) + ' м';
      attr(car.g, { transform: 'translate(' + f2(XR(s)) + ' ' + GY + ')' });
      var deg = (s * PXM / RW) * 180 / Math.PI;     // качение без проскальзывания
      car.wheels.forEach(function (w) { attr(w.rot, { transform: 'rotate(' + f2(deg % 360) + ' ' + w.cx + ' -13)' }); });
      car.bl.style.opacity = ms >= 500 ? 1 : 0.35;
      attr(curve, { d: t > 0 ? pathD(sPath, 0, t, Math.max(2, Math.round(t * 50)), X, Y) : '' });
      attr(area, { d: t > 0 ? areaD(sPath, 0, t, Math.max(2, Math.round(t * 50)), X, Y, 0) : '' });
      attr(dot, { cx: f2(X(t)), cy: f2(Y(s)) });
      stopT.style.opacity = seg(ms, 4500, 4800);
      fit(mS);
    }
    return { root: svg, render: render, period: 6400, loop: true, finalMs: 6000 };
  };

  /* ================= illu-5: скорость ×2 → путь ×4 ================= */
  B['illu-5'] = function (c) {
    var W = 780, H = 600;
    var svg = svgRoot(c, W, H, 'При удвоении скорости тормозной путь растёт вчетверо: 40 м и 160 м');
    txs(svg, W / 2, 52, [['S = v₀²/(2a)', C.ink, 600, 36], ['   при a = 5 м/с²', C.muted, 400, 22]], { anchor: 'middle' });
    var BX = 40, PXV = 140 / 72, PXS = 3.5;           // полоски строго пропорциональны величинам
    tx(svg, BX, 112, 'НАЧАЛЬНАЯ СКОРОСТЬ', { size: 22, fill: C.muted, head: true });
    tx(svg, BX, 150, 'v₀ = 72 км/ч (20 м/с)', { size: 23, fill: Q.v, weight: 600 });
    tx(svg, BX, 228, '2v₀ = 144 км/ч (40 м/с)', { size: 23, fill: Q.v, weight: 600 });
    var bv1 = el('rect', { x: BX, y: 162, height: 28, rx: 2, width: 0 }, svg, { fill: C.navy });
    var bv2 = el('rect', { x: BX, y: 240, height: 28, rx: 2, width: 0 }, svg, { fill: C.navy });
    tx(svg, BX, 318, 'ТОРМОЗНОЙ ПУТЬ', { size: 22, fill: C.muted, head: true });
    var ls1 = tx(svg, BX, 356, '', { size: 23, fill: C.ink, weight: 600 });
    var ls2 = tx(svg, BX, 436, '', { size: 23, fill: C.ink, weight: 600 });
    var bs1 = el('rect', { x: BX, y: 368, height: 32, rx: 2, width: 0 }, svg, { fill: C.navy2 });
    var bs2 = el('rect', { x: BX, y: 448, height: 32, rx: 2, width: 0 }, svg, { fill: C.navy2 });
    var seps = [40, 80, 120].map(function (m) { return ln(svg, BX + m * PXS, 450, BX + m * PXS, 478, C.paper, 3, { opacity: 0, 'stroke-linecap': 'butt' }); });
    ln(svg, BX, 500, BX + 160 * PXS, 500, AXIS, 1.6);
    [0, 40, 80, 120, 160].forEach(function (m) {
      ln(svg, BX + m * PXS, 494, BX + m * PXS, 506, AXIS, 1.6);
      tx(svg, BX + m * PXS, 530, m === 160 ? '160 м' : String(m), { anchor: m === 160 ? 'end' : 'middle', size: 20, fill: C.muted });
    });
    function badge(cy, label, solid) {
      var g = el('g', null, svg);
      el('rect', { x: 640, y: cy - 28, width: 110, height: 56, rx: 14 }, g, solid ? { fill: C.navy } : { fill: C.white, stroke: C.navy, 'stroke-width': 2 });
      tx(g, 695, cy + 12, label, { anchor: 'middle', size: 34, fill: solid ? C.white : C.navy, weight: 600 });
      return g;
    }
    var b2 = badge(215, '×2', false), b4 = badge(424, '×4', true);
    var foot = el('g', null, svg);
    var ft = txs(foot, W / 2, 580, [['(2v₀)² = 4·v₀²', C.ink, 600], ['  ⇒  ', C.muted], ['путь ×4', C.navy, 600]], { anchor: 'middle', size: 26 });
    var mF = mark(ft.spans[2], 6, ft);
    function pop(g, u) { g.style.opacity = eout(u); }
    function render(ms) {
      var pv = eout(seg(ms, 0, 700));
      attr(bv1, { width: f2(72 * PXV * pv) }); attr(bv2, { width: f2(144 * PXV * pv) });
      pop(b2, seg(ms, 700, 1000));
      var tau = clamp((ms - 800) / 1000 * 3, 0, 8);        // реальное торможение, время ускорено ×3
      var S1 = tau >= 4 ? 40 : 20 * tau - 2.5 * tau * tau;   // v0 = 20 м/с
      var S2 = 40 * tau - 2.5 * tau * tau;                   // v0 = 40 м/с, остановка при t = 8 с
      attr(bs1, { width: f2(S1 * PXS) }); attr(bs2, { width: f2(S2 * PXS) });
      ls1.textContent = 'S = ' + Math.round(S1) + ' м' + (tau >= 4 ? '  (t = 4 с)' : '');
      ls2.textContent = 'S = ' + Math.round(S2) + ' м' + (tau >= 8 ? '  (t = 8 с)' : '');
      seps.forEach(function (s, i) { s.style.opacity = S2 >= (i + 1) * 40 + 4 ? 1 : 0; });
      pop(b4, seg(ms, 3500, 3850));
      foot.style.opacity = seg(ms, 3800, 4200);
      fit(mF);
    }
    return { root: svg, render: render, period: 9500, loop: true, finalMs: 5000 };
  };

  /* ================= illu-6: касательная бежит к вершине ================= */
  B['illu-6'] = function (c) {
    var W = 1040, H = 660, P = rid('il6');
    var svg = svgRoot(c, W, H, 'Касательная к параболе s(t); в вершине t = 4 с наклон равен нулю');
    var X = lin(0, 4.6, 96, 1000), Y = lin(0, 50, 580, 50);
    var kx = X(1) - X(0), ky = Y(0) - Y(1);             // пикселей на 1 с и на 1 м
    axes(svg, { X: X, Y: Y, xmin: 0, xmax: 4.6, ymin: 0, ymax: 50, xticks: [1, 2, 3, 4], yticks: [10, 20, 30, 40], origin: true, xlabel: 't, с', ylabel: 's, м' }, P);
    var clip = clipRect(svg, P + '-c', 96, 40, 904, 540);
    el('path', { d: areaD(sPath, 0, 4, 200, X, Y, 0) }, svg, { fill: C.marker, 'fill-opacity': 0.45 });
    ln(svg, X(4), Y(0), X(4), Y(40), C.muted, 1.5, { 'stroke-dasharray': '4 6' });
    ln(svg, X(0), Y(40), X(4), Y(40), C.muted, 1.5, { 'stroke-dasharray': '4 6' });
    tx(svg, 130, 104, 's(t) = 20t − 2,5t²', { size: 26, fill: Q.s, weight: 600 });
    tx(svg, 130, 140, 's′(t) = 20 − 5t', { size: 24, fill: Q.v, weight: 500 });
    var L = 150;
    function tanEnds(t) {
      var m = vel(t) * ky / kx, n = Math.sqrt(1 + m * m), x = X(t), y = Y(sPath(t));
      return [x - L / n, y + L * m / n, x + L / n, y - L * m / n, Math.atan(m), x, y];
    }
    el('path', { d: pathD(sPath, 0, 4, 200, X, Y), fill: 'none', 'stroke-width': 3.5 }, svg, { stroke: Q.s });
    var gc = el('g', { 'clip-path': clip }, svg);
    var ghosts = [0, 1, 2, 3].map(function (t) { var e = tanEnds(t); return ln(gc, e[0], e[1], e[2], e[3], C.navy2, 2, { opacity: 0 }); });
    var tan = ln(gc, 0, 0, 0, 0, C.navy, 4);
    var href = ln(svg, 0, 0, 0, 0, C.muted, 1.5, { 'stroke-dasharray': '5 5' });
    var arc = el('path', { d: '', fill: 'none', 'stroke-width': 2 }, svg, { stroke: C.ink });
    var aL = tx(svg, 0, 0, 'α', { size: 28, fill: C.ink, italic: true, serif: true, halo: true, anchor: 'middle' });
    var dot = point(svg, 8, C.navy);
    var vtx = el('g', null, svg);
    var vt = txs(vtx, X(4) - 10, Y(40) - 44, [['s′(4) = 0,  ', C.navy], ['α', C.navy, 400, 30, 'serif'], [' = 0°', C.navy]], { anchor: 'middle', size: 26, weight: 600 });
    var mV = mark(vt, 10);
    card(svg, 560, 352, 440, 196);
    var r1 = tx(svg, 584, 396, '', { size: 25, fill: C.ink });
    var r2 = txs(svg, 584, 440, [['tg ', C.navy], ['α', C.navy, 400, 30, 'serif'], ['', C.navy]], { size: 25, weight: 600 });
    var r3 = txs(svg, 584, 484, [['', C.ink], ['', C.ink, 400, 28, 'serif'], ['', C.ink]], { size: 22 });
    tx(svg, 584, 528, 'угол на рисунке зависит от масштаба', { size: 20, fill: C.muted });
    function render(ms) {
      var t = clamp((ms - 400) / 1000, 0, 4), e = tanEnds(t), th = e[4], x = e[5], y = e[6];
      setLine(tan, e[0], e[1], e[2], e[3]);
      attr(dot, { cx: f2(x), cy: f2(y) });
      setLine(href, x, y, x + 120, y);
      var r = 58;
      attr(arc, { d: 'M' + f2(x + r) + ' ' + f2(y) + ' A' + r + ' ' + r + ' 0 0 0 ' + f2(x + r * Math.cos(th)) + ' ' + f2(y - r * Math.sin(th)) });
      attr(aL, { x: f2(x + (r + 20) * Math.cos(th / 2)), y: f2(y - (r + 20) * Math.sin(th / 2) + 9) });
      var vis = clamp((th * 180 / Math.PI - 4) / 6, 0, 1);
      arc.style.opacity = vis; aL.style.opacity = vis;
      ghosts.forEach(function (g, i) { g.style.opacity = t > i + 0.05 ? 0.6 : 0; });
      var fin = t >= 4;
      r1.textContent = 't = ' + fmt(t, 2) + ' с';
      r2.spans[2].textContent = fin ? ' = s′(4) = 0' : ' = s′(t) = ' + fmt(vel(t), 1) + ' м/с';
      r3.spans[1].textContent = fin ? 'α' : '';
      r3.spans[2].textContent = fin ? ' = 0°: касательная горизонтальна' : 'наклон уменьшается к нулю';
      r3.spans.forEach(function (sp) { sp.style.fill = fin ? C.navy : C.ink; sp.style.fontWeight = fin ? 600 : 400; });
      vtx.style.opacity = seg(ms, 4400, 4800);
      fit(mV);
    }
    return { root: svg, render: render, period: 7600, loop: true, finalMs: 6000 };
  };

  /* ================= illu-7-abs ================= */
  B['illu-7-abs'] = function (c) {
    var W = 800, H = 340, P = rid('il7a');
    var svg = svgRoot(c, W, H, 'ABS: колесо и график скорости вращения ω(t) и ускорения ε(t)');
    var S = simABS(), p = S.p;
    // колесо (графит/navy)
    var CX = 135, CY = 150;
    el('circle', { cx: CX, cy: CY, r: 92 }, svg, { fill: 'none', stroke: C.ink, 'stroke-width': 20 });
    var rot = el('g', null, svg);
    for (var k = 0; k < 24; k++) {
      var a = k * Math.PI / 12;
      ln(rot, CX + 86 * Math.cos(a), CY + 86 * Math.sin(a), CX + 98 * Math.cos(a), CY + 98 * Math.sin(a), C.muted, 2.5);
    }
    el('circle', { cx: CX, cy: CY, r: 74 }, rot, { fill: C.white, stroke: C.navy, 'stroke-width': 4 });
    for (k = 0; k < 5; k++) {
      var b = k * 2 * Math.PI / 5;
      ln(rot, CX + 16 * Math.cos(b), CY + 16 * Math.sin(b), CX + 72 * Math.cos(b), CY + 72 * Math.sin(b), C.navy, 8);
    }
    el('circle', { cx: CX, cy: CY, r: 15 }, rot, { fill: C.ink });
    var caliper = el('path', { d: 'M' + (CX + 40) + ' ' + (CY - 50) + ' A64 64 0 0 1 ' + (CX + 60) + ' ' + (CY - 22) }, svg, { fill: 'none', stroke: C.brick, 'stroke-width': 14, 'stroke-linecap': 'round' });
    var badgeT = tx(svg, CX, 311, 'ABS: сброс давления', { anchor: 'middle', size: 20, weight: 600 });
    var mBadge = mark(badgeT, 12);
    // графики
    var X = lin(0, 2.2, 330, 786), Yw = lin(0, 75, 138, 34), Ye = lin(-480, 480, 292, 180);
    axes(svg, { X: X, Y: Yw, xmin: 0, xmax: 2.2, ymin: 0, ymax: 75, xticks: [0.5, 1, 1.5, 2], yticks: [30, 60], xTickLabels: false, grid: true,
      ylabel: 'ω, рад/с', ylabelAt: { x: 340, y: 26, anchor: 'start' } }, P + 'w');
    tx(svg, 318, 145, '0', { anchor: 'end', size: 20, fill: C.muted });
    axes(svg, { X: X, Y: Ye, xmin: 0, xmax: 2.2, ymin: -480, ymax: 480, xAxisAt: 0, xticks: [0.5, 1, 1.5, 2], yticks: [-400, 0, 400], xTickLabels: false, grid: true,
      ylabel: 'ε = ω′, рад/с²', ylabelAt: { x: 340, y: 172, anchor: 'start' } }, P + 'e');
    [0, 0.5, 1, 1.5, 2].forEach(function (t) { tx(svg, X(t), 316, fmtTick(t), { anchor: 'middle', size: 20, fill: C.muted }); });
    tx(svg, 790, 338, 't, с', { anchor: 'end', size: 22, fill: C.ink, italic: true });
    ln(svg, X(0), Ye(p.thr), X(2.2), Ye(p.thr), C.brick, 1.5, { 'stroke-dasharray': '7 6' });
    tx(svg, 786, Ye(p.thr) - 10, 'порог −350', { anchor: 'end', size: 20, fill: C.brick, halo: true });
    // легенда маркера блокировки — в строке заголовка графика ε (свободна от кривых)
    el('circle', { cx: 618, cy: 165, r: 6 }, svg, { fill: C.brick, stroke: C.paper, 'stroke-width': 2 });
    var lockL = tx(svg, 630, 172, 'блокировка!', { size: 20, fill: C.brick, weight: 600 });
    el('path', { d: pathD(function (t) { return p.w0 - p.ec * t; }, 0, p.T, 20, X, Yw), fill: 'none', 'stroke-width': 2, 'stroke-dasharray': '6 6' }, svg, { stroke: C.navy2 });
    tx(svg, 786, Yw(p.w0 - p.ec * 2.1) - 8, 'авто', { anchor: 'end', size: 20, fill: C.muted, halo: true });
    var pw = el('path', { d: '', fill: 'none', 'stroke-width': 3, 'stroke-linejoin': 'round' }, svg, { stroke: Q.v });
    var pe = el('path', { d: '', fill: 'none', 'stroke-width': 2.5, 'stroke-linejoin': 'round' }, svg, { stroke: Q.a });
    var evDots = S.ev.map(function (i) {     // точка — минимум ε (момент срабатывания порога)
      var m = Math.min(S.eps[i - 1], S.eps[i - 2], S.eps[i - 3]);
      return el('circle', { cx: f2(X(S.t[i])), cy: f2(Ye(m)), r: 6 }, svg, { fill: C.brick, stroke: C.paper, 'stroke-width': 2 });
    });
    var relL = tx(svg, 0, 0, 'сброс', { size: 20, fill: C.navy, weight: 600, halo: true });
    var SLOW = 0.45, TOTAL = p.T / SLOW * 1000;
    function idx(t) { return clamp(Math.round(t / S.dt), 0, S.n); }
    function build(arr, Yf, i1) {
      var d = '';
      for (var i = 0; i <= i1; i += 5) d += (i ? 'L' : 'M') + f2(X(S.t[i])) + ' ' + f2(Yf(arr[i]));
      return d;
    }
    function render(ms) {
      var fin = ms >= TOTAL;
      var t = fin ? p.T : ms / 1000 * SLOW, i = idx(t);
      attr(pw, { d: build(S.w, Yw, i) }); attr(pe, { d: build(S.eps, Ye, i) });
      var last = -1;
      S.ev.forEach(function (e, k) { var on = e <= i; evDots[k].style.opacity = on ? 1 : 0; if (on) last = k; });
      var showK = fin ? 0 : last;
      if (showK >= 0) {
        var ei = S.ev[showK], ex = X(S.t[ei]);
        attr(relL, { x: f2(ex + 9), y: f2(Ye(400) + 8) });
        relL.style.opacity = fin ? 1 : (t > S.t[ei] + 0.06 ? clamp(1 - (t - S.t[ei] - 0.4) / 0.1, 0, 1) : 0);
      } else { relL.style.opacity = 0; }
      lockL.style.opacity = last >= 0 || fin ? 1 : 0.45;
      var deg = S.ang[i] * 0.55 * 180 / Math.PI;      // угол колеса = ∫ω dt (визуально уменьшен)
      attr(rot, { transform: 'rotate(' + f2(deg % 360) + ' ' + CX + ' ' + CY + ')' });
      var ph = fin ? 'final' : S.ph[i], locked = !fin && last >= 0 && ph === 'release' && t - S.t[S.ev[last]] < 0.08;
      caliper.style.opacity = (ph === 'release' || ph === 'hold') ? 0.3 : 1;
      if (ph === 'final') { badgeT.textContent = 'ABS: 3 цикла сброса'; badgeT.style.fill = C.navy; }
      else if (locked) { badgeT.textContent = 'блокировка!'; badgeT.style.fill = C.brick; }
      else if (ph === 'release') { badgeT.textContent = 'ABS: сброс давления'; badgeT.style.fill = C.navy; }
      else if (ph === 'pre') { badgeT.textContent = 'движение'; badgeT.style.fill = C.muted; }
      else { badgeT.textContent = 'торможение'; badgeT.style.fill = C.ink; }
      fit(mBadge);
    }
    return { root: svg, render: render, period: TOTAL + 1800, loop: true, finalMs: TOTAL + 100 };
  };

  /* ================= illu-7-exp ================= */
  B['illu-7-exp'] = function (c) {
    var W = 800, H = 340, P = rid('il7e');
    var svg = svgRoot(c, W, H, 'Экспертиза: тормозной след 40 м, v0 = √(2aS) = 20 м/с = 72 км/ч');
    var XR = lin(0, 40, 70, 590), RY0 = 22, RY1 = 152, LANE = 119;
    el('rect', { x: 0, y: RY0, width: W, height: RY1 - RY0 }, svg, { fill: C.marker, 'fill-opacity': 0.7 });
    ln(svg, 0, RY0, W, RY0, C.ink, 1.5); ln(svg, 0, RY1, W, RY1, C.ink, 1.5);
    ln(svg, 0, (RY0 + RY1) / 2, W, (RY0 + RY1) / 2, C.white, 3, { 'stroke-dasharray': '26 22', 'stroke-linecap': 'butt' });
    var m1 = el('rect', { x: XR(0), y: LANE - 18, height: 6, width: 0, rx: 1 }, svg, { fill: C.ink, 'fill-opacity': 0.8 });
    var m2 = el('rect', { x: XR(0), y: LANE + 12, height: 6, width: 0, rx: 1 }, svg, { fill: C.ink, 'fill-opacity': 0.8 });
    // машинка сверху: начало — задняя ось
    var car = el('g', null, svg);
    [[-4, -21], [-4, 15], [44, -21], [44, 15]].forEach(function (q) { el('rect', { x: q[0], y: q[1], width: 14, height: 6, rx: 1 }, car, { fill: C.ink }); });
    el('rect', { x: -16, y: -18, width: 74, height: 36, rx: 9 }, car, { fill: C.navy });
    el('path', { d: 'M30 -14 L42 -11 L42 11 L30 14 Z' }, car, { fill: C.paper });
    el('path', { d: 'M-6 -13 L2 -12 L2 12 L-6 13 Z' }, car, { fill: C.paper });
    var bgl = el('g', null, car);
    [-13, 13].forEach(function (dy) { el('rect', { x: -18, y: dy - 4, width: 4, height: 8, rx: 1 }, bgl, { fill: C.brick }); });
    // рулетка
    var meas = el('g', null, svg);
    var mk = arrowMarker(svg, P + '-m', C.ink);
    ln(meas, XR(0), 182, XR(40), 182, C.ink, 2, { 'marker-start': mk, 'marker-end': mk });
    [0, 10, 20, 30, 40].forEach(function (m) {
      ln(meas, XR(m), 176, XR(m), 190, C.ink, 1.6);
      tx(meas, XR(m), 212, m === 40 ? '40 м' : String(m), { anchor: 'middle', size: 20, fill: C.muted });
    });
    var mS = mark(tx(meas, XR(20), 173, 'S = 40 м', { anchor: 'middle', size: 23, fill: C.ink, weight: 600 }), 8);
    tx(meas, 790, 190, 'a = 5 м/с²', { anchor: 'end', size: 22, fill: C.muted });
    var l1 = txs(svg, 400, 264, [['v₀ = √(2aS)', C.ink, 600], ['  =  √(2 · 5 · 40)', C.ink]], { anchor: 'middle', size: 27 });
    var l2 = txs(svg, 400, 314, [['=  √400', C.ink], ['  =  20 м/с', C.navy, 600], ['  =  72 км/ч', C.navy, 600]], { anchor: 'middle', size: 29 });
    var mR = mark(l2.spans[2], 6, l2);
    var parts = l1.spans.concat(l2.spans);
    function render(ms) {
      var t = clamp((ms - 200) / 1000 * 2, 0, 4), s = sStop(t);     // торможение показано вдвое быстрее
      attr(car, { transform: 'translate(' + f2(XR(s)) + ' ' + LANE + ')' });
      attr(m1, { width: f2(XR(s) - XR(0)) }); attr(m2, { width: f2(XR(s) - XR(0)) });
      bgl.style.opacity = ms >= 200 ? 1 : 0.35;
      meas.style.opacity = seg(ms, 2250, 2550);
      parts.forEach(function (sp, k) { sp.style.opacity = seg(ms, 2550 + k * 300, 2800 + k * 300); });
      mR.r.style.opacity = seg(ms, 2550 + 4 * 300, 2800 + 4 * 300);
      fit(mS); fit(mR);
    }
    return { root: svg, render: render, period: 9500, loop: true, finalMs: 9000 };
  };

  /* ================= illu-8: F ~ v², P ~ v³ ================= */
  B['illu-8'] = function (c) {
    var W = 920, H = 640, P = rid('il8');
    var svg = svgRoot(c, W, H, 'Сила сопротивления растёт как v², мощность — как v³: при 200 км/ч в 4 и 8 раз больше, чем при 100 км/ч');
    var X = lin(0, 215, 96, 880), Y = lin(0, 9, 570, 66);
    axes(svg, { X: X, Y: Y, xmin: 0, xmax: 215, ymin: 0, ymax: 9, xticks: [50, 100, 150, 200], yticks: [1, 2, 3, 4, 5, 6, 7, 8], origin: true,
      xlabel: 'v, км/ч', yfmt: function (v) { return '×' + v; }, ylabel: 'во сколько раз больше, чем при 100 км/ч', ylabelAt: { x: 30, y: 38, anchor: 'start' } }, P);
    function F(v) { return Math.pow(v / 100, 2); } function Pw(v) { return Math.pow(v / 100, 3); }
    var aP = el('path', { d: '' }, svg, { fill: C.marker, 'fill-opacity': 0.45 });
    card(svg, 124, 150, 520, 180);
    ln(svg, 146, 186, 186, 186, C.navy2, 4); tx(svg, 198, 194, 'F ~ v² — сила сопротивления', { size: 23, fill: C.ink });
    ln(svg, 146, 230, 186, 230, C.navy, 4); tx(svg, 198, 238, 'P = F·v ~ v³ — мощность', { size: 23, fill: C.ink });
    var ban = txs(svg, 146, 300, [['×2 скорости', C.ink, 600], ['  →  ', C.muted], ['×4 сила', C.navy2, 600], ['  →  ', C.muted], ['×8 мощность', C.navy, 600]], { size: 24 });
    var mB = mark(ban.spans[4], 6, ban);
    var gd = el('g', null, svg);
    function guide(v, val) { ln(gd, X(v), Y(0), X(v), Y(val), C.muted, 1.5, { 'stroke-dasharray': '4 6' }); ln(gd, X(0), Y(val), X(v), Y(val), C.muted, 1.5, { 'stroke-dasharray': '4 6' }); }
    var g100 = el('g', null, svg);
    ln(g100, X(100), Y(0), X(100), Y(1), C.muted, 1.5, { 'stroke-dasharray': '4 6' });
    tx(g100, X(100) - 12, Y(1) - 16, '100 км/ч: ×1', { anchor: 'end', size: 20, fill: C.ink, halo: true });
    guide(200, 4); guide(200, 8);
    var pF = el('path', { d: '', fill: 'none', 'stroke-width': 3.5, 'stroke-linecap': 'round' }, svg, { stroke: C.navy2 });
    var pP = el('path', { d: '', fill: 'none', 'stroke-width': 4, 'stroke-linecap': 'round' }, svg, { stroke: C.navy });
    var p100 = point(g100, 7, C.ink); attr(p100, { cx: X(100), cy: Y(1) });
    var hF = el('circle', { r: 6 }, svg, { fill: C.navy2 }), hP = el('circle', { r: 6 }, svg, { fill: C.navy });
    var acc = el('g', null, svg);
    el('circle', { cx: X(200), cy: Y(4), r: 9 }, acc, { fill: C.navy2, stroke: C.paper, 'stroke-width': 3 });
    el('circle', { cx: X(200), cy: Y(8), r: 9 }, acc, { fill: C.navy, stroke: C.paper, 'stroke-width': 3 });
    tx(acc, X(200) + 18, Y(4) + 10, '×4', { size: 30, fill: C.navy2, weight: 600, halo: true });
    tx(acc, X(200) + 18, Y(8) + 10, '×8', { size: 30, fill: C.navy, weight: 600, halo: true });
    tx(acc, X(200), Y(0) - 12, '×2', { anchor: 'middle', size: 24, fill: C.ink, weight: 600, halo: true });
    function render(ms) {
      var u = eio(seg(ms, 0, 2600)), v = 200 * u;
      attr(pF, { d: v > 0 ? pathD(F, 0, v, 120, X, Y) : '' });
      attr(pP, { d: v > 0 ? pathD(Pw, 0, v, 120, X, Y) : '' });
      attr(aP, { d: v > 0 ? areaD(Pw, 0, v, 120, X, Y, 0) : '' });
      attr(hF, { cx: f2(X(v)), cy: f2(Y(F(v))) }); attr(hP, { cx: f2(X(v)), cy: f2(Y(Pw(v))) });
      hF.style.opacity = hP.style.opacity = u < 1 ? 1 : 0;
      g100.style.opacity = v >= 100 ? 1 : 0;
      var q = seg(ms, 2600, 3000);
      acc.style.opacity = q; gd.style.opacity = q;
      ban.spans.forEach(function (sp, k) { sp.style.opacity = seg(ms, 2900 + k * 150, 3150 + k * 150); });
      mB.r.style.opacity = seg(ms, 3500, 3750);
      fit(mB);
    }
    return { root: svg, render: render, period: 4000, loop: false, finalMs: 4000 };
  };

  /* ================= illu-9: рывок ================= */
  B['illu-9'] = function (c) {
    var W = 920, H = 660, P = rid('il9');
    var svg = svgRoot(c, W, H, 'Ускорение a(t) при резком и плавном торможении и рывок |j(t)| с порогом комфорта 2 м/с³');
    var X = lin(0, 5.45, 100, 890), Ya = lin(-6, 1, 290, 56), Yj = lin(0, 5.2, 612, 372);
    var ticks = [1, 2, 3, 4, 5];
    axes(svg, { X: X, Y: Ya, xmin: 0, xmax: 5.45, ymin: -6, ymax: 1, xAxisAt: 0, xticks: ticks, yticks: [-1, -2, -3, -4, -5], xTickLabels: false,
      ylabel: 'a, м/с²', ylabelAt: { x: 116, y: 50, anchor: 'start' } }, P + 'a');
    tx(svg, 88, Ya(0) + 7, '0', { anchor: 'end', size: 20, fill: C.muted });
    axes(svg, { X: X, Y: Yj, xmin: 0, xmax: 5.45, ymin: 0, ymax: 5.2, xticks: ticks, yticks: [1, 2, 3, 4, 5], origin: true,
      xlabel: 't, с', xlabelAt: { x: 890, y: 640, anchor: 'end' } }, P + 'j');
    absJ(svg, 116, 366, [' = ', 'a′(t)', ', м/с³'], { size: 22, fill: C.ink, italic: true });
    // зона дискомфорта и порог
    el('rect', { x: X(0), y: Yj(5.2), width: X(5.45) - X(0), height: Yj(2) - Yj(5.2) }, svg, { fill: C.brick, 'fill-opacity': 0.06 });
    ln(svg, X(0), Yj(2), X(5.4), Yj(2), C.ink, 1.6, { 'stroke-dasharray': '8 6' });
    var thrL = tx(svg, 880, Yj(2) + 28, 'порог комфорта 2 м/с³', { anchor: 'end', size: 20, fill: C.ink, weight: 600 });
    var mT = mark(thrL, 8);
    // легенда
    card(svg, 540, 104, 344, 92);
    ln(svg, 560, 134, 600, 134, C.brick, 3.5); tx(svg, 612, 141, 'резкое нажатие', { size: 21 });
    ln(svg, 560, 174, 600, 174, C.navy, 3.5); tx(svg, 612, 181, 'плавное (за 4 с)', { size: 21 });
    var clipJ = clipRect(svg, P + '-cj', X(0), Yj(5.2), X(5.45) - X(0), Yj(0) - Yj(5.2) + 2);
    var clipA = clipRect(svg, P + '-ca', X(0), Ya(1), X(5.45) - X(0), Ya(-6) - Ya(1));
    function jS(t) { return Math.abs(deriv(a9sharp, t, 0.002)); }
    function jM(t) { return Math.abs(deriv(a9smooth, t, 0.002)); }
    var NS_ = 1100, T1 = 5.4;
    function pathUpTo(fn, Yf, tmax) {   // мелкая сетка, чтобы ступенька 0,05 с была честной
      var d = '', n = Math.max(2, Math.round(NS_ * tmax / T1));
      for (var i = 0; i <= n; i++) { var t = tmax * i / n; d += (i ? 'L' : 'M') + f2(X(t)) + ' ' + f2(Yf(fn(t))); }
      return d;
    }
    var ajM = el('path', { d: '', 'clip-path': clipJ }, svg, { fill: C.marker, 'fill-opacity': 0.6 });
    var paS = el('path', { d: '', fill: 'none', 'stroke-width': 3.5, 'clip-path': clipA, 'stroke-linejoin': 'round' }, svg, { stroke: C.brick });
    var paM = el('path', { d: '', fill: 'none', 'stroke-width': 3.5, 'clip-path': clipA }, svg, { stroke: C.navy });
    var pjS = el('path', { d: '', fill: 'none', 'stroke-width': 3, 'clip-path': clipJ, 'stroke-linejoin': 'round' }, svg, { stroke: C.brick });
    var pjM = el('path', { d: '', fill: 'none', 'stroke-width': 3.5, 'clip-path': clipJ }, svg, { stroke: C.navy });
    var cur = ln(svg, 0, Ya(1), 0, Yj(0), C.muted, 1.2, { opacity: 0.6 });
    var mxS = 0, mxM = 0, tM = 0;
    for (var t = 0; t <= 5; t += 0.0005) { var a1 = jS(t), a2 = jM(t); if (a1 > mxS) mxS = a1; if (a2 > mxM) { mxM = a2; tM = t; } }
    var lab = el('g', null, svg);
    var mk = arrowMarker(svg, P + '-up', C.brick);
    ln(lab, X(0.55) + 12, Yj(3.6), X(0.55) + 12, Yj(5.2) + 6, C.brick, 2.5, { 'marker-end': mk });
    absJ(lab, X(0.55) + 26, Yj(4.75), [' ≈ ' + Math.round(mxS) + ' м/с³'], { size: 22, fill: C.brick, weight: 600, halo: true });
    tx(lab, X(0.55) + 26, Yj(4.75) + 28, '(при мгновенном нажатии j → ∞)', { size: 20, fill: C.ink, halo: true });
    el('circle', { cx: X(tM), cy: Yj(mxM), r: 6 }, lab, { fill: C.navy, stroke: C.paper, 'stroke-width': 2 });
    absJ(lab, X(tM), Yj(mxM) - 50, [' ≈ ' + fmt(mxM, 3) + ' м/с³ < 2'], { anchor: 'middle', size: 22, fill: C.navy, weight: 600, halo: true }, 'max ');
    var stepL = tx(svg, X(0.62), Ya(-5) - 12, 'за 0,05 с', { size: 20, fill: C.brick, halo: true });
    function render(ms) {
      var tt = Math.max(5.4 * eio(seg(ms, 0, 2800)), 1e-3);
      attr(paS, { d: pathUpTo(a9sharp, Ya, tt) }); attr(paM, { d: pathUpTo(a9smooth, Ya, tt) });
      attr(pjS, { d: pathUpTo(jS, Yj, tt) }); attr(pjM, { d: pathUpTo(jM, Yj, tt) });
      attr(ajM, { d: pathUpTo(jM, Yj, tt) + 'L' + f2(X(tt)) + ' ' + f2(Yj(0)) + 'L' + f2(X(0)) + ' ' + f2(Yj(0)) + 'Z' });
      setLine(cur, X(tt), Ya(1), X(tt), Yj(0)); cur.style.opacity = tt < 5.4 ? 0.6 : 0;
      lab.style.opacity = seg(ms, 2800, 3200);
      stepL.style.opacity = tt > 0.7 ? 1 : 0;
      fit(mT);
    }
    return { root: svg, render: render, period: 3300, loop: false, finalMs: 3300 };
  };

  /* =================== Примеры 1–5 (слайды 12–16), контейнеры 760×560 =================== */
  var EX = {
    s12: function (t) { return 3 * t * t + 2 * t; }, v12: function (t) { return 6 * t + 2; }, a12: 6,
    v14: Math.sqrt(2 * 7 * 50), a14: 7, S14: 50,
    P15: function (v) { return 0.5 * 0.3 * 1.2 * 2.2 * v * v * v / 1000; },        // кВт; ½·Cx·ρ·S = 0,396
    dP15: function (v) { return 1.5 * 0.3 * 1.2 * 2.2 * v * v / 1000; },           // кВт/(м/с)
    a16: function (t) { return 2 * t; }, j16: 2
  };
  /* прорисовка линии один раз: элемент с pathLength=1 */
  function drawable(e) { attr(e, { pathLength: 1, 'stroke-dasharray': '1 1', 'stroke-dashoffset': 1 }); return e; }
  function drawTo(e, p) { attr(e, { 'stroke-dashoffset': f2(1 - clamp(p, 0, 1)) }); }
  function fade(list, p) { list.forEach(function (e) { e.style.opacity = clamp(p, 0, 1); }); }
  function gpath(p, d, col, w, extra) { var e = el('path', { d: d, fill: 'none', 'stroke-width': w || 3.5, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }, p, { stroke: col }); if (extra) attr(e, extra); return e; }

  /* ---------- illu-12: s(t)=3t²+2t, касательная в t=2 ---------- */
  B['illu-12'] = function (c) {
    var W = 760, H = 560, P = rid('il12'), s = EX.s12;
    var svg = svgRoot(c, W, H, 'Пример 1: график s(t)=3t²+2t и касательная в точке t=2 с наклоном 14 м/с');
    var X = lin(0, 3.3, 80, 730), Y = lin(0, 36, 490, 50);
    axes(svg, { X: X, Y: Y, xmin: 0, xmax: 3.3, ymin: 0, ymax: 36, xticks: [1, 2, 3], yticks: [10, 20, 30], origin: true, xlabel: 't, с', ylabel: 's, м' }, P);
    var area = el('path', { d: areaD(s, 0, 3, 150, X, Y, 0) }, svg, { fill: C.marker, 'fill-opacity': 0.45 });
    var curve = drawable(gpath(svg, pathD(s, 0, 3, 150, X, Y), Q.s, 3.5));
    var t0 = 2, s0 = s(t0), k = EX.v12(t0);             // (2; 16), наклон 14
    var gd = el('g', null, svg);
    ln(gd, X(t0), Y(s0), X(t0), Y(0), C.muted, 1.5, { 'stroke-dasharray': '4 6' });
    ln(gd, X(t0), Y(s0), X(0), Y(s0), C.muted, 1.5, { 'stroke-dasharray': '4 6' });
    tx(gd, X(0) - 12, Y(s0) + 7, '16', { anchor: 'end', size: 20, fill: C.navy, weight: 600 });
    var tA = 1.2, tB = 2.8;
    var tan = drawable(gpath(svg, 'M' + f2(X(tA)) + ' ' + f2(Y(s0 + k * (tA - t0))) + 'L' + f2(X(tB)) + ' ' + f2(Y(s0 + k * (tB - t0))), C.navy, 4));
    var th = Math.atan(k * (Y(0) - Y(1)) / (X(1) - X(0))), r = 54, px = X(t0), py = Y(s0);
    var ang = el('g', null, svg);
    ln(ang, px, py, px + 96, py, C.muted, 1.5, { 'stroke-dasharray': '5 5' });
    el('path', { d: 'M' + f2(px + r) + ' ' + f2(py) + ' A' + r + ' ' + r + ' 0 0 0 ' + f2(px + r * Math.cos(th)) + ' ' + f2(py - r * Math.sin(th)) }, ang, { fill: 'none', stroke: C.ink, 'stroke-width': 2 });
    tx(ang, px + (r + 18) * Math.cos(th / 2), py - (r + 18) * Math.sin(th / 2) + 9, 'α', { anchor: 'middle', size: 28, italic: true, serif: true, halo: true });
    var pt = point(svg, 8, C.navy); attr(pt, { cx: px, cy: py });
    var hdr = el('g', null, svg);
    tx(hdr, 104, 96, 's(t) = 3t² + 2t', { size: 25, fill: Q.s, weight: 600 });
    tx(hdr, 104, 132, 'v(t) = s′(t) = 6t + 2', { size: 22, fill: Q.v, weight: 500 });
    var aT = tx(hdr, 104, 172, 'a = v′(t) = 6 м/с²', { size: 21, fill: C.brick, weight: 600 });
    var mA = mark(aT, 8);
    var res = el('g', null, svg);
    card(res, 410, 372, 326, 92);
    txs(res, 428, 410, [['tg ', C.navy], ['α', C.navy, 400, 28, 'serif'], [' = s′(2) = 14 м/с', C.navy]], { size: 23, weight: 600 });
    tx(res, 428, 446, 'точка касания (2; 16)', { size: 20, fill: C.muted });
    function render(ms) {
      drawTo(curve, eio(seg(ms, 0, 1200)));
      area.style.opacity = seg(ms, 600, 1400);
      fade([gd, pt], seg(ms, 1200, 1500));
      drawTo(tan, eio(seg(ms, 1500, 2300)));
      fade([ang], seg(ms, 2200, 2500));
      fade([hdr], seg(ms, 200, 700));
      fade([res], seg(ms, 2400, 2800));
      fit(mA);
    }
    return { root: svg, render: render, period: 2900, loop: false, finalMs: 2900 };
  };

  /* ---------- illu-13: s(t)=20t−2,5t², вершина (4; 40) ---------- */
  B['illu-13'] = function (c) {
    var W = 760, H = 560, P = rid('il13');
    var svg = svgRoot(c, W, H, 'Пример 2: парабола s(t)=20t−2,5t², вершина (4; 40), горизонтальная касательная');
    var X = lin(0, 4.6, 80, 730), Y = lin(0, 46, 490, 50);
    axes(svg, { X: X, Y: Y, xmin: 0, xmax: 4.6, ymin: 0, ymax: 46, xticks: [1, 2, 3, 4], yticks: [10, 20, 30, 40], origin: true, xlabel: 't, с', ylabel: 's, м' }, P);
    var area = el('path', { d: areaD(sPath, 0, 4, 160, X, Y, 0) }, svg, { fill: C.marker, 'fill-opacity': 0.45 });
    var curve = drawable(gpath(svg, pathD(sPath, 0, 4, 160, X, Y), Q.s, 3.5));
    var gd = el('g', null, svg);
    ln(gd, X(4), Y(0), X(4), Y(40), C.muted, 1.5, { 'stroke-dasharray': '7 6' });
    ln(gd, X(0), Y(40), X(4), Y(40), C.muted, 1.5, { 'stroke-dasharray': '7 6' });
    var sl = tx(gd, X(0.9), Y(40) - 12, 'S = 40 м', { anchor: 'middle', size: 23, fill: C.ink, weight: 600 });
    var mS = mark(sl, 8);
    var tl = txs(gd, X(4) - 10, Y(2.2), [['t', C.ink], ['ост', C.ink, null, 19], [' = 4 с', C.ink]], { anchor: 'end', size: 23, weight: 600, halo: true });
    tl.spans[1].setAttribute('baseline-shift', 'sub');
    var tan = drawable(gpath(svg, 'M' + f2(X(3.15)) + ' ' + f2(Y(40)) + 'L' + f2(X(4.6)) + ' ' + f2(Y(40)), C.navy, 4));
    var pt = point(svg, 8, C.navy); attr(pt, { cx: X(4), cy: Y(40) });
    var vl = el('g', null, svg);
    var vt = txs(vl, X(4), Y(40) - 26, [['s′(4) = 0,  ', C.navy], ['α', C.navy, 400, 28, 'serif'], [' = 0°', C.navy]], { anchor: 'middle', size: 24, weight: 600 });
    var mV = mark(vt, 8);
    var cardG = el('g', null, svg);
    card(cardG, 286, 282, 322, 132);
    tx(cardG, 304, 318, 's(t) = 20t − 2,5t²', { size: 22, fill: Q.s, weight: 600 });
    tx(cardG, 304, 354, 'v(t) = s′(t) = 20 − 5t', { size: 21, fill: Q.v });
    tx(cardG, 304, 392, 'v = 0  ⇒  t = 4 с', { size: 22, fill: Q.v, weight: 600 });
    function render(ms) {
      drawTo(curve, eio(seg(ms, 0, 1400)));
      area.style.opacity = seg(ms, 700, 1500);
      fade([cardG], seg(ms, 200, 700));
      fade([gd], seg(ms, 1400, 1800));
      fade([pt], seg(ms, 1600, 1800));
      drawTo(tan, eio(seg(ms, 1800, 2400)));
      fade([vl], seg(ms, 2400, 2800));
      fit(mS); fit(mV);
    }
    return { root: svg, render: render, period: 2900, loop: false, finalMs: 2900 };
  };

  /* ---------- illu-14: тормозной след 50 м, v0 = √(2aS) ---------- */
  B['illu-14'] = function (c) {
    var W = 760, H = 560, v0 = EX.v14, a = EX.a14, tSt = v0 / a;
    var svg = svgRoot(c, W, H, 'Пример 3: тормозной след 50 м, v0 = √(2·7·50) ≈ 26,5 м/с ≈ 95 км/ч');
    function s14(t) { t = clamp(t, 0, tSt); return v0 * t - a * t * t / 2; }
    card(svg, 16, 16, 728, 64);
    var rT = tx(svg, 36, 58, '', { size: 23, fill: C.ink });
    var rV = tx(svg, 230, 58, '', { size: 23, fill: Q.v, weight: 600 });
    var rS = tx(svg, 580, 58, '', { size: 23, fill: C.ink, weight: 600 });
    var XR = lin(0, 50, 90, 620), GY = 236;
    el('rect', { x: 0, y: GY, width: W, height: 16 }, svg, { fill: C.marker });
    var mk1 = el('rect', { x: XR(0), y: GY + 4, height: 8, width: 0 }, svg, { fill: C.ink, 'fill-opacity': 0.75 });
    var car = carSide(svg);
    var meas = el('g', null, svg);
    var am = arrowMarker(svg, rid('il14m'), C.ink);
    ln(meas, XR(0), 300, XR(50), 300, C.ink, 2, { 'marker-start': am, 'marker-end': am });
    [0, 10, 20, 30, 40, 50].forEach(function (m) {
      ln(meas, XR(m), 293, XR(m), 307, C.ink, 1.6);
      tx(meas, XR(m), 332, m === 50 ? '50 м' : String(m), { anchor: 'middle', size: 20, fill: C.muted });
    });
    var mS = mark(tx(meas, XR(25), 284, 'S = 50 м', { anchor: 'middle', size: 24, fill: C.ink, weight: 600 }), 8);
    tx(meas, 740, 284, 'a = 7 м/с²', { anchor: 'end', size: 21, fill: C.muted });
    var st = [
      txs(svg, 380, 404, [['v₀ = √(2aS)', C.ink, 600]], { anchor: 'middle', size: 27 }),
      txs(svg, 380, 452, [['= √(2 · 7 · 50) = √700', C.ink]], { anchor: 'middle', size: 27 }),
      txs(svg, 380, 508, [['≈ 26,5 м/с ≈ 95 км/ч', C.navy, 600]], { anchor: 'middle', size: 30 })
    ];
    var mR = mark(st[2], 12);
    var SP = 2, TM = tSt * 1000 / SP;                    // торможение показано вдвое быстрее
    function render(ms) {
      var t = clamp((ms - 300) / 1000 * SP, 0, tSt), s = s14(t), v = v0 - a * t;
      if (t >= tSt) { s = EX.S14; v = 0; }
      rT.textContent = 't = ' + fmt(t, 2) + ' с';
      rV.textContent = 'v = ' + fmt(v, 1) + ' м/с · ' + fmt(v * 3.6, 0) + ' км/ч';
      rS.textContent = 's = ' + fmt(s, 1) + ' м';
      attr(car.g, { transform: 'translate(' + f2(XR(s) + 102) + ' ' + GY + ')' });     // след заканчивается у заднего колеса
      var deg = (s * (XR(1) - XR(0)) / 12.5) * 180 / Math.PI;
      car.wheels.forEach(function (w) { attr(w.rot, { transform: 'rotate(' + f2(deg % 360) + ' ' + w.cx + ' -13)' }); });
      car.bl.style.opacity = ms >= 300 ? 1 : 0.35;
      attr(mk1, { width: f2(XR(s) - XR(0)) });
      var t1 = 300 + TM;
      meas.style.opacity = seg(ms, t1 + 100, t1 + 400);
      st.forEach(function (e, i) { e.style.opacity = seg(ms, t1 + 400 + i * 400, t1 + 700 + i * 400); });
      mR.r.style.opacity = st[2].style.opacity;
      fit(mS); fit(mR);
    }
    return { root: svg, render: render, period: 300 + TM + 2200, loop: false, finalMs: 300 + TM + 2200 };
  };

  /* ---------- illu-15: P(v) = 0,396·v³ Вт ---------- */
  B['illu-15'] = function (c) {
    var W = 760, H = 560, P = rid('il15'), Pf = EX.P15;
    var svg = svgRoot(c, W, H, 'Пример 4: мощность сопротивления P(v)=0,396·v³; при 30 м/с ≈10,7 кВт, при 60 м/с ≈85,5 кВт');
    var X = lin(0, 70, 90, 730), Y = lin(0, 115, 490, 56);
    axes(svg, { X: X, Y: Y, xmin: 0, xmax: 70, ymin: 0, ymax: 115, xticks: [10, 20, 30, 40, 50, 60], yticks: [20, 40, 60, 80, 100], origin: true, xlabel: 'v, м/с', ylabel: 'P, кВт' }, P);
    var area = el('path', { d: areaD(Pf, 0, 65, 160, X, Y, 0) }, svg, { fill: C.marker, 'fill-opacity': 0.45 });
    var curve = drawable(gpath(svg, pathD(Pf, 0, 65, 160, X, Y), C.navy, 4));
    var p30 = Pf(30), p60 = Pf(60), k = EX.dP15(30);
    var gd = el('g', null, svg);
    [[30, p30], [60, p60]].forEach(function (q) {
      ln(gd, X(q[0]), Y(0), X(q[0]), Y(q[1]), C.muted, 1.5, { 'stroke-dasharray': '4 6' });
      ln(gd, X(0), Y(q[1]), X(q[0]), Y(q[1]), C.muted, 1.5, { 'stroke-dasharray': '4 6' });
      var pp = point(gd, 7, C.navy); attr(pp, { cx: X(q[0]), cy: Y(q[1]) });
    });
    tx(gd, X(30) - 12, Y(p30) - 14, fmt(p30, 1) + ' кВт', { anchor: 'end', size: 21, fill: C.ink, weight: 600, halo: true });
    tx(gd, X(60) + 14, Y(p60) + 7, fmt(p60, 1) + ' кВт', { anchor: 'start', size: 21, fill: C.ink, weight: 600, halo: true });
    var tan = drawable(gpath(svg, 'M' + f2(X(20)) + ' ' + f2(Y(p30 + k * (20 - 30))) + 'L' + f2(X(40)) + ' ' + f2(Y(p30 + k * (40 - 30))), C.navy2, 3));
    var tl = el('g', null, svg);
    tx(tl, X(40) + 12, Y(p30 + k * 10) + 26, 'dP/dv ≈ ' + fmt(k, 2) + ' кВт/(м/с)', { size: 21, fill: C.navy2, weight: 600, halo: true });
    var hdr = el('g', null, svg);
    card(hdr, 110, 70, 410, 120);
    tx(hdr, 128, 108, 'P = ½CₓρSv³ = 0,396·v³ (Вт)', { size: 21, fill: C.ink });
    var bn = txs(hdr, 128, 160, [['×2 скорости', C.ink, 600], ['  →  ', C.muted], ['×8 мощности', C.navy, 600]], { size: 24 });
    var mB = mark(bn.spans[2], 6, bn);
    function render(ms) {
      drawTo(curve, eio(seg(ms, 0, 1500)));
      area.style.opacity = seg(ms, 800, 1600);
      fade([hdr], seg(ms, 200, 700));
      fade([gd], seg(ms, 1500, 1900));
      drawTo(tan, eio(seg(ms, 1900, 2500)));
      fade([tl], seg(ms, 2400, 2800));
      mB.r.style.opacity = seg(ms, 2600, 2900);
      fit(mB);
    }
    return { root: svg, render: render, period: 3000, loop: false, finalMs: 3000 };
  };

  /* ---------- illu-16: a(t)=2t и j(t)=2 на пороге комфорта ---------- */
  B['illu-16'] = function (c) {
    var W = 760, H = 560, P = rid('il16');
    var svg = svgRoot(c, W, H, 'Пример 5: ускорение a(t)=2t и рывок j=2 м/с³ ровно на пороге комфорта');
    var X = lin(0, 4.4, 90, 730), Ya = lin(0, 9, 250, 50), Yj = lin(0, 3.5, 490, 330);
    axes(svg, { X: X, Y: Ya, xmin: 0, xmax: 4.4, ymin: 0, ymax: 9, xticks: [1, 2, 3, 4], yticks: [2, 4, 6, 8], xTickLabels: false, origin: false,
      ylabel: 'a, м/с²', ylabelAt: { x: 104, y: 46, anchor: 'start' } }, P + 'a');
    tx(svg, 78, Ya(0) + 7, '0', { anchor: 'end', size: 20, fill: C.muted });
    axes(svg, { X: X, Y: Yj, xmin: 0, xmax: 4.4, ymin: 0, ymax: 3.5, xticks: [1, 2, 3, 4], yticks: [1, 2, 3], origin: true,
      xlabel: 't, с', xlabelAt: { x: 730, y: 548, anchor: 'end' }, ylabel: 'j, м/с³', ylabelAt: { x: 104, y: 326, anchor: 'start' } }, P + 'j');
    el('rect', { x: X(0), y: Yj(3.5), width: X(4.4) - X(0), height: Yj(2) - Yj(3.5) }, svg, { fill: C.brick, 'fill-opacity': 0.06 });
    var aLine = drawable(gpath(svg, pathD(EX.a16, 0, 4, 40, X, Ya), Q.a, 3.5));
    var jLine = drawable(gpath(svg, pathD(function () { return EX.j16; }, 0, 4, 2, X, Yj), Q.j, 5));
    ln(svg, X(0), Yj(2), X(4.3), Yj(2), C.brick, 2, { 'stroke-dasharray': '8 6', 'stroke-linecap': 'butt' });   // порог 2 м/с³ поверх линии j
    var thrL = tx(svg, 726, Yj(2) - 14, 'порог комфорта 2 м/с³', { anchor: 'end', size: 20, fill: C.brick, weight: 600, halo: true });
    var g3 = el('g', null, svg);
    ln(g3, X(3), Ya(6), X(3), Ya(0), C.muted, 1.5, { 'stroke-dasharray': '4 6' });
    var p3 = point(g3, 7, C.brick); attr(p3, { cx: X(3), cy: Ya(6) });
    var a3L = tx(g3, X(3) + 16, Ya(6) + 30, 'a(3) = 6 м/с²', { size: 22, fill: C.brick, weight: 600 });
    var mA = mark(a3L, 8);
    var hdr = el('g', null, svg);
    tx(hdr, 112, 92, 's = t³/3 + 5t,  v = t² + 5', { size: 21, fill: C.ink });
    tx(hdr, 112, 126, 'a(t) = v′(t) = 2t', { size: 22, fill: Q.a, weight: 600 });
    var jl = el('g', null, svg);
    var jT = txs(jl, X(0.12), Yj(2) + 44, [['j = a′(t) = 2 м/с³', C.navy, 600], [' — на границе комфорта', C.ink, 500]], { size: 21 });
    var mJ = mark(jT, 8);
    function render(ms) {
      fade([hdr], seg(ms, 100, 600));
      drawTo(aLine, eio(seg(ms, 0, 1200)));
      fade([g3], seg(ms, 1100, 1500));
      drawTo(jLine, eio(seg(ms, 1400, 2300)));
      thrL.style.opacity = seg(ms, 1200, 1600);
      fade([jl], seg(ms, 2300, 2700));
      fit(mA); fit(mJ);
    }
    return { root: svg, render: render, period: 2800, loop: false, finalMs: 2800 };
  };

  /* ---------- регистрация хуков ---------- */
  var SLIDES = { 2: ['illu-2'], 3: ['illu-3'], 4: ['illu-4'], 5: ['illu-5'], 6: ['illu-6'], 7: ['illu-7-abs', 'illu-7-exp'], 8: ['illu-8'], 9: ['illu-9'],
    12: ['illu-12'], 13: ['illu-13'], 14: ['illu-14'], 15: ['illu-15'], 16: ['illu-16'] };
  var inst = {};
  function get(id, sec) {
    var c = (sec && sec.querySelector && sec.querySelector('#' + id)) || document.getElementById(id);
    if (!c) return null;
    var I = inst[id];
    if (I && I.c === c && c.contains(I.root)) return I;
    if (I) { I.runner.stop(); if (I.root.parentNode) I.root.parentNode.removeChild(I.root); }
    I = B[id](c);
    I.c = c; I.runner = new Runner(I);
    inst[id] = I;
    return I;
  }
  Object.keys(SLIDES).forEach(function (n) {
    var ids = SLIDES[n], prev = hooks[n];
    hooks[n] = {
      enter: function (sec) {
        if (prev && prev.enter) try { prev.enter(sec); } catch (e) { console.error(e); }
        ids.forEach(function (id) { try { var I = get(id, sec); if (I) I.runner.start(); } catch (e) { console.error('[illustrations] ' + id, e); } });
      },
      leave: function (sec) {
        if (prev && prev.leave) try { prev.leave(sec); } catch (e) { console.error(e); }
        ids.forEach(function (id) { if (inst[id]) inst[id].runner.stop(); });
      }
    };
  });

  /* для проверки: ILLU.renderAt('illu-4', 2500) рисует кадр в момент 2,5 с */
  window.ILLU = {
    renderAt: function (id, ms) { var I = get(id); if (I) { I.runner.stop(); I.render(ms, false); } return !!I; },
    math: { sPath: sPath, vel: vel, simABS: simABS, a9sharp: a9sharp, a9smooth: a9smooth, deriv: deriv, EX: EX }
  };
})();
