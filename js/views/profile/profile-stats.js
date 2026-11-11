// ===================================================================
// GameVault Profile Statistics & Achievements
// Титулы, расчет разблокированных бейджей и справочные модалки
// ===================================================================

// Конфигурация титулов пользователя по числу открытых достижений
const ALL_TITLES = [
  { id: 'legend', name: 'Легенда GameVault', minAchievements: 14, icon: 'fa-solid fa-crown', color: 'text-amber-400', badgeClass: 'bg-amber-500/20 text-amber-300 border-amber-500/40 shadow-amber-500/20 shadow-sm' },
  { id: 'master', name: 'Мастер бэклога', minAchievements: 11, icon: 'fa-solid fa-gem', color: 'text-emerald-400', badgeClass: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40' },
  { id: 'veteran', name: 'Ветеран', minAchievements: 8, icon: 'fa-solid fa-trophy', color: 'text-violet-400', badgeClass: 'bg-violet-500/20 text-violet-300 border-violet-500/40' },
  { id: 'pro', name: 'Опытный геймер', minAchievements: 5, icon: 'fa-solid fa-shield-halved', color: 'text-sky-400', badgeClass: 'bg-sky-500/20 text-sky-300 border-sky-500/40' },
  { id: 'explorer', name: 'Исследователь', minAchievements: 2, icon: 'fa-solid fa-compass', color: 'text-teal-400', badgeClass: 'bg-teal-500/20 text-teal-300 border-teal-500/40' },
  { id: 'novice', name: 'Новичок', minAchievements: 0, icon: 'fa-solid fa-seedling', color: 'text-zinc-400', badgeClass: 'bg-zinc-800 text-zinc-300 border-zinc-700' }
];
window.ALL_TITLES = ALL_TITLES;

function getAvailableUserTitles(achievementsUnlocked = 0) {
  return ALL_TITLES.filter(t => achievementsUnlocked >= t.minAchievements);
}
window.getAvailableUserTitles = getAvailableUserTitles;

// Расчет титула по умолчанию на основе количества открытых достижений
function getUserTitle(achievementsUnlocked) {
  for (const t of ALL_TITLES) {
    if (achievementsUnlocked >= t.minAchievements) return t;
  }
  return ALL_TITLES[ALL_TITLES.length - 1];
}
window.getUserTitle = getUserTitle;

// Глобальный хелпер для получения текущего титула игрока (с учётом выбранного в настройках)
function getUserCurrentTitle() {
  if (!state.currentUser) return { name: 'Гость', icon: 'fa-solid fa-user', color: 'text-zinc-500', badgeClass: 'bg-zinc-800 text-zinc-400' };
  const want = (typeof GAMES !== 'undefined' ? GAMES : []).filter(g => (state.userLists && state.userLists.want || []).includes(g.id));
  const completed = (typeof GAMES !== 'undefined' ? GAMES : []).filter(g => (state.userLists && state.userLists.completed || []).includes(g.id));
  const dropped = (typeof GAMES !== 'undefined' ? GAMES : []).filter(g => (state.userLists && state.userLists.dropped || []).includes(g.id));
  const achievements = getProfileAchievements({ want, completed, dropped });
  const unlockedCount = achievements.filter(a => a.unlocked).length;
  const available = getAvailableUserTitles(unlockedCount);

  // Если игрок вручную выбрал титул в настройках и он всё ещё доступен
  const chosen = state.userCustom && state.userCustom.selectedTitle;
  if (chosen) {
    const found = available.find(t => t.name === chosen || t.id === chosen);
    if (found) return found;
  }

  // По умолчанию возвращаем максимальный разблокированный титул
  return available[0] || ALL_TITLES[ALL_TITLES.length - 1];
}
window.getUserCurrentTitle = getUserCurrentTitle;

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

  // Если у пользователя когда-либо была надета рамка или стоит прямо сейчас
  if (custom.avatarFrame && custom.avatarFrame !== 'none') {
    custom.hasEverEquippedFrame = true;
    if (state.userCustom) state.userCustom.hasEverEquippedFrame = true;
  }
  const hasAvatarFrame = Boolean(custom.hasEverEquippedFrame || (custom.avatarFrame && custom.avatarFrame !== 'none'));
  const sfxActive = custom.sfx !== false;

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
      icon: 'fa-solid fa-wand-magic-sparkles',
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
window.getProfileAchievements = getProfileAchievements;

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
              <h4 class="font-bold text-white text-xs sm:text-sm truncate">${escapeHtml(ach.title)}</h4>
              <span class="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">✓</span>
            </div>
            <p class="text-zinc-400 text-[11px] sm:text-xs leading-relaxed">${escapeHtml(ach.desc)}</p>
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
            <h4 class="font-bold text-zinc-300 text-xs sm:text-sm truncate">${escapeHtml(ach.title)}</h4>
            <span class="text-[10px] font-mono text-zinc-500">${ach.progress}</span>
          </div>
          <p class="text-zinc-500 text-[11px] sm:text-xs leading-relaxed">${escapeHtml(ach.desc)}</p>
        </div>
      </div>
    </div>
  `;
}
window.renderAchievementCard = renderAchievementCard;

// ---------------- Модальные окна справки и правил ----------------
function openAchievementsGuideModal() {
  const modal = document.getElementById('achievements-guide-modal');
  if (modal) modal.classList.remove('hidden-view');
}
window.openAchievementsGuideModal = openAchievementsGuideModal;

function closeAchievementsGuideModal() {
  const modal = document.getElementById('achievements-guide-modal');
  if (modal) modal.classList.add('hidden-view');
}
window.closeAchievementsGuideModal = closeAchievementsGuideModal;

function openCommunityRulesModal() {
  const modal = document.getElementById('community-rules-modal');
  if (modal) modal.classList.remove('hidden-view');
}
window.openCommunityRulesModal = openCommunityRulesModal;

function closeCommunityRulesModal() {
  const modal = document.getElementById('community-rules-modal');
  if (modal) modal.classList.add('hidden-view');
}
window.closeCommunityRulesModal = closeCommunityRulesModal;

function openBugReportModal() {
  const modal = document.getElementById('bug-report-modal');
  if (modal) {
    const txt = document.getElementById('bug-text');
    if (txt) txt.value = '';
    modal.classList.remove('hidden-view');
  }
}
window.openBugReportModal = openBugReportModal;

function closeBugReportModal() {
  const modal = document.getElementById('bug-report-modal');
  if (modal) modal.classList.add('hidden-view');
}
window.closeBugReportModal = closeBugReportModal;

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
  const userUid = state.currentUser ? state.currentUser.id : 'anon';
  const timestamp = new Date().toLocaleString('ru-RU');
  const currentUrl = window.location.href;
  const userAgent = navigator.userAgent;
  const screenResolution = `${window.innerWidth}x${window.innerHeight}`;

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
        if (typeof gvToast === 'function') gvToast('Сообщение об ошибке успешно отправлено разработчику на почту! Спасибо!');
      } else {
        throw new Error('Server responded with ' + res.status);
      }
    } catch (err) {
      console.error('Ошибка отправки баг-репорта:', err);
      closeBugReportModal();
      if (typeof gvToast === 'function') gvToast('Репорт сохранен локально (ошибка соединения с веб-сервисом)');
    } finally {
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.innerHTML = 'Отправить';
      }
    }
  } else {
    closeBugReportModal();
    if (typeof gvToast === 'function') gvToast('Репорт принят и сохранен локально! Чтобы получать их на email, укажите ключ в js/config.js');
  }
}
window.submitBugReport = submitBugReport;
