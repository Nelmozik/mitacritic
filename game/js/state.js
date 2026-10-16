// ============ СОСТОЯНИЕ ============
let state = {
  currentUser: null,
  currentView: 'home',
  currentGame: null,
  searchQuery: '',
  filters: { genre: null, platform: null, year: null, minRating: 0 },
  limit: 60,
  sortBy: 'rating',
  userLists: { want: [], playing: [], completed: [], dropped: [] },
  userRatings: {},
  userReviews: [],
  authMode: 'login'
};
