/*
 * Lecteur vidéo léger : la miniature est servie par le site et rien n'est chargé
 * depuis YouTube avant le clic. Au clic, le lecteur youtube-nocookie.com remplace
 * la miniature et démarre la lecture.
 */
(function () {
  'use strict';
  document.addEventListener('click', function (ev) {
    var btn = ev.target.closest && ev.target.closest('.video__play[data-video]');
    if (!btn) return;
    ev.preventDefault();
    var id = btn.getAttribute('data-video');
    var iframe = document.createElement('iframe');
    iframe.src = 'https://www.youtube-nocookie.com/embed/' + encodeURIComponent(id) + '?autoplay=1&rel=0&modestbranding=1';
    iframe.title = (btn.getAttribute('aria-label') || 'Vidéo').replace(/^Lire la vidéo : /, '');
    iframe.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share';
    iframe.allowFullscreen = true;
    iframe.className = 'video__frame';
    btn.replaceWith(iframe);
    iframe.focus();
    if (window.gtag) window.gtag('event', 'video_start', { video_id: id, page_path: location.pathname });
  });
})();
