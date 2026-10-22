# GameVault

Каталог видеоигр на чистом HTML/CSS/JS (без сборки). Игры берутся из RAWG, аккаунты — Firebase Auth.

## Структура

```
gamevault/
├── index.html              разметка: шапка, подвал, модальные окна, подключение скриптов
├── css/
│   └── styles.css          стили (кроме Tailwind)
└── js/
    ├── config.js           настройки: конфиг Firebase
    ├── tailwind-config.js  палитра и шрифты Tailwind
    ├── data.js             демо-игры, жанры, платформы, отзывы
    ├── state.js            глобальное состояние приложения
    ├── router.js           showView() — переключение страниц
    ├── games.js            каталог игр (≈10 000, выгружен из RAWG)
    ├── reviews.js          окно отзыва и отправка отзывов
    ├── actions.js          списки игр, оценки, лайки, вкладки, лайтбокс
    ├── auth/
    │   ├── auth-ui.js      окно входа/регистрации, валидация, уведомления
    │   └── firebase.js     обёртка над Firebase Auth (window.GVAuth)
    └── views/
        ├── components.js   карточки (игра, релиз, отзыв)
        ├── home.js         главная
        ├── catalog.js      каталог, фильтры, поиск, «показать ещё»
        ├── game.js         страница игры
        ├── tops.js         топы и релизы
        └── profile.js      профиль и списки
```

Порядок `<script>` в `index.html` важен: файлы делят глобальные функции и `state`.

## Запуск

Нужен любой статический сервер (Google-вход не работает с `file://`):

```
cd gamevault
python3 -m http.server 8000      # затем http://localhost:8000
```

## Настройка

1. Каталог игр уже встроен в `js/games.js`, ключ RAWG не нужен.
2. `js/config.js` → `FIREBASE_CONFIG` (инструкция внутри файла). В консоли Firebase включите Email/Password и Google и добавьте домен в Authorized domains.

## Вход по ссылке из письма (passwordless)

Кнопка «Войти по ссылке из письма» в окне входа отправляет на почту ссылку; переход по ней входит в аккаунт, а нового пользователя регистрирует автоматически.
Включается в консоли Firebase: Authentication → Sign-in method → Email/Password → включить **«Email link (passwordless sign-in)»**.
Домен сайта должен быть в Authorized domains. Открывать сайт нужно по `http(s)://`.

## Деплой

Загрузите папку целиком на любой статический хостинг (rawq.io, Netlify, GitHub Pages, Cloudflare Pages).
