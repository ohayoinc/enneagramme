#!/usr/bin/env python3
"""Publication programmée des articles du blog enneagramme.co.

Chaque article est un fichier texte dans contenu/articles/ (format : voir
contenu/articles/LISEZMOI.md). Le script publie tous les articles dont la date
(champ « iso ») est arrivée, heure de Montréal :

  - génère la page HTML de l'article à la racine du site ;
  - ajoute sa carte en tête de blog.html et met à jour les compteurs ;
  - met à jour la section « Derniers articles » de l'accueil (index.html) ;
  - ajoute l'URL au sitemap.xml.

Il ne modifie rien s'il n'y a rien à publier : on peut le relancer sans risque.
La tâche GitHub « Publication programmée des articles » le lance chaque matin.

Usage :
  python3 outils/publier.py                    # publie ce qui est dû aujourd'hui
  python3 outils/publier.py --liste            # calendrier, sans rien modifier
  python3 outils/publier.py --date 2026-12-07  # simule une autre date
"""
import argparse
import datetime as dt
import pathlib
import re
import sys
from zoneinfo import ZoneInfo

ROOT = pathlib.Path(__file__).resolve().parent.parent
SOURCES = ROOT / 'contenu' / 'articles'
GABARIT = ROOT / 'presence-pratique-enneagramme-russ-hudson.html'  # article publié servant de gabarit
ACCUEIL = ROOT / 'index.html'
MOTS_PAR_MINUTE = 215  # ratio observé sur les articles existants

MOIS = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet', 'août',
        'septembre', 'octobre', 'novembre', 'décembre']
CATEGORIES = {'PERSONNEL': 'Personnel', 'COUPLE': 'Couple', 'COLLECTIF': 'Collectif', 'TECHNIQUE': 'Technique'}
# Illustration générative (dist/art.js) : nombre de « présences » : 1 soi, 2 couple, 3 triade, 5 équipe
PRESENCES = {'PERSONNEL': 1, 'COUPLE': 2, 'COLLECTIF': 5, 'TECHNIQUE': 3}

P = '<p class="font-body text-lg leading-relaxed text-on-surface mt-5">{}</p>'
H2 = '<h2 class="font-headline font-bold uppercase tracking-tighter text-primary mt-16 mb-6 leading-tight" style="font-size:clamp(20px,2.5vw,30px)">{}</h2>'
H3 = '<h3 class="font-headline font-bold uppercase tracking-tighter text-primary mt-10 mb-4" style="font-size:clamp(14px,1.6vw,19px)">{}</h3>'
LIEN = '<a href="{href}" class="text-primary underline underline-offset-2 hover:text-outline transition-colors">{texte}</a>'


def date_fr(iso):
    d = dt.date.fromisoformat(iso)
    return f'{d.day} {MOIS[d.month - 1]} {d.year}'


def attr(t):
    return t.replace('&', '&amp;').replace('"', '&quot;')


# ------------------------------------------------------------------ sources

def lire(path):
    entete, corps = path.read_text(encoding='utf-8').split('\n---\n', 1)
    a = dict(l.split(': ', 1) for l in entete.strip().splitlines() if l.strip())
    for cle in ('slug', 'cat', 'iso', 'title', 'desc', 'source'):
        if cle not in a:
            sys.exit(f'{path.name} : champ « {cle} » manquant')
    if a['cat'] not in CATEGORIES:
        sys.exit(f'{path.name} : catégorie « {a["cat"]} » inconnue ({", ".join(CATEGORIES)})')
    dt.date.fromisoformat(a['iso'])
    a['corps'] = corps
    a['related'] = a.get('related', '').split()
    a['date'] = date_fr(a['iso'])
    a['read'] = max(1, round(len(re.sub(r'\[([^\]]+)\]\([^)]+\)', r'\1', corps).split()) / MOTS_PAR_MINUTE))
    return a


