import argparse
import difflib
import json
import os
import re
import sys
import threading
import time
from concurrent.futures import ThreadPoolExecutor
 
import requests
from bs4 import BeautifulSoup
 
HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
GAMES_JS = os.path.join(ROOT, "js", "games.js")
OUT_JS = os.path.join(ROOT, "js", "descriptions.js")
CACHE = os.path.join(HERE, "scrape_cache.json")
 
# адреса можно подменить (нужно только для тестов)
STEAM = os.environ.get("STEAM_URL", "https://store.steampowered.com")
WIKI_RU = os.environ.get("WIKI_RU", "https://ru.wikipedia.org/w/api.php")
WIKI_EN = os.environ.get("WIKI_EN", "https://en.wikipedia.org/w/api.php")
WIKIDATA = os.environ.get("WIKIDATA", "https://www.wikidata.org/w/api.php")
RAWG = os.environ.get("RAWG_API", "https://api.rawg.io/api")
RAWG_KEY = os.environ.get("RAWG_KEY")
 
session = requests.Session()
# в заголовках HTTP можно только латиницу, русские буквы ломают запрос
session.headers["User-Agent"] = "GameVaultStudentProject/1.0 (student project)"
 
 
# Steam пускает примерно 200 запросов за 5 минут, поэтому к appdetails ходим не чаще, чем раз в STEAM_GAP секунд.
# Остальные запросы (поиск, Википедия, перевод) идут параллельно в нескольких потоках.
STEAM_GAP = 1.3
_steam_lock = threading.Lock()
_steam_next = [0.0]
 
 
def steam_wait():
    """Каждый поток по очереди получает своё время для запроса к Steam."""
    with _steam_lock:
        now = time.time()
        start = max(now, _steam_next[0])
        _steam_next[0] = start + STEAM_GAP
    time.sleep(max(0, start - now))
 
 
def load_games():
    """Достаём список игр из js/games.js (там он записан как const GAMES = [...])."""
    text = open(GAMES_JS, encoding="utf-8").read()
    start = text.index("[")
    games, _ = json.JSONDecoder().raw_decode(text[start:])
    return games
 
 
def get_json(url, params):
    """GET-запрос с повторами. Если сервер просит притормозить (429) - ждём подольше."""
    for attempt in range(5):
        try:
            r = session.get(url, params=params, timeout=20)
            if r.status_code == 429:
                print(f"  сервер просит притормозить (429), жду {30 * (attempt + 1)} сек...")
                time.sleep(30 * (attempt + 1))
                continue
            if r.status_code == 401 and "rawg" in url:
                os._exit(print("Ошибка 401: RAWG не принял ключ. Проверьте $env:RAWG_KEY (ключ без кавычек внутри и пробелов)") or 1)
            if r.status_code != 200:
                print(f"  ответ {r.status_code} от {url.split('/')[2]}, пробую ещё раз")
                time.sleep(2)
                continue
            return r.json()
        except UnicodeError as e:
            sys.exit(f"Ошибка в запросе (кодировка): {e}")
        except Exception as e:
            print(f"  ошибка запроса к {url.split('/')[2]}: {type(e).__name__}, попытка {attempt + 1} из 5")
            time.sleep(2 * (attempt + 1))
    return None
 
 
def norm(title):
    """Приводим название к простому виду, чтобы сравнивать: без знаков, регистра и ™/®."""
    t = title.lower()
    t = re.sub(r"[™®©]", "", t)
    t = re.sub(r"[^a-z0-9а-яё ]+", " ", t)
    return re.sub(r"\s+", " ", t).strip()
 
 
def similar(a, b):
    return difflib.SequenceMatcher(None, norm(a), norm(b)).ratio()
 
 
def clean_html(html):
    """Убираем из описания Steam теги, картинки и лишние пробелы."""
    soup = BeautifulSoup(html or "", "html.parser")
    for img in soup.find_all("img"):
        img.decompose()
    text = soup.get_text(" ")
    return re.sub(r"\s+", " ", text).strip()
 
 
def cut(text, limit=900):
    """Обрезаем длинный текст по границе предложения."""
    if len(text) <= limit:
        return text
    part = text[:limit]
    end = max(part.rfind(". "), part.rfind("! "), part.rfind("? "))
    return part[: end + 1] if end > 300 else part.rstrip() + "…"
 
 
