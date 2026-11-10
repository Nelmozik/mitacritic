// Запуск приложения GameVault
// Применяем тему оформления из сохранённых настроек
if (window.applyTheme) window.applyTheme();
// Обновляем шапку профиля (аватар и титул)
if (window.updateAuthUI) window.updateAuthUI();

// Все скрипты уже загружены — открываем страницу по текущему адресу или главную
if (typeof initAppRoute === 'function') {
  initAppRoute();
} else {
  showView('home');
}
