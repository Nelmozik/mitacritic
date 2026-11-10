// Система отзывов GameVault: добавление, редактирование, плюсы/минусы, защита от накрутки и синхронизация

let currentReviewGame = null;   // игра, для которой сейчас пишут/редактируют отзыв
let selectedReviewRating = null; // оценка, выбранная в окне отзыва
let selectedReviewTags = [];    // теги, выбранные в окне отзыва
let currentEditingReviewId = null; // id отзыва при редактировании

// Числовые оценки для каждого варианта
const RATING_SCORES = {
  exceptional: 10,
  recommended: 8,
  meh:         6,
  skip:        3
};

// ---------------- Хранилище голосов (лайки/дизлайки без накрутки, строго для авторизованных) ----------------
function getReviewVotes() {
  if (typeof state === 'undefined' || !state.currentUser) return {};
  try {
    return JSON.parse(localStorage.getItem(`gv_review_votes_${state.currentUser.id}`) || '{}');
  } catch (e) {
    return {};
  }
}

function getReviewVote(reviewId) {
  const votes = getReviewVotes();
  return votes[reviewId] || null; // 'like' | 'dislike' | null
}
window.getReviewVote = getReviewVote;

function setReviewVote(reviewId, vote) {
  if (typeof state === 'undefined' || !state.currentUser) return;
  const votes = getReviewVotes();
  if (!vote) {
    delete votes[reviewId];
  } else {
    votes[reviewId] = vote;
  }
  try {
    localStorage.setItem(`gv_review_votes_${state.currentUser.id}`, JSON.stringify(votes));
  } catch (e) {}
}

// ---------------- Сохранение и загрузка отзывов ----------------
function saveReviewsStore() {
  try {
    // Сохраняем все отзывы пользователя в локальное хранилище
    const userReviews = state.userReviews || [];
    localStorage.setItem('gv_user_reviews', JSON.stringify(userReviews));

    // Также сохраняем пользовательские отзывы для конкретных игр в общий каталог
    const localStore = {};
    for (const gid in REVIEWS) {
      localStore[gid] = REVIEWS[gid];
    }
    localStorage.setItem('gv_reviews_store', JSON.stringify(localStore));

    // Синхронизируем с профилем в Firestore если пользователь авторизован
    if (state.currentUser && window.GVDB && typeof GVDB.saveProfileData === 'function') {
      GVDB.saveProfileData(state.currentUser.id, {
        userReviews: userReviews
      }).catch(e => console.warn('Sync userReviews error:', e));
    }
  } catch (e) {
    console.warn('saveReviewsStore:', e);
  }
}
window.saveReviewsStore = saveReviewsStore;

function initReviewsStore() {
  try {
    // 1. Восстанавливаем пользовательские отзывы
    const rawUser = localStorage.getItem('gv_user_reviews');
    if (rawUser) {
      state.userReviews = JSON.parse(rawUser);
    }
    // 2. Восстанавливаем каталог отзывов по играм
    const rawAll = localStorage.getItem('gv_reviews_store');
    if (rawAll) {
      const parsed = JSON.parse(rawAll);
      for (const gid in parsed) {
        if (!REVIEWS[gid]) REVIEWS[gid] = [];
        // Объединяем без дубликатов по id
        const existingIds = new Set(REVIEWS[gid].map(r => r.id));
        parsed[gid].forEach(r => {
          if (!existingIds.has(r.id)) {
            REVIEWS[gid].unshift(r);
            existingIds.add(r.id);
          }
        });
      }
    }
  } catch (e) {
    console.warn('initReviewsStore error:', e);
  }
}
window.initReviewsStore = initReviewsStore;

// Вызываем инициализацию сразу при загрузке скрипта
if (typeof document !== 'undefined') {
  initReviewsStore();
}

// ---------------- Модальное окно создания и редактирования отзыва ----------------

