#!/usr/bin/env python3
"""Génère la page Calendrier, une page par événement et les fichiers d'agenda (.ics).

Source : donnees/calendrier.json. Usage, depuis la racine du dépôt :
    python3 outils/calendrier.py

Le gabarit (en-tête, menu, pied de page, infolettre) est repris d'une page existante
du site, pour que les pages générées restent identiques au reste du site.
"""
import html
import json
import re
from datetime import datetime, date
from pathlib import Path
from zoneinfo import ZoneInfo

RACINE = Path(__file__).resolve().parent.parent
SITE = "https://enneagramme.co"
GABARIT = RACINE / "atelier-introduction.html"
TZ = ZoneInfo("America/Montreal")
JOURS = ["lundi", "mardi", "mercredi", "jeudi", "vendredi", "samedi", "dimanche"]
MOIS = ["janvier", "février", "mars", "avril", "mai", "juin", "juillet", "août",
        "septembre", "octobre", "novembre", "décembre"]
MOIS_COURT = ["janv.", "févr.", "mars", "avr.", "mai", "juin", "juil.", "août",
              "sept.", "oct.", "nov.", "déc."]
CONTACT = "benjamin@ohayo.io"
FLECHE = ('<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" '
          'stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6"/></svg>')


def e(t):
    return html.escape(str(t), quote=True)


def heure(hhmm):
    h, m = hhmm.split(":")
    return f"{int(h)} h" + (f" {m}" if m != "00" else "")


def dt(ev, champ):
    d = date.fromisoformat(ev["date"])
    h, m = map(int, ev[champ].split(":"))
    return datetime(d.year, d.month, d.day, h, m, tzinfo=TZ)


def date_longue(ev):
    d = date.fromisoformat(ev["date"])
    return f"{JOURS[d.weekday()].capitalize()} {d.day} {MOIS[d.month - 1]} {d.year}"


def horaire(ev):
    return f"{heure(ev['debut'])} – {heure(ev['fin'])}"


def lieu_court(ev):
    l = ev["lieu"]
    if l.get("en_ligne"):
        return "En ligne"
    return ", ".join(x for x in (l.get("nom"), l.get("ville")) if x and x != "Lieu à confirmer") or l.get("ville", "")


def lieu_detail(ev):
    l = ev["lieu"]
    if l.get("en_ligne"):
        return "En ligne, par visioconférence"
    return ", ".join(x for x in (l.get("nom"), l.get("adresse"), l.get("ville")) if x)


def lien_reservation(ev):
    if ev.get("inscription"):
        return ev["inscription"], True
    sujet = f"Inscription : {ev['titre']} ({date_longue(ev)})"
    return f"mailto:{CONTACT}?subject={re.sub(' ', '%20', sujet)}", False


# ───────────────────────── gabarit ─────────────────────────
def gabarit():
    s = GABARIT.read_text(encoding="utf-8")
    head = s[: s.index("</head>")]
    head = re.sub(r'\s*<script type="application/ld\+json">.*?</script>', "", head, flags=re.S)
    corps = s[s.index("</head>"): s.index("<main")]
    corps = re.sub(r'\n<div class="px-12 py-4 border-b.*?</div>\n', "\n", corps, count=1, flags=re.S)  # fil d'Ariane
    main = s[s.index("<main"): s.index("</main>")]
    infolettre = re.search(r'<section class="end-wrap end-wrap--nl.*?</section>', main, re.S).group(0)
    fin = s[s.index("</main>") + len("</main>"):]
    return head, corps, infolettre, fin


