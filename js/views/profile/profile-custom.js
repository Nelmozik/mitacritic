// ===================================================================
// GameVault Profile Customization & Image Cropper
// Темы, анимированные рамки, баннеры, локальная загрузка и интерактивная обрезка
// ===================================================================

// Проверенные и 100% доступные скриншоты для баннеров + анимированные шапки
const PROFILE_BANNERS = [
  { id: 'hk_anim', name: 'Pixel Hollow Knight [Animated]', url: 'assets/banners/hollow_knight_animated.webp', animated: true },
  { id: 'p5r', name: 'Persona 5 Royal', url: 'https://media.rawg.io/media/screenshots/e70/e701311c431504ccd8653a5243188a13.jpg' },
  { id: 'witcher3', name: 'Ведьмак 3', url: 'https://media.rawg.io/media/screenshots/1ac/1ac19f31974314855ad7be266adeb500.jpg' },
  { id: 'cp2077', name: 'Cyberpunk 2077', url: 'https://media.rawg.io/media/screenshots/814/814c25d6fd1fd34a4e6dade645a3bda7.jpg' },
  { id: 'er', name: 'Elden Ring', url: 'https://media.rawg.io/media/screenshots/36f/36f941f72e2b2a41629f5fb3bd448688.jpg' },
  { id: 'rdr2', name: 'Red Dead 2', url: 'https://media.rawg.io/media/screenshots/7b8/7b8895a23e8ca0dbd9e1ba24696579d9.jpg' },
  { id: 'gta5', name: 'GTA V', url: 'https://media.rawg.io/media/screenshots/f95/f9518b1d99210c0cae21fc09e95b4e31.jpg' }
];
window.PROFILE_BANNERS = PROFILE_BANNERS;

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
  if (typeof gvToast === 'function') {
    gvToast(isDark ? 'Включена тёмная тема' : 'Включена светлая тема');
  }
}
window.toggleDarkTheme = toggleDarkTheme;

function selectAvatarFrame(frameId) {
  state.userCustom = state.userCustom || {};
  state.userCustom.avatarFrame = frameId;
  if (frameId && frameId !== 'none') {
    state.userCustom.hasEverEquippedFrame = true;
  }
  saveUserData();

  document.querySelectorAll('#avatar-frame-picker .frame-opt').forEach(btn => {
    const isSel = btn.dataset.frame === frameId;
    btn.classList.toggle('border-violet-500', isSel);
    btn.classList.toggle('bg-violet-950/40', isSel);
    btn.classList.toggle('border-zinc-700', !isSel);
  });

  if (window.updateAuthUI) updateAuthUI();
  if (state.currentView === 'profile' && typeof renderProfile === 'function') {
    renderProfile(document.getElementById('main-content'));
  }
  if (window.GVAudio) window.GVAudio.playAdd();
  if (typeof gvToast === 'function') {
    gvToast('Анимированная рамка успешно сохранена!');
  }
}
window.selectAvatarFrame = selectAvatarFrame;

function toggleSfxAudio(enabled) {
  state.userCustom = state.userCustom || {};
  state.userCustom.sfx = enabled;
  saveUserData();
  if (enabled && window.GVAudio) {
    window.GVAudio.playClick();
  }
  if (typeof gvToast === 'function') {
    gvToast(enabled ? 'Звуковые эффекты включены' : 'Звуковые эффекты выключены');
  }
}
window.toggleSfxAudio = toggleSfxAudio;

function toggle18PlusSetting(enabled) {
  state.settings = state.settings || {};
  state.settings.show18Plus = !!enabled;
  try {
    localStorage.setItem('gv_show_18plus', enabled ? 'true' : 'false');
  } catch (e) {}

  if (window.GVAudio) window.GVAudio.playClick();
  if (typeof gvToast === 'function') {
    gvToast(enabled ? '🔞 Контент 18+ включен' : '🛡️ Контент 18+ скрыт');
  }

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

  if (!imgEl || !letterEl) return;

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
window.updateAvatarPreviews = updateAvatarPreviews;

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
window.cropperState = cropperState;

let cropperEventsAttached = false;

function openCropper(imageSrc, mode = 'avatar') {
  cropperState.mode = mode;
  const modal = document.getElementById('image-cropper-modal');
  if (!modal) return;

  const titleEl = document.getElementById('cropper-title');
  const subEl = document.getElementById('cropper-subtitle');
  if (titleEl) titleEl.textContent = mode === 'avatar' ? 'Обрезка аватарки' : 'Обрезка баннера';
  if (subEl) subEl.textContent = mode === 'avatar' ? 'Круглый видоискатель 1:1 • Перетащите и настройте масштаб' : 'Широкоформатный баннер • Перетащите и настройте масштаб';

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
      fallbackImg.onerror = () => { if (typeof gvToast === 'function') gvToast('Не удалось загрузить изображение'); };
      fallbackImg.src = imageSrc;
      return;
    }
    if (typeof gvToast === 'function') gvToast('Не удалось открыть изображение для обрезки');
  };
  img.src = imageSrc;
  if (img.complete && img.naturalWidth) {
    handleReady();
  }
}
window.openCropper = openCropper;

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

  const frameLeft = Math.round((cropperState.viewportW - cropperState.frameW) / 2);
  const frameTop = Math.round((cropperState.viewportH - cropperState.frameH) / 2);
  frame.style.left = frameLeft + 'px';
  frame.style.top = frameTop + 'px';

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
window.initCropperDimensions = initCropperDimensions;

