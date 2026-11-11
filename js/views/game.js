// Страница игры

// Места игры в рейтингах считаем один раз и запоминаем (игр почти 10 000, пересчитывать каждый раз долго)
let rankCache = null;

// Строит список лучших игр. Сортируем не просто по оценке, а по «взвешенной» оценке:
// игра с 9.5 и тысячами голосов должна стоять выше игры с 10 и тремя голосами
function getGameRanks() {
  if (rankCache && rankCache.total === GAMES.length) return rankCache;

  const released = GAMES.filter(g => g.status === 'released' && g.rating > 0);
  const minVotes = 200; // сколько голосов нужно, чтобы оценке можно было доверять
  const avg = released.reduce((sum, g) => sum + g.rating, 0) / released.length;

  const score = g => (g.ratingCount / (g.ratingCount + minVotes)) * g.rating + (minVotes / (g.ratingCount + minVotes)) * avg;
  const sorted = released.slice().sort((a, b) => score(b) - score(a));

  const place = {};
  sorted.forEach((g, i) => { place[g.id] = i + 1; });

  rankCache = { total: GAMES.length, sorted: sorted, place: place };
  return rankCache;
}

// Место игры среди игр того же жанра или того же года.
// filterFn решает, какие игры считать «своими»
function rankAmong(game, filterFn) {
  const ranks = getGameRanks();
  let n = 0;
  for (const g of ranks.sorted) {
    if (!filterFn(g)) continue;
    n++;
    if (g.id === game.id) return n;
  }
  return 0;
}

// Словесная оценка игры по её рейтингу: текст, цвет и значок
function ratingVerdict(rating) {
  if (rating >= 8.5) return { text: 'Исключительно', color: 'text-emerald-400', icon: 'fa-bullseye' };
  if (rating >= 7) return { text: 'Рекомендуем', color: 'text-sky-400', icon: 'fa-thumbs-up' };
  if (rating >= 5.5) return { text: 'Так себе', color: 'text-amber-400', icon: 'fa-face-meh' };
  if (rating > 0) return { text: 'Пропустить', color: 'text-red-400', icon: 'fa-ban' };
  return { text: 'Без оценки', color: 'text-zinc-500', icon: 'fa-circle-question' };
}

// getGamePlaytime, getGameSysReq, toggleSysReq вынесены в js/views/game-sysreq.js

// Сводим 10 оценок к четырём группам (как на странице отзывов): проценты каждой группы
function ratingGroups(dist) {
  if (!dist) return null;
  const sum = (from, to) => { let s = 0; for (let k = from; k <= to; k++) s += dist[k] || 0; return s; };
  return [
    { key: 'exceptional', label: 'Исключительно', pct: sum(9, 10), score: 10, bar: 'bg-emerald-500', dot: 'bg-emerald-500', icon: 'fa-bullseye' },
    { key: 'recommended', label: 'Рекомендуем', pct: sum(7, 8), score: 8, bar: 'bg-sky-500', dot: 'bg-sky-500', icon: 'fa-thumbs-up' },
    { key: 'meh', label: 'Так себе', pct: sum(5, 6), score: 6, bar: 'bg-amber-500', dot: 'bg-amber-500', icon: 'fa-face-meh' },
    { key: 'skip', label: 'Пропустить', pct: sum(1, 4), score: 3, bar: 'bg-red-500', dot: 'bg-red-500', icon: 'fa-ban' }
  ];
}

// Похожие игры: тот же основной жанр, самые популярные первыми
function similarGames(game) {
  const isVis = typeof isGameVisible === 'function' ? isGameVisible : () => true;
  const genre = game.genres[0];
  return GAMES
    .filter(g => isVis(g) && g.id !== game.id && g.status === 'released' && g.genres[0] === genre)
    .sort((a, b) => b.ratingCount - a.ratingCount)
    .slice(0, 6);
}

