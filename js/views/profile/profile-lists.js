// ===================================================================
// GameVault Profile Lists, Favorites & Collections
// Библиотека, списки (want, completed, dropped), Топ-4 витрина, коллекции и быстрый старт
// ===================================================================

const QUICK_START_GAME_IDS = [339958, 3328, 41494, 326243, 28, 3498];
window.QUICK_START_GAME_IDS = QUICK_START_GAME_IDS;

let currentFavSlot = 0;
let favPickerFilter = 'all';
let activeCollectionId = null;
let newCollectionSelectedGames = [];

// ---------------- Отрисовка списка игр ----------------
function renderList(title, games) {
  if (!games || games.length === 0) return '';
  return `
    <div>
      <h2 class="font-display font-bold text-xl text-white mb-4">${escapeHtml(title)} <span class="text-zinc-600 text-base font-normal">(${games.length})</span></h2>
      <div class="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
        ${games.map(g => typeof gameCard === 'function' ? gameCard(g) : '').join('')}
      </div>
    </div>
  `;
}
window.renderList = renderList;

// ---------------- Блок «Недавно просмотренные» ----------------
function renderRecentlyViewed() {
  const recentIds = state.recentlyViewed || [];
  const allGames = typeof GAMES !== 'undefined' ? GAMES : [];
  const games = allGames.filter(g => recentIds.includes(g.id))
    .sort((a, b) => recentIds.indexOf(a.id) - recentIds.indexOf(b.id))
    .slice(0, 6);

  if (games.length === 0) return '';

  return `
    <div class="glass-panel rounded-3xl p-5 sm:p-8 border border-zinc-800">
      <div class="flex items-center justify-between mb-5 flex-wrap gap-2">
        <div>
          <h2 class="font-display font-bold text-lg sm:text-2xl text-white flex items-center gap-2">
            <i class="fa-solid fa-clock-rotate-left text-violet-400"></i> Недавно просмотренные
          </h2>
          <p class="text-xs text-zinc-400 mt-0.5">Игры, которые вы открывали последними</p>
        </div>
        <button onclick="clearRecentlyViewed()" class="text-xs text-zinc-500 hover:text-red-400 transition cursor-pointer">Очистить историю</button>
      </div>
      <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        ${games.map(g => `
          <div onclick="showView('game', { gameId: ${g.id} })" class="bg-zinc-900/90 rounded-2xl border border-zinc-800 p-2.5 flex flex-col justify-between hover:border-violet-500/50 cursor-pointer transition shadow group">
            <div class="aspect-[3/4] rounded-xl overflow-hidden bg-zinc-950 mb-2 relative">
              <img src="${typeof optImg === 'function' ? optImg(g.cover, 240) : g.cover}" loading="lazy" referrerpolicy="no-referrer" onerror="if (typeof handleImgError === 'function') handleImgError(this, '${escapeHtml(g.cover)}');" class="w-full h-full object-cover transition-transform group-hover:scale-105" alt="${escapeHtml(g.title)}">
              <div class="absolute top-1 right-1 px-1.5 py-0.5 rounded bg-black/75 backdrop-blur text-[10px] font-bold text-amber-400">
                ★ ${g.rating}
              </div>
            </div>
            <h4 class="font-bold text-white text-xs truncate group-hover:text-violet-300 transition">${escapeHtml(g.title)}</h4>
            <p class="text-zinc-500 text-[10px] mt-0.5">${g.year} • ${g.genres ? g.genres[0] : 'Игра'}</p>
          </div>
        `).join('')}
      </div>
    </div>
  `;
}
window.renderRecentlyViewed = renderRecentlyViewed;

function clearRecentlyViewed() {
  state.recentlyViewed = [];
  saveUserData();
  if (typeof renderProfile === 'function') renderProfile(document.getElementById('main-content'));
  if (typeof gvToast === 'function') gvToast('История просмотров очищена');
}
window.clearRecentlyViewed = clearRecentlyViewed;

