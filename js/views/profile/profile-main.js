// ===================================================================
// GameVault Profile Main View
// Точка входа в профиль (свой и публичный), роутинг вкладок и шапка игрока
// ===================================================================

function profileEmpty(emoji, text) {
  return `
    <div class="py-16 text-center">
      <div class="text-6xl mb-4">${emoji}</div>
      <p class="text-zinc-500 max-w-sm mx-auto text-sm leading-relaxed">${escapeHtml(text)}</p>
    </div>
  `;
}
window.profileEmpty = profileEmpty;

// ---------------- Отрисовка страницы профиля ----------------
function renderProfile(container) {
  if (!container) return;

  // 1. Проверяем: смотрим ли мы профиль другого игрока
  const targetUsername = state.viewingProfile;
  const isSelf = !targetUsername || (state.currentUser && targetUsername.toLowerCase() === state.currentUser.username.toLowerCase());

  if (!isSelf) {
    renderPublicProfilePage(container, targetUsername);
    return;
  }

  // 2. Свой профиль: если не авторизован - экран входа
  if (!state.currentUser) {
    container.innerHTML = `
      <section class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div class="glass-panel rounded-3xl p-10 sm:p-14 text-center border border-zinc-800">
          <div class="w-20 h-20 rounded-full bg-zinc-800/80 flex items-center justify-center mx-auto mb-5 text-zinc-500 border border-zinc-700">
            <i class="fa-solid fa-user text-3xl"></i>
          </div>
          <h2 class="text-2xl font-bold text-white mb-3">Войдите в аккаунт</h2>
          <p class="text-zinc-400 mb-8 max-w-md mx-auto text-sm">Чтобы вести профиль, настраивать витрину любимых игр, создавать коллекции и получать титулы, авторизуйтесь</p>
          <button onclick="showAuthModal()" class="bg-violet-600 hover:bg-violet-500 text-white font-semibold py-3 px-8 rounded-xl transition shadow-lg shadow-violet-600/30 cursor-pointer">
            Войти в аккаунт
          </button>
        </div>
      </section>
    `;
    return;
  }

  if (typeof ensureSocial === 'function') ensureSocial();

  const allGames = typeof GAMES !== 'undefined' ? GAMES : [];
  const want = allGames.filter(g => (state.userLists && state.userLists.want || []).includes(g.id));
  const completed = allGames.filter(g => (state.userLists && state.userLists.completed || []).includes(g.id));
  const dropped = allGames.filter(g => (state.userLists && state.userLists.dropped || []).includes(g.id));
  const library = completed.length + dropped.length;
  const collections = state.userCollections || [];

  const achievements = typeof getProfileAchievements === 'function' ? getProfileAchievements({ want, completed, dropped }) : [];
  const unlockedCount = achievements.filter(a => a.unlocked).length;
  const userTitle = typeof getUserTitle === 'function' ? getUserTitle(unlockedCount) : { name: 'Геймер', badgeClass: 'bg-zinc-800 text-zinc-300' };

  const followingList = typeof getStoredFollowing === 'function' ? getStoredFollowing() : (state.social?.following || []);
  const followingCount = followingList.length;
  const followersList = typeof getStoredFollowers === 'function' ? getStoredFollowers() : [];
  const followersCount = followersList.length;

  const tabs = [
    { id: 'overview', label: 'Обзор', count: 0 },
    { id: 'library', label: 'Библиотека', count: library },
    { id: 'wishlist', label: 'Желаемое', count: want.length },
    { id: 'reviews', label: 'Отзывы', count: (state.userReviews || []).length },
    { id: 'collections', label: 'Коллекции', count: collections.length },
    { id: 'following', label: 'Подписки', count: followingCount },
    { id: 'followers', label: 'Подписчики', count: followersCount }
  ];

  const custom = state.userCustom || {};
  const defaultBanner = (typeof PROFILE_BANNERS !== 'undefined' && PROFILE_BANNERS[0]) ? PROFILE_BANNERS[0].url : '';
  const bannerUrl = (typeof sanitizeImageUrl === 'function') ? sanitizeImageUrl(custom.banner || defaultBanner, defaultBanner) : (custom.banner || defaultBanner);
  const bio = custom.bio || '';
  const avatarFrame = (custom.avatarFrame && custom.avatarFrame !== 'none') ? custom.avatarFrame : '';

  const name = escapeHtml(state.currentUser.username);
  const rawAvatarImg = custom.avatar || state.currentUser.photo;
  const avatarImgSrc = (typeof sanitizeImageUrl === 'function') ? sanitizeImageUrl(rawAvatarImg) : rawAvatarImg;
  const avatarHtml = avatarImgSrc
    ? `<img src="${escapeHtml(avatarImgSrc)}" class="w-full h-full object-cover" alt="${name}">`
    : escapeHtml(state.currentUser.avatar || (state.currentUser.username ? state.currentUser.username[0].toUpperCase() : 'U'));

  container.innerHTML = `
    <section class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
      <!-- Баннер профиля с аватаркой прямо на фоне баннера -->
      <div class="relative rounded-3xl overflow-hidden border border-zinc-800 bg-zinc-900 shadow-2xl mb-8 group min-h-[280px] sm:min-h-[320px] md:min-h-[360px] flex flex-col justify-between">
        <!-- Фоновое изображение баннера -->
        <div class="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-105" style="background-image: url('${bannerUrl}');"></div>
        
        <!-- Градиенты для максимальной читаемости контента -->
        <div class="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/60 to-black/30 pointer-events-none"></div>
        <div class="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-transparent pointer-events-none"></div>

        <!-- Верхняя панель баннера: кнопка смены фона -->
        <div class="relative z-10 p-4 sm:p-5 flex justify-end">
          <button onclick="openProfileEditModal()" class="bg-black/60 hover:bg-black/85 backdrop-blur-md text-white text-xs font-semibold px-3.5 py-2 rounded-xl border border-white/20 transition flex items-center gap-2 shadow-lg hover:border-violet-500/50 cursor-pointer">
            <i class="fa-solid fa-camera"></i>
            <span>Изменить фон</span>
          </button>
        </div>

        <!-- Нижняя часть баннера: аватарка на фоне баннера, ник, титул, кнопки -->
        <div class="relative z-10 p-5 sm:p-7 md:p-8 flex flex-col md:flex-row md:items-end justify-between gap-5">
          <div class="flex items-center gap-4 sm:gap-6 min-w-0">
            <!-- Аватарка с анимированной рамкой на фоне баннера -->
            <div class="avatar-frame-wrap ${avatarFrame} flex-shrink-0 cursor-pointer" onclick="openProfileEditModal()" title="Нажмите, чтобы настроить фото и рамку">
              <div class="w-20 h-20 sm:w-24 sm:h-24 md:w-28 md:h-28 rounded-full overflow-hidden bg-gradient-to-br from-violet-500 to-fuchsia-500 border-2 sm:border-3 border-white/30 flex items-center justify-center font-bold text-3xl sm:text-4xl md:text-5xl text-white shadow-2xl relative group">
                ${avatarHtml}
                <div class="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition text-xs text-white gap-1 font-medium">
                  <i class="fa-solid fa-camera"></i>
                </div>
              </div>
            </div>

            <!-- Никнейм, динамический титул, подписки и дата -->
            <div class="min-w-0">
              <h1 class="font-display font-black text-2xl sm:text-3xl md:text-4xl text-white truncate leading-tight drop-shadow-md">${name}</h1>
              <div class="flex items-center gap-2.5 flex-wrap mt-2">
                <div class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border backdrop-blur-md shadow-sm ${userTitle.badgeClass}" title="Титул за достижения">
                  <i class="${userTitle.icon} text-[11px]"></i>
                  <span>${userTitle.name}</span>
                </div>
                <span class="text-xs text-zinc-300 font-medium flex items-center gap-1.5 bg-black/40 backdrop-blur-md px-2.5 py-1 rounded-full border border-white/10 shadow-sm">
                  <i class="fa-solid fa-users text-[11px] text-violet-400"></i> ${followersCount} подписчиков
                </span>
                <span class="text-xs text-zinc-300 font-medium flex items-center gap-1.5 bg-black/40 backdrop-blur-md px-2.5 py-1 rounded-full border border-white/10 shadow-sm">
                  <i class="fa-solid fa-user-check text-[11px] text-emerald-400"></i> ${followingCount} подписок
                </span>
                <span class="text-xs text-zinc-300 font-medium flex items-center gap-1.5 bg-black/40 backdrop-blur-md px-2.5 py-1 rounded-full border border-white/10 shadow-sm">
                  <i class="fa-regular fa-calendar text-[11px] text-zinc-400"></i> с ${state.currentUser.createdAt || '2024'}
                </span>
              </div>
            </div>
          </div>

          <!-- Кнопки действий: Редактировать и Поделиться -->
          <div class="flex items-center gap-2.5 self-start md:self-end">
            <button onclick="openProfileEditModal()" class="bg-violet-600 hover:bg-violet-500 text-white font-bold px-4 py-2 sm:px-5 sm:py-2.5 rounded-xl transition flex items-center gap-2 shadow-xl text-xs sm:text-sm shadow-violet-600/30 hover:scale-[1.02] active:scale-[0.98] cursor-pointer">
              <i class="fa-solid fa-pen-to-square"></i>
              <span>Настроить профиль</span>
            </button>
            <button onclick="shareProfile()" class="bg-black/60 hover:bg-black/85 backdrop-blur-md text-white w-9 h-9 sm:w-10 sm:h-10 rounded-xl transition border border-white/20 flex items-center justify-center text-xs sm:text-sm shadow-xl hover:border-violet-400 cursor-pointer" title="Скопировать ссылку на профиль">
              <i class="fa-solid fa-share-nodes"></i>
            </button>
          </div>
        </div>
      </div>

      <!-- Био игрока (если заполнено) -->
      ${bio ? `
        <div class="p-4 rounded-2xl bg-zinc-900/60 border border-zinc-800/80 text-xs sm:text-sm text-zinc-300 flex items-start gap-2.5 mb-8">
          <i class="fa-solid fa-quote-left text-violet-400 mt-0.5 flex-shrink-0 text-xs"></i>
          <p class="italic leading-relaxed max-w-3xl">${escapeHtml(bio)}</p>
        </div>
      ` : ''}

      <!-- Вкладки профиля -->
      <div class="flex items-center gap-2 border-b border-zinc-800 mb-8 overflow-x-auto pb-px">
        ${tabs.map(t => `
          <button data-tab="${t.id}" onclick="switchProfileTab('${t.id}')"
                  class="px-4 py-3 text-sm font-semibold transition border-b-2 whitespace-nowrap flex items-center gap-2 cursor-pointer ${
                    state.profileTab === t.id
                      ? 'text-white border-violet-500 font-bold'
                      : 'text-zinc-500 border-transparent hover:text-zinc-300'
                  }">
            ${t.label}
            ${t.count > 0 ? `<span class="text-xs px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-400 font-normal">${t.count}</span>` : ''}
          </button>
        `).join('')}
      </div>

      <!-- Содержимое выбранной вкладки -->
      <div id="profile-tab-content">
        ${renderProfileTab(state.profileTab, { want, completed, dropped })}
      </div>
    </section>
  `;
}
window.renderProfile = renderProfile;

