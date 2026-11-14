#!/usr/bin/env python3
"""Relie la chaîne YouTube et le site.

Source : donnees/videos.json. Usage, depuis la racine du dépôt :
    python3 outils/videos.py

- intègre la vidéo principale (et les liens vers les autres vidéos du même sujet)
  dans chaque page associée, entre les marqueurs <!-- videos:debut --> / <!-- videos:fin --> ;
- génère la page videos.html (toutes les vidéos par thème, avec le lien vers l'article) ;
- ajoute « Vidéos » et « YouTube » au pied de page de toutes les pages ;
- déclare la chaîne dans les données structurées de l'accueil (sameAs) ;
- ajoute videos.html au sitemap.

Le lecteur ne charge rien de YouTube avant le clic (miniatures hébergées sur le site,
lecteur youtube-nocookie.com) : aucune donnée n'est envoyée à Google sans action du visiteur.
Pour ajouter une vidéo : ajouter son entrée dans donnees/videos.json, déposer ses miniatures
dans images/videos/ (ID-640.webp et ID-1280.webp, 16:9) puis relancer ce script.
"""
import json
import re
import sys
from datetime import date
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from calendrier import FLECHE, SITE, ariane, e, gabarit, tete  # noqa: E402

RACINE = Path(__file__).resolve().parent.parent
DEBUT, FIN = "<!-- videos:debut -->", "<!-- videos:fin -->"
LECTURE = ('<svg viewBox="0 0 68 48" aria-hidden="true"><path class="video__btn-bg" d="M66.5 7.7a8.5 8.5 0 0 0-6-6C55.2.3 34 .3 34 .3s-21.2 0-26.5 1.4a8.5 8.5 0 0 0-6 6C.1 13 .1 24 .1 24s0 11 1.4 16.3a8.5 8.5 0 0 0 6 6C12.8 47.7 34 47.7 34 47.7s21.2 0 26.5-1.4a8.5 8.5 0 0 0 6-6C67.9 35 67.9 24 67.9 24s0-11-1.4-16.3z"/>'
           '<path d="M45 24 27 14v20" fill="#fff"/></svg>')


def duree_iso(d):
    p = [int(x) for x in d.split(":")]
    h, m, s = ([0] * (3 - len(p)) + p)
    return f"PT{h}H{m}M{s}S" if h else f"PT{m}M{s}S"


def duree_texte(d):
    p = [int(x) for x in d.split(":")]
    minutes = p[-2] + (60 * p[0] if len(p) == 3 else 0) + (1 if p[-1] >= 30 else 0)
    return f"{max(minutes, 1)} min"


def jsonld_video(v, page_url):
    """VideoObject : seulement si la date de publication est connue (champ obligatoire pour Google)."""
    if not v.get("date"):
        return None
    return {
        "@context": "https://schema.org",
        "@type": "VideoObject",
        "name": v["titre"],
        "description": v.get("description") or v["titre"],
        "thumbnailUrl": [f"{SITE}/images/videos/{v['id']}-1280.webp"],
        "uploadDate": v["date"],
        "duration": duree_iso(v["duree"]),
        "embedUrl": f"https://www.youtube.com/embed/{v['id']}",
        "url": f"https://www.youtube.com/watch?v={v['id']}",
        "inLanguage": "fr",
        "author": {"@type": "Person", "name": "Benjamin Ali Aboudou", "url": f"{SITE}/a-propos.html"},
        "isPartOf": {"@type": "WebPage", "url": page_url},
    }


def lecteur(v, eager=False):
    return f'''<figure class="video" id="video">
  <button class="video__play" type="button" data-video="{v['id']}" aria-label="Lire la vidéo : {e(v['titre'])} ({duree_texte(v['duree'])})">
    <picture><source type="image/webp" srcset="/images/videos/{v['id']}-640.webp 640w, /images/videos/{v['id']}-1280.webp 1280w" sizes="(min-width: 900px) 760px, 100vw"/><img src="/images/videos/{v['id']}-1280.webp" alt="Miniature de la vidéo : {e(v['titre'])}" width="1280" height="720"{'' if eager else ' loading="lazy"'} decoding="async"/></picture>
    <span class="video__btn">{LECTURE}</span>
    <span class="video__time">{e(v['duree'])}</span>
  </button>
  <figcaption class="video__cap"><span class="video__label">En vidéo</span> {e(v['titre'])}</figcaption>
</figure>'''