// ---------------- Витрина Топ-4 ----------------
function renderFavoritesShowcase() {
  const favs = state.userFavorites || [];
  const slots = [0, 1, 2, 3];
  const allGames = typeof GAMES !== 'undefined' ? GAMES : [];

  return `
    <div class="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-6">
      ${slots.map(i => {
        const gameId = favs[i];
        const game = gameId ? allGames.find(g => g.id === gameId) : null;

        if (game) {
          const userScore = state.userRatings && state.userRatings[game.id];
          return `
            <div class="group relative rounded-2xl overflow-hidden bg-zinc-900 border border-zinc-800 hover:border-amber-500/60 transition shadow-xl flex flex-col">
              <div class="relative aspect-[3/4] overflow-hidden bg-zinc-950 cursor-pointer" onclick="showView('game', { gameId: ${game.id} })">
                <img src="${typeof optImg === 'function' ? optImg(game.cover, 400) : game.cover}" loading="lazy" referrerpolicy="no-referrer" onerror="if (typeof handleImgError === 'function') handleImgError(this, '${escapeHtml(game.cover)}');" class="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" alt="${escapeHtml(game.title)}">
                <div class="absolute inset-0 bg-gradient-to-t from-zinc-950 via-transparent to-black/40"></div>

                <div class="absolute top-2.5 left-2.5 bg-amber-500 text-zinc-950 font-black text-[10px] sm:text-xs px-2 py-0.5 rounded-lg shadow-md">
                  #${i + 1}
                </div>

                <button onclick="removeFavoriteSlot(${i}, event)" class="absolute top-2.5 right-2.5 w-7 h-7 rounded-lg bg-black/70 hover:bg-red-600 text-zinc-300 hover:text-white transition flex items-center justify-center sm:opacity-0 group-hover:opacity-100 shadow-lg cursor-pointer" title="Очистить слот">
                  <i class="fa-solid fa-xmark text-xs"></i>
                </button>

                ${userScore ? `
                  <div class="absolute bottom-2.5 right-2.5 bg-amber-500/20 backdrop-blur-md text-amber-300 border border-amber-500/40 text-[11px] font-bold px-2 py-0.5 rounded-md flex items-center gap-1">
                    <i class="fa-solid fa-star text-[9px]"></i> ${userScore}
                  </div>
                ` : `
                  <div class="absolute bottom-2.5 right-2.5 bg-black/60 backdrop-blur-md text-zinc-300 text-[11px] font-medium px-2 py-0.5 rounded-md flex items-center gap-1">
                    <i class="fa-solid fa-star text-amber-400 text-[9px]"></i> ${game.rating}
                  </div>
                `}
              </div>
              <div class="p-2.5 sm:p-3 bg-zinc-900 flex-1 flex flex-col justify-between cursor-pointer" onclick="showView('game', { gameId: ${game.id} })">
                <div>
                  <h3 class="font-bold text-white text-xs sm:text-sm truncate group-hover:text-amber-400 transition">${escapeHtml(game.title)}</h3>
                  <p class="text-zinc-500 text-[11px] mt-0.5">${game.year} • ${game.genres ? game.genres[0] : 'Игра'}</p>
                </div>
              </div>
            </div>
          `;
        }

        return `
          <div onclick="openFavoritePickerModal(${i})" class="aspect-[3/4] rounded-2xl border-2 border-dashed border-zinc-800 hover:border-amber-500/60 bg-zinc-900/30 hover:bg-zinc-900/70 transition flex flex-col items-center justify-center p-3 sm:p-4 text-center cursor-pointer group shadow-inner">
            <div class="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-zinc-800 group-hover:bg-amber-500/20 text-zinc-500 group-hover:text-amber-400 border border-zinc-700/60 group-hover:border-amber-500/40 flex items-center justify-center mb-2 sm:mb-3 transition-transform group-hover:scale-110">
              <i class="fa-solid fa-plus text-base sm:text-lg"></i>
            </div>
            <span class="font-bold text-xs sm:text-sm text-zinc-300 group-hover:text-white transition">Слот #${i + 1}</span>
            <span class="text-[11px] text-zinc-500 mt-0.5">Выбрать игру</span>
          </div>
        `;
      }).join('')}
    </div>
  `;
}
window.renderFavoritesShowcase = renderFavoritesShowcase;

function removeFavoriteSlot(index, event) {
  if (event) event.stopPropagation();
  state.userFavorites = state.userFavorites || [];
  state.userFavorites[index] = null;
  saveUserData();
  if (typeof renderProfile === 'function') renderProfile(document.getElementById('main-content'));
  if (typeof gvToast === 'function') gvToast('Слот очищен');
}
window.removeFavoriteSlot = removeFavoriteSlot;