// ---------------- Отрисовка чужого (публичного) профиля ----------------
function renderPublicProfilePage(container, username) {
  const profile = typeof getPublicProfile === 'function' ? getPublicProfile(username) : null;
  if (!profile) {
    container.innerHTML = `
      <section class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
        <div class="glass-panel rounded-3xl p-10 max-w-lg mx-auto border border-zinc-800">
          <div class="w-16 h-16 rounded-full bg-zinc-800 flex items-center justify-center mx-auto mb-4 text-zinc-500">
            <i class="fa-solid fa-user-slash text-2xl"></i>
          </div>
          <h2 class="text-2xl font-bold text-white mb-2">Профиль не найден</h2>
          <p class="text-zinc-500 mb-6 text-sm">Пользователь с никнеймом «${escapeHtml(username)}» ещё не зарегистрирован или скрыл страницу.</p>
          <button onclick="showView('home')" class="bg-violet-600 hover:bg-violet-500 text-white font-semibold py-2.5 px-6 rounded-xl transition cursor-pointer">
            На главную
          </button>
        </div>
      </section>
    `;
    return;
  }

  const isFollowing = typeof isFollowingUser === 'function' && isFollowingUser(profile.username);
  const currentTab = state.publicProfileTab || 'overview';

  const tabs = [
    { id: 'overview', label: 'Обзор', count: 0 },
    { id: 'library', label: 'Библиотека', count: profile.completed.length },
    { id: 'wishlist', label: 'Желаемое', count: profile.want.length },
    { id: 'reviews', label: 'Отзывы', count: profile.reviews.length },
    { id: 'collections', label: 'Коллекции', count: profile.collections.length }
  ];

  const defaultBanner = (typeof PROFILE_BANNERS !== 'undefined' && PROFILE_BANNERS[0]) ? PROFILE_BANNERS[0].url : '';
  const safeProfileBanner = typeof sanitizeImageUrl === 'function' ? sanitizeImageUrl(profile.banner, defaultBanner) : (profile.banner || defaultBanner);

  container.innerHTML = `
    <section class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
      <div class="relative rounded-3xl overflow-hidden border border-zinc-800 bg-zinc-900 shadow-2xl mb-8 group min-h-[280px] sm:min-h-[320px] md:min-h-[360px] flex flex-col justify-between">
        <div class="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-105" style="background-image: url('${safeProfileBanner}');"></div>
        <div class="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/60 to-black/30 pointer-events-none"></div>
        <div class="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-transparent pointer-events-none"></div>

        <div class="relative z-10 p-4 sm:p-5 flex items-center justify-between">
          <button onclick="window.history.back()" class="bg-black/60 hover:bg-black/85 backdrop-blur-md text-white text-xs font-semibold px-3.5 py-2 rounded-xl border border-white/20 transition flex items-center gap-2 shadow-lg hover:border-violet-500/50 cursor-pointer">
            <i class="fa-solid fa-arrow-left"></i>
            <span>Назад</span>
          </button>
          <span class="text-xs text-zinc-300 bg-black/60 backdrop-blur-md px-3.5 py-1.5 rounded-full border border-white/15 font-semibold flex items-center gap-2 shadow-md">
            <span class="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span> Игрок сообщества
          </span>
        </div>

        <div class="relative z-10 p-5 sm:p-7 md:p-8 flex flex-col md:flex-row md:items-end justify-between gap-5">
          <div class="flex items-center gap-4 sm:gap-6 min-w-0">
            <div class="avatar-frame-wrap ${profile.avatarFrame} flex-shrink-0">
              <div class="w-20 h-20 sm:w-24 sm:h-24 md:w-28 md:h-28 rounded-full overflow-hidden bg-gradient-to-br ${profile.avatarBg} border-2 sm:border-3 border-white/30 flex items-center justify-center font-bold text-3xl sm:text-4xl md:text-5xl text-white shadow-2xl relative">
                ${profile.avatarHtml}
              </div>
            </div>

            <div class="min-w-0">
              <h1 class="font-display font-black text-2xl sm:text-3xl md:text-4xl text-white truncate leading-tight drop-shadow-md">${escapeHtml(profile.username)}</h1>
              <div class="flex items-center gap-2.5 flex-wrap mt-2">
                <div class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border backdrop-blur-md shadow-sm ${profile.userTitle.badgeClass}" title="Титул за достижения">
                  <i class="${profile.userTitle.icon} text-[11px]"></i>
                  <span>${profile.userTitle.name}</span>
                </div>
                <span class="text-xs text-zinc-300 font-medium flex items-center gap-1.5 bg-black/40 backdrop-blur-md px-2.5 py-1 rounded-full border border-white/10 shadow-sm">
                  <i class="fa-solid fa-users text-[11px] text-violet-400"></i> ${profile.followersCount} подписчиков
                </span>
                <span class="text-xs text-zinc-300 font-medium flex items-center gap-1.5 bg-black/40 backdrop-blur-md px-2.5 py-1 rounded-full border border-white/10 shadow-sm">
                  <i class="fa-solid fa-user-check text-[11px] text-emerald-400"></i> ${profile.followingCount} подписок
                </span>
                <span class="text-xs text-zinc-300 font-medium flex items-center gap-1.5 bg-black/40 backdrop-blur-md px-2.5 py-1 rounded-full border border-white/10 shadow-sm">
                  <i class="fa-regular fa-calendar text-[11px] text-zinc-400"></i> с ${profile.joinDate}
                </span>
              </div>
            </div>
          </div>

          <div class="flex items-center gap-2.5 self-start md:self-end">
            ${isFollowing
              ? `<button data-action="toggle-follow" data-username="${escapeHtml(profile.username)}" class="bg-violet-950/80 hover:bg-violet-900/60 text-violet-200 border border-violet-500/50 font-bold px-4 py-2 sm:px-5 sm:py-2.5 rounded-xl transition flex items-center gap-2 shadow-xl text-xs sm:text-sm cursor-pointer" title="Нажмите, чтобы отписаться">
                  <i class="fa-solid fa-check text-emerald-400"></i>
                  <span>Вы подписаны</span>
                </button>`
              : `<button data-action="toggle-follow" data-username="${escapeHtml(profile.username)}" class="bg-violet-600 hover:bg-violet-500 text-white font-bold px-4 py-2 sm:px-5 sm:py-2.5 rounded-xl transition flex items-center gap-2 shadow-xl text-xs sm:text-sm shadow-violet-600/30 hover:scale-[1.02] active:scale-[0.98] cursor-pointer">
                  <i class="fa-solid fa-user-plus"></i>
                  <span>Подписаться</span>
                </button>`}
            <button data-action="share-profile" data-username="${escapeHtml(profile.username)}" class="bg-black/60 hover:bg-black/85 backdrop-blur-md text-white w-9 h-9 sm:w-10 sm:h-10 rounded-xl transition border border-white/20 flex items-center justify-center text-xs sm:text-sm shadow-xl hover:border-violet-400 cursor-pointer" title="Скопировать ссылку на профиль">
              <i class="fa-solid fa-share-nodes"></i>
            </button>
          </div>
        </div>
      </div>

      ${profile.bio ? `
        <div class="p-4 rounded-2xl bg-zinc-900/60 border border-zinc-800/80 text-xs sm:text-sm text-zinc-300 flex items-start gap-2.5 mb-8">
          <i class="fa-solid fa-quote-left text-violet-400 mt-0.5 flex-shrink-0 text-xs"></i>
          <p class="italic leading-relaxed max-w-3xl">${escapeHtml(profile.bio)}</p>
        </div>
      ` : ''}

      <div class="flex items-center gap-2 border-b border-zinc-800 mb-8 overflow-x-auto pb-px">
        ${tabs.map(t => `
          <button data-action="switch-public-tab" data-username="${escapeHtml(profile.username)}" data-tab="${escapeHtml(t.id)}"
                  class="px-4 py-3 text-sm font-semibold transition border-b-2 whitespace-nowrap flex items-center gap-2 cursor-pointer ${
                    currentTab === t.id
                      ? 'text-white border-violet-500 font-bold'
                      : 'text-zinc-500 border-transparent hover:text-zinc-300'
                  }">
            ${t.label}
            ${t.count > 0 ? `<span class="text-xs px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-400 font-normal">${t.count}</span>` : ''}
          </button>
        `).join('')}
      </div>

      <div id="public-profile-tab-content">
        ${renderPublicProfileTab(profile, currentTab)}
      </div>
    </section>
  `;
}
window.renderPublicProfilePage = renderPublicProfilePage;