// Открывает окно для написания или редактирования отзыва
function openReviewModal(gameId, reviewToEdit = null) {
  if (!state.currentUser) {
    if (typeof showAuthModal === 'function') showAuthModal();
    if (typeof gvToast === 'function') gvToast('Пожалуйста, войдите в аккаунт, чтобы оставить отзыв');
    return;
  }

  currentReviewGame = (typeof GAMES !== 'undefined' ? GAMES : []).find(g => g.id === gameId);
  if (!currentReviewGame && reviewToEdit && reviewToEdit.gameId) {
    currentReviewGame = (typeof GAMES !== 'undefined' ? GAMES : []).find(g => g.id === reviewToEdit.gameId);
  }
  if (!currentReviewGame && state.currentGame) {
    currentReviewGame = state.currentGame;
  }
  if (!currentReviewGame) return;

  currentEditingReviewId = reviewToEdit ? reviewToEdit.id : null;

  // Обновляем заголовок игры и модалки
  const titleEl = document.getElementById('review-game-title');
  if (titleEl) titleEl.textContent = currentReviewGame.title;

  const modalTitle = document.getElementById('review-modal-title');
  if (modalTitle) modalTitle.textContent = reviewToEdit ? 'Редактировать отзыв' : 'Обзор игры';

  const submitText = document.getElementById('review-submit-btn-text');
  if (submitText) submitText.textContent = reviewToEdit ? 'Сохранить изменения' : 'Опубликовать';

  const editIdEl = document.getElementById('editing-review-id');
  if (editIdEl) editIdEl.value = currentEditingReviewId || '';

  // Заполняем поля ввода
  const titleInput = document.getElementById('review-title-input');
  if (titleInput) titleInput.value = reviewToEdit ? (reviewToEdit.title || '') : '';

  const textInput = document.getElementById('review-text');
  if (textInput) textInput.value = reviewToEdit ? (reviewToEdit.body || '') : '';

  const prosInput = document.getElementById('review-pros-input');
  if (prosInput) prosInput.value = reviewToEdit ? (reviewToEdit.pros || '') : '';

  const consInput = document.getElementById('review-cons-input');
  if (consInput) consInput.value = reviewToEdit ? (reviewToEdit.cons || '') : '';

  selectedReviewRating = reviewToEdit ? reviewToEdit.rating : null;
  selectedReviewTags = reviewToEdit ? [...(reviewToEdit.tags || [])] : [];

  // Подсветка рейтинга
  document.querySelectorAll('.review-rating-btn').forEach(btn => {
    btn.classList.remove('bg-violet-600', 'border-violet-500');
    btn.classList.add('border-zinc-700');
    if (reviewToEdit && selectedReviewRating && btn.getAttribute('onclick').includes(`'${selectedReviewRating}'`)) {
      btn.classList.remove('border-zinc-700');
      btn.classList.add('bg-violet-600', 'border-violet-500');
    }
  });

  // Подсветка тегов
  document.querySelectorAll('.review-tag').forEach(tag => {
    const rawTag = tag.textContent.replace(/[«»]/g, '').trim();
    const isSelected = selectedReviewTags.includes(rawTag);
    tag.classList.toggle('selected', isSelected);
    tag.classList.toggle('bg-violet-600', isSelected);
    tag.classList.toggle('border-violet-500', isSelected);
    tag.classList.toggle('bg-zinc-800', !isSelected);
    tag.classList.toggle('border-zinc-700', !isSelected);
  });

  const modal = document.getElementById('review-modal');
  if (modal) modal.classList.remove('hidden-view');
}
window.openReviewModal = openReviewModal;

// Закрывает окно отзыва
function closeReviewModal() {
  const modal = document.getElementById('review-modal');
  if (modal) modal.classList.add('hidden-view');
  currentEditingReviewId = null;
}
window.closeReviewModal = closeReviewModal;

