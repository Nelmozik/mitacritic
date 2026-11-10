import json
import os
import re
import sys
import time
import difflib
from concurrent.futures import ThreadPoolExecutor
import requests
from bs4 import BeautifulSoup

# Ensure stdout handles UTF-8 on Windows
if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
GAMES_JS = os.path.join(ROOT, "js", "games.js")
OUT_JS = os.path.join(ROOT, "js", "descriptions.js")
CACHE_FILE = os.path.join(ROOT, "tools", "scrape_cache.json")

session = requests.Session()
session.headers["User-Agent"] = "GameVaultCatalogEnricher/2.0 (student project; contact@gamevault.local)"

# Deep Translator
try:
    from deep_translator import GoogleTranslator
    translator = GoogleTranslator(source="en", target="ru")
except Exception:
    translator = None

def norm(title):
    t = (title or "").lower()
    t = re.sub(r"[™®©'’]", "", t)
    t = re.sub(r"[^a-z0-9а-яё ]+", " ", t)
    return re.sub(r"\s+", " ", t).strip()

def similar(a, b):
    return difflib.SequenceMatcher(None, norm(a), norm(b)).ratio()

def clean_html(html):
    soup = BeautifulSoup(html or "", "html.parser")
    for img in soup.find_all("img"):
        img.decompose()
    text = soup.get_text(" ")
    return re.sub(r"\s+", " ", text).strip()

def cut(text, limit=900):
    if not text:
        return ""
    if len(text) <= limit:
        return text
    part = text[:limit]
    end = max(part.rfind(". "), part.rfind("! "), part.rfind("? "))
    return part[: end + 1] if end > 300 else part.rstrip() + "…"

def get_wikidata_dev(qid):
    if not qid:
        return ""
    try:
        r = session.get("https://www.wikidata.org/w/api.php", params={
            "action": "wbgetentities",
            "ids": qid,
            "props": "claims",
            "format": "json"
        }, timeout=8)
        if r.status_code != 200:
            return ""
        claims = r.json().get("entities", {}).get(qid, {}).get("claims", {}).get("P178", [])
        ids = [c["mainsnak"]["datavalue"]["value"]["id"] for c in claims[:2] if "datavalue" in c.get("mainsnak", {})]
        if not ids:
            return ""
        
        lab_res = session.get("https://www.wikidata.org/w/api.php", params={
            "action": "wbgetentities",
            "ids": "|".join(ids),
            "props": "labels",
            "languages": "ru|en",
            "format": "json"
        }, timeout=8)
        if lab_res.status_code != 200:
            return ""
        labels_data = lab_res.json().get("entities", {})
        names = []
        for i in ids:
            labels = labels_data.get(i, {}).get("labels", {})
            val = (labels.get("ru") or labels.get("en") or {}).get("value")
            if val:
                names.append(val)
        return ", ".join(names)
    except Exception:
        return ""

def get_search_terms(title):
    terms = [title]
    c1 = re.sub(r"\s*[\(\[].*?[\)\]]", "", title).strip()
    if c1 and c1 not in terms:
        terms.append(c1)
    c2 = re.sub(r"[:\-–]\s*(Director's Cut|Definitive Edition|Remastered|Enhanced Edition|Game of the Year.*|GOTY.*|Complete Edition).*", "", c1, flags=re.I).strip()
    if c2 and c2 not in terms:
        terms.append(c2)
    return terms

def from_wiki_ru(title):
    api = "https://ru.wikipedia.org/w/api.php"
    queries = []
    terms = get_search_terms(title)
    for t in terms:
        queries.extend([f"{t} (игра)", f"{t} компьютерная игра", t])

    seen_q = set()
    for q in queries:
        if q in seen_q:
            continue
        seen_q.add(q)
        try:
            res = session.get(api, params={
                "action": "query",
                "format": "json",
                "generator": "search",
                "gsrsearch": q,
                "gsrlimit": 5,
                "prop": "extracts|pageprops",
                "ppprop": "wikibase_item",
                "exintro": 1,
                "explaintext": 1,
                "redirects": 1,
            }, timeout=12)
            if res.status_code != 200:
                continue
            pages = (res.json().get("query") or {}).get("pages") or {}
            for page in sorted(pages.values(), key=lambda p: p.get("index", 99)):
                name = re.sub(r"\s*\(.*?\)\s*", "", page.get("title", ""))
                text = (page.get("extract") or "").strip()
                matched = any(similar(term, name) >= 0.55 for term in terms)
                if matched and len(text) > 80:
                    qid = (page.get("pageprops") or {}).get("wikibase_item")
                    dev = get_wikidata_dev(qid)
                    return {"d": cut(re.sub(r"\s+", " ", text)), "dev": dev, "src": "wiki_ru", "lang": "ru"}
        except Exception:
            continue
    return None