def from_steam(title, lang="russian"):
    """Ищем игру в Steam по названию, берём описание на русском и разработчиков."""
    found = get_json(
        STEAM + "/api/storesearch/",
        {"term": title, "l": lang, "cc": "ru" if lang == "russian" else "us"},
    )
    if not found or not found.get("items"):
        return None
 
    # выбираем самый похожий по названию результат
    best = max(found["items"], key=lambda it: similar(title, it["name"]))
    if similar(title, best["name"]) < 0.85:
        return None
 
    steam_wait()
    data = get_json(
        STEAM + "/api/appdetails",
        {"appids": best["id"], "l": lang, "cc": "ru" if lang == "russian" else "us"},
    )
    info = (data or {}).get(str(best["id"]), {})
    if not info.get("success"):
        return None
    d = info["data"]
 
    # about_the_game подробнее, short_description - запасной вариант
    text = clean_html(d.get("about_the_game")) or clean_html(d.get("short_description"))
    if len(text) < 60:
        text = clean_html(d.get("short_description"))
    if not text:
        return None
    devs = ", ".join((d.get("developers") or [])[:2])
    return {"d": cut(text), "dev": devs, "src": "steam", "lang": "ru" if lang == "russian" else "en"}
 
 
def wiki_extract(api, title, suffixes):
    for suffix in suffixes:
        query = f"{title} {suffix}".strip()
        res = get_json(api, {
            "action": "query",
            "format": "json",
            "generator": "search",
            "gsrsearch": query,
            "gsrlimit": 5,  # было 3, увеличиваем
            "prop": "extracts|pageprops",
            "ppprop": "wikibase_item",
            "exintro": 1,
            "explaintext": 1,
            "redirects": 1,
        })
        pages = ((res or {}).get("query") or {}).get("pages") or {}
        for page in sorted(pages.values(), key=lambda p: p.get("index", 99)):
            name = re.sub(r"\s*\(.*?\)\s*", "", page.get("title", ""))
            text = (page.get("extract") or "").strip()

            #Снижаем порог схожести и убираем жёсткую проверку на "игр|game"
            if similar(title, name) >= 0.55 and len(text) > 80:
                qid = (page.get("pageprops") or {}).get("wikibase_item")
                return re.sub(r"\s+", " ", text), qid
    return None, None


def wikidata_devs(qid):
    if not qid:
        return ""
    ent = get_json(WIKIDATA, {
        "action": "wbgetentities",
        "ids": qid,
        "props": "claims",
        "format": "json"
    })
    try:
        claims = ent["entities"][qid]["claims"].get("P178", [])
        ids = [c["mainsnak"]["datavalue"]["value"]["id"] for c in claims][:2]
    except (KeyError, TypeError):
        return ""
    if not ids:
        return ""
    labels = get_json(WIKIDATA, {
        "action": "wbgetentities",
        "ids": "|".join(ids),
        "props": "labels",
        "languages": "ru|en",  #русский приоритет
        "format": "json"
    })
    names = []
    for i in ids:
        lab = ((labels or {}).get("entities", {}).get(i, {}).get("labels") or {})
        name = (lab.get("ru") or lab.get("en") or {}).get("value")  #ru первый
        if name:
            names.append(name)
    return ", ".join(names)


def from_wiki_ru(title):
    #Добавляем больше вариантов суффиксов
    suffixes = ["(игра)", "компьютерная игра", "(видеоигра)", ""]
    text, qid = wiki_extract(WIKI_RU, title, suffixes)
    return {"d": cut(text), "dev": wikidata_devs(qid), "src": "wiki_ru", "lang": "ru"} if text else None
 
def from_wiki_en_translated(title, translator, translate=True):
    text, qid = wiki_extract(WIKI_EN, title, ["(video game)", "video game"])
    if not text:
        return None
    text = cut(text, 700)
    dev = wikidata_devs(qid)
    if not translate:
        return {"d": text, "dev": dev, "src": "wiki_en", "lang": "en"}
    ru = translate_text(translator, text)
    return {"d": ru, "dev": dev, "src": "wiki_en_translated", "lang": "ru"} if ru else None
 
 
