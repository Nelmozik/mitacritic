// ===================================================================
// GameVault Community & Public Profiles System
// База данных публичных профилей, просмотр чужих страниц и подписки
// ===================================================================

// Флагманские профили активных авторов и критиков сообщества
const COMMUNITY_USERS = {
  'CyberViking_99': {
    username: 'CyberViking_99',
    avatar: 'C',
    avatarBg: 'from-blue-600 to-cyan-600',
    avatarFrame: 'frame-neon',
    banner: 'https://media.rawg.io/media/screenshots/814/814c25d6fd1fd34a4e6dade645a3bda7.jpg',
    bio: 'Охотник за платинами и багами на ПК. Люблю киберпанк, космосимы и хардкорные экшены. Если игра бросает вызов — я в деле.',
    joinDate: 'сентября 2023',
    followersBase: 248,
    followingBase: 42,
    favorites: [41494, 846303, 326243, 58777],
    completed: [41494, 846303, 326243, 58777, 3498, 28, 4200, 13537, 58175, 481913],
    want: [972995, 983381, 989329, 987516],
    ratings: { 41494: 10, 846303: 10, 326243: 10, 58777: 9, 3498: 9, 28: 10, 4200: 10, 13537: 10, 58175: 9, 481913: 9 },
    collections: [
      { id: 101, title: 'Киберпанк и футуризм', desc: 'Лучшие игры про технологии, мрак неоновых улиц и ИИ', gameIds: [41494, 846303, 4200, 13537] }
    ]
  },
  'Vanya_Playground': {
    username: 'Vanya_Playground',
    avatar: 'V',
    avatarBg: 'from-red-600 to-rose-700',
    avatarFrame: 'frame-gold',
    banner: 'https://media.rawg.io/media/screenshots/7b8/7b8895a23e8ca0dbd9e1ba24696579d9.jpg',
    bio: 'Игровой журналист и рецензент Playground.ru (400+ статей). Пишу честно и без купленных восторгов. В играх больше всего ценю сценарий и живой мир.',
    joinDate: 'марта 2022',
    followersBase: 1420,
    followingBase: 115,
    favorites: [28, 3328, 545015, 324997],
    completed: [28, 3328, 545015, 324997, 3498, 799265, 580972, 795632, 58175, 2462],
    want: [972995, 980502, 987515, 471026],
    ratings: { 28: 10, 3328: 10, 545015: 10, 324997: 10, 799265: 9, 580972: 9, 795632: 9, 58175: 9, 3498: 9 },
    collections: [
      { id: 102, title: 'Сюжетные эталоны индустрии', desc: 'Истории, которые оставляют неизгладимый след в памяти', gameIds: [28, 3328, 545015, 799265] }
    ]
  },
  'Artorias_Cinder': {
    username: 'Artorias_Cinder',
    avatar: 'A',
    avatarBg: 'from-amber-600 to-red-600',
    avatarFrame: 'frame-fire',
    banner: 'https://media.rawg.io/media/screenshots/36f/36f941f72e2b2a41629f5fb3bd448688.jpg',
    bio: 'Пройдены все части Souls, Bloodborne и Sekiro на SL1. Хвалю за сложный левел-дизайн, богатый лор и честный геймплей. Миядзаки — гений.',
    joinDate: 'января 2023',
    followersBase: 580,
    followingBase: 64,
    favorites: [326243, 977470, 51610, 9767],
    completed: [326243, 977470, 51610, 9767, 385406, 43737, 481913, 973380],
    want: [292844, 983381, 961205, 973380],
    ratings: { 326243: 10, 977470: 10, 51610: 10, 9767: 10, 481913: 9 },
    collections: [
      { id: 103, title: 'Суровый хардкор', desc: 'Игры для закалки духа и проверки нервов на прочность', gameIds: [326243, 51610, 9767, 481913] }
    ]
  },
  'PixelWanderer': {
    username: 'PixelWanderer',
    avatar: 'P',
    avatarBg: 'from-emerald-600 to-teal-600',
    avatarFrame: 'frame-pixel',
    banner: 'assets/banners/hollow_knight_animated.gif',
    bio: 'Обожаю метроидвании, пиксель-арт и глубокие инди-истории. Жду Silksong больше, чем свой день рождения. Hollow Knight, Celeste и Dead Cells навсегда в сердце.',
    joinDate: 'июля 2023',
    followersBase: 312,
    followingBase: 89,
    favorites: [9767, 536886, 650649, 4200],
    completed: [9767, 536886, 650649, 4200, 13536, 416810],
    want: [292844, 891238, 983210],
    ratings: { 9767: 10, 536886: 10, 650649: 10, 4200: 10, 13536: 9 },
    collections: [
      { id: 104, title: 'Атмосферное инди', desc: 'Небольшие проекты с огромной душой и любовью к деталям', gameIds: [9767, 536886, 650649, 4200] }
    ]
  },
  'Kira_V': {
    username: 'Kira_V',
    avatar: 'K',
    avatarBg: 'from-rose-600 to-pink-700',
    avatarFrame: 'frame-violet',
    banner: 'https://media.rawg.io/media/screenshots/e70/e701311c431504ccd8653a5243188a13.jpg',
    bio: 'Консольщица со стажем, играю на PS5 в 4K. Люблю кинематографичные драмы, глубокие JRPG и красивые саундтреки, которые пробирают до мурашек.',
    joinDate: 'ноября 2023',
    followersBase: 419,
    followingBase: 73,
    favorites: [339958, 799265, 3636, 638650],
    completed: [339958, 799265, 3636, 638650, 58175, 2462, 580972],
    want: [891532, 989329, 983210, 662318],
    ratings: { 339958: 10, 799265: 10, 3636: 10, 638650: 10, 58175: 9, 2462: 9 },
    collections: [
      { id: 105, title: 'Кинематографичные шедевры', desc: 'Игры, в которых постановка кат-сцен на уровне Голливуда', gameIds: [799265, 638650, 58175, 2462] }
    ]
  },
  'Geralt_Of_Rivia_RU': {
    username: 'Geralt_Of_Rivia_RU',
    avatar: 'G',
    avatarBg: 'from-stone-600 to-zinc-700',
    avatarFrame: 'frame-gold',
    banner: 'https://media.rawg.io/media/screenshots/1ac/1ac19f31974314855ad7be266adeb500.jpg',
    bio: '«Зло — это зло. Меньшее, большее, среднее — всё едино». 500+ часов на Скеллиге и в Туссенте. Фанат качественных RPG с разветвлёнными диалогами.',
    joinDate: 'мая 2022',
    followersBase: 890,
    followingBase: 52,
    favorites: [3328, 43252, 43050, 42180],
    completed: [3328, 43252, 43050, 42180, 28, 324997, 41494],
    want: [980502, 471026, 58781, 972995],
    ratings: { 3328: 10, 43252: 10, 43050: 10, 42180: 9, 28: 10, 324997: 10 },
    collections: [
      { id: 106, title: 'Золотой фонд фэнтези', desc: 'Великие ролевые миры меча, магии и моральных дилемм', gameIds: [3328, 43252, 42180, 324997] }
    ]
  },
  'Alex_Frostbite': {
    username: 'Alex_Frostbite',
    avatar: 'A',
    avatarBg: 'from-zinc-700 to-neutral-900',
    avatarFrame: 'frame-neon',
    banner: 'https://media.rawg.io/media/screenshots/814/814c25d6fd1fd34a4e6dade645a3bda7.jpg',
    bio: 'Проверенный критик EGS. Любитель выживачей, кооперативных шутеров и тактических стратегий.',
    joinDate: 'декабря 2023',
    followersBase: 178,
    followingBase: 35,
    favorites: [248521, 58777, 965470, 3498],
    completed: [248521, 58777, 965470, 3498, 28, 41494],
    want: [972995, 988615, 987516],
    ratings: { 248521: 9, 58777: 9, 965470: 8, 3498: 9 }
  },
  'Mrakoborets_Old': {
    username: 'Mrakoborets_Old',
    avatar: 'M',
    avatarBg: 'from-slate-700 to-zinc-800',
    avatarFrame: 'frame-gold',
    banner: 'https://media.rawg.io/media/screenshots/36f/36f941f72e2b2a41629f5fb3bd448688.jpg',
    bio: 'Играю ещё с эпохи DOS и первых Doom. Ценю олдскульную сложность и атмосферу настоящих приключений без ведения за ручку.',
    joinDate: 'октября 2022',
    followersBase: 670,
    followingBase: 44,
    favorites: [51610, 31906, 32038, 35221],
    completed: [51610, 31906, 32038, 35221, 34744, 13537, 28],
    want: [983381, 573118, 58781],
    ratings: { 51610: 10, 31906: 10, 32038: 10, 35221: 10, 34744: 9 }
  }
};