// ---------------- Быстрый старт ----------------
function renderQuickStart(lists) {
  const allGames = typeof GAMES !== 'undefined' ? GAMES : [];
  const quickGames = allGames.filter(g => QUICK_START_GAME_IDS.includes(g.id));

  return `
    <div class="glass-panel rounded-3xl p-5 sm:p-8 border border-zinc-800 relative overflow-hidden">
      <div class="flex items-center justify-between mb-5 flex-wrap gap-3">
        <div>
          <h2 class="font-display font-bold text-lg sm:text-2xl text-white flex items-center gap-2">
            <i class="fa-solid fa-bolt text-amber-400"></i> Быстрый старт: соберите свою коллекцию
          </h2>
          <p class="text-xs text-zinc-400 mt-0.5">Оцените или добавьте культовые игры в 1 клик, чтобы профиль ожил статистикой:</p>
        </div>
        <button onclick="rollRandomGame()" class="bg-violet-600/20 hover:bg-violet-600/30 text-violet-300 border border-violet-500/40 text-xs font-semibold px-3.5 py-2 rounded-xl transition flex items-center gap-1.5 cursor-pointer">
          <i class="fa-solid fa-dice text-amber-400 text-sm"></i> Случайная игра
        </button>
      </div>

      <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        ${quickGames.map(g => {
          const isCompleted = (state.userLists.completed || []).includes(g.id);
          const isWant = (state.userLists.want || []).includes(g.id);

          return `
            <div class="bg-zinc-900/90 rounded-2xl border border-zinc-800 p-2.5 flex flex-col justify-between hover:border-zinc-700 transition shadow-lg">
              <div class="cursor-pointer" onclick="showView('game', { gameId: ${g.id} })">
                <div class="aspect-[3/4] rounded-xl overflow-hidden bg-zinc-950 mb-2 relative">
                  <img src="${typeof optImg === 'function' ? optImg(g.cover, 240) : g.cover}" loading="lazy" referrerpolicy="no-referrer" onerror="if (typeof handleImgError === 'function') handleImgError(this, '${escapeHtml(g.cover)}');" class="w-full h-full object-cover" alt="${escapeHtml(g.title)}">
                  <div class="absolute top-1 right-1 px-1.5 py-0.5 rounded bg-black/75 backdrop-blur text-[10px] font-bold text-amber-400">
                    ★ ${g.rating}
                  </div>
                </div>
                <h4 class="font-bold text-white text-xs truncate mb-1">${escapeHtml(g.title)}</h4>
              </div>

              <div class="space-y-1.5 mt-2">
                <button onclick="quickAddGame(${g.id}, 'completed')" class="w-full py-1.5 rounded-lg text-xs font-medium transition flex items-center justify-center gap-1 cursor-pointer ${isCompleted ? 'bg-emerald-600 text-white font-bold' : 'bg-zinc-800 hover:bg-zinc-700 text-zinc-300'}">
                  <i class="fa-solid ${isCompleted ? 'fa-check' : 'fa-circle-check'} text-[11px]"></i> ${isCompleted ? 'Пройдено' : 'Прошёл'}
                </button>
                <button onclick="quickAddGame(${g.id}, 'want')" class="w-full py-1.5 rounded-lg text-xs font-medium transition flex items-center justify-center gap-1 cursor-pointer ${isWant ? 'bg-violet-600 text-white font-bold' : 'bg-zinc-800/60 hover:bg-zinc-700 text-zinc-400'}">
                  <i class="fa-solid ${isWant ? 'fa-bookmark' : 'fa-plus'} text-[11px]"></i> ${isWant ? 'В желаемом' : 'Хочу'}
                </button>
              </div>
            </div>
          `;
        }).join('')}
      </div>
    </div>
  `;
}
window.renderQuickStart = renderQuickStart;