function switchPublicProfileTab(username, tab) {
  state.publicProfileTab = tab;
  const live = document.getElementById('public-profile-tab-content');
  const profile = typeof getPublicProfile === 'function' ? getPublicProfile(username) : null;
  if (live && profile) {
    live.innerHTML = renderPublicProfileTab(profile, tab);
    document.querySelectorAll('#main-content [data-action="switch-public-tab"]').forEach(b => {
      const active = b.getAttribute('data-tab') === tab;
      b.classList.toggle('text-white', active);
      b.classList.toggle('border-violet-500', active);
      b.classList.toggle('font-bold', active);
      b.classList.toggle('text-zinc-500', !active);
      b.classList.toggle('border-transparent', !active);
    });
  } else {
    renderProfile(document.getElementById('main-content'));
  }
}
window.switchPublicProfileTab = switchPublicProfileTab;

function renderPublicProfileTab(profile, tab) {
  if (tab === 'library') {
    if (!profile.completed.length) {
      return profileEmpty('🎮', 'В библиотеке игрока пока нет пройденных игр.');
    }
    return `
      <div class="space-y-6">
        <h3 class="text-lg font-bold text-white flex items-center gap-2">
          <i class="fa-solid fa-check text-emerald-400"></i> Пройденные игры (${profile.completed.length})
        </h3>
        <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          ${profile.completed.map(g => {
            const score = profile.ratings[g.id] || Math.round(g.rating);
            return `
              <div class="game-card group cursor-pointer" onclick="showView('game', {gameId: ${g.id}})">
                <div class="cover" style="background-image: url('${g.cover}')"></div>
                <div class="overlay"></div>
                <div class="absolute top-3 right-3 bg-amber-500/90 text-black font-black text-xs px-2.5 py-1 rounded-lg flex items-center gap-1 z-10 shadow-lg">
                  <i class="fa-solid fa-star text-[10px]"></i> ${score}/10
                </div>
                <div class="absolute bottom-0 left-0 right-0 p-3.5 z-10">
                  <div class="font-bold text-white text-sm mb-1 line-clamp-1 group-hover:text-violet-300 transition">${escapeHtml(g.title)}</div>
                  <div class="text-[11px] text-zinc-400">${g.year} • ${g.genres[0] || 'Игра'}</div>
                </div>
              </div>
            `;
          }).join('')}
        </div>
      </div>
    `;
  }

  if (tab === 'wishlist') {
    if (!profile.want.length) {
      return profileEmpty('🔖', 'Список желаемого игрока пуст.');
    }
    return `
      <div class="space-y-6">
        <h3 class="text-lg font-bold text-white flex items-center gap-2">
          <i class="fa-regular fa-bell text-blue-400"></i> Хочет пройти (${profile.want.length})
        </h3>
        <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          ${profile.want.map(g => typeof gameCard === 'function' ? gameCard(g) : '').join('')}
        </div>
      </div>
    `;
  }

  if (tab === 'reviews') {
    if (!profile.reviews.length) {
      return profileEmpty('✍️', 'Игрок пока не опубликовал рецензий.');
    }
    return `<div class="space-y-4 max-w-3xl">${profile.reviews.map(r => typeof reviewCard === 'function' ? reviewCard(r) : '').join('')}</div>`;
  }

  if (tab === 'collections') {
    if (!profile.collections.length) {
      return profileEmpty('📚', 'У игрока пока нет созданных коллекций.');
    }
    return `
      <div class="grid md:grid-cols-2 gap-5">
        ${profile.collections.map(c => {
          const allGames = typeof GAMES !== 'undefined' ? GAMES : [];
          const cGames = allGames.filter(g => c.gameIds.includes(g.id));
          return `
            <div class="glass-panel rounded-2xl p-5 border border-zinc-800 hover:border-zinc-700 transition">
              <h4 class="font-bold text-white text-lg mb-1">${escapeHtml(c.title)}</h4>
              <p class="text-xs text-zinc-400 mb-4">${escapeHtml(c.desc || '')}</p>
              <div class="grid grid-cols-4 gap-2">
                ${cGames.map(g => `
                  <div class="aspect-[3/4] rounded-lg overflow-hidden bg-cover bg-center cursor-pointer border border-zinc-800 hover:scale-105 transition" style="background-image: url('${g.cover}')" onclick="showView('game', {gameId: ${g.id}})" title="${escapeHtml(g.title)}"></div>
                `).join('')}
              </div>
            </div>
          `;
        }).join('')}
      </div>
    `;
  }

  // Вкладка «Обзор»
  const ratedCount = Object.keys(profile.ratings).length;
  const avgRating = ratedCount > 0
    ? (Object.values(profile.ratings).reduce((a, b) => a + b, 0) / ratedCount).toFixed(1)
    : '0.0';

  return `
    <div class="space-y-10">
      <div class="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <div class="glass-panel rounded-2xl p-4 sm:p-5 border border-zinc-800 text-center">
          <div class="text-2xl sm:text-3xl font-black text-white mb-1 font-display">${profile.completed.length}</div>
          <div class="text-xs text-zinc-500 font-semibold uppercase tracking-wider">Пройдено игр</div>
        </div>
        <div class="glass-panel rounded-2xl p-4 sm:p-5 border border-zinc-800 text-center">
          <div class="text-2xl sm:text-3xl font-black text-white mb-1 font-display">${profile.want.length}</div>
          <div class="text-xs text-zinc-500 font-semibold uppercase tracking-wider">В желаемом</div>
        </div>
        <div class="glass-panel rounded-2xl p-4 sm:p-5 border border-zinc-800 text-center">
          <div class="text-2xl sm:text-3xl font-black text-white mb-1 font-display">${ratedCount}</div>
          <div class="text-xs text-zinc-500 font-semibold uppercase tracking-wider">Оценок</div>
        </div>
        <div class="glass-panel rounded-2xl p-4 sm:p-5 border border-zinc-800 text-center">
          <div class="text-2xl sm:text-3xl font-black text-emerald-400 mb-1 font-display flex items-center justify-center gap-1">
            <i class="fa-solid fa-star text-base"></i> ${avgRating}
          </div>
          <div class="text-xs text-zinc-500 font-semibold uppercase tracking-wider">Средний балл</div>
        </div>
      </div>

      ${profile.favorites.length > 0 ? `
        <div>
          <div class="flex items-center justify-between mb-4">
            <h3 class="font-display font-bold text-xl text-white flex items-center gap-2">
              <i class="fa-solid fa-heart text-red-500"></i> Любимые игры игрока
            </h3>
          </div>
          <div class="grid grid-cols-2 sm:grid-cols-4 gap-4">
            ${profile.favorites.map(g => {
              const score = profile.ratings[g.id] || Math.round(g.rating);
              return `
                <div class="game-card group cursor-pointer" onclick="showView('game', {gameId: ${g.id}})">
                  <div class="cover" style="background-image: url('${g.cover}')"></div>
                  <div class="overlay"></div>
                  <div class="absolute top-3 right-3 bg-amber-500 text-black font-black text-xs px-2 py-0.5 rounded-md flex items-center gap-1 z-10 shadow-lg">
                    <i class="fa-solid fa-star text-[10px]"></i> ${score}/10
                  </div>
                  <div class="absolute bottom-0 left-0 right-0 p-3.5 z-10">
                    <div class="font-bold text-white text-sm mb-1 line-clamp-1 group-hover:text-violet-300 transition">${escapeHtml(g.title)}</div>
                    <div class="text-[11px] text-zinc-400">${g.year} • ${g.genres[0] || 'Игра'}</div>
                  </div>
                </div>
              `;
            }).join('')}
          </div>
        </div>
      ` : ''}

      <div>
        <div class="flex items-center justify-between mb-4">
          <h3 class="font-display font-bold text-xl text-white flex items-center gap-2">
            <i class="fa-solid fa-clock-rotate-left text-violet-400"></i> Недавние прохождения
          </h3>
          <button onclick="switchPublicProfileTab('${escapeHtml(profile.username)}', 'library')" class="text-xs font-semibold text-violet-400 hover:text-violet-300 transition cursor-pointer">
            Все игры (${profile.completed.length}) →
          </button>
        </div>
        <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 sm:gap-4">
          ${profile.completed.slice(0, 6).map(g => {
            const score = profile.ratings[g.id] || Math.round(g.rating);
            return `
              <div class="game-card group cursor-pointer" onclick="showView('game', {gameId: ${g.id}})">
                <div class="cover" style="background-image: url('${g.cover}')"></div>
                <div class="overlay"></div>
                <div class="absolute top-2.5 right-2.5 bg-black/70 backdrop-blur-md text-amber-400 font-bold text-[11px] px-1.5 py-0.5 rounded flex items-center gap-1 z-10 border border-amber-500/30">
                  <i class="fa-solid fa-star text-[9px]"></i> ${score}
                </div>
                <div class="absolute bottom-0 left-0 right-0 p-3 z-10">
                  <div class="font-bold text-white text-xs mb-0.5 line-clamp-1 group-hover:text-violet-300 transition">${escapeHtml(g.title)}</div>
                  <div class="text-[10px] text-zinc-400">${g.year}</div>
                </div>
              </div>
            `;
          }).join('')}
        </div>
      </div>
    </div>
  `;
}
window.renderPublicProfileTab = renderPublicProfileTab;

