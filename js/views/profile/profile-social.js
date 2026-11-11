// ===================================================================
// GameVault Profile Social
// Подписки, подписчики, поиск зарегистрированных игроков через Firestore
// ===================================================================

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
    .then(async ([following, followers]) => {
      const myName = (state.currentUser && state.currentUser.username || '').toLowerCase();
      const cleanFollowing = [];
      for (const item of (following || [])) {
        const itemLow = (item.name || '').toLowerCase();
        if (itemLow === 'nelmozik' || (myName && itemLow === myName) || (item.uid && item.uid.toLowerCase().includes('nelmozik'))) {
          try {
            if (window.GVDB && typeof GVDB.unfollow === 'function') {
              await GVDB.unfollow(item.uid || item.name);
            }
          } catch (e) {}
        } else {
          cleanFollowing.push(item);
        }
      }
      state.social.following = cleanFollowing;
      state.social.followers = followers || [];
      state.social.status = 'ready';
      if (typeof saveStoredFollowing === 'function') {
        saveStoredFollowing(cleanFollowing.map(f => f.name));
      }
    })
    .catch(e => {
      console.warn('Подписки:', e);
      state.social.status = 'error';
      state.social.error = e.code || e.message || 'unknown';
    })
    .then(() => {
      if (state.currentView === 'profile' && typeof renderProfile === 'function') {
        renderProfile(document.getElementById('main-content'));
      }
    });
}
window.ensureSocial = ensureSocial;

function personRow(person) {
  const following = (state.social.following || []).some(p => p.uid === person.uid);
  const safePhoto = typeof sanitizeImageUrl === 'function' ? sanitizeImageUrl(person.photo) : person.photo;
  const avatar = safePhoto
    ? `<img src="${escapeHtml(safePhoto)}" referrerpolicy="no-referrer" class="w-full h-full object-cover" alt="">`
    : escapeHtml((person.name || '?')[0].toUpperCase());
  const safeName = escapeHtml(person.name || 'Игрок');
  const safeUid = escapeHtml(person.uid || '');
  return `
    <div class="flex items-center gap-4 p-3 rounded-xl bg-zinc-900/50 border border-zinc-800">
      <div class="w-11 h-11 rounded-full overflow-hidden bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center font-bold text-white flex-shrink-0">${avatar}</div>
      <div class="flex-1 min-w-0 font-semibold text-white truncate">${safeName}</div>
      ${following
        ? `<button data-action="unfollow-uid" data-uid="${safeUid}" class="px-4 py-2 rounded-lg text-sm font-semibold bg-zinc-800 hover:bg-red-500/20 hover:text-red-300 text-zinc-300 border border-zinc-700 transition cursor-pointer">Вы подписаны</button>`
        : `<button data-action="follow-uid" data-uid="${safeUid}" class="px-4 py-2 rounded-lg text-sm font-semibold bg-violet-600 hover:bg-violet-500 text-white transition cursor-pointer">Подписаться</button>`}
    </div>
  `;
}
window.personRow = personRow;