// Запуск редактирования существующего отзыва
function editReview(reviewId, gameId) {
  let targetReview = null;
  let targetGid = gameId;

  // Ищем отзыв в REVIEWS
  for (const gid in REVIEWS) {
    const found = REVIEWS[gid].find(r => r.id === reviewId);
    if (found) {
      targetReview = found;
      targetGid = parseInt(gid, 10);
      break;
    }
  }

  // Если не нашли в REVIEWS, ищем в state.userReviews
  if (!targetReview && state.userReviews) {
    targetReview = state.userReviews.find(r => r.id === reviewId);
    if (targetReview && targetReview.gameId) targetGid = targetReview.gameId;
  }

  if (!targetReview) {
    if (typeof gvToast === 'function') gvToast('Отзыв не найден');
    return;
  }

  openReviewModal(targetGid, targetReview);
}
window.editReview = editReview;

// Подсвечивает выбранную оценку («Исключительно», «Рекомендуем» и т.д.)
function selectReviewRating(rating) {
  selectedReviewRating = rating;

  document.querySelectorAll('.review-rating-btn').forEach(btn => {
    btn.classList.remove('bg-violet-600', 'border-violet-500');
    btn.classList.add('border-zinc-700');
  });

  if (event && event.currentTarget) {
    event.currentTarget.classList.remove('border-zinc-700');
    event.currentTarget.classList.add('bg-violet-600', 'border-violet-500');
  }
}
window.selectReviewRating = selectReviewRating;

// Переключение тега отзыва
function toggleReviewTag(element) {
  const tagText = element.textContent.replace(/[«»]/g, '').trim();

  if (element.classList.contains('selected')) {
    element.classList.remove('selected', 'bg-violet-600', 'border-violet-500');
    element.classList.add('bg-zinc-800', 'border-zinc-700');
    selectedReviewTags = selectedReviewTags.filter(t => t !== tagText);
  } else {
    element.classList.remove('bg-zinc-800', 'border-zinc-700');
    element.classList.add('selected', 'bg-violet-600', 'border-violet-500');
    if (!selectedReviewTags.includes(tagText)) {
      selectedReviewTags.push(tagText);
    }
  }
}
window.toggleReviewTag = toggleReviewTag;

// Сохранение нового или отредактированного отзыва
function submitReview() {
  if (!currentReviewGame || !state.currentUser) return;

  const titleInput = document.getElementById('review-title-input');
  const textInput = document.getElementById('review-text');
  const prosInput = document.getElementById('review-pros-input');
  const consInput = document.getElementById('review-cons-input');

  const text = (textInput ? textInput.value : '').trim();
  const rawTitle = (titleInput ? titleInput.value : '').trim();
  const pros = (prosInput ? prosInput.value : '').trim();
  const cons = (consInput ? consInput.value : '').trim();

  if (!selectedReviewRating) {
    if (typeof gvAlert === 'function') {
      gvAlert('Пожалуйста, выберите оценку игры (Рекомендуем, Исключительно и т.д.)', {
        title: 'Оценка не выбрана',
        icon: 'fa-solid fa-star',
        iconColor: 'text-amber-400',
        iconBg: 'bg-amber-500/20 border-amber-500/40 text-amber-400'
      });
    } else {
      alert('Пожалуйста, выберите оценку (Рекомендуем, Исключительно и т.д.)');
    }
    return;
  }

  if (!text && !rawTitle && selectedReviewTags.length === 0) {
    if (typeof gvAlert === 'function') {
      gvAlert('Пожалуйста, напишите заголовок или текст вашего отзыва', {
        title: 'Отзыв пуст',
        icon: 'fa-solid fa-pen-to-square'
      });
    } else {
      alert('Пожалуйста, напишите заголовок или текст отзыва');
    }
    return;
  }

  const score = RATING_SCORES[selectedReviewRating] || 8;
  const finalTitle = rawTitle || (text ? text.split('.')[0].slice(0, 60) : 'Впечатления об игре');
  const finalBody = text || 'Рекомендую к прохождению!';

  const gid = currentReviewGame.id;
  if (!REVIEWS[gid]) REVIEWS[gid] = [];
  state.userReviews = state.userReviews || [];

  if (currentEditingReviewId) {
    // ---------------- Режим обновления существующего отзыва ----------------
    const editId = currentEditingReviewId;
    let updated = false;

    // Обновляем в REVIEWS
    const inCatalog = REVIEWS[gid].find(r => r.id === editId);
    if (inCatalog) {
      inCatalog.title = finalTitle;
      inCatalog.body = finalBody;
      inCatalog.pros = pros;
      inCatalog.cons = cons;
      inCatalog.rating = selectedReviewRating;
      inCatalog.score = score;
      inCatalog.tags = selectedReviewTags;
      updated = true;
    }

    // Обновляем в state.userReviews
    const inUser = state.userReviews.find(r => r.id === editId);
    if (inUser) {
      inUser.title = finalTitle;
      inUser.body = finalBody;
      inUser.pros = pros;
      inUser.cons = cons;
      inUser.rating = selectedReviewRating;
      inUser.score = score;
      inUser.tags = selectedReviewTags;
      updated = true;
    }

    closeReviewModal();
    saveReviewsStore();
    if (typeof gvToast === 'function') gvToast('Отзыв успешно обновлён!');
  } else {
    // ---------------- Режим создания нового отзыва ----------------
    const newReview = {
      id: Date.now(),
      gameId: gid,
      gameTitle: currentReviewGame.title,
      user: state.currentUser.username,
      avatar: state.currentUser.avatar || state.currentUser.username[0].toUpperCase(),
      score: score,
      title: finalTitle,
      body: finalBody,
      tags: selectedReviewTags,
      rating: selectedReviewRating,
      pros: pros,
      cons: cons,
      likes: 0,
      dislikes: 0,
      date: new Date().toLocaleDateString('ru-RU'),
      helpful: false
    };

    REVIEWS[gid].unshift(newReview);
    state.userReviews.unshift(newReview);

    closeReviewModal();
    saveReviewsStore();
    if (typeof gvToast === 'function') gvToast('Отзыв опубликован!');
  }

  // Обновляем открытую страницу
  if (state.currentView === 'game' && state.currentGame && state.currentGame.id === gid) {
    if (typeof renderGamePage === 'function') {
      renderGamePage(document.getElementById('main-content'));
    }
  } else if (state.currentView === 'profile') {
    if (typeof renderProfile === 'function') {
      renderProfile(document.getElementById('main-content'));
    }
  }
}
window.submitReview = submitReview;