function renderProfileTab(tab, lists) {
  const { want, completed, dropped } = lists;

  if (tab === 'overview') {
    return renderOverviewTab(lists);
  }

  if (tab === 'library') {
    if (completed.length + dropped.length === 0) {
      return profileEmpty('🎮', 'В библиотеке пока нет игр. Добавьте первую игру из каталога или через быстрый старт на вкладке «Обзор»!');
    }
    return `
      <div class="space-y-10">
        ${renderList('Прошёл', completed)}
        ${renderList('Бросил', dropped)}
      </div>
    `;
  }

  if (tab === 'wishlist') {
    if (want.length === 0) return profileEmpty('🔖', 'Список желаемого пока пуст. Отмечайте интересующие игры кнопкой «Хочу пройти»');
    return renderList('Хочу пройти', want);
  }

  if (tab === 'reviews') {
    if ((state.userReviews || []).length === 0) return profileEmpty('✍️', 'Вы ещё не написали ни одного отзыва. Напишите свой первый обзор на странице любой игры!');
    return `<div class="space-y-4 max-w-3xl">${state.userReviews.map(r => typeof reviewCard === 'function' ? reviewCard(r) : '').join('')}</div>`;
  }

  if (tab === 'collections') {
    return typeof renderCollectionsTab === 'function' ? renderCollectionsTab() : '';
  }

  if (tab === 'following') return typeof renderFollowing === 'function' ? renderFollowing() : '';
  if (tab === 'followers') return typeof renderFollowers === 'function' ? renderFollowers() : '';

  return '';
}
window.renderProfileTab = renderProfileTab;

