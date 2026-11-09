import argparse
import json
import os
import sys
import time
import urllib.request
import urllib.error
from concurrent.futures import ThreadPoolExecutor
 
# адрес API можно подменить переменной окружения (нужно для тестов)
API = os.environ.get("RAWG_API", "https://api.rawg.io/api")
KEY = os.environ.get("RAWG_KEY")
 
HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
GAMES_JS = os.path.join(ROOT, "js", "games.js")
OUT_JS = os.path.join(ROOT, "js", "descriptions.js")
CACHE = os.path.join(HERE, "descriptions_cache.json")
 
 
def load_games():
    """Достаём список игр из js/games.js (там он записан как const GAMES = [...])."""
    text = open(GAMES_JS, encoding="utf-8").read()
    start = text.index("[")
    games, _ = json.JSONDecoder().raw_decode(text[start:])
    return games
 
 
def get_details(game_id):
    """Один запрос к RAWG за подробностями игры. При ошибке пробуем ещё несколько раз и пишем, что случилось."""
    url = f"{API}/games/{game_id}?key={KEY}"
    for attempt in range(5):
        try:
            with urllib.request.urlopen(url, timeout=30) as r:
                return json.load(r)
        except urllib.error.HTTPError as e:
            if e.code in (401, 403):
                sys.exit(f"Ошибка {e.code}: проверьте ключ RAWG или лимит запросов")
            if e.code == 404:
                return None
            print(f"  игра {game_id}: ответ {e.code}, попытка {attempt + 1} из 5")
            time.sleep(2 * (attempt + 1) if e.code != 429 else 20 * (attempt + 1))
        except Exception as e:
            print(f"  игра {game_id}: {type(e).__name__}, попытка {attempt + 1} из 5 (нет связи с RAWG?)")
            time.sleep(2 * (attempt + 1))
    return None
 
 
def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--count", type=int, default=2000)
    args = parser.parse_args()
 
    if not KEY:
        sys.exit("Сначала задайте ключ: export RAWG_KEY=...")
 
    games = load_games()
    # самые популярные игры - в начало списка
    games.sort(key=lambda g: g.get("ratingCount", 0), reverse=True)
    ids = [g["id"] for g in games[: args.count]]
 
    # подгружаем уже скачанное
    cache = {}
    if os.path.exists(CACHE):
        cache = json.load(open(CACHE, encoding="utf-8"))
 
    todo = [i for i in ids if str(i) not in cache]
    print(f"Всего игр: {len(ids)}, осталось скачать: {len(todo)}")
 
    def work(game_id):
        data = get_details(game_id)
        time.sleep(0.1)  # небольшая пауза, чтобы не злить сервер
        if not data:
            return game_id, None
        devs = [d["name"] for d in (data.get("developers") or [])][:2]
        return game_id, {
            "d": (data.get("description_raw") or "").strip(),
            "dev": ", ".join(devs),
        }
 
    done = 0
    with ThreadPoolExecutor(max_workers=4) as pool:
        for game_id, info in pool.map(work, todo):
            done += 1
            if info:
                cache[str(game_id)] = info
            print(f"{done}/{len(todo)}  (id {game_id}: {'ok' if info else 'нет данных'})")
            if done % 20 == 0:
                json.dump(cache, open(CACHE, "w", encoding="utf-8"), ensure_ascii=False)
 
    json.dump(cache, open(CACHE, "w", encoding="utf-8"), ensure_ascii=False)
 
    # оставляем только игры с непустым описанием
    result = {k: v for k, v in cache.items() if v["d"] and int(k) in set(ids)}
    with open(OUT_JS, "w", encoding="utf-8") as f:
        f.write("// Описания игр из RAWG. Файл создаётся скриптом tools/fetch_descriptions.py\n")
        f.write("const DESCRIPTIONS = ")
        json.dump(result, f, ensure_ascii=False, separators=(",", ":"))
        f.write(";\n")
    print(f"Готово: описаний записано {len(result)} -> js/descriptions.js")
 
 
if __name__ == "__main__":
    main()
