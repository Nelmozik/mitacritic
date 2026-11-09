#!/usr/bin/env python3
# Переводит описания игр с английского на русский и записывает их в js/descriptions.js
#
# Порядок работы:
#   1) сначала запускаем fetch_descriptions.py (он скачивает английские описания)
#   2) pip install deep-translator
#   3) python tools/translate_descriptions.py --count 2000
#
# Используется бесплатный переводчик Google через библиотеку deep-translator, ключ не нужен.
# Перевод машинный, поэтому в некоторых местах он может быть корявым.
# Если скрипт остановить, при следующем запуске он продолжит с того же места
# (готовые переводы лежат в tools/translations_cache.json).

import argparse
import json
import os
import re
import sys
import time
from concurrent.futures import ThreadPoolExecutor

try:
    from deep_translator import GoogleTranslator
except ImportError:
    sys.exit("Сначала установите библиотеку: pip install deep-translator")

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
GAMES_JS = os.path.join(ROOT, "js", "games.js")
OUT_JS = os.path.join(ROOT, "js", "descriptions.js")
EN_CACHE = os.path.join(HERE, "descriptions_cache.json")   # английские описания
RU_CACHE = os.path.join(HERE, "translations_cache.json")   # переведённые


def load_games():
    """Достаём список игр из js/games.js."""
    text = open(GAMES_JS, encoding="utf-8").read()
    start = text.index("[")
    games, _ = json.JSONDecoder().raw_decode(text[start:])
    return games


def clean(text):
    """Убираем лишнее: в RAWG после английского текста часто идёт испанский (после слова Español)."""
    text = text.split("\nEspañol")[0]
    text = re.sub(r"\n{3,}", "\n\n", text)
    return text.strip()


def shorten(text, limit):
    """Обрезаем длинное описание по границе предложения, чтобы перевод был быстрее и текст короче."""
    if len(text) <= limit:
        return text
    cut = text[:limit]
    # ищем последнюю точку, вопросительный или восклицательный знак
    end = max(cut.rfind(". "), cut.rfind("! "), cut.rfind("? "))
    if end > limit * 0.5:
        return cut[: end + 1]
    return cut.rsplit(" ", 1)[0] + "…"


def translate(text):
    """Переводим текст. При ошибке (например, лимит запросов) ждём и пробуем ещё раз."""
    translator = GoogleTranslator(source="en", target="ru")
    for attempt in range(5):
        try:
            return translator.translate(text)
        except Exception:
            time.sleep(3 * (attempt + 1))
    return None


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--count", type=int, default=2000)
    parser.add_argument("--max-chars", type=int, default=1200,
                        help="максимальная длина описания перед переводом")
    args = parser.parse_args()

    if not os.path.exists(EN_CACHE):
        sys.exit("Нет файла tools/descriptions_cache.json. Сначала запустите fetch_descriptions.py")

    en = json.load(open(EN_CACHE, encoding="utf-8"))
    ru = json.load(open(RU_CACHE, encoding="utf-8")) if os.path.exists(RU_CACHE) else {}

    # берём самые популярные игры, у которых есть английское описание
    games = load_games()
    games.sort(key=lambda g: g.get("ratingCount", 0), reverse=True)
    ids = [str(g["id"]) for g in games if en.get(str(g["id"]), {}).get("d")][: args.count]

    todo = [i for i in ids if i not in ru]
    print(f"Игр с описанием: {len(ids)}, осталось перевести: {len(todo)}")

    def work(game_id):
        text = shorten(clean(en[game_id]["d"]), args.max_chars)
        return game_id, translate(text) if text else None

    done = 0
    with ThreadPoolExecutor(max_workers=3) as pool:
        for game_id, text in pool.map(work, todo):
            done += 1
            if text:
                ru[game_id] = text
            if done % 20 == 0:
                print(f"{done}/{len(todo)}")
                json.dump(ru, open(RU_CACHE, "w", encoding="utf-8"), ensure_ascii=False)

    json.dump(ru, open(RU_CACHE, "w", encoding="utf-8"), ensure_ascii=False)

    # собираем итоговый файл: русский текст + разработчик
    result = {}
    for game_id in ids:
        if game_id in ru:
            result[game_id] = {"d": ru[game_id], "dev": en[game_id].get("dev", "")}

    with open(OUT_JS, "w", encoding="utf-8") as f:
        f.write("// Описания игр (перевод на русский). Файл создаётся скриптами в папке tools\n")
        f.write("const DESCRIPTIONS = ")
        json.dump(result, f, ensure_ascii=False, separators=(",", ":"))
        f.write(";\n")
    print(f"Готово: переведено {len(result)} описаний -> js/descriptions.js")


if __name__ == "__main__":
    main()
