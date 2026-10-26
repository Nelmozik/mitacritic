// Профиль
// Экранирует спецсимволы в тексте, чтобы имя пользователя нельзя было использовать для вставки HTML-кода
function escapeHtml(text) {
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// Пустая страница с эмодзи и подписью (например, «Пока нет подписчиков»)
function profileEmpty(emoji, text) {
  return `
    <div class="py-20 text-center">
      <div class="text-7xl mb-4">${emoji}</div>
      <p class="text-zinc-500">${text}</p>
    </div>
  `;
}

// Профиль пользователя: шапка с именем, вкладки и содержимое выбранной вкладки.
// Без входа в аккаунт показывает приглашение войти
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

  // списки игр пользователя (в state лежат только id, поэтому ищем сами игры в каталоге)
  const want = GAMES.filter(g => state.userLists.want.includes(g.id));
  const playing = GAMES.filter(g => state.userLists.playing.includes(g.id));
  const completed = GAMES.filter(g => state.userLists.completed.includes(g.id));
  const dropped = GAMES.filter(g => state.userLists.dropped.includes(g.id));
  const library = playing.length + completed.length + dropped.length;

  // вкладки профиля: id, название и число (если оно нужно)
  const tabs = [
    { id: 'overview', label: 'Обзор', count: 0 },
    { id: 'library', label: 'Библиотека', count: library },
    { id: 'wishlist', label: 'Желаемое', count: want.length },
    { id: 'reviews', label: 'Отзывы', count: state.userReviews.length },
    { id: 'collections', label: 'Коллекции', count: 0 },
    { id: 'following', label: 'Подписки', count: 0 },
    { id: 'followers', label: 'Подписчики', count: 0 }
  ];

  const name = escapeHtml(state.currentUser.username);
  const avatar = state.currentUser.photo
    ? `<img src="${escapeHtml(state.currentUser.photo)}" referrerpolicy="no-referrer" class="w-full h-full object-cover" alt="">`
    : escapeHtml(state.currentUser.avatar);

  container.innerHTML = `
    <section class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <!-- шапка: имя, аватар и кнопки -->
      <div class="flex items-center justify-between gap-4 flex-wrap mb-8">
        <div class="flex items-center gap-4 min-w-0">
          <h1 class="font-display font-black text-4xl md:text-6xl text-white truncate">${name}</h1>
          <div class="w-12 h-12 md:w-20 md:h-20 rounded-full overflow-hidden bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center font-bold text-xl md:text-3xl text-white flex-shrink-0">
            ${avatar}
          </div>
        </div>
        <div class="flex gap-2">
          <button onclick="editProfile()" class="bg-white hover:bg-zinc-200 text-zinc-900 font-semibold px-5 py-2.5 rounded-lg transition">Настройки</button>
          <button onclick="shareProfile()" class="bg-white hover:bg-zinc-200 text-zinc-900 w-11 h-11 rounded-lg transition" title="Скопировать ссылку" aria-label="Поделиться">
            <i class="fa-solid fa-share"></i>
          </button>
        </div>
      </div>

      <!-- вкладки (на телефоне прокручиваются в стороны) -->
      <nav class="flex gap-6 md:gap-8 border-b border-zinc-800 mb-10 overflow-x-auto">
        ${tabs.map(t => `
          <button onclick="switchProfileTab('${t.id}')" class="pb-3 -mb-px border-b-2 whitespace-nowrap transition ${state.profileTab === t.id ? 'text-white border-white' : 'text-zinc-500 border-transparent hover:text-zinc-300'}">
            ${t.label}${t.count > 0 ? `<span class="text-xs text-zinc-600 ml-1.5">${t.count}</span>` : ''}
          </button>
        `).join('')}
      </nav>

      <!-- содержимое выбранной вкладки -->
      <div>${renderProfileTab(state.profileTab, { want, playing, completed, dropped })}</div>
    </section>
  `;
}

// Возвращает HTML для одной вкладки профиля
function renderProfileTab(tab, lists) {
  const { want, playing, completed, dropped } = lists;

  if (tab === 'overview') {
    // статистика по оценкам и спискам
    const rated = Object.keys(state.userRatings).length;
    const avgRating = rated > 0
      ? (Object.values(state.userRatings).reduce((a, b) => a + b, 0) / rated).toFixed(1)
      : 0;
    return `
      <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
        <div class="glass-panel rounded-2xl p-5 text-center">
          <div class="text-zinc-500 text-xs uppercase tracking-wider font-bold mb-2">Всего игр</div>
          <div class="font-display font-black text-3xl text-white">${want.length + playing.length + completed.length + dropped.length}</div>
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
      <p class="text-zinc-500 text-sm">На GameVault с ${state.currentUser.joinDate}</p>
    `;
  }

  if (tab === 'library') {
    return `
      <div class="space-y-10">
        ${renderList('Сейчас играю', playing)}
        ${renderList('Прошёл', completed)}
        ${renderList('Бросил', dropped)}
      </div>
    `;
  }

  if (tab === 'wishlist') return renderList('Хочу пройти', want);

  if (tab === 'reviews') {
    if (state.userReviews.length === 0) return profileEmpty('✍️', 'Вы ещё не написали ни одного отзыва');
    return `<div class="space-y-4 max-w-3xl">${state.userReviews.map(r => reviewCard(r)).join('')}</div>`;
  }

  // коллекции и подписки пока не работают (нужна база данных), поэтому показываем пустые страницы
  if (tab === 'collections') return profileEmpty('📚', 'У вас пока нет коллекций');
  if (tab === 'following') return profileEmpty('😴', 'Вы пока ни на кого не подписаны');
  if (tab === 'followers') return profileEmpty('😴', 'Пока нет подписчиков');

  return '';
}

// Переключение вкладки профиля: запоминаем выбор и перерисовываем профиль без прокрутки наверх
function switchProfileTab(tab) {
  state.profileTab = tab;
  renderProfile(document.getElementById('main-content'));
}

// Кнопка «Поделиться»: копируем адрес сайта в буфер обмена
function shareProfile() {
  const url = location.origin + location.pathname;
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(url)
      .then(() => gvToast('Ссылка скопирована'))
      .catch(() => gvToast('Не удалось скопировать ссылку'));
  } else {
    gvToast('Скопируйте адрес из строки браузера');
  }
}

// Смена имени пользователя через Firebase
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

// Вспомогательная функция: рисует один список игр в профиле (заголовок и карточки)
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