def tete(head, titre, description, url, jsonld, noindex=False):
    h = head
    h = re.sub(r"<title>.*?</title>", f"<title>{e(titre)}</title>", h)
    for attr in ('name="description"', 'property="og:description"', 'name="twitter:description"'):
        h = re.sub(rf'(<meta {attr} content=")[^"]*(")', lambda m: m.group(1) + e(description) + m.group(2), h)
    for attr in ('property="og:title"', 'name="twitter:title"'):
        h = re.sub(rf'(<meta {attr} content=")[^"]*(")', lambda m: m.group(1) + e(titre) + m.group(2), h)
    h = re.sub(r'(<link rel="canonical" href=")[^"]*(")', lambda m: m.group(1) + url + m.group(2), h)
    h = re.sub(r'(<meta property="og:url" content=")[^"]*(")', lambda m: m.group(1) + url + m.group(2), h)
    h = re.sub(r'(<link rel="alternate" hreflang="[^"]+" href=")[^"]*(")', lambda m: m.group(1) + url + m.group(2), h)
    if noindex:
        h = h.replace("<title>", '<meta name="robots" content="noindex"/>\n<title>', 1)
    h += f'\n<script type="application/ld+json">\n{json.dumps(jsonld, ensure_ascii=False, indent=2)}\n</script>\n'
    return h


def menu_actif(corps):
    return corps.replace('href="calendrier.html">Calendrier', 'href="calendrier.html" aria-current="page">Calendrier')


def ariane(*items):
    parts = []
    for i, (lib, href) in enumerate(items):
        if href:
            parts.append(f'<a href="{href}" class="hover:text-white transition-colors duration-300">{e(lib)}</a>')
        else:
            parts.append(f'<span class="text-on-surface">{e(lib)}</span>')
    sep = '<span class="mx-3">·</span>'
    return ('\n<div class="px-12 py-4 border-b-[0.5px] border-outline-variant">\n'
            '  <p class="font-label text-[10px] uppercase tracking-[0.15em] text-outline">\n    '
            + f"\n    {sep}".join(parts) + "\n  </p>\n</div>\n")


def jsonld_evenement(ev):
    l = ev["lieu"]
    if l.get("en_ligne"):
        mode, lieu = "https://schema.org/OnlineEventAttendanceMode", {"@type": "VirtualLocation", "url": f"{SITE}/evenement-{ev['slug']}.html"}
    else:
        mode = "https://schema.org/OfflineEventAttendanceMode"
        lieu = {"@type": "Place", "name": l.get("nom") or l.get("ville"),
                "address": {"@type": "PostalAddress", "streetAddress": l.get("adresse", ""), "addressLocality": l.get("ville", ""),
                            "addressRegion": "QC", "addressCountry": "CA"}}
    return {
        "@context": "https://schema.org", "@type": "Event", "name": ev["titre"],
        "description": " ".join(ev.get("description", [])),
        "startDate": dt(ev, "debut").isoformat(), "endDate": dt(ev, "fin").isoformat(),
        "eventStatus": "https://schema.org/EventScheduled", "eventAttendanceMode": mode, "location": lieu,
        "organizer": {"@type": "Person", "name": "Benjamin Ali Aboudou", "url": f"{SITE}/a-propos.html"},
        "url": f"{SITE}/evenement-{ev['slug']}.html", "inLanguage": "fr-CA",
    }


def ics(ev):
    def f(d):
        return d.astimezone(ZoneInfo("UTC")).strftime("%Y%m%dT%H%M%SZ")
    def esc(t):
        return str(t).replace("\\", "\\\\").replace(";", "\\;").replace(",", "\\,").replace("\n", "\\n")
    return "\r\n".join([
        "BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//enneagramme.co//Calendrier//FR", "CALSCALE:GREGORIAN",
        "BEGIN:VEVENT", f"UID:{ev['slug']}@enneagramme.co", f"DTSTAMP:{f(datetime.now(TZ))}",
        f"DTSTART:{f(dt(ev, 'debut'))}", f"DTEND:{f(dt(ev, 'fin'))}",
        f"SUMMARY:{esc(ev['titre'])}", f"LOCATION:{esc(lieu_detail(ev))}",
        f"DESCRIPTION:{esc(' '.join(ev.get('description', [])) + ' ' + SITE + '/evenement-' + ev['slug'] + '.html')}",
        f"URL:{SITE}/evenement-{ev['slug']}.html", "END:VEVENT", "END:VCALENDAR", ""])


