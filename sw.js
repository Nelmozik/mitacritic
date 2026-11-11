// GameVault Service Worker (v1.0.0)
const CACHE_NAME = 'gv-static-v1.0.0';
const DATA_CACHE_NAME = 'gv-data-v1.0.0';
const IMAGE_CACHE_NAME = 'gv-images-v1.0.0';

// Ресурсы оболочки приложения (App Shell)
const STATIC_ASSETS = [
  './',
  'index.html',
  'manifest.json',
  'css/tailwind.css',
  'css/styles.css',
  'js/config.js',
  'js/utils.js',
  'js/dialogs.js',
  'js/data.js',
  'js/games.js',
  'js/details.js',
  'js/state.js',
  'js/auth/auth-ui.js',
  'js/auth/firebase.js',
  'js/rating-stats.js',
  'js/news-data.js',
  'js/demo-reviews.js',
  'js/public-profiles.js',
  'js/reviews.js',
  'js/router.js',
  'js/views/components.js',
  'js/views/home.js',
  'js/views/news.js',
  'js/views/game-sysreq.js',
  'js/views/game.js',
  'js/views/catalog.js',
  'js/views/tops.js',
  'js/views/profile/profile-custom.js',
  'js/views/profile/profile-stats.js',
  'js/views/profile/profile-lists.js',
  'js/views/profile/profile-social.js',
  'js/views/profile/profile-edit-modal.js',
  'js/views/profile/profile-main.js',
  'js/views/profile.js',
  'js/audio.js',
  'js/actions.js',
  'js/main.js',
  'data/index.json',
  'assets/icons/icon-192.png',
  'assets/icons/icon-512.png',
  'assets/banners/hollow_knight_animated.webp'
];

// Установка: предварительное кэширование App Shell
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(STATIC_ASSETS))
      .then(() => self.skipWaiting())
      .catch(err => console.warn('[SW] Ошибка кэширования статики при установке:', err))
  );
});

// Активация: удаление устаревших версий кэша
self.addEventListener('activate', event => {
  const allowedCaches = [CACHE_NAME, DATA_CACHE_NAME, IMAGE_CACHE_NAME];
  event.waitUntil(
    caches.keys().then(keys => {
      return Promise.all(
        keys.filter(key => !allowedCaches.includes(key)).map(key => {
          console.log('[SW] Удаление старого кэша:', key);
          return caches.delete(key);
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Обработка запросов
self.addEventListener('fetch', event => {
  const req = event.request;
  const url = new URL(req.url);

  // Игнорируем запросы, не являющиеся GET
  if (req.method !== 'GET') return;

  // Игнорируем авторизацию Firebase и служебные API Google
  if (url.hostname.includes('firebaseio.com') ||
      url.hostname.includes('googleapis.com') ||
      url.hostname.includes('identitytoolkit') ||
      url.hostname.includes('securetoken')) {
    return;
  }

  // 1. Навигационные запросы (HTML страницы): Network-First с возвратом к index.html
  if (req.mode === 'navigate') {
    event.respondWith(
      fetch(req).catch(() => caches.match('index.html'))
    );
    return;
  }

  // 2. Данные каталога (data/*.json): Stale-While-Revalidate
  if (url.origin === self.location.origin && url.pathname.includes('/data/')) {
    event.respondWith(
      caches.open(DATA_CACHE_NAME).then(async cache => {
        const cached = await cache.match(req);
        const fetchPromise = fetch(req).then(networkRes => {
          if (networkRes && networkRes.ok) {
            cache.put(req, networkRes.clone());
          }
          return networkRes;
        }).catch(err => {
          if (!cached) console.warn('[SW] Не удалось загрузить данные из сети:', req.url);
          return cached;
        });
        return cached || fetchPromise;
      })
    );
    return;
  }

  // 3. Обложки и медиа (RAWG, CDN картинок): Cache-First с динамическим кэшированием
  if (url.hostname.includes('media.rawg.io') || req.destination === 'image') {
    event.respondWith(
      caches.open(IMAGE_CACHE_NAME).then(async cache => {
        const cached = await cache.match(req);
        if (cached) return cached;
        try {
          const networkRes = await fetch(req);
          if (networkRes && (networkRes.ok || networkRes.type === 'opaque')) {
            cache.put(req, networkRes.clone());
          }
          return networkRes;
        } catch (e) {
          return cached || new Response('', { status: 408, statusText: 'Offline' });
        }
      })
    );
    return;
  }

  // 4. Локальные статические ресурсы (CSS, JS, шрифты): Cache-First с обновлением
  if (url.origin === self.location.origin) {
    event.respondWith(
      caches.match(req).then(cached => {
        if (cached) return cached;
        return fetch(req).then(networkRes => {
          if (networkRes && networkRes.ok) {
            const clone = networkRes.clone();
            caches.open(CACHE_NAME).then(cache => cache.put(req, clone));
          }
          return networkRes;
        });
      })
    );
    return;
  }

  // 5. Внешние шрифты и CDN стилей (cdnjs, Google Fonts): Stale-While-Revalidate
  if (url.hostname.includes('fonts.googleapis.com') ||
      url.hostname.includes('fonts.gstatic.com') ||
      url.hostname.includes('cdnjs.cloudflare.com')) {
    event.respondWith(
      caches.open(CACHE_NAME).then(async cache => {
        const cached = await cache.match(req);
        const fetchPromise = fetch(req).then(res => {
          if (res && (res.ok || res.type === 'opaque')) {
            cache.put(req, res.clone());
          }
          return res;
        }).catch(() => cached);
        return cached || fetchPromise;
      })
    );
  }
});
