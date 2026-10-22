// Состояние
// Здесь хранится всё, что меняется во время работы сайта
let state = {
  currentUser: null,        // вошедший пользователь (null, если не вошёл)
  currentView: 'home',      // какая страница открыта сейчас
  currentGame: null,        // игра, открытая на странице игры
  searchQuery: '',          // текст из строки поиска
  filters: { genre: null, platform: null, year: null, minRating: 0 },  // выбранные фильтры каталога
  limit: 60,                // сколько карточек показываем в каталоге (растёт по кнопке «Показать ещё»)
  sortBy: 'rating',         // сортировка: по рейтингу или по году
  userLists: { want: [], playing: [], completed: [], dropped: [] },    // списки игр пользователя (id игр)
  userRatings: {},          // оценки пользователя: { idИгры: оценка }
  userReviews: [],          // отзывы, написанные пользователем
  authMode: 'login'         // режим окна входа
};
