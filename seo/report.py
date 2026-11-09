#!/usr/bin/env python3
"""Rapport de suivi SEO : Google Search Console (+ Google Analytics 4 en option).

Compare les 28 derniers jours disponibles aux 28 jours précédents et liste
les opportunités (requêtes en page 1–2 avec beaucoup d'impressions mais peu de clics).

Variables d'environnement :
  GOOGLE_SERVICE_ACCOUNT_JSON  contenu JSON de la clé du compte de service (obligatoire)
  GSC_SITE_URL                 propriété Search Console (défaut : https://enneagramme.co/)
  GA4_PROPERTY_ID              identifiant numérique de la propriété GA4 (optionnel)

Dépendances : pip install google-auth requests
Usage : python3 seo/report.py [--markdown rapport.md] [--days 28]
"""
import argparse
import datetime as dt
import json
import os
import sys
import urllib.parse

from google.oauth2 import service_account
from google.auth.transport.requests import AuthorizedSession

SCOPES = [
    "https://www.googleapis.com/auth/webmasters.readonly",
    "https://www.googleapis.com/auth/analytics.readonly",
]
SITE = os.environ.get("GSC_SITE_URL") or "https://enneagramme.co/"
GA4 = os.environ.get("GA4_PROPERTY_ID", "").strip()


def session():
    raw = os.environ.get("GOOGLE_SERVICE_ACCOUNT_JSON")
    if not raw:
        sys.exit("GOOGLE_SERVICE_ACCOUNT_JSON manquant.")
    creds = service_account.Credentials.from_service_account_info(json.loads(raw), scopes=SCOPES)
    return AuthorizedSession(creds)


def gsc(s, start, end, dims, limit=25000):
    url = ("https://searchconsole.googleapis.com/webmasters/v3/sites/"
           + urllib.parse.quote(SITE, safe="") + "/searchAnalytics/query")
    body = {"startDate": str(start), "endDate": str(end), "dimensions": dims,
            "rowLimit": limit, "dataState": "final"}
    r = s.post(url, json=body, timeout=60)
    r.raise_for_status()
    return r.json().get("rows", [])


def totals(s, start, end):
    rows = gsc(s, start, end, [])
    if not rows:
        return {"clicks": 0, "impressions": 0, "ctr": 0.0, "position": 0.0}
    return rows[0]


def pct(new, old):
    if not old:
        return "—" if not new else "nouveau"
    d = (new - old) / old * 100
    return f"{d:+.0f} %"


def short(url):
    return url.replace("https://enneagramme.co", "") or "/"


def table(headers, rows):
    out = ["| " + " | ".join(headers) + " |", "|" + "---|" * len(headers)]
    out += ["| " + " | ".join(str(c) for c in r) + " |" for r in rows]
    return out


