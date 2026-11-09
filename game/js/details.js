// Подстановка описаний и разработчиков из DESCRIPTIONS в GAMES
// Запускается один раз после загрузки games.js и descriptions.js.
// Изменяет поля fullDescription и developer прямо в массиве GAMES,
// поэтому все страницы сайта сразу видят заполненные данные.
(function () {
  if (typeof DESCRIPTIONS === 'undefined' || typeof GAMES === 'undefined') return;

  for (let i = 0; i < GAMES.length; i++) {
    const game = GAMES[i];
    const desc = DESCRIPTIONS[game.id];
    if (!desc) continue;

    // Описание: всегда подставляем из DESCRIPTIONS
    if (desc.d) {
      game.fullDescription = desc.d;
    }

    // Краткое описание для баннера на главной (если там была только заглушка жанра)
    if (desc.d && (!game.description || game.description.length < 40)) {
      game.description = desc.d.length > 220 ? desc.d.slice(0, 220).trim() + '…' : desc.d;
    }

    // Разработчик: заменяем заглушку «—» на реального разработчика
    if (desc.dev && desc.dev !== '—' && desc.dev !== '') {
      game.developer = desc.dev;
    }
  }
})();
