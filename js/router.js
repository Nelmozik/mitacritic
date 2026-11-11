// ===================================================================
// GameVault SPA Router & URL Manager
// Поддержка чистых путей (History API), обратная совместимость с #hash,
// восстановление позиции скролла при popstate и обновление заголовков страниц
// ===================================================================

// Открывает или закрывает выпадающее меню на узких экранах
function toggleMobileMenu() {
  const menu = document.getElementById('mobile-menu');
  if (menu) menu.classList.toggle('hidden-view');
}
window.toggleMobileMenu = toggleMobileMenu;

// Закрывает выпадающее меню
function closeMobileMenu() {
  const menu = document.getElementById('mobile-menu');
  if (menu) menu.classList.add('hidden-view');
}
window.closeMobileMenu = closeMobileMenu;

// Перезапускает CSS-анимацию у элемента
function restartAnimation(el, cls) {
  if (!el) return;
  el.classList.remove(cls);
  void el.offsetWidth;
  el.classList.add(cls);
}
window.restartAnimation = restartAnimation;

// Быстрый переход в профиль игрока (по никнейму или свой)
function showProfile(username = null, tab = 'overview') {
  showView('profile', { username, tab });
}
window.showProfile = showProfile;

// Допустимые разделы сайта
const VALID_VIEWS = ['home', 'catalog', 'game', 'genres', 'platforms', 'tops', 'releases', 'news', 'profile'];

// Определение базового пути (для работы в подпапках хостинга, например GitHub Pages /repo-name/)
function getBasePath() {
  if (typeof window === 'undefined') return '';
  const pathname = window.location.pathname || '/';
  const segments = pathname.split('/').filter(Boolean);
  if (segments.length > 0) {
    const first = segments[0];
    if (first !== 'index.html' && first !== '404.html' && !VALID_VIEWS.includes(first)) {
      return '/' + first;
    }
  }
  return '';
}
window.getBasePath = getBasePath;

// Формирование чистого URL для роутера
function buildCleanUrl(view, params = {}) {
  const base = getBasePath();
  let url = (view === 'home') ? (base || '/') : (base + '/' + view);
  const q = [];

  if (params.gameId) {
    q.push('id=' + encodeURIComponent(params.gameId));
  }
  if (params.username) {
    q.push('user=' + encodeURIComponent(params.username));
  }
  if (params.tab && params.tab !== 'overview') {
    q.push('tab=' + encodeURIComponent(params.tab));
  }
  if (params.articleId) {
    q.push('id=' + encodeURIComponent(params.articleId));
  }
  if (params.genre) {
    q.push('genre=' + encodeURIComponent(params.genre));
  }
  if (params.platform) {
    q.push('platform=' + encodeURIComponent(params.platform));
  }
  if (params.search) {
    q.push('q=' + encodeURIComponent(params.search));
  }

  if (q.length > 0) {
    url += '?' + q.join('&');
  }
  return url;
}
window.buildCleanUrl = buildCleanUrl;

// Динамическое обновление title вкладки браузера
function updatePageTitle(view, params = {}) {
  let title = 'GameVault — Каталог видеоигр';
  switch (view) {
    case 'catalog':
      if (params.genre) {
        title = `Каталог (${params.genre}) — GameVault`;
      } else {
        title = 'Каталог игр — GameVault';
      }
      break;
    case 'game':
      if (state.currentGame && state.currentGame.title) {
        title = `${state.currentGame.title} — GameVault`;
      } else {
        title = 'Игра — GameVault';
      }
      break;
    case 'profile':
      const who = params.username || (state.currentUser ? state.currentUser.username : '');
      title = who ? `${who} — Профиль GameVault` : 'Профиль — GameVault';
      break;
    case 'news':
      title = 'Новости — GameVault';
      break;
    case 'tops':
      title = 'Топ игр — GameVault';
      break;
    case 'genres':
      title = 'Жанры игр — GameVault';
      break;
    case 'platforms':
      title = 'Платформы — GameVault';
      break;
    case 'releases':
      title = 'Календарь релизов — GameVault';
      break;
    case 'home':
    default:
      title = 'GameVault — Каталог видеоигр';
      break;
  }
  document.title = title;
}
window.updatePageTitle = updatePageTitle;

