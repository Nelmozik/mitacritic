// Действия пользователя
// Переключает вкладки на странице игры (Обзор / Медиа / Отзывы): скрываем все, показываем нужную
function switchTab(tab) {
  document.querySelectorAll('.tab-btn').forEach(t => {
    t.classList.remove('text-white', 'border-violet-500');
    t.classList.add('text-zinc-500', 'border-transparent');
  });
  const activeBtn = document.querySelector(`.tab-btn[data-tab="${tab}"]`);
  activeBtn.classList.remove('text-zinc-500', 'border-transparent');
  activeBtn.classList.add('text-white', 'border-violet-500');
  
  document.querySelectorAll('.tab-content').forEach(c => c.classList.add('hidden-view'));
  document.getElementById(`tab-${tab}`).classList.remove('hidden-view');
}

// Добавляет игру в список («Хочу», «Играю» и т.д.) или убирает её оттуда. Без входа в аккаунт не работает
function toggleList(gameId, list) {
  if (!state.currentUser) {
    showAuthModal();
    gvToast('Пожалуйста, войдите в аккаунт, чтобы добавлять игры в списки');
    return;
  }
  
  const lists = ['want', 'playing', 'completed', 'dropped'];
  lists.forEach(l => { state.userLists[l] = state.userLists[l].filter(id => id !== gameId); });
  if (!state.userLists[list].includes(gameId)) state.userLists[list].push(gameId);
  
  const btn = event.currentTarget;
  const originalHTML = btn.innerHTML;
  btn.innerHTML = '<i class="fa-solid fa-check"></i> Добавлено';
  btn.classList.add('bg-emerald-600', 'border-emerald-600', 'text-white');
  setTimeout(() => {
    btn.innerHTML = originalHTML;
    btn.classList.remove('bg-emerald-600', 'border-emerald-600', 'text-white');
  }, 1500);
  
  if (state.currentView === 'profile') showView('profile');
}

// Сохраняет оценку игры от пользователя (пока только в памяти страницы)
function rateGame(gameId, score) {
  if (!state.currentUser) {
    showAuthModal();
    gvToast('Пожалуйста, войдите в аккаунт, чтобы оценить игру');
    return;
  }
  
  state.userRatings[gameId] = score;
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