// ---------------- Лайки и Дизлайки без накрутки (возможность снять лайк/дизлайк) ----------------

// Найти объект отзыва в REVIEWS или state.userReviews
function findReviewById(reviewId) {
  for (const gid in REVIEWS) {
    const r = REVIEWS[gid].find(x => x.id === reviewId);
    if (r) return r;
  }
  if (state.userReviews) {
    return state.userReviews.find(x => x.id === reviewId);
  }
  return null;
}

// Удаление собственного отзыва
async function deleteReview(reviewId, gameId) {
  if (typeof state === 'undefined' || !state.currentUser) {
    if (typeof showAuthModal === 'function') showAuthModal();
    return;
  }

  const r = findReviewById(reviewId);
  if (!r) return;

  // Проверяем авторство
  if (r.user !== state.currentUser.username) {
    if (typeof gvToast === 'function') gvToast('Вы можете удалять только собственные отзывы');
    return;
  }

  const ok = typeof gvConfirm === 'function'
    ? await gvConfirm('Вы действительно хотите удалить свой отзыв? Это действие нельзя отменить.', {
        title: 'Удаление отзыва',
        confirmText: 'Удалить отзыв',
        cancelText: 'Отмена',
        danger: true,
        icon: 'fa-solid fa-trash-can'
      })
    : confirm('Вы действительно хотите удалить свой отзыв?');

  if (!ok) return;

  const gid = gameId || r.gameId || (state.currentGame ? state.currentGame.id : null);

  // Удаляем из каталога игры REVIEWS
  if (gid && REVIEWS[gid]) {
    REVIEWS[gid] = REVIEWS[gid].filter(x => x.id !== reviewId);
  } else {
    for (const id in REVIEWS) {
      REVIEWS[id] = REVIEWS[id].filter(x => x.id !== reviewId);
    }
  }

  // Удаляем из списка отзывов пользователя в state
  if (state.userReviews) {
    state.userReviews = state.userReviews.filter(x => x.id !== reviewId);
  }

  // Очищаем сохранённый голос
  setReviewVote(reviewId, null);

  saveReviewsStore();

  if (typeof gvToast === 'function') gvToast('Отзыв успешно удалён');

  // Обновляем текущую страницу
  if (state.currentView === 'game' && state.currentGame) {
    if (typeof renderGamePage === 'function') renderGamePage(document.getElementById('main-content'));
  } else if (state.currentView === 'profile') {
    if (typeof renderProfile === 'function') renderProfile(document.getElementById('main-content'));
  }
}
window.deleteReview = deleteReview;