// Определение текущего маршрута из адресной строки (чистые URL + fallback на #hash + path params)
function getRouteFromUrl() {
  if (typeof window === 'undefined') return { view: 'home', params: {} };

  const hash = window.location.hash || '';
  const search = window.location.search || '';
  const pathname = window.location.pathname || '/';
  const base = getBasePath();

  // Отсекаем базовый префикс подпапки
  let relPath = pathname;
  if (base && relPath.startsWith(base)) {
    relPath = relPath.slice(base.length);
  }
  relPath = relPath.replace(/^\/+|\/+$/g, '');

  const urlParams = new URLSearchParams(search);
  const hashParamsMatch = hash.match(/\?(.+)$/);
  const hashParams = hashParamsMatch ? new URLSearchParams(hashParamsMatch[1]) : new URLSearchParams();
  const getParam = (k) => urlParams.get(k) || hashParams.get(k);

  let rawView = '';
  let pathArg = null;

  // 1. Проверяем hash вида #game?id=123 или #/game/123 или #profile?user=nick
  if (hash.startsWith('#')) {
    const cleanHash = hash.slice(1).split('?')[0].replace(/^\/+|\/+$/g, '');
    const hashParts = cleanHash.split('/').filter(Boolean);
    if (hashParts.length > 0) {
      rawView = hashParts[0];
      if (hashParts.length > 1) {
        try { pathArg = decodeURIComponent(hashParts[1]); } catch (e) { pathArg = hashParts[1]; }
      }
    }
  }

  // 2. Если в hash ничего нет, парсим pathname (/game?id=123 или /game/123)
  if (!rawView && relPath) {
    const segments = relPath.split('/').filter(s => s !== 'index.html' && s !== '404.html');
    if (segments.length > 0) {
      rawView = segments[0];
      if (segments.length > 1) {
        try { pathArg = decodeURIComponent(segments[1]); } catch (e) { pathArg = segments[1]; }
      }
    }
  }

  const view = VALID_VIEWS.includes(rawView) ? rawView : 'home';
  const params = {};

  if (view === 'game') {
    const rawId = getParam('gameId') || getParam('id') || pathArg;
    const gId = parseInt(rawId, 10);
    if (!isNaN(gId) && gId > 0) params.gameId = gId;
  } else if (view === 'profile') {
    const user = getParam('user') || getParam('username') || pathArg;
    if (user) params.username = user;
    const tab = getParam('tab');
    if (tab) params.tab = tab;
  } else if (view === 'news') {
    const articleId = getParam('id') || getParam('articleId') || pathArg;
    if (articleId) params.articleId = articleId;
  } else if (view === 'catalog') {
    const genre = getParam('genre');
    if (genre) params.genre = genre;
    const platform = getParam('platform');
    if (platform) params.platform = platform;
    const q = getParam('q') || getParam('search');
    if (q) params.search = q;
  }

  return { view, params };
}
window.getRouteFromUrl = getRouteFromUrl;

// Первичная инициализация маршрута при загрузке страницы
function initAppRoute() {
  const route = getRouteFromUrl();

  // Если в адресной строке остался старый hash (#game?id=...), заменяем его на чистый красивый URL
  if (typeof window !== 'undefined' && window.location.hash && window.history && window.history.replaceState) {
    const cleanUrl = buildCleanUrl(route.view, route.params);
    try {
      window.history.replaceState({ view: route.view, params: route.params, scrollY: 0 }, '', cleanUrl);
    } catch (e) {}
  } else if (typeof window !== 'undefined' && window.history && window.history.replaceState) {
    // Сохраняем состояние для возврата назад через popstate
    try {
      window.history.replaceState({ view: route.view, params: route.params, scrollY: window.scrollY || 0 }, '', window.location.href);
    } catch (e) {}
  }

  showView(route.view, route.params, false);
}
window.initAppRoute = initAppRoute;

