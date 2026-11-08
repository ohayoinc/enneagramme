#!/usr/bin/env python3
"""Audit SEO technique des pages HTML du site (bibliothèque standard uniquement).

Usage : python3 seo/audit.py [--markdown rapport.md]
Code de sortie 1 si des erreurs bloquantes sont trouvées.
"""
import argparse
import os
import re
import sys
import xml.etree.ElementTree as ET
from collections import defaultdict
from html.parser import HTMLParser

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SITE = "https://enneagramme.co"
# Pages volontairement hors index (maquettes, doublons, utilitaires)
EXCLUDED = {"404.html", "landing-a.html", "landing-b.html", "landing-c.html",
            "landing-d.html", "landing-e.html"}


class PageParser(HTMLParser):
    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.title = ""
        self._in_title = False
        self.meta = {}
        self.canonical = None
        self.h1 = []
        self._in_h1 = False
        self.links = []
        self.imgs_no_alt = []
        self.jsonld = 0
        self.lang = None

    def handle_starttag(self, tag, attrs):
        a = dict(attrs)
        if tag == "html":
            self.lang = a.get("lang")
        elif tag == "title":
            self._in_title = True
        elif tag == "meta":
            key = a.get("name") or a.get("property")
            if key:
                self.meta[key.lower()] = a.get("content") or ""
        elif tag == "link" and (a.get("rel") or "").lower() == "canonical":
            self.canonical = a.get("href")
        elif tag == "h1":
            self._in_h1 = True
            self.h1.append("")
        elif tag == "a" and a.get("href"):
            self.links.append(a["href"])
        elif tag == "img" and not (a.get("alt") or "").strip():
            self.imgs_no_alt.append(a.get("src", "?"))
        elif tag == "script" and a.get("type") == "application/ld+json":
            self.jsonld += 1

    def handle_endtag(self, tag):
        if tag == "title":
            self._in_title = False
        elif tag == "h1":
            self._in_h1 = False

    def handle_data(self, data):
        if self._in_title:
            self.title += data
        if self._in_h1 and self.h1:
            self.h1[-1] += data


def sitemap_pages():
    tree = ET.parse(os.path.join(ROOT, "sitemap.xml"))
    ns = {"s": "http://www.sitemaps.org/schemas/sitemap/0.9"}
    out = set()
    for loc in tree.findall(".//s:loc", ns):
        path = loc.text.strip().replace(SITE, "").lstrip("/")
        out.add(path or "index.html")
    return out


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--markdown", help="écrire le rapport en Markdown dans ce fichier")
    args = ap.parse_args()

    pages = sorted(f for f in os.listdir(ROOT) if f.endswith(".html"))
    errors, warnings = defaultdict(list), defaultdict(list)
    titles, descs = defaultdict(list), defaultdict(list)
    in_sitemap = sitemap_pages()

    for page in pages:
        with open(os.path.join(ROOT, page), encoding="utf-8") as fh:
            html = fh.read()
        p = PageParser()
        p.feed(html)
        robots = p.meta.get("robots", "")
        indexable = "noindex" not in robots and page not in EXCLUDED

        for href in p.links:
            target = href.split("#")[0].split("?")[0]
            if not target or re.match(r"^(https?:|mailto:|tel:|javascript:|//)", target):
                continue
            target = target.lstrip("/") or "index.html"
            if target.endswith("/"):
                target += "index.html"
            if not os.path.exists(os.path.join(ROOT, target)):
                errors[page].append(f"lien interne cassé : `{href}`")

        if not indexable:
            if page in in_sitemap:
                errors[page].append("page non indexable présente dans sitemap.xml")
            continue

        title = p.title.strip()
        desc = p.meta.get("description", "").strip()
        if not title:
            errors[page].append("balise <title> manquante")
        elif not 25 <= len(title) <= 65:
            warnings[page].append(f"titre de {len(title)} caractères (idéal 25–65)")
        if not desc:
            errors[page].append("meta description manquante")
        elif not 70 <= len(desc) <= 160:
            warnings[page].append(f"meta description de {len(desc)} caractères (idéal 70–160)")
        titles[title].append(page)
        descs[desc].append(page)

        expected = SITE + "/" + ("" if page == "index.html" else page)
        if not p.canonical:
            errors[page].append("balise canonical manquante")
        elif p.canonical != expected:
            warnings[page].append(f"canonical `{p.canonical}` ≠ `{expected}`")
        if len(p.h1) != 1:
            warnings[page].append(f"{len(p.h1)} balise(s) <h1> (attendu : 1)")
        if not p.meta.get("og:image"):
            warnings[page].append("og:image manquante")
        if not p.jsonld:
            warnings[page].append("aucune donnée structurée JSON-LD")
        if p.imgs_no_alt:
            warnings[page].append(f"{len(p.imgs_no_alt)} image(s) sans attribut alt")
        if page not in in_sitemap and page != "index.html":
            warnings[page].append("page indexable absente de sitemap.xml")
        if "assets/analytics.js" not in html:
            warnings[page].append("script de mesure d'audience absent")

    for t, ps in titles.items():
        if t and len(ps) > 1:
            for pg in ps:
                warnings[pg].append(f"titre dupliqué avec {', '.join(x for x in ps if x != pg)}")
    for d, ps in descs.items():
        if d and len(ps) > 1:
            for pg in ps:
                warnings[pg].append(f"description dupliquée avec {', '.join(x for x in ps if x != pg)}")
    for path in sorted(in_sitemap):
        if not os.path.exists(os.path.join(ROOT, path)):
            errors["sitemap.xml"].append(f"URL vers un fichier inexistant : `{path}`")

    n_err = sum(len(v) for v in errors.values())
    n_warn = sum(len(v) for v in warnings.values())
    lines = [f"## Audit SEO technique", "",
             f"{len(pages)} pages analysées — **{n_err} erreur(s)**, {n_warn} avertissement(s).", ""]
    for label, bucket in (("Erreurs", errors), ("Avertissements", warnings)):
        if bucket:
            lines += [f"### {label}", ""]
            for pg in sorted(bucket):
                for msg in bucket[pg]:
                    lines.append(f"- `{pg}` : {msg}")
            lines.append("")
    report = "\n".join(lines)
    print(report)
    if args.markdown:
        with open(args.markdown, "w", encoding="utf-8") as fh:
            fh.write(report + "\n")
    return 1 if n_err else 0


if __name__ == "__main__":
    sys.exit(main())
