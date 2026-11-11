// GameVault UI Audio Synthesizer (Web Audio API)
// Тихие, стильные щелчки консольного уровня (в стиле Nintendo Switch / PS5)
// Не требует внешних аудиофайлов, мгновенный отклик, 0ms задержка

const GVAudio = (() => {
  let ctx = null;

  function getContext() {
    if (!ctx && (window.AudioContext || window.webkitAudioContext)) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      ctx = new AudioCtx();
    }
    if (ctx && ctx.state === 'suspended') {
      ctx.resume();
    }
    return ctx;
  }

  function isEnabled() {
    if (typeof state !== 'undefined' && state.userCustom && state.userCustom.sfx === false) {
      return false;
    }
    return true;
  }

  // Мягкий консольный щелчок при нажатии на меню, кнопки, карточки
  function playClick() {
    if (!isEnabled()) return;
    try {
      const c = getContext();
      if (!c) return;
      const now = c.currentTime;
      const osc = c.createOscillator();
      const gain = c.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(800, now);
      osc.frequency.exponentialRampToValueAtTime(320, now + 0.035);

      gain.gain.setValueAtTime(0.06, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.035);

      osc.connect(gain);
      gain.connect(c.destination);

      osc.start(now);
      osc.stop(now + 0.04);
    } catch (e) {}
  }

  // Приятный двухтональный поп-звук при добавлении в вишлист, библиотеку или оценке
  function playAdd() {
    if (!isEnabled()) return;
    try {
      const c = getContext();
      if (!c) return;
      const now = c.currentTime;
      [587.33, 880.00].forEach((freq, idx) => { // D5 -> A5
        const osc = c.createOscillator();
        const gain = c.createGain();
        const startTime = now + idx * 0.055;

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, startTime);

        gain.gain.setValueAtTime(0.08, startTime);
        gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.1);

        osc.connect(gain);
        gain.connect(c.destination);

        osc.start(startTime);
        osc.stop(startTime + 0.11);
      });
    } catch (e) {}
  }

  // Торжественная фанфара при разблокировке достижения (4 восходящие ноты)
  function playAchievement() {
    if (!isEnabled()) return;
    try {
      const c = getContext();
      if (!c) return;
      const now = c.currentTime;
      const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
      notes.forEach((freq, idx) => {
        const osc = c.createOscillator();
        const gain = c.createGain();
        const startTime = now + idx * 0.085;

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, startTime);

        gain.gain.setValueAtTime(0.12, startTime);
        gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.22);

        osc.connect(gain);
        gain.connect(c.destination);

        osc.start(startTime);
        osc.stop(startTime + 0.24);
      });
    } catch (e) {}
  }

  return { playClick, playAdd, playAchievement, isEnabled };
})();

window.GVAudio = GVAudio;

// Глобальное подключение щелчка при нажатии на интерактивные элементы
document.addEventListener('click', (e) => {
  const target = e.target.closest('button, .nav-link, .game-card, .mobile-link, input[type="radio"], input[type="checkbox"]');
  if (target && window.GVAudio) {
    window.GVAudio.playClick();
  }
}, true);