function quickAddGame(gameId, list) {
  if (!state.currentUser) {
    if (typeof showAuthModal === 'function') showAuthModal();
    if (typeof gvToast === 'function') gvToast('Войдите, чтобы отмечать игры');
    return;
  }
  const lists = ['want', 'completed', 'dropped'];
  lists.forEach(l => { state.userLists[l] = state.userLists[l].filter(id => id !== gameId); });
  if (!state.userLists[list].includes(gameId)) state.userLists[list].push(gameId);
  saveUserData();
  if (typeof broadcastSyncEvent === 'function') {
    broadcastSyncEvent('LIST_UPDATED', {
      uid: state.currentUser ? state.currentUser.id : 'guest',
      userLists: state.userLists,
      gameId,
      list
    });
  }
  if (typeof renderProfile === 'function') renderProfile(document.getElementById('main-content'));
  if (typeof gvToast === 'function') gvToast(list === 'completed' ? 'Отмечено как пройденное!' : 'Добавлено в желаемое!');
}
window.quickAddGame = quickAddGame;

function rollRandomGame() {
  const allGames = typeof GAMES !== 'undefined' ? GAMES : [];
  const topPool = allGames.filter(g => g.rating >= 8.5 && g.cover);
  const randomGame = topPool[Math.floor(Math.random() * topPool.length)];
  if (randomGame) {
    showView('game', { gameId: randomGame.id });
    if (typeof gvToast === 'function') gvToast('🎲 Случайный выбор: ' + randomGame.title);
  }
}
window.rollRandomGame = rollRandomGame;

// ---------------- Вкладка «Коллекции» ----------------
function renderCollectionsTab() {
  const collections = state.userCollections || [];

  return `
    <div class="space-y-6">
      <div class="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 class="font-display font-bold text-xl sm:text-2xl text-white flex items-center gap-2">
            <i class="fa-solid fa-layer-group text-violet-400"></i> Мои коллекции
          </h2>
          <p class="text-xs text-zinc-400 mt-0.5">Создавайте персональные тематические списки игр</p>
        </div>
        <button onclick="openCollectionModal()" class="bg-violet-600 hover:bg-violet-500 text-white font-semibold px-4 py-2 rounded-xl transition text-xs sm:text-sm flex items-center gap-2 shadow-lg shadow-violet-600/30 cursor-pointer">
          <i class="fa-solid fa-plus"></i> Создать коллекцию
        </button>
      </div>

      ${collections.length === 0 ? `
        <div class="py-16 text-center border-2 border-dashed border-zinc-800 rounded-3xl p-8">
          <div class="text-6xl mb-4">📚</div>
          <h3 class="text-lg font-bold text-white mb-2">У вас пока нет коллекций</h3>
          <p class="text-zinc-500 text-sm max-w-md mx-auto mb-6">Объединяйте игры по франшизам, настроению или планам на прохождение в удобные коллекции</p>
          <button onclick="openCollectionModal()" class="bg-violet-600 hover:bg-violet-500 text-white font-semibold px-5 py-2.5 rounded-xl transition text-sm cursor-pointer">
            Создать первую коллекцию
          </button>
        </div>
      ` : `
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          ${collections.map(c => renderCollectionCard(c)).join('')}
        </div>
      `}
    </div>
  `;
}
window.renderCollectionsTab = renderCollectionsTab;

function renderCollectionCard(c) {
  const gameIds = c.gameIds || [];
  const allGames = typeof GAMES !== 'undefined' ? GAMES : [];
  const games = allGames.filter(g => gameIds.includes(g.id)).slice(0, 4);

  return `
    <div class="glass-panel rounded-2xl border border-zinc-800 hover:border-violet-500/50 p-4 transition flex flex-col justify-between group shadow-xl">
      <div>
        <div class="grid grid-cols-2 gap-1.5 aspect-video rounded-xl overflow-hidden bg-zinc-950 mb-3 border border-zinc-800/80">
          ${games.length > 0 ? games.map(g => `
            <img src="${typeof optImg === 'function' ? optImg(g.cover, 240) : g.cover}" loading="lazy" referrerpolicy="no-referrer" onerror="if (typeof handleImgError === 'function') handleImgError(this, '${escapeHtml(g.cover)}');" class="w-full h-full object-cover" alt="">
          `).join('') : `
            <div class="col-span-2 flex items-center justify-center text-zinc-600 text-3xl">
              <i class="fa-solid fa-gamepad"></i>
            </div>
          `}
        </div>

        <div class="flex items-start justify-between gap-2 mb-1">
          <h3 class="font-bold text-white text-base group-hover:text-violet-400 transition truncate">${escapeHtml(c.title)}</h3>
          <span class="text-xs px-2 py-0.5 rounded-md bg-zinc-800 text-zinc-400 font-mono flex-shrink-0">${gameIds.length} игр</span>
        </div>
        ${c.desc ? `<p class="text-zinc-400 text-xs line-clamp-2 mb-3">${escapeHtml(c.desc)}</p>` : ''}
      </div>

      <div class="flex items-center justify-between pt-3 border-t border-zinc-800/60 mt-3 text-xs">
        <button onclick="openCollectionModal('${c.id}')" class="text-violet-400 hover:text-violet-300 font-semibold flex items-center gap-1 cursor-pointer">
          <i class="fa-solid fa-pen-to-square"></i> Редактировать
        </button>
        <button onclick="deleteUserCollection('${c.id}')" class="text-zinc-500 hover:text-red-400 transition cursor-pointer" title="Удалить коллекцию">
          <i class="fa-solid fa-trash-can"></i>
        </button>
      </div>
    </div>
  `;
}
window.renderCollectionCard = renderCollectionCard;

