// Каталог
// Таблица популярных сокращений, аббревиатур и русских названий игр
const SEARCH_ACRONYMS = {
  'gta': 'grand theft auto',
  'гта': 'grand theft auto',
  'cs': 'counter-strike',
  'кс': 'counter-strike',
  'csgo': 'counter-strike',
  'cs:go': 'counter-strike',
  'cs2': 'counter-strike',
  'rdr': 'red dead redemption',
  'рдр': 'red dead redemption',
  'tes': 'the elder scrolls',
  'тэс': 'the elder scrolls',
  're': 'resident evil',
  'ре': 'resident evil',
  'cod': 'call of duty',
  'код': 'call of duty',
  'nfs': 'need for speed',
  'нфс': 'need for speed',
  'dmc': 'devil may cry',
  'дмк': 'devil may cry',
  'ac': 'assassin',
  'ас': 'assassin',
  'mk': 'mortal kombat',
  'мк': 'mortal kombat',
  'tlou': 'the last of us',
  'тлоу': 'the last of us',
  'hl': 'half-life',
  'хл': 'half-life',
  'gow': 'god of war',
  'гов': 'god of war',
  'bg': "baldur's gate",
  'бг': "baldur's gate",
  'ds': 'dark souls',
  'дс': 'dark souls',
  'tf2': 'team fortress 2',
  'тф2': 'team fortress 2',
  'me': 'mass effect',
  'ме': 'mass effect',
  'cp2077': 'cyberpunk 2077',
  'bf': 'battlefield',
  'бф': 'battlefield',
  'ff': 'final fantasy',
  'фф': 'final fantasy',
  'mgs': 'metal gear solid',
  'мгс': 'metal gear solid',
  'kotor': 'knights of the old republic',
  'котор': 'knights of the old republic',
  'homm': 'heroes of might and magic',
  'l4d': 'left 4 dead',
  'wow': 'world of warcraft',
  'вов': 'world of warcraft',
  'дота': 'dota',
  'ведьмак': 'witcher',
  'скайрим': 'skyrim',
  'сталкер': 's.t.a.l.k.e.r',
  'майнкрафт': 'minecraft',
  'киберпанк': 'cyberpunk',
  'одни из нас': 'the last of us',
  'пабг': 'pubg'
};

const NUMERAL_PAIRS = [
  ['10', 'x'], ['9', 'ix'], ['8', 'viii'], ['7', 'vii'],
  ['6', 'vi'], ['5', 'v'], ['4', 'iv'], ['3', 'iii'],
  ['2', 'ii'], ['1', 'i']
];

// Получение вариантов запроса (с конвертацией арабских/римских цифр: 5 <-> v, 4 <-> iv, 3 <-> iii)
function getQueryNumberVariants(text) {
  if (!text) return [];
  const words = text.split(/\s+/).filter(Boolean);
  const variants = [text];
  
  let changed = false;
  const convertedWords = words.map(w => {
    for (const [arabic, roman] of NUMERAL_PAIRS) {
      if (w === arabic) { changed = true; return roman; }
      if (w === roman) { changed = true; return arabic; }
    }
    return w;
  });
  
  if (changed) {
    variants.push(convertedWords.join(' '));
  }
  return variants;
}

// Проверка: подходит ли игра под поисковый запрос (по названию, сокращениям, описанию и разработчику)
function matchGameSearch(game, query) {
  if (!query) return true;
  const rawQ = String(query).trim().toLowerCase();
  if (!rawQ) return true;

  const title = String(game.title || '').toLowerCase();
  const variants = getQueryNumberVariants(rawQ);

  // 1. Прямой поиск по названию с учётом вариантов цифр
  for (const v of variants) {
    if (v && title.includes(v)) return true;
  }

  // 2. Поиск по словарю сокращений и аббревиатур (например GTA -> Grand Theft Auto, GTA 5 -> Grand Theft Auto V)
  for (const v of variants) {
    for (const [abbr, full] of Object.entries(SEARCH_ACRONYMS)) {
      if (!title.includes(full)) continue;
      if (v === abbr) return true;
      if (v.startsWith(abbr + ' ') || (abbr.length >= 2 && v.startsWith(abbr))) {
        const rest = v.slice(abbr.length).trim();
        if (!rest) return true;
        const restVariants = getQueryNumberVariants(rest);
        if (restVariants.some(rv => rv && title.includes(rv))) return true;
      }
    }
  }

  // 3. Поиск по описанию (в том числе скобки "(сокр. GTA)" или текст)
  const desc = (typeof DESCRIPTIONS !== 'undefined' && DESCRIPTIONS[game.id]) ? DESCRIPTIONS[game.id].d : (game.description || '');
  if (desc) {
    const descLower = desc.toLowerCase();
    for (const v of variants) {
      if (!v) continue;
      if (v.length <= 4) {
        // Короткие аббревиатуры ищем целым словом, чтобы избежать ложных срабатываний
        const escaped = v.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const wordRegex = new RegExp('(?:^|[\\s(\\[«"\'—–-])' + escaped + '(?:$|[\\s)\\]»"\'.,!?:—–-])', 'i');
        if (wordRegex.test(descLower)) return true;
      } else {
        if (descLower.includes(v)) return true;
      }
    }
  }

  // 4. Поиск по разработчику
  const dev = (typeof DESCRIPTIONS !== 'undefined' && DESCRIPTIONS[game.id]) ? DESCRIPTIONS[game.id].dev : '';
  if (dev && dev.toLowerCase().includes(rawQ)) return true;

  return false;
}
window.matchGameSearch = matchGameSearch;

