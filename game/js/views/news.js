// Представление: Лента новостей игровой индустрии (GameVerse News)

let currentNewsCategory = 'all';
let currentNewsSearch = '';

function getFilteredNews() {
  return NEWS_DATA.filter(item => {
    const matchCat = currentNewsCategory === 'all' || item.category === currentNewsCategory;
    const q = currentNewsSearch.trim().toLowerCase();
    const matchSearch = !q || item.title.toLowerCase().includes(q) || item.summary.toLowerCase().includes(q);
    return matchCat && matchSearch;
  });
}

function renderNews(container, params = {}) {
  const articleId = params.articleId || (typeof state !== 'undefined' ? state.newsArticleId : null);
  
  if (articleId) {
    const item = NEWS_DATA.find(n => n.id === articleId);
    if (item) {
      renderArticlePage(item, container);
      return;
    }
  }

  // Если статья не указана или не найдена — отображаем общую ленту новостей
  renderNewsFeed(container);
}

// ----------------------------------------------------
// Страница отдельной статьи (полноценный адаптивный вид)
// ----------------------------------------------------
function renderArticlePage(item, container) {
  const linkedGame = typeof GAMES !== 'undefined' ? GAMES.find(g => g.id === item.gameId) : null;
  const isLiked = hasLikedNews(item.id);
  const totalLikes = item.likes + (isLiked ? 1 : 0);

  // Увеличиваем счетчик просмотров
  item.views = (item.views || 0) + 1;

  // Рекомендованные другие статьи (Читайте также)
  const otherNews = NEWS_DATA.filter(n => n.id !== item.id).slice(0, 3);

  container.innerHTML = `
    <article class="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fade">
      
      <!-- Верхняя навигация и хлебные крошки -->
      <div class="flex flex-wrap items-center justify-between gap-4 mb-6 text-xs text-zinc-400">
        <div class="flex items-center gap-2">
          <button 
            onclick="showView('news')" 
            class="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-zinc-900/80 hover:bg-zinc-800 text-zinc-300 hover:text-white border border-zinc-800 transition font-semibold group"
          >
            <i class="fa-solid fa-arrow-left text-[11px] group-hover:-translate-x-0.5 transition"></i>
            <span>Все новости</span>
          </button>
          <span class="text-zinc-600 hidden sm:inline">/</span>
          <span class="hidden sm:inline text-zinc-400">${item.categoryLabel}</span>
        </div>

        <div class="flex items-center gap-2">
          <button 
            onclick="shareNews('${item.id}', '${escapeHtml(item.title)}')"
            class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-zinc-900/80 hover:bg-zinc-800 text-zinc-300 hover:text-white border border-zinc-800 transition"
          >
            <i class="fa-solid fa-share-nodes text-[11px]"></i>
            <span>Поделиться</span>
          </button>
        </div>
      </div>

      <!-- Заголовочная секция -->
      <header class="mb-8">
        <div class="flex flex-wrap items-center gap-3 mb-4">
          <span class="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${item.categoryBadgeBg} border">
            ${item.categoryLabel}
          </span>
          <span class="text-xs text-zinc-400 flex items-center gap-1.5">
            <i class="fa-regular fa-clock"></i> ${item.readTime} чтения
          </span>
          <span class="text-zinc-600">•</span>
          <span class="text-xs text-zinc-400">${item.date}</span>
          <span class="text-zinc-600">•</span>
          <span class="text-xs font-medium text-violet-400">${item.source}</span>
        </div>

        <h1 class="font-display font-black text-2xl sm:text-4xl lg:text-5xl text-white tracking-tight leading-tight mb-4">
          ${item.title}
        </h1>

        <p class="text-zinc-300 text-base sm:text-lg leading-relaxed max-w-3xl font-medium">
          ${item.summary}
        </p>

        <!-- Панель реакций под заголовком -->
        <div class="flex items-center gap-6 mt-6 pt-6 border-t border-zinc-800/80 text-xs sm:text-sm text-zinc-400">
          <span class="flex items-center gap-1.5"><i class="fa-regular fa-eye"></i> ${item.views.toLocaleString('ru-RU')} просмотров</span>
        </div>
      </header>

      <!-- Главная широкоформатная обложка статьи -->
      <div class="relative w-full aspect-video sm:aspect-[21/9] rounded-3xl overflow-hidden bg-zinc-950 border border-zinc-800 mb-10 shadow-2xl">
        <img 
          src="${typeof optImg === 'function' ? optImg(item.cover, 1200) : item.cover}" 
          alt="${escapeHtml(item.title)}" 
          class="w-full h-full object-cover"
          loading="lazy"
          referrerpolicy="no-referrer"
          onerror="if (typeof handleImgError === 'function') handleImgError(this, '${escapeHtml(item.cover)}');"
        >
        <div class="absolute inset-0 bg-gradient-to-t from-zinc-950/40 via-transparent to-transparent pointer-events-none"></div>
      </div>

      <!-- Основное текстовое содержимое статьи -->
      <div class="max-w-3xl mx-auto text-zinc-300 text-base sm:text-lg leading-relaxed space-y-6">
        ${item.content}
      </div>

      <!-- Виджет связанной игры из каталога -->
      ${linkedGame ? `
        <div class="max-w-3xl mx-auto mt-12 pt-8 border-t border-zinc-800/80">
          <div class="text-xs uppercase font-bold text-zinc-400 mb-3 tracking-wider flex items-center gap-2">
            <span class="w-5 h-5 aspect-square flex-shrink-0 inline-flex items-center justify-center rounded-[5px] overflow-hidden shadow-sm">
              <svg viewBox="0 0 100 100" class="w-full h-full block" xmlns="http://www.w3.org/2000/svg">
                <rect width="100" height="100" rx="28" fill="#2563eb"/>
                <text x="50%" y="54%" dominant-baseline="middle" text-anchor="middle" font-family="'Orbitron', sans-serif" font-weight="900" font-size="44" fill="#ffffff">GV</text>
              </svg>
            </span> Игра из каталога GameVault:
          </div>
          <div class="p-5 rounded-2xl bg-zinc-900/60 border border-zinc-800 hover:border-violet-500/40 transition flex flex-col sm:flex-row sm:items-center justify-between gap-5">
            <div class="flex items-center gap-4">
              <img 
                src="${typeof optImg === 'function' ? optImg(linkedGame.cover, 120) : linkedGame.cover}" 
                alt="${escapeHtml(linkedGame.title)}" 
                class="w-16 h-20 object-cover rounded-xl shadow-lg flex-shrink-0 cursor-pointer"
                loading="lazy"
                referrerpolicy="no-referrer"
                onerror="if (typeof handleImgError === 'function') handleImgError(this, '${escapeHtml(linkedGame.cover)}');"
                onclick="showView('game', { gameId: ${linkedGame.id} })"
              >
              <div>
                <h3 
                  class="font-display font-bold text-white text-lg hover:text-violet-400 cursor-pointer transition leading-snug"
                  onclick="showView('game', { gameId: ${linkedGame.id} })"
                >
                  ${escapeHtml(linkedGame.title)}
                </h3>
                <div class="text-xs text-zinc-400 mt-1 flex flex-wrap items-center gap-3">
                  <span class="text-amber-400 font-bold flex items-center gap-1">
                    <i class="fa-solid fa-star text-[10px]"></i> ${linkedGame.rating} / 10
                  </span>
                  <span>•</span>
                  <span>${linkedGame.year || ''}</span>
                  <span>•</span>
                  <span>${(linkedGame.genres || []).slice(0, 2).join(', ')}</span>
                </div>
              </div>
            </div>

            <div class="flex items-center gap-2.5 flex-shrink-0">
              <button 
                onclick="showView('game', { gameId: ${linkedGame.id} })"
                class="px-4 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-md shadow-violet-600/25"
              >
                <i class="fa-solid fa-circle-info"></i> Страница игры
              </button>
              <button 
                onclick="toggleList(${linkedGame.id}, 'want')"
                class="px-3.5 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white text-xs font-semibold transition border border-zinc-700"
                title="В список желаемого"
              >
                <i class="fa-regular fa-bookmark"></i>
              </button>
            </div>
          </div>
        </div>
      ` : ''}

      <!-- Нижняя панель действий -->
      <div class="max-w-3xl mx-auto mt-10 pt-6 border-t border-zinc-800/80 flex flex-wrap items-center justify-between gap-4">
        <button 
          onclick="showView('news')" 
          class="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-200 hover:text-white border border-zinc-800 font-semibold text-sm transition"
        >
          <i class="fa-solid fa-arrow-left text-xs"></i>
          <span>Вернуться ко всем новостям</span>
        </button>

        <div class="flex items-center gap-3">
          <button 
            data-news-like="${item.id}"
            onclick="toggleLikeNews('${item.id}')" 
            class="news-like-btn news-like-btn-${item.id} flex items-center gap-2 px-4 py-2.5 rounded-xl bg-zinc-900 border transition cursor-pointer ${isLiked ? 'text-rose-500 border-rose-500/40 bg-rose-500/10' : 'text-zinc-400 border-zinc-800 hover:text-rose-400'}"
          >
            <i class="${isLiked ? 'fa-solid text-rose-500 animate-scale-up' : 'fa-regular'} fa-heart"></i>
            <span>Понравилось</span>
            <span class="news-like-count-${item.id} font-semibold ml-1 px-1.5 py-0.5 rounded-md bg-zinc-800 text-xs">${totalLikes.toLocaleString('ru-RU')}</span>
          </button>
          <button 
            onclick="shareNews('${item.id}', '${escapeHtml(item.title)}')"
            class="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white border border-zinc-800 text-sm transition"
          >
            <i class="fa-solid fa-share-nodes text-xs"></i>
            <span>Поделиться</span>
          </button>
        </div>
      </div>

      <!-- Читайте также (3 другие новости) -->
      ${otherNews.length > 0 ? `
        <div class="mt-16 pt-10 border-t border-zinc-800/80">
          <h2 class="text-xl font-bold text-white mb-6 flex items-center gap-2">
            <span>Читайте также</span>
          </h2>
          <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
            ${otherNews.map(n => renderNewsCard(n)).join('')}
          </div>
        </div>
      ` : ''}

    </article>
  `;
}

