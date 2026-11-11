// ===================================================================
// Система отзывов GameVault
// Честные пользовательские данные: вымышленные демо-отзывы удалены
// ===================================================================

/**
 * Возвращает реальные отзывы для игры (написанные пользователями и загруженные из Firestore)
 * @param {Object} game - объект игры
 * @returns {Array} список отзывов
 */
function getReviews(game) {
  if (!game || !game.id) return [];
  if (typeof REVIEWS === 'undefined') return [];
  return REVIEWS[game.id] || [];
}
window.getReviews = getReviews;