def bloc_page(videos, chaine, page_url):
    principale, autres = videos[0], videos[1:]
    ld = jsonld_video(principale, page_url)
    autres_html = ""
    if autres:
        items = "\n".join(f'      <li><a href="https://www.youtube.com/watch?v={v["id"]}" target="_blank" rel="noopener">{e(v["titre"])}</a> <span>{duree_texte(v["duree"])}</span></li>' for v in autres)
        autres_html = f'''
  <div class="video-more">
    <p class="video-more__title">Aussi en vidéo sur ce sujet</p>
    <ul>
{items}
    </ul>
  </div>'''
    return f'''{DEBUT}
<div class="video-block">
<link rel="stylesheet" href="/assets/video.css"/>
{lecteur(principale)}{autres_html}
  <p class="video-links"><a href="videos.html">Toutes les vidéos</a> · <a href="{chaine['url']}?sub_confirmation=1" target="_blank" rel="noopener">S'abonner à la chaîne YouTube</a></p>
<script src="/assets/video.js" defer></script>
{('<script type="application/ld+json">' + chr(10) + json.dumps(ld, ensure_ascii=False, indent=2) + chr(10) + '</script>') if ld else ''}
</div>
{FIN}'''


def inserer(html, bloc):
    """Remplace le bloc existant, sinon le place avant le premier intertitre de l'article
    (ou, sur les pages thématiques, avant l'appel à l'action de fin de page)."""
    if DEBUT in html:
        return re.sub(re.escape(DEBUT) + r".*?" + re.escape(FIN), lambda m: bloc, html, count=1, flags=re.S)
    i = html.find("md:col-span-8")
    if i != -1:
        j = html.find("<h2", i)
        if j != -1:
            return html[:j] + bloc + "\n" + html[j:]
    j = html.find('<section class="end-wrap end-wrap--cta')
    assert j != -1, "emplacement introuvable"
    section = f'<section class="px-12 md:px-16 py-16 border-b-[0.5px] border-outline-variant">\n<div class="max-w-3xl">\n{bloc}\n</div>\n</section>\n\n  '
    return html[:j] + section + html[j:]


def carte(v):
    if v.get("page"):
        lien, cible = f"{v['page']}#video", ""
    else:
        lien, cible = f"https://www.youtube.com/watch?v={v['id']}", ' target="_blank" rel="noopener"'
    article = f'<a class="vcard__article" href="{v["page"]}">Lire l\'article {FLECHE}</a>' if v.get("page") else ""
    return f'''      <li class="vcard">
        <a class="vcard__thumb" href="{lien}"{cible} aria-label="Voir la vidéo : {e(v['titre'])}">
          <img src="/images/videos/{v['id']}-640.webp" alt="Miniature de la vidéo : {e(v['titre'])}" width="640" height="360" loading="lazy" decoding="async"/>
          <span class="video__time">{e(v['duree'])}</span>
        </a>
        <h3 class="vcard__title"><a href="{lien}"{cible}>{e(v['titre'])}</a></h3>
        {article}
      </li>'''


def page_videos(data, head, corps, infolettre, fin):
    chaine, videos = data["chaine"], data["videos"]
    presentation = next((v for v in videos if not v.get("page")), videos[0])
    url = f"{SITE}/videos.html"
    desc = ("Vidéos sur l'Ennéagramme par Benjamin Ali Aboudou : les 9 profils, les sous-types, "
            "le couple et le travail en équipe, chacune reliée à son article.")
    ld = {"@context": "https://schema.org", "@type": "CollectionPage", "name": "Vidéos sur l'Ennéagramme", "url": url,
          "isPartOf": {"@type": "WebSite", "url": SITE},
          "mainEntity": {"@type": "ItemList", "itemListElement": [
              {"@type": "ListItem", "position": i + 1, "url": f"https://www.youtube.com/watch?v={v['id']}", "name": v["titre"]}
              for i, v in enumerate(videos)]}}
    sections = []
    for cle, nom in data["themes"].items():
        vs = [v for v in videos if v["theme"] == cle and v is not presentation]
        if not vs:
            continue
        sections.append(f'''  <section class="vgrid-wrap px-12 md:px-16" aria-labelledby="t-{cle}">
    <h2 id="t-{cle}" class="vgrid__title">{e(nom)} <span>{len(vs)} vidéo{'s' if len(vs) > 1 else ''}</span></h2>
    <ul class="vgrid">
{chr(10).join(carte(v) for v in vs)}
    </ul>
  </section>''')
    out = tete(head, "Vidéos sur l'Ennéagramme | Chaîne YouTube", desc, url, ld)
    pres_ld = jsonld_video(presentation, url)
    if pres_ld:
        out += f'<script type="application/ld+json">\n{json.dumps(pres_ld, ensure_ascii=False, indent=2)}\n</script>\n'
    out += corps.rstrip() + ariane(("Accueil", "/"), ("Vidéos", None)) + f'''
<main class="flex flex-col">
<link rel="stylesheet" href="/assets/video.css"/>

  <section class="page-hero border-b-[0.5px] border-outline-variant px-12 md:px-16 pt-24 pb-20">
    <p class="eyebrow">Vidéos</p>
    <div class="vhero">
      <div>
        <h1 class="h-display" style="font-size:clamp(2.6rem,5.6vw,5rem);text-transform:none">L'Ennéagramme <em>en vidéo</em></h1>
        <p class="lede">Des vidéos pour comprendre les 9 profils, les sous-types, la vie de couple et le travail en équipe. Chaque vidéo renvoie à l'article qui l'approfondit.</p>
        <p class="vhero__actions"><a class="pill pill--ink" href="{chaine['url']}?sub_confirmation=1" target="_blank" rel="noopener">S'abonner à la chaîne {FLECHE}</a></p>
      </div>
      {lecteur(presentation, eager=True)}
    </div>
  </section>

{chr(10).join(sections)}

  {infolettre}
</main>
<script src="/assets/video.js" defer></script>
''' + fin
    (RACINE / "videos.html").write_text(out, encoding="utf-8")


