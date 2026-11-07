# Modèle de contenu hebdomadaire — Enneagramme.co

Ce modèle se reproduit chaque semaine. Il décrit **quoi écrire**, pas l'apparence (le gabarit HTML des
articles existants sert pour la mise en page).

## Le cycle d'une semaine

| Jour | Livrable | Source |
|---|---|---|
| Mercredi | **Fiche de veille** : le meilleur de la semaine dans les sources RSS (`veille/sources.md`) | Automatique |
| Mercredi | **Proposition de sujet** + plan détaillé de l'article | Automatique, à valider |
| Jeudi–vendredi | **Article** rédigé (≈ 1 800 mots), relu par Benjamin | Brouillon automatique + relecture |
| Dimanche | **Infolettre** envoyée via Brevo | Gabarit ci-dessous |
| Lundi | **Publication** de l'article sur le site (date de l'article = lundi) | Mise en ligne |

### Rotation des rubriques

Les articles suivent une rotation sur trois semaines, avec PERSONNEL en remplacement occasionnel :

1. **TECHNIQUE** : un concept du système (triades, ailes, flèches, sous-types, passions, fixations…)
2. **COUPLE** : une dynamique de couple croisée avec un auteur (Gottman, Perel, Bowlby, Schnarch…)
3. **COLLECTIF** : une dynamique d'équipe ou d'organisation croisée avec un auteur (Edmondson, Senge, Lencioni, Tuckman…)
4. *PERSONNEL* (ponctuel) : un usage de l'Ennéagramme au quotidien, sur soi

Dernières parutions : 19 oct. TECHNIQUE → 26 oct. COUPLE → 2 nov. COLLECTIF → **9 nov. TECHNIQUE**, 16 nov. COUPLE, 23 nov. COLLECTIF…

**Règles de choix du sujet**
- Ne pas reprendre un sujet déjà traité (vérifier la liste des articles dans `blog.html`).
- Un auteur ou un chercheur reconnu par article COUPLE / COLLECTIF, avec des faits vérifiables (ouvrage, institution, concept).
- La veille inspire l'angle (une question qui revient, une recherche récente, un débat), elle ne se copie jamais.

---

## 1. Fiche de veille (chaque mercredi)

```
# Veille du [date]

## À retenir cette semaine (3 à 5 éléments)
- **[Titre de l'élément]** — [Source, lien, date]
  Ce que ça dit : [2 phrases]
  Pourquoi c'est utile pour nous : [1 phrase : angle d'article, citation, question de lecteurs]

## Questions qui reviennent
- [Question posée par le public, telle quelle] → profil(s) concerné(s)

## Idées d'articles (3)
1. [RUBRIQUE] [Titre provisoire] — angle en une phrase — auteur de référence éventuel
2. …
3. …

## Sujet recommandé pour lundi
[Titre] — [Rubrique conforme à la rotation] — raison du choix
```

---

## 2. Article (publication le lundi)

**Repères** : 1 600 à 2 000 mots · 7 à 10 min de lecture · tutoiement interdit, vouvoiement · français
québécois soigné (« courriel », « souper ») · ton chaleureux, précis, jamais de jugement d'un profil.

```
RUBRIQUE · [date du lundi] · [N] min de lecture

# [Sujet concret] : [promesse] avec l'Ennéagramme
   ex. « Attentes implicites dans le couple : nommer les contrats invisibles avec l'Ennéagramme »

Chapeau (1–2 phrases, sert aussi de meta description, ≤ 160 caractères)

## Ouverture : une scène (≈ 150 mots, sans intertitre)
Une situation vécue, au présent, avec des prénoms ou « l'un / l'autre ».
Puis le problème posé en 2–3 phrases. Pas de définition en ouverture.

## [Auteur] : [son idée clé en une ligne]        (COUPLE / COLLECTIF)
## Ce qu'est [le concept]                         (TECHNIQUE / PERSONNEL)
(≈ 300 mots) Qui est l'auteur, son ouvrage, son concept. Faits vérifiables uniquement.
Le lien avec l'Ennéagramme en une phrase de transition.

## Ce que [le sujet] révèle de chaque profil (≈ 600 mots)
### Le centre instinctif : 8, 9 et 1
### Le centre émotionnel : 2, 3 et 4
### Le centre mental : 5, 6 et 7
Pour chaque profil : 2–3 phrases (ce qu'il vit de l'intérieur, sa pente, sa ressource).
Variante TECHNIQUE : un sous-titre par notion si le concept ne se découpe pas par centre.

## Pourquoi [le problème] fait si mal / persiste (≈ 200 mots)
Le mécanisme sous-jacent, relié à la passion ou à la fixation des profils.

## [Verbe d'action] : pistes pratiques (≈ 400 mots)
### [Piste 1 — verbe à l'infinitif]
### [Piste 2]
### [Piste 3]
### [Piste 4]
### [Piste 5]
Chaque piste : une pratique concrète, faisable cette semaine, avec un exemple.

## FAQ — [Sujet]
### [Objection la plus fréquente ?]
### [Cas difficile ?]
### [Question sur les profils ?]
Réponses de 60–100 mots (alimente aussi le balisage FAQ pour le référencement).

## Conclusion (≈ 120 mots)
Retour à la scène d'ouverture, transformée. Une invitation, pas une injonction.

À lire aussi : 3 articles liés (même rubrique ou même auteur).
```

**Fichier et référencement**
- Nom de fichier : `sujet-angle-enneagramme-auteur.html` (minuscules, sans accents, tirets).
- Mettre à jour : `blog.html` (carte en tête), `index.html` (« Derniers articles »), `sitemap.xml`.
- Données structurées : `Article` (datePublished = lundi) + `FAQPage`.

---

## 3. Infolettre du dimanche (Brevo)

Formule retenue par défaut : **A** (voir les cinq formules dans `veille/propositions-infolettre.md`).

**Repères** : 350 à 500 mots · lecture en 2 minutes · un seul appel à l'action principal.

```
Objet : [question ou tension du nouvel article, ≤ 50 caractères]
   ex. « Ce que vous attendez sans le dire »
Pré-en-tête : [complète l'objet, ≤ 90 caractères]

Bonjour {{ contact.PRENOM | default: "" }},

1. LE MOT DE LA SEMAINE (≈ 100 mots)
   Une observation personnelle de Benjamin (atelier, séance, lecture), qui amène le sujet.

2. L'ARTICLE DE DEMAIN (≈ 120 mots)
   La scène d'ouverture résumée + la promesse. Bouton : « Lire l'article » → lien de l'article.

3. À ESSAYER CETTE SEMAINE (≈ 60 mots)
   Une des pistes pratiques de l'article, en version courte.

4. REPÉRÉ CETTE SEMAINE (2 éléments de la veille, ≈ 40 mots chacun)
   [Titre] — [source] — pourquoi ça vaut le détour.

5. À VENIR (1–2 lignes)
   Prochain atelier ou disponibilité d'entretien exploratoire.

Benjamin
```

---

## Liste de vérification avant publication

- [ ] Le sujet n'a jamais été traité et respecte la rotation
- [ ] Les faits sur l'auteur sont vérifiés (ouvrage, institution, date)
- [ ] Les 9 profils sont décrits sans caricature ni jugement
- [ ] 5 pistes concrètes, 3 questions de FAQ
- [ ] Chapeau ≤ 160 caractères, titre ≤ 70 caractères
- [ ] `blog.html`, `index.html` et `sitemap.xml` mis à jour
- [ ] Infolettre programmée dans Brevo pour dimanche
