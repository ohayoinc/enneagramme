// Cherche une vidéo sur Pexels et la télécharge dans public/inserts/.
// Usage : node scripts/pexels.mjs <nom> "<recherche en anglais>" [index]
// Exemple : node scripts/pexels.mjs tasse "chipped cup close up"
// Nécessite la variable d'environnement PEXELS_API_KEY.
// Les crédits (auteur, lien) sont ajoutés à public/inserts/credits.json.
import fs from 'node:fs';
import path from 'node:path';

const [name, query, index = '0'] = process.argv.slice(2);
const key = process.env.PEXELS_API_KEY;
if (!name || !query) {
  console.error('Usage : node scripts/pexels.mjs <nom> "<recherche>" [index]');
  process.exit(1);
}
if (!key) {
  console.error('PEXELS_API_KEY manquante.');
  process.exit(1);
}

const url = new URL('https://api.pexels.com/videos/search');
url.search = new URLSearchParams({query, orientation: 'landscape', size: 'medium', per_page: '15'}).toString();
const res = await fetch(url, {headers: {Authorization: key}});
if (!res.ok) throw new Error(`Pexels : ${res.status} ${await res.text()}`);
const {videos} = await res.json();
if (!videos?.length) throw new Error(`Aucun résultat pour « ${query} »`);

// Liste les résultats pour pouvoir en choisir un autre avec [index].
videos.forEach((v, i) => console.log(`${i === Number(index) ? '→' : ' '} ${i}  ${v.duration}s  ${v.url}`));
const v = videos[Number(index)];

// Fichier MP4 en 1920 de large au plus, le plus grand possible.
const file = v.video_files
  .filter((x) => x.file_type === 'video/mp4' && x.width && x.width <= 1920)
  .sort((a, b) => b.width - a.width)[0];
if (!file) throw new Error('Aucun MP4 adapté');

const dir = path.resolve('public/inserts');
fs.mkdirSync(dir, {recursive: true});
const out = path.join(dir, `${name}.mp4`);
const data = Buffer.from(await (await fetch(file.link)).arrayBuffer());
fs.writeFileSync(out, data);

const creditsPath = path.join(dir, 'credits.json');
const credits = fs.existsSync(creditsPath) ? JSON.parse(fs.readFileSync(creditsPath, 'utf8')) : {};
credits[name] = {query, pexels: v.url, auteur: v.user?.name, auteurUrl: v.user?.url, duree: v.duration, largeur: file.width};
fs.writeFileSync(creditsPath, JSON.stringify(credits, null, 2) + '\n');
console.log(`OK ${out} (${file.width}x${file.height}, ${(data.length / 1e6).toFixed(1)} Mo, ${v.duration}s) — vidéo de ${v.user?.name}`);