def corps_html(corps, publiable):
    def liens(t):
        def rempl(m):
            texte, href = m.group(1), m.group(2)
            if not publiable(href):
                print(f'    lien retiré (page pas encore en ligne) : {href}')
                return texte
            return LIEN.format(href=href, texte=texte)
        return re.sub(r'\[([^\]]+)\]\(([^)]+)\)', rempl, t)

    blocs = []
    for bloc in re.split(r'\n\s*\n', corps.strip()):
        b = ' '.join(l.strip() for l in bloc.strip().splitlines())
        if b.startswith('### '):
            blocs.append(H3.format(b[4:]))
        elif b.startswith('## '):
            blocs.append(H2.format(b[3:]))
        elif b.startswith('Q: '):
            q, r = b[3:].split(' R: ', 1)
            blocs.append(H3.format(q))
            blocs.append(P.format(liens(r)))
        else:
            blocs.append(P.format(liens(b)))
    return '\n'.join(blocs)


# ------------------------------------------------------------------ blog.html

def cartes_blog(blog):
    cartes = []
    for m in re.finditer(r'<a href="([^"]+)"\s+class="article-card.*?</a>', blog, re.S):
        bloc = m.group(0)
        spans = re.findall(r'<span class="font-label[^"]*">([^<]+)</span>', bloc)
        cartes.append({
            'href': m.group(1),
            'cat': spans[0],
            'date': spans[1],
            'title': re.search(r'<h2[^>]*>([^<]+)</h2>', bloc).group(1),
        })
    return cartes


def carte_blog(a):
    recherche = attr((a['title'] + ' ' + a['desc']).lower().replace("'", '').replace('’', ''))
    return f'''
    <a href="{a['slug']}.html"
       class="article-card bg-background p-10 md:p-12 flex flex-col justify-between group hover:bg-surface-container transition-colors duration-300 cursor-pointer"
       data-cat="{CATEGORIES[a['cat']]}"
       data-search="{recherche}">
      <div class="art" data-style="cercles" data-n="{PRESENCES[a['cat']]}" data-seed="{a['slug']}.html" aria-hidden="true"></div>
      <div>
        <div class="flex items-center gap-3 mb-6 flex-wrap">
          <span class="font-label text-[10px] uppercase tracking-[0.15em] text-outline border-[0.5px] border-outline-variant px-3 py-1">{a['cat']}</span>
          <span class="font-label text-[10px] uppercase tracking-[0.15em] text-outline">{a['date']}</span>
          <span class="font-label text-[10px] uppercase tracking-[0.15em] text-outline">{a['read']} min</span>
        </div>
        <h2 class="font-headline font-bold uppercase text-xl tracking-tight text-primary leading-tight group-hover:tracking-wide transition-all duration-500 mb-4">{a['title']}</h2>
        <p class="font-body text-sm text-on-surface-variant leading-relaxed">{a['desc']}</p>
      </div>
      <p class="font-label text-[11px] uppercase tracking-[0.15em] text-primary mt-6 pt-6 border-t-[0.5px] border-outline-variant">Lire →</p>
    </a>'''


def maj_blog(blog, nouveaux):
    i = blog.index('id="articles-grid"')
    i = blog.index('>', i) + 1
    blog = blog[:i] + ''.join(carte_blog(a) for a in sorted(nouveaux, key=lambda a: a['iso'], reverse=True)) + blog[i:]
    n = len(cartes_blog(blog))
    blog = re.sub(r'BLOG · \d+ ARTICLES', f'BLOG · {n} ARTICLES', blog)
    blog = re.sub(r'(id="result-count"[^>]*>)\d+ articles', rf'\g<1>{n} articles', blog)
    blog = re.sub(r'(<p class="font-headline[^"]*">)\d+(</p>\s*<p[^>]*>Articles</p>)', rf'\g<1>{n}\2', blog)
    return blog


# ------------------------------------------------------------------ page d'article