def translate_text(translator, text, retries=3):
    """Переводит текст на русский. Длинный текст режем на куски по предложениям
    (у Google-переводчика лимит около 5000 символов), при ошибке пробуем ещё раз."""
    chunks, current = [], ""
    for sentence in re.split(r"(?<=[.!?]) ", text):
        if len(current) + len(sentence) > 1500 and current:
            chunks.append(current)
            current = ""
        current += sentence + " "
    if current.strip():
        chunks.append(current.strip())
 
    result = []
    for chunk in chunks:
        for attempt in range(retries):
            try:
                result.append(translator.translate(chunk.strip()))
                break
            except Exception:
                time.sleep(2 * (attempt + 1))  # ждём подольше с каждой попыткой
        else:
            return None  # кусок так и не перевёлся - лучше вообще без описания, чем половина текста
    return " ".join(r for r in result if r)
 
 
def rawg_details(game_id):
    """Один запрос к RAWG за подробностями игры по её id (описание на английском + разработчики)."""
    if not RAWG_KEY:
        return None
    return get_json(f"{RAWG}/games/{game_id}", {"key": RAWG_KEY})
 
 
def rawg_devs(data):
    """Список разработчиков из ответа RAWG одной строкой (не больше двух)."""
    return ", ".join(d["name"] for d in (data.get("developers") or [])[:2])
 
 
def from_rawg(data, translator, translate=True):
    """Описание из RAWG переводим на русский. Без переводчика текст останется английским."""
    text = (data.get("description_raw") or "").strip()
    # у RAWG после английского текста часто идёт копия на испанском - отрезаем её
    text = re.split(r"\n\s*Espa[ñn]ol", text)[0]
    text = cut(re.sub(r"\s+", " ", text))
    if len(text) < 40:
        return None
    if not translate:
        return {"d": text, "dev": rawg_devs(data), "src": "rawg", "lang": "en"}
    if translator:
        text = translate_text(translator, text)
        if not text:
            return None
    elif translator is None:
        return None
    return {"d": text, "dev": rawg_devs(data), "src": "rawg", "lang": "ru"}
 
 
def write_output(cache, ids):
    """Собираем итоговый js/descriptions.js из кэша."""
    wanted = set(str(i) for i in ids)
    result = {
        k: {"d": v["d"], "dev": v.get("dev", "")}
        for k, v in cache.items()
        if v and v.get("d") and k in wanted
    }
    with open(OUT_JS, "w", encoding="utf-8") as f:
        f.write("// Описания и разработчики игр. Файл создаётся скриптом tools/scrape_descriptions.py\n")
        f.write("const DESCRIPTIONS = ")
        json.dump(result, f, ensure_ascii=False, separators=(",", ":"))
        f.write(";\n")
    return len(result)
 
 
