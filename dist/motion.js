/* ════════════════════════════════════════════════════════════════
   ENNÉAGRAMME — mouvements doux
   Apparitions au défilement, titres mot à mot, images en rideau,
   en-tête qui s'efface, transitions de page, curseur d'encre.
   Tout est désactivé si l'utilisateur préfère réduire les animations.
   ════════════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  var root = document.documentElement;
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (!('IntersectionObserver' in window)) return;
  root.classList.add('motion');

  function ready(fn) {
    if (document.readyState !== 'loading') fn();
    else document.addEventListener('DOMContentLoaded', fn);
  }

  ready(function () {
    var main = document.querySelector('main') || document.body;

    /* ───── 1. Titres découpés en mots ───── */
    function splitWords(el) {
      var i = 0;
      (function walk(node) {
        Array.prototype.slice.call(node.childNodes).forEach(function (child) {
          if (child.nodeType === 3) {
            var parts = child.textContent.split(/(\s+)/);
            var frag = document.createDocumentFragment();
            parts.forEach(function (p) {
              if (!p) return;
              if (/^\s+$/.test(p)) { frag.appendChild(document.createTextNode(' ')); return; }
              var w = document.createElement('span');
              w.className = 'w';
              var inner = document.createElement('span');
              inner.textContent = p;
              inner.style.setProperty('--d', (i++ * 0.07).toFixed(2) + 's');
              w.appendChild(inner);
              frag.appendChild(w);
            });
            node.replaceChild(frag, child);
          } else if (child.nodeType === 1 && child.tagName !== 'BR') {
            walk(child);
          }
        });
      })(el);
      el.classList.add('split');
    }

    var headings = main.querySelectorAll('h1.font-headline, .h-display, .title-xl, .h-statement, .cta-panel h2, section > div h2.font-headline:not([style*="clamp(20px"])');
    Array.prototype.forEach.call(headings, function (h) {
      if (h.closest('a, button, .faq-item')) return;
      if (h.textContent.length > 140) return;
      splitWords(h);
    });

    /* ───── 2. Éléments à révéler ───── */
    var SEL = [
      '.card', '.post', '.quote', '.steps li', '.tile', '.feature', '.stats', '.emblem', '.cta-panel form', '.faq-item',
      'h1', 'h2', 'h3', 'h4', 'p', 'blockquote', 'li', 'figure', 'img',
      'a.group', 'article', '.faq-item', 'table',
      'section > .grid > div', 'section > .flex > a', '.w-px', '.h-px', 'span.font-label.block'
    ].join(',');

    var claimed = [];
    Array.prototype.forEach.call(main.querySelectorAll(SEL), function (el) {
      if (el.closest('.faq-ans, header, nav, #mobile-menu, .finder')) return;
      if (el.parentElement && el.parentElement.closest('.rv, .rv-img, .split')) return;
      if (el.classList.contains('split')) { claimed.push(el); return; }

      if (el.tagName === 'IMG') {
        var frame = el.parentElement;
        if (frame && frame.children.length === 1 && frame !== main) {
          frame.classList.add('rv-img', 'img-frame');
          claimed.push(frame);
        } else {
          el.classList.add('rv'); claimed.push(el);
        }
        return;
      }
      if (el.classList.contains('w-px')) { el.classList.add('rv-vline'); claimed.push(el); return; }
      if (el.classList.contains('h-px')) { el.classList.add('rv-line'); claimed.push(el); return; }
      // un conteneur de grille qui contient des titres déjà traités : on laisse les enfants vivre
      if (el.matches('section > .grid > div') && el.querySelector('.split, h1, h2, h3, p')) return;
      el.classList.add('rv');
      claimed.push(el);
    });

    if (reduce) {
      claimed.forEach(function (el) { el.classList.add('in'); });
    } else {
      var io = new IntersectionObserver(function (entries) {
        var batch = entries.filter(function (e) { return e.isIntersecting; })
          .sort(function (a, b) { return a.boundingClientRect.top - b.boundingClientRect.top || a.boundingClientRect.left - b.boundingClientRect.left; });
        batch.forEach(function (e, i) {
          var el = e.target;
          if (!el.classList.contains('split')) el.style.setProperty('--d', Math.min(i * 0.11, 0.66).toFixed(2) + 's');
          el.classList.add('in');
          io.unobserve(el);
        });
      }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
      claimed.forEach(function (el) { io.observe(el); });
    }

    /* ───── 3. En-tête : se resserre, s'efface en descendant ───── */
    var header = document.querySelector('header.sticky');
    var menu = document.getElementById('mobile-menu');
    var hero = main.querySelector('section');
    var heroArt = hero && hero.querySelector('.absolute.pointer-events-none');
    var lastY = window.scrollY, ticking = false;

    function onScroll() {
      var y = window.scrollY;
      if (header) {
        header.classList.toggle('is-scrolled', y > 40);
        var menuOpen = menu && menu.style.display === 'flex';
        if (!menuOpen && y > 480 && y - lastY > 4) header.classList.add('is-hidden');
        else if (lastY - y > 4 || y < 480) header.classList.remove('is-hidden');
      }
      if (heroArt && !reduce && y < window.innerHeight * 1.2) {
        heroArt.style.transform = 'translate3d(0,' + (y * 0.12).toFixed(1) + 'px,0)';
      }
      lastY = y;
      ticking = false;
    }
    window.addEventListener('scroll', function () {
      if (!ticking) { ticking = true; requestAnimationFrame(onScroll); }
    }, { passive: true });
    onScroll();

    if (typeof window.toggleMenu === 'function' && menu) {
      var original = window.toggleMenu;
      window.toggleMenu = function () {
        original.apply(this, arguments);
        menu.classList.toggle('is-open', menu.style.display === 'flex');
        if (header) header.classList.remove('is-hidden');
      };
    }

    if (reduce) return;

    /* ───── 4. Transitions entre les pages ───── */
    document.addEventListener('click', function (e) {
      var a = e.target.closest && e.target.closest('a[href]');
      if (!a || e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      if (a.target && a.target !== '_self') return;
      if (a.hasAttribute('download')) return;
      var href = a.getAttribute('href');
      if (!href || href.charAt(0) === '#' || /^(mailto:|tel:|javascript:)/i.test(href)) return;
      var url = new URL(a.href, location.href);
      if (url.origin !== location.origin) return;
      if (url.pathname === location.pathname && url.hash) return;
      e.preventDefault();
      root.classList.add('is-leaving');
      setTimeout(function () { location.href = url.href; }, 520);
    });
    window.addEventListener('pageshow', function () { root.classList.remove('is-leaving'); });

    /* ───── 5. Curseur d'encre ───── */
    if (window.matchMedia('(pointer: fine)').matches) {
      var dot = document.createElement('div');
      dot.id = 'cursor';
      dot.setAttribute('aria-hidden', 'true');
      document.body.appendChild(dot);
      root.classList.add('has-cursor');
      var tx = -100, ty = -100, cx = -100, cy = -100, running = false;
      function loop() {
        cx += (tx - cx) * 0.2;
        cy += (ty - cy) * 0.2;
        dot.style.transform = 'translate3d(' + cx.toFixed(1) + 'px,' + cy.toFixed(1) + 'px,0)';
        if (Math.abs(tx - cx) > 0.1 || Math.abs(ty - cy) > 0.1) requestAnimationFrame(loop);
        else running = false;
      }
      document.addEventListener('mousemove', function (e) {
        tx = e.clientX; ty = e.clientY;
        dot.classList.add('on');
        if (!running) { running = true; requestAnimationFrame(loop); }
      }, { passive: true });
      document.addEventListener('mouseleave', function () { dot.classList.remove('on'); });
      document.addEventListener('mouseover', function (e) {
        var t = e.target.closest && e.target.closest('a, button, [role="button"], .faq-q, .cursor-pointer, label, summary');
        dot.classList.toggle('hover', !!t);
      });
    }
  });
})();
