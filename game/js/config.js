// ============ НАСТРОЙКИ ============
// Единственный файл, который нужно править при деплое.

// --- RAWG: каталог игр (бесплатный ключ: https://rawg.io/apidocs) ---
const RAWG_KEY = '42aab9e2e6084486b058f2a40b1979b1';   // бесплатный ключ: https://rawg.io/apidocs
const GAMES_COUNT = 10000;                      // сколько игр загружать
const WITH_DETAILS = false;                    // true = разработчик и описание (в разы дольше)

// --- Firebase: авторизация ---
// 1. https://console.firebase.google.com → создайте проект → Add app → Web (</>)
// 2. Authentication → Sign-in method: включите "Email/Password" и "Google"
// 3. Authentication → Settings → Authorized domains: добавьте домен сайта
// 4. Скопируйте свой firebaseConfig сюда:
const FIREBASE_CONFIG = {
  apiKey: "AIzaSyC8tAPZ_-uQB_PWbctlQqYnGT8uaYYVUKc",
  authDomain: "ВАШ-ПРОЕКТ.firebaseapp.com",
  projectId: "ВАШ-ПРОЕКТ",
  appId: "1:871695049714:web:abebe9de8828d9424c416b"
};