def page_article(a, cartes, publiable):
    s = GABARIT.read_text(encoding='utf-8')
    ancien_slug = GABARIT.stem
    ancien_titre = re.search(r'<h1[^>]*>([^<]+)</h1>', s).group(1)
    ancienne_desc = re.search(r'<meta name="description" content="([^"]+)"', s).group(1)

    debut = s.index('<p class="font-body text-lg leading-relaxed text-on-surface mt-5">')
    fin = s.index('      </div>\n      <aside')
    s = s[:debut] + corps_html(a['corps'], publiable) + '\n' + s[fin:]

    # « Autres articles » : ceux demandés s'ils sont en ligne, complétés par les plus récents
    par_slug = {c['href'][:-5]: c for c in cartes}
    choix = [par_slug[r] for r in a['related'] if r in par_slug]
    for c in cartes:
        if len(choix) >= 3:
            break
        if c not in choix and c['href'][:-5] != a['slug']:
            choix.append(c)
    html = ''.join(f'''
      <a href="{c['href']}" class="bg-background p-8 flex flex-col justify-between group hover:bg-surface-container transition-colors duration-300 border-[0.5px] border-outline-variant">
        <div>
          <p class="font-label text-[10px] uppercase tracking-[0.15em] text-outline mb-4">{c['cat']} · {c['date']}</p>
          <h3 class="font-headline font-bold uppercase text-base tracking-tight text-primary leading-tight group-hover:tracking-wide transition-all duration-500">{c['title']}</h3>
        </div>
        <p class="font-label text-[11px] uppercase tracking-[0.15em] text-primary mt-6">Lire →</p>
      </a>''' for c in choix[:3])
    d = s.index('AUTRES ARTICLES')
    d = s.index('grid grid-cols-1 md:grid-cols-3', d)
    d = s.index('>', d) + 1
    f = s.index('    </div>\n  </section>', d)
    s = s[:d] + '\n' + html + '\n' + s[f:]

    s = s.replace(ancien_slug, a['slug']).replace(ancien_titre, a['title']).replace(ancienne_desc, attr(a['desc']))
    s = re.sub(r'(<span class="text-on-surface">)[^<]+(</span>\s*</p>\s*</div>\s*<main)', rf'\g<1>{CATEGORIES[a["cat"]]}\2', s, count=1)
    s = re.sub(r'(px-3 py-1">)[A-ZÉ]+(</span>\s*<span[^>]*>)[^<]+(</span>\s*<span[^>]*>)\d+( min de lecture</span>)',
               rf'\g<1>{a["cat"]}\g<2>{a["date"]}\g<3>{a["read"]}\4', s, count=1)
    s = re.sub(r'("datePublished": ")[^"]+(")', rf'\g<1>{a["iso"]}\2', s)
    s = re.sub(r'(class="art art--banner" data-style="cercles" data-n=")\d+', rf'\g<1>{PRESENCES[a["cat"]]}', s)
    for verif in (ancien_titre, ancien_slug, 'Russ Hudson'):
        if verif in s and verif not in a['corps'] and verif not in a['title']:
            sys.exit(f'{a["slug"]} : reste du gabarit non remplacé ({verif})')
    (ROOT / f'{a["slug"]}.html').write_text(s, encoding='utf-8')


# ------------------------------------------------------------------ accueil et sitemap

def infos_accueil(href, sources):
    """Date, catégorie, titre et mention « D'après » d'un article en ligne."""
    for a in sources:
        if f'{a["slug"]}.html' == href:
            return a['date'], CATEGORIES[a['cat']], a['title'], a['source'], PRESENCES[a['cat']]
    acc = ACCUEIL.read_text(encoding='utf-8')
    m = re.search(rf'<a class="post" href="{re.escape(href)}">.*?</a>', acc, re.S)
    if m:  # carte déjà présente sur l'accueil : on la garde telle quelle
        return None, m.group(0)
    return 'inconnu', href


