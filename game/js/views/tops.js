// Топы и релизы
// Страница топов: лучшие игры по рейтингу и популярные жанры
function renderTops(container) {
  const byRating = [...GAMES].filter(g => g.rating > 0).sort((a, b) => b.rating - a.rating).slice(0, 10);
  container.innerHTML = `
    <section class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <h1 class="font-display font-bold text-3xl md:text-4xl text-white mb-2">🏆 Топы и рейтинги</h1>
      <p class="text-zinc-500 mb-8">Лучшие игры по мнению нашего сообщества</p>
      <div class="grid lg:grid-cols-2 gap-6">
        <div class="glass-panel rounded-2xl p-6">
          <h3 class="font-bold text-lg mb-6 flex items-center gap-2 text-white"><i class="fa-solid fa-trophy text-amber-400"></i> Лучшие всех времён</h3>
          <div class="space-y-2">
            ${byRating.map((g, i) => `
              <div class="flex items-center gap-4 p-3 rounded-xl hover:bg-zinc-800/50 transition cursor-pointer group" onclick="showView('game', {gameId: ${g.id}})">
                <div class="font-display font-black text-xl w-8 text-center ${i === 0 ? 'text-amber-400' : i === 1 ? 'text-zinc-300' : i === 2 ? 'text-orange-400' : 'text-zinc-600'}">${i + 1}</div>
                <img src="${g.cover}" class="w-12 h-16 rounded-lg object-cover border border-zinc-800 group-hover:border-zinc-600 transition">
                <div class="flex-1 min-w-0">
                  <div class="font-bold text-sm text-white truncate group-hover:text-violet-400 transition">${g.title}</div>
                  <div class="text-xs text-zinc-500">${g.year} · ${g.genres[0]}</div>
                </div>
                <div class="flex items-center gap-1.5 bg-zinc-900 px-2.5 py-1.5 rounded-lg border border-zinc-800">
                  <i class="fa-solid fa-star text-amber-400 text-xs"></i><b class="text-sm text-white">${g.rating}</b>
                </div>
              </div>
            `).join('')}
          </div>
        </div>
        <div class="glass-panel rounded-2xl p-6">
          <h3 class="font-bold text-lg mb-6 flex items-center gap-2 text-white"><i class="fa-solid fa-fire text-orange-400"></i> Популярные жанры</h3>
          <div class="space-y-3">
            ${GENRES.slice(0, 5).map((genre, i) => `
              <div onclick="showView('catalog', {genre: '${genre.id}'})" class="flex items-center justify-between p-3 rounded-xl bg-zinc-800/30 hover:bg-zinc-800/50 transition cursor-pointer group">
                <div class="flex items-center gap-3">
                  <div class="w-10 h-10 rounded-lg bg-gradient-to-br ${genre.color} flex items-center justify-center">
                    <i class="fa-solid ${genre.icon} text-white"></i>
                  </div>
                  <div>
                    <div class="font-semibold text-white group-hover:text-violet-400 transition">${genre.name}</div>
                    <div class="text-xs text-zinc-500">${Math.floor(Math.random() * 500 + 100)} игр</div>
                  </div>
                </div>
                <i class="fa-solid fa-arrow-right text-zinc-600 group-hover:text-violet-400 transition"></i>
              </div>
            `).join('')}
          </div>
        </div>
      </div>
    </section>
  `;
}

// Страница релизов: скоро выйдут и недавно вышли
function renderReleases(container) {
  const upcoming = GAMES.filter(g => g.status === 'upcoming');
  const recent = [...GAMES].filter(g => g.status === 'released').sort((a, b) => b.year - a.year).slice(0, 8);

  container.innerHTML = `
    <section class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <h1 class="font-display font-bold text-3xl md:text-4xl text-white mb-2">📅 Календарь релизов</h1>
      <p class="text-zinc-500 mb-8">Следите за выходами новых игр</p>

      <h2 class="font-display font-bold text-2xl mb-6">🚀 Ожидаемые релизы</h2>
      <div class="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
        ${upcoming.map(g => upcomingCard(g)).join('')}
      </div>

      <h2 class="font-display font-bold text-2xl mb-6">✨ Недавние релизы</h2>
      <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        ${recent.map(g => gameCard(g)).join('')}
      </div>
    </section>
  `;
}
