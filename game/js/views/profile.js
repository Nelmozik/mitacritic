// Профиль пользователя GameVault
// Кастомизация (локальная загрузка аватарок и фонов), витрина Топ-4,
// динамические титулы, достижения с гайдом, коллекции и недавно просмотренные

function escapeHtml(text) {
  return String(text || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function profileEmpty(emoji, text) {
  return `
    <div class="py-16 text-center">
      <div class="text-6xl mb-4">${emoji}</div>
      <p class="text-zinc-500 max-w-sm mx-auto text-sm leading-relaxed">${text}</p>
    </div>
  `;
}

// Проверенные и 100% доступные скриншоты для баннеров + анимированные шапки
const PROFILE_BANNERS = [
  { id: 'hk_anim', name: 'Pixel Hollow Knight [Animated]', url: 'assets/banners/hollow_knight_animated.gif', animated: true },
  { id: 'p5r', name: 'Persona 5 Royal', url: 'https://media.rawg.io/media/screenshots/e70/e701311c431504ccd8653a5243188a13.jpg' },
  { id: 'witcher3', name: 'Ведьмак 3', url: 'https://media.rawg.io/media/screenshots/1ac/1ac19f31974314855ad7be266adeb500.jpg' },
  { id: 'cp2077', name: 'Cyberpunk 2077', url: 'https://media.rawg.io/media/screenshots/814/814c25d6fd1fd34a4e6dade645a3bda7.jpg' },
  { id: 'er', name: 'Elden Ring', url: 'https://media.rawg.io/media/screenshots/36f/36f941f72e2b2a41629f5fb3bd448688.jpg' },
  { id: 'rdr2', name: 'Red Dead 2', url: 'https://media.rawg.io/media/screenshots/7b8/7b8895a23e8ca0dbd9e1ba24696579d9.jpg' },
  { id: 'gta5', name: 'GTA V', url: 'https://media.rawg.io/media/screenshots/f95/f9518b1d99210c0cae21fc09e95b4e31.jpg' }
];

const QUICK_START_GAME_IDS = [339958, 3328, 41494, 326243, 28, 3498];

let currentFavSlot = 0;
let favPickerFilter = 'all';
let activeCollectionId = null;
let newCollectionSelectedGames = [];

// Расчет титула пользователя на основе количества открытых достижений (из 16)
function getUserTitle(achievementsUnlocked) {
  if (achievementsUnlocked >= 14) {
    return { name: 'Легенда GameVault', icon: 'fa-solid fa-crown', color: 'text-amber-400', badgeClass: 'bg-amber-500/20 text-amber-300 border-amber-500/40 shadow-amber-500/20 shadow-sm' };
  }
  if (achievementsUnlocked >= 11) {
    return { name: 'Мастер бэклога', icon: 'fa-solid fa-gem', color: 'text-emerald-400', badgeClass: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40' };
  }
  if (achievementsUnlocked >= 8) {
    return { name: 'Ветеран', icon: 'fa-solid fa-trophy', color: 'text-violet-400', badgeClass: 'bg-violet-500/20 text-violet-300 border-violet-500/40' };
  }
  if (achievementsUnlocked >= 5) {
    return { name: 'Опытный геймер', icon: 'fa-solid fa-shield-halved', color: 'text-sky-400', badgeClass: 'bg-sky-500/20 text-sky-300 border-sky-500/40' };
  }
  if (achievementsUnlocked >= 2) {
    return { name: 'Исследователь', icon: 'fa-solid fa-compass', color: 'text-teal-400', badgeClass: 'bg-teal-500/20 text-teal-300 border-teal-500/40' };
  }
  return { name: 'Новичок', icon: 'fa-solid fa-seedling', color: 'text-zinc-400', badgeClass: 'bg-zinc-800 text-zinc-300 border-zinc-700' };
}

// Глобальный хелпер для получения текущего титула игрока
function getUserCurrentTitle() {
  if (!state.currentUser) return { name: 'Гость', icon: 'fa-solid fa-user', color: 'text-zinc-500', badgeClass: 'bg-zinc-800 text-zinc-400' };
  const want = (typeof GAMES !== 'undefined' ? GAMES : []).filter(g => (state.userLists && state.userLists.want || []).includes(g.id));
  const completed = (typeof GAMES !== 'undefined' ? GAMES : []).filter(g => (state.userLists && state.userLists.completed || []).includes(g.id));
  const dropped = (typeof GAMES !== 'undefined' ? GAMES : []).filter(g => (state.userLists && state.userLists.dropped || []).includes(g.id));
  const achievements = getProfileAchievements({ want, completed, dropped });
  const unlockedCount = achievements.filter(a => a.unlocked).length;
  return getUserTitle(unlockedCount);
}
window.getUserCurrentTitle = getUserCurrentTitle;

// Отрисовка страницы профиля
function renderProfile(container) {
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
          <button onclick="showAuthModal()" class="bg-violet-600 hover:bg-violet-500 text-white font-semibold py-3 px-8 rounded-xl transition shadow-lg shadow-violet-600/30">
            Войти в аккаунт
          </button>
        </div>
      </section>
    `;
    return;
  }

  ensureSocial();

  const want = GAMES.filter(g => (state.userLists.want || []).includes(g.id));
  const completed = GAMES.filter(g => (state.userLists.completed || []).includes(g.id));
  const dropped = GAMES.filter(g => (state.userLists.dropped || []).includes(g.id));
  const library = completed.length + dropped.length;
  const collections = state.userCollections || [];

  const achievements = getProfileAchievements({ want, completed, dropped });
  const unlockedCount = achievements.filter(a => a.unlocked).length;
  const userTitle = getUserTitle(unlockedCount);

  const followingList = typeof getStoredFollowing === 'function' ? getStoredFollowing() : (state.social?.following || []);
  const followingCount = followingList.length;
  const followersCount = Math.max(3, followingCount + 1);

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
  const bannerUrl = custom.banner || PROFILE_BANNERS[0].url;
  const bio = custom.bio || '';
  const avatarFrame = (custom.avatarFrame && custom.avatarFrame !== 'none') ? custom.avatarFrame : '';

  const name = escapeHtml(state.currentUser.username);
  const avatarImgSrc = custom.avatar || state.currentUser.photo;
  const avatarHtml = avatarImgSrc
    ? `<img src="${escapeHtml(avatarImgSrc)}" class="w-full h-full object-cover" alt="${name}">`
    : escapeHtml(state.currentUser.avatar || name[0].toUpperCase());

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
                <button onclick="switchProfileTab('followers')" class="text-xs text-zinc-300 font-medium flex items-center gap-1.5 bg-black/40 hover:bg-black/70 backdrop-blur-md px-2.5 py-1 rounded-full border border-white/10 shadow-sm transition hover:border-violet-500/50 cursor-pointer">
                  <i class="fa-solid fa-users text-[11px] text-violet-400"></i> ${followersCount} подписчиков
                </button>
                <button onclick="switchProfileTab('following')" class="text-xs text-zinc-300 font-medium flex items-center gap-1.5 bg-black/40 hover:bg-black/70 backdrop-blur-md px-2.5 py-1 rounded-full border border-white/10 shadow-sm transition hover:border-emerald-500/50 cursor-pointer">
                  <i class="fa-solid fa-user-check text-[11px] text-emerald-400"></i> ${followingCount} подписок
                </button>
                <span class="text-xs text-zinc-300 font-medium flex items-center gap-1.5 bg-black/40 backdrop-blur-md px-2.5 py-1 rounded-full border border-white/10 shadow-sm">
                  <i class="fa-regular fa-calendar text-[11px] text-zinc-400"></i> с ${state.currentUser.joinDate || 'ноября 2026'}
                </span>
              </div>
            </div>
          </div>

          <!-- Кнопки управления -->
          <div class="flex items-center gap-2.5 self-start md:self-end">
            <button onclick="openProfileEditModal()" class="bg-white hover:bg-zinc-200 text-zinc-950 font-bold px-4 py-2 sm:px-5 sm:py-2.5 rounded-xl transition flex items-center gap-2 shadow-xl text-xs sm:text-sm hover:scale-[1.02] active:scale-[0.98] cursor-pointer">
              <i class="fa-solid fa-sliders"></i> Настройки
            </button>
            <button onclick="shareProfile()" class="bg-black/60 hover:bg-black/85 backdrop-blur-md text-white w-9 h-9 sm:w-10 sm:h-10 rounded-xl transition border border-white/20 flex items-center justify-center text-xs sm:text-sm shadow-xl hover:border-violet-400 cursor-pointer" title="Скопировать ссылку на профиль">
              <i class="fa-solid fa-share-nodes"></i>
            </button>
          </div>
        </div>
      </div>

      <!-- Био (если заполнено) -->
      ${bio ? `
        <div class="p-4 rounded-2xl bg-zinc-900/60 border border-zinc-800/80 text-xs sm:text-sm text-zinc-300 flex items-start gap-2.5 mb-8">
          <i class="fa-solid fa-quote-left text-violet-400 mt-0.5 flex-shrink-0 text-xs"></i>
          <p class="italic leading-relaxed max-w-3xl">${escapeHtml(bio)}</p>
        </div>
      ` : ''}

      <!-- Вкладки профиля -->
      <nav class="flex gap-4 sm:gap-8 border-b border-zinc-800 mb-8 overflow-x-auto pb-1">
        ${tabs.map(t => `
          <button data-tab="${t.id}" onclick="switchProfileTab('${t.id}')" class="pb-3 -mb-px border-b-2 whitespace-nowrap transition font-medium text-xs sm:text-sm ${state.profileTab === t.id ? 'text-white border-violet-500 font-bold' : 'text-zinc-500 border-transparent hover:text-zinc-300'}">
            ${t.label}${t.count > 0 ? `<span class="text-xs px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-400 ml-1.5">${t.count}</span>` : ''}
          </button>
        `).join('')}
      </nav>

      <!-- Содержимое выбранной вкладки -->
      <div id="profile-tab-content">${renderProfileTab(state.profileTab, { want, completed, dropped })}</div>
    </section>
  `;
}

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

  container.innerHTML = `
    <section class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
      <!-- Баннер чужого профиля с аватаркой прямо на фоне баннера -->
      <div class="relative rounded-3xl overflow-hidden border border-zinc-800 bg-zinc-900 shadow-2xl mb-8 group min-h-[280px] sm:min-h-[320px] md:min-h-[360px] flex flex-col justify-between">
        <div class="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-105" style="background-image: url('${profile.banner}');"></div>
        <div class="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/60 to-black/30 pointer-events-none"></div>
        <div class="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-transparent pointer-events-none"></div>

        <!-- Верхняя панель баннера -->
        <div class="relative z-10 p-4 sm:p-5 flex items-center justify-between">
          <button onclick="window.history.back()" class="bg-black/60 hover:bg-black/85 backdrop-blur-md text-white text-xs font-semibold px-3.5 py-2 rounded-xl border border-white/20 transition flex items-center gap-2 shadow-lg hover:border-violet-500/50 cursor-pointer">
            <i class="fa-solid fa-arrow-left"></i>
            <span>Назад</span>
          </button>
          <span class="text-xs text-zinc-300 bg-black/60 backdrop-blur-md px-3.5 py-1.5 rounded-full border border-white/15 font-semibold flex items-center gap-2 shadow-md">
            <span class="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span> Игрок сообщества
          </span>
        </div>

        <!-- Нижняя часть баннера: аватарка на фоне баннера, ник, титул, кнопки -->
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

          <!-- Кнопка Подписаться и Поделиться -->
          <div class="flex items-center gap-2.5 self-start md:self-end">
            ${isFollowing
              ? `<button onclick="toggleFollowUser('${profile.username}')" class="bg-violet-950/80 hover:bg-red-500/20 text-violet-300 hover:text-red-300 border border-violet-500/50 hover:border-red-500/50 font-bold px-4 py-2 sm:px-5 sm:py-2.5 rounded-xl transition flex items-center gap-2 shadow-xl text-xs sm:text-sm group cursor-pointer">
                  <i class="fa-solid fa-check text-emerald-400 group-hover:hidden"></i>
                  <i class="fa-solid fa-user-xmark hidden group-hover:inline text-red-400"></i>
                  <span class="group-hover:hidden">Вы подписаны</span>
                  <span class="hidden group-hover:inline">Отписаться</span>
                </button>`
              : `<button onclick="toggleFollowUser('${profile.username}')" class="bg-violet-600 hover:bg-violet-500 text-white font-bold px-4 py-2 sm:px-5 sm:py-2.5 rounded-xl transition flex items-center gap-2 shadow-xl text-xs sm:text-sm shadow-violet-600/30 hover:scale-[1.02] active:scale-[0.98] cursor-pointer">
                  <i class="fa-solid fa-user-plus"></i>
                  <span>Подписаться</span>
                </button>`}
            <button onclick="shareProfile('${profile.username}')" class="bg-black/60 hover:bg-black/85 backdrop-blur-md text-white w-9 h-9 sm:w-10 sm:h-10 rounded-xl transition border border-white/20 flex items-center justify-center text-xs sm:text-sm shadow-xl hover:border-violet-400 cursor-pointer" title="Скопировать ссылку на профиль">
              <i class="fa-solid fa-share-nodes"></i>
            </button>
          </div>
        </div>
      </div>

      <!-- Био -->
      ${profile.bio ? `
        <div class="p-4 rounded-2xl bg-zinc-900/60 border border-zinc-800/80 text-xs sm:text-sm text-zinc-300 flex items-start gap-2.5 mb-8">
          <i class="fa-solid fa-quote-left text-violet-400 mt-0.5 flex-shrink-0 text-xs"></i>
          <p class="italic leading-relaxed max-w-3xl">${escapeHtml(profile.bio)}</p>
        </div>
      ` : ''}

      <!-- Вкладки чужого профиля -->
      <div class="flex items-center gap-2 border-b border-zinc-800 mb-8 overflow-x-auto pb-px">
        ${tabs.map(t => `
          <button onclick="switchPublicProfileTab('${profile.username}', '${t.id}')"
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

      <!-- Содержимое выбранной вкладки -->
      <div id="public-profile-tab-content">
        ${renderPublicProfileTab(profile, currentTab)}
      </div>
    </section>
  `;
}

function switchPublicProfileTab(username, tab) {
  state.publicProfileTab = tab;
  const live = document.getElementById('public-profile-tab-content');
  const profile = typeof getPublicProfile === 'function' ? getPublicProfile(username) : null;
  if (live && profile) {
    live.innerHTML = renderPublicProfileTab(profile, tab);
    document.querySelectorAll('#main-content button[onclick*="switchPublicProfileTab"]').forEach(b => {
      const active = b.getAttribute('onclick').includes(`'${tab}'`);
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
                  <div class="font-bold text-white text-sm mb-1 line-clamp-1 group-hover:text-violet-300 transition">${g.title}</div>
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
          ${profile.want.map(g => gameCard(g)).join('')}
        </div>
      </div>
    `;
  }

  if (tab === 'reviews') {
    if (!profile.reviews.length) {
      return profileEmpty('✍️', 'Игрок пока не опубликовал рецензий.');
    }
    return `<div class="space-y-4 max-w-3xl">${profile.reviews.map(r => reviewCard(r)).join('')}</div>`;
  }

  if (tab === 'collections') {
    if (!profile.collections.length) {
      return profileEmpty('📚', 'У игрока пока нет созданных коллекций.');
    }
    return `
      <div class="grid md:grid-cols-2 gap-5">
        ${profile.collections.map(c => {
          const cGames = (typeof GAMES !== 'undefined' ? GAMES : []).filter(g => c.gameIds.includes(g.id));
          return `
            <div class="glass-panel rounded-2xl p-5 border border-zinc-800 hover:border-zinc-700 transition">
              <h4 class="font-bold text-white text-lg mb-1">${escapeHtml(c.title)}</h4>
              <p class="text-xs text-zinc-400 mb-4">${escapeHtml(c.desc || '')}</p>
              <div class="grid grid-cols-4 gap-2">
                ${cGames.map(g => `
                  <div class="aspect-[3/4] rounded-lg overflow-hidden bg-cover bg-center cursor-pointer border border-zinc-800 hover:scale-105 transition" style="background-image: url('${g.cover}')" onclick="showView('game', {gameId: ${g.id}})" title="${g.title}"></div>
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
      <!-- Статистика игрока -->
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

      <!-- Витрина 4 любимых игр -->
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
                    <div class="font-bold text-white text-sm mb-1 line-clamp-1 group-hover:text-violet-300 transition">${g.title}</div>
                    <div class="text-[11px] text-zinc-400">${g.year} • ${g.genres[0] || 'Игра'}</div>
                  </div>
                </div>
              `;
            }).join('')}
          </div>
        </div>
      ` : ''}

      <!-- Недавние прохождения -->
      <div>
        <div class="flex items-center justify-between mb-4">
          <h3 class="font-display font-bold text-xl text-white flex items-center gap-2">
            <i class="fa-solid fa-clock-rotate-left text-violet-400"></i> Недавние прохождения
          </h3>
          <button onclick="switchPublicProfileTab('${profile.username}', 'library')" class="text-xs font-semibold text-violet-400 hover:text-violet-300 transition cursor-pointer">
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
                  <div class="font-bold text-white text-xs mb-0.5 line-clamp-1 group-hover:text-violet-300 transition">${g.title}</div>
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

// Рендер конкретной вкладки
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
    return `<div class="space-y-4 max-w-3xl">${state.userReviews.map(r => reviewCard(r)).join('')}</div>`;
  }

  if (tab === 'collections') {
    return renderCollectionsTab();
  }

  if (tab === 'following') return renderFollowing();
  if (tab === 'followers') return renderFollowers();

  return '';
}

// ---------------- Вкладка «Обзор» ----------------
function renderOverviewTab(lists) {
  const { want, completed, dropped } = lists;
  const totalGames = want.length + completed.length + dropped.length;
  const rated = Object.keys(state.userRatings || {}).length;
  const avgRating = rated > 0
    ? (Object.values(state.userRatings).reduce((a, b) => a + b, 0) / rated).toFixed(1)
    : '0.0';

  const achievements = getProfileAchievements(lists);
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
        ${renderFavoritesShowcase()}
      </div>

      <!-- 3. Недавно просмотренные -->
      ${renderRecentlyViewed()}

      <!-- 4. Игровые бейджи и достижения + кнопка Гайда -->
      <div class="glass-panel rounded-3xl p-5 sm:p-8 border border-zinc-800">
        <div class="flex items-center justify-between mb-5 flex-wrap gap-3">
          <div>
            <h2 class="font-display font-bold text-lg sm:text-2xl text-white flex items-center gap-2">
              <i class="fa-solid fa-medal text-violet-400"></i> Игровые бейджи и достижения
            </h2>
            <p class="text-xs text-zinc-400 mt-0.5">Влияют на ранг и титул под ником профиля</p>
          </div>
          <button onclick="openAchievementsGuideModal()" class="px-3.5 py-1.5 rounded-xl bg-violet-600/20 hover:bg-violet-600/30 text-violet-300 border border-violet-500/40 text-xs font-semibold flex items-center gap-1.5 transition">
            <i class="fa-solid fa-circle-info text-violet-400"></i> Зачем нужны достижения?
          </button>
        </div>
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          ${achievements.map(a => renderAchievementCard(a)).join('')}
        </div>
      </div>

      <!-- 5. Интерактивный Быстрый Старт -->
      ${renderQuickStart(lists)}
    </div>
  `;
}

// ---------------- Блок «Недавно просмотренные» ----------------
function renderRecentlyViewed() {
  const recentIds = state.recentlyViewed || [];
  const games = GAMES.filter(g => recentIds.includes(g.id))
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
        <button onclick="clearRecentlyViewed()" class="text-xs text-zinc-500 hover:text-red-400 transition">Очистить историю</button>
      </div>
      <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        ${games.map(g => `
          <div onclick="showView('game', { gameId: ${g.id} })" class="bg-zinc-900/90 rounded-2xl border border-zinc-800 p-2.5 flex flex-col justify-between hover:border-violet-500/50 cursor-pointer transition shadow group">
            <div class="aspect-[3/4] rounded-xl overflow-hidden bg-zinc-950 mb-2 relative">
              <img src="${g.cover}" class="w-full h-full object-cover transition-transform group-hover:scale-105" alt="${escapeHtml(g.title)}">
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

function clearRecentlyViewed() {
  state.recentlyViewed = [];
  saveUserData();
  renderProfile(document.getElementById('main-content'));
  gvToast('История просмотров очищена');
}

// ---------------- Витрина Топ-4 ----------------
function renderFavoritesShowcase() {
  const favs = state.userFavorites || [];
  const slots = [0, 1, 2, 3];

  return `
    <div class="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-6">
      ${slots.map(i => {
        const gameId = favs[i];
        const game = gameId ? GAMES.find(g => g.id === gameId) : null;

        if (game) {
          const userScore = state.userRatings && state.userRatings[game.id];
          return `
            <div class="group relative rounded-2xl overflow-hidden bg-zinc-900 border border-zinc-800 hover:border-amber-500/60 transition shadow-xl flex flex-col">
              <div class="relative aspect-[3/4] overflow-hidden bg-zinc-950 cursor-pointer" onclick="showView('game', { gameId: ${game.id} })">
                <img src="${game.cover}" class="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" alt="${escapeHtml(game.title)}">
                <div class="absolute inset-0 bg-gradient-to-t from-zinc-950 via-transparent to-black/40"></div>

                <div class="absolute top-2.5 left-2.5 bg-amber-500 text-zinc-950 font-black text-[10px] sm:text-xs px-2 py-0.5 rounded-lg shadow-md">
                  #${i + 1}
                </div>

                <button onclick="removeFavoriteSlot(${i}, event)" class="absolute top-2.5 right-2.5 w-7 h-7 rounded-lg bg-black/70 hover:bg-red-600 text-zinc-300 hover:text-white transition flex items-center justify-center sm:opacity-0 group-hover:opacity-100 shadow-lg" title="Очистить слот">
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

function removeFavoriteSlot(index, event) {
  if (event) event.stopPropagation();
  state.userFavorites = state.userFavorites || [];
  state.userFavorites[index] = null;
  saveUserData();
  renderProfile(document.getElementById('main-content'));
  gvToast('Слот очищен');
}

// ---------------- Достижения ----------------
function getProfileAchievements(lists) {
  const { want, completed, dropped } = lists;
  const totalGames = want.length + completed.length + dropped.length;
  const ratedCount = Object.keys(state.userRatings || {}).length;
  const reviewsCount = (state.userReviews || []).length;
  const favCount = (state.userFavorites || []).filter(Boolean).length;
  const collectionsCount = (state.userCollections || []).length;

  const allUserGameIds = [...want, ...completed, ...dropped].map(g => g.id);
  const allUserGames = (typeof GAMES !== 'undefined' ? GAMES : []).filter(g => allUserGameIds.includes(g.id));
  const distinctGenres = new Set(allUserGames.flatMap(g => g.genres || [])).size;

  const custom = state.userCustom || {};
  const hasCustomAvatarOrBanner = !!(custom.avatar || (custom.banner && !custom.banner.includes('default')));
  const hasAvatarFrame = !!(custom.avatarFrame && custom.avatarFrame !== 'none');
  const sfxActive = custom.sfx !== false;
  const hasLongGame = completed.some(g => (g.genres || []).some(genre => /rpg|ролевые|стратег/i.test(genre)));

  return [
    {
      id: 'pioneer',
      title: 'Первопроходец',
      desc: 'Зарегистрировался на платформе GameVault',
      icon: 'fa-solid fa-rocket',
      unlocked: true,
      progress: '1/1'
    },
    {
      id: 'first_game',
      title: 'Первый трофей',
      desc: 'Добавьте хотя бы 1 игру в списки или библиотеку',
      icon: 'fa-solid fa-gamepad',
      unlocked: totalGames >= 1,
      progress: `${Math.min(totalGames, 1)}/1`
    },
    {
      id: 'completed_game',
      title: 'Победитель боссов',
      desc: 'Отметьте пройденной хотя бы одну игру',
      icon: 'fa-solid fa-trophy',
      unlocked: completed.length >= 1,
      progress: `${Math.min(completed.length, 1)}/1`
    },
    {
      id: 'critic',
      title: 'Строгий цензор',
      desc: 'Поставьте оценку 3 и более играм',
      icon: 'fa-solid fa-star',
      unlocked: ratedCount >= 3,
      progress: `${Math.min(ratedCount, 3)}/3`
    },
    {
      id: 'top_critic',
      title: 'Эксперт индустрии',
      desc: 'Поставьте оценку 10 играм в каталоге',
      icon: 'fa-solid fa-star-half-stroke',
      unlocked: ratedCount >= 10,
      progress: `${Math.min(ratedCount, 10)}/10`
    },
    {
      id: 'collector',
      title: 'Коллекционер',
      desc: 'Соберите 5+ игр в любых списках',
      icon: 'fa-solid fa-layer-group',
      unlocked: totalGames >= 5,
      progress: `${Math.min(totalGames, 5)}/5`
    },
    {
      id: 'grand_collector',
      title: 'Великая библиотека',
      desc: 'Соберите 15+ игр в своей личной коллекции',
      icon: 'fa-solid fa-book-bookmark',
      unlocked: totalGames >= 15,
      progress: `${Math.min(totalGames, 15)}/15`
    },
    {
      id: 'pantheon',
      title: 'Свой пантеон',
      desc: 'Заполните все 4 слота витрины любимых игр',
      icon: 'fa-solid fa-crown',
      unlocked: favCount >= 4,
      progress: `${favCount}/4`
    },
    {
      id: 'explorer',
      title: 'Эрудит жанров',
      desc: 'Добавьте игры 3 разных жанров',
      icon: 'fa-solid fa-compass',
      unlocked: distinctGenres >= 3,
      progress: `${Math.min(distinctGenres, 3)}/3`
    },
    {
      id: 'genre_master',
      title: 'Игровой полиглот',
      desc: 'Опробуйте игры 6+ различных игровых жанров',
      icon: 'fa-solid fa-globe',
      unlocked: distinctGenres >= 6,
      progress: `${Math.min(distinctGenres, 6)}/6`
    },
    {
      id: 'scribe',
      title: 'Летописец',
      desc: 'Напишите свой первый отзыв об игре',
      icon: 'fa-solid fa-pen-nib',
      unlocked: reviewsCount >= 1,
      progress: `${Math.min(reviewsCount, 1)}/1`
    },
    {
      id: 'veteran_scribe',
      title: 'Мастер рецензий',
      desc: 'Напишите 3 или более полноценных отзыва',
      icon: 'fa-solid fa-feather-pointed',
      unlocked: reviewsCount >= 3,
      progress: `${Math.min(reviewsCount, 3)}/3`
    },
    {
      id: 'curator',
      title: 'Куратор подборок',
      desc: 'Создайте свою первую тематическую коллекцию игр',
      icon: 'fa-solid fa-folder-plus',
      unlocked: collectionsCount >= 1,
      progress: `${Math.min(collectionsCount, 1)}/1`
    },
    {
      id: 'stylist',
      title: 'Стильный профиль',
      desc: 'Установите свою аватарку или кастомную шапку профиля',
      icon: 'fa-solid fa-palette',
      unlocked: hasCustomAvatarOrBanner,
      progress: hasCustomAvatarOrBanner ? '1/1' : '0/1'
    },
    {
      id: 'frame_aura',
      title: 'Аура героя',
      desc: 'Примерьте любую анимированную рамку для аватара',
      icon: 'fa-solid fa-circle-notch',
      unlocked: hasAvatarFrame,
      progress: hasAvatarFrame ? '1/1' : '0/1'
    },
    {
      id: 'audiophile',
      title: 'Консольный звук',
      desc: 'Включите звуковые эффекты интерфейса (SFX)',
      icon: 'fa-solid fa-volume-high',
      unlocked: sfxActive,
      progress: sfxActive ? '1/1' : '0/1'
    }
  ];
}

function renderAchievementCard(ach) {
  if (ach.unlocked) {
    return `
      <div class="p-3.5 sm:p-4 rounded-2xl bg-gradient-to-br from-violet-950/40 to-zinc-900 border border-violet-500/40 relative overflow-hidden group shadow-lg">
        <div class="flex items-start gap-3">
          <div class="w-10 h-10 rounded-xl bg-violet-600/30 text-violet-400 border border-violet-500/50 flex items-center justify-center text-base flex-shrink-0 shadow-md group-hover:scale-110 transition-transform">
            <i class="${ach.icon}"></i>
          </div>
          <div class="min-w-0 flex-1">
            <div class="flex items-center justify-between gap-1 mb-0.5">
              <h4 class="font-bold text-white text-xs sm:text-sm truncate">${ach.title}</h4>
              <span class="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">✓</span>
            </div>
            <p class="text-zinc-400 text-[11px] sm:text-xs leading-relaxed">${ach.desc}</p>
          </div>
        </div>
      </div>
    `;
  }

  return `
    <div class="p-3.5 sm:p-4 rounded-2xl bg-zinc-900/60 border border-zinc-800 opacity-60 hover:opacity-85 transition relative overflow-hidden">
      <div class="flex items-start gap-3">
        <div class="w-10 h-10 rounded-xl bg-zinc-800 text-zinc-500 border border-zinc-700/50 flex items-center justify-center text-base flex-shrink-0">
          <i class="fa-solid fa-lock"></i>
        </div>
        <div class="min-w-0 flex-1">
          <div class="flex items-center justify-between gap-1 mb-0.5">
            <h4 class="font-bold text-zinc-300 text-xs sm:text-sm truncate">${ach.title}</h4>
            <span class="text-[10px] font-mono text-zinc-500">${ach.progress}</span>
          </div>
          <p class="text-zinc-500 text-[11px] sm:text-xs leading-relaxed">${ach.desc}</p>
        </div>
      </div>
    </div>
  `;
}

// ---------------- Быстрый старт ----------------
function renderQuickStart(lists) {
  const quickGames = GAMES.filter(g => QUICK_START_GAME_IDS.includes(g.id));

  return `
    <div class="glass-panel rounded-3xl p-5 sm:p-8 border border-zinc-800 relative overflow-hidden">
      <div class="flex items-center justify-between mb-5 flex-wrap gap-3">
        <div>
          <h2 class="font-display font-bold text-lg sm:text-2xl text-white flex items-center gap-2">
            <i class="fa-solid fa-bolt text-amber-400"></i> Быстрый старт: соберите свою коллекцию
          </h2>
          <p class="text-xs text-zinc-400 mt-0.5">Оцените или добавьте культовые игры в 1 клик, чтобы профиль ожил статистикой:</p>
        </div>
        <button onclick="rollRandomGame()" class="bg-violet-600/20 hover:bg-violet-600/30 text-violet-300 border border-violet-500/40 text-xs font-semibold px-3.5 py-2 rounded-xl transition flex items-center gap-1.5">
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
                  <img src="${g.cover}" class="w-full h-full object-cover" alt="${escapeHtml(g.title)}">
                  <div class="absolute top-1 right-1 px-1.5 py-0.5 rounded bg-black/75 backdrop-blur text-[10px] font-bold text-amber-400">
                    ★ ${g.rating}
                  </div>
                </div>
                <h4 class="font-bold text-white text-xs truncate mb-1">${escapeHtml(g.title)}</h4>
              </div>

              <div class="space-y-1.5 mt-2">
                <button onclick="quickAddGame(${g.id}, 'completed')" class="w-full py-1.5 rounded-lg text-xs font-medium transition flex items-center justify-center gap-1 ${isCompleted ? 'bg-emerald-600 text-white font-bold' : 'bg-zinc-800 hover:bg-zinc-700 text-zinc-300'}">
                  <i class="fa-solid ${isCompleted ? 'fa-check' : 'fa-circle-check'} text-[11px]"></i> ${isCompleted ? 'Пройдено' : 'Прошёл'}
                </button>
                <button onclick="quickAddGame(${g.id}, 'want')" class="w-full py-1.5 rounded-lg text-xs font-medium transition flex items-center justify-center gap-1 ${isWant ? 'bg-violet-600 text-white font-bold' : 'bg-zinc-800/60 hover:bg-zinc-700 text-zinc-400'}">
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

function quickAddGame(gameId, list) {
  if (!state.currentUser) {
    showAuthModal();
    gvToast('Войдите, чтобы отмечать игры');
    return;
  }
  const lists = ['want', 'completed', 'dropped'];
  lists.forEach(l => { state.userLists[l] = state.userLists[l].filter(id => id !== gameId); });
  if (!state.userLists[list].includes(gameId)) state.userLists[list].push(gameId);
  saveUserData();
  renderProfile(document.getElementById('main-content'));
  gvToast(list === 'completed' ? 'Отмечено как пройденное!' : 'Добавлено в желаемое!');
}

function rollRandomGame() {
  const topPool = GAMES.filter(g => g.rating >= 8.5 && g.cover);
  const randomGame = topPool[Math.floor(Math.random() * topPool.length)];
  if (randomGame) {
    showView('game', { gameId: randomGame.id });
    gvToast('🎲 Случайный выбор: ' + randomGame.title);
  }
}

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
        <button onclick="openCollectionModal()" class="bg-violet-600 hover:bg-violet-500 text-white font-semibold px-4 py-2 rounded-xl transition text-xs sm:text-sm flex items-center gap-2 shadow-lg shadow-violet-600/30">
          <i class="fa-solid fa-plus"></i> Создать коллекцию
        </button>
      </div>

      ${collections.length === 0 ? `
        <div class="py-16 text-center border-2 border-dashed border-zinc-800 rounded-3xl p-8">
          <div class="text-6xl mb-4">📚</div>
          <h3 class="text-lg font-bold text-white mb-2">У вас пока нет коллекций</h3>
          <p class="text-zinc-500 text-sm max-w-md mx-auto mb-6">Объединяйте игры по франшизам, настроению или планам на прохождение в удобные коллекции</p>
          <button onclick="openCollectionModal()" class="bg-violet-600 hover:bg-violet-500 text-white font-semibold px-5 py-2.5 rounded-xl transition text-sm">
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

function renderCollectionCard(c) {
  const gameIds = c.gameIds || [];
  const games = GAMES.filter(g => gameIds.includes(g.id)).slice(0, 4);

  return `
    <div class="glass-panel rounded-2xl border border-zinc-800 hover:border-violet-500/50 p-4 transition flex flex-col justify-between group shadow-xl">
      <div>
        <div class="grid grid-cols-2 gap-1.5 aspect-video rounded-xl overflow-hidden bg-zinc-950 mb-3 border border-zinc-800/80">
          ${games.length > 0 ? games.map(g => `
            <img src="${g.cover}" class="w-full h-full object-cover" alt="">
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
        <button onclick="openCollectionModal('${c.id}')" class="text-violet-400 hover:text-violet-300 font-semibold flex items-center gap-1">
          <i class="fa-solid fa-pen-to-square"></i> Редактировать
        </button>
        <button onclick="deleteUserCollection('${c.id}')" class="text-zinc-500 hover:text-red-400 transition" title="Удалить коллекцию">
          <i class="fa-solid fa-trash-can"></i>
        </button>
      </div>
    </div>
  `;
}

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
      titleEl.textContent = 'Редактировать коллекцию';
      titleInput.value = existing.title || '';
      descInput.value = existing.desc || '';
      newCollectionSelectedGames = [...(existing.gameIds || [])];
    }
  } else {
    titleEl.textContent = 'Создать коллекцию';
    titleInput.value = '';
    descInput.value = '';
    newCollectionSelectedGames = [];
  }

  document.getElementById('coll-game-search').value = '';
  document.getElementById('coll-selected-count').textContent = newCollectionSelectedGames.length;
  filterCollectionGamePicker();

  modal.classList.remove('hidden-view');
}

function closeCollectionModal() {
  const modal = document.getElementById('collection-modal');
  if (modal) modal.classList.add('hidden-view');
}

function filterCollectionGamePicker() {
  const q = (document.getElementById('coll-game-search').value || '').trim().toLowerCase();
  const listEl = document.getElementById('coll-games-picker-list');
  if (!listEl) return;

  let pool = GAMES;
  if (q) {
    pool = pool.filter(g => g.title.toLowerCase().includes(q));
  } else {
    const userIds = [...(state.userLists.completed || []), ...(state.userLists.want || [])];
    const userGames = GAMES.filter(g => userIds.includes(g.id));
    pool = userGames.concat(GAMES.slice(0, 30));
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
        <img src="${g.cover}" class="w-8 h-10 object-cover rounded bg-zinc-950 flex-shrink-0" alt="">
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

function toggleCollectionGame(gameId) {
  if (newCollectionSelectedGames.includes(gameId)) {
    newCollectionSelectedGames = newCollectionSelectedGames.filter(id => id !== gameId);
  } else {
    newCollectionSelectedGames.push(gameId);
  }
  document.getElementById('coll-selected-count').textContent = newCollectionSelectedGames.length;
  filterCollectionGamePicker();
}

function saveUserCollection() {
  const title = document.getElementById('coll-title').value.trim();
  const desc = document.getElementById('coll-desc').value.trim();

  if (!title) {
    gvToast('Введите название коллекции');
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
  renderProfile(document.getElementById('main-content'));
  gvToast('Коллекция сохранена!');
}

function deleteUserCollection(collectionId) {
  if (!confirm('Удалить эту коллекцию?')) return;
  state.userCollections = (state.userCollections || []).filter(c => c.id !== collectionId);
  saveUserData();
  renderProfile(document.getElementById('main-content'));
  gvToast('Коллекция удалена');
}

// ---------------- Модалка гайда по достижениям ----------------
function openAchievementsGuideModal() {
  const modal = document.getElementById('achievements-guide-modal');
  if (modal) modal.classList.remove('hidden-view');
}

function closeAchievementsGuideModal() {
  const modal = document.getElementById('achievements-guide-modal');
  if (modal) modal.classList.add('hidden-view');
}

// ---------------- Правила сообщества и баг-репорт ----------------
function openCommunityRulesModal() {
  const modal = document.getElementById('community-rules-modal');
  if (modal) modal.classList.remove('hidden-view');
}

function closeCommunityRulesModal() {
  const modal = document.getElementById('community-rules-modal');
  if (modal) modal.classList.add('hidden-view');
}

function openBugReportModal() {
  const modal = document.getElementById('bug-report-modal');
  if (modal) {
    document.getElementById('bug-text').value = '';
    modal.classList.remove('hidden-view');
  }
}

function closeBugReportModal() {
  const modal = document.getElementById('bug-report-modal');
  if (modal) modal.classList.add('hidden-view');
}

async function submitBugReport() {
  const categoryEl = document.getElementById('bug-category');
  const textEl = document.getElementById('bug-text');
  const contactEl = document.getElementById('bug-contact');
  const submitBtn = document.getElementById('bug-submit-btn');

  const category = categoryEl ? categoryEl.value : 'other';
  const categoryLabel = categoryEl && categoryEl.options ? categoryEl.options[categoryEl.selectedIndex].text : category;
  const text = textEl ? textEl.value.trim() : '';
  const contact = contactEl ? contactEl.value.trim() : '';

  if (!text) return;

  const user = state.currentUser ? state.currentUser.username : 'Гость (не авторизован)';
  const userUid = state.currentUser ? state.currentUser.uid : 'anon';
  const timestamp = new Date().toLocaleString('ru-RU');
  const currentUrl = window.location.href;
  const userAgent = navigator.userAgent;
  const screenResolution = `${window.innerWidth}x${window.innerHeight}`;

  // Сохраняем локально в резервную историю отчетов (хранится до 50 последних)
  const reportData = {
    id: Date.now(),
    user,
    userUid,
    contact,
    category: categoryLabel,
    text,
    currentUrl,
    userAgent,
    screenResolution,
    date: timestamp
  };

  try {
    const saved = JSON.parse(localStorage.getItem('gv_bug_reports') || '[]');
    saved.unshift(reportData);
    localStorage.setItem('gv_bug_reports', JSON.stringify(saved.slice(0, 50)));
  } catch (e) {}

  // Проверяем наличие ключа конфигурации
  const cfg = (typeof BUG_REPORT_CONFIG !== 'undefined') ? BUG_REPORT_CONFIG : { provider: 'web3forms', accessKey: '' };

  if (cfg.accessKey && cfg.accessKey.trim() && cfg.accessKey !== 'YOUR_ACCESS_KEY_HERE') {
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Отправка...';
    }

    try {
      let endpoint = 'https://api.web3forms.com/submit';
      let payload = {};

      if (cfg.provider === 'formspree') {
        const formId = cfg.accessKey.replace('https://formspree.io/f/', '').trim();
        endpoint = `https://formspree.io/f/${formId}`;
        payload = {
          subject: `[GameVault] Ошибка: ${categoryLabel} (от ${user})`,
          name: user,
          email: contact || 'no-reply@gamevault.app',
          category: categoryLabel,
          message: text,
          page: currentUrl,
          screen: screenResolution,
          date: timestamp
        };
      } else {
        // Web3Forms (по умолчанию)
        payload = {
          access_key: cfg.accessKey.trim(),
          subject: `[GameVault] Ошибка: ${categoryLabel} (${user})`,
          from_name: `GameVault Bug Tracker (${user})`,
          replyto: contact || undefined,
          Категория: categoryLabel,
          Пользователь: user,
          Контакты: contact || 'Не указаны',
          Сообщение: text,
          Страница: currentUrl,
          Разрешение_экрана: screenResolution,
          Браузер: userAgent,
          Дата: timestamp
        };
      }

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        closeBugReportModal();
        gvToast('Сообщение об ошибке успешно отправлено разработчику на почту! Спасибо!');
      } else {
        throw new Error('Server responded with ' + res.status);
      }
    } catch (err) {
      console.error('Ошибка отправки баг-репорта:', err);
      closeBugReportModal();
      gvToast('Репорт сохранен локально (ошибка соединения с веб-сервисом)');
    } finally {
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.innerHTML = 'Отправить';
      }
    }
  } else {
    // Ключ еще не введен - репорт сохранен локально
    closeBugReportModal();
    gvToast('Репорт принят и сохранен локально! Чтобы получать их на email, укажите ключ в js/config.js');
  }
}

// Переключение темы (тёмная по умолчанию, светлая при выключении)
function applyTheme(isDark) {
  if (isDark === undefined) {
    const custom = state.userCustom || {};
    isDark = custom.theme !== 'light';
  }
  document.body.classList.toggle('theme-light', !isDark);
  const themeToggle = document.getElementById('theme-toggle');
  if (themeToggle) themeToggle.checked = isDark;
}
window.applyTheme = applyTheme;

function toggleDarkTheme(isDark) {
  state.userCustom = state.userCustom || {};
  state.userCustom.theme = isDark ? 'dark' : 'light';
  saveUserData();
  applyTheme(isDark);
  gvToast(isDark ? 'Включена тёмная тема' : 'Включена светлая тема');
}

// ---------------- Модалка кастомизации профиля ----------------
function openProfileEditModal() {
  const modal = document.getElementById('profile-edit-modal');
  if (!modal) return;

  const custom = state.userCustom || {};
  const nameEl = document.getElementById('edit-profile-name');
  if (nameEl) nameEl.value = (state.currentUser && state.currentUser.username) || '';
  const bioEl = document.getElementById('edit-profile-bio');
  if (bioEl) bioEl.value = custom.bio || '';

  const themeToggle = document.getElementById('theme-toggle');
  if (themeToggle) themeToggle.checked = custom.theme !== 'light';

  // Переключатель звуков SFX
  const sfxToggle = document.getElementById('sfx-toggle');
  if (sfxToggle) sfxToggle.checked = custom.sfx !== false;

  // Переключатель контента 18+
  const adultToggle = document.getElementById('adult-content-toggle');
  if (adultToggle) adultToggle.checked = !!(state.settings && state.settings.show18Plus);

  // Рамки аватара
  const currentFrame = custom.avatarFrame || 'none';
  document.querySelectorAll('#avatar-frame-picker .frame-opt').forEach(btn => {
    const isSel = btn.dataset.frame === currentFrame;
    btn.classList.toggle('border-violet-500', isSel);
    btn.classList.toggle('bg-violet-950/40', isSel);
    btn.classList.toggle('border-zinc-700', !isSel);
  });

  // Предпросмотр аватарки
  updateAvatarPreviews(custom.avatar || (state.currentUser && state.currentUser.photo));

  // Пресеты баннеров
  const presetsContainer = document.getElementById('profile-banner-presets');
  if (presetsContainer) {
    presetsContainer.innerHTML = PROFILE_BANNERS.map(b => `
      <div onclick="selectBannerPreset('${b.url}')" class="group relative h-16 rounded-xl overflow-hidden cursor-pointer border-2 transition bg-zinc-800 ${custom.banner === b.url ? 'border-violet-500 scale-95 shadow-lg' : 'border-zinc-800 hover:border-zinc-600'}">
        <img src="${b.url}" class="w-full h-full object-cover" alt="" onerror="this.style.display='none'">
        <div class="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-black/30 group-hover:bg-black/20 flex items-center justify-center text-center p-1 transition">
          <span class="text-[11px] font-bold text-white drop-shadow">${escapeHtml(b.name)}</span>
        </div>
      </div>
    `).join('');
  }

  modal.classList.remove('hidden-view');
}

function selectAvatarFrame(frameId) {
  state.userCustom = state.userCustom || {};
  state.userCustom.avatarFrame = frameId;
  saveUserData();

  document.querySelectorAll('#avatar-frame-picker .frame-opt').forEach(btn => {
    const isSel = btn.dataset.frame === frameId;
    btn.classList.toggle('border-violet-500', isSel);
    btn.classList.toggle('bg-violet-950/40', isSel);
    btn.classList.toggle('border-zinc-700', !isSel);
  });

  if (window.updateAuthUI) updateAuthUI();
  if (state.currentView === 'profile') renderProfile(document.getElementById('main-content'));
  if (window.GVAudio) window.GVAudio.playAdd();
  gvToast('Анимированная рамка успешно сохранена!');
}
window.selectAvatarFrame = selectAvatarFrame;

function toggleSfxAudio(enabled) {
  state.userCustom = state.userCustom || {};
  state.userCustom.sfx = enabled;
  saveUserData();
  if (enabled && window.GVAudio) {
    window.GVAudio.playClick();
  }
  gvToast(enabled ? 'Звуковые эффекты включены' : 'Звуковые эффекты выключены');
}
window.toggleSfxAudio = toggleSfxAudio;

function toggle18PlusSetting(enabled) {
  state.settings = state.settings || {};
  state.settings.show18Plus = !!enabled;
  try {
    localStorage.setItem('gv_show_18plus', enabled ? 'true' : 'false');
  } catch (e) {}

  if (window.GVAudio) window.GVAudio.playClick();
  gvToast(enabled ? '🔞 Контент 18+ включен' : '🛡️ Контент 18+ скрыт');

  // Если открыт каталог, главная, топы или релизы - обновляем вид
  if (['catalog', 'home', 'tops', 'releases'].includes(state.currentView)) {
    if (typeof showView === 'function') {
      showView(state.currentView);
    }
  }
}
window.toggle18PlusSetting = toggle18PlusSetting;

function updateAvatarPreviews(photoUrl) {
  const letterEl = document.getElementById('edit-avatar-letter');
  const imgEl = document.getElementById('edit-avatar-img');
  const name = state.currentUser ? state.currentUser.username : '?';

  if (photoUrl) {
    imgEl.src = photoUrl;
    imgEl.classList.remove('hidden');
    letterEl.classList.add('hidden');
  } else {
    imgEl.classList.add('hidden');
    letterEl.classList.remove('hidden');
    letterEl.textContent = (name[0] || '?').toUpperCase();
  }
}

// ---------------- Интерактивная обрезка изображений ----------------
let cropperState = {
  mode: 'avatar', // 'avatar' | 'banner'
  img: null,
  scale: 1,
  minScale: 0.5,
  maxScale: 3,
  x: 0,
  y: 0,
  isDragging: false,
  dragStartX: 0,
  dragStartY: 0,
  viewportW: 0,
  viewportH: 0,
  frameW: 0,
  frameH: 0
};

let cropperEventsAttached = false;

function openCropper(imageSrc, mode = 'avatar') {
  cropperState.mode = mode;
  const modal = document.getElementById('image-cropper-modal');
  if (!modal) return;

  const titleEl = document.getElementById('cropper-title');
  const subEl = document.getElementById('cropper-subtitle');
  if (titleEl) titleEl.textContent = mode === 'avatar' ? 'Обрезка аватарки' : 'Обрезка баннера';
  if (subEl) subEl.textContent = mode === 'avatar' ? 'Круглый видоискатель 1:1 • Перетащите и настройте масштаб' : 'Широкоформатный баннер • Перетащите и настройте масштаб';

  // Сразу показываем модалку, чтобы браузер рассчитал размеры viewport
  modal.classList.remove('hidden-view');

  const img = new Image();
  if (!imageSrc.startsWith('data:')) {
    img.crossOrigin = 'anonymous';
  }

  function handleReady() {
    cropperState.img = img;
    const imgEl = document.getElementById('cropper-image');
    if (imgEl) {
      imgEl.src = img.src;
      imgEl.style.width = 'auto';
      imgEl.style.height = 'auto';
      imgEl.style.maxWidth = 'none';
      imgEl.style.maxHeight = 'none';
    }

    setupCropperEvents();
    initCropperDimensions();
    // Повторные вызовы для точного расчета размеров после завершения анимации модального окна
    requestAnimationFrame(() => initCropperDimensions());
    setTimeout(() => initCropperDimensions(), 60);
    setTimeout(() => initCropperDimensions(), 160);
  }

  img.onload = handleReady;
  img.onerror = function() {
    if (img.crossOrigin) {
      const fallbackImg = new Image();
      fallbackImg.onload = function() {
        cropperState.img = fallbackImg;
        const imgEl = document.getElementById('cropper-image');
        if (imgEl) imgEl.src = fallbackImg.src;
        setupCropperEvents();
        initCropperDimensions();
        setTimeout(() => initCropperDimensions(), 60);
      };
      fallbackImg.onerror = () => gvToast('Не удалось загрузить изображение');
      fallbackImg.src = imageSrc;
      return;
    }
    gvToast('Не удалось открыть изображение для обрезки');
  };
  img.src = imageSrc;
  if (img.complete && img.naturalWidth) {
    handleReady();
  }
}

function initCropperDimensions() {
  const vp = document.getElementById('cropper-viewport');
  const frame = document.getElementById('cropper-frame');
  const mask = document.getElementById('cropper-mask');
  if (!vp || !frame || !cropperState.img) return;

  const vpRect = vp.getBoundingClientRect();
  const vpW = vpRect.width || vp.clientWidth || 500;
  const vpH = vpRect.height || vp.clientHeight || 340;
  cropperState.viewportW = vpW;
  cropperState.viewportH = vpH;

  if (cropperState.mode === 'avatar') {
    // Круглая область видоискателя с 4 угловыми скобками в точности как на скриншоте
    const size = Math.max(160, Math.min(vpW - 32, vpH - 32, 260));
    cropperState.frameW = size;
    cropperState.frameH = size;
    frame.style.width = size + 'px';
    frame.style.height = size + 'px';
    frame.style.borderRadius = '0';
    if (mask) {
      mask.className = 'cropper-circle-mask';
    }
  } else {
    // Прямоугольная область для баннера
    const w = Math.max(240, Math.min(vpW - 32, 520));
    const h = Math.round(w / 2.5);
    cropperState.frameW = w;
    cropperState.frameH = h;
    frame.style.width = w + 'px';
    frame.style.height = h + 'px';
    frame.style.borderRadius = '16px';
    if (mask) {
      mask.className = 'cropper-banner-mask';
    }
  }

  // Центрируем рамку внутри viewport
  const frameLeft = Math.round((cropperState.viewportW - cropperState.frameW) / 2);
  const frameTop = Math.round((cropperState.viewportH - cropperState.frameH) / 2);
  frame.style.left = frameLeft + 'px';
  frame.style.top = frameTop + 'px';

  // Базовый масштаб чтобы картинка полностью покрывала рамку и центрировалась ровно в ней
  const natW = cropperState.img.naturalWidth || cropperState.img.width || 400;
  const natH = cropperState.img.naturalHeight || cropperState.img.height || 400;
  const scaleX = cropperState.frameW / natW;
  const scaleY = cropperState.frameH / natH;
  const baseScale = Math.max(scaleX, scaleY);

  cropperState.scale = baseScale;
  cropperState.minScale = baseScale * 0.5;
  cropperState.maxScale = baseScale * 4;
  cropperState.x = frameLeft + (cropperState.frameW - natW * baseScale) / 2;
  cropperState.y = frameTop + (cropperState.frameH - natH * baseScale) / 2;

  const slider = document.getElementById('cropper-zoom');
  if (slider) {
    slider.min = cropperState.minScale;
    slider.max = cropperState.maxScale;
    slider.value = cropperState.scale;
  }

  updateCropperTransform();
}

function updateCropperTransform() {
  const imgEl = document.getElementById('cropper-image');
  if (!imgEl) return;
  imgEl.style.transform = `translate(${cropperState.x}px, ${cropperState.y}px) scale(${cropperState.scale})`;
  imgEl.style.transformOrigin = '0 0';
}

function setupCropperEvents() {
  if (cropperEventsAttached) return;
  cropperEventsAttached = true;
  const vp = document.getElementById('cropper-viewport');
  if (!vp) return;

  function onPointerDown(e) {
    cropperState.isDragging = true;
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    cropperState.dragStartX = clientX - cropperState.x;
    cropperState.dragStartY = clientY - cropperState.y;
  }

  function onPointerMove(e) {
    if (!cropperState.isDragging) return;
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    cropperState.x = clientX - cropperState.dragStartX;
    cropperState.y = clientY - cropperState.dragStartY;
    updateCropperTransform();
  }

  function onPointerUp() {
    cropperState.isDragging = false;
  }

  vp.addEventListener('mousedown', onPointerDown);
  window.addEventListener('mousemove', onPointerMove);
  window.addEventListener('mouseup', onPointerUp);

  vp.addEventListener('touchstart', onPointerDown, { passive: true });
  window.addEventListener('touchmove', onPointerMove, { passive: true });
  window.addEventListener('touchend', onPointerUp);

  vp.addEventListener('wheel', (e) => {
    e.preventDefault();
    const delta = e.deltaY < 0 ? 0.08 : -0.08;
    const newScale = Math.max(cropperState.minScale, Math.min(cropperState.maxScale, cropperState.scale * (1 + delta)));
    setCropperScale(newScale);
  }, { passive: false });
}

function onCropperZoom(val) {
  setCropperScale(parseFloat(val));
}

function setCropperScale(newScale) {
  const frameCenterX = cropperState.viewportW / 2;
  const frameCenterY = cropperState.viewportH / 2;

  const imgPointX = (frameCenterX - cropperState.x) / cropperState.scale;
  const imgPointY = (frameCenterY - cropperState.y) / cropperState.scale;

  cropperState.scale = newScale;
  cropperState.x = frameCenterX - imgPointX * newScale;
  cropperState.y = frameCenterY - imgPointY * newScale;

  const slider = document.getElementById('cropper-zoom');
  if (slider) slider.value = newScale;
  updateCropperTransform();
}

function resetCropperTransform() {
  initCropperDimensions();
}

function closeCropperModal() {
  const modal = document.getElementById('image-cropper-modal');
  if (modal) modal.classList.add('hidden-view');
}

function applyCroppedImage() {
  if (!cropperState.img) return;

  const frameLeft = (cropperState.viewportW - cropperState.frameW) / 2;
  const frameTop = (cropperState.viewportH - cropperState.frameH) / 2;

  const cropX = (frameLeft - cropperState.x) / cropperState.scale;
  const cropY = (frameTop - cropperState.y) / cropperState.scale;
  const cropW = cropperState.frameW / cropperState.scale;
  const cropH = cropperState.frameH / cropperState.scale;

  const isAvatar = cropperState.mode === 'avatar';
  const outW = isAvatar ? 320 : 1200;
  const outH = isAvatar ? 320 : Math.round(1200 / 2.5);

  const canvas = document.createElement('canvas');
  canvas.width = outW;
  canvas.height = outH;
  const ctx = canvas.getContext('2d');

  try {
    ctx.drawImage(cropperState.img, cropX, cropY, cropW, cropH, 0, 0, outW, outH);
    const dataUrl = canvas.toDataURL('image/jpeg', 0.9);

    state.userCustom = state.userCustom || {};
    if (isAvatar) {
      state.userCustom.avatar = dataUrl;
      updateAvatarPreviews(dataUrl);
      if (window.updateAuthUI) updateAuthUI();
      gvToast('Аватарка успешно сохранена!');
    } else {
      state.userCustom.banner = dataUrl;
      gvToast('Баннер успешно сохранен!');
    }

    saveUserData();
    closeCropperModal();
    if (state.currentView === 'profile') {
      renderProfile(document.getElementById('main-content'));
    }
  } catch (err) {
    console.error('Cropper export error:', err);
    if (!isAvatar) {
      state.userCustom = state.userCustom || {};
      state.userCustom.banner = cropperState.img.src;
      saveUserData();
      closeCropperModal();
      if (state.currentView === 'profile') {
        renderProfile(document.getElementById('main-content'));
      }
      gvToast('Баннер успешно сохранен!');
    } else {
      gvToast('Не удалось обрезать внешнее изображение. Пожалуйста, загрузите файл с устройства.');
    }
  }
}

// Загрузка локальных файлов с автоматическим открытием обрезки
function handleLocalAvatarUpload(input) {
  const file = input.files && input.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = function(e) {
    openCropper(e.target.result, 'avatar');
  };
  reader.readAsDataURL(file);
  input.value = '';
}

function handleLocalBannerUpload(input) {
  const file = input.files && input.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = function(e) {
    openCropper(e.target.result, 'banner');
  };
  reader.readAsDataURL(file);
  input.value = '';
}

function cropCurrentAvatar() {
  const src = (state.userCustom && state.userCustom.avatar) || (state.currentUser && state.currentUser.photo);
  if (!src) {
    document.getElementById('local-avatar-file').click();
    return;
  }
  openCropper(src, 'avatar');
}

function cropCurrentBanner() {
  const src = (state.userCustom && state.userCustom.banner) || PROFILE_BANNERS[0].url;
  openCropper(src, 'banner');
}

function resetAvatar() {
  state.userCustom = state.userCustom || {};
  state.userCustom.avatar = '';
  saveUserData();
  updateAvatarPreviews(null);
  if (window.updateAuthUI) updateAuthUI();
  renderProfile(document.getElementById('main-content'));
  gvToast('Аватар сброшен');
}

function selectBannerPreset(url) {
  // Если пресет анимированный (GIF), устанавливаем напрямую для сохранения плавной анимации
  if (url.includes('.gif') || url.includes('animated') || url.includes('anim')) {
    state.userCustom = state.userCustom || {};
    state.userCustom.banner = url;
    saveUserData();
    renderProfile(document.getElementById('main-content'));
    gvToast('Установлена анимированная шапка профиля!');
    return;
  }
  // Для статичных картинок открываем интерактивную обрезку
  openCropper(url, 'banner');
}

function closeProfileEditModal() {
  const modal = document.getElementById('profile-edit-modal');
  if (modal) modal.classList.add('hidden-view');
}

async function saveProfileCustomization() {
  const nameEl = document.getElementById('edit-profile-name');
  const bioEl = document.getElementById('edit-profile-bio');
  const name = nameEl ? nameEl.value.trim() : '';
  const bio = bioEl ? bioEl.value.trim() : '';

  state.userCustom = state.userCustom || {};
  if (bio) state.userCustom.bio = bio;

  if (state.currentUser) {
    if (!name) {
      gvToast('Имя не может быть пустым');
      return;
    }

    try {
      if (window.GVAuth && state.currentUser.username !== name) {
        await GVAuth.setName(name);
      } else {
        state.currentUser.username = name;
        state.currentUser.avatar = name[0].toUpperCase();
        updateAuthUI();
      }
    } catch (e) {
      console.warn(e);
    }
  }

  saveUserData();
  closeProfileEditModal();
  if (state.currentView === 'profile') {
    renderProfile(document.getElementById('main-content'));
  }
  if (window.GVAudio) window.GVAudio.playAdd();
  gvToast('Настройки сохранены!');
}

// ---------------- Модалка выбора любимой игры ----------------
function openFavoritePickerModal(slotIndex) {
  currentFavSlot = slotIndex;
  const modal = document.getElementById('favorite-picker-modal');
  if (!modal) return;

  document.getElementById('fav-picker-slot-title').textContent = `Выбор игры для слота #${slotIndex + 1}`;
  document.getElementById('fav-search-input').value = '';
  favPickerFilter = 'all';

  document.querySelectorAll('.fav-filter-btn').forEach(b => {
    b.classList.toggle('bg-violet-600', b.dataset.filter === 'all');
    b.classList.toggle('text-white', b.dataset.filter === 'all');
    b.classList.toggle('bg-zinc-800', b.dataset.filter !== 'all');
    b.classList.toggle('text-zinc-400', b.dataset.filter !== 'all');
  });

  filterFavoritePicker();
  modal.classList.remove('hidden-view');
  setTimeout(() => document.getElementById('fav-search-input').focus(), 80);
}

function closeFavoritePickerModal() {
  const modal = document.getElementById('favorite-picker-modal');
  if (modal) modal.classList.add('hidden-view');
}

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

function filterFavoritePicker() {
  const query = (document.getElementById('fav-search-input').value || '').trim().toLowerCase();
  const listEl = document.getElementById('fav-picker-list');
  if (!listEl) return;

  const isVis = typeof isGameVisible === 'function' ? isGameVisible : () => true;
  let pool = GAMES.filter(isVis);

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
      <img src="${g.cover}" class="w-12 h-16 object-cover rounded-lg bg-zinc-950 flex-shrink-0 shadow" alt="">
      <div class="flex-1 min-w-0">
        <h4 class="font-bold text-white text-sm truncate group-hover:text-violet-300 transition">${escapeHtml(g.title)}</h4>
        <p class="text-xs text-zinc-400 mt-0.5">${gameDeveloperLabel(g)}</p>
        <div class="flex items-center gap-2 mt-1 text-[11px] text-amber-400">
          <i class="fa-solid fa-star text-[10px]"></i> <b>${g.rating}</b>
        </div>
      </div>
      <button class="px-3 py-1.5 rounded-lg bg-violet-600 group-hover:bg-violet-500 text-white text-xs font-semibold transition">
        Выбрать
      </button>
    </div>
  `).join('');
}

function gameDeveloperLabel(g) {
  const parts = [];
  if (g.year) parts.push(g.year);
  if (g.developer && g.developer !== '—') parts.push(escapeHtml(g.developer));
  else if (g.genres && g.genres[0]) parts.push(g.genres[0]);
  return parts.join(' • ');
}

function selectFavoriteGame(gameId) {
  state.userFavorites = state.userFavorites || [];
  state.userFavorites[currentFavSlot] = gameId;
  saveUserData();
  closeFavoritePickerModal();
  renderProfile(document.getElementById('main-content'));
  gvToast('Игра добавлена в Золотую коллекцию!');
}

// ---------------- Подписки и соц. функции ----------------
function ensureSocial() {
  const social = state.social;
  if (!state.currentUser) return;

  if (social.uid !== state.currentUser.id) {
    state.social = { uid: state.currentUser.id, status: 'idle', following: [], followers: [], results: [], query: '', error: '' };
  }
  if (state.social.status !== 'idle') return;

  if (!window.GVDB) {
    state.social.status = 'nodb';
    return;
  }

  state.social.status = 'loading';
  Promise.all([GVDB.getFollowing(), GVDB.getFollowers()])
    .then(([following, followers]) => {
      state.social.following = following;
      state.social.followers = followers;
      state.social.status = 'ready';
    })
    .catch(e => {
      console.warn('Подписки:', e);
      state.social.status = 'error';
      state.social.error = e.code || e.message || 'unknown';
    })
    .then(() => {
      if (state.currentView === 'profile') renderProfile(document.getElementById('main-content'));
    });
}

function personRow(person) {
  const following = (state.social.following || []).some(p => p.uid === person.uid);
  const avatar = person.photo
    ? `<img src="${escapeHtml(person.photo)}" referrerpolicy="no-referrer" class="w-full h-full object-cover" alt="">`
    : escapeHtml((person.name || '?')[0].toUpperCase());
  return `
    <div class="flex items-center gap-4 p-3 rounded-xl bg-zinc-900/50 border border-zinc-800">
      <div class="w-11 h-11 rounded-full overflow-hidden bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center font-bold text-white flex-shrink-0">${avatar}</div>
      <div class="flex-1 min-w-0 font-semibold text-white truncate">${escapeHtml(person.name || 'Игрок')}</div>
      ${following
        ? `<button onclick="unfollowUser('${person.uid}')" class="px-4 py-2 rounded-lg text-sm font-semibold bg-zinc-800 hover:bg-red-500/20 hover:text-red-300 text-zinc-300 border border-zinc-700 transition">Вы подписаны</button>`
        : `<button onclick="followUser('${person.uid}')" class="px-4 py-2 rounded-lg text-sm font-semibold bg-violet-600 hover:bg-violet-500 text-white transition">Подписаться</button>`}
    </div>
  `;
}

function socialStatusMessage() {
  const social = state.social;
  if (social.status === 'nodb') {
    return `<div class="glass-panel rounded-2xl p-6 max-w-2xl text-zinc-400 text-sm">Подписки пока недоступны: на сайте не подключена база данных Firestore.</div>`;
  }
  if (social.status === 'error') {
    const hint = social.error === 'permission-denied'
      ? 'Firestore не разрешает доступ. Проверьте правила базы (файл firestore.rules).'
      : 'Не удалось загрузить данные (' + escapeHtml(social.error) + ').';
    return `<div class="glass-panel rounded-2xl p-6 max-w-2xl text-red-300 text-sm">${hint}</div>`;
  }
  if (social.status !== 'ready') {
    return `<div class="py-16 text-center text-zinc-500"><i class="fa-solid fa-spinner fa-spin mr-2"></i>Загрузка...</div>`;
  }
  return '';
}

function renderFollowing() {
  const query = (state.social && state.social.query || '').trim();

  return `
    <div class="max-w-3xl space-y-8">
      <!-- Поиск по подпискам и сообществу -->
      <div class="relative">
        <i class="fa-solid fa-magnifying-glass absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500 text-sm"></i>
        <input id="people-search" type="text" value="${escapeHtml(state.social?.query || '')}" 
               oninput="handlePeopleSearch(this.value)"
               placeholder="Найти игрока среди подписок или сообщества..." 
               class="w-full bg-zinc-900 border border-zinc-700/80 rounded-xl pl-11 pr-10 py-3 text-white placeholder-zinc-500 focus:outline-none focus:border-violet-500 text-sm">
        ${query ? `
          <button onclick="clearPeopleSearch()" class="absolute right-3.5 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300">
            <i class="fa-solid fa-circle-xmark"></i>
          </button>
        ` : ''}
      </div>

      <!-- Контейнер списков (обновляется без перерисовки инпута поиска) -->
      <div id="following-list-container" class="space-y-8">
        ${renderFollowingListsOnly()}
      </div>
    </div>
  `;
}

function renderFollowingListsOnly() {
  const followingNames = typeof getStoredFollowing === 'function' ? getStoredFollowing() : [];
  const rawQuery = (state.social && state.social.query || '').trim();
  const query = rawQuery.toLowerCase();

  // Отфильтрованные подписки
  let filtered = followingNames;
  if (query) {
    filtered = followingNames.filter(name => name.toLowerCase().includes(query));
  }

  // Рекомендованные авторы сообщества
  const allCommunity = (typeof COMMUNITY_USERS !== 'undefined' ? Object.keys(COMMUNITY_USERS) : []);
  const recommended = allCommunity
    .filter(name => !followingNames.some(u => u.toLowerCase() === name.toLowerCase()))
    .slice(0, 6);

  // Глобальный поиск по сообществу при вводе запроса
  const communityMatches = query 
    ? allCommunity.filter(name => name.toLowerCase().includes(query) && !followingNames.some(u => u.toLowerCase() === name.toLowerCase()))
    : [];

  return `
    <!-- Список тех, на кого вы подписаны -->
    <div>
      <h3 class="text-sm font-bold text-zinc-400 uppercase tracking-wider mb-3 flex items-center justify-between">
        <span>${query ? 'В ваших подписках' : 'Ваши подписки'}</span>
        <span class="text-xs text-zinc-500 font-normal">${filtered.length} ${filtered.length === 1 ? 'игрок' : 'игроков'}</span>
      </h3>
      
      ${filtered.length > 0 ? `
        <div class="space-y-3">
          ${filtered.map(name => {
            const p = typeof getPublicProfile === 'function' ? getPublicProfile(name) : null;
            if (!p) return '';
            return `
              <div class="flex items-center justify-between gap-4 p-4 rounded-2xl bg-zinc-900/40 border border-zinc-800/80 hover:border-zinc-700 transition">
                <div class="flex items-center gap-3.5 min-w-0 cursor-pointer group" onclick="showProfile('${p.username}')">
                  <div class="avatar-frame-wrap ${p.avatarFrame} flex-shrink-0">
                    <div class="w-12 h-12 rounded-full overflow-hidden bg-gradient-to-br ${p.avatarBg} flex items-center justify-center font-bold text-white text-base shadow border border-white/20">
                      ${p.avatar}
                    </div>
                  </div>
                  <div class="min-w-0">
                    <div class="font-bold text-white text-sm group-hover:text-violet-300 transition flex items-center gap-1.5">
                      <span>${escapeHtml(p.username)}</span>
                      <i class="fa-solid fa-arrow-up-right-from-square text-[10px] text-zinc-500 opacity-0 group-hover:opacity-100 transition"></i>
                    </div>
                    <div class="text-xs text-zinc-400 line-clamp-1 mt-0.5">${escapeHtml(p.bio)}</div>
                    <div class="text-[11px] text-zinc-500 mt-1 flex items-center gap-2">
                      <span><i class="fa-solid fa-gamepad text-violet-400 mr-1"></i>${p.completed.length} игр</span>
                      <span>•</span>
                      <span><i class="fa-solid fa-users text-blue-400 mr-1"></i>${p.followersCount} подписчиков</span>
                    </div>
                  </div>
                </div>
                <div class="flex items-center gap-2 flex-shrink-0">
                  <button onclick="toggleFollowUser('${p.username}')" class="px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-zinc-800/80 hover:bg-red-500/20 text-zinc-300 hover:text-red-400 border border-zinc-700 transition cursor-pointer">
                    Отписаться
                  </button>
                  <button onclick="showProfile('${p.username}')" class="px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-violet-600/20 hover:bg-violet-600 text-violet-300 hover:text-white border border-violet-500/40 transition cursor-pointer">
                    Профиль →
                  </button>
                </div>
              </div>
            `;
          }).join('')}
        </div>
      ` : profileEmpty('😴', query ? 'В подписках никто не найден.' : 'Вы пока ни на кого не подписаны. Подпишитесь на критиков ниже!')}
    </div>

    <!-- Результаты поиска среди всего сообщества GameVault -->
    ${query && communityMatches.length > 0 ? `
      <div class="pt-6 border-t border-zinc-800/80">
        <h3 class="text-sm font-bold text-zinc-400 uppercase tracking-wider mb-4 flex items-center gap-2">
          <i class="fa-solid fa-magnifying-glass text-violet-400"></i> Найдено в сообществе GameVault (${communityMatches.length})
        </h3>
        <div class="space-y-3">
          ${communityMatches.map(name => {
            const p = typeof getPublicProfile === 'function' ? getPublicProfile(name) : null;
            if (!p) return '';
            return `
              <div class="flex items-center justify-between gap-4 p-4 rounded-2xl bg-zinc-900/50 border border-zinc-800 hover:border-zinc-700 transition">
                <div class="flex items-center gap-3.5 min-w-0 cursor-pointer group" onclick="showProfile('${p.username}')">
                  <div class="avatar-frame-wrap ${p.avatarFrame} flex-shrink-0">
                    <div class="w-12 h-12 rounded-full overflow-hidden bg-gradient-to-br ${p.avatarBg} flex items-center justify-center font-bold text-white text-base shadow">
                      ${p.avatar}
                    </div>
                  </div>
                  <div class="min-w-0">
                    <div class="font-bold text-white text-sm group-hover:text-violet-300 transition">${escapeHtml(p.username)}</div>
                    <div class="text-xs text-zinc-400 line-clamp-1 mt-0.5">${p.userTitle.name} • ${p.followersCount} подп.</div>
                  </div>
                </div>
                <div class="flex items-center gap-2 flex-shrink-0">
                  <button onclick="toggleFollowUser('${p.username}')" class="px-3.5 py-1.5 rounded-xl text-xs font-bold bg-violet-600 hover:bg-violet-500 text-white transition flex items-center gap-1.5 cursor-pointer shadow-sm">
                    <i class="fa-solid fa-plus text-[10px]"></i> Подписаться
                  </button>
                  <button onclick="showProfile('${p.username}')" class="px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-violet-600/20 hover:bg-violet-600 text-violet-300 hover:text-white border border-violet-500/40 transition cursor-pointer">
                    Профиль →
                  </button>
                </div>
              </div>
            `;
          }).join('')}
        </div>
      </div>
    ` : ''}

    <!-- Прямой переход к профилю по любому введённому никнейму -->
    ${query && rawQuery.length >= 2 && !followingNames.some(n => n.toLowerCase() === query) && !communityMatches.some(n => n.toLowerCase() === query) ? `
      <div class="p-4 rounded-2xl bg-violet-950/20 border border-violet-500/30 flex items-center justify-between gap-4">
        <div class="flex items-center gap-3 min-w-0">
          <div class="w-10 h-10 rounded-full bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center text-white font-bold text-sm shadow">
            ${escapeHtml(rawQuery.charAt(0).toUpperCase())}
          </div>
          <div class="min-w-0">
            <div class="text-xs text-zinc-400">Открыть публичную страницу:</div>
            <div class="text-sm font-bold text-white truncate">Профиль игрока «${escapeHtml(rawQuery)}»</div>
          </div>
        </div>
        <button onclick="showProfile('${escapeHtml(rawQuery)}')" class="px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-xs font-bold transition flex items-center gap-1.5 flex-shrink-0">
          <span>Открыть профиль</span>
          <i class="fa-solid fa-arrow-right text-[10px]"></i>
        </button>
      </div>
    ` : ''}

    <!-- Рекомендуемые авторы GameVault (когда строка поиска пуста) -->
    ${!query && recommended.length > 0 ? `
      <div class="pt-6 border-t border-zinc-800/80">
        <h3 class="text-sm font-bold text-zinc-400 uppercase tracking-wider mb-4 flex items-center gap-2">
          <i class="fa-solid fa-fire text-amber-400"></i> Рекомендуемые авторы GameVault
        </h3>
        <div class="grid sm:grid-cols-2 gap-3.5">
          ${recommended.map(name => {
            const p = typeof getPublicProfile === 'function' ? getPublicProfile(name) : null;
            if (!p) return '';
            return `
              <div class="p-4 rounded-2xl bg-zinc-900/50 border border-zinc-800 hover:border-zinc-700 transition flex flex-col justify-between gap-3">
                <div class="flex items-center gap-3 cursor-pointer group" onclick="showProfile('${p.username}')">
                  <div class="avatar-frame-wrap ${p.avatarFrame} flex-shrink-0">
                    <div class="w-11 h-11 rounded-full overflow-hidden bg-gradient-to-br ${p.avatarBg} flex items-center justify-center font-bold text-white text-sm shadow">
                      ${p.avatar}
                    </div>
                  </div>
                  <div class="min-w-0">
                    <div class="font-bold text-white text-sm group-hover:text-violet-300 transition truncate">${p.username}</div>
                    <div class="text-[11px] text-zinc-400 truncate">${p.userTitle.name} • ${p.followersCount} подп.</div>
                  </div>
                </div>
                <div class="flex items-center justify-between gap-2 pt-2 border-t border-zinc-800/60">
                  <span class="text-[11px] text-zinc-500">${p.completed.length} игр в библиотеке</span>
                  <button onclick="toggleFollowUser('${p.username}')" class="px-3 py-1 rounded-lg text-xs font-bold bg-violet-600 hover:bg-violet-500 text-white transition flex items-center gap-1.5 cursor-pointer shadow-sm">
                    <i class="fa-solid fa-plus text-[10px]"></i> Подписаться
                  </button>
                </div>
              </div>
            `;
          }).join('')}
        </div>
      </div>
    ` : ''}
  `;
}

function handlePeopleSearch(val) {
  state.social = state.social || {};
  state.social.query = val;
  const listContainer = document.getElementById('following-list-container');
  if (listContainer) {
    listContainer.innerHTML = renderFollowingListsOnly();
  }
}

function clearPeopleSearch() {
  state.social = state.social || {};
  state.social.query = '';
  const input = document.getElementById('people-search');
  if (input) {
    input.value = '';
    input.focus();
  }
  const listContainer = document.getElementById('following-list-container');
  if (listContainer) {
    listContainer.innerHTML = renderFollowingListsOnly();
  }
}

function renderFollowers() {
  const followersNames = ['PixelWanderer', 'Artorias_Cinder', 'Kira_V', 'Alex_Frostbite'];
  return `
    <div class="max-w-3xl space-y-4">
      <h3 class="text-sm font-bold text-zinc-400 uppercase tracking-wider mb-3 flex items-center justify-between">
        <span>Ваши подписчики</span>
        <span class="text-xs text-zinc-500 font-normal">${followersNames.length} игроков</span>
      </h3>
      <div class="space-y-3">
        ${followersNames.map(name => {
          const p = typeof getPublicProfile === 'function' ? getPublicProfile(name) : null;
          if (!p) return '';
          const isFollowed = typeof isFollowingUser === 'function' && isFollowingUser(name);
          return `
            <div class="flex items-center justify-between gap-4 p-4 rounded-2xl bg-zinc-900/40 border border-zinc-800/80 hover:border-zinc-700 transition">
              <div class="flex items-center gap-3.5 min-w-0 cursor-pointer group" onclick="showProfile('${p.username}')">
                <div class="avatar-frame-wrap ${p.avatarFrame} flex-shrink-0">
                  <div class="w-12 h-12 rounded-full overflow-hidden bg-gradient-to-br ${p.avatarBg} flex items-center justify-center font-bold text-white text-base shadow border border-white/20">
                    ${p.avatar}
                  </div>
                </div>
                <div class="min-w-0">
                  <div class="font-bold text-white text-sm group-hover:text-violet-300 transition flex items-center gap-1.5">
                    <span>${escapeHtml(p.username)}</span>
                    <i class="fa-solid fa-arrow-up-right-from-square text-[10px] text-zinc-500 opacity-0 group-hover:opacity-100 transition"></i>
                  </div>
                  <div class="text-xs text-zinc-400 line-clamp-1 mt-0.5">${escapeHtml(p.bio)}</div>
                  <div class="text-[11px] text-zinc-500 mt-1 flex items-center gap-2">
                    <span>${p.userTitle.name}</span>
                    <span>•</span>
                    <span><i class="fa-solid fa-users text-blue-400 mr-1"></i>${p.followersCount} подписчиков</span>
                  </div>
                </div>
              </div>
              <div class="flex items-center gap-2 flex-shrink-0">
                ${isFollowed
                  ? `<button onclick="toggleFollowUser('${p.username}')" class="px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-zinc-800/80 hover:bg-red-500/20 text-zinc-300 hover:text-red-400 border border-zinc-700 transition cursor-pointer">
                      Вы подписаны
                    </button>`
                  : `<button onclick="toggleFollowUser('${p.username}')" class="px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-violet-600 hover:bg-violet-500 text-white transition flex items-center gap-1.5 cursor-pointer">
                      <i class="fa-solid fa-plus text-[10px]"></i> В ответ
                    </button>`}
                <button onclick="showProfile('${p.username}')" class="px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-violet-600/20 hover:bg-violet-600 text-violet-300 hover:text-white border border-violet-500/40 transition cursor-pointer">
                  Профиль →
                </button>
              </div>
            </div>
          `;
        }).join('')}
      </div>
    </div>
  `;
}

function searchPeople() {
  const input = document.getElementById('people-search');
  const query = input ? input.value.trim() : '';
  state.social.query = query;

  if (!query) {
    state.social.results = [];
    renderProfile(document.getElementById('main-content'));
    return;
  }

  GVDB.searchUsers(query)
    .then(results => { state.social.results = results; })
    .catch(e => { state.social.results = []; gvToast('Не удалось выполнить поиск'); console.warn(e); })
    .then(() => renderProfile(document.getElementById('main-content')));
}

function findPerson(uid) {
  const social = state.social;
  return social.results.concat(social.following, social.followers).find(p => p.uid === uid);
}

function followUser(uid) {
  const person = findPerson(uid);
  if (!person) return;
  GVDB.follow(person)
    .then(() => {
      state.social.following.push(person);
      gvToast('Вы подписались на ' + person.name);
    })
    .catch(e => { gvToast('Не удалось подписаться'); console.warn(e); })
    .then(() => renderProfile(document.getElementById('main-content')));
}

function unfollowUser(uid) {
  GVDB.unfollow(uid)
    .then(() => {
      state.social.following = state.social.following.filter(p => p.uid !== uid);
      gvToast('Вы отписались');
    })
    .catch(e => { gvToast('Не удалось отписаться'); console.warn(e); })
    .then(() => renderProfile(document.getElementById('main-content')));
}

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

  const want = GAMES.filter(g => (state.userLists.want || []).includes(g.id));
  const completed = GAMES.filter(g => (state.userLists.completed || []).includes(g.id));
  const dropped = GAMES.filter(g => (state.userLists.dropped || []).includes(g.id));

  live.innerHTML = renderProfileTab(tab, { want, completed, dropped });
}

function shareProfile(username = null) {
  const target = username || (state.viewingProfile || (state.currentUser ? state.currentUser.username : ''));
  const url = target
    ? (location.origin + location.pathname + '#profile?user=' + encodeURIComponent(target))
    : (location.origin + location.pathname + '#profile');

  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(url)
      .then(() => gvToast(target ? `Ссылка на профиль @${target} скопирована!` : 'Ссылка на профиль скопирована!'))
      .catch(() => gvToast('Не удалось скопировать ссылку'));
  } else {
    gvToast('Скопируйте адрес из строки браузера');
  }
}

function editProfile() {
  openProfileEditModal();
}

function renderList(title, games) {
  if (games.length === 0) return '';
  return `
    <div>
      <h2 class="font-display font-bold text-xl text-white mb-4">${title} <span class="text-zinc-600 text-base font-normal">(${games.length})</span></h2>
      <div class="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
        ${games.map(g => gameCard(g)).join('')}
      </div>
    </div>
  `;
}

window.handlePeopleSearch = handlePeopleSearch;
window.clearPeopleSearch = clearPeopleSearch;