// Рисует каталог: фильтруем игры по поиску, жанру, платформе и рейтингу, сортируем и показываем первые state.limit штук
function renderCatalog(container) {
  // оставляем только игры, которые подходят под все условия (включая фильтрацию 18+)
  let filtered = GAMES.filter(g => {
    if (typeof isGameVisible === 'function' && !isGameVisible(g)) return false;
    if (state.searchQuery && !matchGameSearch(g, state.searchQuery)) return false;
    if (state.filters.genre) {
      const genreMap = { 'action': 'Экшен', 'rpg': 'RPG', 'adventure': 'Приключения', 'shooter': 'Шутер', 'strategy': 'Стратегия', 'puzzle': 'Головоломка', 'racing': 'Гонки', 'sport': 'Спорт' };
      if (!g.genres.includes(genreMap[state.filters.genre])) return false;
    }
    if (state.filters.platform) {
      const platformMap = { 'pc': 'PC', 'ps5': 'PS5', 'ps4': 'PS4', 'xbox': 'Xbox', 'switch': 'Switch', 'mobile': 'Mobile' };
      if (!g.platforms.includes(platformMap[state.filters.platform])) return false;
    }
    if (state.filters.minRating && g.rating < state.filters.minRating) return false;
    return true;
  });
  
  // сортировка: если есть поисковый запрос, поднимаем наиболее точные совпадения и игры с высоким рейтингом
  if (state.searchQuery) {
    const q = state.searchQuery.trim().toLowerCase();
    const qVariants = getQueryNumberVariants(q);
    filtered.sort((a, b) => {
      const aTitle = a.title.toLowerCase();
      const bTitle = b.title.toLowerCase();
      
      const aExact = qVariants.some(v => aTitle === v);
      const bExact = qVariants.some(v => bTitle === v);
      if (aExact && !bExact) return -1;
      if (!aExact && bExact) return 1;

      const aStarts = qVariants.some(v => aTitle.startsWith(v));
      const bStarts = qVariants.some(v => bTitle.startsWith(v));
      if (aStarts && !bStarts) return -1;
      if (!aStarts && bStarts) return 1;

      return (b.rating || 0) - (a.rating || 0);
    });
  } else if (state.sortBy === 'rating') {
    filtered.sort((a, b) => b.rating - a.rating);
  } else if (state.sortBy === 'year') {
    filtered.sort((a, b) => b.year - a.year);
  }

  // Обновляем видимость кнопок очистки в строке поиска
  updateSearchClearButtons();

  container.innerHTML = `
    <section class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div class="mb-8">
        <h1 class="font-display font-bold text-3xl md:text-4xl text-white mb-2">Каталог игр</h1>
        <div class="flex items-center gap-3 flex-wrap text-zinc-500">
          <p>Найдено: <b class="text-zinc-300">${filtered.length}</b> игр</p>
          ${state.searchQuery ? `
            <span class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-violet-600/20 text-violet-300 border border-violet-500/30 text-xs font-semibold animate-fade">
              <i class="fa-solid fa-magnifying-glass text-[10px]"></i> «${escapeHtml(state.searchQuery)}»
              <button onclick="clearSearchInput('global-search')" class="ml-1 text-zinc-400 hover:text-white transition" title="Сбросить поиск"><i class="fa-solid fa-xmark"></i></button>
            </span>
          ` : ''}
        </div>
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
          <div class="flex items-center gap-3">
            ${(state.settings && state.settings.show18Plus) ? `
              <span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-rose-500/10 text-rose-400 border border-rose-500/20 text-xs font-semibold" title="В настройках профиля включен показ контента 18+">
                <span class="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse"></span> 18+ включено
              </span>
            ` : ''}
            <button class="text-zinc-500 hover:text-white text-sm flex items-center gap-2 transition" onclick="clearFilters()"><i class="fa-solid fa-rotate-right"></i> Сбросить</button>
          </div>
        </div>
      </div>

      ${filtered.length > 0 ? `
        <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          ${filtered.slice(0, state.limit).map(g => gameCard(g)).join('')}
        </div>
        ${filtered.length > state.limit ? `<div class="text-center mt-8"><button onclick="showMore()" class="px-8 py-3 bg-violet-600 hover:bg-violet-500 text-white font-semibold rounded-xl transition">Показать ещё (${filtered.length - state.limit})</button></div>` : ''}
      ` : `
        <div class="text-center py-20 text-zinc-500">
          <i class="fa-solid fa-magnifying-glass text-4xl mb-4 text-zinc-600"></i>
          <p class="text-lg text-white font-medium mb-1">Ничего не найдено</p>
          <p class="text-sm text-zinc-400 mb-5">Попробуйте изменить запрос или сбросить фильтры</p>
          ${state.searchQuery ? `<button onclick="clearSearchInput('global-search')" class="px-5 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-semibold transition border border-zinc-700">Очистить поиск</button>` : ''}
        </div>
      `}
    </section>
  `;
}

