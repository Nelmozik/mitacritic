import os
import json
import time
import requests

# Ваш API-ключ RAWG
API_KEY = "42aab9e2e6084486b058f2a40b1979b1"
BASE_URL = "https://api.rawg.io/api/games"
OUTPUT_FILE = "games.json"
TARGET_COUNT = 5000
PAGE_SIZE = 40

def fetch_games():
    games_list = []
    page = 1
    total_pages = (TARGET_COUNT // PAGE_SIZE) + (1 if TARGET_COUNT % PAGE_SIZE else 0)

    print(f"Старт выгрузки: цель — {TARGET_COUNT} игр (~{total_pages} страниц)...")

    while len(games_list) < TARGET_COUNT:
        params = {
            "key": API_KEY,
            "page": page,
            "page_size": PAGE_SIZE,
            "ordering": "-rating"
        }

        try:
            response = requests.get(BASE_URL, params=params, timeout=15)
        except requests.exceptions.RequestException as e:
            print(f"Сетевая ошибка на странице {page}: {e}. Повтор через 3 секунды...")
            time.sleep(3)
            continue

        if response.status_code == 429:
            print("Превышен лимит запросов RAWG API. Ожидание 10 секунд...")
            time.sleep(10)
            continue
        elif response.status_code != 200:
            print(f"Ошибка запроса на странице {page}: HTTP {response.status_code}")
            print(response.text)
            break

        data = response.json()
        results = data.get("results", [])
        if not results:
            print("Данные закончились.")
            break

        for item in results:
            released_date = item.get("released") or ""
            release_year = int(released_date[:4]) if len(released_date) >= 4 and released_date[:4].isdigit() else 2024
            rawg_rating = item.get("rating") or 0.0

            game_data = {
                "id": item.get("id"),
                "title": item.get("name", "Без названия"),
                "year": release_year,
                "developer": "RAWG Database",
                "cover": item.get("background_image") or "https://images.unsplash.com/photo-1542751371-adc38448a05e?w=600&q=80",
                "screenshots": [item.get("background_image")] if item.get("background_image") else [],
                "description": f"Оценка Metacritic: {item.get('metacritic') or 'Н/Д'}. Общий рейтинг: {rawg_rating}/5.",
                "fullDescription": f"{item.get('name')} — игра с оценкой сообщества {rawg_rating}/5 на основе {item.get('ratings_count', 0)} отзывов.",
                "genres": [g.get("name") for g in item.get("genres", []) if "name" in g],
                "tags": [t.get("name") for t in item.get("tags", [])[:5] if "name" in t],
                "platforms": [p.get("platform", {}).get("name") for p in item.get("platforms", []) if "platform" in p],
                "rating": round(rawg_rating * 2, 1),
                "ratingCount": item.get("ratings_count", 0),
                "releaseDate": released_date if released_date else "Не указана",
                "status": "released",
                "badges": ["hit"] if rawg_rating >= 4.0 else []
            }
            games_list.append(game_data)

            if len(games_list) >= TARGET_COUNT:
                break

        print(f"Страница {page}/{total_pages} обработана. Собрано: {len(games_list)}/{TARGET_COUNT}")
        page += 1
        time.sleep(0.35)

    with open(OUTPUT_FILE, "w", encoding="utf-8") as f:
        json.dump(games_list, f, ensure_ascii=False, indent=2)

    print(f"Готово! {len(games_list)} игр сохранено в {OUTPUT_FILE}")

if __name__ == "__main__":
   
fetch_games()
