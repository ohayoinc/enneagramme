# enneagramme.co

Site statique de Benjamin Ali Aboudou — ateliers et accompagnement Ennéagramme (Montréal, Québec et en ligne).

- Production : https://enneagramme.co (hébergé chez Hostinger)
- Pages HTML à la racine, feuille de style compilée dans `dist/styles.css`
- `sitemap.xml`, `robots.txt`, `llms.txt`, `404.html` servis à la racine
- Mesure d'audience (GA4 + bandeau de consentement) et suivi SEO : voir [`seo/README.md`](seo/README.md)

## Provenance

Ce dépôt a été initialisé le 7 novembre 2026 à partir de la version publiée en ligne
(copie des pages et ressources publiques). Les fichiers non publics éventuels de la
version locale (sources Tailwind, `tailwind.config.js`, `.htaccess`, etc.) ne sont pas inclus.

## Aperçu en local

```bash
python3 -m http.server 8000
```

Puis ouvrir http://localhost:8000.

## Design « Intemporel » (novembre 2026)

Fond blanc, encre noire, images toujours en noir et blanc, typographie éditoriale, beaucoup d'espace, mouvements lents.

- `dist/styles.css` : Tailwind compilé, palette inversée (clair). Les classes à couleur arbitraire ont été renommées
  pour rester exactes (`bg-[#ffffff]`, `text-[#767676]`, `border-[#e4e4e4]`, …). Les jetons nommés gardent leur nom :
  `text-primary` / `text-white` = encre `#111`, `bg-background` = blanc, `text-outline` = gris `#767676`.
- `dist/theme.css` : le système de design (polices Bodoni Moda + Jost, espacements, en-tête, boutons, filtre noir et blanc
  sur toutes les images, styles d'animation). Chargé après `styles.css` sur chaque page.
- `dist/motion.js` : apparitions au défilement, titres mot à mot, images en rideau, en-tête qui s'efface,
  transitions de page, curseur d'encre. Respecte `prefers-reduced-motion`.
- `landing-a` à `landing-d` sont des pistes de design autonomes et n'utilisent pas ce thème.

Pour une nouvelle page : inclure `/dist/styles.css`, `/dist/theme.css`, `/dist/motion.js` (defer) et la police Google
Fonts `Bodoni Moda` + `Jost` comme sur `index.html`.

## Infolettre (Brevo)

Formulaire d'inscription (section `#infolettre`) sur les pages principales et les articles,
envoyé en AJAX par `newsletter.js` à `api/newsletter.php`, qui appelle l'API Brevo côté serveur.

La clé API n'est **jamais** versionnée ni exposée au navigateur. Sur Hostinger, le fichier
`public_html/api/newsletter-config.php` (modèle : `api/newsletter-config.example.php`, ignoré par git,
bloqué par `api/.htaccess`) contient `api_key`, `list_id` et, optionnellement, `doi_template_id`.
Après une double confirmation, Brevo redirige vers `infolettre-confirmee.html`.