// ----------------------------------------------------
// Лента новостей со всеми карточками и поиском
// ----------------------------------------------------
function renderNewsFeed(container) {
  const categories = [
    { id: 'all', label: 'Все новости', icon: 'fa-layer-group', count: NEWS_DATA.length },
    { id: 'announcements', label: 'Анонсы', icon: 'fa-bullhorn', count: NEWS_DATA.filter(n => n.category === 'announcements').length },
    { id: 'releases', label: 'Релизы', icon: 'fa-rocket', count: NEWS_DATA.filter(n => n.category === 'releases').length },
    { id: 'updates', label: 'Обновления', icon: 'fa-wrench', count: NEWS_DATA.filter(n => n.category === 'updates').length },
    { id: 'industry', label: 'Индустрия', icon: 'fa-chart-line', count: NEWS_DATA.filter(n => n.category === 'industry').length }
  ];

  container.innerHTML = `
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      
      <!-- Заголовок страницы -->
      <div class="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
        <div>
          <div class="flex items-center gap-2 mb-2">
            <span class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-violet-500/20 text-violet-400 border border-violet-500/30">
              <span class="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
              Live Feed
            </span>
            <span class="text-xs text-zinc-400">Обновлено сегодня</span>
          </div>
          <h1 class="font-display font-black text-3xl sm:text-4xl lg:text-5xl text-white tracking-tight flex items-center gap-3">
            <span>Новости индустрии</span>
            <span class="text-2xl text-blue-500 font-light">/</span>
            <span class="text-zinc-500 text-xl sm:text-2xl font-normal">GameVault Hub</span>
          </h1>
          <p class="text-zinc-400 text-sm sm:text-base mt-2 max-w-2xl">
            Главные анонсы, даты премьер, геймплейные демонстрации и события из мира видеоигр с прямой привязкой к каталогу.
          </p>
        </div>

        <!-- Поиск по новостям -->
        <div class="relative w-full md:w-72">
          <i class="fa-solid fa-magnifying-glass absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500 text-sm"></i>
          <input 
            type="text" 
            id="news-search-input" 
            value="${escapeHtml(currentNewsSearch)}"
            placeholder="Поиск по новостям..." 
            class="w-full bg-zinc-900/60 border border-zinc-800 text-zinc-200 text-sm rounded-xl py-2.5 pl-10 pr-9 focus:outline-none focus:border-violet-500/50 focus:ring-1 focus:ring-violet-500/50 transition placeholder-zinc-500"
            oninput="handleNewsSearch(this.value)"
          >
          ${currentNewsSearch ? `
            <button onclick="clearNewsSearch()" class="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300">
              <i class="fa-solid fa-circle-xmark"></i>
            </button>
          ` : ''}
        </div>
      </div>

      <!-- Вкладки категорий -->
      <div class="flex items-center gap-2 overflow-x-auto pb-4 mb-8 scrollbar-none">
        ${categories.map(cat => {
          const isActive = currentNewsCategory === cat.id;
          return `
            <button 
              onclick="setNewsCategory('${cat.id}')" 
              class="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition whitespace-nowrap ${
                isActive 
                  ? 'bg-violet-600 text-white shadow-lg shadow-violet-600/25' 
                  : 'bg-zinc-900/60 text-zinc-400 hover:text-white hover:bg-zinc-800 border border-zinc-800'
              }"
            >
              <i class="fa-solid ${cat.icon} text-xs"></i>
              <span>${cat.label}</span>
              <span class="px-1.5 py-0.5 rounded-md text-[10px] font-bold ${
                isActive ? 'bg-white/20 text-white' : 'bg-zinc-800 text-zinc-500'
              }">${cat.count}</span>
            </button>
          `;
        }).join('')}
      </div>

      <!-- Контейнер фида новостей (обновляется без уничтожения поля поиска) -->
      <div id="news-feed-content">
        ${renderNewsFeedContent()}
      </div>

    </div>
  `;
}

