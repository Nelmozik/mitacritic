// ===================================================================
// GameVault Profile Edit Modal
// Управление модальным окном редактирования профиля (никнейм, bio, титул, фон, 18+, SFX)
// ===================================================================

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
  if (typeof updateAvatarPreviews === 'function') {
    updateAvatarPreviews(custom.avatar || (state.currentUser && state.currentUser.photo));
  }

  // Выпадающий список доступных титулов игрока
  const titleSelect = document.getElementById('edit-profile-title');
  if (titleSelect) {
    const want = (typeof GAMES !== 'undefined' ? GAMES : []).filter(g => (state.userLists && state.userLists.want || []).includes(g.id));
    const completed = (typeof GAMES !== 'undefined' ? GAMES : []).filter(g => (state.userLists && state.userLists.completed || []).includes(g.id));
    const dropped = (typeof GAMES !== 'undefined' ? GAMES : []).filter(g => (state.userLists && state.userLists.dropped || []).includes(g.id));
    const achievements = typeof getProfileAchievements === 'function' ? getProfileAchievements({ want, completed, dropped }) : [];
    const unlockedCount = achievements.filter(a => a.unlocked).length;
    const available = typeof getAvailableUserTitles === 'function' ? getAvailableUserTitles(unlockedCount) : [];
    const currentTitle = typeof getUserCurrentTitle === 'function' ? getUserCurrentTitle() : { name: '' };

    titleSelect.innerHTML = available.map(t => `
      <option value="${t.name}" ${t.name === currentTitle.name ? 'selected' : ''}>
        ${t.name} (требует ${t.minAchievements} достижений)
      </option>
    `).join('');
  }

  // Пресеты баннеров
  const presetsContainer = document.getElementById('profile-banner-presets');
  if (presetsContainer && typeof PROFILE_BANNERS !== 'undefined') {
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
window.openProfileEditModal = openProfileEditModal;

function closeProfileEditModal() {
  const modal = document.getElementById('profile-edit-modal');
  if (modal) modal.classList.add('hidden-view');
}
window.closeProfileEditModal = closeProfileEditModal;

async function saveProfileCustomization() {
  const nameEl = document.getElementById('edit-profile-name');
  const bioEl = document.getElementById('edit-profile-bio');
  const name = nameEl ? nameEl.value.trim() : '';
  const bio = bioEl ? bioEl.value.trim() : '';

  state.userCustom = state.userCustom || {};
  if (bio) state.userCustom.bio = bio;

  const titleEl = document.getElementById('edit-profile-title');
  if (titleEl && titleEl.value) {
    state.userCustom.selectedTitle = titleEl.value;
  }

  if (state.currentUser) {
    if (!name) {
      if (typeof gvToast === 'function') gvToast('Имя не может быть пустым');
      return;
    }

    try {
      if (window.GVAuth && state.currentUser.username !== name) {
        await GVAuth.setName(name);
      } else {
        state.currentUser.username = name;
        state.currentUser.avatar = name[0].toUpperCase();
        if (typeof updateAuthUI === 'function') updateAuthUI();
      }
    } catch (e) {
      console.warn(e);
    }
  }

  saveUserData();
  closeProfileEditModal();
  if (state.currentView === 'profile' && typeof renderProfile === 'function') {
    renderProfile(document.getElementById('main-content'));
  }
  if (window.GVAudio) window.GVAudio.playAdd();
  if (typeof gvToast === 'function') gvToast('Настройки сохранены!');
}
window.saveProfileCustomization = saveProfileCustomization;