def from_steam(title):
    api_search = "https://store.steampowered.com/api/storesearch/"
    terms = get_search_terms(title)
    for term in terms:
        try:
            r = session.get(api_search, params={"term": term, "l": "russian", "cc": "us"}, timeout=10)
            if r.status_code != 200:
                continue
            items = (r.json() or {}).get("items", [])
            if not items:
                continue
            best = max(items, key=lambda it: similar(term, it["name"]))
            if not any(similar(t, best["name"]) >= 0.65 for t in terms):
                continue
            app_id = best["id"]
            det = session.get("https://store.steampowered.com/api/appdetails", params={"appids": app_id, "l": "russian", "cc": "us"}, timeout=10)
            if det.status_code != 200:
                continue
            info = (det.json() or {}).get(str(app_id), {})
            if not info.get("success"):
                continue
            d = info["data"]
            text = clean_html(d.get("about_the_game")) or clean_html(d.get("short_description"))
            if len(text) < 50:
                text = clean_html(d.get("short_description"))
            if not text:
                continue
            devs = ", ".join((d.get("developers") or [])[:2])
            return {"d": cut(text), "dev": devs, "src": "steam", "lang": "ru"}
        except Exception:
            continue
    return None

def from_wiki_en_translated(title):
    if not translator:
        return None
    api = "https://en.wikipedia.org/w/api.php"
    clean_title = re.sub(r"\s*[\(\[].*?[\)\]]", "", title).strip()
    for q in [f"{clean_title} (video game)", clean_title]:
        try:
            res = session.get(api, params={
                "action": "query",
                "format": "json",
                "generator": "search",
                "gsrsearch": q,
                "gsrlimit": 3,
                "prop": "extracts|pageprops",
                "ppprop": "wikibase_item",
                "exintro": 1,
                "explaintext": 1,
                "redirects": 1,
            }, timeout=8)
            if res.status_code != 200:
                continue
            pages = (res.json().get("query") or {}).get("pages") or {}
            for page in sorted(pages.values(), key=lambda p: p.get("index", 99)):
                name = re.sub(r"\s*\(.*?\)\s*", "", page.get("title", ""))
                text = (page.get("extract") or "").strip()
                if (similar(title, name) >= 0.55 or similar(clean_title, name) >= 0.6) and len(text) > 80:
                    qid = (page.get("pageprops") or {}).get("wikibase_item")
                    dev = get_wikidata_dev(qid)
                    part = cut(text, 600)
                    try:
                        ru_text = translator.translate(part)
                        if ru_text and len(ru_text) > 50:
                            return {"d": ru_text, "dev": dev, "src": "wiki_en_translated", "lang": "ru"}
                    except Exception:
                        pass
        except Exception:
            continue
    return None

def from_playground(title):
    api_search = "https://www.playground.ru/api/game.search"
    terms = get_search_terms(title)
    for term in terms:
        try:
            r = session.get(api_search, params={"query": term}, timeout=8)
            if r.status_code != 200:
                continue
            items = r.json()
            if not items or not isinstance(items, list):
                continue
            best = max(items, key=lambda it: similar(term, it.get("name", "")))
            if not any(similar(t, best.get("name", "")) >= 0.65 for t in terms):
                continue
            slug = best.get("slug")
            if not slug:
                continue
            
            page = session.get(f"https://www.playground.ru/{slug}", timeout=8)
            if page.status_code != 200:
                continue
            soup = BeautifulSoup(page.text, "html.parser")
            
            desc, dev = "", ""
            for s in soup.find_all("script", type="application/ld+json"):
                try:
                    d = json.loads(s.string)
                    if d.get("@type") == "VideoGame":
                        desc = d.get("description", "").strip()
                        author = d.get("author")
                        if isinstance(author, dict):
                            dev = author.get("name", "").strip()
                        elif isinstance(author, str):
                            dev = author.strip()
                        break
                except Exception:
                    pass
            
            if not desc:
                m = soup.find("meta", attrs={"name": "description"}) or soup.find("meta", attrs={"property": "og:description"})
                if m:
                    desc = (m.get("content") or "").strip()
            
            if desc and len(desc) > 50:
                return {"d": cut(desc), "dev": dev, "src": "playground", "lang": "ru"}
        except Exception:
            continue
    return None