function renderNewsFeedContent() {
  const filtered = getFilteredNews();
  const featuredItem = filtered.find(n => n.featured) || filtered[0] || NEWS_DATA[0];

  return `
    <!-- Главная новость (Featured Hero) -->
    ${featuredItem ? renderFeaturedNews(featuredItem) : ''}

    <!-- Сетка новостей -->
    <div class="mt-12">
      <div class="flex items-center justify-between mb-6">
        <h2 class="text-xl font-bold text-white flex items-center gap-2">
          <span>Все публикации</span>
          <span class="text-zinc-500 text-sm font-normal">(${filtered.length})</span>
        </h2>
        ${currentNewsSearch ? `
          <div class="text-sm text-zinc-400">
            Результаты поиска: <strong class="text-violet-400">«${escapeHtml(currentNewsSearch)}»</strong>
          </div>
        ` : ''}
      </div>

      ${filtered.length === 0 ? `
        <div class="text-center py-16 bg-zinc-900/30 border border-zinc-800/80 rounded-2xl">
          <i class="fa-solid fa-newspaper text-5xl text-zinc-600 mb-4"></i>
          <h3 class="text-lg font-bold text-white mb-2">Новостей не найдено</h3>
          <p class="text-sm text-zinc-400 mb-4">Попробуйте изменить поисковый запрос или выбрать другую категорию</p>
          <button onclick="clearNewsSearch(); setNewsCategory('all')" class="px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-sm font-medium transition">
            Сбросить фильтры
          </button>
        </div>
      ` : `
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          ${filtered.map(item => renderNewsCard(item)).join('')}
        </div>
      `}
    </div>
  `;
}

