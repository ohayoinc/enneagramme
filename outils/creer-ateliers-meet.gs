/**
 * Crée les 12 ateliers dans Google Agenda, chacun avec son lien Google Meet,
 * pour coller ces liens dans les événements Facebook (événement en ligne → lien externe).
 *
 * Mode d'emploi (avec le compte benjamin@enneagramme.co) :
 *  1. Ouvrir https://script.google.com, puis « Nouveau projet ».
 *  2. Remplacer tout le code par ce fichier.
 *  3. À gauche, « Services » (+) : choisir « Google Calendar API », puis « Ajouter ».
 *  4. En haut, choisir la fonction creerAteliers, puis « Exécuter ». Autoriser l'accès à l'agenda.
 *  5. Dans le « Journal d'exécution », copier la liste : date | titre | lien Meet.
 *
 * Relancer le script ne crée pas de doublon : il relit les ateliers déjà créés.
 */
const HEURE = '10:00';          // heure de Montréal
const DUREE_MINUTES = 90;       // durée à ajuster si besoin
const FUSEAU = 'America/Montreal';
const ATELIERS = [
  ['colere-peur-tristesse-apprivoiser-nos-2027-01-30', "Colère, peur, tristesse : apprivoiser nos émotions", '2027-01-30'],
  ['aimer-sans-se-perdre-2027-02-27', "Aimer sans se perdre", '2027-02-27'],
  ['procrastination-passer-enfin-a-laction-2027-03-27', "Procrastination : passer enfin à l’action", '2027-03-27'],
  ['traverser-les-grands-changements-2027-04-24', "Traverser les grands changements", '2027-04-24'],
  ['ce-que-le-stress-revele-2027-05-29', "Ce que le stress révèle de nous", '2027-05-29'],
  ['les-amities-qui-durent-2027-06-26', "Les amitiés qui durent", '2027-06-26'],
  ['pourquoi-on-hesite-ou-pourquoi-2027-07-31', "Pourquoi on hésite… ou pourquoi on fonce", '2027-07-31'],
  ['temps-et-energie-trouver-son-2027-08-28', "Temps et énergie : trouver son équilibre", '2027-08-28'],
  ['travailler-ensemble-sans-suser-2027-09-25', "Travailler ensemble sans s’user", '2027-09-25'],
  ['etre-son-propre-allie-2027-10-30', "Être son propre allié", '2027-10-30'],
  ['desamorcer-les-conflits-du-quotidien-2027-11-27', "Désamorcer les conflits du quotidien", '2027-11-27'],
  ['retrouver-ce-qui-nous-fait-2027-12-18', "Retrouver ce qui nous fait vibrer", '2027-12-18']
];

function creerAteliers() {
  const agenda = 'primary';
  const iso = function (d) { return Utilities.formatDate(d, FUSEAU, "yyyy-MM-dd'T'HH:mm:ssXXX"); };
  const lignes = [];
  ATELIERS.forEach(function (a) {
    const slug = a[0], titre = a[1], jour = a[2];
    const debut = Utilities.parseDate(jour + ' ' + HEURE, FUSEAU, 'yyyy-MM-dd HH:mm');
    const fin = new Date(debut.getTime() + DUREE_MINUTES * 60000);
    const existants = Calendar.Events.list(agenda, { privateExtendedProperty: 'atelier=' + slug, maxResults: 1 }).items || [];
    let ev = existants[0];
    if (!ev) {
      ev = Calendar.Events.insert({
        summary: titre + ' · Atelier Ennéagramme (gratuit)',
        description: 'Atelier en ligne gratuit animé par Benjamin Ali Aboudou.\nhttps://enneagramme.co/evenement-' + slug + '.html',
        start: { dateTime: iso(debut), timeZone: FUSEAU },
        end: { dateTime: iso(fin), timeZone: FUSEAU },
        extendedProperties: { private: { atelier: slug } },
        conferenceData: { createRequest: { requestId: slug, conferenceSolutionKey: { type: 'hangoutsMeet' } } }
      }, agenda, { conferenceDataVersion: 1 });
    }
    const meet = ev.hangoutLink || '(lien Meet en cours de création : relancer le script)';
    lignes.push(jour + ' | ' + titre + ' | ' + meet);
  });
  Logger.log('\n' + lignes.join('\n'));
}
