// ============ ПРОФИЛЬ ============
function renderProfile(container) {
  if (!state.currentUser) {
    container.innerHTML = `
      <section class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div class="glass-panel rounded-3xl p-12 text-center">
          <div class="w-24 h-24 rounded-full bg-zinc-800 flex items-center justify-center mx-auto mb-6">
            <i class="fa-solid fa-user text-4xl text-zinc-600"></i>
          </div>
          <h2 class="text-2xl font-bold text-white mb-4">Войдите в аккаунт</h2>
          <p class="text-zinc-400 mb-8">Чтобы видеть свой профиль и оставлять отзывы, пожалуйста, авторизуйтесь</p>
          <button onclick="showAuthModal()" class="bg-violet-600 hover:bg-violet-500 text-white font-semibold py-3 px-8 rounded-xl transition">
            Войти
          </button>
        </div>
      </section>
    `;
    return;
  }

  const want = GAMES.filter(g => state.userLists.want.includes(g.id));
  const playing = GAMES.filter(g => state.userLists.playing.includes(g.id));
  const completed = GAMES.filter(g => state.userLists.completed.includes(g.id));
  const rated = Object.keys(state.userRatings).length;
  const avgRating = rated > 0 ? (Object.values(state.userRatings).reduce((a, b) => a + b, 0) / rated).toFixed(1) : 0;

  container.innerHTML = `
    <section class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div class="glass-panel rounded-3xl p-8 mb-8 relative overflow-hidden">
        <div class="absolute top-0 right-0 w-96 h-96 bg-violet-600/10 rounded-full blur-3xl -mr-20 -mt-20"></div>
        <div class="relative flex flex-col md:flex-row items-center gap-6">
          <div class="w-24 h-24 rounded-full bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center font-bold text-3xl flex-shrink-0 ring-4 ring-zinc-900">
            ${state.currentUser.avatar}
          </div>
          <div class="text-center md:text-left flex-1">
            <h1 class="font-display font-bold text-3xl text-white mb-1">${state.currentUser.username}</h1>
            <p class="text-zinc-400 mb-4">На GameVault с ${state.currentUser.joinDate} · Игрок</p>
            <div class="flex gap-2 justify-center md:justify-start flex-wrap">
              <span class="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-amber-500/20 text-amber-400 border border-amber-500/30"><i class="fa-solid fa-fire mr-1"></i> Активный</span>
              <span class="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-violet-500/20 text-violet-400 border border-violet-500/30"><i class="fa-solid fa-gamepad mr-1"></i> Геймер</span>
            </div>
          </div>
          <button onclick="editProfile()" class="bg-zinc-800 hover:bg-zinc-700 text-white font-semibold py-2.5 px-5 rounded-xl transition border border-zinc-700 flex items-center gap-2">
            <i class="fa-solid fa-pen"></i> Редактировать
          </button>
        </div>
      </div>

      <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
        <div class="glass-panel rounded-2xl p-5 text-center">
          <div class="text-zinc-500 text-xs uppercase tracking-wider font-bold mb-2">Всего игр</div>
          <div class="font-display font-black text-3xl text-white">${want.length + playing.length + completed.length}</div>
        </div>
        <div class="glass-panel rounded-2xl p-5 text-center">
          <div class="text-zinc-500 text-xs uppercase tracking-wider font-bold mb-2">Оценок</div>
          <div class="font-display font-black text-3xl text-amber-400">${rated}</div>
        </div>
        <div class="glass-panel rounded-2xl p-5 text-center">
          <div class="text-zinc-500 text-xs uppercase tracking-wider font-bold mb-2">Средний балл</div>
          <div class="font-display font-black text-3xl text-violet-400">${avgRating}</div>
        </div>
        <div class="glass-panel rounded-2xl p-5 text-center">
          <div class="text-zinc-500 text-xs uppercase tracking-wider font-bold mb-2">Отзывов</div>
          <div class="font-display font-black text-3xl text-emerald-400">${state.userReviews.length}</div>
        </div>
      </div>

      <div class="space-y-10">
        ${renderList('🎯 Хочу пройти', want)}
        ${renderList('🎮 Сейчас играю', playing)}
        ${renderList('✅ Прошёл', completed)}
      </div>
    </section>
  `;
}

async function editProfile() {
  if (!state.currentUser) return;
  const newName = prompt('Введите новое имя пользователя:', state.currentUser.username);
  if (!newName || !newName.trim()) return;
  try {
    if (window.GVAuth) await GVAuth.setName(newName.trim());
    else { state.currentUser.username = newName.trim(); state.currentUser.avatar = newName.trim()[0].toUpperCase(); updateAuthUI(); }
    renderProfile(document.getElementById('main-content'));
    gvToast('Профиль обновлён');
  } catch (e) { gvToast('Не удалось обновить профиль'); }
}

function renderList(title, games) {
  if (games.length === 0) return `
    <div>
      <h2 class="font-display font-bold text-xl text-white mb-4">${title} <span class="text-zinc-600 text-base font-normal">(${games.length})</span></h2>
      <div class="glass-panel rounded-2xl p-12 text-center text-zinc-600 border-dashed border-2">
        <i class="fa-regular fa-folder-open text-3xl mb-3"></i>
        <p>Список пуст</p>
      </div>
    </div>
  `;
  return `
    <div>
      <h2 class="font-display font-bold text-xl text-white mb-4">${title} <span class="text-zinc-600 text-base font-normal">(${games.length})</span></h2>
      <div class="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
        ${games.map(g => gameCard(g)).join('')}
      </div>
    </div>
  `;
}
