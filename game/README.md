# GameVault

Каталог видеоигр на чистом HTML/CSS/JS (без сборки). Игры берутся из RAWG.

## Структура


## Вход по ссылке из письма (passwordless)

Кнопка «Войти по ссылке из письма» в окне входа отправляет на почту ссылку; переход по ней входит в аккаунт, а нового пользователя регистрирует автоматически.
Включается в консоли Firebase: Authentication → Sign-in method → Email/Password → включить **«Email link (passwordless sign-in)»**.
Домен сайта должен быть в Authorized domains. Открывать сайт нужно по `http(s)://`.

## Деплой

Загрузите папку целиком на любой статический хостинг (rawq.io, Netlify, GitHub Pages, Cloudflare Pages).
