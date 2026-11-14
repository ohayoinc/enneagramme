// Cherche une vidéo sur Pixabay et la télécharge dans public/inserts/.
// Usage : node scripts/pixabay.mjs <nom> "<recherche en anglais>" [index]
// Exemple : node scripts/pixabay.mjs tasse "chipped cup"
// Nécessite la variable d'environnement PIXABAY_API_KEY.
// Les crédits (auteur, lien) sont ajoutés à public/inserts/credits.json.
import fs from 'node:fs';
import path from 'node:path';

const [name, query, index = '0'] = process.argv.slice(2);
const key = process.env.PIXABAY_API_KEY;
if (!name || !query) {
  console.error('Usage : node scripts/pixabay.mjs <nom> "<recherche>" [index]');
  process.exit(1);
}
if (!key) {
  console.error('PIXABAY_API_KEY manquante.');
  process.exit(1);
}

const url = new URL('https://pixabay.com/api/videos/');
url.search = new URLSearchParams({key, q: query, per_page: '15', safesearch: 'true'}).toString();
const res = await fetch(url);
if (!res.ok) throw new Error(`Pixabay : ${res.status} ${await res.text()}`);
const {hits} = await res.json();
if (!hits?.length) throw new Error(`Aucun résultat pour « ${query} »`);

hits.forEach((v, i) => console.log(`${i === Number(index) ? '→' : ' '} ${i}  ${v.duration}s  ${v.pageURL}`));
const v = hits[Number(index)];

// Le plus grand fichier qui ne dépasse pas 1920 de large.
const file = Object.values(v.videos)
  .filter((x) => x.url && x.width && x.width <= 1920)
  .sort((a, b) => b.width - a.width)[0];
if (!file) throw new Error('Aucun fichier adapté');

const dir = path.resolve('public/inserts');
fs.mkdirSync(dir, {recursive: true});
const out = path.join(dir, `${name}.mp4`);
const data = Buffer.from(await (await fetch(file.url)).arrayBuffer());
fs.writeFileSync(out, data);

const creditsPath = path.join(dir, 'credits.json');
const credits = fs.existsSync(creditsPath) ? JSON.parse(fs.readFileSync(creditsPath, 'utf8')) : {};
credits[name] = {query, source: v.pageURL, auteur: v.user, duree: v.duration, largeur: file.width};
fs.writeFileSync(creditsPath, JSON.stringify(credits, null, 2) + '\n');
console.log(`OK ${out} (${file.width}x${file.height}, ${(data.length / 1e6).toFixed(1)} Mo, ${v.duration}s) — vidéo de ${v.user}`);