// Рендер главной (Hero) новости в ленте
function renderFeaturedNews(item) {
  const linkedGame = typeof GAMES !== 'undefined' ? GAMES.find(g => g.id === item.gameId) : null;
  const isLiked = hasLikedNews(item.id);
  const totalLikes = item.likes + (isLiked ? 1 : 0);

  return `
    <div class="relative rounded-3xl overflow-hidden border border-zinc-800 bg-gradient-to-br from-zinc-900 via-zinc-900/80 to-zinc-950 shadow-2xl group">
      <div class="grid grid-cols-1 lg:grid-cols-12 gap-0">
        
        <!-- Картинка обложки -->
        <div class="lg:col-span-7 relative min-h-[300px] sm:min-h-[380px] lg:min-h-[460px] h-full overflow-hidden bg-zinc-950 flex items-center justify-center">
          <img 
            src="${typeof optImg === 'function' ? optImg(item.cover, 900) : item.cover}" 
            alt="${escapeHtml(item.title)}" 
            class="w-full h-full object-cover object-center group-hover:scale-105 transition duration-700 cursor-pointer"
            loading="lazy"
            referrerpolicy="no-referrer"
            onclick="openNewsArticle('${item.id}')"
            onerror="if (typeof handleImgError === 'function') handleImgError(this, '${escapeHtml(item.cover)}');"
          >
          <div class="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/20 to-transparent lg:hidden pointer-events-none"></div>
          <div class="absolute inset-0 bg-gradient-to-r from-transparent via-transparent to-zinc-950 hidden lg:block pointer-events-none"></div>
          
          <div class="absolute top-4 left-4 flex items-center gap-2">
            <span class="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${item.categoryBadgeBg} backdrop-blur-md">
              ${item.categoryLabel}
            </span>
            <span class="px-2.5 py-1 rounded-full text-[11px] font-semibold bg-zinc-900/80 text-zinc-300 border border-white/10 backdrop-blur-md">
              <i class="fa-solid fa-fire text-amber-400 mr-1"></i> Топ новость
            </span>
          </div>
        </div>

        <!-- Контент -->
        <div class="lg:col-span-5 p-6 sm:p-8 lg:p-10 flex flex-col justify-between">
          <div>
            <div class="flex items-center gap-3 text-xs text-zinc-400 mb-3">
              <span class="flex items-center gap-1.5"><i class="fa-regular fa-clock"></i> ${item.readTime}</span>
              <span>•</span>
              <span>${item.date}</span>
              <span>•</span>
              <span class="text-zinc-500 font-medium">${item.source}</span>
            </div>

            <h2 
              onclick="openNewsArticle('${item.id}')"
              class="font-display font-bold text-2xl sm:text-3xl text-white hover:text-violet-400 transition cursor-pointer mb-4 leading-snug"
            >
              ${item.title}
            </h2>

            <p class="text-zinc-300 text-sm sm:text-base leading-relaxed mb-6 line-clamp-3">
              ${item.summary}
            </p>

            ${linkedGame ? `
              <div class="mb-6 p-3 rounded-2xl bg-zinc-900/60 border border-zinc-800/80 flex items-center justify-between gap-3 hover:border-violet-500/40 transition">
                <div class="flex items-center gap-3 min-w-0">
                  <img src="${typeof optImg === 'function' ? optImg(linkedGame.cover, 120) : linkedGame.cover}" alt="${escapeHtml(linkedGame.title)}" loading="lazy" referrerpolicy="no-referrer" onerror="if (typeof handleImgError === 'function') handleImgError(this, '${escapeHtml(linkedGame.cover)}');" class="w-12 h-14 object-cover rounded-lg flex-shrink-0 shadow">
                  <div class="min-w-0">
                    <div class="text-[11px] uppercase tracking-wider text-zinc-400 font-bold">Связанная игра</div>
                    <div class="text-sm font-bold text-white truncate hover:text-violet-400 cursor-pointer" onclick="showView('game', { gameId: ${linkedGame.id} })">
                      ${escapeHtml(linkedGame.title)}
                    </div>
                    <div class="text-xs text-zinc-400 flex items-center gap-2">
                      <span class="text-amber-400 font-bold"><i class="fa-solid fa-star text-[10px]"></i> ${linkedGame.rating}</span>
                      <span>${linkedGame.year || ''}</span>
                    </div>
                  </div>
                </div>
                <button onclick="showView('game', { gameId: ${linkedGame.id} })" class="px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-violet-600 text-white text-xs font-semibold transition flex-shrink-0">
                  К игре
                </button>
              </div>
            ` : ''}
          </div>

          <div class="flex items-center justify-between pt-4 border-t border-zinc-800/80">
            <div class="flex items-center gap-4 text-xs text-zinc-400">
              <span class="flex items-center gap-1.5"><i class="fa-regular fa-eye"></i> ${item.views.toLocaleString('ru-RU')}</span>
              <button 
                id="news-like-btn-${item.id}"
                onclick="toggleLikeNews('${item.id}')" 
                class="flex items-center gap-1.5 transition ${isLiked ? 'text-rose-500' : 'text-zinc-400 hover:text-rose-400'}"
              >
                <i class="${isLiked ? 'fa-solid text-rose-500 animate-scale-up' : 'fa-regular'} fa-heart"></i>
                <span id="news-like-count-${item.id}">${totalLikes.toLocaleString('ru-RU')}</span>
              </button>
            </div>

            <button 
              onclick="openNewsArticle('${item.id}')"
              class="px-5 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-sm font-bold shadow-lg shadow-violet-600/25 transition flex items-center gap-2 group/btn"
            >
              <span>Читать статью</span>
              <i class="fa-solid fa-arrow-right text-xs group-hover/btn:translate-x-1 transition"></i>
            </button>
          </div>
        </div>

      </div>
    </div>
  `;
}

