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

## Infolettre (Brevo)

Formulaire d'inscription (section `#infolettre`) sur les pages principales et les articles,
envoyé en AJAX par `newsletter.js` à `api/newsletter.php`, qui appelle l'API Brevo côté serveur.

La clé API n'est **jamais** versionnée ni exposée au navigateur. Sur Hostinger :

1. Copier `api/newsletter-config.example.php` en `newsletter-config.php` **au-dessus de `public_html`**
   (sinon dans `public_html/api/` — fichier ignoré par git et bloqué par `api/.htaccess`).
2. Renseigner `api_key`, `list_id` (Brevo > Contacts > Listes) et, recommandé,
   `doi_template_id` (modèle de double opt-in) pour envoyer un courriel de confirmation.
3. Après confirmation, Brevo redirige vers `infolettre-confirmee.html`.
