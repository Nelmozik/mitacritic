// ===================================================================
// GameVault Utilities
// Централизованные функции безопасности, санитайзинга и вспомогательные утилиты
// ===================================================================

/**
 * Экранирует спецсимволы HTML (&, <, >, ", ') для безопасной вставки в разметку
 * @param {*} text - входные данные (строка, число или null/undefined)
 * @returns {string} экранированная строка
 */
function escapeHtml(text) {
  if (text === null || text === undefined) return '';
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
window.escapeHtml = escapeHtml;

/**
 * Валидирует URL изображений от пользователя (разрешены только https: и data:image/)
 * Защищает от javascript:, vbscript:, data:text/html и прочих векторов атак
 * @param {string} url - проверяемый URL
 * @param {string} fallback - подставляемое значение по умолчанию
 * @returns {string} безопасный URL или fallback
 */
function sanitizeImageUrl(url, fallback = '') {
  if (!url || typeof url !== 'string') return fallback;
  const trimmed = url.trim();
  
  // Разрешены https-ссылки
  if (/^https:\/\/[^\s"'<>]+$/i.test(trimmed)) {
    return trimmed;
  }
  
  // Разрешены безопасные data:image URI
  if (/^data:image\/(png|jpe?g|gif|webp|svg\+xml);base64,[a-z0-9+/=]+$/i.test(trimmed)) {
    return trimmed;
  }
  
  // Разрешены локальные безопасные пути из assets/
  if (/^assets\/[a-zA-Z0-9_./-]+\.(png|jpe?g|gif|webp|svg)$/i.test(trimmed)) {
    return trimmed;
  }
  
  return fallback;
}
window.sanitizeImageUrl = sanitizeImageUrl;

// Глобальное делегирование событий для кнопок и ссылок с data-action
// Позволяет полностью отказаться от inline onclick с подстановкой пользовательских данных
if (typeof document !== 'undefined') {
  document.addEventListener('click', function(e) {
    const actionEl = e.target.closest('[data-action]');
    if (!actionEl) return;
    
    const action = actionEl.getAttribute('data-action');
    const username = actionEl.getAttribute('data-username');
    
    if (action === 'show-profile') {
      if (typeof showProfile === 'function') {
        showProfile(username || null);
      }
    } else if (action === 'toggle-follow') {
      if (typeof toggleFollowUser === 'function') {
        toggleFollowUser(username || '');
      }
    } else if (action === 'share-profile') {
      if (typeof shareProfile === 'function') {
        shareProfile(username || null);
      }
    } else if (action === 'switch-public-tab') {
      const tab = actionEl.getAttribute('data-tab');
      if (typeof switchPublicProfileTab === 'function') {
        switchPublicProfileTab(username || '', tab || 'overview');
      }
    } else if (action === 'follow-uid') {
      const uid = actionEl.getAttribute('data-uid');
      if (typeof followUser === 'function') followUser(uid);
    } else if (action === 'unfollow-uid') {
      const uid = actionEl.getAttribute('data-uid');
      if (typeof unfollowUser === 'function') unfollowUser(uid);
    }
  });
}
