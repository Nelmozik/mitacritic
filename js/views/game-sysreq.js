// ===================================================================
// GameVault Game Page Helpers: Playtime & System Requirements
// ===================================================================

function getGamePlaytime(game) {
  const curated = {
    3328: { main: 52, extra: 105, completionist: 175 },   // Ведьмак 3
    41494: { main: 25, extra: 60, completionist: 105 },   // Cyberpunk 2077
    326243: { main: 58, extra: 102, completionist: 135 }, // Elden Ring
    3498: { main: 32, extra: 50, completionist: 85 },     // GTA V
    5679: { main: 34, extra: 110, completionist: 230 },   // Skyrim
    28: { main: 50, extra: 82, completionist: 180 },      // RDR 2
    339958: { main: 27, extra: 42, completionist: 63 },   // Hollow Knight
    58175: { main: 21, extra: 33, completionist: 52 },    // God of War
    416: { main: 101, extra: 125, completionist: 145 },   // Persona 5 Royal
    5286: { main: 12, extra: 16, completionist: 22 },     // Tomb Raider
    278: { main: 30, extra: 45, completionist: 76 }       // Horizon Zero Dawn
  };

  if (curated[game.id]) return curated[game.id];

  const hash = Math.abs(Number(game.id) || 12345);
  const mainGenre = (game.genres && game.genres[0]) || '';
  let baseMain = 15;
  if (/rpg|ролевые/i.test(mainGenre)) baseMain = 35 + (hash % 20);
  else if (/стратег|strategy/i.test(mainGenre)) baseMain = 24 + (hash % 16);
  else if (/приключ|adventure|action|экшен/i.test(mainGenre)) baseMain = 14 + (hash % 12);
  else if (/инди|indie|платформер|platform/i.test(mainGenre)) baseMain = 8 + (hash % 7);
  else if (/шутер|shooter/i.test(mainGenre)) baseMain = 9 + (hash % 6);
  else baseMain = 12 + (hash % 10);

  const extra = Math.round(baseMain * 1.85);
  const completionist = Math.round(baseMain * 3.2);
  return { main: baseMain, extra, completionist };
}
window.getGamePlaytime = getGamePlaytime;

// Расчет реалистичных системных требований для ПК
function getGameSysReq(game) {
  const yearMatch = (game.releaseDate || '').match(/\d{4}/);
  const year = yearMatch ? parseInt(yearMatch[0], 10) : 2020;

  if (year >= 2023) {
    return {
      min: {
        os: 'Windows 10 64-bit (1909+)',
        cpu: 'Intel Core i5-8400 или AMD Ryzen 5 2600',
        ram: '16 ГБ ОЗУ',
        gpu: 'NVIDIA GeForce GTX 1060 (6 ГБ) или AMD Radeon RX 580',
        storage: '85 ГБ доступного места (SSD рекомендуется)',
        directx: 'DirectX 12'
      },
      rec: {
        os: 'Windows 10/11 64-bit (последнее обновление)',
        cpu: 'Intel Core i7-10700K или AMD Ryzen 7 3700X',
        ram: '16–32 ГБ ОЗУ',
        gpu: 'NVIDIA GeForce RTX 3070 или AMD Radeon RX 6800 XT',
        storage: '85 ГБ на быстром NVMe SSD',
        directx: 'DirectX 12 (DirectX Raytracing)'
      }
    };
  } else if (year >= 2017) {
    return {
      min: {
        os: 'Windows 10 64-bit',
        cpu: 'Intel Core i5-4460 или AMD FX-8350',
        ram: '8 ГБ ОЗУ',
        gpu: 'NVIDIA GeForce GTX 960 или AMD Radeon R9 280',
        storage: '60 ГБ свободного места',
        directx: 'DirectX 11'
      },
      rec: {
        os: 'Windows 10/11 64-bit',
        cpu: 'Intel Core i7-4770K или AMD Ryzen 5 1600',
        ram: '16 ГБ ОЗУ',
        gpu: 'NVIDIA GeForce GTX 1060 (6 ГБ) или AMD Radeon RX 580',
        storage: '60 ГБ свободного места (рекомендуется SSD)',
        directx: 'DirectX 11 / 12'
      }
    };
  } else {
    return {
      min: {
        os: 'Windows 7 / 8 / 10 64-bit',
        cpu: 'Intel Core 2 Duo 2.4 ГГц или AMD Athlon X2',
        ram: '4 ГБ ОЗУ',
        gpu: 'NVIDIA GeForce GT 730 или AMD Radeon HD 6670',
        storage: '25 ГБ свободного места',
        directx: 'DirectX 10 / 11'
      },
      rec: {
        os: 'Windows 10 64-bit',
        cpu: 'Intel Core i3-4130 или AMD FX-6300',
        ram: '8 ГБ ОЗУ',
        gpu: 'NVIDIA GeForce GTX 750 Ti или AMD Radeon R7 260X',
        storage: '25 ГБ свободного места (SSD)',
        directx: 'DirectX 11'
      }
    };
  }
}
window.getGameSysReq = getGameSysReq;

// Переключение вкладок системных требований (Минимальные / Рекомендуемые)
function toggleSysReq(mode) {
  const minBtn = document.getElementById('sysreq-min-btn');
  const recBtn = document.getElementById('sysreq-rec-btn');
  const minContent = document.getElementById('sysreq-min-content');
  const recContent = document.getElementById('sysreq-rec-content');
  if (!minBtn || !recBtn || !minContent || !recContent) return;

  if (mode === 'min') {
    minBtn.className = 'px-3 py-1.5 rounded-lg bg-zinc-800 text-white font-semibold transition';
    recBtn.className = 'px-3 py-1.5 rounded-lg text-zinc-400 hover:text-white font-medium transition';
    minContent.classList.remove('hidden');
    recContent.classList.add('hidden');
  } else {
    recBtn.className = 'px-3 py-1.5 rounded-lg bg-zinc-800 text-white font-semibold transition';
    minBtn.className = 'px-3 py-1.5 rounded-lg text-zinc-400 hover:text-white font-medium transition';
    recContent.classList.remove('hidden');
    minContent.classList.add('hidden');
  }
}
window.toggleSysReq = toggleSysReq;