def ga4_section(s, start, end, pstart, pend):
    url = f"https://analyticsdata.googleapis.com/v1beta/properties/{GA4}:runReport"

    def run(body):
        r = s.post(url, json=body, timeout=60)
        r.raise_for_status()
        return r.json().get("rows", [])

    metrics = [{"name": n} for n in ("sessions", "totalUsers", "engagementRate", "keyEvents")]
    cur = run({"dateRanges": [{"startDate": str(start), "endDate": str(end)}], "metrics": metrics})
    prev = run({"dateRanges": [{"startDate": str(pstart), "endDate": str(pend)}], "metrics": metrics})

    def vals(rows):
        if not rows:
            return [0, 0, 0.0, 0]
        v = [m["value"] for m in rows[0]["metricValues"]]
        return [int(float(v[0])), int(float(v[1])), float(v[2]), int(float(v[3]))]

    c, p = vals(cur), vals(prev)
    lines = ["## Google Analytics 4", ""]
    lines += table(["Indicateur", "28 j", "Période préc.", "Évolution"], [
        ["Sessions", c[0], p[0], pct(c[0], p[0])],
        ["Utilisateurs", c[1], p[1], pct(c[1], p[1])],
        ["Taux d'engagement", f"{c[2]*100:.0f} %", f"{p[2]*100:.0f} %", ""],
        ["Événements clés", c[3], p[3], pct(c[3], p[3])],
    ])
    channels = run({
        "dateRanges": [{"startDate": str(start), "endDate": str(end)}],
        "dimensions": [{"name": "sessionDefaultChannelGroup"}],
        "metrics": [{"name": "sessions"}],
        "orderBys": [{"metric": {"metricName": "sessions"}, "desc": True}], "limit": 8,
    })
    if channels:
        lines += ["", "**Sources de trafic**", ""]
        lines += table(["Canal", "Sessions"], [[r["dimensionValues"][0]["value"], r["metricValues"][0]["value"]] for r in channels])
    organic = run({
        "dateRanges": [{"startDate": str(start), "endDate": str(end)}],
        "dimensions": [{"name": "landingPage"}],
        "metrics": [{"name": "sessions"}, {"name": "engagementRate"}],
        "dimensionFilter": {"filter": {"fieldName": "sessionDefaultChannelGroup",
                                       "stringFilter": {"value": "Organic Search"}}},
        "orderBys": [{"metric": {"metricName": "sessions"}, "desc": True}], "limit": 10,
    })
    if organic:
        lines += ["", "**Pages d'entrée depuis Google (recherche organique)**", ""]
        lines += table(["Page", "Sessions", "Engagement"], [
            [r["dimensionValues"][0]["value"], r["metricValues"][0]["value"],
             f"{float(r['metricValues'][1]['value'])*100:.0f} %"] for r in organic])
    return lines


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--markdown")
    ap.add_argument("--days", type=int, default=28)
    args = ap.parse_args()

    s = session()
    end = dt.date.today() - dt.timedelta(days=3)  # délai de consolidation des données GSC
    start = end - dt.timedelta(days=args.days - 1)
    pend = start - dt.timedelta(days=1)
    pstart = pend - dt.timedelta(days=args.days - 1)

    cur, prev = totals(s, start, end), totals(s, pstart, pend)
    lines = [f"# Suivi SEO — {start} → {end}", "",
             f"Propriété Search Console : `{SITE}` · comparaison avec {pstart} → {pend}", "",
             "## Google Search Console", ""]
    lines += table(["Indicateur", f"{args.days} j", "Période préc.", "Évolution"], [
        ["Clics", int(cur["clicks"]), int(prev["clicks"]), pct(cur["clicks"], prev["clicks"])],
        ["Impressions", int(cur["impressions"]), int(prev["impressions"]), pct(cur["impressions"], prev["impressions"])],
        ["CTR moyen", f"{cur['ctr']*100:.1f} %", f"{prev['ctr']*100:.1f} %", ""],
        ["Position moyenne", f"{cur['position']:.1f}", f"{prev['position']:.1f}",
         f"{prev['position']-cur['position']:+.1f}" if prev["position"] else "—"],
    ])

    queries = gsc(s, start, end, ["query"])
    prev_q = {r["keys"][0]: r for r in gsc(s, pstart, pend, ["query"])}
    top = sorted(queries, key=lambda r: (-r["clicks"], -r["impressions"]))[:15]
    lines += ["", "### Top requêtes", ""]
    lines += table(["Requête", "Clics", "Impr.", "CTR", "Position", "Δ pos."], [
        [r["keys"][0], int(r["clicks"]), int(r["impressions"]), f"{r['ctr']*100:.1f} %",
         f"{r['position']:.1f}",
         f"{prev_q[r['keys'][0]]['position']-r['position']:+.1f}" if r["keys"][0] in prev_q else "nouv."]
        for r in top])

    # Opportunités : visibles (position 4–20) avec des impressions mais un CTR faible
    opp = [r for r in queries if 4 <= r["position"] <= 20 and r["impressions"] >= 20]
    opp.sort(key=lambda r: -r["impressions"])
    if opp:
        lines += ["", "### Opportunités (positions 4 à 20, beaucoup d'impressions)", "",
                  "_À travailler en priorité : enrichir la page qui se positionne, ajuster titre et description, ajouter des liens internes._", ""]
        lines += table(["Requête", "Impr.", "Clics", "CTR", "Position"], [
            [r["keys"][0], int(r["impressions"]), int(r["clicks"]), f"{r['ctr']*100:.1f} %", f"{r['position']:.1f}"]
            for r in opp[:15]])

    pages = gsc(s, start, end, ["page"])
    prev_p = {r["keys"][0]: r for r in gsc(s, pstart, pend, ["page"])}
    pages.sort(key=lambda r: (-r["clicks"], -r["impressions"]))
    lines += ["", "### Pages", ""]
    lines += table(["Page", "Clics", "Δ clics", "Impr.", "CTR", "Position"], [
        [short(r["keys"][0]), int(r["clicks"]),
         pct(r["clicks"], prev_p.get(r["keys"][0], {}).get("clicks", 0)),
         int(r["impressions"]), f"{r['ctr']*100:.1f} %", f"{r['position']:.1f}"]
        for r in pages[:20]])
    lost = [k for k, v in prev_p.items() if v["clicks"] >= 3 and k not in {r["keys"][0] for r in pages}]
    if lost:
        lines += ["", "**⚠️ Pages qui ont disparu des résultats :** " + ", ".join(f"`{short(k)}`" for k in lost)]

    countries = gsc(s, start, end, ["country"])[:5]
    devices = gsc(s, start, end, ["device"])
    lines += ["", "### Pays et appareils", "",
              "Pays : " + ", ".join(f"{r['keys'][0].upper()} ({int(r['clicks'])} clics)" for r in sorted(countries, key=lambda r: -r["clicks"])),
              "", "Appareils : " + ", ".join(f"{r['keys'][0].lower()} ({int(r['clicks'])} clics)" for r in devices)]

    if GA4:
        try:
            lines += [""] + ga4_section(s, start, end, pstart, pend)
        except Exception as e:  # GA4 optionnel : ne bloque pas le rapport
            lines += ["", f"_GA4 indisponible : {e}_"]

    report = "\n".join(lines)
    print(report)
    if args.markdown:
        with open(args.markdown, "w", encoding="utf-8") as fh:
            fh.write(report + "\n")


if __name__ == "__main__":
    main()