def maj_accueil(acc, cartes, sources):
    blocs = []
    for c in cartes[:3]:
        info = infos_accueil(c['href'], sources)
        if info[0] is None:
            blocs.append('        ' + info[1])
            continue
        if info[0] == 'inconnu':
            sys.exit(f'Accueil : impossible de construire la carte de {c["href"]}')
        date, cat, titre, source, n = info
        blocs.append(f'''        <a class="post" href="{c['href']}">
          <div class="art" data-style="cercles" data-n="{n}" data-seed="{c['href']}" aria-hidden="true"></div>
          <div class="post__body">
            <p class="post__meta">{date} · {cat}</p>
            <h3 class="post__title">{titre}</h3>
            <div class="post__foot"><span class="post__meta">{source}</span><span class="pill pill--sm">Lire</span></div>
          </div>
        </a>''')
    d = acc.index('id="posts-title"')
    d = acc.index('<div class="cards cards--3">', d) + len('<div class="cards cards--3">')
    f = acc.index('\n      </div>\n      <a class="pill pill--line" href="blog.html"', d)
    return acc[:d] + '\n' + '\n'.join(blocs) + acc[f:]


def maj_sitemap(sm, nouveaux):
    for a in sorted(nouveaux, key=lambda a: a['iso']):
        loc = f'https://enneagramme.co/{a["slug"]}.html'
        if loc not in sm:
            sm = sm.replace('</urlset>', f'''  <url>
    <loc>{loc}</loc>
    <lastmod>{a["iso"]}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.7</priority>
  </url>
</urlset>''')
    return sm


# ------------------------------------------------------------------ programme principal

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--date', help='date du jour à simuler (AAAA-MM-JJ)')
    ap.add_argument('--liste', action='store_true', help='afficher le calendrier sans rien modifier')
    args = ap.parse_args()
    aujourdhui = args.date or dt.datetime.now(ZoneInfo('America/Montreal')).date().isoformat()

    sources = sorted((lire(p) for p in SOURCES.glob('*.txt')), key=lambda a: a['iso'])
    blog = (ROOT / 'blog.html').read_text(encoding='utf-8')
    en_ligne = {c['href'] for c in cartes_blog(blog)}

    if args.liste:
        print(f"Aujourd'hui (Montréal) : {aujourdhui}")
        for a in sources:
            etat = 'en ligne' if f'{a["slug"]}.html' in en_ligne else ('à publier' if a['iso'] <= aujourdhui else 'programmé')
            print(f'  {a["iso"]}  {etat:10} {a["cat"]:10} {a["title"]}')
        return

    a_publier = [a for a in sources if a['iso'] <= aujourdhui and f'{a["slug"]}.html' not in en_ligne]
    if not a_publier:
        print(f'{aujourdhui} : rien à publier.')
        return

    programmes = {f'{a["slug"]}.html' for a in sources if a['iso'] > aujourdhui}

    def publiable(href):
        if href in programmes:
            return False
        if href.endswith('.html'):
            return (ROOT / href).exists() or href in {f'{a["slug"]}.html' for a in a_publier}
        return True

    blog = maj_blog(blog, a_publier)
    cartes = cartes_blog(blog)
    for a in a_publier:
        print(f'Publication : {a["slug"]}.html ({a["date"]}, {a["read"]} min)')
        page_article(a, cartes, publiable)
    (ROOT / 'blog.html').write_text(blog, encoding='utf-8')
    ACCUEIL.write_text(maj_accueil(ACCUEIL.read_text(encoding='utf-8'), cartes, sources), encoding='utf-8')
    sm = ROOT / 'sitemap.xml'
    sm.write_text(maj_sitemap(sm.read_text(encoding='utf-8'), a_publier), encoding='utf-8')
    print(f'Blog : {len(cartes)} articles. Accueil et sitemap mis à jour.')


if __name__ == '__main__':
    main()