# ───────────────────────── pages ─────────────────────────
def ligne(ev, aujourd_hui):
    d = date.fromisoformat(ev["date"])
    passe = d < aujourd_hui
    etat = '<span class="cal-row__tag">Complet</span>' if ev.get("complet") else ""
    return f'''      <li class="cal-row{' is-past' if passe else ''}" data-date="{ev['date']}">
        <a href="evenement-{ev['slug']}.html" class="cal-row__link">
          <span class="cal-row__date"><b>{d.day}</b><span>{MOIS_COURT[d.month - 1]} {d.year}</span></span>
          <span class="cal-row__when"><span>{JOURS[d.weekday()].capitalize()}</span> <span>{horaire(ev)}</span></span>
          <span class="cal-row__title">{e(ev['titre'])}{etat}</span>
          <span class="cal-row__place">{e(lieu_court(ev))}</span>
          <span class="pill pill--sm cal-row__btn">Détails {FLECHE}</span>
        </a>
      </li>'''


def page_calendrier(evs, head, corps, infolettre, fin, aujourd_hui):
    a_venir = [ev for ev in evs if date.fromisoformat(ev["date"]) >= aujourd_hui]
    passes = sorted([ev for ev in evs if date.fromisoformat(ev["date"]) < aujourd_hui], key=lambda x: x["date"], reverse=True)
    url = f"{SITE}/calendrier.html"
    desc = "Les prochains ateliers et conférences Ennéagramme de Benjamin Ali Aboudou, à Montréal, Trois-Rivières et en ligne : dates, horaires et lieux."
    ld = {"@context": "https://schema.org", "@type": "ItemList", "name": "Calendrier des ateliers Ennéagramme",
          "itemListElement": [{"@type": "ListItem", "position": i + 1, "url": f"{SITE}/evenement-{ev['slug']}.html"} for i, ev in enumerate(a_venir)]}
    vide = ('<p class="cal-empty"' + ('' if not a_venir else ' hidden') + '>Aucune date annoncée pour le moment. '
            'Inscrivez-vous à l\'infolettre ci-dessous pour être prévenu des prochains ateliers.</p>')
    out = tete(head, "Calendrier des ateliers Ennéagramme | Benjamin Ali Aboudou", desc, url, ld)
    out += menu_actif(corps).rstrip() + ariane(("Accueil", "/"), ("Calendrier", None)) + f'''
<main class="flex flex-col">

  <section class="page-hero border-b-[0.5px] border-outline-variant px-12 md:px-16 pt-24 pb-20">
    <div class="page-hero__art" data-style="hero" data-centres="0.7,0.3,14,10;0.78,0.62,14,10;0.86,0.3,14,10;0.94,0.62,14,10" aria-hidden="true"></div>
    <p class="eyebrow">Calendrier</p>
    <div class="cal-hero">
      <h1 class="h-display" style="font-size:clamp(2.6rem,5.6vw,5rem);text-transform:none">Prochains <em>rendez-vous</em></h1>
      <p class="lede">Ateliers, conférences et rencontres autour de l'Ennéagramme, à Montréal, en Mauricie et en ligne.</p>
    </div>
  </section>

  <section class="cal px-12 md:px-16" aria-labelledby="cal-avenir">
    <h2 id="cal-avenir" class="sr-only">Dates à venir</h2>
    <ol class="cal-list" data-cal="avenir">
{chr(10).join(ligne(ev, aujourd_hui) for ev in a_venir)}
    </ol>
    {vide}
  </section>

  <section class="cal cal--past px-12 md:px-16" aria-labelledby="cal-passe"{'' if passes else ' hidden'}>
    <h2 id="cal-passe" class="cal-subtitle">Dates passées</h2>
    <ol class="cal-list" data-cal="passe">
{chr(10).join(ligne(ev, aujourd_hui) for ev in passes)}
    </ol>
  </section>

  {infolettre}
</main>
<script>
  /* Une date qui vient de passer rejoint « Dates passées », sans attendre une nouvelle génération. */
  (function () {{
    var now = new Date(); var today = now.getFullYear() + '-' + String(now.getMonth() + 1).padStart(2, '0') + '-' + String(now.getDate()).padStart(2, '0');
    var up = document.querySelector('[data-cal="avenir"]'), past = document.querySelector('[data-cal="passe"]');
    [].slice.call(up.children).forEach(function (li) {{ if (li.getAttribute('data-date') < today) {{ li.classList.add('is-past'); past.insertBefore(li, past.firstChild); }} }});
    if (past.children.length) past.closest('section').hidden = false;
    if (!up.children.length) document.querySelector('.cal-empty').hidden = false;
  }})();
</script>
''' + fin
    (RACINE / "calendrier.html").write_text(out, encoding="utf-8")