// ---------------- Управление подписками (LocalStorage + память) ----------------
const FOLLOWING_STORAGE_KEY = 'gv_following_list';

function getStoredFollowing() {
  try {
    const raw = localStorage.getItem(FOLLOWING_STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) {}
  // По умолчанию для живой атмосферы подписываем пользователя на 2 топ-критиков
  const def = ['CyberViking_99', 'Vanya_Playground'];
  saveStoredFollowing(def);
  return def;
}

function saveStoredFollowing(list) {
  try {
    localStorage.setItem(FOLLOWING_STORAGE_KEY, JSON.stringify(list));
  } catch (e) {}
}

function isFollowingUser(username) {
  if (!username) return false;
  const list = getStoredFollowing();
  return list.some(u => u.toLowerCase() === username.toLowerCase());
}
window.isFollowingUser = isFollowingUser;

function toggleFollowUser(username) {
  if (!username) return;
  
  if (!state.currentUser) {
    if (typeof showAuthModal === 'function') showAuthModal();
    if (typeof gvToast === 'function') gvToast('Войдите, чтобы подписываться на авторов');
    return;
  }

  const list = getStoredFollowing();
  const idx = list.findIndex(u => u.toLowerCase() === username.toLowerCase());
  const nowFollowing = idx === -1;

  if (nowFollowing) {
    list.push(username);
    if (window.GVAudio && GVAudio.playAdd) GVAudio.playAdd();
    if (typeof gvToast === 'function') gvToast(`Вы подписались на ${username}`);
  } else {
    list.splice(idx, 1);
    if (window.GVAudio && GVAudio.playClick) GVAudio.playClick();
    if (typeof gvToast === 'function') gvToast(`Вы отписались от ${username}`);
  }

  saveStoredFollowing(list);

  // Синхронизируем со state.social.following
  if (state.social) {
    state.social.following = list.map(name => ({
      uid: 'user_' + name.toLowerCase(),
      name: name,
      photo: null
    }));
  }

  // Обновляем текущую страницу
  if (state.currentView === 'profile') {
    renderProfile(document.getElementById('main-content'));
  }
}
window.toggleFollowUser = toggleFollowUser;

// ---------------- Генератор / получение полного профиля пользователя ----------------
function getPublicProfile(username) {
  if (!username) return null;

  // Если это предустановленный участник сообщества
  if (COMMUNITY_USERS[username]) {
    const p = COMMUNITY_USERS[username];
    const isFollowed = isFollowingUser(username);
    const followers = p.followersBase + (isFollowed ? 1 : 0);
    
    // Получаем реальные объекты игр
    const completedGames = (typeof GAMES !== 'undefined' ? GAMES : []).filter(g => (p.completed || []).includes(g.id));
    const wantGames = (typeof GAMES !== 'undefined' ? GAMES : []).filter(g => (p.want || []).includes(g.id));
    const favGames = (typeof GAMES !== 'undefined' ? GAMES : []).filter(g => (p.favorites || []).includes(g.id));
    
    // Вычисляем титул
    const unlockedCount = Math.min(16, completedGames.length + 3);
    const userTitle = typeof getUserTitle === 'function' ? getUserTitle(unlockedCount) : { name: 'Ветеран', badgeClass: 'bg-violet-950/60 text-violet-300 border-violet-500/40', icon: 'fa-solid fa-trophy' };

    // Собираем отзывы этого автора из базы
    const reviews = [];
    if (typeof REVIEWS !== 'undefined') {
      for (const gid in REVIEWS) {
        const found = (REVIEWS[gid] || []).filter(r => r.user && r.user.toLowerCase() === username.toLowerCase());
        reviews.push(...found);
      }
    }

    return {
      username: p.username,
      avatar: p.avatar,
      avatarHtml: `<span class="drop-shadow">${p.avatar}</span>`,
      avatarBg: p.avatarBg,
      avatarFrame: p.avatarFrame,
      banner: p.banner,
      bio: p.bio,
      joinDate: p.joinDate,
      followersCount: followers,
      followingCount: p.followingBase,
      userTitle: userTitle,
      favorites: favGames,
      completed: completedGames,
      want: wantGames,
      ratings: p.ratings || {},
      reviews: reviews,
      collections: p.collections || []
    };
  }

  // Детерминированный генератор для ЛЮБОГО другого пользователя
  let hash = 0;
  for (let i = 0; i < username.length; i++) {
    hash = (hash << 5) - hash + username.charCodeAt(i);
    hash |= 0;
  }
  hash = Math.abs(hash);

  const banners = typeof PROFILE_BANNERS !== 'undefined' ? PROFILE_BANNERS : [
    { url: 'assets/banners/hollow_knight_animated.gif' },
    { url: 'https://media.rawg.io/media/screenshots/1ac/1ac19f31974314855ad7be266adeb500.jpg' },
    { url: 'https://media.rawg.io/media/screenshots/814/814c25d6fd1fd34a4e6dade645a3bda7.jpg' }
  ];
  const banner = banners[hash % banners.length].url;

  const frames = ['frame-neon', 'frame-gold', 'frame-fire', 'frame-violet', 'frame-pixel', ''];
  const avatarFrame = frames[hash % frames.length];

  const gradients = [
    'from-violet-600 to-indigo-600',
    'from-blue-600 to-cyan-600',
    'from-emerald-600 to-teal-600',
    'from-rose-600 to-pink-600',
    'from-amber-600 to-orange-600'
  ];
  const avatarBg = gradients[hash % gradients.length];

  const pool = typeof GAMES !== 'undefined' ? GAMES.filter(g => g.status === 'released' && g.rating >= 4.0) : [];
  const completed = [];
  const want = [];
  const ratings = {};
  
  if (pool.length > 0) {
    const start = hash % (pool.length - 12);
    for (let i = 0; i < 8; i++) {
      const g = pool[(start + i) % pool.length];
      if (g) {
        completed.push(g);
        ratings[g.id] = Math.min(10, Math.max(7, Math.round(g.rating)));
      }
    }
    for (let i = 8; i < 12; i++) {
      const g = pool[(start + i) % pool.length];
      if (g) want.push(g);
    }
  }

  const isFollowed = isFollowingUser(username);
  const followersCount = (hash % 150) + 12 + (isFollowed ? 1 : 0);
  const followingCount = (hash % 45) + 6;
  const userTitle = typeof getUserTitle === 'function' ? getUserTitle(Math.min(16, (hash % 8) + 4)) : { name: 'Геймер', badgeClass: 'bg-zinc-800 text-zinc-300 border-zinc-700', icon: 'fa-solid fa-gamepad' };

  return {
    username: username,
    avatar: username[0].toUpperCase(),
    avatarHtml: `<span class="drop-shadow">${username[0].toUpperCase()}</span>`,
    avatarBg: avatarBg,
    avatarFrame: avatarFrame,
    banner: banner,
    bio: 'Увлечённый игрок сообщества GameVault. Исследую виртуальные миры и делюсь впечатлениями.',
    joinDate: '2024 года',
    followersCount: followersCount,
    followingCount: followingCount,
    userTitle: userTitle,
    favorites: completed.slice(0, 4),
    completed: completed,
    want: want,
    ratings: ratings,
    reviews: [],
    collections: []
  };
}
window.getPublicProfile = getPublicProfile;
window.COMMUNITY_USERS = COMMUNITY_USERS;
