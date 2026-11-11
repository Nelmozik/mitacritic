// Настройки
// Firebase: авторизация (Authentication → Settings → Authorized domains: добавьте домен сайта)
const FIREBASE_CONFIG = {
  apiKey: "AIzaSyC8tAPZ_-uQB_PWbctlQqYnGT8uaYYVUKc",
  authDomain: "gamevault-db13a.firebaseapp.com",
  projectId: "gamevault-db13a",
  appId: "1:871695049714:web:abebe9de8828d9424c416b"
};

// Настройки отправки баг-репортов на почту через бесплатный сервис веб-форм (Web3Forms / Formspree)
// 1. Введите свою почту на https://web3forms.com (без пароля и регистрации)
// 2. Полученный access_key вставьте ниже:
const BUG_REPORT_CONFIG = {
  provider: 'web3forms',                                // Сервис отправки: 'web3forms'
  accessKey: '66279133-e1a1-4199-bf91-16c4e0fe6872',   // Ваш Access Key от Web3Forms
  email: 'gamevault0726@gmail.com'                      // Почта получателя
};
