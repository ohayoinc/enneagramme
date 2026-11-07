/*
 * Petit chatbot de prise de contact — enneagramme.co
 * Pose quelques questions, puis envoie la demande à /api/whatsapp.php,
 * qui la transmet à Benjamin sur WhatsApp.
 * Fichier autonome : il injecte son propre CSS. À inclure avec
 *   <script src="/chatbot/chatbot.js" defer></script>
 */
(function () {
  'use strict';
  if (window.__enneaChatbot) return;
  window.__enneaChatbot = true;

  var ENDPOINT = '/api/whatsapp.php';
  var EMAIL_SECOURS = 'benjamin@enneagramme.co';

  var BESOINS = [
    'Un atelier',
    'Un accompagnement individuel',
    'Ennéagramme en couple',
    'Équipe ou organisation',
    'Autre question'
  ];
  var CANAUX = [
    { label: 'WhatsApp', type: 'tel', placeholder: '+1 514 555 1234', autocomplete: 'tel' },
    { label: 'Téléphone', type: 'tel', placeholder: '+1 514 555 1234', autocomplete: 'tel' },
    { label: 'Courriel', type: 'email', placeholder: 'vous@exemple.com', autocomplete: 'email' }
  ];

  var css = '' +
    '#ec-launch{position:fixed;right:20px;bottom:20px;z-index:9000;display:flex;align-items:center;gap:10px;' +
      'background:#e2e2e2;color:#000;border:0;border-radius:999px;padding:14px 20px;cursor:pointer;' +
      'font:600 12px/1 Inter,system-ui,sans-serif;letter-spacing:.12em;text-transform:uppercase;' +
      'box-shadow:0 8px 30px rgba(0,0,0,.45);transition:transform .3s,background .3s}' +
    '#ec-launch:hover{background:#fff;transform:translateY(-2px)}' +
    '#ec-launch:focus-visible,#ec-panel button:focus-visible,#ec-panel input:focus-visible,#ec-panel textarea:focus-visible{outline:2px solid #fff;outline-offset:2px}' +
    '#ec-launch svg{width:18px;height:18px}' +
    '#ec-panel{position:fixed;right:20px;bottom:84px;z-index:9001;width:360px;max-width:calc(100vw - 32px);' +
      'height:520px;max-height:calc(100vh - 110px);display:none;flex-direction:column;overflow:hidden;' +
      'background:#0a0a0a;color:#e2e2e2;border:.5px solid #474747;border-radius:14px;' +
      'box-shadow:0 20px 60px rgba(0,0,0,.6);font:14px/1.5 Inter,system-ui,sans-serif}' +
    '#ec-panel.ec-open{display:flex}' +
    '#ec-head{display:flex;align-items:center;justify-content:space-between;padding:16px 18px;border-bottom:.5px solid #2a2a2a}' +
    '#ec-head strong{font:700 15px/1.2 "Space Grotesk",Inter,sans-serif;color:#fff;letter-spacing:.02em}' +
    '#ec-head span{display:block;font-size:11px;color:#919191;letter-spacing:.08em;text-transform:uppercase;margin-top:3px}' +
    '#ec-close{background:none;border:0;color:#919191;cursor:pointer;font-size:22px;line-height:1;padding:4px 6px}' +
    '#ec-close:hover{color:#fff}' +
    '#ec-log{flex:1;overflow-y:auto;padding:16px 18px;display:flex;flex-direction:column;gap:10px}' +
    '.ec-msg{max-width:85%;padding:10px 13px;border-radius:12px;white-space:pre-wrap;word-wrap:break-word}' +
    '.ec-bot{align-self:flex-start;background:#1b1b1b;border-bottom-left-radius:4px}' +
    '.ec-me{align-self:flex-end;background:#e2e2e2;color:#000;border-bottom-right-radius:4px}' +
    '.ec-msg a{color:inherit}' +
    '.ec-choices{display:flex;flex-wrap:wrap;gap:8px;align-self:flex-start;max-width:100%}' +
    '.ec-choices button{background:transparent;color:#e2e2e2;border:.5px solid #6a6a6a;border-radius:999px;' +
      'padding:8px 13px;cursor:pointer;font:13px/1.2 Inter,system-ui,sans-serif;transition:background .2s,color .2s}' +
    '.ec-choices button:hover{background:#e2e2e2;color:#000}' +
    '.ec-choices button.ec-primary{background:#e2e2e2;color:#000}' +
    '.ec-choices button.ec-primary:hover{background:#fff}' +
    '#ec-form{display:none;gap:8px;padding:12px 14px;border-top:.5px solid #2a2a2a}' +
    '#ec-form.ec-show{display:flex}' +
    '#ec-input{flex:1;min-width:0;background:#141414;color:#fff;border:.5px solid #474747;border-radius:10px;' +
      'padding:10px 12px;font:14px/1.4 Inter,system-ui,sans-serif;resize:none}' +
    '#ec-input::placeholder{color:#6a6a6a}' +
    '#ec-send{background:#e2e2e2;color:#000;border:0;border-radius:10px;padding:0 14px;cursor:pointer;font-weight:600}' +
    '#ec-send:hover{background:#fff}' +
    '#ec-error{color:#ff9a9a;font-size:12px;padding:0 18px 8px;display:none}' +
    '.ec-hp{position:absolute!important;left:-9999px!important;width:1px;height:1px;overflow:hidden}' +
    '.ec-typing{color:#919191;font-style:italic}' +
    '@media (max-width:480px){#ec-panel{right:16px;left:16px;width:auto;max-width:none;bottom:80px}#ec-launch{right:16px;bottom:16px}}' +
    '@media (prefers-reduced-motion:reduce){#ec-launch{transition:none}}';

  var style = document.createElement('style');
  style.textContent = css;
  document.head.appendChild(style);

  var icon = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 12a8.5 8.5 0 0 1-12.6 7.4L3 21l1.6-5.2A8.5 8.5 0 1 1 21 12z"/></svg>';

  var launch = el('button', { id: 'ec-launch', type: 'button', 'aria-expanded': 'false', 'aria-controls': 'ec-panel' });
  launch.innerHTML = icon + '<span>Écrire à Benjamin</span>';

  var panel = el('div', { id: 'ec-panel', role: 'dialog', 'aria-label': 'Prendre contact avec Benjamin' });
  panel.innerHTML =
    '<div id="ec-head"><div><strong>Benjamin Ali Aboudou</strong><span>Prise de contact</span></div>' +
    '<button id="ec-close" type="button" aria-label="Fermer">×</button></div>' +
    '<div id="ec-log" aria-live="polite"></div>' +
    '<div id="ec-error" role="alert"></div>' +
    '<form id="ec-form" novalidate>' +
      '<label class="ec-hp">Ne pas remplir <input id="ec-hp" tabindex="-1" autocomplete="off"></label>' +
      '<textarea id="ec-input" rows="1" aria-label="Votre réponse"></textarea>' +
      '<button id="ec-send" type="submit" aria-label="Envoyer">→</button>' +
    '</form>';

  document.body.appendChild(launch);
  document.body.appendChild(panel);

  var log = panel.querySelector('#ec-log');
  var form = panel.querySelector('#ec-form');
  var input = panel.querySelector('#ec-input');
  var errorBox = panel.querySelector('#ec-error');
  var honeypot = panel.querySelector('#ec-hp');

  var state = {};
  var onAnswer = null;
  var started = false;

  launch.addEventListener('click', function () { toggle(!panel.classList.contains('ec-open')); });
  panel.querySelector('#ec-close').addEventListener('click', function () { toggle(false); launch.focus(); });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && panel.classList.contains('ec-open')) { toggle(false); launch.focus(); }
  });

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    if (onAnswer) onAnswer(input.value.trim());
  });
  input.addEventListener('keydown', function (e) {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); form.requestSubmit ? form.requestSubmit() : form.dispatchEvent(new Event('submit')); }
  });

  function toggle(open) {
    panel.classList.toggle('ec-open', open);
    launch.setAttribute('aria-expanded', open ? 'true' : 'false');
    if (open && !started) { started = true; start(); }
  }

  function el(tag, attrs) {
    var n = document.createElement(tag);
    for (var k in attrs) n.setAttribute(k, attrs[k]);
    return n;
  }

  function scroll() { log.scrollTop = log.scrollHeight; }

  function bot(text, html) {
    var m = el('div', { 'class': 'ec-msg ec-bot' });
    if (html) m.innerHTML = text; else m.textContent = text;
    log.appendChild(m);
    scroll();
  }

  function me(text) {
    var m = el('div', { 'class': 'ec-msg ec-me' });
    m.textContent = text;
    log.appendChild(m);
    scroll();
  }

  function setError(text) {
    errorBox.textContent = text || '';
    errorBox.style.display = text ? 'block' : 'none';
  }

  function choices(list, cb) {
    hideInput();
    var box = el('div', { 'class': 'ec-choices' });
    list.forEach(function (c) {
      var label = typeof c === 'string' ? c : c.label;
      var b = el('button', { type: 'button' });
      if (c.primary) b.className = 'ec-primary';
      b.textContent = label;
      b.addEventListener('click', function () {
        box.remove();
        me(label);
        cb(c);
      });
      box.appendChild(b);
    });
    log.appendChild(box);
    scroll();
    var first = box.querySelector('button');
    if (first) first.focus();
  }

  function ask(opts, cb) {
    input.value = '';
    input.setAttribute('inputmode', opts.type || 'text');
    input.placeholder = opts.placeholder || '';
    input.setAttribute('autocomplete', opts.autocomplete || 'off');
    input.setAttribute('maxlength', String(opts.max || 200));
    input.rows = opts.multiline ? 3 : 1;
    form.classList.add('ec-show');
    input.focus();
    onAnswer = function (value) {
      var err = opts.validate ? opts.validate(value) : (value ? '' : 'Merci de répondre pour continuer.');
      if (err) { setError(err); input.focus(); return; }
      setError('');
      onAnswer = null;
      hideInput();
      me(value || '—');
      cb(value);
    };
  }

  function hideInput() {
    form.classList.remove('ec-show');
    onAnswer = null;
  }

  // ── Déroulé de la conversation ─────────────────────────────
  function start() {
    state = {};
    bot('Bonjour ! Je transmets votre demande directement à Benjamin. Qu’est-ce qui vous amène ?');
    choices(BESOINS, function (b) {
      state.besoin = b;
      bot('Très bien. Quel est votre prénom ?');
      ask({ placeholder: 'Votre prénom', autocomplete: 'given-name', max: 60 }, function (v) {
        state.prenom = v;
        bot('Enchanté, ' + v + '. Comment Benjamin peut-il vous recontacter ?');
        choices(CANAUX, function (c) {
          state.canal = c.label;
          bot(c.type === 'email' ? 'Votre adresse courriel ?' : 'Votre numéro (avec l’indicatif du pays) ?');
          ask({
            type: c.type, placeholder: c.placeholder, autocomplete: c.autocomplete, max: 120,
            validate: function (v) {
              if (c.type === 'email') return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v) ? '' : 'Cette adresse courriel ne semble pas valide.';
              return v.replace(/\D/g, '').length >= 8 ? '' : 'Ce numéro ne semble pas complet.';
            }
          }, function (v) {
            state.contact = v;
            bot('Souhaitez-vous ajouter quelques mots sur votre demande ? (facultatif)');
            ask({ placeholder: 'Votre message… (laissez vide pour passer)', multiline: true, max: 1000,
              validate: function () { return ''; } }, function (v) {
              state.message = v;
              recap();
            });
          });
        });
      });
    });
  }

  function recap() {
    var lines = [
      'Récapitulatif :',
      '• ' + state.besoin,
      '• ' + state.prenom,
      '• ' + state.canal + ' : ' + state.contact
    ];
    if (state.message) lines.push('• « ' + state.message + ' »');
    bot(lines.join('\n'));
    bot('En envoyant, vous acceptez que ces informations soient transmises à Benjamin pour vous recontacter. <a href="/confidentialite.html">Confidentialité</a>', true);
    choices([{ label: 'Envoyer', primary: true, send: true }, { label: 'Recommencer' }], function (c) {
      if (c.send) send(); else start();
    });
  }

  function send() {
    var typing = el('div', { 'class': 'ec-msg ec-bot ec-typing' });
    typing.textContent = 'Envoi en cours…';
    log.appendChild(typing);
    scroll();

    var payload = {
      besoin: state.besoin,
      prenom: state.prenom,
      canal: state.canal,
      contact: state.contact,
      message: state.message || '',
      page: location.pathname,
      website: honeypot.value
    };

    fetch(ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    })
      .then(function (r) { return r.json().catch(function () { return { ok: false }; }); })
      .then(function (res) {
        typing.remove();
        if (res && res.ok) {
          bot('C’est envoyé ! Benjamin a reçu votre demande et vous recontactera très vite. Merci, ' + state.prenom + ' 🙏');
        } else if (res && res.error === 'limite') {
          bot('Plusieurs demandes ont déjà été envoyées depuis votre connexion. Merci de réessayer un peu plus tard.');
        } else {
          fail();
        }
      })
      .catch(function () { typing.remove(); fail(); });
  }

  function fail() {
    var body = encodeURIComponent(
      'Besoin : ' + state.besoin + '\nPrénom : ' + state.prenom + '\n' + state.canal + ' : ' + state.contact +
      (state.message ? '\n\n' + state.message : '')
    );
    bot('Oups, l’envoi n’a pas fonctionné. Vous pouvez écrire directement à <a href="mailto:' + EMAIL_SECOURS +
      '?subject=' + encodeURIComponent('Demande depuis le site') + '&body=' + body + '">' + EMAIL_SECOURS + '</a>.', true);
    choices([{ label: 'Réessayer', primary: true }], function () { send(); });
  }
})();
