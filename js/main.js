// Запуск приложения GameVault
// Применяем тему оформления из сохранённых настроек
if (window.applyTheme) window.applyTheme();
// Обновляем шапку профиля (аватар и титул)
if (window.updateAuthUI) window.updateAuthUI();

// Загружаем компактный индекс игр (data/index.json), затем открываем текущий роут
if (typeof loadGamesIndex === 'function') {
  loadGamesIndex().then(() => {
    if (typeof initAppRoute === 'function') {
      initAppRoute();
    } else {
      showView('home');
    }
  });
} else {
  if (typeof initAppRoute === 'function') {
    initAppRoute();
  } else {
    showView('home');
  }
}
