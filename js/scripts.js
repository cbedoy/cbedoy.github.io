(function () {
  var root = document.documentElement;
  root.classList.add('js');

  // Theme toggle (respects system preference until the visitor chooses).
  var toggle = document.querySelector('.theme-toggle');
  if (toggle) {
    toggle.addEventListener('click', function () {
      var current = root.dataset.theme ||
        (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
      var next = current === 'dark' ? 'light' : 'dark';
      root.dataset.theme = next;
      try { localStorage.setItem('theme', next); } catch (e) {}
    });
  }

  // Top bar border once scrolled.
  var bar = document.querySelector('.topbar');
  var onScroll = function () { bar.classList.toggle('scrolled', window.scrollY > 8); };
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  // Footer year.
  var y = document.getElementById('year');
  if (y) y.textContent = new Date().getFullYear();

  // ---------- Language (EN in the HTML, ES/IT from js/i18n.js) ----------
  var I18N = window.I18N || {};
  var LANGS = ['en', 'es', 'it'];
  var original = {};
  var i18nEls = document.querySelectorAll('[data-i18n]');
  i18nEls.forEach(function (el, i) { original[i] = el.innerHTML; });
  var metaEls = document.querySelectorAll('.role-meta, .role-when, .co-meta, .co-where');
  var metaText = [];
  metaEls.forEach(function (el) {
    var nodes = [];
    var walk = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
    while (walk.nextNode()) nodes.push([walk.currentNode, walk.currentNode.nodeValue]);
    metaText.push(nodes);
  });
  var baseTitle = document.title;

  // LinkedIn-style durations ("2 yrs 3 mos"), counting both end months.
  var now = new Date();
  var ym = function (v) { var p = v.split('-'); return +p[0] * 12 + (+p[1] - 1); };
  function renderDurations(dict) {
    var yr = dict._yr || ['yr', 'yrs'], mo = dict._mo || ['mo', 'mos'];
    document.querySelectorAll('.dur[data-start]').forEach(function (el) {
      var end = el.dataset.end ? ym(el.dataset.end) : now.getFullYear() * 12 + now.getMonth();
      var m = end - ym(el.dataset.start) + 1;
      var y = Math.floor(m / 12), r = m % 12, out = [];
      if (y) out.push(y + ' ' + yr[y === 1 ? 0 : 1]);
      if (r) out.push(r + ' ' + mo[r === 1 ? 0 : 1]);
      el.textContent = out.join(' ');
    });
  }

  function setLang(lang, remember) {
    if (LANGS.indexOf(lang) < 0) lang = 'en';
    var dict = lang === 'en' ? {} : (I18N[lang] || {});
    i18nEls.forEach(function (el, i) {
      var key = el.getAttribute('data-i18n');
      el.innerHTML = dict[key] != null ? dict[key] : original[i];
    });
    var phrases = dict._phrases || [];
    metaText.forEach(function (nodes) {
      nodes.forEach(function (n) {
        var v = n[1];
        phrases.forEach(function (ph) { v = v.split(ph[0]).join(ph[1]); });
        n[0].nodeValue = v;
      });
    });
    renderDurations(dict);
    root.lang = lang;
    root.style.setProperty('--see-less', JSON.stringify(dict._less || 'see less'));
    document.title = dict._title || baseTitle;
    document.querySelectorAll('.lang button').forEach(function (b) {
      b.setAttribute('aria-pressed', b.dataset.lang === lang ? 'true' : 'false');
    });
    if (remember) {
      try { localStorage.setItem('lang', lang); } catch (e) {}
      try {
        var url = new URL(location.href);
        if (lang === 'en') url.searchParams.delete('lang'); else url.searchParams.set('lang', lang);
        history.replaceState(null, '', url);
      } catch (e) {}
    }
  }

  function initialLang() {
    try { var q = new URLSearchParams(location.search).get('lang'); if (LANGS.indexOf(q) >= 0) return q; } catch (e) {}
    try { var s = localStorage.getItem('lang'); if (LANGS.indexOf(s) >= 0) return s; } catch (e) {}
    var prefs = navigator.languages || [navigator.language || 'en'];
    for (var i = 0; i < prefs.length; i++) {
      var code = String(prefs[i]).slice(0, 2).toLowerCase();
      if (LANGS.indexOf(code) >= 0) return code;
    }
    return 'en';
  }

  document.querySelectorAll('.lang button').forEach(function (b) {
    b.addEventListener('click', function () { setLang(b.dataset.lang, true); });
  });
  setLang(initialLang(), false);

  // Gallery lightbox (links still open Pexels without JS or <dialog> support).
  var box = document.querySelector('.lightbox');
  if (box && typeof box.showModal === 'function') {
    var boxImg = box.querySelector('img');
    var boxCap = box.querySelector('.lightbox-cap span');
    var boxLink = box.querySelector('.lightbox-cap a');
    document.querySelectorAll('.shot a').forEach(function (a) {
      a.addEventListener('click', function (ev) {
        ev.preventDefault();
        var img = a.querySelector('img');
        boxImg.src = a.dataset.full || img.currentSrc || img.src;
        boxImg.alt = img.alt;
        boxCap.textContent = a.parentNode.querySelector('figcaption').textContent;
        boxLink.href = a.href;
        box.showModal();
      });
    });
    box.addEventListener('click', function (ev) { if (ev.target === box) box.close(); });
    box.addEventListener('close', function () { boxImg.removeAttribute('src'); });
  }

  if (!('IntersectionObserver' in window)) return;

  // Fade-in content as it scrolls into view.
  var targets = document.querySelectorAll('.stat, .section-head, .prose, .now, .feature, .co, .sub-head, .craft, .beyond, .verse, .shot, .online-lead, .web, .online-note, .contact-lead, .contact-mail, .langs, .socials');
  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (e) {
      if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
    });
  }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
  targets.forEach(function (el, i) {
    el.classList.add('fade');
    el.style.transitionDelay = (i % 3) * 70 + 'ms';
    io.observe(el);
  });

  // Highlight the current section in the nav.
  var links = {};
  document.querySelectorAll('.nav a').forEach(function (a) { links[a.getAttribute('href').slice(1)] = a; });
  var spy = new IntersectionObserver(function (entries) {
    entries.forEach(function (e) {
      var link = links[e.target.id];
      if (link && e.isIntersecting) {
        Object.keys(links).forEach(function (k) { links[k].classList.remove('active'); });
        link.classList.add('active');
      }
    });
  }, { rootMargin: '-45% 0px -50% 0px' });
  Object.keys(links).forEach(function (id) {
    var s = document.getElementById(id);
    if (s) spy.observe(s);
  });
})();
