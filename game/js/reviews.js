// Отзывы
let currentReviewGame = null;   // игра, для которой сейчас пишут отзыв
let selectedReviewRating = null; // оценка, выбранная в окне отзыва
let selectedReviewTags = [];    // теги, выбранные в окне отзыва

// Числовые оценки для каждого варианта
const RATING_SCORES = {
  exceptional: 10,
  recommended: 8,
  meh:         6,
  skip:        3
};

// Открывает окно «Написать отзыв» для выбранной игры
function openReviewModal(gameId) {
  if (!state.currentUser) {
    showAuthModal();
    gvToast('Пожалуйста, войдите в аккаунт, чтобы оставить отзыв');
    return;
  }

  currentReviewGame = GAMES.find(g => g.id === gameId);
  if (!currentReviewGame) return;

  document.getElementById('review-game-title').textContent = currentReviewGame.title;
  document.getElementById('review-text').value = '';
  selectedReviewRating = null;
  selectedReviewTags = [];

  // Сброс кнопок рейтинга
  document.querySelectorAll('.review-rating-btn').forEach(btn => {
    btn.classList.remove('bg-violet-600', 'border-violet-500');
    btn.classList.add('border-zinc-700');
  });

  // Сброс тегов
  document.querySelectorAll('.review-tag').forEach(tag => {
    tag.classList.remove('selected', 'bg-violet-600', 'border-violet-500');
    tag.classList.add('bg-zinc-800', 'border-zinc-700');
  });

  document.getElementById('review-modal').classList.remove('hidden-view');
}

// Закрывает окно отзыва
function closeReviewModal() {
  document.getElementById('review-modal').classList.add('hidden-view');
}

// Подсвечивает выбранную оценку («Исключительно», «Рекомендуем» и т.д.) и запоминает её
function selectReviewRating(rating) {
  selectedReviewRating = rating;

  document.querySelectorAll('.review-rating-btn').forEach(btn => {
    btn.classList.remove('bg-violet-600', 'border-violet-500');
    btn.classList.add('border-zinc-700');
  });

  event.currentTarget.classList.remove('border-zinc-700');
  event.currentTarget.classList.add('bg-violet-600', 'border-violet-500');
}

// Включает или выключает тег у отзыва. Выбранные теги лежат в массиве selectedReviewTags
function toggleReviewTag(element) {
  const tagText = element.textContent.replace(/[«»]/g, '');

  if (element.classList.contains('selected')) {
    element.classList.remove('selected', 'bg-violet-600', 'border-violet-500');
    element.classList.add('bg-zinc-800', 'border-zinc-700');
    selectedReviewTags = selectedReviewTags.filter(t => t !== tagText);
  } else {
    element.classList.remove('bg-zinc-800', 'border-zinc-700');
    element.classList.add('selected', 'bg-violet-600', 'border-violet-500');
    selectedReviewTags.push(tagText);
  }
}

// Проверяет форму, создаёт объект отзыва и кладёт его в REVIEWS
function submitReview() {
  if (!currentReviewGame || !state.currentUser) return;

  const text = document.getElementById('review-text').value;

  if (!selectedReviewRating) {
    alert('Пожалуйста, выберите оценку');
    return;
  }

  if (!text.trim() && selectedReviewTags.length === 0) {
    alert('Пожалуйста, напишите отзыв или выберите теги');
    return;
  }

  // Оценка берётся из выбора пользователя, а не случайным образом
  const score = RATING_SCORES[selectedReviewRating] || 7;

  const review = {
    id: Date.now(),
    user: state.currentUser.username,
    avatar: state.currentUser.avatar,
    score: score,
    title: text.split('.')[0].trim() || 'Отличный отзыв',
    body: text || 'Игра понравилась!',
    tags: selectedReviewTags,
    rating: selectedReviewRating,
    pros: '',
    cons: '',
    likes: 0,
    dislikes: 0,
    date: new Date().toLocaleDateString('ru-RU'),
    helpful: false
  };

  if (!REVIEWS[currentReviewGame.id]) {
    REVIEWS[currentReviewGame.id] = [];
  }

  REVIEWS[currentReviewGame.id].unshift(review);
  state.userReviews.push(review);

  closeReviewModal();
  gvToast('Отзыв опубликован');

  // Обновляем страницу игры если мы на ней
  if (state.currentView === 'game' && state.currentGame && state.currentGame.id === currentReviewGame.id) {
    renderGamePage(document.getElementById('main-content'));
  }
}

// Поставить лайк отзыву
function likeReview(reviewId) {
  for (const gid in REVIEWS) {
    const list = REVIEWS[gid];
    const r = list.find(x => x.id === reviewId);
    if (r) {
      if (!r.liked) {
        r.likes = (r.likes || 0) + 1;
        r.liked = true;
        if (r.disliked) {
          r.dislikes = Math.max(0, (r.dislikes || 0) - 1);
          r.disliked = false;
        }
        if (window.GVAudio && GVAudio.playClick) GVAudio.playClick();
      } else {
        r.likes = Math.max(0, (r.likes || 0) - 1);
        r.liked = false;
      }
      if (state.currentView === 'game' && state.currentGame) {
        renderGamePage(document.getElementById('main-content'));
      }
      return;
    }
  }
}

// Поставить дизлайк отзыву
function dislikeReview(reviewId) {
  for (const gid in REVIEWS) {
    const list = REVIEWS[gid];
    const r = list.find(x => x.id === reviewId);
    if (r) {
      if (!r.disliked) {
        r.dislikes = (r.dislikes || 0) + 1;
        r.disliked = true;
        if (r.liked) {
          r.likes = Math.max(0, (r.likes || 0) - 1);
          r.liked = false;
        }
        if (window.GVAudio && GVAudio.playClick) GVAudio.playClick();
      } else {
        r.dislikes = Math.max(0, (r.dislikes || 0) - 1);
        r.disliked = false;
      }
      if (state.currentView === 'game' && state.currentGame) {
        renderGamePage(document.getElementById('main-content'));
      }
      return;
    }
  }
}
