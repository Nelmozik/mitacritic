#!/usr/bin/env python3
"""
tools/split_data.py
Разделяет монолитные js/games.js (~8 МБ) и js/descriptions.js (~7.7 МБ) на:
1. data/index.json: лёгкий индекс для каталога, поиска и фильтрации (~500 КБ gzip).
2. data/games-{N}.json: подробные данные об играх (скриншоты, теги, разработчик) чанками по ~500 игр.
3. data/desc-{N}.json: описания игр чанками по ~500 игр с привязкой по id.
"""

import os
import json
import re

ROOT_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
GAMES_JS = os.path.join(ROOT_DIR, 'js', 'games.js')
DESC_JS = os.path.join(ROOT_DIR, 'js', 'descriptions.js')
DATA_DIR = os.path.join(ROOT_DIR, 'data')

CHUNK_SIZE = 500

def main():
    os.makedirs(DATA_DIR, exist_ok=True)

    print("Читаем js/games.js...")
    with open(GAMES_JS, 'r', encoding='utf-8') as f:
        content = f.read()
        start = content.index('[')
        end = content.rindex(']') + 1
        games = json.loads(content[start:end])

    print(f"Загружено игр: {len(games)}")

    print("Читаем js/descriptions.js...")
    descriptions = {}
    if os.path.exists(DESC_JS):
        with open(DESC_JS, 'r', encoding='utf-8') as f:
            content = f.read()
            start = content.find('{')
            end = content.rfind('}') + 1
            if start != -1 and end != -1:
                descriptions = json.loads(content[start:end])
    print(f"Загружено описаний: {len(descriptions)}")

    index_list = []
    total_games = len(games)
    num_chunks = (total_games + CHUNK_SIZE - 1) // CHUNK_SIZE

    for chunk_idx in range(num_chunks):
        start_idx = chunk_idx * CHUNK_SIZE
        end_idx = min(start_idx + CHUNK_SIZE, total_games)
        chunk_games = games[start_idx:end_idx]

        games_chunk_data = []
        desc_chunk_data = {}

        for g in chunk_games:
            gid = g.get('id')
            gid_str = str(gid)

            # Описание и разработчик из descriptions.js или games.js
            desc_info = descriptions.get(gid_str, {})
            desc_text = desc_info.get('d') or g.get('fullDescription') or g.get('description') or ''
            developer = desc_info.get('dev') or g.get('developer') or '—'

            # 1. Запись в лёгкий index.json
            index_list.append({
                'id': gid,
                'title': g.get('title', ''),
                'year': g.get('year', 0),
                'cover': g.get('cover', ''),
                'genres': g.get('genres', []),
                'platforms': g.get('platforms', []),
                'rating': g.get('rating', 0),
                'ratingCount': g.get('ratingCount', 0),
                'badges': g.get('badges', []),
                'is18Plus': bool(g.get('is18Plus', False)),
                'releaseDate': g.get('releaseDate', ''),
                'status': g.get('status', 'released'),
                'chunk': chunk_idx
            })

            # 2. Подробные данные для games-{N}.json
            games_chunk_data.append({
                'id': gid,
                'developer': developer,
                'screenshots': g.get('screenshots', []),
                'tags': g.get('tags', []),
                'distribution': g.get('distribution', None),
                'description': g.get('description', ''),
                'fullDescription': desc_text
            })

            # 3. Описания для desc-{N}.json
            if desc_text or developer:
                desc_chunk_data[gid_str] = {
                    'd': desc_text,
                    'dev': developer
                }

        # Сохраняем чанк игр
        games_chunk_file = os.path.join(DATA_DIR, f'games-{chunk_idx}.json')
        with open(games_chunk_file, 'w', encoding='utf-8') as f:
            json.dump(games_chunk_data, f, ensure_ascii=False, separators=(',', ':'))

        # Сохраняем чанк описаний
        desc_chunk_file = os.path.join(DATA_DIR, f'desc-{chunk_idx}.json')
        with open(desc_chunk_file, 'w', encoding='utf-8') as f:
            json.dump(desc_chunk_data, f, ensure_ascii=False, separators=(',', ':'))

        print(f"  Чанк {chunk_idx}: {len(chunk_games)} игр сохранено")

    # Сохраняем data/index.json
    index_file = os.path.join(DATA_DIR, 'index.json')
    with open(index_file, 'w', encoding='utf-8') as f:
        json.dump(index_list, f, ensure_ascii=False, separators=(',', ':'))

    idx_size_mb = os.path.getsize(index_file) / (1024 * 1024)
    print(f"\nГотово! Создан data/index.json: {idx_size_mb:.2f} МБ (было games.js 8.1 МБ + descriptions.js 7.7 МБ).")
    print(f"Всего создано {num_chunks} чанков в папке data/.")

if __name__ == '__main__':
    main()
