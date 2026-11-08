// Formulaires d'inscription à l'infolettre (Brevo, via /api/newsletter.php)
(function () {
  document.querySelectorAll('form[data-newsletter]').forEach(function (form) {
    var status = form.querySelector('[data-newsletter-status]');
    var button = form.querySelector('button[type="submit"]');
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      if (!form.reportValidity()) return;
      button.disabled = true;
      status.textContent = 'Envoi…';
      fetch(form.action, { method: 'POST', body: new FormData(form), headers: { 'Accept': 'application/json' } })
        .then(function (r) { return r.json().catch(function () { return { ok: false }; }); })
        .then(function (d) {
          status.textContent = d.message || (d.ok ? 'Merci !' : 'Une erreur est survenue. Réessayez plus tard.');
          if (d.ok) form.reset();
        })
        .catch(function () { status.textContent = 'Connexion impossible. Réessayez plus tard.'; })
        .finally(function () { button.disabled = false; });
    });
  });
})();