// Кнопка «Показать ещё»: увеличиваем лимит карточек и перерисовываем каталог, сохраняя прокрутку
function showMore() {
  const y = window.scrollY;
  state.limit += 60;
  showView('catalog');
  window.scrollTo(0, y);
}

// Меняет фильтр (жанр или платформа) и обновляет каталог
function setFilter(key, value) {
  state.limit = 60;
  state.filters[key] = value;
  showView('catalog');
}

// Меняет сортировку каталога
function setSort(value) {
  state.limit = 60;
  state.sortBy = value;
  showView('catalog');
}

// Сбрасывает все фильтры
function clearFilters() {
  state.limit = 60;
  state.filters = { genre: null, platform: null, year: null, minRating: 0 };
  clearSearchQuery();
  showView('catalog');
}

// Обработка нажатия клавиш в поле поиска (Enter)
function handleSearchKey(event, input) {
  if (event.key === 'Enter') {
    event.preventDefault();
    triggerSearch(input.value);
  }
}
window.handleSearchKey = handleSearchKey;

// Выполнение поиска: переключает на каталог с любой вкладки и применяет запрос
function triggerSearch(value) {
  const query = (value || '').trim();
  state.limit = 60;
  state.searchQuery = query;

  // Синхронизируем оба поля ввода
  const gSearch = document.getElementById('global-search');
  if (gSearch && gSearch.value !== query) gSearch.value = query;
  const mSearch = document.getElementById('mobile-search');
  if (mSearch && mSearch.value !== query) mSearch.value = query;

  updateSearchClearButtons();

  if (state.currentView !== 'catalog') {
    showView('catalog');
  } else {
    const main = document.getElementById('main-content');
    if (main) renderCatalog(main);
  }
  window.scrollTo({ top: 0, behavior: 'smooth' });
}
window.triggerSearch = triggerSearch;

// Поиск при вводе текста в строку поиска
function handleSearch(value) {
  state.limit = 60;
  state.searchQuery = (value || '').trim();

  // Синхронизируем второе поле ввода
  const isGlobal = event && event.target && event.target.id === 'global-search';
  const otherId = isGlobal ? 'mobile-search' : 'global-search';
  const other = document.getElementById(otherId);
  if (other && other.value !== value) other.value = value;

  updateSearchClearButtons();

  if (value.length > 0 && state.currentView !== 'catalog') {
    showView('catalog');
  } else if (state.currentView === 'catalog') {
    const main = document.getElementById('main-content');
    if (main) renderCatalog(main);
  }
}
window.handleSearch = handleSearch;

// Очистка поля поиска по кнопке (×)
function clearSearchInput(inputId) {
  const input = document.getElementById(inputId);
  if (input) input.value = '';
  
  const otherId = inputId === 'global-search' ? 'mobile-search' : 'global-search';
  const other = document.getElementById(otherId);
  if (other) other.value = '';

  state.searchQuery = '';
  updateSearchClearButtons();

  if (state.currentView === 'catalog') {
    const main = document.getElementById('main-content');
    if (main) renderCatalog(main);
  }

  if (input) input.focus();
}
window.clearSearchInput = clearSearchInput;

// Обновление видимости кнопок очистки (×)
function updateSearchClearButtons() {
  const gSearch = document.getElementById('global-search');
  const gBtn = document.getElementById('global-search-clear');
  if (gBtn) {
    gBtn.classList.toggle('hidden-view', !gSearch || !gSearch.value);
  }

  const mSearch = document.getElementById('mobile-search');
  const mBtn = document.getElementById('mobile-search-clear');
  if (mBtn) {
    mBtn.classList.toggle('hidden-view', !mSearch || !mSearch.value);
  }
}
window.updateSearchClearButtons = updateSearchClearButtons;

// Переход в каталог из главного меню с очисткой старого поиска
function navigateToCatalog() {
  clearSearchQuery();
  showView('catalog');
}
window.navigateToCatalog = navigateToCatalog;

// Сброс поисковой строки
function clearSearchQuery() {
  state.searchQuery = '';
  const gSearch = document.getElementById('global-search');
  if (gSearch) gSearch.value = '';
  const mSearch = document.getElementById('mobile-search');
  if (mSearch) mSearch.value = '';
  updateSearchClearButtons();
}
window.clearSearchQuery = clearSearchQuery;