def page_evenement(ev, head, corps, infolettre, fin, aujourd_hui):
    url = f"{SITE}/evenement-{ev['slug']}.html"
    titre_page = f"{ev['titre']} · {date_longue(ev)} | Benjamin Ali Aboudou"
    desc = f"{ev['titre']} le {date_longue(ev).lower()}, {horaire(ev)}, {lieu_court(ev)}. " + (ev.get("description") or [""])[0]
    resa, externe = lien_reservation(ev)
    passe = date.fromisoformat(ev["date"]) < aujourd_hui
    if ev.get("complet"):
        bouton = '<span class="pill pill--line" aria-disabled="true">Complet</span>'
    elif passe:
        bouton = '<a class="pill pill--ink" href="calendrier.html">Voir les prochaines dates</a>'
    else:
        cible = ' target="_blank" rel="noopener"' if externe else ""
        bouton = f'<a class="pill pill--ink" href="{e(resa)}"{cible}>Réserver ma place {FLECHE}</a>'
    l = ev["lieu"]
    carte = ""
    if not l.get("en_ligne") and (l.get("adresse") or (l.get("nom") and l["nom"] != "Lieu à confirmer")):
        q = re.sub(r"\s+", "+", lieu_detail(ev))
        carte = f' <a class="textlink" style="margin-top:.4rem" href="https://www.google.com/maps/search/?api=1&amp;query={e(q)}" target="_blank" rel="noopener">Voir sur la carte</a>'
    paras = "\n        ".join(f"<p>{e(p)}</p>" for p in ev.get("description", []))
    out = tete(head, titre_page, desc, url, jsonld_evenement(ev), noindex=ev.get("exemple", False))
    out += menu_actif(corps).rstrip() + ariane(("Accueil", "/"), ("Calendrier", "calendrier.html"), (ev["titre"], None)) + f'''
<main class="flex flex-col">

  <section class="page-hero border-b-[0.5px] border-outline-variant px-12 md:px-16 pt-24 pb-20">
    <div class="page-hero__art" data-style="hero" data-centres="0.84,0.42,26,9" aria-hidden="true"></div>
    <p class="eyebrow">{e(date_longue(ev))} · {horaire(ev)}</p>
    <div class="ev-hero">
      <h1 class="h-display" style="font-size:clamp(2.4rem,5vw,4.6rem);text-transform:none">{e(ev['titre'])}</h1>
      <div class="ev-hero__aside">
        <p class="ev-place">{e(lieu_detail(ev))}</p>
        <div class="end__actions">
          {bouton}
          <a class="pill pill--line" href="agenda/{ev['slug']}.ics" download>Ajouter à mon agenda</a>
        </div>
      </div>
    </div>
  </section>

  <section class="ev-body px-12 md:px-16">
    <div class="ev-grid">
      <div class="ap-body">
        {paras}
        <a class="textlink" href="{ev['atelier']}">Découvrir le contenu de l'atelier {FLECHE}</a>
      </div>
      <dl class="ev-infos">
        <div><dt>Date</dt><dd>{e(date_longue(ev))}</dd></div>
        <div><dt>Horaire</dt><dd>{horaire(ev)}</dd></div>
        <div><dt>Lieu</dt><dd>{e(lieu_detail(ev))}{carte}</dd></div>
        <div><dt>Tarif</dt><dd>{e(ev.get('prix', ''))}</dd></div>
        <div><dt>Groupe</dt><dd>{e(ev.get('places', ''))}</dd></div>
      </dl>
    </div>
  </section>

  <section class="end-wrap end-wrap--cta px-12 md:px-16" aria-label="Autres dates">
    <div class="end__cta">
      <div class="end__art" data-style="hero" data-centres="0.8,0.55,26,13;0.93,0.25,26,13" aria-hidden="true"></div>
      <div>
        <p class="eyebrow">Calendrier</p>
        <h2>Toutes les <em>prochaines dates</em></h2>
        <p class="end__lede">Ateliers en groupe, en présentiel ou en ligne. Une question avant de vous inscrire ? Écrivez-moi.</p>
      </div>
      <div class="end__actions">
        <a class="pill pill--ink" href="calendrier.html">Voir le calendrier</a>
        <a class="pill pill--line" href="mailto:{CONTACT}">Me contacter</a>
      </div>
    </div>
  </section>
  {infolettre}
</main>
''' + fin
    (RACINE / f"evenement-{ev['slug']}.html").write_text(out, encoding="utf-8")
    (RACINE / "agenda").mkdir(exist_ok=True)
    (RACINE / "agenda" / f"{ev['slug']}.ics").write_text(ics(ev), encoding="utf-8", newline="")