function renderOverviewTab(lists) {
  const { want, completed, dropped } = lists;
  const totalGames = want.length + completed.length + dropped.length;
  const rated = Object.keys(state.userRatings || {}).length;
  const avgRating = rated > 0
    ? (Object.values(state.userRatings).reduce((a, b) => a + b, 0) / rated).toFixed(1)
    : '0.0';

  const achievements = typeof getProfileAchievements === 'function' ? getProfileAchievements(lists) : [];
  const unlockedCount = achievements.filter(a => a.unlocked).length;

  return `
    <div class="space-y-10 animate-fade">
      <!-- 1. Статистические карточки -->
      <div class="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div class="glass-panel rounded-2xl p-4 sm:p-5 border border-zinc-800 text-center relative overflow-hidden">
          <div class="text-zinc-500 text-[11px] sm:text-xs uppercase tracking-wider font-bold mb-1">Всего в списках</div>
          <div class="font-display font-black text-2xl sm:text-4xl text-white">${totalGames}</div>
          <div class="text-[11px] text-zinc-500 mt-1">игр сохранено</div>
        </div>
        <div class="glass-panel rounded-2xl p-4 sm:p-5 border border-zinc-800 text-center relative overflow-hidden">
          <div class="text-zinc-500 text-[11px] sm:text-xs uppercase tracking-wider font-bold mb-1">Оценок</div>
          <div class="font-display font-black text-2xl sm:text-4xl text-amber-400">${rated}</div>
          <div class="text-[11px] text-zinc-500 mt-1">оценено игр</div>
        </div>
        <div class="glass-panel rounded-2xl p-4 sm:p-5 border border-zinc-800 text-center relative overflow-hidden">
          <div class="text-zinc-500 text-[11px] sm:text-xs uppercase tracking-wider font-bold mb-1">Средний балл</div>
          <div class="font-display font-black text-2xl sm:text-4xl text-violet-400">${avgRating}</div>
          <div class="text-[11px] text-zinc-500 mt-1">из 10.0</div>
        </div>
        <div class="glass-panel rounded-2xl p-4 sm:p-5 border border-zinc-800 text-center relative overflow-hidden">
          <div class="text-zinc-500 text-[11px] sm:text-xs uppercase tracking-wider font-bold mb-1">Достижения</div>
          <div class="font-display font-black text-2xl sm:text-4xl text-emerald-400">${unlockedCount}/${achievements.length}</div>
          <div class="text-[11px] text-zinc-500 mt-1">бейджей открыто</div>
        </div>
      </div>

      <!-- 2. Витрина: Топ-4 любимых игры -->
      <div class="glass-panel rounded-3xl p-5 sm:p-8 border border-zinc-800">
        <div class="flex items-center justify-between mb-5 flex-wrap gap-2">
          <div>
            <h2 class="font-display font-bold text-lg sm:text-2xl text-white flex items-center gap-2">
              <i class="fa-solid fa-crown text-amber-400"></i> Золотая коллекция (Топ-4)
            </h2>
            <p class="text-xs text-zinc-400 mt-0.5">Ваши любимые игры, определяющие игровой вкус</p>
          </div>
          <span class="text-xs px-3 py-1 rounded-full bg-amber-500/10 text-amber-300 border border-amber-500/30 font-semibold">
            ${(state.userFavorites || []).filter(Boolean).length} из 4 слотов
          </span>
        </div>
        ${typeof renderFavoritesShowcase === 'function' ? renderFavoritesShowcase() : ''}
      </div>

      <!-- 3. Недавно просмотренные -->
      ${typeof renderRecentlyViewed === 'function' ? renderRecentlyViewed() : ''}

      <!-- 4. Игровые бейджи и достижения + кнопка Гайда -->
      <div class="glass-panel rounded-3xl p-5 sm:p-8 border border-zinc-800">
        <div class="flex items-center justify-between mb-5 flex-wrap gap-3">
          <div>
            <h2 class="font-display font-bold text-lg sm:text-2xl text-white flex items-center gap-2">
              <i class="fa-solid fa-medal text-violet-400"></i> Игровые бейджи и достижения
            </h2>
            <p class="text-xs text-zinc-400 mt-0.5">Влияют на ранг и титул под ником профиля</p>
          </div>
          <button onclick="openAchievementsGuideModal()" class="px-3.5 py-1.5 rounded-xl bg-violet-600/20 hover:bg-violet-600/30 text-violet-300 border border-violet-500/40 text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer">
            <i class="fa-solid fa-circle-info text-violet-400"></i> Зачем нужны достижения?
          </button>
        </div>
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          ${achievements.map(a => typeof renderAchievementCard === 'function' ? renderAchievementCard(a) : '').join('')}
        </div>
      </div>

      <!-- 5. Интерактивный Быстрый Старт -->
      ${typeof renderQuickStart === 'function' ? renderQuickStart(lists) : ''}
    </div>
  `;
}
window.renderOverviewTab = renderOverviewTab;

