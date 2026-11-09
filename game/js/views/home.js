// Главная
// Главная страница: большой баннер, популярные игры и скоро выходящие
function renderHome(container) {
  const featured = GAMES.find(g => g.id === 339958 || g.title === 'Persona 5 Royal') 
                || GAMES.find(g => g.status === 'released' && g.screenshots && g.screenshots[0] && g.badges && g.badges.length > 0) 
                || GAMES[0];

  if (!featured.badges || !featured.badges.length) {
    featured.badges = ['hit'];
  }
  const popular = [...GAMES].filter(g => g.status === 'released').sort((a, b) => b.rating - a.rating).slice(0, 6);
  const actionGames = GAMES.filter(g => g.status === 'released' && (g.genres || []).some(gen => /экшен|action/i.test(gen))).sort((a, b) => b.rating - a.rating).slice(0, 6);
  const rpgGames = GAMES.filter(g => g.status === 'released' && (g.genres || []).some(gen => /rpg|ролев/i.test(gen))).sort((a, b) => b.rating - a.rating).slice(0, 6);
  const sportsGames = GAMES.filter(g => g.status === 'released' && (g.genres || []).some(gen => /спорт|sport|гонк|racing/i.test(gen))).sort((a, b) => b.rating - a.rating).slice(0, 6);
  const mobileGames = GAMES.filter(g => g.status === 'released' && (g.platforms || []).some(p => /mobile|android|ios/i.test(p))).sort((a, b) => b.rating - a.rating).slice(0, 6);
  const upcoming = GAMES.filter(g => g.status === 'upcoming');

  container.innerHTML = `
    <section class="relative h-[500px] md:h-[600px] overflow-hidden">
      <div class="absolute inset-0" style="background: url('${featured.screenshots[0]}') center/cover;"></div>
      <div class="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/60 to-transparent"></div>
      <div class="absolute inset-0 bg-gradient-to-r from-zinc-950 via-zinc-950/40 to-transparent"></div>
      <div class="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-full flex items-end pb-16 md:pb-24">
        <div class="max-w-2xl animate-fade">
          <div class="flex gap-2 mb-4">
            ${featured.badges.map(b => `<span class="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${b === 'hit' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'}">${b === 'hit' ? '🔥 ХИТ' : '✨ ИГРА ГОДА'}</span>`).join('')}
          </div>
          <h1 class="font-display font-black text-4xl md:text-6xl mb-4 leading-tight text-white">${featured.title}</h1>
          <div class="flex items-center gap-4 mb-6 text-sm text-zinc-300">
            <span class="flex items-center gap-1.5"><i class="fa-solid fa-star text-amber-400"></i> <b class="text-white text-lg">${featured.rating}</b></span>
            <span class="w-1 h-1 rounded-full bg-zinc-600"></span>
            <span>${featured.year}</span>
            <span class="w-1 h-1 rounded-full bg-zinc-600"></span>
            <span>${featured.genres[0]}</span>
          </div>
          <p class="text-zinc-300 text-lg mb-8 leading-relaxed max-w-xl">${featured.description}</p>
          <div class="flex gap-3">
            <button class="bg-violet-600 hover:bg-violet-500 text-white font-semibold py-3 px-6 rounded-xl transition shadow-lg shadow-violet-600/20 flex items-center gap-2" onclick="showView('game', {gameId: ${featured.id}})">
              <i class="fa-solid fa-circle-info"></i> Подробнее
            </button>
            <button class="bg-zinc-800/80 hover:bg-zinc-700 text-white font-semibold py-3 px-6 rounded-xl transition border border-zinc-700 flex items-center gap-2" onclick="toggleList(${featured.id}, 'want')">
              <i class="fa-regular fa-bookmark"></i> В списки
            </button>
          </div>
        </div>
      </div>
    </section>



    <!-- 1. Популярное сейчас -->
    <section class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div class="flex items-center justify-between mb-8">
        <div>
          <h2 class="font-display font-bold text-2xl md:text-3xl text-white">🔥 Популярное сейчас</h2>
          <p class="text-xs sm:text-sm text-zinc-400 mt-1">Игры с наивысшим рейтингом сообщества</p>
        </div>
        <button class="text-violet-400 hover:text-violet-300 text-sm font-semibold flex items-center gap-1 transition" onclick="showView('tops')">Все топы <i class="fa-solid fa-arrow-right"></i></button>
      </div>
      <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        ${popular.map(g => gameCard(g)).join('')}
      </div>
    </section>

    <!-- Горячие новости индустрии -->
    <section class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 border-t border-zinc-800/50">
      <div class="flex items-center justify-between mb-6">
        <div>
          <div class="flex items-center gap-2 mb-1">
            <span class="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-violet-500/20 text-violet-400 border border-violet-500/30">
              <span class="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span>
              Live Feed
            </span>
          </div>
          <h2 class="font-display font-bold text-2xl md:text-3xl text-white flex items-center gap-2">
            <span>📰 Главные новости</span>
          </h2>
          <p class="text-xs sm:text-sm text-zinc-400 mt-1">Свежие события игровой индустрии, анонсы и обновления</p>
        </div>
        <button class="text-violet-400 hover:text-violet-300 text-sm font-semibold flex items-center gap-1.5 transition group" onclick="showView('news')">
          <span>Все новости</span>
          <i class="fa-solid fa-arrow-right group-hover:translate-x-0.5 transition"></i>
        </button>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
        ${(typeof NEWS_DATA !== 'undefined' ? NEWS_DATA.slice(0, 3) : []).map(item => `
          <div class="bg-zinc-900/60 border border-zinc-800/80 rounded-2xl overflow-hidden hover:border-violet-500/50 hover:shadow-xl transition flex flex-col justify-between group">
            <div class="cursor-pointer" onclick="showView('news', { articleId: '${item.id}' });">
              <div class="relative h-44 overflow-hidden">
                <img src="${item.cover}" alt="${escapeHtml(item.title)}" class="w-full h-full object-cover group-hover:scale-105 transition duration-500" onerror="this.onerror=null; this.src='https://media.rawg.io/media/screenshots/598/5983ffe274a237b33e0f0452364fba78.jpg';">
                <div class="absolute inset-0 bg-gradient-to-t from-zinc-950 via-transparent to-transparent"></div>
                <div class="absolute top-3 left-3">
                  <span class="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${item.categoryBadgeBg} backdrop-blur-md">
                    ${item.categoryLabel}
                  </span>
                </div>
                <div class="absolute bottom-2 left-3 text-[11px] text-zinc-400 bg-zinc-950/70 px-2 py-0.5 rounded backdrop-blur-md">
                  ${item.date}
                </div>
              </div>
              <div class="p-4">
                <div class="text-[10px] text-zinc-500 mb-1 font-medium">${item.source}</div>
                <h3 class="font-bold text-sm text-white group-hover:text-violet-400 transition line-clamp-2 leading-snug mb-2">
                  ${item.title}
                </h3>
                <p class="text-zinc-400 text-xs line-clamp-2 leading-relaxed">
                  ${item.summary}
                </p>
              </div>
            </div>
            <div class="p-4 pt-0 flex items-center justify-between text-xs text-zinc-400 border-t border-zinc-800/40 mt-2">
              <span class="flex items-center gap-1"><i class="fa-regular fa-eye text-zinc-500"></i> ${item.views.toLocaleString('ru-RU')}</span>
              <button onclick="showView('news', { articleId: '${item.id}' });" class="text-violet-400 hover:text-violet-300 font-semibold text-xs flex items-center gap-1">
                Читать <i class="fa-solid fa-chevron-right text-[9px]"></i>
              </button>
            </div>
          </div>
        `).join('')}
      </div>
    </section>

    <!-- 2. Лучшие Экшены -->
    <section class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 border-t border-zinc-800/50">
      <div class="flex items-center justify-between mb-8">
        <div>
          <h2 class="font-display font-bold text-2xl md:text-3xl text-white flex items-center gap-2">
            <span>⚔️ Лучший Экшен</span>
          </h2>
          <p class="text-xs sm:text-sm text-zinc-400 mt-1">Динамичные сражения, шутеры и приключения</p>
        </div>
        <button class="text-violet-400 hover:text-violet-300 text-sm font-semibold flex items-center gap-1 transition" onclick="showView('catalog', { genre: 'action' })">Каталог Экшена <i class="fa-solid fa-arrow-right"></i></button>
      </div>
      <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        ${actionGames.map(g => gameCard(g)).join('')}
      </div>
    </section>

    <!-- 3. Шедевры RPG -->
    <section class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 border-t border-zinc-800/50">
      <div class="flex items-center justify-between mb-8">
        <div>
          <h2 class="font-display font-bold text-2xl md:text-3xl text-white flex items-center gap-2">
            <span>🛡️ Шедевры RPG</span>
          </h2>
          <p class="text-xs sm:text-sm text-zinc-400 mt-1">Глубокие сюжеты, прокачка и огромные миры</p>
        </div>
        <button class="text-violet-400 hover:text-violet-300 text-sm font-semibold flex items-center gap-1 transition" onclick="showView('catalog', { genre: 'rpg' })">Все RPG <i class="fa-solid fa-arrow-right"></i></button>
      </div>
      <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        ${rpgGames.map(g => gameCard(g)).join('')}
      </div>
    </section>

    <!-- 4. Спорт и Гонки -->
    <section class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 border-t border-zinc-800/50">
      <div class="flex items-center justify-between mb-8">
        <div>
          <h2 class="font-display font-bold text-2xl md:text-3xl text-white flex items-center gap-2">
            <span>⚽ Спорт и Гонки</span>
          </h2>
          <p class="text-xs sm:text-sm text-zinc-400 mt-1">Скорость, чемпионаты и спортивные арены</p>
        </div>
        <button class="text-violet-400 hover:text-violet-300 text-sm font-semibold flex items-center gap-1 transition" onclick="showView('catalog', { genre: 'sports' })">Смотреть спорт <i class="fa-solid fa-arrow-right"></i></button>
      </div>
      <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        ${sportsGames.map(g => gameCard(g)).join('')}
      </div>
    </section>

    <!-- 5. Игры на мобильные устройства -->
    <section class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 border-t border-zinc-800/50">
      <div class="flex items-center justify-between mb-8">
        <div>
          <h2 class="font-display font-bold text-2xl md:text-3xl text-white flex items-center gap-2">
            <span>📱 Мобильные игры</span>
          </h2>
          <p class="text-xs sm:text-sm text-zinc-400 mt-1">Лучшие хиты, доступные на смартфонах и планшетах</p>
        </div>
        <button class="text-violet-400 hover:text-violet-300 text-sm font-semibold flex items-center gap-1 transition" onclick="showView('catalog', { platform: 'mobile' })">Все мобильные <i class="fa-solid fa-arrow-right"></i></button>
      </div>
      <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        ${mobileGames.map(g => gameCard(g)).join('')}
      </div>
    </section>

    <!-- 6. Скоро выйдут -->
    <section class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 border-t border-zinc-800/50">
      <div class="flex items-center justify-between mb-8">
        <div>
          <h2 class="font-display font-bold text-2xl md:text-3xl text-white">🚀 Скоро выйдут</h2>
          <p class="text-xs sm:text-sm text-zinc-400 mt-1">Самые ожидаемые релизы года</p>
        </div>
        <button class="text-violet-400 hover:text-violet-300 text-sm font-semibold flex items-center gap-1 transition" onclick="showView('releases')">Календарь <i class="fa-solid fa-arrow-right"></i></button>
      </div>
      <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        ${upcoming.map(g => upcomingCard(g)).join('')}
      </div>
    </section>
  `;
}

