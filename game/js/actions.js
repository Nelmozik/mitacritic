// Действия пользователя
// Сохранение и загрузка данных пользователя в localStorage и облако Firestore
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

  // Облачная синхронизация Firestore: сохраняем в облако с небольшой задержкой (debounce),
  // чтобы не перегружать сеть при частых кликах
  if (state.currentUser && window.GVDB && typeof GVDB.saveProfileData === 'function') {
    clearTimeout(window._cloudSyncTimer);
    window._cloudSyncTimer = setTimeout(() => {
      GVDB.saveProfileData(state.currentUser.id, {
        userLists: state.userLists,
        userRatings: state.userRatings,
        userFavorites: state.userFavorites || [],
        userCollections: state.userCollections || [],
        userCustom: state.userCustom || {},
        recentlyViewed: state.recentlyViewed || []
      }).catch(err => console.warn('Cloud sync save error:', err));
    }, 350);
  }
}

// Живое автоматическое применение данных из Firestore (onSnapshot) без ручных нажатий
function applyCloudProfileData(cloud) {
  if (!cloud || !state.currentUser) return;

  // Если пользователь сам кликнул по спискам меньше 2.5 секунд назад или таймер сохранения в очереди,
  // то не перезаписываем локальные списки старыми данными из входящего снимка Firestore!
  const isRecentLocalListEdit = (window._lastLocalListEdit && (Date.now() - window._lastLocalListEdit < 2500)) || Boolean(window._cloudSyncTimer);

  const uid = state.currentUser.id;
  let changed = false;

  // Восстанавливаем имя игрока из облака (если вошли по ссылке или displayName не подтянулся)
  if (state.currentUser && cloud.name && (!state.currentUser.username || state.currentUser.username === (state.currentUser.email || '').split('@')[0])) {
    state.currentUser.username = cloud.name;
    state.currentUser.avatar = (cloud.name[0] || '?').toUpperCase();
    if (typeof updateAuthUI === 'function') updateAuthUI();
  }

  // 1. Списки игр
  if (cloud.userLists && typeof cloud.userLists === 'object' && !isRecentLocalListEdit) {
    const cloudLists = {
      want: Array.isArray(cloud.userLists.want) ? cloud.userLists.want : [],
      completed: Array.isArray(cloud.userLists.completed) ? cloud.userLists.completed : [],
      dropped: Array.isArray(cloud.userLists.dropped) ? cloud.userLists.dropped : []
    };
    if (JSON.stringify(cloudLists) !== JSON.stringify(state.userLists)) {
      state.userLists = cloudLists;
      changed = true;
    }
  }

  // 2. Оценки
  if (cloud.userRatings && typeof cloud.userRatings === 'object') {
    const mergedRatings = Object.assign({}, cloud.userRatings, state.userRatings);
    if (JSON.stringify(mergedRatings) !== JSON.stringify(state.userRatings)) {
      state.userRatings = mergedRatings;
      changed = true;
    }
  }

  // 3. Избранное Топ-4
  if (Array.isArray(cloud.userFavorites)) {
    if (JSON.stringify(cloud.userFavorites) !== JSON.stringify(state.userFavorites)) {
      state.userFavorites = cloud.userFavorites;
      changed = true;
    }
  }

  // 4. Коллекции
  if (Array.isArray(cloud.userCollections)) {
    if (JSON.stringify(cloud.userCollections) !== JSON.stringify(state.userCollections)) {
      state.userCollections = cloud.userCollections;
      changed = true;
    }
  }

  // 5. Кастомизация (аватарка, фон, био, рамка, тема)
  if (cloud.userCustom && typeof cloud.userCustom === 'object') {
    state.userCustom = state.userCustom || {};
    if (cloud.userCustom.avatar && state.userCustom.avatar !== cloud.userCustom.avatar) {
      state.userCustom.avatar = cloud.userCustom.avatar;
      changed = true;
    }
    if (cloud.userCustom.banner && state.userCustom.banner !== cloud.userCustom.banner) {
      state.userCustom.banner = cloud.userCustom.banner;
      changed = true;
    }
    if (cloud.userCustom.bio !== undefined && state.userCustom.bio !== cloud.userCustom.bio) {
      state.userCustom.bio = cloud.userCustom.bio;
      changed = true;
    }
    if (cloud.userCustom.avatarFrame !== undefined && state.userCustom.avatarFrame !== cloud.userCustom.avatarFrame) {
      state.userCustom.avatarFrame = cloud.userCustom.avatarFrame;
      changed = true;
    }
    if (cloud.userCustom.hasEverEquippedFrame) {
      state.userCustom.hasEverEquippedFrame = true;
    }
    if (state.userCustom.avatarFrame && state.userCustom.avatarFrame !== 'none') {
      state.userCustom.hasEverEquippedFrame = true;
    }
    if (cloud.userCustom.theme && state.userCustom.theme !== cloud.userCustom.theme) {
      state.userCustom.theme = cloud.userCustom.theme;
      if (typeof window.applyTheme === 'function') window.applyTheme();
      changed = true;
    }
  }

  if (cloud.photo && !state.userCustom.avatar) {
    state.userCustom.avatar = cloud.photo;
    changed = true;
  }
  if (state.currentUser && state.userCustom.avatar && state.currentUser.photo !== state.userCustom.avatar) {
    state.currentUser.photo = state.userCustom.avatar;
    changed = true;
  }

  if (changed) {
    try {
      localStorage.setItem('gv_lists_' + uid, JSON.stringify(state.userLists));
      localStorage.setItem('gv_ratings_' + uid, JSON.stringify(state.userRatings));
      localStorage.setItem('gv_favs_' + uid, JSON.stringify(state.userFavorites));
      localStorage.setItem('gv_collections_' + uid, JSON.stringify(state.userCollections));
      localStorage.setItem('gv_recent_' + uid, JSON.stringify(state.recentlyViewed));
      localStorage.setItem('gv_custom_' + uid, JSON.stringify(state.userCustom));
    } catch(e) {}

    if (typeof window.updateAuthUI === 'function') window.updateAuthUI();
    if (state.currentView === 'profile') {
      const container = document.getElementById('main-content');
      if (container && typeof renderProfile === 'function') renderProfile(container);
    } else if (state.currentView === 'game') {
      const container = document.getElementById('main-content');
      if (container && typeof renderGamePage === 'function') renderGamePage(container);
    }
  }
}
window.applyCloudProfileData = applyCloudProfileData;

