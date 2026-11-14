# Vidéos YouTube — L'Ennéagramme

Animations des épisodes, générées avec [Remotion](https://www.remotion.dev/) (React → MP4)
à partir de l'audio de l'épisode et de son texte.

## Charte

Reprise des visuels Facebook « Les samedis pour soi » : noir et blanc (`src/theme.ts` :
noir `#0d0d0d`, blanc, graphite `#545454`, gris clair `#e4e4e4`), Instrument Sans (titres)
et Instrument Serif italique (accents), cercles concentriques en trait fin, pastilles arrondies.

## Organisation

- `public/audio/25.mp3` — audio de l'épisode 25 (13 min 50 s)
- `texte/episode-25.docx|txt` — texte de l'épisode : il fait foi pour tout ce qui s'affiche
- `audio/25.transcript.json|txt` — transcription horodatée au mot (faster-whisper), sert au calage
- `src/data/episode25.ts` — contenu et temps (en secondes dans l'audio) de chaque scène
- `src/components/` — briques réutilisables : `Rings`, `Enneagram`, `Reveal`, `Pill`, `CircleWipe`, `Insert`
- `src/scenes/` — scènes (`Intro`, `NeufFixations`)
- `scripts/transcribe.py` — `python3 scripts/transcribe.py public/audio/25.mp3 audio/25.transcript.json small`
- `scripts/pexels.mjs` — `node scripts/pexels.mjs <nom> "<recherche en anglais>" [index]` → `public/inserts/<nom>.mp4`
- `scripts/pixabay.mjs` — même usage, avec `PIXABAY_API_KEY` (source utilisée)

## Rendu

```bash
npm install
npx remotion studio            # aperçu interactif
npx remotion render Test out/test-episode25.mp4 --concurrency=4 --crf=18
```

Dans l'environnement cloud, avant le rendu :
`export REMOTION_CHROME=/opt/pw-browsers/chromium_headless_shell-1243/chrome-headless-shell-linux64/chrome-headless-shell`

## Où on en est

1. ✅ Test validé par l'auteur (« absolument génial ») : intro (0:00–0:31) + neuf fixations (2:56–4:11),
   composition `Test` dans `src/Root.tsx`.
2. ⏳ **Inserts vidéo** : Pexels ne délivre plus de nouvelles clés (nov. 2026), on passe par **Pixabay** (`scripts/pixabay.mjs`, clé `PIXABAY_API_KEY`). La clé doit être ajoutée à l'environnement cloud
   (une nouvelle session la voit). Le composant `Insert` (noir et blanc, grain, zoom lent) et le script
   `pexels.mjs` sont prêts. Prochaine étape : ajouter 3–4 inserts au test, un par présentation, pour
   que l'auteur choisisse :
   - **plein écran** sous les questions de l'intro (ex. « schémas répétitifs » → `"person walking in circles"`)
   - **cadre arrondi** à côté du texte (ex. profil 2, « antennes » → `"woman observing people cafe"`)
   - **cercle** (rappel des cercles de la charte) (ex. profil 7, gloutonnerie → `"busy city crowd timelapse"`)
   Passages qui s'y prêtent plus loin dans l'épisode : « une tasse ébréchée, un dessin d'enfant,
   une conversation maladroite » (~8:50), « s'asseoir sans rien faire pour personne » (~9:06).
   Mentionner les vidéastes Pexels en description YouTube (`public/inserts/credits.json`).
3. Ensuite : l'épisode complet (14 min), scènes listées ci-dessous.

| Temps | Scène |
|---|---|
| 0:00 | Introduction (fait) |
| 0:31 | Sandra Maitri : diamant, Naranjo, son livre |
| 1:39 | Partie 1 : la nature des fixations (le filtre) |
| 2:56 | Les 9 fixations sur l'ennéagramme (fait) |
| 4:11 | Partie 2 : la transformation |
| 5:23 | Les 9 vertus (fixation → vertu sur le même cercle) |
| 6:54 | Partie 3 : méthodes (témoin intérieur, sensations) |
| 8:37 | Partie 4 : pratiques par profil (9 cartes) |
| 10:33 | Indicateurs, temps long, accompagnement |
| 12:13 | Conclusion : les 9 passages, prochain épisode (Bowlby) |