function openCollectionModal(collectionId) {
  activeCollectionId = collectionId || null;
  const modal = document.getElementById('collection-modal');
  if (!modal) return;

  const titleEl = document.getElementById('collection-modal-title');
  const titleInput = document.getElementById('coll-title');
  const descInput = document.getElementById('coll-desc');

  if (collectionId) {
    const existing = (state.userCollections || []).find(c => c.id === collectionId);
    if (existing) {
      if (titleEl) titleEl.textContent = 'Редактировать коллекцию';
      if (titleInput) titleInput.value = existing.title || '';
      if (descInput) descInput.value = existing.desc || '';
      newCollectionSelectedGames = [...(existing.gameIds || [])];
    }
  } else {
    if (titleEl) titleEl.textContent = 'Создать коллекцию';
    if (titleInput) titleInput.value = '';
    if (descInput) descInput.value = '';
    newCollectionSelectedGames = [];
  }

  const searchEl = document.getElementById('coll-game-search');
  if (searchEl) searchEl.value = '';
  const countEl = document.getElementById('coll-selected-count');
  if (countEl) countEl.textContent = newCollectionSelectedGames.length;
  filterCollectionGamePicker();

  modal.classList.remove('hidden-view');
}
window.openCollectionModal = openCollectionModal;

function closeCollectionModal() {
  const modal = document.getElementById('collection-modal');
  if (modal) modal.classList.add('hidden-view');
}
window.closeCollectionModal = closeCollectionModal;

function filterCollectionGamePicker() {
  const searchEl = document.getElementById('coll-game-search');
  const q = (searchEl ? searchEl.value : '').trim().toLowerCase();
  const listEl = document.getElementById('coll-games-picker-list');
  if (!listEl) return;

  const allGames = typeof GAMES !== 'undefined' ? GAMES : [];
  let pool = allGames;
  if (q) {
    pool = pool.filter(g => g.title.toLowerCase().includes(q));
  } else {
    const userIds = [...(state.userLists.completed || []), ...(state.userLists.want || [])];
    const userGames = allGames.filter(g => userIds.includes(g.id));
    pool = userGames.concat(allGames.slice(0, 30));
  }

  const unique = [];
  const seen = new Set();
  for (const g of pool) {
    if (!seen.has(g.id)) { seen.add(g.id); unique.push(g); }
    if (unique.length >= 25) break;
  }

  listEl.innerHTML = unique.map(g => {
    const isSelected = newCollectionSelectedGames.includes(g.id);
    return `
      <div onclick="toggleCollectionGame(${g.id})" class="flex items-center gap-3 p-2 rounded-xl cursor-pointer transition ${isSelected ? 'bg-violet-600/25 border border-violet-500/50' : 'bg-zinc-900/60 border border-zinc-800 hover:bg-zinc-800'}">
        <img src="${typeof optImg === 'function' ? optImg(g.cover, 120) : g.cover}" loading="lazy" referrerpolicy="no-referrer" onerror="if (typeof handleImgError === 'function') handleImgError(this, '${escapeHtml(g.cover)}');" class="w-8 h-10 object-cover rounded bg-zinc-950 flex-shrink-0" alt="">
        <div class="flex-1 min-w-0">
          <div class="font-bold text-xs text-white truncate">${escapeHtml(g.title)}</div>
          <div class="text-[10px] text-zinc-400">${g.year} • ★ ${g.rating}</div>
        </div>
        <div class="w-6 h-6 rounded-lg flex items-center justify-center text-xs font-bold ${isSelected ? 'bg-violet-600 text-white' : 'bg-zinc-800 text-zinc-500 border border-zinc-700'}">
          ${isSelected ? '✓' : '+'}
        </div>
      </div>
    `;
  }).join('');
}
window.filterCollectionGamePicker = filterCollectionGamePicker;

