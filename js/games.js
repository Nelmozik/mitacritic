// GameVault Dynamic Data Loader
// Заменяет монолитный массив games.js (8 МБ) на загрузку компактного data/index.json
// и подгрузку полных деталей (скриншоты, подробное описание, теги) по требованию.

window.GAMES = window.GAMES || [];
window._gamesIndexPromise = null;
window._gamesChunkCache = {};

window.loadGamesIndex = function() {
  if (window._gamesIndexPromise) return window._gamesIndexPromise;

  window._gamesIndexPromise = fetch('data/index.json')
    .then(res => {
      if (!res.ok) throw new Error('HTTP ' + res.status);
      return res.json();
    })
    .then(data => {
      window.GAMES = data;
      window.dispatchEvent(new CustomEvent('gamesLoaded', { detail: data }));
      return data;
    })
    .catch(err => {
      console.error('Ошибка загрузки data/index.json:', err);
      return [];
    });

  return window._gamesIndexPromise;
};

// Запускаем предзагрузку индекса немедленно
window.loadGamesIndex();

// Загрузка полных деталей игры (скриншоты, описание, теги, разработчик)
window.loadGameDetails = async function(gameId) {
  if (!window.GAMES || !window.GAMES.length) {
    await window.loadGamesIndex();
  }
  const g = (window.GAMES || []).find(item => item.id == gameId);
  if (!g) return null;
  if (g._detailsLoaded) return g;

  const chunk = typeof g.chunk === 'number' ? g.chunk : Math.floor(window.GAMES.indexOf(g) / 500);
  if (!window._gamesChunkCache[chunk]) {
    try {
      const res = await fetch(`data/games-${chunk}.json`);
      if (res.ok) {
        window._gamesChunkCache[chunk] = await res.json();
      }
    } catch (e) {
      console.warn('Не удалось загрузить чанк игры:', chunk, e);
    }
  }

  const chunkList = window._gamesChunkCache[chunk] || [];
  const details = chunkList.find(item => item.id == gameId);
  if (details) {
    Object.assign(g, details);
    g._detailsLoaded = true;
  }
  return g;
};
