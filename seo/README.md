# Suivi SEO — enneagramme.co

Trois briques :

| Brique | Rôle | Fichier |
|---|---|---|
| Google Analytics 4 | Mesure d'audience (visites, sources, conversions), chargé seulement après consentement | `assets/analytics.js` |
| Audit technique | Vérifie titres, descriptions, canonical, H1, liens cassés, sitemap… à chaque modification | `seo/audit.py` |
| Rapport hebdomadaire | Chaque lundi, une issue GitHub avec les chiffres Search Console (+ GA4) et les opportunités | `seo/report.py`, `.github/workflows/seo.yml` |

## 1. Google Search Console (à faire une fois)

1. Aller sur <https://search.google.com/search-console> → **Ajouter une propriété** → type **Domaine** → `enneagramme.co`.
2. Google fournit un enregistrement **TXT** (`google-site-verification=…`). Dans hPanel Hostinger :
   **Domaines → enneagramme.co → DNS / Serveurs de noms → Ajouter un enregistrement** : type `TXT`, nom `@`, valeur = le texte fourni.
3. Revenir dans Search Console → **Valider** (la propagation DNS peut prendre jusqu'à quelques heures).
4. Menu **Sitemaps** → soumettre `sitemap.xml`.

La validation DNS couvre `http`, `https`, `www` et sans `www` : aucune balise à ajouter au site.

## 2. Google Analytics 4 (à faire une fois)

1. <https://analytics.google.com> → **Administration → Créer → Propriété** (fuseau : Canada/Montréal, devise CAD).
2. **Flux de données → Web** → `https://enneagramme.co`. Copier l'**ID de mesure** (`G-XXXXXXXXXX`).
3. Le coller dans `assets/analytics.js` (`var GA_MEASUREMENT_ID = 'G-…';`), puis mettre le fichier en ligne sur Hostinger avec le reste du site.
4. Dans GA4 : **Administration → Associations de produits → Search Console** pour croiser requêtes Google et comportement sur le site.
5. Dans GA4 : **Administration → Événements** → marquer `contact_email`, `contact_phone` et `booking_click` comme **événements clés** (conversions).

Tant que l'ID est vide, le script ne fait rien et aucun bandeau n'apparaît.

### Consentement (Loi 25)

Le bandeau propose *Accepter / Refuser*. Aucun script Google n'est chargé avant « Accepter ».
Le choix est conservé 13 mois ; le lien « gérer mes témoins » de la page Confidentialité
(attribut `data-consent-open`, réutilisable n'importe où) permet de le modifier.

## 3. Rapport automatique hebdomadaire

Le workflow GitHub `Suivi SEO` tourne chaque lundi et crée une issue « Suivi SEO — semaine du … » contenant :

- clics, impressions, CTR et position moyenne sur 28 jours vs les 28 jours précédents ;
- top requêtes et évolution de leur position ;
- **opportunités** : requêtes en position 4–20 avec beaucoup d'impressions (les plus rentables à travailler) ;
- performances par page, pages disparues des résultats, pays et appareils ;
- si GA4 est configuré : sessions, sources de trafic, pages d'entrée depuis Google ;
- l'audit technique du site.

Il peut aussi être lancé à la main : onglet **Actions → Suivi SEO → Run workflow**.

### Brancher les données Google (une fois)

1. <https://console.cloud.google.com> → créer un projet (ex. `enneagramme-seo`).
2. **API et services → Bibliothèque** : activer **Google Search Console API** et **Google Analytics Data API**.
3. **IAM → Comptes de service → Créer** (aucun rôle nécessaire) → onglet **Clés → Ajouter une clé → JSON**. Un fichier est téléchargé.
4. Donner accès en lecture à l'adresse du compte de service (`…@….iam.gserviceaccount.com`) :
   - Search Console → **Paramètres → Utilisateurs et autorisations → Ajouter** → autorisation *Restreinte* ;
   - GA4 → **Administration → Gestion des accès à la propriété → +** → rôle *Lecteur*.
5. Dans GitHub : **Settings → Secrets and variables → Actions** :
   - onglet *Secrets* → `GOOGLE_SERVICE_ACCOUNT_JSON` = contenu complet du fichier JSON ;
   - propriété GA4 déjà renseignée dans le workflow (`488854221`) ; la variable `GA4_PROPERTY_ID` permet de la remplacer si besoin ;
   - optionnel, variable `GSC_SITE_URL` si la propriété n'est pas `sc-domain:enneagramme.co` (ex. `https://enneagramme.co/`).

Sans ces secrets, le rapport hebdomadaire contient seulement l'audit technique.

## En local

```bash
python3 seo/audit.py
```

```bash
pip install google-auth requests
GOOGLE_SERVICE_ACCOUNT_JSON="$(cat cle.json)" GA4_PROPERTY_ID=123456789 python3 seo/report.py
```

## Routine conseillée

- **Chaque semaine** (issue du lundi) : regarder les *opportunités* et choisir 1 à 2 pages à améliorer (titre plus accrocheur, contenu qui répond mieux à la requête, liens internes depuis les articles du blog).
- **Chaque mois** : Search Console → *Pages* (indexation) et *Signaux Web essentiels* ; corriger les pages « Explorée, actuellement non indexée ».
- **À chaque nouvel article** : l'ajouter à `sitemap.xml` (avec `lastmod`), vérifier que l'audit passe, puis *Inspection de l'URL → Demander l'indexation* dans Search Console.