function socialStatusMessage() {
  const social = state.social;
  if (!social) return '';
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
window.socialStatusMessage = socialStatusMessage;

function renderFollowing() {
  const query = (state.social && state.social.query || '').trim();

  return `
    <div class="max-w-3xl space-y-8">
      <!-- Поиск по подпискам и сообществу -->
      <div class="relative">
        <i class="fa-solid fa-magnifying-glass absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500 text-sm pointer-events-none"></i>
        <input id="people-search" type="text" value="${escapeHtml(state.social?.query || '')}" 
               oninput="handlePeopleSearch(this.value)"
               placeholder="Найти игрока среди подписок или сообщества..." 
               class="w-full bg-zinc-900 border border-zinc-700/80 rounded-xl pl-11 pr-10 py-3 text-white placeholder-zinc-500 focus:outline-none focus:border-violet-500 text-sm">
        ${query ? `
          <button onclick="clearPeopleSearch()" class="absolute right-3.5 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 cursor-pointer" title="Очистить поиск">
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
window.renderFollowing = renderFollowing;

function renderFollowingListsOnly() {
  const myName = (state.currentUser && state.currentUser.username || '').toLowerCase();
  const allFollowing = typeof getStoredFollowing === 'function' ? getStoredFollowing() : [];
  const followingNames = allFollowing.filter(name => {
    if (!name) return false;
    const low = name.toLowerCase();
    return low !== 'nelmozik' && (!myName || low !== myName);
  });
  const rawQuery = (state.social && state.social.query || '').trim();
  const query = rawQuery.toLowerCase();

  let filtered = followingNames;
  if (query) {
    filtered = followingNames.filter(name => name.toLowerCase().includes(query));
  }

  const rawDbUsers = (state.social && state.social.dbUsers) || [];
  const dbUsers = rawDbUsers.map(u => typeof u === 'string' ? u : (u.name || u.displayName || ''))
    .filter(name => {
      if (!name) return false;
      const low = name.toLowerCase();
      return low !== 'nelmozik' && (!myName || low !== myName);
    });

  const communityMatches = query 
    ? dbUsers.filter(name => name.toLowerCase().includes(query) && !followingNames.some(u => u.toLowerCase() === name.toLowerCase()))
    : [];

  const isSearching = Boolean(state.social && state.social._searching);
  const hasAnyMatches = filtered.length > 0 || communityMatches.length > 0;

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
            const safeUname = escapeHtml(p.username);
            return `
              <div class="flex items-center justify-between gap-4 p-4 rounded-2xl bg-zinc-900/40 border border-zinc-800/80 hover:border-zinc-700 transition">
                <div class="flex items-center gap-3.5 min-w-0 cursor-pointer group" data-action="show-profile" data-username="${safeUname}">
                  <div class="avatar-frame-wrap ${p.avatarFrame} flex-shrink-0">
                    <div class="w-12 h-12 rounded-full overflow-hidden bg-gradient-to-br ${p.avatarBg} flex items-center justify-center font-bold text-white text-base shadow border border-white/20">
                      ${p.avatar}
                    </div>
                  </div>
                  <div class="min-w-0">
                    <div class="font-bold text-white text-sm group-hover:text-violet-300 transition flex items-center gap-1.5">
                      <span>${safeUname}</span>
                      <i class="fa-solid fa-arrow-up-right-from-square text-[10px] text-zinc-500 opacity-0 group-hover:opacity-100 transition"></i>
                    </div>
                    <div class="text-xs text-zinc-400 line-clamp-1 mt-0.5">${escapeHtml(p.bio || '')}</div>
                    <div class="text-[11px] text-zinc-500 mt-1 flex items-center gap-2">
                      <span><i class="fa-solid fa-gamepad text-violet-400 mr-1"></i>${p.completed ? p.completed.length : 0} игр</span>
                      <span>•</span>
                      <span><i class="fa-solid fa-users text-blue-400 mr-1"></i>${p.followersCount || 0} подписчиков</span>
                    </div>
                  </div>
                </div>
                <div class="flex items-center gap-2 flex-shrink-0">
                  <button data-action="toggle-follow" data-username="${safeUname}" class="px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-zinc-800/80 hover:bg-red-500/20 text-zinc-300 hover:text-red-400 border border-zinc-700 transition cursor-pointer">
                    Отписаться
                  </button>
                  <button data-action="show-profile" data-username="${safeUname}" class="px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-violet-600/20 hover:bg-violet-600 text-violet-300 hover:text-white border border-violet-500/40 transition cursor-pointer">
                    Профиль →
                  </button>
                </div>
              </div>
            `;
          }).join('')}
        </div>
      ` : (query ? '' : profileEmpty('😴', 'Вы пока ни на кого не подписаны. Найдите зарегистрированных друзей через поиск выше!'))}
    </div>

    <!-- Индикатор поиска -->
    ${isSearching ? `
      <div class="py-3 text-center text-xs text-zinc-500 flex items-center justify-center gap-2">
        <i class="fa-solid fa-spinner fa-spin text-violet-400"></i> Поиск среди зарегистрированных игроков в базе данных...
      </div>
    ` : ''}

    <!-- Результаты поиска среди зарегистрированных игроков в Firestore -->
    ${query && communityMatches.length > 0 ? `
      <div class="pt-6 border-t border-zinc-800/80">
        <h3 class="text-sm font-bold text-zinc-400 uppercase tracking-wider mb-4 flex items-center gap-2">
          <i class="fa-solid fa-user-check text-emerald-400"></i> Зарегистрированные игроки (${communityMatches.length})
        </h3>
        <div class="space-y-3">
          ${communityMatches.map(name => {
            const p = typeof getPublicProfile === 'function' ? getPublicProfile(name) : null;
            if (!p) return '';
            const safeUname = escapeHtml(p.username);
            return `
              <div class="flex items-center justify-between gap-4 p-4 rounded-2xl bg-zinc-900/50 border border-zinc-800 hover:border-zinc-700 transition">
                <div class="flex items-center gap-3.5 min-w-0 cursor-pointer group" data-action="show-profile" data-username="${safeUname}">
                  <div class="avatar-frame-wrap ${p.avatarFrame} flex-shrink-0">
                    <div class="w-12 h-12 rounded-full overflow-hidden bg-gradient-to-br ${p.avatarBg} flex items-center justify-center font-bold text-white text-base shadow">
                      ${p.avatar}
                    </div>
                  </div>
                  <div class="min-w-0">
                    <div class="font-bold text-white text-sm group-hover:text-violet-300 transition">${safeUname}</div>
                    <div class="text-xs text-zinc-400 line-clamp-1 mt-0.5">${p.userTitle ? escapeHtml(p.userTitle.name) : 'Игрок'} • ${p.followersCount || 0} подп.</div>
                  </div>
                </div>
                <div class="flex items-center gap-2 flex-shrink-0">
                  <button data-action="toggle-follow" data-username="${safeUname}" class="px-3.5 py-1.5 rounded-xl text-xs font-bold bg-violet-600 hover:bg-violet-500 text-white transition flex items-center gap-1.5 cursor-pointer shadow-sm">
                    <i class="fa-solid fa-plus text-[10px]"></i> Подписаться
                  </button>
                  <button data-action="show-profile" data-username="${safeUname}" class="px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-violet-600/20 hover:bg-violet-600 text-violet-300 hover:text-white border border-violet-500/40 transition cursor-pointer">
                    Профиль →
                  </button>
                </div>
              </div>
            `;
          }).join('')}
        </div>
      </div>
    ` : ''}

    <!-- Сообщение, если при поиске ничего не найдено -->
    ${query && !hasAnyMatches && !isSearching ? `
      <div class="py-12 text-center text-zinc-500">
        <div class="w-12 h-12 rounded-full bg-zinc-800/80 flex items-center justify-center mx-auto mb-3 text-zinc-400 text-lg">
          <i class="fa-solid fa-user-slash"></i>
        </div>
        <div class="text-sm font-semibold text-zinc-300 mb-1">Игрок не найден</div>
        <div class="text-xs text-zinc-500">Среди зарегистрированных игроков никнейм «${escapeHtml(rawQuery)}» не найден</div>
      </div>
    ` : ''}
  `;
}
window.renderFollowingListsOnly = renderFollowingListsOnly;

