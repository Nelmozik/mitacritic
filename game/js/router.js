// Роутинг
// Главная функция «роутера»: переключает страницу сайта. Запоминаем текущий раздел и вызываем нужную render-функцию
function showView(view, params = {}) {
  // запоминаем, какая страница открыта
  state.currentView = view;
  if (params.gameId) state.currentGame = GAMES.find(g => g.id === params.gameId);
  if (params.genre) state.filters.genre = params.genre;
  if (params.platform) state.filters.platform = params.platform;
  
  // подсвечиваем нужный пункт меню в шапке
  document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
  const activeLink = document.querySelector(`.nav-link[data-view="${view}"]`);
  if (activeLink) activeLink.classList.add('active');

  // очищаем основную область и рисуем новую страницу
  const main = document.getElementById('main-content');
  main.innerHTML = '';
  main.className = 'animate-fade';

  switch(view) {
    case 'home': renderHome(main); break;
    case 'catalog': renderCatalog(main); break;
    case 'game': renderGamePage(main); break;
    case 'genres': renderGenres(main); break;
    case 'platforms': renderPlatforms(main); break;
    case 'tops': renderTops(main); break;
    case 'releases': renderReleases(main); break;
    case 'profile': renderProfile(main); break;
  }
  // после смены страницы прокручиваем наверх
  window.scrollTo({ top: 0, behavior: 'smooth' });
}
