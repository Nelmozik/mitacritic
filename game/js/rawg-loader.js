// ============ ЗАГРУЗКА ИГР ИЗ RAWG (автоматически при открытии сайта) ============

(function () {
  const API = 'https://api.rawg.io/api';
  const GMAP = { 'Action':'Экшен','RPG':'RPG','Adventure':'Приключения','Shooter':'Шутер','Strategy':'Стратегия','Puzzle':'Головоломка','Racing':'Гонки','Sports':'Спорт','Indie':'Инди','Platformer':'Платформер','Simulation':'Симулятор','Fighting':'Файтинг','Arcade':'Аркада','Casual':'Казуальная','Massively Multiplayer':'MMO','Family':'Семейная','Board Games':'Настольная','Educational':'Обучающая','Card':'Карточная' };
  const MONTHS = ['января','февраля','марта','апреля','мая','июня','июля','августа','сентября','октября','ноября','декабря'];
  const sleep = ms => new Promise(r => setTimeout(r, ms));
  let cancel = false, running = false;

  // --- IndexedDB (хранит до 5000 игр, localStorage для этого мал) ---
  const openDb = () => new Promise((res, rej) => {
    const r = indexedDB.open('gamevault', 1);
    r.onupgradeneeded = () => r.result.createObjectStore('kv');
    r.onsuccess = () => res(r.result);
    r.onerror = () => rej(r.error);
  });
  async function idbGet(k) {
    try { const d = await openDb(); return await new Promise(res => { const q = d.transaction('kv').objectStore('kv').get(k); q.onsuccess = () => res(q.result); q.onerror = () => res(undefined); }); } catch { return undefined; }
  }
  async function idbSet(k, v) {
    try { const d = await openDb(); await new Promise((res, rej) => { const t = d.transaction('kv', 'readwrite'); t.objectStore('kv').put(v, k); t.oncomplete = res; t.onerror = () => rej(t.error); }); } catch (e) { console.warn('IndexedDB:', e); }
  }

  // --- RAWG -> формат GameVault ---
  const resize = (u, w) => u ? u.replace('/media/games/', `/media/resize/${w}/-/games/`) : u;
  function platforms(raw) {
    const out = [];
    (raw || []).forEach(p => {
      const n = p.platform.name;
      if (n === 'PC') out.push('PC');
      else if (n === 'PlayStation 5') out.push('PS5');
      else if (n === 'PlayStation 4') out.push('PS4');
      else if (n.startsWith('Xbox Series')) out.push('Xbox Series X', 'Xbox');
      else if (n === 'Xbox One') out.push('Xbox');
      else if (n === 'Nintendo Switch') out.push('Switch');
      else if (n === 'iOS' || n === 'Android') out.push('Mobile');
    });
    return [...new Set(out)];
  }
  function convert(g, det) {
    const now = new Date(), rel = g.released;
    let y = 0, m = 0, d = 0;
    if (rel) [y, m, d] = rel.split('-').map(Number);
    const released = !!rel && new Date(rel) <= now && !g.tba;
    const rating = Math.round((g.rating || 0) * 20) / 10;
    const count = g.ratings_count || 0;
    let badges = [];
    if (released && rating >= 8.6 && count >= 1000) badges.push('hit');
    if (released && y >= now.getFullYear() - 1) badges.push('new');
    if (released && y > 0 && y <= 2012 && rating >= 8.4) badges.push('classic');
    if (!released) badges = ['soon'];
    const desc = ((det && det.description_raw) || '').trim();
    const genres = (g.genres || []).map(x => GMAP[x.name] || x.name);
    return {
      id: g.id, title: g.name, year: y,
      developer: (det && det.developers || []).slice(0, 2).map(x => x.name).join(', ') || '—',
      cover: resize(g.background_image, 640),
      screenshots: (g.short_screenshots || []).slice(1, 5).map(s => resize(s.image, 1200)).concat([]).filter(Boolean).length
        ? (g.short_screenshots || []).slice(1, 5).map(s => resize(s.image, 1200)) : [resize(g.background_image, 1200)],
      description: desc.length > 160 ? desc.slice(0, 160) + '…' : (desc || genres.join(', ')),
      fullDescription: desc || 'Описание пока отсутствует.',
      genres: genres.length ? genres : ['Экшен'],
      tags: (g.tags || []).filter(t => t.language === 'eng').slice(0, 4).map(t => t.name),
      platforms: platforms(g.platforms),
      rating: released ? rating : 0, ratingCount: released ? count : 0,
      releaseDate: rel ? `${d} ${MONTHS[m - 1]} ${y}` : 'Дата неизвестна',
      status: released ? 'released' : 'upcoming', badges
    };
  }

  function applyGames(list) {
    if (!list || !list.length) return;
    list.sort((a, b) => b.rating - a.rating);
    GAMES.length = 0;
    for (let i = 0; i < list.length; i += 1000) GAMES.push(...list.slice(i, i + 1000));
    state.limit = 60;
    if (state.currentView !== 'game') showView(state.currentView);
  }

  async function rawgGet(url) {
    for (let i = 0; i < 5; i++) {
      try {
        const r = await fetch(url);
        if (r.status === 401 || r.status === 403) throw new Error('Неверный ключ или исчерпан лимит RAWG');
        if (r.status === 429) { await sleep(5000); continue; }
        if (r.ok) return await r.json();
      } catch (e) { if (String(e.message).includes('RAWG')) throw e; }
      await sleep(1500 * (i + 1));
    }
    return null;
  }

  // --- индикатор загрузки (исчезает сам) ---
  const note = document.createElement('div');
  note.className = 'hidden fixed bottom-4 right-4 z-[90] px-4 py-2 rounded-full bg-zinc-900/90 border border-zinc-700 text-zinc-300 text-xs shadow-xl';
  document.body.appendChild(note);
  const say = (t, hideAfter) => {
    note.textContent = t; note.classList.remove('hidden');
    if (hideAfter) setTimeout(() => note.classList.add('hidden'), hideAfter);
  };

  async function load(store) {
    const key = RAWG_KEY;
    const total = GAMES_COUNT;
    let shown = false, failed = 0;
    const pagesNeeded = Math.ceil(total / 40);
    store.done = store.done || [];
    const queue = [];
    for (let p = 1; p <= pagesNeeded; p++) if (!store.done.includes(p)) queue.push(p);
    let finished = 0;
    const pageWorker = async () => {
      while (queue.length) {
        const p = queue.shift();
        const data = await rawgGet(`${API}/games?key=${key}&page=${p}&page_size=40&ordering=-added`);
        if (!data || !data.results) { failed++; continue; }
        data.results.forEach(g => { if (g.background_image) store.list[g.id] = g; });
        store.done.push(p);
        finished++;
        const n = Object.keys(store.list).length;
        say(`Загрузка игр: ${Math.min(n, total)} / ${total}`);
        if (!shown && n >= 40) { // первые игры показываем сразу
          shown = true;
          applyGames(Object.keys(store.list).map(i => convert(store.list[i], store.detail[i])));
        }
        if (finished % 20 === 0) await idbSet('raw', store);
      }
    };
    // 6 запросов одновременно вместо одного
    await Promise.all(Array.from({ length: 6 }, pageWorker));
    if (!Object.keys(store.list).length) throw new Error('RAWG не ответил (проверьте ключ и интернет)');
    const ids = Object.keys(store.list).slice(0, total);
    if (WITH_DETAILS) {
      let done = 0, idx = 0;
      const todo = ids.filter(i => !store.detail[i]);
      const worker = async () => {
        while (idx < todo.length) {
          const id = todo[idx++];
          const d = await rawgGet(`${API}/games/${id}?key=${key}`);
          if (d) store.detail[id] = { description_raw: d.description_raw, developers: d.developers };
          if (++done % 20 === 0) say(`Описания: ${done} / ${todo.length}`);
          if (done % 200 === 0) await idbSet('raw', store);
          await sleep(100);
        }
      };
      await Promise.all([worker(), worker(), worker()]);
    }
    await idbSet('raw', store);
    applyGames(ids.map(i => convert(store.list[i], store.detail[i])));
  }

  // Консоль браузера: exportGames() скачает games.json
  window.exportGames = () => {
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([JSON.stringify(GAMES)], { type: 'application/json' }));
    a.download = 'games.json'; a.click();
  };

  (async () => {
    const store = (await idbGet('raw')) || { list: {}, detail: {}, page: 1 };
    const have = Object.keys(store.list).length;
    if (have) applyGames(Object.keys(store.list).slice(0, GAMES_COUNT).map(i => convert(store.list[i], store.detail[i])));
    if (have >= GAMES_COUNT && (!WITH_DETAILS || Object.keys(store.detail).length >= GAMES_COUNT)) return;
    if (RAWG_KEY.startsWith('ВСТАВЬТЕ')) { say('Укажите RAWG_KEY в начале скрипта', 8000); return; }
    try { await load(store); say('Игры загружены', 2500); }
    catch (e) { say('Ошибка загрузки: ' + e.message, 8000); }
  })();
})();
