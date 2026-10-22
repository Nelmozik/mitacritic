// Подставляем описания и разработчиков в игры из каталога.
// Данные лежат в DESCRIPTIONS (файл descriptions.js), ключ - id игры.

(function () {
  // если файл с описаниями пустой или не загрузился - ничего не делаем
  if (typeof DESCRIPTIONS === 'undefined') return;

  GAMES.forEach(function (game) {
    const info = DESCRIPTIONS[game.id];
    if (!info) return;

    // полное описание показываем на странице игры
    game.fullDescription = info.d;

    // короткое описание для карточек: первые 160 символов
    game.description = info.d.length > 160 ? info.d.slice(0, 160) + '…' : info.d;

    if (info.dev) game.developer = info.dev;
  });
})();