function toggleCollectionGame(gameId) {
  if (newCollectionSelectedGames.includes(gameId)) {
    newCollectionSelectedGames = newCollectionSelectedGames.filter(id => id !== gameId);
  } else {
    newCollectionSelectedGames.push(gameId);
  }
  const countEl = document.getElementById('coll-selected-count');
  if (countEl) countEl.textContent = newCollectionSelectedGames.length;
  filterCollectionGamePicker();
}
window.toggleCollectionGame = toggleCollectionGame;

function saveUserCollection() {
  const titleEl = document.getElementById('coll-title');
  const descEl = document.getElementById('coll-desc');
  const title = titleEl ? titleEl.value.trim() : '';
  const desc = descEl ? descEl.value.trim() : '';

  if (!title) {
    if (typeof gvToast === 'function') gvToast('Введите название коллекции');
    return;
  }

  state.userCollections = state.userCollections || [];

  if (activeCollectionId) {
    const idx = state.userCollections.findIndex(c => c.id === activeCollectionId);
    if (idx !== -1) {
      state.userCollections[idx].title = title;
      state.userCollections[idx].desc = desc;
      state.userCollections[idx].gameIds = newCollectionSelectedGames;
    }
  } else {
    state.userCollections.push({
      id: 'coll_' + Date.now(),
      title,
      desc,
      gameIds: newCollectionSelectedGames,
      createdAt: new Date().toLocaleDateString('ru-RU')
    });
  }

  saveUserData();
  closeCollectionModal();
  if (typeof renderProfile === 'function') renderProfile(document.getElementById('main-content'));
  if (typeof gvToast === 'function') gvToast('Коллекция сохранена!');
}
window.saveUserCollection = saveUserCollection;

async function deleteUserCollection(collectionId) {
  const ok = typeof gvConfirm === 'function'
    ? await gvConfirm('Вы уверены, что хотите удалить эту коллекцию? Список добавленных игр сохранится в основном каталоге.', {
        title: 'Удаление коллекции',
        confirmText: 'Удалить коллекцию',
        cancelText: 'Отмена',
        danger: true,
        icon: 'fa-solid fa-folder-minus'
      })
    : confirm('Удалить эту коллекцию?');
  if (!ok) return;
  state.userCollections = (state.userCollections || []).filter(c => c.id !== collectionId);
  saveUserData();
  if (typeof renderProfile === 'function') renderProfile(document.getElementById('main-content'));
  if (typeof gvToast === 'function') gvToast('Коллекция удалена');
}
window.deleteUserCollection = deleteUserCollection;

// ---------------- Модалка выбора любимой игры ----------------
function openFavoritePickerModal(slotIndex) {
  currentFavSlot = slotIndex;
  const modal = document.getElementById('favorite-picker-modal');
  if (!modal) return;

  const slotTitle = document.getElementById('fav-picker-slot-title');
  if (slotTitle) slotTitle.textContent = `Выбор игры для слота #${slotIndex + 1}`;
  const searchInput = document.getElementById('fav-search-input');
  if (searchInput) searchInput.value = '';
  favPickerFilter = 'all';

  document.querySelectorAll('.fav-filter-btn').forEach(b => {
    b.classList.toggle('bg-violet-600', b.dataset.filter === 'all');
    b.classList.toggle('text-white', b.dataset.filter === 'all');
    b.classList.toggle('bg-zinc-800', b.dataset.filter !== 'all');
    b.classList.toggle('text-zinc-400', b.dataset.filter !== 'all');
  });

  filterFavoritePicker();
  modal.classList.remove('hidden-view');
  setTimeout(() => {
    const input = document.getElementById('fav-search-input');
    if (input) input.focus();
  }, 80);
}
window.openFavoritePickerModal = openFavoritePickerModal;

