// Роутинг
// Открывает или закрывает выпадающее меню на узких экранах (кнопка с тремя полосками)
function toggleMobileMenu() {
  document.getElementById('mobile-menu').classList.toggle('hidden-view');
}

// Закрывает выпадающее меню (нужно после выбора раздела)
function closeMobileMenu() {
  const menu = document.getElementById('mobile-menu');
  if (menu) menu.classList.add('hidden-view');
}

// Перезапускает CSS-анимацию у элемента: убираем класс, заставляем браузер «увидеть» это, и возвращаем класс.
// Без этого анимация второй раз не проигрывается
function restartAnimation(el, cls) {
  el.classList.remove(cls);
  void el.offsetWidth;
  el.classList.add(cls);
}

// Быстрый переход в профиль игрока (по никнейму или свой)
function showProfile(username = null, tab = 'overview') {
  showView('profile', { username, tab });
}
window.showProfile = showProfile;

// Определение текущего маршрута из адресной строки (поддержка чистых путей без # и совместимость со старыми ссылками)
function getRouteFromUrl() {
  if (typeof window === 'undefined') return { view: 'home', params: {} };

  const hash = window.location.hash || '';
  const search = window.location.search || '';
  const pathname = window.location.pathname || '/';

  const urlParams = new URLSearchParams(search);
  const hashParamsMatch = hash.match(/\?(.+)$/);
  const hashParams = hashParamsMatch ? new URLSearchParams(hashParamsMatch[1]) : new URLSearchParams();
  const getParam = (k) => urlParams.get(k) || hashParams.get(k);

  let rawView = '';
  if (hash.startsWith('#')) {
    const cleanHash = hash.slice(1).split('?')[0].replace(/^\/+|\/+$/g, '');
    if (cleanHash) rawView = cleanHash;
  }

  if (!rawView) {
    const segments = pathname.split('/').filter(Boolean);
    const filtered = segments.filter(s => s !== 'index.html');
    if (filtered.length > 0) {
      rawView = filtered[filtered.length - 1];
    }
  }

  const validViews = ['home', 'catalog', 'game', 'genres', 'platforms', 'tops', 'releases', 'news', 'profile'];
  const view = validViews.includes(rawView) ? rawView : 'home';

  const params = {};
  if (view === 'game') {
    const gId = parseInt(getParam('gameId') || getParam('id'), 10);
    if (gId) params.gameId = gId;
  } else if (view === 'profile') {
    const user = getParam('user') || getParam('username');
    if (user) params.username = user;
    const tab = getParam('tab');
    if (tab) params.tab = tab;
  } else if (view === 'news') {
    const articleId = getParam('id') || getParam('articleId');
    if (articleId) params.articleId = articleId;
  } else if (view === 'catalog') {
    const genre = getParam('genre');
    if (genre) params.genre = genre;
    const platform = getParam('platform');
    if (platform) params.platform = platform;
  }

  return { view, params };
}
window.getRouteFromUrl = getRouteFromUrl;

// Первичная инициализация маршрута при загрузке страницы
function initAppRoute() {
  const route = getRouteFromUrl();
  // Если в адресе остался старый хэш (#profile), заменяем его на чистый красивый путь без #
  if (typeof window !== 'undefined' && window.location.hash && window.history && window.history.replaceState) {
    let cleanUrl = route.view === 'home' ? '/' : '/' + route.view;
    const search = window.location.search;
    if (search) cleanUrl += search;
    try {
      window.history.replaceState({ view: route.view, params: route.params }, '', cleanUrl);
    } catch (e) {}
  }
  showView(route.view, route.params, false);
}
window.initAppRoute = initAppRoute;

// Главная функция «роутера»: переключает страницу сайта. Запоминаем текущий раздел и вызываем нужную render-функцию
function showView(view, params = {}, push = true) {
  // запоминаем, какая страница открыта
  state.currentView = view;
  if (params.gameId) {
    state.currentGame = GAMES.find(g => g.id === params.gameId);
    if (typeof trackRecentlyViewed === 'function') trackRecentlyViewed(params.gameId);
  }
  if (params.genre) state.filters.genre = params.genre;
  if (params.platform) state.filters.platform = params.platform;

  if (view === 'profile') {
    state.viewingProfile = params.username || null;
    state.publicProfileTab = params.tab || 'overview';
  }

  if (view === 'news') {
    state.newsArticleId = params.articleId || null;
  }

  // Поддержка чистых URL без решетки (#)
  if (push !== false && typeof window !== 'undefined' && window.history) {
    let url = view === 'home' ? '/' : '/' + view;
    const q = [];
    if (params.gameId) q.push('id=' + encodeURIComponent(params.gameId));
    if (params.username) q.push('user=' + encodeURIComponent(params.username));
    if (params.tab && params.tab !== 'overview') q.push('tab=' + encodeURIComponent(params.tab));
    if (params.articleId) q.push('id=' + encodeURIComponent(params.articleId));
    if (params.genre) q.push('genre=' + encodeURIComponent(params.genre));
    if (params.platform) q.push('platform=' + encodeURIComponent(params.platform));

    if (q.length > 0) {
      url += '?' + q.join('&');
    }

    try {
      window.history.pushState({ view, params }, '', url);
    } catch (e) {
      try {
        window.history.pushState({ view, params }, '', '#' + view);
      } catch (err) {}
    }
  }

  // после перехода закрываем выпадающее меню и подсвечиваем текущий раздел в нём
  closeMobileMenu();
  document.querySelectorAll('.mobile-link').forEach(b => {
    b.classList.toggle('text-violet-400', b.dataset.view === view);
    b.classList.toggle('text-zinc-300', b.dataset.view !== view);
  });

  // подсвечиваем нужный пункт меню в шапке
  document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
  const activeLink = document.querySelector(`.nav-link[data-view="${view}"]`);
  if (activeLink) activeLink.classList.add('active');

  // очищаем основную область и рисуем новую страницу
  const main = document.getElementById('main-content');
  main.innerHTML = '';
  main.className = '';

  switch (view) {
    case 'home':      renderHome(main);      break;
    case 'catalog':   renderCatalog(main);   break;
    case 'game':      renderGamePage(main);  break;
    case 'genres':    renderGenres(main);    break;
    case 'platforms': renderPlatforms(main); break;
    case 'tops':      renderTops(main);         break;
    case 'releases':  renderReleases(main);     break;
    case 'news':      renderNews(main, params); break;
    case 'profile':   renderProfile(main);      break;
  }

  // плавное появление новой страницы
  restartAnimation(main, 'animate-fade');

  // после смены страницы прокручиваем наверх
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// ---------------- Обработка истории и боковых кнопок мыши ----------------
if (typeof window !== 'undefined') {
  // Нажатие кнопок «Назад» / «Вперёд» в браузере
  window.addEventListener('popstate', (e) => {
    if (e.state && e.state.view) {
      showView(e.state.view, e.state.params || {}, false);
    } else {
      const route = getRouteFromUrl();
      showView(route.view, route.params, false);
    }
  });

  // Взаимодействие с боковыми кнопками игровой мыши (Mouse 4 — назад, Mouse 5 — вперёд)
  function handleMouseNav(e) {
    if (e.button === 3) {
      // Боковая кнопка 1 (Назад)
      e.preventDefault();
      e.stopPropagation();
      window.history.back();
    } else if (e.button === 4) {
      // Боковая кнопка 2 (Вперёд)
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