// Автоматическая проверка при возвращении во вкладку (на телефоне / компьютере)
if (typeof document !== 'undefined') {
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible' && state.currentUser && typeof loadUserData === 'function') {
      loadUserData();
    }
  });
  window.addEventListener('focus', () => {
    if (state.currentUser && typeof loadUserData === 'function') {
      loadUserData();
    }
  });
}

async function loadUserData() {
  const uid = state.currentUser ? state.currentUser.id : 'guest';
  // 1. Мгновенная загрузка из локальной памяти устройства
  try {
    let l = localStorage.getItem('gv_lists_' + uid);
    let r = localStorage.getItem('gv_ratings_' + uid);
    let f = localStorage.getItem('gv_favs_' + uid);
    let cols = localStorage.getItem('gv_collections_' + uid);
    let rec = localStorage.getItem('gv_recent_' + uid);
    let c = localStorage.getItem('gv_custom_' + uid);

    // Если вошли в аккаунт, а под этим uid локально ещё ничего нет — проверяем, были ли списки у гостя
    if (uid !== 'guest' && !l && !r && !f) {
      const gl = localStorage.getItem('gv_lists_guest');
      if (gl) {
        l = gl;
        localStorage.setItem('gv_lists_' + uid, gl);
        localStorage.removeItem('gv_lists_guest');
      }
      const gr = localStorage.getItem('gv_ratings_guest');
      if (gr) {
        r = gr;
        localStorage.setItem('gv_ratings_' + uid, gr);
        localStorage.removeItem('gv_ratings_guest');
      }
    }

    if (l) {
      state.userLists = JSON.parse(l);
    } else if (uid !== 'guest') {
      state.userLists = { want: [], completed: [], dropped: [] };
    }
    if (r) state.userRatings = JSON.parse(r); else if (uid !== 'guest') state.userRatings = {};
    if (f) state.userFavorites = JSON.parse(f); else if (uid !== 'guest') state.userFavorites = [];
    if (cols) state.userCollections = JSON.parse(cols); else if (uid !== 'guest') state.userCollections = [];
    if (rec) state.recentlyViewed = JSON.parse(rec); else if (uid !== 'guest') state.recentlyViewed = [];
    if (c) state.userCustom = JSON.parse(c); else if (uid !== 'guest') state.userCustom = {};
    if (window.applyTheme) window.applyTheme();
    if (window.updateAuthUI) window.updateAuthUI();
  } catch (e) {}

  // 2. Если пользователь вошёл в аккаунт — запрашиваем актуальные данные из облака Firestore!
  if (state.currentUser && window.GVDB && typeof GVDB.loadProfileData === 'function') {
    try {
      const cloud = await GVDB.loadProfileData(state.currentUser.id);
      if (cloud) {
        applyCloudProfileData(cloud);

        // Двусторонняя синхронизация в облако: если на этом устройстве есть данные, которых ещё нет в облаке
        let needCloudPush = false;
        const localCount = (state.userLists.completed?.length || 0) + (state.userLists.want?.length || 0);
        const cloudCount = (cloud.userLists?.completed?.length || 0) + (cloud.userLists?.want?.length || 0);
        if (localCount > cloudCount) needCloudPush = true;

        if (state.userCustom) {
          const cloudCust = cloud.userCustom || {};
          if ((state.userCustom.avatar && !cloudCust.avatar) ||
              (state.userCustom.banner && !cloudCust.banner) ||
              (state.userCustom.bio && !cloudCust.bio) ||
              (state.userCustom.avatarFrame && !cloudCust.avatarFrame) ||
              (state.userCustom.hasEverEquippedFrame && !cloudCust.hasEverEquippedFrame)) {
            needCloudPush = true;
          }
        }

        if (Object.keys(state.userRatings || {}).length > Object.keys(cloud.userRatings || {}).length) {
          needCloudPush = true;
        }

        if ((state.userFavorites || []).length > (cloud.userFavorites || []).length) {
          needCloudPush = true;
        }

        if (needCloudPush) {
          saveUserData();
        }
      } else {
        // Если в облаке совсем пусто (первый запуск после регистрации) — сразу сохраняем то, что есть
        saveUserData();
      }
    } catch (err) {
      console.warn('Cloud sync load error:', err);
    }
  }
}