// Страница одной игры: заголовок, оценка, описание, информация, скриншоты, отзывы и похожие игры
function renderGamePage(container) {
  const game = state.currentGame;
  if (!game) {
    container.innerHTML = `
      <section class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center animate-fade">
        <div class="w-20 h-20 rounded-3xl bg-zinc-900 border border-zinc-800 flex items-center justify-center mx-auto mb-5 text-zinc-500 shadow-xl shadow-black/40">
          <i class="fa-solid fa-gamepad text-3xl"></i>
        </div>
        <h1 class="font-display font-bold text-2xl md:text-3xl text-white mb-2">Игра не найдена</h1>
        <p class="text-zinc-400 text-sm max-w-md mx-auto mb-8">Возможно, ссылка устарела или игра с таким идентификатором ещё не добавлена в каталог GameVault.</p>
        <div class="flex items-center justify-center gap-3">
          <button onclick="showView('catalog')" class="px-5 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-semibold text-sm transition shadow-lg shadow-violet-600/30 flex items-center gap-2 cursor-pointer">
            <i class="fa-solid fa-compass text-xs"></i> Перейти в каталог
          </button>
          <button onclick="showView('home')" class="px-5 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-semibold text-sm transition border border-zinc-700/80 cursor-pointer">
            На главную
          </button>
        </div>
      </section>
    `;
    return;
  }

  // Догружаем полные данные игры (скриншоты, подробное описание, теги)
  if (typeof loadGameDetails === 'function' && !game._detailsLoaded) {
    loadGameDetails(game.id).then(full => {
      if (state.currentView === 'game' && state.currentGame && state.currentGame.id === game.id) {
        const descEl = document.getElementById('game-detail-description');
        if (descEl && full && full.fullDescription) descEl.textContent = full.fullDescription;
        const devEl = document.getElementById('game-detail-developer');
        if (devEl && full && full.developer) devEl.textContent = full.developer;
      }
    });
  }

  const playtime = getGamePlaytime(game);
  const sysreq = getGameSysReq(game);
  const reviews = getReviews(game);
  // распределение оценок: если в данных игры его нет, считаем по средней оценке
  const dist = game.distribution || ratingDistribution(game.rating);
  const groups = ratingGroups(dist);
  const userRating = state.userRatings[game.id] || 0;
  const isReleased = typeof isGameReleased === 'function' ? isGameReleased(game) : (game.status === 'released');
  const hasRatings = (game.rating > 0 && (game.ratingCount > 0 || game.distribution));
  const ageRating = typeof getGameAgeRating === 'function' ? getGameAgeRating(game) : { label: '12+', badgeClass: 'bg-amber-500/20 text-amber-300 border-amber-500/40' };

  // картинки справа: главный скриншот и три маленькие (скриншоты, потом обложка)
  const pictures = (game.screenshots || []).concat([game.cover]).filter((s, i, arr) => s && arr.indexOf(s) === i);
  const mainPic = pictures[0] || game.cover || '';
  const thumbs = pictures.slice(1, 4);

  // места в рейтингах (только для вышедших игр с оценками)
  let ranksHtml = '';
  if (isReleased && hasRatings) {
    const overall = getGameRanks().place[game.id];
    const inGenre = rankAmong(game, g => g.genres[0] === game.genres[0]);
    const inYear = rankAmong(game, g => g.year === game.year);
    ranksHtml = `
      <div class="flex gap-6 flex-wrap">
        ${overall ? `<div><div class="font-display font-black text-3xl text-white">#${overall}</div><div class="text-[10px] uppercase tracking-wider text-zinc-500 font-semibold mt-1">В каталоге</div></div>` : ''}
        ${inGenre ? `<div><div class="font-display font-black text-3xl text-white">#${inGenre}</div><div class="text-[10px] uppercase tracking-wider text-zinc-500 font-semibold mt-1">${game.genres[0]}</div></div>` : ''}
        ${inYear ? `<div><div class="font-display font-black text-3xl text-white">#${inYear}</div><div class="text-[10px] uppercase tracking-wider text-zinc-500 font-semibold mt-1">Игры ${game.year} года</div></div>` : ''}
      </div>
    `;
  }

  // кнопки списков: если игра уже в списке, кнопка подсвечена
  const listButton = (list, icon, text) => {
    const active = Boolean(state.userLists && state.userLists[list] && state.userLists[list].includes(game.id));
    return `
      <button onclick="toggleList(${game.id}, '${list}')" class="${active ? 'bg-violet-600 border-violet-500 text-white shadow-lg shadow-violet-600/30' : 'bg-zinc-900/80 border-zinc-700 text-zinc-200 hover:border-zinc-500'} border font-semibold py-2.5 px-5 rounded-xl transition flex items-center gap-2 cursor-pointer">
        <i class="${icon}"></i> ${text}
      </button>
    `;
  };

  const verdict = ratingVerdict(game.rating);
  const heroBlurredBg = typeof optImg === 'function' ? optImg(mainPic, 1280) : mainPic;

  container.innerHTML = `
    <div class="relative">
      <!-- размытый фон из скриншота игры -->
      <div class="absolute inset-x-0 top-0 h-[560px] overflow-hidden pointer-events-none">
        <div class="absolute inset-0" style="background: url('${heroBlurredBg}') center/cover; filter: blur(36px) brightness(0.35); transform: scale(1.2);"></div>
        <div class="absolute inset-0 bg-gradient-to-b from-transparent via-zinc-950/60 to-zinc-950"></div>
      </div>

      <section class="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <!-- хлебные крошки -->
        <nav class="text-xs text-zinc-500 mb-6 flex items-center gap-2 flex-wrap">
          <button onclick="showView('home')" class="hover:text-white transition">Главная</button>
          <span>/</span>
          <button onclick="showView('catalog')" class="hover:text-white transition">Каталог</button>
          <span>/</span>
          <span class="text-zinc-400">${game.title}</span>
        </nav>

        <div class="grid lg:grid-cols-[1fr_380px] gap-10">
          <!-- левая колонка -->
          <div class="min-w-0">
            <div class="flex items-center gap-3 mb-4 flex-wrap">
              ${game.badges.filter(b => b !== 'soon').map(b => `<span class="px-2.5 py-1 rounded-md text-xs font-bold uppercase tracking-wider ${b === 'hit' ? 'bg-amber-500/20 text-amber-400' : b === 'new' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-violet-500/20 text-violet-400'}">${b === 'hit' ? 'Хит' : b === 'new' ? 'Новинка' : 'Классика'}</span>`).join('')}
              ${isReleased 
                ? `<span class="px-2.5 py-1 rounded-md text-xs font-bold uppercase tracking-wider bg-emerald-500/15 text-emerald-400 border border-emerald-500/30"><i class="fa-solid fa-circle-check mr-1 text-[10px]"></i>Релиз состоялся</span>`
                : `<span class="px-2.5 py-1 rounded-md text-xs font-bold uppercase tracking-wider bg-sky-500/15 text-sky-400 border border-sky-500/30"><i class="fa-regular fa-clock mr-1 text-[10px]"></i>Ожидается релиз</span>`
              }
              <span class="px-2.5 py-1 rounded-md text-xs font-black uppercase tracking-wider border ${ageRating.badgeClass}">${ageRating.label}</span>
            </div>

            <h1 class="font-display font-black text-4xl md:text-6xl text-white leading-tight mb-6">${game.title}</h1>

            <!-- кнопки добавления в списки -->
            <div class="flex gap-3 flex-wrap mb-8">
              ${listButton('want', 'fa-regular fa-bookmark', 'Хочу пройти')}
              ${listButton('completed', 'fa-solid fa-check', 'Прошёл')}
              ${listButton('dropped', 'fa-solid fa-ban', 'Бросил')}
            </div>

            ${(() => {
              const gameQuery = encodeURIComponent(game.title || game.name || '');
              const metaUrl = `https://www.metacritic.com/search/${gameQuery}/`;

              return `
            <!-- блок оценки игры -->
            <div class="glass-panel rounded-2xl p-6 mb-6">
              ${isReleased ? (hasRatings ? `
                <div class="flex items-end justify-between gap-6 flex-wrap mb-5">
                  <div class="flex items-center gap-4">
                    <div class="font-display font-black text-5xl text-white">${game.rating}</div>
                    <div>
                      <div class="font-bold text-lg ${verdict.color}"><i class="fa-solid ${verdict.icon} mr-1.5"></i>${verdict.text}</div>
                      <div class="text-xs text-zinc-500">${game.ratingCount} оценок на RAWG / GameVault</div>
                    </div>
                  </div>
                  <div class="flex items-center gap-3">
                    ${game.metacritic ? `
                      <a href="${metaUrl}" target="_blank" rel="noopener noreferrer" class="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-zinc-900/90 border border-zinc-800 hover:border-emerald-500/60 transition group cursor-pointer" title="Открыть рейтинг Metacritic">
                        <span class="w-6 h-6 rounded bg-emerald-600 text-white font-black text-xs flex items-center justify-center shadow-sm">M</span>
                        <div class="text-left">
                          <div class="text-xs font-bold text-white group-hover:text-emerald-400 transition">${game.metacritic} / 100</div>
                          <div class="text-[10px] text-zinc-500">Metacritic</div>
                        </div>
                      </a>
                    ` : ''}
                    ${ranksHtml}
                  </div>
                </div>

                <!-- Распределение оценок -->
                <div class="mb-3">
                  <div class="flex items-center justify-between text-xs text-zinc-400 mb-1.5">
                    <span>Распределение оценок:</span>
                    <span class="text-[11px] text-zinc-500">Нажмите на полосу, чтобы поставить оценку</span>
                  </div>

                  <!-- Цветная полоса диаграммы -->
                  <div class="flex h-10 rounded-xl overflow-hidden gap-0.5 shadow-inner cursor-pointer ring-1 ring-white/10 hover:ring-violet-500/50 transition">
                    ${groups ? groups.filter(g => g.pct > 0).map(g => `
                      <button onclick="rateGame(${game.id}, ${g.score})" style="width: ${g.pct}%" class="${g.bar} hover:brightness-125 transition flex items-center justify-center text-white text-sm" title="${g.label}: ${g.pct}%">
                        <i class="fa-solid ${g.icon}"></i>
                      </button>
                    `).join('') : ''}
                  </div>
                </div>

                <!-- Легенда процентов диаграммы -->
                <div class="flex flex-wrap gap-x-5 gap-y-1 text-xs mb-3">
                  ${groups ? groups.map(g => `<span class="flex items-center gap-1.5 text-zinc-300"><span class="w-2 h-2 rounded-full ${g.dot}"></span>${g.label} <span class="text-zinc-500">${g.pct}%</span></span>`).join('') : ''}
                </div>

                ${userRating > 0 ? `<div class="text-sm text-zinc-400 mt-3 pt-2 border-t border-zinc-800">Ваша оценка: <b class="text-amber-400">${userRating}/10</b></div>` : ''}
              ` : `
                <!-- Игра уже вышла, но у неё пока нет оценок в каталоге -->
                <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <div class="flex items-center gap-2 text-emerald-400 font-bold text-sm mb-1">
                      <i class="fa-solid fa-circle-check"></i> Игра вышла ${game.releaseDate ? '(' + game.releaseDate + ')' : (game.year ? '(' + game.year + ' год)' : '')}
                    </div>
                    <div class="text-white font-bold text-lg">Пока нет пользовательских оценок</div>
                    <div class="text-xs text-zinc-400 mt-0.5">Будьте первым игроком, кто оценит эту игру!</div>
                  </div>
                  <div class="flex items-center gap-2 bg-zinc-900/80 p-3 rounded-xl border border-zinc-800">
                    <span class="text-xs text-zinc-400 mr-1">Оценить:</span>
                    <div class="flex gap-1">
                      ${[1,2,3,4,5,6,7,8,9,10].map(i => `
                        <button class="text-base transition hover:scale-125 ${i <= userRating ? 'text-amber-400' : 'text-zinc-700 hover:text-amber-400/50'}" onclick="rateGame(${game.id}, ${i})" title="${i}/10">
                          <i class="fa-solid fa-star"></i>
                        </button>
                      `).join('')}
                    </div>
                  </div>
                </div>
                ${userRating > 0 ? `<div class="text-sm text-zinc-400 mt-3 pt-2 border-t border-zinc-800">Вы поставили оценку: <b class="text-amber-400">${userRating}/10</b></div>` : ''}
              `) : `
                <!-- Игра действительно ещё не вышла -->
                <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <div class="flex items-center gap-2 text-sky-400 font-bold text-sm mb-1">
                      <i class="fa-regular fa-clock"></i> Ожидается релиз
                    </div>
                    <div class="text-white font-bold text-lg">
                      Дата выхода: <span class="text-violet-400 font-medium">${game.releaseDate || (game.year ? game.year + ' год' : 'В разработке')}</span>
                    </div>
                    <div class="text-xs text-zinc-400 mt-0.5">Оценки и отзывы критиков станут доступны после официальной премьеры</div>
                  </div>
                  <button onclick="toggleList(${game.id}, 'want')" class="px-4 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-semibold text-xs transition flex items-center gap-2 shadow-lg shadow-violet-600/25 flex-shrink-0">
                    <i class="fa-regular fa-bookmark"></i> В список желаемого
                  </button>
                </div>
              `}
            </div>
              `;
            })()}

            <div class="flex gap-3 flex-wrap mb-10">
              <button onclick="openReviewModal(${game.id})" class="bg-zinc-900/80 hover:bg-zinc-800 border border-zinc-700 text-white font-semibold py-2.5 px-5 rounded-xl transition flex items-center gap-2 cursor-pointer">
                <i class="fa-regular fa-pen-to-square"></i> Написать отзыв <span id="game-write-review-count" class="text-zinc-500">${reviews.length}</span>
              </button>
              <button onclick="shareGame(${game.id})" class="bg-zinc-900/80 hover:bg-zinc-800 border border-zinc-700 text-zinc-300 font-semibold py-2.5 px-5 rounded-xl transition flex items-center gap-2 cursor-pointer">
                <i class="fa-solid fa-share"></i> Поделиться
              </button>
            </div>

            <!-- описание -->
            <h2 class="text-2xl font-bold text-white mb-3">Об игре</h2>
            <p id="game-detail-description" class="text-zinc-300 leading-relaxed mb-8 whitespace-pre-line">${game.fullDescription || game.description || 'Загрузка описания…'}</p>

            <!-- основная информация -->
            <div class="grid sm:grid-cols-2 gap-x-8 gap-y-5 text-sm mb-8">
              <div>
                <div class="text-xs uppercase tracking-wider text-zinc-600 font-semibold mb-1.5">Платформы</div>
                <!-- flex-wrap переносит платформы на новую строку, если они не помещаются -->
                <div class="flex flex-wrap gap-2">
                  ${(game.platforms || []).map(p => `<span class="px-2 py-1 bg-zinc-800 rounded text-zinc-300 text-xs whitespace-nowrap">${p}</span>`).join('') || '<span class="text-zinc-500">Нет данных</span>'}
                </div>
              </div>
              <div>
                <div class="text-xs uppercase tracking-wider text-zinc-600 font-semibold mb-1.5">Жанры</div>
                <div class="flex flex-wrap gap-2">
                  ${(game.genres || []).map(g => genreIdByName(g)
                    // жанр есть в фильтрах каталога - делаем кнопкой, иначе обычная метка
                    ? `<button onclick="showView('catalog', {genre: '${genreIdByName(g)}'})" class="px-2 py-1 bg-zinc-800 hover:bg-zinc-700 rounded text-zinc-300 text-xs transition">${g}</button>`
                    : `<span class="px-2 py-1 bg-zinc-800 rounded text-zinc-300 text-xs">${g}</span>`).join('')}
                </div>
              </div>
              <div>
                <div class="text-xs uppercase tracking-wider text-zinc-600 font-semibold mb-1.5">Дата выхода</div>
                <div class="text-zinc-200 font-medium">${game.releaseDate || (game.year ? game.year + ' год' : 'Уточняется')}</div>
              </div>
              <div>
                <div class="text-xs uppercase tracking-wider text-zinc-600 font-semibold mb-1.5">Разработчик</div>
                <div id="game-detail-developer" class="text-zinc-200">${game.developer || '—'}</div>
              </div>
            </div>

            ${(game.tags && game.tags.length) ? `
              <div class="text-xs uppercase tracking-wider text-zinc-600 font-semibold mb-2">Теги</div>
              <div class="flex flex-wrap gap-2 mb-8">
                ${game.tags.map(t => `<span class="px-3 py-1.5 bg-zinc-900 border border-zinc-800 rounded-lg text-sm text-zinc-300">${t}</span>`).join('')}
              </div>
            ` : '<div class="mb-4"></div>'}

            <!-- Где купить / Ссылки на магазины -->
            <div class="glass-panel rounded-2xl p-4 sm:p-5 border border-zinc-800 mb-8 shadow-xl">
              <div class="text-xs font-bold uppercase tracking-wider text-zinc-400 mb-3 flex items-center gap-2">
                <i class="fa-solid fa-bag-shopping text-violet-400"></i> Где купить и играть
              </div>
              <div class="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                <!-- Steam -->
                <a href="https://store.steampowered.com/search/?term=${encodeURIComponent(game.title || game.name || '')}" target="_blank" rel="noopener noreferrer" class="p-3 rounded-xl bg-zinc-900/90 hover:bg-[#171d25] hover:border-[#66c0f4]/60 border border-zinc-800 flex items-center gap-2.5 transition group shadow-sm">
                  <div class="w-8 h-8 rounded-lg bg-zinc-800 flex items-center justify-center text-[#66c0f4] text-base group-hover:scale-110 transition-transform">
                    <i class="fa-brands fa-steam"></i>
                  </div>
                  <div class="min-w-0">
                    <div class="text-xs font-bold text-white truncate">Steam</div>
                    <div class="text-[10px] text-zinc-500">Магазин Valve</div>
                  </div>
                </a>
                <!-- GOG -->
                <a href="https://www.gog.com/en/games?query=${encodeURIComponent(game.title || game.name || '')}" target="_blank" rel="noopener noreferrer" class="p-3 rounded-xl bg-zinc-900/90 hover:bg-[#201c2b] hover:border-[#af69ee]/60 border border-zinc-800 flex items-center gap-2.5 transition group shadow-sm">
                  <div class="w-8 h-8 rounded-lg bg-zinc-800 flex items-center justify-center text-[#af69ee] text-base group-hover:scale-110 transition-transform">
                    <i class="fa-solid fa-gamepad"></i>
                  </div>
                  <div class="min-w-0">
                    <div class="text-xs font-bold text-white truncate">GOG</div>
                    <div class="text-[10px] text-zinc-500">Без DRM</div>
                  </div>
                </a>
                <!-- Epic Games -->
                <a href="https://store.epicgames.com/browse?q=${encodeURIComponent(game.title || game.name || '')}" target="_blank" rel="noopener noreferrer" class="p-3 rounded-xl bg-zinc-900/90 hover:bg-[#202020] hover:border-zinc-500 border border-zinc-800 flex items-center gap-2.5 transition group shadow-sm">
                  <div class="w-8 h-8 rounded-lg bg-zinc-800 flex items-center justify-center text-white text-base font-black group-hover:scale-110 transition-transform">
                    EGS
                  </div>
                  <div class="min-w-0">
                    <div class="text-xs font-bold text-white truncate">Epic Games</div>
                    <div class="text-[10px] text-zinc-500">EGS Store</div>
                  </div>
                </a>
                <!-- PlayStation Store -->
                <a href="https://store.playstation.com/search/${encodeURIComponent(game.title || game.name || '')}" target="_blank" rel="noopener noreferrer" class="p-3 rounded-xl bg-zinc-900/90 hover:bg-[#002244] hover:border-[#0070d1]/60 border border-zinc-800 flex items-center gap-2.5 transition group shadow-sm">
                  <div class="w-8 h-8 rounded-lg bg-zinc-800 flex items-center justify-center text-[#0070d1] text-base group-hover:scale-110 transition-transform">
                    <i class="fa-brands fa-playstation"></i>
                  </div>
                  <div class="min-w-0">
                    <div class="text-xs font-bold text-white truncate">PS Store</div>
                    <div class="text-[10px] text-zinc-500">PlayStation</div>
                  </div>
                </a>
              </div>
            </div>

            <!-- Время на прохождение (HowLongToBeat) -->
            <div class="glass-panel rounded-2xl p-5 border border-zinc-800 mb-8 shadow-xl">
              <div class="flex items-center justify-between mb-4 flex-wrap gap-2">
                <div class="flex items-center gap-2.5">
                  <div class="w-8 h-8 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center text-sm font-bold border border-indigo-500/30">
                    <i class="fa-regular fa-clock"></i>
                  </div>
                  <div>
                    <h3 class="text-sm font-bold text-white flex items-center gap-2">
                      Время на прохождение <span class="text-[10px] text-zinc-500 font-normal">HowLongToBeat</span>
                    </h3>
                    <p class="text-[11px] text-zinc-400">Сколько часов потребуется для завершения игры</p>
                  </div>
                </div>
                <span class="text-[11px] text-indigo-300 font-semibold px-2.5 py-0.5 rounded-full bg-indigo-500/10 border border-indigo-500/30 flex items-center gap-1">
                  <i class="fa-solid fa-circle-check text-[10px]"></i> Данные игроков
                </span>
              </div>

              <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <!-- Сюжет -->
                <div class="p-3.5 rounded-xl bg-zinc-900/70 border border-zinc-800/80 flex flex-col justify-between">
                  <div class="text-[11px] font-semibold text-zinc-400 flex items-center gap-1.5 mb-2">
                    <i class="fa-solid fa-gamepad text-sky-400 text-xs"></i> Основной сюжет
                  </div>
                  <div class="text-2xl font-black font-display text-white">
                    ~${playtime.main} <span class="text-xs font-normal text-zinc-500">часов</span>
                  </div>
                </div>

                <!-- Сюжет + побочные -->
                <div class="p-3.5 rounded-xl bg-zinc-900/70 border border-zinc-800/80 flex flex-col justify-between">
                  <div class="text-[11px] font-semibold text-zinc-400 flex items-center gap-1.5 mb-2">
                    <i class="fa-solid fa-compass text-violet-400 text-xs"></i> Сюжет + побочные
                  </div>
                  <div class="text-2xl font-black font-display text-white">
                    ~${playtime.extra} <span class="text-xs font-normal text-zinc-500">часов</span>
                  </div>
                </div>

                <!-- На 100% -->
                <div class="p-3.5 rounded-xl bg-zinc-900/70 border border-zinc-800/80 flex flex-col justify-between">
                  <div class="text-[11px] font-semibold text-zinc-400 flex items-center gap-1.5 mb-2">
                    <i class="fa-solid fa-trophy text-amber-400 text-xs"></i> На 100% (Перфекционист)
                  </div>
                  <div class="text-2xl font-black font-display text-white">
                    ~${playtime.completionist} <span class="text-xs font-normal text-zinc-500">часов</span>
                  </div>
                </div>
              </div>
            </div>

            <!-- Системные требования (ПК) с переключателем Минимальные / Рекомендуемые -->
            <div class="glass-panel rounded-2xl p-5 border border-zinc-800 mb-8 shadow-xl">
              <div class="flex items-center justify-between mb-4 flex-wrap gap-2">
                <div class="flex items-center gap-2.5">
                  <div class="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-sm font-bold border border-emerald-500/30">
                    <i class="fa-solid fa-desktop"></i>
                  </div>
                  <div>
                    <h3 class="text-sm font-bold text-white">Системные требования для ПК</h3>
                    <p class="text-[11px] text-zinc-400">Необходимые характеристики для запуска</p>
                  </div>
                </div>
                <div class="flex bg-zinc-900 p-1 rounded-xl border border-zinc-800 text-xs">
                  <button type="button" id="sysreq-min-btn" onclick="toggleSysReq('min')" class="px-3 py-1.5 rounded-lg bg-zinc-800 text-white font-semibold transition">
                    Минимальные
                  </button>
                  <button type="button" id="sysreq-rec-btn" onclick="toggleSysReq('rec')" class="px-3 py-1.5 rounded-lg text-zinc-400 hover:text-white font-medium transition">
                    Рекомендуемые
                  </button>
                </div>
              </div>

              <!-- Минимальные требования -->
              <div id="sysreq-min-content" class="grid sm:grid-cols-2 gap-3 text-xs">
                <div class="p-3 rounded-xl bg-zinc-900/60 border border-zinc-800">
                  <div class="text-[10px] uppercase font-bold text-zinc-500 mb-0.5">Операционная система</div>
                  <div class="text-zinc-200 font-medium">${sysreq.min.os}</div>
                </div>
                <div class="p-3 rounded-xl bg-zinc-900/60 border border-zinc-800">
                  <div class="text-[10px] uppercase font-bold text-zinc-500 mb-0.5">Процессор (CPU)</div>
                  <div class="text-zinc-200 font-medium">${sysreq.min.cpu}</div>
                </div>
                <div class="p-3 rounded-xl bg-zinc-900/60 border border-zinc-800">
                  <div class="text-[10px] uppercase font-bold text-zinc-500 mb-0.5">Оперативная память (RAM)</div>
                  <div class="text-zinc-200 font-medium">${sysreq.min.ram}</div>
                </div>
                <div class="p-3 rounded-xl bg-zinc-900/60 border border-zinc-800">
                  <div class="text-[10px] uppercase font-bold text-zinc-500 mb-0.5">Видеокарта (GPU)</div>
                  <div class="text-zinc-200 font-medium">${sysreq.min.gpu}</div>
                </div>
                <div class="p-3 rounded-xl bg-zinc-900/60 border border-zinc-800">
                  <div class="text-[10px] uppercase font-bold text-zinc-500 mb-0.5">Место на диске</div>
                  <div class="text-zinc-200 font-medium">${sysreq.min.storage}</div>
                </div>
                <div class="p-3 rounded-xl bg-zinc-900/60 border border-zinc-800">
                  <div class="text-[10px] uppercase font-bold text-zinc-500 mb-0.5">DirectX</div>
                  <div class="text-zinc-200 font-medium">${sysreq.min.directx}</div>
                </div>
              </div>

              <!-- Рекомендуемые требования -->
              <div id="sysreq-rec-content" class="grid sm:grid-cols-2 gap-3 text-xs hidden">
                <div class="p-3 rounded-xl bg-zinc-900/60 border border-zinc-800">
                  <div class="text-[10px] uppercase font-bold text-zinc-500 mb-0.5">Операционная система</div>
                  <div class="text-zinc-200 font-medium">${sysreq.rec.os}</div>
                </div>
                <div class="p-3 rounded-xl bg-zinc-900/60 border border-zinc-800">
                  <div class="text-[10px] uppercase font-bold text-zinc-500 mb-0.5">Процессор (CPU)</div>
                  <div class="text-zinc-200 font-medium">${sysreq.rec.cpu}</div>
                </div>
                <div class="p-3 rounded-xl bg-zinc-900/60 border border-zinc-800">
                  <div class="text-[10px] uppercase font-bold text-zinc-500 mb-0.5">Оперативная память (RAM)</div>
                  <div class="text-zinc-200 font-medium">${sysreq.rec.ram}</div>
                </div>
                <div class="p-3 rounded-xl bg-zinc-900/60 border border-zinc-800">
                  <div class="text-[10px] uppercase font-bold text-zinc-500 mb-0.5">Видеокарта (GPU)</div>
                  <div class="text-zinc-200 font-medium">${sysreq.rec.gpu}</div>
                </div>
                <div class="p-3 rounded-xl bg-zinc-900/60 border border-zinc-800">
                  <div class="text-[10px] uppercase font-bold text-zinc-500 mb-0.5">Место на диске</div>
                  <div class="text-zinc-200 font-medium">${sysreq.rec.storage}</div>
                </div>
                <div class="p-3 rounded-xl bg-zinc-900/60 border border-zinc-800">
                  <div class="text-[10px] uppercase font-bold text-zinc-500 mb-0.5">DirectX</div>
                  <div class="text-zinc-200 font-medium">${sysreq.rec.directx}</div>
                </div>
              </div>
            </div>

            <!-- отзывы -->
            <h2 class="text-2xl font-bold text-white mb-5 flex items-center gap-2">
              <span>Отзывы игроков</span>
              <span id="game-reviews-count" class="text-zinc-500 text-base font-normal">(${reviews.length})</span>
            </h2>
            <div id="game-reviews-list" class="space-y-4">
              ${reviews.length > 0 ? reviews.map(r => reviewCard(r)).join('') : '<div class="text-center py-12 text-zinc-500">Пока нет отзывов. Будьте первым!</div>'}
            </div>
          </div>

          <!-- правая колонка: скриншоты и оценка звёздами -->
          <aside class="space-y-6 lg:sticky lg:top-24 self-start">
            <div class="grid grid-cols-3 gap-2">
              <div class="col-span-3 aspect-video rounded-xl overflow-hidden border border-zinc-800 cursor-pointer group" onclick="openLightbox('${mainPic}')">
                <img src="${typeof optImg === 'function' ? optImg(mainPic, 800) : mainPic}" alt="" loading="lazy" referrerpolicy="no-referrer" onerror="if (typeof handleImgError === 'function') handleImgError(this, '${mainPic}');" class="w-full h-full object-cover group-hover:scale-105 transition duration-500">
              </div>
              ${thumbs.map(s => `
                <div class="aspect-video rounded-lg overflow-hidden border border-zinc-800 cursor-pointer group" onclick="openLightbox('${s}')">
                  <img src="${typeof optImg === 'function' ? optImg(s, 320) : s}" alt="" loading="lazy" referrerpolicy="no-referrer" onerror="if (typeof handleImgError === 'function') handleImgError(this, '${s}');" class="w-full h-full object-cover group-hover:scale-105 transition duration-500">
                </div>
              `).join('')}
            </div>

            <div class="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-5">
              <h3 class="font-bold text-white mb-3 flex items-center gap-2"><i class="fa-regular fa-star text-amber-400"></i> Ваша оценка</h3>
              <div class="flex gap-1 mb-3">
                ${[1,2,3,4,5,6,7,8,9,10].map(i => `
                  <button class="text-lg transition hover:scale-110 ${i <= userRating ? 'text-amber-400' : 'text-zinc-700 hover:text-amber-400/50'}" onclick="rateGame(${game.id}, ${i})">
                    <i class="fa-solid fa-star"></i>
                  </button>
                `).join('')}
              </div>
              ${userRating > 0 ? `<div class="text-sm text-zinc-400">Вы поставили: <b class="text-amber-400">${userRating}/10</b></div>` : '<div class="text-sm text-zinc-600">Нажмите на звезду, чтобы оценить</div>'}
            </div>
          </aside>
        </div>

        <!-- похожие игры (рекомендации) -->
        ${similarGames(game).length ? `
          <div class="mt-16 pt-10 border-t border-zinc-800/80">
            <div class="flex items-center justify-between mb-6">
              <div>
                <h2 class="text-2xl font-bold text-white flex items-center gap-2.5">
                  <i class="fa-solid fa-wand-magic-sparkles text-violet-400 text-xl"></i> Похожие игры
                </h2>
                <p class="text-xs sm:text-sm text-zinc-400 mt-1">Если вам понравилась «${escapeHtml(game.title || game.name || '')}», обратите внимание на эти шедевры:</p>
              </div>
              <button onclick="showView('catalog', { genre: '${genreIdByName(game.genres[0]) || ''}' })" class="text-xs sm:text-sm font-semibold text-violet-400 hover:text-violet-300 transition flex items-center gap-1.5">
                Больше в жанре <i class="fa-solid fa-arrow-right text-xs"></i>
              </button>
            </div>
            <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              ${similarGames(game).map(g => gameCard(g)).join('')}
            </div>
          </div>
        ` : ''}
      </section>
    </div>
  `;

  // Асинхронно подгружаем реальные отзывы из Firestore (доступны всем пользователям и гостям)
  if (window.GVDB && typeof GVDB.getReviews === 'function') {
    GVDB.getReviews(game.id).then(cloudReviews => {
      if (cloudReviews) {
        // Объединяем с локальными отзывами (если только что написали оффлайн)
        const localOnly = (REVIEWS[game.id] || []).filter(r => !cloudReviews.some(cr => String(cr.id) === String(r.id)));
        const merged = [...localOnly, ...cloudReviews];
        REVIEWS[game.id] = merged;

        // Если пользователь всё ещё просматривает эту же страницу, обновляем DOM
        if (state.currentView === 'game' && state.currentGame && state.currentGame.id === game.id) {
          const listEl = document.getElementById('game-reviews-list');
          if (listEl) {
            listEl.innerHTML = merged.length > 0
              ? merged.map(r => reviewCard(r)).join('')
              : '<div class="text-center py-12 text-zinc-500">Пока нет отзывов. Будьте первым!</div>';
          }
          const countEl = document.getElementById('game-reviews-count');
          if (countEl) countEl.textContent = `(${merged.length})`;
          const btnCountEl = document.getElementById('game-write-review-count');
          if (btnCountEl) btnCountEl.textContent = merged.length;
        }
      }
    }).catch(err => console.warn('Load cloud reviews error:', err));
  }
}

// Копирует прямую ссылку на страницу игры в буфер обмена
function shareGame(gameId) {
  const g = (typeof GAMES !== 'undefined' ? GAMES : []).find(x => x.id === gameId) || state.currentGame;
  const title = g ? g.title : 'Игру';
  const cleanPath = (typeof buildCleanUrl === 'function') ? buildCleanUrl('game', { gameId }) : `/game?id=${gameId}`;
  const url = `${window.location.origin}${cleanPath}`;
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(url)
      .then(() => {
        if (typeof gvToast === 'function') gvToast(`Ссылка на «${title}» скопирована!`);
      })
      .catch(() => {
        if (typeof gvToast === 'function') gvToast('Не удалось скопировать ссылку');
      });
  } else {
    prompt('Скопируйте ссылку на игру:', url);
  }
}
window.shareGame = shareGame;

// Находим id жанра (для фильтра каталога) по его русскому названию
function genreIdByName(name) {
  const map = { 'Экшен': 'action', 'RPG': 'rpg', 'Приключения': 'adventure', 'Шутер': 'shooter', 'Стратегия': 'strategy', 'Головоломка': 'puzzle', 'Гонки': 'racing', 'Спорт': 'sport' };
  return map[name] || null;
}

// Автообновление описания, если descriptions.js догрузился во время просмотра игры
window.addEventListener('descriptionsReady', () => {
  if (state.currentGame) {
    const descEl = document.getElementById('game-detail-description');
    if (descEl && state.currentGame.fullDescription) {
      descEl.textContent = state.currentGame.fullDescription;
    }
    const devEl = document.getElementById('game-detail-developer');
    if (devEl && state.currentGame.developer) {
      devEl.textContent = state.currentGame.developer;
    }
  }
});
