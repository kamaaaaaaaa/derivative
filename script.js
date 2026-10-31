/* «Производная в физике» — ядро презентации */
window.slideHooks = window.slideHooks || {};
window.REDUCED = matchMedia('(prefers-reduced-motion: reduce)').matches;

(function () {
  'use strict';

  var W = 1920, H = 1080, LEAVE_MS = 700;
  var deck, slides = [], total = 0, current = 0;
  var leaveTimers = {};
  var notesPanel, notesBody, notesTitle, counterEl, progressEl, prevBtn, nextBtn, rulerBtns = [];

  /* ---------- масштаб ---------- */
  // Карточка 1920×1080 вписывается в окно с полями: по бокам — место под стрелки,
  // снизу — под прогресс и счётчик.
  function fit() {
    var w = window.innerWidth, h = window.innerHeight;
    var gx = Math.max(56, Math.min(120, w * 0.06));
    var top = Math.max(10, Math.min(36, h * 0.03));
    var bottom = Math.max(28, Math.min(52, h * 0.05));
    var s = Math.max(0.1, Math.min((w - 2 * gx) / W, (h - top - bottom) / H));
    var cardW = W * s, cardH = H * s;
    var deckTop = top + (h - top - bottom) / 2;
    var gutter = (w - cardW) / 2;
    var arrow = Math.round(Math.max(40, Math.min(64, gutter * 0.62)));
    var root = document.documentElement.style;
    deck.style.setProperty('--scale', s);
    deck.style.setProperty('--deck-top', deckTop + 'px');
    root.setProperty('--card-w', cardW + 'px');
    root.setProperty('--arrow', arrow + 'px');
    root.setProperty('--arrow-x', Math.max(6, (gutter - arrow) / 2) + 'px');
    root.setProperty('--hud-bottom', Math.max(4, (h - (deckTop + cardH / 2)) / 2 - 9) + 'px');
  }

  /* ---------- хуки иллюстраций ---------- */
  function hook(n, kind, el) {
    var h = window.slideHooks && window.slideHooks[n];
    if (!h || typeof h[kind] !== 'function') return;
    try { h[kind](el); } catch (e) { console.error('slideHooks[' + n + '].' + kind + ':', e); }
  }

  /* ---------- подготовка ---------- */
  function prepare() {
    slides.forEach(function (sec) {
      sec.querySelectorAll('.reveal').forEach(function (el, i) {
        el.style.setProperty('--i', i);
      });
      sec.querySelectorAll('[data-step]').forEach(function (el) {
        var st = parseInt(el.getAttribute('data-step'), 10) || 1;
        el.style.setProperty('--step', st);
      });
    });
  }

  function renderMath() {
    if (typeof window.renderMathInElement !== 'function') {
      console.warn('KaTeX auto-render не загружен');
      return;
    }
    window.renderMathInElement(document.body, {
      delimiters: [
        { left: '\\[', right: '\\]', display: true },
        { left: '\\(', right: '\\)', display: false }
      ],
      throwOnError: false,
      ignoredTags: ['script', 'noscript', 'style', 'textarea', 'pre', 'code', 'option', 'svg']
    });
  }

  /* ---------- риски-навигация ---------- */
  function buildRuler() {
    var ruler = document.getElementById('ruler');
    if (!ruler) return;
    for (var i = 0; i < total; i++) {
      var b = document.createElement('button');
      b.type = 'button';
      b.setAttribute('aria-label', 'Слайд ' + (i + 1));
      b.dataset.go = i;
      b.addEventListener('click', function (e) {
        e.stopPropagation();
        go(parseInt(this.dataset.go, 10));
      });
      ruler.appendChild(b);
      rulerBtns.push(b);
    }
  }

  /* ---------- слайд-викторина: карточки с ответами ---------- */
  function setQuestion(btn, open) {
    btn.setAttribute('aria-expanded', open ? 'true' : 'false');
  }
  function toggleQuestion(btn) {
    setQuestion(btn, btn.getAttribute('aria-expanded') !== 'true');
  }
  function resetQuiz(sec) {
    var quiz = sec.querySelector('.quiz');
    if (!quiz) return;
    quiz.classList.add('no-anim');
    quiz.querySelectorAll('.qcard').forEach(function (b) { setQuestion(b, false); });
    void quiz.offsetWidth;
    quiz.classList.remove('no-anim');
  }
  function setupQuiz() {
    document.querySelectorAll('.qcard').forEach(function (b) {
      b.addEventListener('click', function (e) {
        e.stopPropagation();
        toggleQuestion(b);
      });
      b.addEventListener('pointerdown', function (e) { e.stopPropagation(); });
    });
  }

  /* ---------- служебные подписи в углах ---------- */
  function buildCorners() {
    slides.forEach(function (sec) {
      var n = +sec.dataset.n;
      var l = document.createElement('div');
      l.className = 'corner corner-l';
      l.setAttribute('aria-hidden', 'true');
      l.textContent = 'Производная в физике';
      var r = document.createElement('div');
      r.className = 'corner corner-r';
      r.setAttribute('aria-hidden', 'true');
      r.textContent = sec.dataset.tag && n !== 1 ? sec.dataset.tag : 'Слайд ' + (n < 10 ? '0' + n : n);
      sec.insertBefore(r, sec.firstChild);
      sec.insertBefore(l, sec.firstChild);
    });
  }

  function updateChrome() {
    counterEl.textContent = (current + 1) + ' / ' + total;
    progressEl.style.transform = 'scaleX(' + ((current + 1) / total) + ')';
    prevBtn.disabled = current === 0;
    nextBtn.disabled = current === total - 1;
    rulerBtns.forEach(function (b, i) {
      b.classList.toggle('is-current', i === current);
      b.classList.toggle('is-past', i < current);
      if (i === current) b.setAttribute('aria-current', 'step'); else b.removeAttribute('aria-current');
    });
    updateNotes();
  }

  function updateNotes() {
    if (!notesPanel || notesPanel.hidden) return;
    var sec = slides[current];
    var notes = sec.querySelector('.notes');
    var h = sec.querySelector('h1, h2');
    notesTitle.textContent = (current + 1) + ' / ' + total + (h ? ' — ' + h.textContent.replace(/\s+/g, ' ').trim() : '');
    notesBody.innerHTML = notes ? notes.innerHTML : '<em>Заметок нет</em>';
  }

  function toggleNotes(force) {
    var show = typeof force === 'boolean' ? force : notesPanel.hidden;
    notesPanel.hidden = !show;
    if (show) updateNotes();
  }

  /* ---------- смена слайда ---------- */
  function activate(sec) {
    // мгновенно сбросить в исходное положение (без перехода), затем запустить вход
    clearTimeout(leaveTimers[sec.dataset.n]);
    sec.classList.add('no-trans', 'is-reset');
    sec.classList.remove('is-leaving', 'is-active');
    void sec.offsetWidth;
    sec.classList.remove('no-trans', 'is-reset');
    void sec.offsetWidth;
    sec.classList.add('is-active');
    sec.removeAttribute('aria-hidden');
    sec.inert = false;
  }

  function deactivate(sec) {
    sec.classList.remove('is-active');
    sec.classList.add('is-leaving');
    sec.setAttribute('aria-hidden', 'true');
    sec.inert = true;
    var key = sec.dataset.n;
    clearTimeout(leaveTimers[key]);
    leaveTimers[key] = setTimeout(function () {
      sec.classList.remove('is-leaving');
      resetQuiz(sec);
    }, window.REDUCED ? 200 : LEAVE_MS);
  }

  function go(idx, opts) {
    opts = opts || {};
    idx = Math.max(0, Math.min(total - 1, idx));
    if (idx === current && !opts.force) return;
    var prev = slides[current];
    var next = slides[idx];
    deck.setAttribute('data-dir', idx >= current ? 'fwd' : 'back');

    if (prev && prev !== next) {
      deactivate(prev);
      hook(+prev.dataset.n, 'leave', prev);
    }
    current = idx;
    activate(next);
    hook(+next.dataset.n, 'enter', next);

    if (!opts.fromHash) {
      var h = '#' + (idx + 1);
      if (location.hash !== h) history.replaceState(null, '', h);
    }
    updateChrome();
  }

  function next() { go(current + 1); }
  function prev() { go(current - 1); }

  function indexFromHash() {
    var n = parseInt((location.hash || '').replace('#', ''), 10);
    if (isNaN(n)) return 0;
    return Math.max(0, Math.min(total - 1, n - 1));
  }

  /* ---------- ввод ---------- */
  function isTyping(t) {
    if (!t) return false;
    var tag = (t.tagName || '').toLowerCase();
    return tag === 'input' || tag === 'textarea' || tag === 'select' || t.isContentEditable;
  }

  function toggleFullscreen() {
    var d = document;
    if (d.fullscreenElement || d.webkitFullscreenElement) {
      (d.exitFullscreen || d.webkitExitFullscreen).call(d);
    } else {
      var el = d.documentElement;
      var req = el.requestFullscreen || el.webkitRequestFullscreen;
      if (req) {
        var p = req.call(el);
        if (p && p.catch) p.catch(function () {});
      }
    }
  }

  function onKey(e) {
    if (isTyping(e.target)) return;
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    var k = e.key;
    // пробел/Enter на сфокусированной кнопке — штатное нажатие этой кнопки
    if ((k === ' ' || k === 'Enter') && e.target && e.target.closest && e.target.closest('button')) return;
    // клавиши 1–5 (верхний ряд и Numpad) открывают ответы — только на слайде с викториной
    var m = /^(?:Digit|Numpad)([1-9])$/.exec(e.code || '');
    var digit = m ? m[1] : (/^[1-9]$/.test(k) ? k : null);
    if (digit) {
      var card = slides[current].querySelector('.qcard[data-q="' + digit + '"]');
      if (card) { toggleQuestion(card); e.preventDefault(); }
      return;
    }
    switch (k) {
      case 'ArrowRight': case 'PageDown': next(); break;
      case 'ArrowLeft': case 'PageUp': prev(); break;
      case ' ': case 'Spacebar':
        if (e.shiftKey) prev(); else next();
        break;
      case 'Home': go(0); break;
      case 'End': go(total - 1); break;
      case 'f': case 'F': case 'а': case 'А': toggleFullscreen(); break;
      case 'n': case 'N': case 'т': case 'Т': toggleNotes(); break;
      case 'Escape':
        if (!notesPanel.hidden) toggleNotes(false); else return;
        break;
      default: return;
    }
    e.preventDefault();
  }

  function setupSwipe() {
    var area = document.getElementById('stage') || deck;
    var sx = 0, sy = 0, active = false, pid = null;
    function decide(dx, dy) {
      if (Math.abs(dx) >= 50 && Math.abs(dx) > Math.abs(dy) * 1.2) {
        if (dx < 0) next(); else prev();
      }
    }
    if (window.PointerEvent) {
      area.addEventListener('pointerdown', function (e) {
        if (e.pointerType === 'mouse' && e.button !== 0) return;
        if (e.target.closest('button, a')) return;
        active = true; pid = e.pointerId; sx = e.clientX; sy = e.clientY;
      });
      window.addEventListener('pointerup', function (e) {
        if (!active || e.pointerId !== pid) return;
        active = false;
        decide(e.clientX - sx, e.clientY - sy);
      });
      window.addEventListener('pointercancel', function () { active = false; });
    } else {
      // старые мобильные браузеры без Pointer Events
      area.addEventListener('touchstart', function (e) {
        if (e.touches.length !== 1) { active = false; return; }
        active = true; sx = e.touches[0].clientX; sy = e.touches[0].clientY;
      }, { passive: true });
      area.addEventListener('touchend', function (e) {
        if (!active) return;
        active = false;
        var t = e.changedTouches[0];
        decide(t.clientX - sx, t.clientY - sy);
      }, { passive: true });
    }
  }

  // горизонтальная прокрутка тачпада / колеса (deltaX), с дебаунсом
  function setupWheel() {
    var acc = 0, lastNav = 0, resetT = null;
    window.addEventListener('wheel', function (e) {
      if (notesPanel && !notesPanel.hidden && notesPanel.contains(e.target)) return;
      var dx = e.deltaX, dy = e.deltaY;
      if (e.shiftKey && !dx) dx = dy;               // Shift+колесо = горизонталь
      if (Math.abs(dx) <= Math.abs(dy)) return;
      e.preventDefault();
      acc += dx;
      clearTimeout(resetT);
      resetT = setTimeout(function () { acc = 0; }, 200);
      var now = Date.now();
      if (now - lastNav < 600) return;
      if (Math.abs(acc) >= 40) {
        if (acc > 0) next(); else prev();
        lastNav = now;
        acc = 0;
      }
    }, { passive: false });
  }

  /* ---------- старт ---------- */
  function init() {
    deck = document.getElementById('deck');
    slides = Array.prototype.slice.call(deck.querySelectorAll('.slide'));
    total = slides.length;
    notesPanel = document.getElementById('notes-panel');
    notesBody = document.getElementById('notes-body');
    notesTitle = document.getElementById('notes-title');
    counterEl = document.getElementById('counter');
    progressEl = document.getElementById('progress');
    prevBtn = document.getElementById('prev');
    nextBtn = document.getElementById('next');

    prevBtn.addEventListener('click', function (e) { e.stopPropagation(); prev(); });
    nextBtn.addEventListener('click', function (e) { e.stopPropagation(); next(); });

    slides.forEach(function (s) { s.setAttribute('aria-hidden', 'true'); s.inert = true; });

    renderMath();
    prepare();
    buildCorners();
    buildRuler();
    setupQuiz();
    fit();
    window.addEventListener('resize', fit);
    document.addEventListener('keydown', onKey);
    window.addEventListener('hashchange', function () {
      var i = indexFromHash();
      if (i !== current) go(i, { fromHash: true });
    });
    setupSwipe();
    setupWheel();

    current = indexFromHash();
    go(current, { force: true, fromHash: true });
  }

  // defer-скрипты выполняются при readyState === 'interactive', ДО DOMContentLoaded:
  // ждём событие, чтобы illustrations.js успел зарегистрировать хуки.
  if (document.readyState === 'complete') init();
  else document.addEventListener('DOMContentLoaded', init);
})();