function switchProfileTab(tab) {
  state.profileTab = tab;
  const main = document.getElementById('main-content');
  const live = document.getElementById('profile-tab-content');
  if (!live) { renderProfile(main); return; }

  document.querySelectorAll('[data-tab]').forEach(b => {
    const on = b.dataset.tab === tab;
    b.classList.toggle('text-white', on);
    b.classList.toggle('border-violet-500', on);
    b.classList.toggle('font-bold', on);
    b.classList.toggle('text-zinc-500', !on);
    b.classList.toggle('border-transparent', !on);
  });

  const allGames = typeof GAMES !== 'undefined' ? GAMES : [];
  const want = allGames.filter(g => (state.userLists && state.userLists.want || []).includes(g.id));
  const completed = allGames.filter(g => (state.userLists && state.userLists.completed || []).includes(g.id));
  const dropped = allGames.filter(g => (state.userLists && state.userLists.dropped || []).includes(g.id));

  live.innerHTML = renderProfileTab(tab, { want, completed, dropped });
}
window.switchProfileTab = switchProfileTab;

function shareProfile(username = null) {
  const target = username || (state.viewingProfile || (state.currentUser ? state.currentUser.username : ''));
  const cleanPath = (typeof buildCleanUrl === 'function')
    ? (target ? buildCleanUrl('profile', { username: target }) : buildCleanUrl('profile'))
    : (target ? `/profile?user=${encodeURIComponent(target)}` : '/profile');
  const url = `${window.location.origin}${cleanPath}`;

  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(url)
      .then(() => { if (typeof gvToast === 'function') gvToast(target ? `Ссылка на профиль @${target} скопирована!` : 'Ссылка на профиль скопирована!'); })
      .catch(() => { if (typeof gvToast === 'function') gvToast('Не удалось скопировать ссылку'); });
  } else {
    prompt('Скопируйте ссылку на профиль:', url);
  }
}
window.shareProfile = shareProfile;

function editProfile() {
  if (typeof openProfileEditModal === 'function') {
    openProfileEditModal();
  }
}
window.editProfile = editProfile;