function updateCropperTransform() {
  const imgEl = document.getElementById('cropper-image');
  if (!imgEl) return;
  imgEl.style.transform = `translate(${cropperState.x}px, ${cropperState.y}px) scale(${cropperState.scale})`;
  imgEl.style.transformOrigin = '0 0';
}
window.updateCropperTransform = updateCropperTransform;

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
window.onCropperZoom = onCropperZoom;

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
window.setCropperScale = setCropperScale;

function resetCropperTransform() {
  initCropperDimensions();
}
window.resetCropperTransform = resetCropperTransform;

function closeCropperModal() {
  const modal = document.getElementById('image-cropper-modal');
  if (modal) modal.classList.add('hidden-view');
}
window.closeCropperModal = closeCropperModal;

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
      if (typeof gvToast === 'function') gvToast('Аватарка успешно сохранена!');
    } else {
      state.userCustom.banner = dataUrl;
      if (typeof gvToast === 'function') gvToast('Баннер успешно сохранен!');
    }

    saveUserData();
    closeCropperModal();
    if (state.currentView === 'profile' && typeof renderProfile === 'function') {
      renderProfile(document.getElementById('main-content'));
    }
  } catch (err) {
    console.error('Cropper export error:', err);
    if (!isAvatar) {
      state.userCustom = state.userCustom || {};
      state.userCustom.banner = cropperState.img.src;
      saveUserData();
      closeCropperModal();
      if (state.currentView === 'profile' && typeof renderProfile === 'function') {
        renderProfile(document.getElementById('main-content'));
      }
      if (typeof gvToast === 'function') gvToast('Баннер успешно сохранен!');
    } else {
      if (typeof gvToast === 'function') gvToast('Не удалось обрезать внешнее изображение. Пожалуйста, загрузите файл с устройства.');
    }
  }
}
window.applyCroppedImage = applyCroppedImage;

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
window.handleLocalAvatarUpload = handleLocalAvatarUpload;

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
window.handleLocalBannerUpload = handleLocalBannerUpload;

function cropCurrentAvatar() {
  const src = (state.userCustom && state.userCustom.avatar) || (state.currentUser && state.currentUser.photo);
  if (!src) {
    const fileInput = document.getElementById('local-avatar-file');
    if (fileInput) fileInput.click();
    return;
  }
  openCropper(src, 'avatar');
}
window.cropCurrentAvatar = cropCurrentAvatar;

function cropCurrentBanner() {
  const src = (state.userCustom && state.userCustom.banner) || PROFILE_BANNERS[0].url;
  openCropper(src, 'banner');
}
window.cropCurrentBanner = cropCurrentBanner;

function resetAvatar() {
  state.userCustom = state.userCustom || {};
  state.userCustom.avatar = '';
  saveUserData();
  updateAvatarPreviews(null);
  if (window.updateAuthUI) updateAuthUI();
  if (typeof renderProfile === 'function') renderProfile(document.getElementById('main-content'));
  if (typeof gvToast === 'function') gvToast('Аватар сброшен');
}
window.resetAvatar = resetAvatar;

function selectBannerPreset(url) {
  if (url.includes('.gif') || url.includes('animated') || url.includes('anim')) {
    state.userCustom = state.userCustom || {};
    state.userCustom.banner = url;
    saveUserData();
    if (typeof renderProfile === 'function') renderProfile(document.getElementById('main-content'));
    if (typeof gvToast === 'function') gvToast('Установлена анимированная шапка профиля!');
    return;
  }
  openCropper(url, 'banner');
}
window.selectBannerPreset = selectBannerPreset;
