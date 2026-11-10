// Подстановка описаний и разработчиков из DESCRIPTIONS в GAMES
// Оптимизировано: descriptions.js (7.7 МБ) догружается в фоне асинхронно,
// чтобы не тормозить первый запуск и показ главной страницы.

function applyDescriptions() {
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
}
window.applyDescriptions = applyDescriptions;

// Функция фоновой асинхронной подгрузки descriptions.js
function loadDescriptionsAsync() {
  if (window._descriptionsLoading || typeof DESCRIPTIONS !== 'undefined') {
    if (typeof DESCRIPTIONS !== 'undefined') applyDescriptions();
    return;
  }
  window._descriptionsLoading = true;

  const script = document.createElement('script');
  script.src = 'js/descriptions.js?v=2.8.5';
  script.async = true;
  script.onload = function() {
    applyDescriptions();
    window._descriptionsLoaded = true;
    window._descriptionsLoading = false;
    window.dispatchEvent(new CustomEvent('descriptionsReady'));
  };
  script.onerror = function() {
    window._descriptionsLoading = false;
  };
  document.head.appendChild(script);
}
window.loadDescriptionsAsync = loadDescriptionsAsync;

// Если descriptions.js вдруг уже в памяти (например, из кэша)
applyDescriptions();

// Фоновая загрузка: стартует автоматически сразу после того, как браузер отрисует первый кадр
if (typeof DESCRIPTIONS === 'undefined') {
  if (typeof requestIdleCallback === 'function') {
    requestIdleCallback(function() { loadDescriptionsAsync(); }, { timeout: 2000 });
  } else {
    setTimeout(loadDescriptionsAsync, 300);
  }
}