function closeFavoritePickerModal() {
  const modal = document.getElementById('favorite-picker-modal');
  if (modal) modal.classList.add('hidden-view');
}
window.closeFavoritePickerModal = closeFavoritePickerModal;

function setFavPickerFilter(mode) {
  favPickerFilter = mode;
  document.querySelectorAll('.fav-filter-btn').forEach(b => {
    const active = b.dataset.filter === mode;
    b.classList.toggle('bg-violet-600', active);
    b.classList.toggle('text-white', active);
    b.classList.toggle('bg-zinc-800', !active);
    b.classList.toggle('text-zinc-400', !active);
  });
  filterFavoritePicker();
}
window.setFavPickerFilter = setFavPickerFilter;

function filterFavoritePicker() {
  const searchInput = document.getElementById('fav-search-input');
  const query = (searchInput ? searchInput.value : '').trim().toLowerCase();
  const listEl = document.getElementById('fav-picker-list');
  if (!listEl) return;

  const isVis = typeof isGameVisible === 'function' ? isGameVisible : () => true;
  const allGames = typeof GAMES !== 'undefined' ? GAMES : [];
  let pool = allGames.filter(isVis);

  if (favPickerFilter === 'my') {
    const myIds = [...(state.userLists.completed || []), ...(state.userLists.want || [])];
    pool = pool.filter(g => myIds.includes(g.id));
  } else if (favPickerFilter === 'rpg') {
    pool = pool.filter(g => g.genres && g.genres.some(gen => gen.toLowerCase().includes('rpg')));
  } else if (favPickerFilter === 'action') {
    pool = pool.filter(g => g.genres && g.genres.some(gen => gen.toLowerCase().includes('экшен') || gen.toLowerCase().includes('action')));
  }

  if (query) {
    pool = pool.filter(g => g.title.toLowerCase().includes(query));
  }

  const results = pool.slice(0, 30);

  if (results.length === 0) {
    listEl.innerHTML = `<div class="text-center py-12 text-zinc-500 text-sm">Ничего не найдено. Попробуйте другой запрос</div>`;
    return;
  }

  listEl.innerHTML = results.map(g => `
    <div onclick="selectFavoriteGame(${g.id})" class="flex items-center gap-3.5 p-2.5 rounded-xl bg-zinc-900/60 hover:bg-violet-600/20 border border-zinc-800/80 hover:border-violet-500/50 cursor-pointer transition group">
      <img src="${typeof optImg === 'function' ? optImg(g.cover, 120) : g.cover}" loading="lazy" referrerpolicy="no-referrer" onerror="if (typeof handleImgError === 'function') handleImgError(this, '${escapeHtml(g.cover)}');" class="w-12 h-16 object-cover rounded-lg bg-zinc-950 flex-shrink-0 shadow" alt="">
      <div class="flex-1 min-w-0">
        <h4 class="font-bold text-white text-sm truncate group-hover:text-violet-300 transition">${escapeHtml(g.title)}</h4>
        <p class="text-xs text-zinc-400 mt-0.5">${gameDeveloperLabel(g)}</p>
        <div class="flex items-center gap-2 mt-1 text-[11px] text-amber-400">
          <i class="fa-solid fa-star text-[10px]"></i> <b>${g.rating}</b>
        </div>
      </div>
      <button class="px-3 py-1.5 rounded-lg bg-violet-600 group-hover:bg-violet-500 text-white text-xs font-semibold transition cursor-pointer">
        Выбрать
      </button>
    </div>
  `).join('');
}
window.filterFavoritePicker = filterFavoritePicker;

function gameDeveloperLabel(g) {
  const parts = [];
  if (g.year) parts.push(g.year);
  if (g.developer && g.developer !== '—') parts.push(escapeHtml(g.developer));
  else if (g.genres && g.genres[0]) parts.push(g.genres[0]);
  return parts.join(' • ');
}
window.gameDeveloperLabel = gameDeveloperLabel;

function selectFavoriteGame(gameId) {
  state.userFavorites = state.userFavorites || [];
  state.userFavorites[currentFavSlot] = gameId;
  saveUserData();
  closeFavoritePickerModal();
  if (typeof renderProfile === 'function') renderProfile(document.getElementById('main-content'));
  if (typeof gvToast === 'function') gvToast('Игра добавлена в Золотую коллекцию!');
}
window.selectFavoriteGame = selectFavoriteGame;
