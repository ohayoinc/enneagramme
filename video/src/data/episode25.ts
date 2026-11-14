// Épisode 25 — Des fixations aux vertus (Sandra Maitri).
// Les temps (en secondes) viennent de la transcription horodatée de audio/25.mp3.

export const AUDIO = 'audio/25.mp3';

export const INTRO = {
  start: 0,
  end: 31.0,
  titreAt: 5.8, // « le passage des fixations aux vertus »
  vertusAt: 8.3,
  questions: [
    {at: 10.1, avant: 'Comment nos schémas répétitifs les plus tenaces pourraient-ils devenir', accent: 'des portes vers nos qualités essentielles ?'},
    {at: 17.7, avant: 'Pourquoi ce que nous considérons comme nos défauts principaux seraient-ils en réalité', accent: 'des indices pointant vers nos forces latentes ?'},
    {at: 26.8, avant: 'Et surtout,', accent: 'comment opérer cette transformation ?'},
  ],
};

export const FIXATIONS = {
  start: 176.2,
  end: 251.4,
  profils: [
    {n: 1, at: 181.8, nom: 'le ressentiment', court: 'ressentiment', desc: "Cette colère contenue face à l'imperfection du monde."},
    {n: 2, at: 189.2, nom: "l'orgueil", court: 'orgueil', desc: "Cette conviction inconsciente d'être indispensable."},
    {n: 3, at: 196.2, nom: 'la tromperie', court: 'tromperie', desc: "Non pas le mensonge conscient, mais l'identification à l'image plutôt qu'à l'être."},
    {n: 4, at: 205.8, nom: "l'envie", court: 'envie', desc: 'Ce sentiment chronique de manque et de comparaison.'},
    {n: 5, at: 212.2, nom: "l'avarice", court: 'avarice', desc: 'La rétention de ses ressources émotionnelles et énergétiques.'},
    {n: 6, at: 219.6, nom: 'la peur', court: 'peur', desc: "Cette anxiété fondamentale face à l'incertitude."},
    {n: 7, at: 228.4, nom: 'la gloutonnerie', court: 'gloutonnerie', desc: "Cette boulimie d'expériences pour éviter la douleur."},
    {n: 8, at: 234.9, nom: 'la luxure', court: 'luxure', desc: "Cet excès d'intensité et de contrôle."},
    {n: 9, at: 242.2, nom: 'la paresse spirituelle', court: 'paresse', desc: 'Cet oubli de soi et de ses priorités essentielles.'},
  ],
};
