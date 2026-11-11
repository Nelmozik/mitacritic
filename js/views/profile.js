// GameVault Profile Module Facade
// Исходный монолит profile.js разделен на изолированные модули в папке js/views/profile/:
// - profile-custom.js: темы оформления, баннеры, кастомный кроппер аватарок, рамки, настройки
// - profile-stats.js: титулы, ачивки, модальные окна правил, баг-репортов и руководства
// - profile-lists.js: списки игр, топ-4 витрина, коллекция, рандомайзер и быстрый старт
// - profile-social.js: подписчики, подписки, поиск реальных игроков в Firestore
// - profile-edit-modal.js: модальное окно редактирования профиля
// - profile-main.js: главный рендеринг страницы профиля и публичных профилей
//
// Все функции зарегистрированы в глобальной области видимости для совместимости.

(function() {
  // Проверяем наличие всех модулей профиля в рантайме для отладки
  const required = [
    'renderProfile',
    'renderPublicProfilePage',
    'openProfileEditModal',
    'switchProfileTab',
    'shareProfile'
  ];
  for (const fn of required) {
    if (typeof window[fn] !== 'function') {
      console.warn(`[Profile Facade] Ожидается функция ${fn} из модулей js/views/profile/`);
    }
  }
})();