// Страница со списком жанров
function renderGenres(container) {
  container.innerHTML = `
    <section class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <h1 class="font-display font-bold text-3xl md:text-4xl text-white mb-2">Жанры игр</h1>
      <p class="text-zinc-500 mb-8">Выберите жанр, чтобы увидеть все игры</p>
      
      <div class="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
        ${GENRES.map(genre => `
          <div onclick="showView('catalog', {genre: '${genre.id}'})" class="glass-panel rounded-2xl p-6 cursor-pointer hover:border-violet-500/50 transition group">
            <div class="w-14 h-14 rounded-xl bg-gradient-to-br ${genre.color} flex items-center justify-center mb-4 group-hover:scale-110 transition">
              <i class="fa-solid ${genre.icon} text-2xl text-white"></i>
            </div>
            <h3 class="text-xl font-bold text-white mb-2">${genre.name}</h3>
            <p class="text-zinc-400 text-sm mb-4">${genre.description}</p>
            <div class="flex items-center gap-2 text-violet-400 text-sm font-semibold">
              <span>Смотреть игры</span>
              <i class="fa-solid fa-arrow-right"></i>
            </div>
          </div>
        `).join('')}
      </div>
    </section>
  `;
}

// Страница со списком платформ
function renderPlatforms(container) {
  container.innerHTML = `
    <section class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <h1 class="font-display font-bold text-3xl md:text-4xl text-white mb-2">Платформы</h1>
      <p class="text-zinc-500 mb-8">Выберите платформу для просмотра игр</p>
      
      <div class="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        ${PLATFORMS.map(platform => `
          <div onclick="showView('catalog', {platform: '${platform.id}'})" class="glass-panel rounded-2xl p-6 cursor-pointer hover:border-violet-500/50 transition group">
            <div class="w-14 h-14 rounded-xl bg-gradient-to-br ${platform.color} flex items-center justify-center mb-4 group-hover:scale-110 transition">
              <i class="fa-brands ${platform.icon} text-2xl text-white"></i>
            </div>
            <h3 class="text-xl font-bold text-white mb-2">${platform.name}</h3>
            <p class="text-zinc-400 text-sm mb-4">${platform.description}</p>
            <div class="flex items-center gap-2 text-violet-400 text-sm font-semibold">
              <span>Смотреть игры</span>
              <i class="fa-solid fa-arrow-right"></i>
            </div>
          </div>
        `).join('')}
      </div>
    </section>
  `;
}
