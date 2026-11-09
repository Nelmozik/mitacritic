// Глобальное состояние приложения
// Один объект state хранит всё, что нужно знать разным частям сайта друг о друге.
// Менять поля можно напрямую; после изменения вызовите showView() чтобы обновить страницу.
const state = {
  // Авторизация
  currentUser: null,       // объект пользователя (после входа) или null
  authMode:    'login',    // текущий режим окна входа: login | signup | reset | link

  // Навигация
  currentView: 'home',     // открытая страница: home | catalog | game | genres | platforms | tops | releases | profile
  currentGame: null,       // объект текущей игры (при просмотре страницы игры)
  profileTab:  'overview', // активная вкладка профиля

  // Каталог — поиск, фильтры, сортировка
  searchQuery: '',
  sortBy: 'rating',        // 'rating' | 'year'
  limit: 60,               // сколько карточек показывать (кнопка «Показать ещё» увеличивает)
  filters: {
    genre:     null,       // id жанра из GENRES (например 'action') или null
    platform:  null,       // id платформы из PLATFORMS (например 'pc') или null
    year:      null,
    minRating: 0
  },

  // Данные пользователя (синхронизируются с localStorage)
  userLists:       { want: [], completed: [], dropped: [] }, // id игр в каждом списке
  userRatings:     {},         // { gameId: score }
  userReviews:     [],         // отзывы, написанные пользователем
  userFavorites:   [],         // [gameId, ...] до 4 любимых игр витрины
  userCollections: [],         // [{ id, title, desc, gameIds: [], createdAt }] коллекции
  recentlyViewed:  [],         // [gameId, ...] недавно просмотренные игры
  userCustom:      {           // кастомизация профиля
    bio: '',
    banner: '',
    avatar: '',
    platforms: [],
    theme: 'dark'              // тема оформления
  },

  // Подписки (загружаются из Firestore после входа)
  social: {
    uid:       null,       // uid пользователя, для которого загружены данные
    status:    'idle',     // idle | loading | ready | nodb | error
    following: [],         // на кого подписан
    followers: [],         // кто подписан на меня
    results:   [],         // результаты поиска игроков
    query:     '',         // последний поисковый запрос
    error:     ''          // код последней ошибки
  }
};