// Поставить или убрать лайк отзыву
function likeReview(reviewId) {
  if (typeof state === 'undefined' || !state.currentUser) {
    if (typeof showAuthModal === 'function') showAuthModal();
    if (typeof gvToast === 'function') gvToast('Войдите в аккаунт, чтобы оценивать отзывы');
    return;
  }

  const r = findReviewById(reviewId);
  if (!r) return;

  const currentVote = getReviewVote(reviewId);

  if (currentVote === 'like') {
    // Снимаем лайк
    r.likes = Math.max(0, (r.likes || 0) - 1);
    setReviewVote(reviewId, null);
    if (typeof gvToast === 'function') gvToast('Вы убрали отметку «Понравилось»');
  } else if (currentVote === 'dislike') {
    // Переключаем с дизлайка на лайк
    r.dislikes = Math.max(0, (r.dislikes || 0) - 1);
    r.likes = (r.likes || 0) + 1;
    setReviewVote(reviewId, 'like');
    if (window.GVAudio && GVAudio.playClick) GVAudio.playClick();
  } else {
    // Ставим новый лайк
    r.likes = (r.likes || 0) + 1;
    setReviewVote(reviewId, 'like');
    if (window.GVAudio && GVAudio.playClick) GVAudio.playClick();
  }

  saveReviewsStore();

  // Обновляем текущую страницу для отображения актуального числа и подсветки
  if (state.currentView === 'game' && state.currentGame) {
    if (typeof renderGamePage === 'function') renderGamePage(document.getElementById('main-content'));
  } else if (state.currentView === 'profile') {
    if (typeof renderProfile === 'function') renderProfile(document.getElementById('main-content'));
  }
}
window.likeReview = likeReview;

// Поставить или убрать дизлайк отзыву
function dislikeReview(reviewId) {
  if (typeof state === 'undefined' || !state.currentUser) {
    if (typeof showAuthModal === 'function') showAuthModal();
    if (typeof gvToast === 'function') gvToast('Войдите в аккаунт, чтобы оценивать отзывы');
    return;
  }

  const r = findReviewById(reviewId);
  if (!r) return;

  const currentVote = getReviewVote(reviewId);

  if (currentVote === 'dislike') {
    // Снимаем дизлайк
    r.dislikes = Math.max(0, (r.dislikes || 0) - 1);
    setReviewVote(reviewId, null);
    if (typeof gvToast === 'function') gvToast('Вы убрали дизлайк');
  } else if (currentVote === 'like') {
    // Переключаем с лайка на дизлайк
    r.likes = Math.max(0, (r.likes || 0) - 1);
    r.dislikes = (r.dislikes || 0) + 1;
    setReviewVote(reviewId, 'dislike');
    if (window.GVAudio && GVAudio.playClick) GVAudio.playClick();
  } else {
    // Ставим новый дизлайк
    r.dislikes = (r.dislikes || 0) + 1;
    setReviewVote(reviewId, 'dislike');
    if (window.GVAudio && GVAudio.playClick) GVAudio.playClick();
  }

  saveReviewsStore();

  // Обновляем текущую страницу для отображения актуального числа и подсветки
  if (state.currentView === 'game' && state.currentGame) {
    if (typeof renderGamePage === 'function') renderGamePage(document.getElementById('main-content'));
  } else if (state.currentView === 'profile') {
    if (typeof renderProfile === 'function') renderProfile(document.getElementById('main-content'));
  }
}
window.dislikeReview = dislikeReview;