def fetch_info_for_game(game):
    title = game["title"]

    # 1. PlayGround.ru (отличные русские игровые описания + разработчики)
    info = from_playground(title)

    # 2. Русская Википедия + Wikidata
    if not info or not info.get("d"):
        wiki_ru = from_wiki_ru(title)
        if wiki_ru:
            if not info:
                info = wiki_ru
            else:
                info["d"] = wiki_ru["d"]
                if not info.get("dev") and wiki_ru.get("dev"):
                    info["dev"] = wiki_ru["dev"]

    # 3. Steam (если разработчик или описание всё ещё не найдены)
    if not info or not info.get("dev") or not info.get("d"):
        steam_info = from_steam(title)
        if steam_info:
            if not info:
                info = steam_info
            else:
                if not info.get("d"):
                    info["d"] = steam_info["d"]
                if not info.get("dev") and steam_info.get("dev"):
                    info["dev"] = steam_info["dev"]

    # 4. Английская Википедия + перевод
    if not info or not info.get("d"):
        wiki_en = from_wiki_en_translated(title)
        if wiki_en:
            if not info:
                info = wiki_en
            else:
                if not info.get("d"):
                    info["d"] = wiki_en["d"]
                if not info.get("dev") and wiki_en.get("dev"):
                    info["dev"] = wiki_en["dev"]

    return info

def write_descriptions_js(cache):
    result = {
        k: {"d": v["d"], "dev": v.get("dev", "")}
        for k, v in cache.items()
        if v and v.get("d")
    }
    with open(OUT_JS, "w", encoding="utf-8") as f:
        f.write("// Описания и разработчики игр. Файл создаётся скриптом tools/scrape_descriptions.py\n")
        f.write("const DESCRIPTIONS = ")
        json.dump(result, f, ensure_ascii=False, separators=(",", ":"))
        f.write(";\n")
    return len(result)

def run_enrichment(batch_limit=100, workers=4):
    print("Loading games and cache...")
    games_text = open(GAMES_JS, encoding="utf-8").read()
    start = games_text.index("[")
    games, _ = json.JSONDecoder().raw_decode(games_text[start:])

    cache = {}
    if os.path.exists(CACHE_FILE):
        try:
            cache = json.load(open(CACHE_FILE, encoding="utf-8"))
        except Exception:
            cache = {}

    # Find games without description OR with empty dev
    missing = []
    for g in games:
        gid = str(g["id"])
        c = cache.get(gid)
        if not c or not c.get("d") or not c.get("dev"):
            missing.append(g)

    # Sort missing by ratingCount desc so highest quality games are prioritized
    missing.sort(key=lambda g: g.get("ratingCount", 0), reverse=True)
    batch = missing[:batch_limit]

    print(f"Total missing: {len(missing)}. Processing current batch: {len(batch)} games with {workers} workers.")

    count = 0
    new_found = 0

    def process(g):
        nonlocal count, new_found
        gid = str(g["id"])
        existing = cache.get(gid) or {}
        if existing.get("d") and existing.get("dev"):
            return

        info = fetch_info_for_game(g)
        count += 1
        if info and (info.get("d") or info.get("dev")):
            merged = dict(existing)
            if info.get("d"):
                merged["d"] = info["d"]
            if info.get("dev"):
                merged["dev"] = info["dev"]
            merged["src"] = info.get("src", "merged")
            cache[gid] = merged
            new_found += 1
            print(f"[{count}/{len(batch)}] + {g['title']} -> dev: {merged.get('dev', '—')}")
        else:
            print(f"[{count}/{len(batch)}] - {g['title']} (not found)")

        if count % 10 == 0:
            json.dump(cache, open(CACHE_FILE, "w", encoding="utf-8"), ensure_ascii=False)
            total = write_descriptions_js(cache)
            print(f"--> Saved! Current total descriptions in JS: {total}")

    with ThreadPoolExecutor(max_workers=workers) as pool:
        list(pool.map(process, batch))

    # Final save
    json.dump(cache, open(CACHE_FILE, "w", encoding="utf-8"), ensure_ascii=False)
    total = write_descriptions_js(cache)
    print(f"Batch completed! Found {new_found} new descriptions. Total in descriptions.js: {total}")

if __name__ == "__main__":
    import argparse
    parser = argparse.ArgumentParser()
    parser.add_argument("--batch", type=int, default=100)
    parser.add_argument("--workers", type=int, default=4)
    args = parser.parse_args()
    run_enrichment(batch_limit=args.batch, workers=args.workers)
