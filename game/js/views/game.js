// ============ СТРАНИЦА ИГРЫ ============
function renderGamePage(container) {
  const game = state.currentGame;
  if (!game) return;
  const reviews = REVIEWS[game.id] || [];
  const userRating = state.userRatings[game.id] || 0;

  container.innerHTML = `
    <section class="relative h-[400px] md:h-[500px] overflow-hidden">
      <div class="absolute inset-0" style="background: url('${game.screenshots[0]}') center/cover;"></div>
      <div class="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/80 to-zinc-950/30"></div>
      <div class="absolute inset-0 bg-gradient-to-r from-zinc-950 via-zinc-950/60 to-transparent"></div>
      <div class="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-full flex items-end pb-12">
        <div class="grid md:grid-cols-[280px_1fr] gap-8 w-full items-end">
          <div class="hidden md:block rounded-2xl overflow-hidden shadow-2xl shadow-black/50 border border-white/10 aspect-[3/4] bg-cover bg-center" style="background-image: url('${game.cover}')"></div>
          <div class="mb-4">
            <div class="flex gap-2 mb-4 flex-wrap">
              ${game.badges.map(b => `<span class="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${b === 'hit' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'}">${b === 'hit' ? ' ХИТ' : '✨ НОВИНКА'}</span>`).join('')}
            </div>
            <h1 class="font-display font-black text-4xl md:text-5xl mb-4 text-white leading-tight">${game.title}</h1>
            <div class="flex flex-wrap items-center gap-4 text-sm mb-6 text-zinc-300">
              <span>${game.year}</span>
              <span class="w-1 h-1 rounded-full bg-zinc-600"></span>
              <span>${game.developer}</span>
              <span class="w-1 h-1 rounded-full bg-zinc-600"></span>
              <span>${game.genres.join(', ')}</span>
            </div>
            
            <div class="flex items-center gap-6 mb-8">
              ${game.rating > 0 ? `
                <div class="text-center px-4 py-2 bg-zinc-900/50 rounded-xl border border-zinc-800">
                  <div class="font-display font-black text-4xl text-amber-400">${game.rating}</div>
                  <div class="text-[10px] uppercase tracking-wider text-zinc-500 font-semibold mt-1">Рейтинг</div>
                </div>
              ` : ''}
              <div>
                <div class="text-xs text-zinc-500 uppercase tracking-wider font-semibold mb-1">Дата выхода</div>
                <div class="text-white font-medium">${game.releaseDate}</div>
              </div>
              <div>
                <div class="text-xs text-zinc-500 uppercase tracking-wider font-semibold mb-1">Статус</div>
                <div class="text-white font-medium flex items-center gap-2">${game.status === 'released' ? '<i class="fa-solid fa-check-circle text-emerald-500"></i> Вышла' : '<i class="fa-regular fa-clock text-blue-500"></i> Ожидается'}</div>
              </div>
            </div>

            <div class="flex gap-3 flex-wrap">
              <button class="bg-violet-600 hover:bg-violet-500 text-white font-semibold py-2.5 px-5 rounded-xl transition shadow-lg shadow-violet-600/20 flex items-center gap-2" onclick="openReviewModal(${game.id})">
                <i class="fa-regular fa-pen-to-square"></i> Написать отзыв
              </button>
              <button class="bg-zinc-800/80 hover:bg-zinc-700 text-white font-semibold py-2.5 px-5 rounded-xl transition border border-zinc-700 flex items-center gap-2" onclick="toggleList(${game.id}, 'want')">
                <i class="fa-regular fa-bookmark"></i> Хочу
              </button>
              <button class="bg-zinc-800/80 hover:bg-zinc-700 text-white font-semibold py-2.5 px-5 rounded-xl transition border border-zinc-700 flex items-center gap-2" onclick="toggleList(${game.id}, 'playing')">
                <i class="fa-solid fa-gamepad"></i> Играю
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>

    <section class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div class="grid lg:grid-cols-[1fr_320px] gap-10">
        <div>
          <div class="flex gap-6 border-b border-zinc-800 mb-8 overflow-x-auto no-scrollbar">
            ${['about', 'media', 'reviews'].map(tab => `
              <button class="tab-btn pb-3 text-sm font-semibold uppercase tracking-wider transition-colors border-b-2 border-transparent ${tab === 'about' ? 'text-white border-violet-500' : 'text-zinc-500 hover:text-zinc-300'}" data-tab="${tab}" onclick="switchTab('${tab}')">
                ${tab === 'about' ? 'Об игре' : tab === 'media' ? 'Медиа' : `Отзывы (${reviews.length})`}
              </button>
            `).join('')}
          </div>

          <div id="tab-about" class="tab-content">
            <h2 class="text-xl font-bold text-white mb-4">Об игре</h2>
            <p class="text-zinc-400 leading-relaxed mb-8 text-base">${game.fullDescription}</p>
            
            <h3 class="text-sm font-bold text-zinc-500 uppercase tracking-wider mb-3">Теги</h3>
            <div class="flex flex-wrap gap-2 mb-8">
              ${game.tags.map(t => `<span class="px-3 py-1.5 bg-zinc-900 border border-zinc-800 rounded-lg text-sm text-zinc-300 hover:border-zinc-600 transition cursor-default">${t}</span>`).join('')}
            </div>

            ${game.rating > 0 ? `
              <h3 class="text-sm font-bold text-zinc-500 uppercase tracking-wider mb-3">Распределение оценок</h3>
              <div class="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-6 mb-8">
                ${[10, 9, 8, 7, 6, 5, 4, 3, 2, 1].map(score => {
                  const pct = game.distribution ? (game.distribution[score] || 0) : 0;
                  const color = score >= 8 ? 'bg-emerald-500' : score >= 6 ? 'bg-amber-500' : 'bg-red-500';
                  return `
                    <div class="flex items-center gap-4 mb-2.5 last:mb-0">
                      <div class="w-6 text-sm font-bold text-zinc-400 text-right">${score}</div>
                      <div class="flex-1 h-2 bg-zinc-800 rounded-full overflow-hidden">
                        <div class="h-full ${color} rounded-full transition-all duration-500" style="width: ${pct}%"></div>
                      </div>
                      <div class="w-10 text-right text-xs text-zinc-500 font-medium">${pct}%</div>
                    </div>
                  `;
                }).join('')}
              </div>
            ` : ''}
          </div>

          <div id="tab-media" class="tab-content hidden-view">
            <h2 class="text-xl font-bold text-white mb-6">Скриншоты</h2>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              ${game.screenshots.map(s => `
                <div class="aspect-video rounded-xl overflow-hidden border border-zinc-800 cursor-pointer hover:border-violet-500/50 transition group" onclick="openLightbox('${s}')">
                  <img src="${s}" class="w-full h-full object-cover group-hover:scale-105 transition duration-500">
                </div>
              `).join('')}
            </div>
          </div>

          <div id="tab-reviews" class="tab-content hidden-view">
            <div class="flex items-center justify-between mb-6">
              <h2 class="text-xl font-bold text-white">Отзывы пользователей</h2>
              <button class="bg-violet-600 hover:bg-violet-500 text-white text-sm font-semibold py-2 px-4 rounded-lg transition flex items-center gap-2" onclick="openReviewModal(${game.id})">
                <i class="fa-solid fa-pen"></i> Написать
              </button>
            </div>
            <div class="space-y-4">
              ${reviews.length > 0 ? reviews.map(r => reviewCard(r)).join('') : '<div class="text-center py-12 text-zinc-500">Пока нет отзывов. Будьте первым!</div>'}
            </div>
          </div>
        </div>

        <aside class="space-y-6">
          <div class="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-6">
            <h3 class="font-bold text-white mb-4 flex items-center gap-2"><i class="fa-regular fa-star text-amber-400"></i> Ваша оценка</h3>
            <div class="flex gap-1 mb-4" id="user-stars">
              ${[1,2,3,4,5,6,7,8,9,10].map(i => `
                <button class="text-xl transition hover:scale-110 ${i <= userRating ? 'text-amber-400' : 'text-zinc-700 hover:text-amber-400/50'}" onclick="rateGame(${game.id}, ${i})">
                  <i class="fa-solid fa-star"></i>
                </button>
              `).join('')}
            </div>
            ${userRating > 0 ? `<div class="text-sm text-zinc-400">Вы поставили: <b class="text-amber-400">${userRating}/10</b></div>` : '<div class="text-sm text-zinc-600">Нажмите на звезду, чтобы оценить</div>'}
          </div>

          <div class="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-6">
            <h3 class="font-bold text-white mb-4">Информация</h3>
            <div class="space-y-4 text-sm">
              <div><span class="text-zinc-500 block mb-1">Разработчик</span><span class="text-zinc-200 font-medium">${game.developer}</span></div>
              <div><span class="text-zinc-500 block mb-1">Платформы</span>
                <div class="flex gap-2 mt-1">
                  ${game.platforms.map(p => `<span class="px-2 py-1 bg-zinc-800 rounded text-zinc-300 text-xs">${p}</span>`).join('')}
                </div>
              </div>
            </div>
          </div>
        </aside>
      </div>
    </section>
  `;
}