def sitemap(evs):
    p = RACINE / "sitemap.xml"
    s = p.read_text(encoding="utf-8")
    s = re.sub(r"\s*<url>\s*<loc>https://enneagramme\.co/(calendrier|evenement-[^<]+)\.html</loc>.*?</url>", "", s, flags=re.S)
    jour = date.today().isoformat()
    ajout = [("calendrier", "weekly", "0.9")] + [(f"evenement-{ev['slug']}", "monthly", "0.6") for ev in evs if not ev.get("exemple")]
    bloc = "".join(f"\n  <url>\n    <loc>{SITE}/{n}.html</loc>\n    <lastmod>{jour}</lastmod>\n    <changefreq>{c}</changefreq>\n    <priority>{pr}</priority>\n  </url>" for n, c, pr in ajout)
    s = s.replace("\n</urlset>", bloc + "\n</urlset>")
    p.write_text(s, encoding="utf-8")


def main():
    data = json.loads((RACINE / "donnees" / "calendrier.json").read_text(encoding="utf-8"))
    evs = sorted(data["evenements"], key=lambda x: (x["date"], x["debut"]))
    slugs = [ev["slug"] for ev in evs]
    assert len(slugs) == len(set(slugs)), "deux événements ont le même slug"
    for ev in evs:
        assert re.fullmatch(r"[a-z0-9-]+", ev["slug"]), f"slug invalide : {ev['slug']}"
    # pages d'événements supprimés du fichier
    for vieux in RACINE.glob("evenement-*.html"):
        if vieux.stem[len("evenement-"):] not in slugs:
            vieux.unlink()
    for vieux in (RACINE / "agenda").glob("*.ics") if (RACINE / "agenda").exists() else []:
        if vieux.stem not in slugs:
            vieux.unlink()
    aujourd_hui = datetime.now(TZ).date()
    head, corps, infolettre, fin = gabarit()
    page_calendrier(evs, head, corps, infolettre, fin, aujourd_hui)
    for ev in evs:
        page_evenement(ev, head, corps, infolettre, fin, aujourd_hui)
    sitemap(evs)
    print(f"calendrier.html + {len(evs)} page(s) d'événement générées")


if __name__ == "__main__":
    main()
