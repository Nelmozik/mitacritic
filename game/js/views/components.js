// Общие компоненты (карточки)
// HTML карточки игры (обложка, бейдж, рейтинг, название)
function gameCard(game) {
  const badge = game.badges[0];
  const badgeClass = badge === 'hit' ? 'bg-amber-500/90 text-black' : badge === 'new' ? 'bg-emerald-500/90 text-black' : badge === 'classic' ? 'bg-violet-500/90 text-white' : 'bg-blue-500/90 text-white';
  const badgeText = badge === 'hit' ? 'ХИТ' : badge === 'new' ? 'НОВИНКА' : badge === 'classic' ? 'КЛАССИКА' : 'СКОРО';

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
          <span>${game.year}</span>
          <span class="flex items-center gap-1"><i class="fa-regular fa-star text-zinc-600"></i> ${game.rating > 0 ? game.rating : 'Скоро'}</span>
        </div>
      </div>
    </div>
  `;
}

// HTML карточки для ещё не вышедшей игры
function upcomingCard(game) {
  return `
    <div class="game-card group" onclick="showView('game', {gameId: ${game.id}})">
      <div class="cover" style="background-image: url('${game.cover}'); filter: grayscale(0.4) brightness(0.8);"></div>
      <div class="overlay"></div>
      <span class="absolute top-3 left-3 bg-blue-500/90 text-white text-[10px] font-black px-2 py-1 rounded-md shadow-lg z-10 tracking-wide">СКОРО</span>
      <div class="absolute bottom-0 left-0 right-0 p-4 z-10">
        <div class="font-bold text-white text-sm md:text-base mb-1 line-clamp-1">${game.title}</div>
        <div class="text-xs text-zinc-400 mb-3">${game.releaseDate}</div>
        <button class="w-full bg-zinc-800/80 hover:bg-violet-600 hover:text-white text-zinc-300 text-xs font-semibold py-2 rounded-lg transition border border-zinc-700 hover:border-violet-500" onclick="event.stopPropagation(); toggleList(${game.id}, 'want')">
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
  
  return `
    <div class="bg-zinc-900/30 border border-zinc-800/50 rounded-2xl p-5 hover:border-zinc-700 transition">
      <div class="flex items-start gap-4 mb-4">
        <div class="w-10 h-10 rounded-full bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center font-bold text-sm flex-shrink-0 text-white">${r.avatar}</div>
        <div class="flex-1 min-w-0">
          <div class="flex items-center gap-3 flex-wrap mb-2">
            <span class="font-bold text-white text-sm">${r.user}</span>
            ${r.demo ? '<span class="px-2 py-0.5 rounded-md bg-zinc-700/60 text-zinc-300 text-[10px] font-bold uppercase tracking-wider">Демо-отзыв</span>' : ''}
            <span class="px-3 py-1 rounded-full bg-zinc-800 border border-zinc-700 text-xs ${rating.color}">
              <i class="fa-solid ${rating.icon} mr-1"></i>${rating.text}
            </span>
            <span class="text-xs text-zinc-600">${r.date}</span>
          </div>
          
          ${r.tags && r.tags.length > 0 ? `
            <div class="flex flex-wrap gap-2 mb-3">
              ${r.tags.map(tag => `<span class="px-3 py-1 rounded-full bg-violet-600/20 border border-violet-500/30 text-violet-300 text-xs">«${tag}»</span>`).join('')}
            </div>
          ` : ''}
          
          <h4 class="font-bold text-white mb-2">${r.title}</h4>
          <p class="text-zinc-400 text-sm leading-relaxed mb-4">${r.body}</p>
          
          <div class="grid grid-cols-2 gap-3 mb-4">
            <div class="bg-emerald-500/5 border border-emerald-500/10 rounded-lg p-3">
              <div class="text-[10px] font-bold text-emerald-500 uppercase tracking-wider mb-1">Плюсы</div>
              <div class="text-sm text-zinc-300">${r.pros}</div>
            </div>
            <div class="bg-red-500/5 border border-red-500/10 rounded-lg p-3">
              <div class="text-[10px] font-bold text-red-500 uppercase tracking-wider mb-1">Минусы</div>
              <div class="text-sm text-zinc-300">${r.cons}</div>
            </div>
          </div>
          
          <div class="flex items-center gap-4 pt-3 border-t border-zinc-800/50">
            <button class="flex items-center gap-1.5 text-xs text-zinc-500 hover:text-emerald-400 transition" onclick="likeReview(${r.id})">
              <i class="fa-regular fa-thumbs-up"></i> <span>${r.likes}</span>
            </button>
            <button class="flex items-center gap-1.5 text-xs text-zinc-500 hover:text-red-400 transition">
              <i class="fa-regular fa-thumbs-down"></i> <span>${r.dislikes}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  `;
}