// Карточка отдельной новости в сетке
function renderNewsCard(item) {
  const linkedGame = typeof GAMES !== 'undefined' ? GAMES.find(g => g.id === item.gameId) : null;
  const isLiked = hasLikedNews(item.id);
  const totalLikes = item.likes + (isLiked ? 1 : 0);

  return `
    <article class="bg-zinc-900/60 border border-zinc-800/80 rounded-2xl overflow-hidden hover:border-violet-500/50 hover:shadow-xl hover:shadow-violet-950/20 transition flex flex-col justify-between group">
      <div>
        <!-- Обложка -->
        <div class="relative h-48 bg-zinc-950 overflow-hidden cursor-pointer" onclick="openNewsArticle('${item.id}')">
          <img 
            src="${typeof optImg === 'function' ? optImg(item.cover, 600) : item.cover}" 
            alt="${escapeHtml(item.title)}" 
            class="w-full h-full object-cover group-hover:scale-105 transition duration-500"
            loading="lazy"
            referrerpolicy="no-referrer"
            onerror="if (typeof handleImgError === 'function') handleImgError(this, '${escapeHtml(item.cover)}');"
          >
          <div class="absolute inset-0 bg-gradient-to-t from-zinc-950/90 via-transparent to-transparent pointer-events-none"></div>
          
          <div class="absolute top-3 left-3">
            <span class="px-2.5 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider ${item.categoryBadgeBg} backdrop-blur-md">
              ${item.categoryLabel}
            </span>
          </div>

          <div class="absolute bottom-3 left-3 right-3 flex items-center justify-between text-[11px] text-zinc-300">
            <span class="bg-zinc-950/70 px-2 py-0.5 rounded backdrop-blur-md"><i class="fa-regular fa-clock mr-1"></i>${item.readTime}</span>
            <span class="bg-zinc-950/70 px-2 py-0.5 rounded backdrop-blur-md">${item.date}</span>
          </div>
        </div>

        <!-- Тело новости -->
        <div class="p-5">
          <div class="text-[11px] text-zinc-400 font-medium mb-1.5 truncate">
            ${item.source}
          </div>

          <h3 
            onclick="openNewsArticle('${item.id}')"
            class="font-display font-bold text-lg text-white hover:text-violet-400 transition cursor-pointer mb-2.5 line-clamp-2 leading-snug"
          >
            ${item.title}
          </h3>

          <p class="text-zinc-400 text-xs sm:text-sm line-clamp-3 leading-relaxed mb-4">
            ${item.summary}
          </p>

          ${linkedGame ? `
            <div class="p-2.5 rounded-xl bg-zinc-950/50 border border-zinc-800/60 flex items-center justify-between gap-2 hover:border-violet-500/30 transition">
              <div class="flex items-center gap-2.5 min-w-0">
                <img src="${typeof optImg === 'function' ? optImg(linkedGame.cover, 80) : linkedGame.cover}" alt="${escapeHtml(linkedGame.title)}" loading="lazy" referrerpolicy="no-referrer" onerror="if (typeof handleImgError === 'function') handleImgError(this, '${escapeHtml(linkedGame.cover)}');" class="w-8 h-10 object-cover rounded flex-shrink-0">
                <div class="min-w-0">
                  <div class="text-[10px] text-zinc-400 uppercase font-semibold">Игра</div>
                  <div class="text-xs font-bold text-zinc-200 truncate hover:text-violet-400 cursor-pointer" onclick="showView('game', { gameId: ${linkedGame.id} })">
                    ${escapeHtml(linkedGame.title)}
                  </div>
                </div>
              </div>
              <span class="text-amber-400 font-bold text-xs flex items-center gap-1 flex-shrink-0">
                <i class="fa-solid fa-star text-[10px]"></i> ${linkedGame.rating}
              </span>
            </div>
          ` : ''}
        </div>
      </div>

      <!-- Футер карточки -->
      <div class="p-5 pt-0 flex items-center justify-between text-xs text-zinc-400 border-t border-zinc-800/40 mt-4">
        <div class="flex items-center gap-3 pt-3">
          <span class="flex items-center gap-1"><i class="fa-regular fa-eye"></i> ${item.views.toLocaleString('ru-RU')}</span>
          <button 
            id="news-like-btn-${item.id}"
            onclick="toggleLikeNews('${item.id}')" 
            class="flex items-center gap-1 transition ${isLiked ? 'text-rose-500' : 'hover:text-rose-400'}"
          >
            <i class="${isLiked ? 'fa-solid text-rose-500 animate-scale-up' : 'fa-regular'} fa-heart"></i>
            <span id="news-like-count-${item.id}">${totalLikes.toLocaleString('ru-RU')}</span>
          </button>
        </div>

        <button 
          onclick="openNewsArticle('${item.id}')"
          class="text-violet-400 hover:text-violet-300 font-semibold text-xs flex items-center gap-1 transition pt-3"
        >
          <span>Читать</span>
          <i class="fa-solid fa-chevron-right text-[10px]"></i>
        </button>
      </div>

    </article>
  `;
}