// Главная функция роутера: переключает экран, обновляет URL, заголовки и историю
function showView(view, params = {}, push = true) {
  // Сохраняем текущий скролл в предыдущей записи истории перед переходом
  if (push !== false && typeof window !== 'undefined' && window.history && window.history.state) {
    try {
      window.history.replaceState({
        ...window.history.state,
        scrollY: window.scrollY || window.pageYOffset || 0
      }, '');
    } catch (e) {}
  }

  // Обновляем состояние приложения
  state.currentView = view;

  if (params.gameId) {
    state.currentGame = (typeof GAMES !== 'undefined' && Array.isArray(GAMES))
      ? GAMES.find(g => g.id === params.gameId)
      : null;
    if (typeof trackRecentlyViewed === 'function') trackRecentlyViewed(params.gameId);
  }

  if (params.genre !== undefined) state.filters.genre = params.genre;
  if (params.platform !== undefined) state.filters.platform = params.platform;
  if (params.search !== undefined) state.searchQuery = params.search;

  if (view === 'profile') {
    state.viewingProfile = params.username || null;
    state.publicProfileTab = params.tab || 'overview';
  }

  if (view === 'news') {
    state.newsArticleId = params.articleId || null;
  }

  // Обновляем title страницы
  updatePageTitle(view, params);

  // Поддержка чистых URL без решетки (#)
  if (push !== false && typeof window !== 'undefined' && window.history) {
    const url = buildCleanUrl(view, params);
    try {
      window.history.pushState({ view, params, scrollY: 0 }, '', url);
    } catch (e) {
      try {
        window.history.pushState({ view, params, scrollY: 0 }, '', '#' + view);
      } catch (err) {}
    }
  }

  // Закрываем мобильное меню и сбрасываем кнопки поиска
  closeMobileMenu();
  if (typeof updateSearchClearButtons === 'function') updateSearchClearButtons();

  // Подсвечиваем активный пункт в мобильном меню
  document.querySelectorAll('.mobile-link').forEach(b => {
    b.classList.toggle('text-violet-400', b.dataset.view === view);
    b.classList.toggle('text-zinc-300', b.dataset.view !== view);
  });

  // Подсвечиваем активный пункт в меню десктопа
  document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
  const activeLink = document.querySelector(`.nav-link[data-view="${view}"]`);
  if (activeLink) activeLink.classList.add('active');

  // Очищаем и рисуем контент нужного экрана
  const main = document.getElementById('main-content');
  if (!main) return;
  main.innerHTML = '';
  main.className = '';

  switch (view) {
    case 'home':      if (typeof renderHome === 'function') renderHome(main);           break;
    case 'catalog':   if (typeof renderCatalog === 'function') renderCatalog(main);     break;
    case 'game':      if (typeof renderGamePage === 'function') renderGamePage(main);   break;
    case 'genres':    if (typeof renderGenres === 'function') renderGenres(main);       break;
    case 'platforms': if (typeof renderPlatforms === 'function') renderPlatforms(main); break;
    case 'tops':      if (typeof renderTops === 'function') renderTops(main);           break;
    case 'releases':  if (typeof renderReleases === 'function') renderReleases(main);   break;
    case 'news':      if (typeof renderNews === 'function') renderNews(main, params);   break;
    case 'profile':   if (typeof renderProfile === 'function') renderProfile(main);     break;
  }

  // Плавное появление экрана
  restartAnimation(main, 'animate-fade');

  // При обычном переходе (push === true) прокручиваем наверх страницы
  if (push !== false) {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
}
window.showView = showView;

// ===================================================================
// Обработка истории браузера (popstate) и боковых кнопок мыши
// ===================================================================
if (typeof window !== 'undefined') {
  // Настройка ручного управления скроллом для точного восстановления
  if ('scrollRestoration' in window.history) {
    window.history.scrollRestoration = 'manual';
  }

  // Нажатие кнопок «Назад» / «Вперёд» в браузере
  window.addEventListener('popstate', (e) => {
    if (e.state && e.state.view) {
      const targetScrollY = (typeof e.state.scrollY === 'number') ? e.state.scrollY : 0;
      showView(e.state.view, e.state.params || {}, false);
      setTimeout(() => {
        window.scrollTo({ top: targetScrollY, behavior: 'instant' });
      }, 0);
    } else {
      const route = getRouteFromUrl();
      showView(route.view, route.params, false);
    }
  });

  // Взаимодействие с боковыми кнопками игровой мыши (Mouse 4 — назад, Mouse 5 — вперёд)
  function handleMouseNav(e) {
    if (e.button === 3) {
      e.preventDefault();
      e.stopPropagation();
      window.history.back();
    } else if (e.button === 4) {
      e.preventDefault();
      e.stopPropagation();
      window.history.forward();
    }
  }

  window.addEventListener('mouseup', handleMouseNav);
  window.addEventListener('pointerup', handleMouseNav);
  window.addEventListener('auxclick', (e) => {
    if (e.button === 3 || e.button === 4) {
      e.preventDefault();
    }
  });
}
