# Articles du blog : rédaction et publication programmée

Chaque fichier `.txt` de ce dossier est un article. Il est publié automatiquement le matin
de sa date (heure de Montréal) par la tâche GitHub « Publication programmée des articles »
(`.github/workflows/publier-articles.yml`), qui lance `outils/publier.py` et pousse sur `main`.

La publication :

- génère la page de l'article à partir du gabarit des articles existants ;
- ajoute sa carte en tête de `blog.html` et met à jour les compteurs ;
- met à jour « Derniers articles » sur l'accueil (`index.html`) ;
- ajoute l'URL au `sitemap.xml`.

Rythme du blog : un article par lundi.

## Programmer un article

Créez `AAAA-MM-JJ-slug.txt` (le nom ne sert qu'au classement) :

```
slug: nom-de-la-page-sans-html
cat: PERSONNEL                  (PERSONNEL, COUPLE, COLLECTIF ou TECHNIQUE)
iso: 2026-12-14                 (date de publication, un lundi)
title: Titre (65 caractères au plus)
desc: Description (160 caractères au plus) : meta description et carte du blog.
source: D'après Nom de l'auteur (affiché sur l'accueil)
related: slug-1 slug-2 slug-3   (« Autres articles », facultatif)
---
Paragraphe d'introduction.

## Intertitre

### Sous-intertitre

Un lien interne : [texte du lien](page.html)

## FAQ

Q: Question ? R: Réponse.
```

Le temps de lecture est calculé automatiquement. Un lien vers un article pas encore en
ligne est remplacé par du texte simple.

## Commandes

Voir le calendrier :

```bash
python3 outils/publier.py --liste
```

Publier ce qui est dû (ce que fait la tâche programmée) :

```bash
python3 outils/publier.py
```

On peut aussi lancer la tâche à la main : onglet Actions de GitHub, « Run workflow ».