// Открытие статьи с плавной прокруткой и обновлением маршрута
function openNewsArticle(newsId) {
  if (typeof showView === 'function') {
    showView('news', { articleId: newsId });
  }
}

// Обратная совместимость для модального вызова
function openNewsModal(newsId) {
  openNewsArticle(newsId);
}

function shareNews(id, title) {
  const url = `${window.location.origin}${window.location.pathname}#news?id=${id}`;
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(url).then(() => {
      if (typeof gvToast === 'function') gvToast('Ссылка на новость скопирована!');
      else if (typeof gvAlert === 'function') gvAlert('Ссылка на новость успешно скопирована в буфер обмена!', { title: 'Поделиться', icon: 'fa-solid fa-check' });
    }).catch(() => {
      if (typeof gvAlert === 'function') {
        gvAlert(`Скопируйте ссылку вручную:\n${url}`, { title: 'Ссылка на новость', icon: 'fa-solid fa-link' });
      } else {
        prompt('Скопируйте ссылку на новость:', url);
      }
    });
  } else {
    if (typeof gvAlert === 'function') {
      gvAlert(`Скопируйте ссылку вручную:\n${url}`, { title: 'Ссылка на новость', icon: 'fa-solid fa-link' });
    } else {
      prompt('Скопируйте ссылку на новость:', url);
    }
  }
}