PIED_REF = 'href="ethique.html">ÉTHIQUE</a>'


def pied_de_page(html, chaine):
    if 'href="videos.html">VIDÉOS</a>' in html or PIED_REF not in html:
        return html
    i = html.index(PIED_REF) + len(PIED_REF)
    debut = html.rfind("<a ", 0, i)
    classe = re.search(r'class="([^"]*)"', html[debut:i]).group(1)
    ajout = (f'\n      <a class="{classe}" href="videos.html">VIDÉOS</a>'
             f'\n      <a class="{classe}" href="{chaine["url"]}" target="_blank" rel="noopener me">YOUTUBE</a>')
    return html[:i] + ajout + html[i:]


def same_as(html, chaine):
    """Déclare la chaîne dans l'objet LocalBusiness de l'accueil."""
    if '"sameAs"' in html:
        return html
    return html.replace('"url": "https://enneagramme.co",', f'"url": "https://enneagramme.co",\n      "sameAs": ["{chaine["url"]}"],', 1)


def sitemap():
    p = RACINE / "sitemap.xml"
    s = p.read_text(encoding="utf-8")
    if f"{SITE}/videos.html" in s:
        return
    bloc = (f"\n  <url>\n    <loc>{SITE}/videos.html</loc>\n    <lastmod>{date.today().isoformat()}</lastmod>\n"
            "    <changefreq>weekly</changefreq>\n    <priority>0.8</priority>\n  </url>")
    p.write_text(s.replace("\n</urlset>", bloc + "\n</urlset>"), encoding="utf-8")


def main():
    data = json.loads((RACINE / "donnees" / "videos.json").read_text(encoding="utf-8"))
    chaine, videos = data["chaine"], data["videos"]
    for v in videos:
        for taille in (640, 1280):
            assert (RACINE / "images" / "videos" / f"{v['id']}-{taille}.webp").exists(), f"miniature manquante : {v['id']}-{taille}.webp"
        assert v["theme"] in data["themes"], v
    par_page = {}
    for v in videos:  # l'ordre du fichier donne la vidéo principale de chaque page
        if v.get("page"):
            par_page.setdefault(v["page"], []).append(v)
    for page, vs in par_page.items():
        p = RACINE / page
        url = f"{SITE}/" + ("" if page == "index.html" else page)
        p.write_text(inserer(p.read_text(encoding="utf-8"), bloc_page(vs, chaine, url)), encoding="utf-8")
    head, corps, infolettre, fin = gabarit()
    page_videos(data, head, corps, infolettre, fin)
    for p in RACINE.glob("*.html"):
        s = p.read_text(encoding="utf-8")
        t = pied_de_page(s, chaine)
        if p.name == "index.html":
            t = same_as(t, chaine)
        if t != s:
            p.write_text(t, encoding="utf-8")
    sitemap()
    print(f"{len(par_page)} page(s) avec vidéo, videos.html générée ({len(videos)} vidéos)")


if __name__ == "__main__":
    main()
