// ============ КАТАЛОГ ============
function renderCatalog(container) {
  let filtered = GAMES.filter(g => {
    if (state.searchQuery && !g.title.toLowerCase().includes(state.searchQuery.toLowerCase())) return false;
    if (state.filters.genre) {
      const genreMap = { 'action': 'Экшен', 'rpg': 'RPG', 'adventure': 'Приключения', 'shooter': 'Шутер', 'strategy': 'Стратегия', 'puzzle': 'Головоломка', 'racing': 'Гонки', 'sport': 'Спорт' };
      if (!g.genres.includes(genreMap[state.filters.genre])) return false;
    }
    if (state.filters.platform) {
      const platformMap = { 'pc': 'PC', 'ps5': 'PS5', 'xbox': 'Xbox', 'switch': 'Switch', 'mobile': 'Mobile' };
      if (!g.platforms.includes(platformMap[state.filters.platform])) return false;
    }
    if (state.filters.minRating && g.rating < state.filters.minRating) return false;
    return true;
  });
  
  if (state.sortBy === 'rating') filtered.sort((a, b) => b.rating - a.rating);
  else if (state.sortBy === 'year') filtered.sort((a, b) => b.year - a.year);

  container.innerHTML = `
    <section class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div class="mb-8">
        <h1 class="font-display font-bold text-3xl md:text-4xl text-white mb-2">Каталог игр</h1>
        <p class="text-zinc-500">Найдено: <b class="text-zinc-300">${filtered.length}</b> игр</p>
      </div>

      <div class="glass-panel rounded-2xl p-6 mb-8">
        <div class="mb-6">
          <div class="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-3">Фильтры</div>
          <div class="flex flex-wrap gap-2 mb-4">
            <button class="chip ${!state.filters.genre ? 'bg-violet-600 text-white border-violet-600' : 'bg-zinc-900 text-zinc-400 border-zinc-800 hover:border-zinc-600'} px-4 py-2 rounded-full text-sm font-medium transition border" onclick="setFilter('genre', null)">Все жанры</button>
            ${GENRES.map(g => `<button class="chip ${state.filters.genre === g.id ? 'bg-violet-600 text-white border-violet-600' : 'bg-zinc-900 text-zinc-400 border-zinc-800 hover:border-zinc-600'} px-4 py-2 rounded-full text-sm font-medium transition border" onclick="setFilter('genre', '${g.id}')">${g.name}</button>`).join('')}
          </div>
          <div class="flex flex-wrap gap-2">
            <button class="chip ${!state.filters.platform ? 'bg-violet-600 text-white border-violet-600' : 'bg-zinc-900 text-zinc-400 border-zinc-800 hover:border-zinc-600'} px-4 py-2 rounded-full text-sm font-medium transition border" onclick="setFilter('platform', null)">Все платформы</button>
            ${PLATFORMS.map(p => `<button class="chip ${state.filters.platform === p.id ? 'bg-violet-600 text-white border-violet-600' : 'bg-zinc-900 text-zinc-400 border-zinc-800 hover:border-zinc-600'} px-4 py-2 rounded-full text-sm font-medium transition border" onclick="setFilter('platform', '${p.id}')">${p.name}</button>`).join('')}
          </div>
        </div>
        <div class="flex items-center justify-between flex-wrap gap-4">
          <div class="flex items-center gap-3">
            <span class="text-xs font-bold text-zinc-500 uppercase tracking-wider">Сортировка:</span>
            ${[['rating', 'По рейтингу'], ['year', 'По году']].map(([k, v]) => 
              `<button class="${state.sortBy === k ? 'text-violet-400 font-semibold' : 'text-zinc-400 hover:text-zinc-200'} text-sm transition" onclick="setSort('${k}')">${v}</button>`
            ).join('')}
          </div>
          <button class="text-zinc-500 hover:text-white text-sm flex items-center gap-2 transition" onclick="clearFilters()"><i class="fa-solid fa-rotate-right"></i> Сбросить</button>
        </div>
      </div>

      ${filtered.length > 0 ? `
        <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          ${filtered.slice(0, state.limit).map(g => gameCard(g)).join('')}
        </div>
        ${filtered.length > state.limit ? `<div class="text-center mt-8"><button onclick="showMore()" class="px-8 py-3 bg-violet-600 hover:bg-violet-500 text-white font-semibold rounded-xl transition">Показать ещё (${filtered.length - state.limit})</button></div>` : ''}
      ` : '<div class="text-center py-20 text-zinc-600"><i class="fa-solid fa-magnifying-glass text-4xl mb-4"></i><p>Ничего не найдено</p></div>'}
    </section>
  `;
}

function showMore() {
  const y = window.scrollY;
  state.limit += 60;
  showView('catalog');
  window.scrollTo(0, y);
}

function setFilter(key, value) {
  state.limit = 60;
  state.filters[key] = value;
  showView('catalog');
}

function setSort(value) {
  state.limit = 60;
  state.sortBy = value;
  showView('catalog');
}

function clearFilters() {
  state.limit = 60;
  state.filters = { genre: null, platform: null, year: null, minRating: 0 };
  showView('catalog');
}

function handleSearch(value) {
  state.limit = 60;
  state.searchQuery = value;
  if (value.length > 0 && state.currentView !== 'catalog') {
    showView('catalog');
  } else if (state.currentView === 'catalog') {
    showView('catalog');
  }
}