function setNewsCategory(catId) {
  currentNewsCategory = catId;
  const feed = document.getElementById('news-feed-content');
  if (feed) {
    feed.innerHTML = renderNewsFeedContent();
    // Обновляем подсветку кнопок категорий
    document.querySelectorAll('[onclick^="setNewsCategory"]').forEach(btn => {
      const isCurrent = btn.getAttribute('onclick').includes(`'${catId}'`);
      btn.className = `flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition whitespace-nowrap ${
        isCurrent 
          ? 'bg-violet-600 text-white shadow-lg shadow-violet-600/25' 
          : 'bg-zinc-900/60 text-zinc-400 hover:text-white hover:bg-zinc-800 border border-zinc-800'
      }`;
    });
  } else {
    const main = document.getElementById('main-content');
    if (main) renderNews(main);
  }
}

function handleNewsSearch(val) {
  currentNewsSearch = val;
  const feed = document.getElementById('news-feed-content');
  if (feed) {
    feed.innerHTML = renderNewsFeedContent();
  } else {
    const main = document.getElementById('main-content');
    if (main) renderNews(main);
  }
}

function clearNewsSearch() {
  currentNewsSearch = '';
  const input = document.getElementById('news-search-input');
  if (input) {
    input.value = '';
    input.focus();
  }
  const feed = document.getElementById('news-feed-content');
  if (feed) {
    feed.innerHTML = renderNewsFeedContent();
  } else {
    const main = document.getElementById('main-content');
    if (main) renderNews(main);
  }
}

window.renderNews = renderNews;
window.renderArticlePage = renderArticlePage;
window.renderNewsFeed = renderNewsFeed;
window.openNewsArticle = openNewsArticle;
window.openNewsModal = openNewsModal;
window.setNewsCategory = setNewsCategory;
window.handleNewsSearch = handleNewsSearch;
window.clearNewsSearch = clearNewsSearch;
window.shareNews = shareNews;
