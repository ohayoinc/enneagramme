# enneagramme.co

Site statique de Benjamin Ali Aboudou — ateliers et accompagnement Ennéagramme (Montréal, Québec et en ligne).

- Production : https://enneagramme.co (hébergé chez Hostinger)
- Pages HTML à la racine, feuille de style compilée dans `dist/styles.css`
- `sitemap.xml`, `robots.txt`, `llms.txt`, `404.html` servis à la racine

## Provenance

Ce dépôt a été initialisé le 7 novembre 2026 à partir de la version publiée en ligne
(copie des pages et ressources publiques). Les fichiers non publics éventuels de la
version locale (sources Tailwind, `tailwind.config.js`, `.htaccess`, etc.) ne sont pas inclus.

## Aperçu en local

```bash
python3 -m http.server 8000
```

Puis ouvrir http://localhost:8000.

## Chatbot de contact (WhatsApp)

Un petit chatbot (bouton « Écrire à Benjamin » en bas à droite de chaque page) pose
quelques questions au visiteur (besoin, prénom, moyen de contact, message) puis envoie
la demande sur le WhatsApp de Benjamin via [CallMeBot](https://www.callmebot.com/).

- `chatbot/chatbot.js` : le widget (autonome, inclus sur toutes les pages)
- `api/whatsapp.php` : reçoit la demande et l'envoie à CallMeBot (limite de 5 demandes/heure par IP, pot de miel anti-robots)
- `api/config.php` : **à créer sur le serveur** à partir de `api/config.example.php` (numéro + clé). Non versionné.

Mise en service :

1. Sur WhatsApp, ajouter le numéro CallMeBot à ses contacts (voir leur page « Free API WhatsApp »)
   et lui envoyer : `I allow callmebot to send me messages`. On reçoit une `apikey`.
2. Sur Hostinger, copier `api/config.example.php` en `api/config.php` et y mettre son numéro et la clé.
3. Mettre en ligne `chatbot/`, `api/` et les pages HTML.

Si l'envoi échoue, le chatbot propose au visiteur d'écrire à benjamin@enneagramme.co.
