// Действия пользователя
// Сохранение и загрузка данных пользователя в localStorage
function saveUserData() {
  const uid = state.currentUser ? state.currentUser.id : 'guest';
  try {
    localStorage.setItem('gv_lists_' + uid, JSON.stringify(state.userLists));
    localStorage.setItem('gv_ratings_' + uid, JSON.stringify(state.userRatings));
    localStorage.setItem('gv_favs_' + uid, JSON.stringify(state.userFavorites || []));
    localStorage.setItem('gv_collections_' + uid, JSON.stringify(state.userCollections || []));
    localStorage.setItem('gv_recent_' + uid, JSON.stringify(state.recentlyViewed || []));
    localStorage.setItem('gv_custom_' + uid, JSON.stringify(state.userCustom || {}));
  } catch (e) {}
}

function loadUserData() {
  const uid = state.currentUser ? state.currentUser.id : 'guest';
  try {
    const l = localStorage.getItem('gv_lists_' + uid);
    if (l) state.userLists = JSON.parse(l);
    const r = localStorage.getItem('gv_ratings_' + uid);
    if (r) state.userRatings = JSON.parse(r);
    const f = localStorage.getItem('gv_favs_' + uid);
    if (f) state.userFavorites = JSON.parse(f);
    const cols = localStorage.getItem('gv_collections_' + uid);
    if (cols) state.userCollections = JSON.parse(cols);
    const rec = localStorage.getItem('gv_recent_' + uid);
    if (rec) state.recentlyViewed = JSON.parse(rec);
    const c = localStorage.getItem('gv_custom_' + uid);
    if (c) state.userCustom = JSON.parse(c);
    if (window.applyTheme) window.applyTheme();
    if (window.updateAuthUI) window.updateAuthUI();
  } catch (e) {}
}

// Загружаем данные при старте скрипта
loadUserData();

// Сохраняет просмотр игры в истории
function trackRecentlyViewed(gameId) {
  if (!gameId) return;
  state.recentlyViewed = (state.recentlyViewed || []).filter(id => id !== gameId);
  state.recentlyViewed.unshift(gameId);
  if (state.recentlyViewed.length > 12) state.recentlyViewed = state.recentlyViewed.slice(0, 12);
  saveUserData();
}

// Добавляет игру в список («Хочу пройти», «Прошёл» и т.д.) или убирает её оттуда. Без входа в аккаунт не работает
function toggleList(gameId, list) {
  if (!state.currentUser) {
    showAuthModal();
    gvToast('Пожалуйста, войдите в аккаунт, чтобы добавлять игры в списки');
    return;
  }
  
  const lists = ['want', 'completed', 'dropped'];
  lists.forEach(l => { state.userLists[l] = state.userLists[l].filter(id => id !== gameId); });
  if (!state.userLists[list].includes(gameId)) state.userLists[list].push(gameId);
  saveUserData();
  if (window.GVAudio) window.GVAudio.playAdd();
  if (window.updateAuthUI) updateAuthUI();
  
  const btn = event ? event.currentTarget : null;
  if (btn) {
    const originalHTML = btn.innerHTML;
    btn.innerHTML = '<i class="fa-solid fa-check"></i> Добавлено';
    btn.classList.add('bg-emerald-600', 'border-emerald-600', 'text-white');
    setTimeout(() => {
      btn.innerHTML = originalHTML;
      btn.classList.remove('bg-emerald-600', 'border-emerald-600', 'text-white');
      if (state.currentView === 'game') renderGamePage(document.getElementById('main-content'));
    }, 1500);
  }
  
  if (state.currentView === 'profile') showView('profile');
}

// Сохраняет оценку игры от пользователя
function rateGame(gameId, score) {
  if (!state.currentUser) {
    showAuthModal();
    gvToast('Пожалуйста, войдите в аккаунт, чтобы оценить игру');
    return;
  }
  
  state.userRatings[gameId] = score;
  saveUserData();
  if (window.GVAudio) window.GVAudio.playAdd();
  showView('game', { gameId });
}

// Ставит лайк отзыву: находим отзыв по id, увеличиваем счётчик и перерисовываем страницу
function likeReview(reviewId) {
  // ищем отзыв по id среди отзывов всех игр
  Object.values(REVIEWS).forEach(reviews => {
    const r = reviews.find(x => x.id === reviewId);
    if (r) { 
      r.likes++; 
      if (state.currentView === 'game') {
        renderGamePage(document.getElementById('main-content'));
      }
    }
  });
}

// Открывает скриншот на весь экран. Клик по фону закрывает его
function openLightbox(src) {
  const overlay = document.createElement('div');
  overlay.className = 'fixed inset-0 z-[100] bg-black/90 backdrop-blur-md flex items-center justify-center p-4 animate-fade cursor-zoom-out';
  overlay.onclick = () => overlay.remove();
  overlay.innerHTML = `<img src="${src}" class="max-w-full max-h-[90vh] rounded-xl shadow-2xl border border-zinc-800">`;
  document.body.appendChild(overlay);
}
