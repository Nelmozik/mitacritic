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

  // Поддержка истории браузера и боковых кнопок мыши
  if (push !== false && typeof window !== 'undefined' && window.history) {
    let hash = '#' + view;
    if (params.gameId) hash += '?gameId=' + params.gameId;
    else if (params.username) hash += '?user=' + encodeURIComponent(params.username);
    else if (params.articleId) hash += '?id=' + encodeURIComponent(params.articleId);
    else if (params.genre) hash += '?genre=' + params.genre;
    else if (params.platform) hash += '?platform=' + params.platform;
    try {
      window.history.pushState({ view, params }, '', hash);
    } catch (e) {}
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
      const hash = window.location.hash || '';
      if (hash.startsWith('#profile')) {
        const uMatch = hash.match(/[?&]user=([^&]+)/);
        const username = uMatch ? decodeURIComponent(uMatch[1]) : null;
        showView('profile', { username }, false);
      } else if (hash.startsWith('#news')) {
        const idMatch = hash.match(/[?&]id=([^&]+)/);
        const articleId = idMatch ? decodeURIComponent(idMatch[1]) : null;
        showView('news', { articleId }, false);
      } else {
        showView('home', {}, false);
      }
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
