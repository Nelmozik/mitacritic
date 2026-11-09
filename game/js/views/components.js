// Общие компоненты (карточки)
function escapeHtml(text) {
  return String(text || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
window.escapeHtml = escapeHtml;

// Функция «Случайная игра» из лучших шедевров
function rollRandomGame() {
  if (typeof GAMES === 'undefined' || !GAMES.length) return;
  const topPool = GAMES.filter(g => g.rating >= 8.5 && g.cover);
  const pool = topPool.length ? topPool : GAMES;
  const randomGame = pool[Math.floor(Math.random() * pool.length)];
  if (randomGame) {
    if (window.GVAudio) window.GVAudio.playAchievement();
    showView('game', { gameId: randomGame.id });
    if (window.gvToast) gvToast('🎲 Случайный выбор: ' + randomGame.title);
  }
}
window.rollRandomGame = rollRandomGame;

// Проверка: вышла ли игра официально по статусу, году, дате релиза или наличию реальных оценок
function isGameReleased(game) {
  if (!game) return false;

  // Явный статус анонса/ожидания релиза
  if (game.status === 'upcoming') {
    return false;
  }

  if (game.status === 'released') return true;
  if (game.year && game.year < 2026) return true;

  // Если у игры уже есть оценки игроков/критиков и голоса — она доступна для оценивания
  if ((game.rating || 0) > 0 && ((game.ratingCount || 0) > 0 || game.distribution)) {
    return true;
  }

  const rd = String(game.releaseDate || '').toLowerCase().trim();
  if (rd.includes('в разработке') || rd.includes('скоро') || rd.includes('дата неизвестна')) {
    return false;
  }

  // Парсинг точной календарной даты на русском (например: 4 февраля 2025, 28 февраля 2025)
  const months = {
    'январ': 0, 'феврал': 1, 'март': 2, 'апрел': 3, 'ма': 4, 'июн': 5,
    'июл': 6, 'август': 7, 'сентябр': 8, 'октябр': 9, 'ноябр': 10, 'декабр': 11
  };
  const fullDateMatch = rd.match(/(\d{1,2})\s+([а-яё]+)\s+(\d{4})/i);
  if (fullDateMatch) {
    const day = parseInt(fullDateMatch[1], 10);
    const mStr = fullDateMatch[2].toLowerCase();
    const year = parseInt(fullDateMatch[3], 10);
    let mIdx = -1;
    for (const prefix in months) {
      if (mStr.startsWith(prefix)) { mIdx = months[prefix]; break; }
    }
    if (mIdx !== -1) {
      const releaseDate = new Date(year, mIdx, day);
      if (releaseDate <= new Date()) return true;
      return false;
    }
  }

  // Парсинг года выпуска
  const currentYear = new Date().getFullYear();
  const yearMatch = rd.match(/\b(19\d\d|20\d\d)\b/);
  const releaseYear = yearMatch ? parseInt(yearMatch[1], 10) : (game.year || 0);
  if (releaseYear && releaseYear < 2026) return true;
  if (releaseYear && releaseYear > currentYear) return false;

  return game.status !== 'upcoming';
}
window.isGameReleased = isGameReleased;

// HTML карточки игры (обложка, бейдж, рейтинг, название)
function gameCard(game) {
  const badge = game.badges[0];
  const badgeClass = badge === 'hit' ? 'bg-amber-500/90 text-black' : badge === 'new' ? 'bg-emerald-500/90 text-black' : badge === 'classic' ? 'bg-violet-500/90 text-white' : 'bg-blue-500/90 text-white';
  const badgeText = badge === 'hit' ? 'ХИТ' : badge === 'new' ? 'НОВИНКА' : badge === 'classic' ? 'КЛАССИКА' : 'СКОРО';
  const released = isGameReleased(game);

  return `
    <div class="game-card group" onclick="showView('game', {gameId: ${game.id}})">
      <div class="cover" style="background-image: url('${game.cover}')"></div>
      <div class="overlay"></div>
      ${badge ? `<span class="absolute top-3 left-3 ${badgeClass} text-[10px] font-black px-2 py-1 rounded-md shadow-lg z-10 tracking-wide">${badgeText}</span>` : ''}
      ${game.rating > 0 ? `
        <div class="absolute top-3 right-3 rating-badge px-2 py-1 rounded-lg flex items-center gap-1.5 z-10">
          <i class="fa-solid fa-star text-emerald-400 text-[10px]"></i>
          <span class="text-emerald-400 font-bold text-sm">${game.rating}</span>
        </div>
      ` : ''}
      <div class="absolute bottom-0 left-0 right-0 p-4 z-10">
        <div class="font-bold text-white text-sm md:text-base mb-1 line-clamp-1 group-hover:text-violet-400 transition-colors">${game.title}</div>
        <div class="flex items-center justify-between text-xs text-zinc-400">
          <span>${game.year || ''}</span>
          <span class="flex items-center gap-1">
            <i class="fa-regular fa-star ${game.rating > 0 ? 'text-amber-400' : 'text-zinc-600'}"></i> 
            ${game.rating > 0 ? game.rating : (released ? 'Нет оценок' : 'Скоро')}
          </span>
        </div>
      </div>
    </div>
  `;
}

// HTML карточки для ещё не вышедшей игры
function upcomingCard(game) {
  const safeTitle = typeof escapeHtml === 'function' ? escapeHtml(game.title) : game.title;
  const safeDate = typeof escapeHtml === 'function' ? escapeHtml(game.releaseDate || 'Скоро') : (game.releaseDate || 'Скоро');
  return `
    <div class="game-card group cursor-pointer" onclick="showView('game', {gameId: ${game.id}})">
      <div class="cover" style="background-image: url('${game.cover}'); filter: brightness(0.85);"></div>
      <div class="overlay"></div>
      <span class="absolute top-3 left-3 bg-blue-600/90 backdrop-blur-sm text-white text-[10px] font-black px-2.5 py-1 rounded-md shadow-lg z-10 tracking-wider flex items-center gap-1.5">
        <span class="w-1.5 h-1.5 rounded-full bg-blue-300 animate-pulse"></span>СКОРО
      </span>
      <div class="absolute bottom-0 left-0 right-0 p-4 z-10">
        <div class="font-bold text-white text-sm md:text-base mb-1 line-clamp-1 group-hover:text-violet-300 transition">${safeTitle}</div>
        <div class="text-xs text-blue-300/90 font-medium mb-3 flex items-center gap-1.5">
          <i class="fa-regular fa-calendar-days text-blue-400 text-[11px]"></i> ${safeDate}
        </div>
        <button class="w-full bg-zinc-900/80 hover:bg-violet-600 hover:text-white text-zinc-300 text-xs font-semibold py-2 rounded-lg transition border border-zinc-700/80 hover:border-violet-500 shadow-md backdrop-blur-sm" onclick="event.stopPropagation(); toggleList(${game.id}, 'want')">
          <i class="fa-regular fa-bell mr-1"></i> Ожидать
        </button>
      </div>
    </div>
  `;
}

// HTML одного отзыва: автор, оценка, теги, плюсы и минусы, лайки
function reviewCard(r) {
  const ratingLabels = {
    'exceptional': { text: 'Исключительно', color: 'text-violet-400', icon: 'fa-bullseye' },
    'recommended': { text: 'Рекомендуем', color: 'text-emerald-400', icon: 'fa-thumbs-up' },
    'meh': { text: 'Да так', color: 'text-amber-400', icon: 'fa-meh' },
    'skip': { text: 'Пропустить', color: 'text-red-400', icon: 'fa-ban' }
  };
  
  const rating = ratingLabels[r.rating] || ratingLabels['recommended'];

  // Бейдж платформы-источника (Steam, Epic Games, Playground)
  let sourceBadge = '';
  if (r.source === 'steam') {
    sourceBadge = `
      <span class="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-[#171a21] border border-[#2a475e] text-[#66c0f4] text-[11px] font-medium shadow-sm">
        <i class="fa-brands fa-steam text-[12px]"></i> Steam
        ${r.hours ? `<span class="text-zinc-400 font-normal border-l border-zinc-700/80 pl-1.5">${r.hours}</span>` : ''}
      </span>
    `;
  } else if (r.source === 'epic') {
    sourceBadge = `
      <span class="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-zinc-800 border border-zinc-700 text-zinc-200 text-[11px] font-medium shadow-sm">
        <i class="fa-solid fa-gamepad text-amber-400 text-[11px]"></i> Epic Games
        ${r.hours ? `<span class="text-zinc-400 font-normal border-l border-zinc-700/80 pl-1.5">${r.hours}</span>` : ''}
      </span>
    `;
  } else if (r.source === 'playground') {
    sourceBadge = `
      <span class="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-red-950/40 border border-red-800/60 text-red-300 text-[11px] font-medium shadow-sm">
        <i class="fa-solid fa-fire text-red-400 text-[11px]"></i> Playground.ru
        ${r.hours ? `<span class="text-zinc-400 font-normal border-l border-red-900/60 pl-1.5">${r.hours}</span>` : ''}
      </span>
    `;
  } else {
    sourceBadge = `
      <span class="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-violet-950/50 border border-violet-800/50 text-violet-300 text-[11px] font-medium shadow-sm">
        <i class="fa-solid fa-circle-check text-violet-400 text-[11px]"></i> GameVault
      </span>
    `;
  }

  const avatarBg = r.avatarBg || 'from-violet-600 to-indigo-600';
  const avatarLetter = (r.avatar || (r.user ? r.user[0].toUpperCase() : 'G'));

  return `
    <div class="bg-zinc-900/40 border border-zinc-800/60 rounded-2xl p-5 hover:border-zinc-700 transition shadow-lg">
      <div class="flex items-start gap-4 mb-4">
        <div class="w-10 h-10 rounded-full bg-gradient-to-br ${avatarBg} flex items-center justify-center font-bold text-sm flex-shrink-0 text-white shadow-md border border-white/10 cursor-pointer hover:scale-105 transition" onclick="showProfile('${escapeHtml(r.user)}')" title="Открыть профиль ${escapeHtml(r.user)}">
          ${avatarLetter}
        </div>
        <div class="flex-1 min-w-0">
          <div class="flex items-center gap-2.5 flex-wrap mb-2">
            <span class="font-bold text-white text-sm hover:text-violet-300 transition cursor-pointer flex items-center gap-1.5" onclick="showProfile('${escapeHtml(r.user)}')" title="Открыть профиль ${escapeHtml(r.user)}">
              <span>${r.user}</span>
              <i class="fa-solid fa-arrow-up-right-from-square text-[10px] text-zinc-500 opacity-0 group-hover:opacity-100 transition"></i>
            </span>
            ${sourceBadge}
            <span class="px-2.5 py-0.5 rounded-full bg-zinc-800 border border-zinc-700 text-xs ${rating.color}">
              <i class="fa-solid ${rating.icon} mr-1"></i>${rating.text}
            </span>
            <span class="text-xs text-zinc-500 ml-auto">${r.date}</span>
          </div>
          
          ${r.tags && r.tags.length > 0 ? `
            <div class="flex flex-wrap gap-2 mb-3">
              ${r.tags.map(tag => `<span class="px-2.5 py-0.5 rounded-full bg-violet-600/15 border border-violet-500/30 text-violet-300 text-xs font-medium">«${tag}»</span>`).join('')}
            </div>
          ` : ''}
          
          <h4 class="font-bold text-white mb-2 text-base">${r.title}</h4>
          <p class="text-zinc-300 text-sm leading-relaxed mb-4 whitespace-pre-line">${r.body}</p>
          
          ${(r.pros || r.cons) ? `
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
              ${r.pros ? `
                <div class="bg-emerald-500/5 border border-emerald-500/15 rounded-xl p-3">
                  <div class="text-[10px] font-bold text-emerald-400 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                    <i class="fa-solid fa-plus text-[10px]"></i> Плюсы
                  </div>
                  <div class="text-sm text-zinc-300">${r.pros}</div>
                </div>
              ` : ''}
              ${r.cons ? `
                <div class="bg-red-500/5 border border-red-500/15 rounded-xl p-3">
                  <div class="text-[10px] font-bold text-red-400 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                    <i class="fa-solid fa-minus text-[10px]"></i> Минусы
                  </div>
                  <div class="text-sm text-zinc-300">${r.cons}</div>
                </div>
              ` : ''}
            </div>
          ` : ''}
          
          <div class="flex items-center gap-4 pt-3 border-t border-zinc-800/60">
            <button class="flex items-center gap-1.5 text-xs ${r.liked ? 'text-emerald-400 font-semibold' : 'text-zinc-400 hover:text-emerald-400'} transition" onclick="likeReview(${r.id})">
              <i class="${r.liked ? 'fa-solid' : 'fa-regular'} fa-thumbs-up"></i> <span>${r.likes}</span>
            </button>
            <button class="flex items-center gap-1.5 text-xs ${r.disliked ? 'text-red-400 font-semibold' : 'text-zinc-400 hover:text-red-400'} transition" onclick="dislikeReview(${r.id})">
              <i class="${r.disliked ? 'fa-solid' : 'fa-regular'} fa-thumbs-down"></i> <span>${r.dislikes}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  `;
}
