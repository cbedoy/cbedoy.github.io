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

  if (!('IntersectionObserver' in window)) return;

  // Fade-in content as it scrolls into view.
  var targets = document.querySelectorAll('.stat, .section-head, .prose, .now, .feature, .job, .edu, .craft, .beyond, .verse, .contact-lead, .contact-mail, .langs, .socials');
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
