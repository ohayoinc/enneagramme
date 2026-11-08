/*
 * Mesure d'audience — enneagramme.co
 *
 * Google Analytics 4, chargé UNIQUEMENT après consentement explicite du visiteur
 * (Loi 25 du Québec / RGPD). Tant que le visiteur n'a pas accepté, aucun script
 * Google n'est chargé et aucun témoin n'est déposé.
 *
 * Pour activer : renseigner GA_MEASUREMENT_ID ci-dessous (format « G-XXXXXXXXXX »,
 * visible dans GA4 > Administration > Flux de données > Web).
 * Laisser vide = mesure désactivée et bandeau masqué.
 */
(function () {
  'use strict';

  var GA_MEASUREMENT_ID = 'G-YSH1XBCB1S';
  var STORAGE_KEY = 'ennea-consent-v1';
  var CONSENT_MAX_AGE_DAYS = 395; // ~13 mois, durée maximale recommandée

  if (!GA_MEASUREMENT_ID) return;

  function readConsent() {
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return null;
      var data = JSON.parse(raw);
      if (!data || !data.date) return null;
      var ageDays = (Date.now() - data.date) / 86400000;
      if (ageDays > CONSENT_MAX_AGE_DAYS) return null;
      return data.value; // 'granted' | 'denied'
    } catch (e) {
      return null;
    }
  }

  function saveConsent(value) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ value: value, date: Date.now() }));
    } catch (e) { /* stockage indisponible : le bandeau réapparaîtra */ }
  }

  var loaded = false;
  function loadAnalytics() {
    if (loaded) return;
    loaded = true;
    window.dataLayer = window.dataLayer || [];
    window.gtag = function () { window.dataLayer.push(arguments); };
    window.gtag('js', new Date());
    window.gtag('config', GA_MEASUREMENT_ID, { anonymize_ip: true });
    var s = document.createElement('script');
    s.async = true;
    s.src = 'https://www.googletagmanager.com/gtag/js?id=' + encodeURIComponent(GA_MEASUREMENT_ID);
    document.head.appendChild(s);
    trackClicks();
  }

  function deleteGaCookies() {
    document.cookie.split(';').forEach(function (c) {
      var name = c.split('=')[0].trim();
      if (name.indexOf('_ga') === 0) {
        var host = location.hostname.replace(/^www\./, '');
        ['', '; domain=' + host, '; domain=.' + host].forEach(function (d) {
          document.cookie = name + '=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/' + d;
        });
      }
    });
  }

  /* Événements utiles au suivi des conversions (prise de contact, inscriptions). */
  function trackClicks() {
    document.addEventListener('click', function (e) {
      var a = e.target.closest && e.target.closest('a[href]');
      if (!a || !window.gtag) return;
      var href = a.getAttribute('href') || '';
      if (href.indexOf('mailto:') === 0) {
        window.gtag('event', 'contact_email', { link_url: href });
      } else if (href.indexOf('tel:') === 0) {
        window.gtag('event', 'contact_phone', { link_url: href });
      } else if (/calendly|zcal|cal\.com|tidycal|acuityscheduling|eventbrite|zeffy|stripe|paypal/i.test(href)) {
        window.gtag('event', 'booking_click', { link_url: a.href, link_text: (a.textContent || '').trim().slice(0, 80) });
      } else if (a.hostname && a.hostname !== location.hostname) {
        window.gtag('event', 'outbound_click', { link_url: a.href });
      }
    }, true);
  }

  var banner;
  function hideBanner() {
    if (banner && banner.parentNode) banner.parentNode.removeChild(banner);
    banner = null;
  }

  function showBanner() {
    if (banner) return;
    banner = document.createElement('div');
    banner.setAttribute('role', 'dialog');
    banner.setAttribute('aria-live', 'polite');
    banner.setAttribute('aria-label', 'Témoins de mesure d’audience');
    banner.style.cssText = [
      'position:fixed', 'left:16px', 'right:16px', 'bottom:16px', 'z-index:9999',
      'max-width:560px', 'margin:0 auto', 'padding:18px 20px',
      'background:#0e0e0e', 'color:#e5e2e1', 'border:0.5px solid #474747',
      'font:14px/1.5 system-ui,-apple-system,"Segoe UI",sans-serif',
      'box-shadow:0 8px 30px rgba(0,0,0,.5)'
    ].join(';');
    banner.innerHTML =
      '<p style="margin:0 0 14px">J’utilise des témoins de mesure d’audience (Google Analytics) ' +
      'pour comprendre quelles pages vous sont utiles et améliorer le site. Ils ne sont déposés qu’avec votre accord. ' +
      '<a href="confidentialite.html#cookies" style="color:#fff;text-decoration:underline">En savoir plus</a></p>' +
      '<div style="display:flex;gap:10px;flex-wrap:wrap;justify-content:flex-end">' +
      '<button type="button" data-consent="denied" style="cursor:pointer;padding:9px 16px;background:transparent;color:#e5e2e1;border:0.5px solid #919191;font:inherit">Refuser</button>' +
      '<button type="button" data-consent="granted" style="cursor:pointer;padding:9px 16px;background:#fff;color:#000;border:0.5px solid #fff;font:inherit">Accepter</button>' +
      '</div>';
    banner.addEventListener('click', function (e) {
      var v = e.target.getAttribute && e.target.getAttribute('data-consent');
      if (!v) return;
      saveConsent(v);
      hideBanner();
      if (v === 'granted') {
        loadAnalytics();
      } else {
        deleteGaCookies();
        if (loaded) location.reload(); // décharge gtag déjà présent
      }
    });
    document.body.appendChild(banner);
  }

  /* Lien « Gérer mes témoins » : tout élément portant l'attribut data-consent-open. */
  document.addEventListener('click', function (e) {
    var el = e.target.closest && e.target.closest('[data-consent-open]');
    if (!el) return;
    e.preventDefault();
    showBanner();
  });

  function init() {
    var consent = readConsent();
    if (consent === 'granted') loadAnalytics();
    else if (consent === null) showBanner();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