def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--count", type=int, default=500)
    parser.add_argument("--steam-only", action="store_true", help="искать только в Steam, без Википедии")
    parser.add_argument("--no-translate", action="store_true")
    parser.add_argument("--retry-missing", action="store_true")
    parser.add_argument("--rawg-only", action="store_true", help="брать данные только из RAWG (без Steam и Википедии)")
    parser.add_argument("--wiki-only", action="store_true", help="только Википедия + Wikidata (без Steam и RAWG)")
    parser.add_argument("--english", action="store_true", help="шаг 1: собрать описания на английском без перевода")
    parser.add_argument("--translate", action="store_true", help="шаг 2: перевести на русский то, что собрано на английском")
    parser.add_argument("--workers", type=int, default=8, help="сколько игр обрабатывать одновременно")
    parser.add_argument("--steam-gap", type=float, default=1.3, help="пауза между запросами к Steam, сек")
    args = parser.parse_args()
 
    translator = None
    if not args.no_translate and not args.english:
        try:
            from deep_translator import GoogleTranslator
            translator = GoogleTranslator(source="en", target="ru")
        except ImportError:
            print("deep-translator не установлен, автоперевод отключён")
 
    games = load_games()
    games.sort(key=lambda g: g.get("ratingCount", 0), reverse=True)
    games = games[: args.count]
    ids = [g["id"] for g in games]
 
    cache = {}
    if os.path.exists(CACHE):
        cache = json.load(open(CACHE, encoding="utf-8"))
 
    def need(g):
        key = str(g["id"])
        if key not in cache:
            return True
        # при --retry-missing пробуем ещё раз ненайденные игры и те, где нет разработчика
        return args.retry_missing and (not cache[key] or not cache[key].get("dev"))
 
    # шаг 2: переводим то, что уже лежит в кэше на английском
    if args.translate:
        if translator is None:
            sys.exit("Для перевода нужна библиотека: pip install deep-translator")
        en = [k for k, v in cache.items() if v and v.get("lang") == "en"]
        print(f"Нужно перевести описаний: {len(en)}")
 
        def tr(k):
            ru = translate_text(translator, cache[k]["d"])
            if ru:
                cache[k]["d"] = ru
                cache[k]["lang"] = "ru"
            print(f"{k}: {'переведено' if ru else 'не удалось'}")
 
        with ThreadPoolExecutor(max_workers=args.workers) as p:
            list(p.map(tr, en))
        json.dump(cache, open(CACHE, "w", encoding="utf-8"), ensure_ascii=False)
        print(f"Готово: описаний записано {write_output(cache, ids)} -> js/descriptions.js")
        return
 
    todo = [g for g in games if need(g)]
    print(f"Игр в списке: {len(games)}, осталось обработать: {len(todo)}")
 
    global STEAM_GAP
    STEAM_GAP = args.steam_gap
    lock = threading.Lock()
    counter = [0]
 
    if args.rawg_only and not RAWG_KEY:
        sys.exit("Для --rawg-only нужен ключ: $env:RAWG_KEY=\"ваш_ключ\"")
    if not RAWG_KEY and not args.steam_only and not args.wiki_only:
        print("Ключ RAWG_KEY не задан - RAWG пропускаем (игры вне Steam и Википедии не найдутся)")
 
    def work(g):
        """Одна игра: Steam -> русская Википедия -> RAWG + перевод -> английская Википедия + перевод."""
        title = g["title"]
        old = cache.get(str(g["id"]))
        if args.wiki_only:
            # Википедия: сначала русская статья, потом английская (её переведём или оставим на английском)
            info = None
            if not args.english:
                info = from_wiki_ru(title)
            if not info:
                info = from_wiki_en_translated(title, translator, translate=not args.english)
            if not info and old:
                info = old
            with lock:
                cache[str(g["id"])] = info
                counter[0] += 1
                print(f"[{counter[0]}/{len(todo)}] {title}: {info['src'] if info else 'не найдено'}")
                if counter[0] % 20 == 0:
                    json.dump(cache, open(CACHE, "w", encoding="utf-8"), ensure_ascii=False)
            return
        if args.english:
            # шаг 1: всё на английском, перевод потом отдельным запуском с --translate
            info = None if args.rawg_only else from_steam(title, "english")
            raw = None
            if not info or not info.get("dev"):
                raw = rawg_details(g["id"])
            if not info and raw:
                info = from_rawg(raw, None, translate=False)
            elif info and raw and not info.get("dev"):
                info["dev"] = rawg_devs(raw)
            if not info and old:
                info = old
            with lock:
                cache[str(g["id"])] = info
                counter[0] += 1
                print(f"[{counter[0]}/{len(todo)}] {title}: {info['src'] if info else 'не найдено'}")
                if counter[0] % 20 == 0:
                    json.dump(cache, open(CACHE, "w", encoding="utf-8"), ensure_ascii=False)
            return
        info = None if args.rawg_only else from_steam(title)
        if not info and not args.steam_only and not args.rawg_only:
            info = from_wiki_ru(title)
        raw = None
        if not args.steam_only and (not info or not info.get("dev")):
            raw = rawg_details(g["id"])
        if not info and raw:
            info = from_rawg(raw, translator)
        elif info and raw and not info.get("dev"):
            # текст уже есть (например, из Википедии), берём из RAWG только разработчиков
            info["dev"] = rawg_devs(raw)
        if not info and translator and not args.steam_only and not args.rawg_only:
            info = from_wiki_en_translated(title, translator)
        if not info and old:
            info = old  # не затираем то, что нашли раньше
        with lock:
            # None тоже запоминаем, чтобы не искать эту игру второй раз
            cache[str(g["id"])] = info
            counter[0] += 1
            print(f"[{counter[0]}/{len(todo)}] {title}: {info['src'] if info else 'не найдено'}")
            if counter[0] % 20 == 0:
                json.dump(cache, open(CACHE, "w", encoding="utf-8"), ensure_ascii=False)
 
    pool = ThreadPoolExecutor(max_workers=args.workers)
    try:
        list(pool.map(work, todo))
    except KeyboardInterrupt:
        print("\nОстановлено, сохраняю то, что успели собрать")
        pool.shutdown(wait=False, cancel_futures=True)
 
    json.dump(cache, open(CACHE, "w", encoding="utf-8"), ensure_ascii=False)
    count = write_output(cache, ids)
    print(f"Готово: описаний записано {count} -> js/descriptions.js")
 
 
if __name__ == "__main__":
    main()
 
