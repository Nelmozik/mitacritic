// ===================================================================
// GameVault Themed Dialogs System (Alert & Confirm)
// Фирменные всплывающие окна в едином неоновом стиле GameVault
// ===================================================================

(function() {
  function ensureDialogRoot() {
    let root = document.getElementById('gv-dialog-root');
    if (!root) {
      root = document.createElement('div');
      root.id = 'gv-dialog-root';
      document.body.appendChild(root);
    }
    return root;
  }

  function safeText(str) {
    if (typeof str !== 'string') return String(str || '');
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  /**
   * Фирменное информационное окно (замена alert)
   * @param {string} message - Текст сообщения
   * @param {object} [options] - Параметры (title, icon, buttonText, iconColor, iconBg)
   * @returns {Promise<void>}
   */
  function gvAlert(message, options = {}) {
    return new Promise((resolve) => {
      const root = ensureDialogRoot();
      const title = options.title || 'Внимание';
      const btnText = options.buttonText || options.okText || 'Понятно';
      const icon = options.icon || 'fa-solid fa-circle-exclamation';
      const iconColor = options.iconColor || 'text-violet-400';
      const iconBg = options.iconBg || 'bg-violet-600/20 border-violet-500/40 text-violet-400';

      if (window.GVAudio && GVAudio.playClick) GVAudio.playClick();

      root.innerHTML = `
        <div id="gv-dialog-backdrop" class="fixed inset-0 z-[1000] bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-fade">
          <div class="relative w-full max-w-md transform transition-all">
            <!-- Градиентное свечение -->
            <div class="absolute -inset-1 rounded-3xl bg-gradient-to-r from-violet-600/30 via-fuchsia-600/20 to-blue-600/30 blur-xl pointer-events-none"></div>

            <div class="relative glass-panel bg-zinc-900/95 border border-zinc-700/80 rounded-3xl p-6 sm:p-7 shadow-2xl">
              <!-- Верхняя полоска: иконка + заголовок + кнопка закрытия -->
              <div class="flex items-start gap-4 mb-4">
                <div class="w-12 h-12 rounded-2xl ${iconBg} border flex items-center justify-center ${iconColor} text-xl flex-shrink-0 shadow-lg shadow-violet-950/40">
                  <i class="${icon}"></i>
                </div>
                <div class="min-w-0 flex-1 pt-0.5">
                  <div class="flex items-center gap-2 mb-1">
                    <span class="px-2 py-0.5 rounded-md bg-blue-600/20 border border-blue-500/30 text-[10px] font-black uppercase tracking-wider text-blue-400">GameVault</span>
                  </div>
                  <h3 class="text-lg font-bold text-white leading-snug font-display">${safeText(title)}</h3>
                </div>
                <button type="button" id="gv-dialog-x-btn" class="text-zinc-500 hover:text-white transition p-1 cursor-pointer" aria-label="Закрыть">
                  <i class="fa-solid fa-xmark text-lg"></i>
                </button>
              </div>

              <!-- Текст сообщения -->
              <div class="text-zinc-300 text-sm leading-relaxed mb-6 pl-1 pr-1">
                ${safeText(message)}
              </div>

              <!-- Кнопка действия -->
              <div class="flex justify-end pt-3 border-t border-zinc-800/80">
                <button type="button" id="gv-dialog-ok-btn" class="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-semibold text-sm transition shadow-lg shadow-violet-600/30 flex items-center justify-center gap-2 cursor-pointer">
                  <span>${safeText(btnText)}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      `;

      const close = () => {
        document.removeEventListener('keydown', onKey);
        root.innerHTML = '';
        resolve();
      };

      const onKey = (e) => {
        if (e.key === 'Escape' || e.key === 'Enter') {
          e.preventDefault();
          close();
        }
      };

      document.addEventListener('keydown', onKey);

      const backdrop = document.getElementById('gv-dialog-backdrop');
      if (backdrop) {
        backdrop.onclick = (e) => {
          if (e.target === backdrop) close();
        };
      }

      const okBtn = document.getElementById('gv-dialog-ok-btn');
      if (okBtn) {
        okBtn.focus();
        okBtn.onclick = close;
      }

      const xBtn = document.getElementById('gv-dialog-x-btn');
      if (xBtn) xBtn.onclick = close;
    });
  }

  /**
   * Фирменное диалоговое окно подтверждения (замена confirm)
   * @param {string} message - Вопрос пользователю
   * @param {object} [options] - Параметры (title, confirmText, cancelText, danger, icon)
   * @returns {Promise<boolean>}
   */
  function gvConfirm(message, options = {}) {
    return new Promise((resolve) => {
      const root = ensureDialogRoot();
      const title = options.title || 'Подтверждение действия';
      const confirmText = options.confirmText || 'Подтвердить';
      const cancelText = options.cancelText || 'Отмена';
      const isDanger = options.danger !== undefined ? options.danger : /удалить|сбросить|выйти/i.test(message + title);
      const icon = options.icon || (isDanger ? 'fa-solid fa-trash-can' : 'fa-solid fa-circle-question');
      const iconColor = options.iconColor || (isDanger ? 'text-rose-400' : 'text-violet-400');
      const iconBg = options.iconBg || (isDanger ? 'bg-rose-500/15 border-rose-500/30 text-rose-400' : 'bg-violet-600/20 border-violet-500/30 text-violet-400');

      if (window.GVAudio && GVAudio.playClick) GVAudio.playClick();

      root.innerHTML = `
        <div id="gv-dialog-backdrop" class="fixed inset-0 z-[1000] bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-fade">
          <div class="relative w-full max-w-md transform transition-all">
            <!-- Градиентное свечение -->
            <div class="absolute -inset-1 rounded-3xl ${isDanger ? 'bg-gradient-to-r from-red-600/30 to-rose-600/30' : 'bg-gradient-to-r from-violet-600/30 to-indigo-600/30'} blur-xl pointer-events-none"></div>

            <div class="relative glass-panel bg-zinc-900/95 border border-zinc-700/80 rounded-3xl p-6 sm:p-7 shadow-2xl">
              <!-- Шапка окна с иконкой и логотипом -->
              <div class="flex items-start gap-4 mb-4">
                <div class="w-12 h-12 rounded-2xl ${iconBg} border flex items-center justify-center ${iconColor} text-xl flex-shrink-0 shadow-lg">
                  <i class="${icon}"></i>
                </div>
                <div class="min-w-0 flex-1 pt-0.5">
                  <div class="flex items-center gap-2 mb-1">
                    <span class="px-2 py-0.5 rounded-md ${isDanger ? 'bg-red-500/20 border-red-500/30 text-red-400' : 'bg-blue-600/20 border-blue-500/30 text-blue-400'} text-[10px] font-black uppercase tracking-wider">GameVault</span>
                  </div>
                  <h3 class="text-lg font-bold text-white leading-snug font-display">${safeText(title)}</h3>
                </div>
                <button type="button" id="gv-dialog-x-btn" class="text-zinc-500 hover:text-white transition p-1 cursor-pointer" aria-label="Закрыть">
                  <i class="fa-solid fa-xmark text-lg"></i>
                </button>
              </div>

              <!-- Текст сообщения -->
              <div class="text-zinc-300 text-sm leading-relaxed mb-6 pl-1 pr-1">
                ${safeText(message)}
              </div>

              <!-- Кнопки действий -->
              <div class="flex items-center justify-end gap-3 pt-3 border-t border-zinc-800/80">
                <button type="button" id="gv-dialog-cancel-btn" class="px-5 py-2.5 rounded-xl border border-zinc-700 text-zinc-300 hover:text-white hover:bg-zinc-800 text-sm font-semibold transition cursor-pointer">
                  ${safeText(cancelText)}
                </button>
                <button type="button" id="gv-dialog-confirm-btn" class="px-6 py-2.5 rounded-xl ${isDanger ? 'bg-red-600 hover:bg-red-500 shadow-red-600/30' : 'bg-violet-600 hover:bg-violet-500 shadow-violet-600/30'} text-white font-semibold text-sm transition shadow-lg flex items-center justify-center gap-2 cursor-pointer">
                  <span>${safeText(confirmText)}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      `;

      const close = (result) => {
        document.removeEventListener('keydown', onKey);
        root.innerHTML = '';
        if (result) {
          if (window.GVAudio && GVAudio.playAdd) GVAudio.playAdd();
        } else {
          if (window.GVAudio && GVAudio.playClick) GVAudio.playClick();
        }
        resolve(result);
      };

      const onKey = (e) => {
        if (e.key === 'Escape') {
          e.preventDefault();
          close(false);
        } else if (e.key === 'Enter') {
          e.preventDefault();
          close(true);
        }
      };

      document.addEventListener('keydown', onKey);

      const backdrop = document.getElementById('gv-dialog-backdrop');
      if (backdrop) {
        backdrop.onclick = (e) => {
          if (e.target === backdrop) close(false);
        };
      }

      const cancelBtn = document.getElementById('gv-dialog-cancel-btn');
      const confirmBtn = document.getElementById('gv-dialog-confirm-btn');
      const xBtn = document.getElementById('gv-dialog-x-btn');

      if (cancelBtn) cancelBtn.onclick = () => close(false);
      if (xBtn) xBtn.onclick = () => close(false);
      if (confirmBtn) {
        confirmBtn.focus();
        confirmBtn.onclick = () => close(true);
      }
    });
  }

  window.gvAlert = gvAlert;
  window.gvConfirm = gvConfirm;
})();