let _peopleSearchTimer = null;
function handlePeopleSearch(val) {
  state.social = state.social || {};
  state.social.query = val;
  const q = (val || '').trim();

  clearTimeout(_peopleSearchTimer);
  if (q.length >= 1 && window.GVDB && typeof GVDB.searchUsers === 'function') {
    state.social._searching = true;
    const listContainer = document.getElementById('following-list-container');
    if (listContainer) listContainer.innerHTML = renderFollowingListsOnly();

    _peopleSearchTimer = setTimeout(async () => {
      try {
        const users = await GVDB.searchUsers(q);
        if (state.social && state.social.query === val) {
          state.social.dbUsers = (users || []).map(u => u.name);
          state.social._searching = false;
          const c = document.getElementById('following-list-container');
          if (c) c.innerHTML = renderFollowingListsOnly();
        }
      } catch (e) {
        if (state.social) state.social._searching = false;
        console.warn('DB search failed:', e);
      }
    }, 150);
  } else {
    state.social._searching = false;
    state.social.dbUsers = [];
    const listContainer = document.getElementById('following-list-container');
    if (listContainer) listContainer.innerHTML = renderFollowingListsOnly();
  }
}
window.handlePeopleSearch = handlePeopleSearch;

function clearPeopleSearch() {
  state.social = state.social || {};
  state.social.query = '';
  state.social.dbUsers = [];
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
window.clearPeopleSearch = clearPeopleSearch;

function getStoredFollowers() {
  if (state.social && Array.isArray(state.social.followers)) {
    return state.social.followers.map(f => typeof f === 'string' ? f : (f.name || f.displayName || '')).filter(Boolean);
  }
  try {
    const raw = localStorage.getItem('gv_followers');
    if (raw) return JSON.parse(raw);
  } catch (e) {}
  return [];
}
window.getStoredFollowers = getStoredFollowers;

function renderFollowers() {
  const followersNames = getStoredFollowers();
  return `
    <div class="max-w-3xl space-y-4">
      <h3 class="text-sm font-bold text-zinc-400 uppercase tracking-wider mb-3 flex items-center justify-between">
        <span>Ваши подписчики</span>
        <span class="text-xs text-zinc-500 font-normal">${followersNames.length} игроков</span>
      </h3>
      ${followersNames.length > 0 ? `
        <div class="space-y-3">
          ${followersNames.map(name => {
            const p = typeof getPublicProfile === 'function' ? getPublicProfile(name) : null;
            if (!p) return '';
            const safeUname = escapeHtml(p.username);
            const isFollowed = typeof isFollowingUser === 'function' && isFollowingUser(name);
            return `
              <div class="flex items-center justify-between gap-4 p-4 rounded-2xl bg-zinc-900/40 border border-zinc-800/80 hover:border-zinc-700 transition">
                <div class="flex items-center gap-3.5 min-w-0 cursor-pointer group" data-action="show-profile" data-username="${safeUname}">
                  <div class="avatar-frame-wrap ${p.avatarFrame} flex-shrink-0">
                    <div class="w-12 h-12 rounded-full overflow-hidden bg-gradient-to-br ${p.avatarBg} flex items-center justify-center font-bold text-white text-base shadow border border-white/20">
                      ${p.avatar}
                    </div>
                  </div>
                  <div class="min-w-0">
                    <div class="font-bold text-white text-sm group-hover:text-violet-300 transition flex items-center gap-1.5">
                      <span>${safeUname}</span>
                      <i class="fa-solid fa-arrow-up-right-from-square text-[10px] text-zinc-500 opacity-0 group-hover:opacity-100 transition"></i>
                    </div>
                    <div class="text-xs text-zinc-400 line-clamp-1 mt-0.5">${escapeHtml(p.bio || '')}</div>
                    <div class="text-[11px] text-zinc-500 mt-1 flex items-center gap-2">
                      <span>${p.userTitle ? escapeHtml(p.userTitle.name) : 'Игрок'}</span>
                      <span>•</span>
                      <span><i class="fa-solid fa-users text-blue-400 mr-1"></i>${p.followersCount || 0} подписчиков</span>
                    </div>
                  </div>
                </div>
                <div class="flex items-center gap-2 flex-shrink-0">
                  ${isFollowed
                    ? `<button data-action="toggle-follow" data-username="${safeUname}" class="px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-zinc-800/80 hover:bg-red-500/20 text-zinc-300 hover:text-red-400 border border-zinc-700 transition cursor-pointer">
                        Вы подписаны
                      </button>`
                    : `<button data-action="toggle-follow" data-username="${safeUname}" class="px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-violet-600 hover:bg-violet-500 text-white transition flex items-center gap-1.5 cursor-pointer">
                        <i class="fa-solid fa-plus text-[10px]"></i> В ответ
                      </button>`}
                  <button data-action="show-profile" data-username="${safeUname}" class="px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-violet-600/20 hover:bg-violet-600 text-violet-300 hover:text-white border border-violet-500/40 transition cursor-pointer">
                    Профиль →
                  </button>
                </div>
              </div>
            `;
          }).join('')}
        </div>
      ` : (typeof profileEmpty === 'function' ? profileEmpty('👥', 'У вас пока нет подписчиков.') : '')}
    </div>
  `;
}
window.renderFollowers = renderFollowers;

function searchPeople() {
  const input = document.getElementById('people-search');
  const query = input ? input.value.trim() : '';
  state.social.query = query;

  if (!query) {
    state.social.results = [];
    if (typeof renderProfile === 'function') renderProfile(document.getElementById('main-content'));
    return;
  }

  if (window.GVDB && typeof GVDB.searchUsers === 'function') {
    GVDB.searchUsers(query)
      .then(results => { state.social.results = results; })
      .catch(e => { state.social.results = []; if (typeof gvToast === 'function') gvToast('Не удалось выполнить поиск'); console.warn(e); })
      .then(() => { if (typeof renderProfile === 'function') renderProfile(document.getElementById('main-content')); });
  }
}
window.searchPeople = searchPeople;

function findPerson(uid) {
  const social = state.social;
  if (!social) return null;
  return (social.results || []).concat(social.following || [], social.followers || []).find(p => p.uid === uid);
}
window.findPerson = findPerson;

function followUser(uid) {
  const person = findPerson(uid);
  if (!person) return;
  if (window.GVDB && typeof GVDB.follow === 'function') {
    GVDB.follow(person)
      .then(() => {
        state.social.following.push(person);
        if (typeof gvToast === 'function') gvToast('Вы подписались на ' + person.name);
      })
      .catch(e => { if (typeof gvToast === 'function') gvToast('Не удалось подписаться'); console.warn(e); })
      .then(() => { if (typeof renderProfile === 'function') renderProfile(document.getElementById('main-content')); });
  }
}
window.followUser = followUser;

function unfollowUser(uid) {
  if (window.GVDB && typeof GVDB.unfollow === 'function') {
    GVDB.unfollow(uid)
      .then(() => {
        state.social.following = (state.social.following || []).filter(p => p.uid !== uid && p.name !== uid);
        if (typeof saveStoredFollowing === 'function') {
          saveStoredFollowing(state.social.following.map(f => f.name));
        }
        if (typeof gvToast === 'function') gvToast('Вы отписались');
      })
      .catch(e => { if (typeof gvToast === 'function') gvToast('Не удалось отписаться'); console.warn(e); })
      .then(() => { if (typeof renderProfile === 'function') renderProfile(document.getElementById('main-content')); });
  } else {
    state.social.following = (state.social.following || []).filter(p => p.uid !== uid && p.name !== uid);
    if (typeof saveStoredFollowing === 'function') {
      saveStoredFollowing(state.social.following.map(f => f.name));
    }
    if (typeof gvToast === 'function') gvToast('Вы отписались');
    if (typeof renderProfile === 'function') renderProfile(document.getElementById('main-content'));
  }
}
window.unfollowUser = unfollowUser;