// Ручная принудительная синхронизация для кнопки в интерфейсе
window.syncProfileNow = async function() {
  gvToast('Синхронизация с облаком...');
  if (typeof loadUserData === 'function') {
    await loadUserData();
    gvToast('Профиль успешно синхронизирован!');
  }
};

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

// Добавляет игру в список («Хочу пройти», «Прошёл» и т.д.) или убирает её оттуда при повторном клике
function toggleList(gameId, list) {
  if (!state.currentUser) {
    showAuthModal();
    gvToast('Пожалуйста, войдите в аккаунт, чтобы добавлять игры в списки');
    return;
  }
  
  state.userLists = state.userLists || { want: [], completed: [], dropped: [] };
  state.userLists.want = state.userLists.want || [];
  state.userLists.completed = state.userLists.completed || [];
  state.userLists.dropped = state.userLists.dropped || [];

  const wasActive = state.userLists[list].includes(gameId);
  
  // Убираем игру из всех трёх списков (игра находится строго в одном списке или ни в одном)
  ['want', 'completed', 'dropped'].forEach(l => {
    state.userLists[l] = state.userLists[l].filter(id => id !== gameId);
  });

  const names = { want: '«Хочу пройти»', completed: '«Прошёл»', dropped: '«Бросил»' };
  let msg = '';

  if (!wasActive) {
    state.userLists[list].push(gameId);
    msg = `Добавлено в ${names[list] || list}`;
    if (window.GVAudio) window.GVAudio.playAdd();
  } else {
    msg = `Удалено из ${names[list] || list}`;
    if (window.GVAudio) window.GVAudio.playClick();
  }

  window._lastLocalListEdit = Date.now();
  saveUserData();
  if (window.updateAuthUI) updateAuthUI();
  if (typeof gvToast === 'function') gvToast(msg);
  
  // Мгновенное обновление страницы без задержек и сброса кнопок
  if (state.currentView === 'game') {
    const container = document.getElementById('main-content');
    if (container && typeof renderGamePage === 'function') renderGamePage(container);
  } else if (state.currentView === 'profile') {
    const container = document.getElementById('main-content');
    if (container && typeof renderProfile === 'function') renderProfile(container);
  } else if (state.currentView === 'home') {
    const container = document.getElementById('main-content');
    if (container && typeof renderHome === 'function') renderHome(container);
  }
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

// Открывает скриншот на весь экран. Клик по фону закрывает его
function openLightbox(src) {
  const overlay = document.createElement('div');
  overlay.className = 'fixed inset-0 z-[100] bg-black/90 backdrop-blur-md flex items-center justify-center p-4 animate-fade cursor-zoom-out';
  overlay.onclick = () => overlay.remove();
  const optimizedSrc = typeof optImg === 'function' ? optImg(src, 1920) : src;
  overlay.innerHTML = `<img src="${optimizedSrc}" referrerpolicy="no-referrer" onerror="if (typeof handleImgError === 'function') handleImgError(this, '${escapeHtml ? escapeHtml(src) : src}');" class="max-w-full max-h-[90vh] rounded-xl shadow-2xl border border-zinc-800">`;
  document.body.appendChild(overlay);
}
