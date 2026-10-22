// Авторизация
// Открывает окно входа. Можно передать режим: login, signup, reset или link
function showAuthModal(mode) {
  setAuthMode(mode || 'login');
  document.getElementById('auth-modal').classList.remove('hidden-view');
  setTimeout(() => { const f = document.getElementById(state.authMode === 'signup' ? 'auth-name' : 'auth-email'); if (f) f.focus(); }, 60);
}

// Закрывает окно входа
function closeAuthModal() {
  document.getElementById('auth-modal').classList.add('hidden-view');
}

const AUTH_TEXT = {
  login:  { title: 'С возвращением', sub: 'Войдите, чтобы вести списки и оценивать игры', btn: 'Войти' },
  signup: { title: 'Создать аккаунт', sub: 'Это бесплатно и займёт полминуты', btn: 'Создать аккаунт' },
  reset:  { title: 'Восстановление пароля', sub: 'Отправим ссылку для сброса на вашу почту', btn: 'Отправить ссылку' },
  link:   { title: 'Вход по ссылке', sub: 'Без пароля: пришлём на почту ссылку для входа. Нового пользователя мы зарегистрируем автоматически', btn: 'Отправить ссылку' }
};

// Переключает режим окна (вход / регистрация / сброс пароля / вход по ссылке): прячет лишние поля и меняет тексты
function setAuthMode(mode) {
  state.authMode = mode;
  document.querySelectorAll('#auth-modal [data-modes]').forEach(el => {
    el.classList.toggle('hidden-view', !el.dataset.modes.split(' ').includes(mode));
  });
  const t = AUTH_TEXT[mode];
  document.getElementById('auth-title').textContent = t.title;
  document.getElementById('auth-sub').textContent = t.sub;
  document.getElementById('auth-submit-text').textContent = t.btn;
  document.getElementById('auth-password').autocomplete = mode === 'signup' ? 'new-password' : 'current-password';
  ['login', 'signup'].forEach(m => {
    const b = document.getElementById('tab-' + m);
    b.className = 'py-2 rounded-lg transition ' + (m === mode ? 'bg-zinc-700 text-white shadow' : 'text-zinc-400 hover:text-white');
  });
  setAuthError(''); setAuthInfo('');
  updateStrength();
}

// Показывает или скрывает пароль в поле ввода
function togglePw() {
  const i = document.getElementById('auth-password');
  const show = i.type === 'password';
  i.type = show ? 'text' : 'password';
  document.getElementById('auth-eye').className = show ? 'fa-regular fa-eye-slash' : 'fa-regular fa-eye';
}

// Считает «надёжность» пароля от 0 до 4: длина, большие и маленькие буквы, цифры, символы
function pwScore(p) {
  let s = 0;
  if (p.length >= 8) s++;
  if (p.length >= 12) s++;
  if (/[a-zа-я]/.test(p) && /[A-ZА-Я]/.test(p)) s++;
  if (/\d/.test(p) && /[^\w\s]|_/.test(p)) s++;
  else if (/\d/.test(p) && p.length >= 8) s += 0.5;
  return Math.min(4, Math.floor(s));
}

// Закрашивает полоски надёжности пароля и меняет подсказку под полем
function updateStrength() {
  const p = document.getElementById('auth-password').value;
  const sc = p ? Math.max(1, pwScore(p)) : 0;
  const colors = ['bg-zinc-800', 'bg-red-500', 'bg-amber-500', 'bg-lime-500', 'bg-emerald-500'];
  const labels = ['Минимум 8 символов, лучше с цифрами и заглавными буквами', 'Слабый пароль', 'Можно надёжнее', 'Хороший пароль', 'Отличный пароль'];
  document.querySelectorAll('.pw-seg').forEach((el, i) => {
    el.className = 'h-1 rounded-full pw-seg transition-colors ' + (i < sc ? colors[sc] : 'bg-zinc-800');
  });
  document.getElementById('auth-strength').textContent = labels[sc];
}

// Показывает красное сообщение об ошибке в окне входа (пустая строка - убрать)
function setAuthError(msg) {
  const el = document.getElementById('auth-error');
  el.innerHTML = msg ? '<i class="fa-solid fa-circle-exclamation mt-0.5"></i><span></span>' : '';
  if (msg) el.querySelector('span').textContent = msg;
  el.classList.toggle('hidden-view', !msg);
  return false;
}
// Показывает зелёное информационное сообщение
function setAuthInfo(msg) {
  const el = document.getElementById('auth-info');
  el.innerHTML = msg ? '<i class="fa-solid fa-circle-check mt-0.5"></i><span></span>' : '';
  if (msg) el.querySelector('span').textContent = msg;
  el.classList.toggle('hidden-view', !msg);
}
// Блокирует кнопки и показывает крутилку, пока идёт запрос к Firebase
function setAuthBusy(b) {
  const btn = document.getElementById('auth-submit');
  btn.disabled = b;
  document.getElementById('auth-google').disabled = b;
  document.getElementById('auth-submit-text').innerHTML = b ? '<i class="fa-solid fa-spinner fa-spin"></i>' : AUTH_TEXT[state.authMode].btn;
}

let toastTimer;  // таймер уведомления, чтобы старое не скрыло новое
// Небольшое всплывающее уведомление сверху, исчезает через 3,5 секунды
function gvToast(msg) {
  const t = document.getElementById('gv-toast');
  t.textContent = msg; t.classList.remove('hidden-view');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.add('hidden-view'), 3500);
}

// Переводит коды ошибок Firebase в понятные сообщения на русском
function authErrorText(e) {
  const map = {
    'auth/invalid-credential': 'Неверный email или пароль',
    'auth/wrong-password': 'Неверный email или пароль',
    'auth/user-not-found': 'Неверный email или пароль',
    'auth/invalid-email': 'Некорректный email',
    'auth/email-already-in-use': 'Этот email уже зарегистрирован. Попробуйте войти',
    'auth/weak-password': 'Слишком простой пароль',
    'auth/too-many-requests': 'Слишком много попыток. Подождите немного и повторите',
    'auth/network-request-failed': 'Нет соединения с интернетом',
    'auth/popup-closed-by-user': 'Окно входа было закрыто',
    'auth/cancelled-popup-request': 'Окно входа было закрыто',
    'auth/popup-blocked': 'Браузер заблокировал всплывающее окно. Разрешите его для этого сайта',
    'auth/unauthorized-domain': 'Этот домен не добавлен в Firebase (Authentication → Settings → Authorized domains)',
    'auth/operation-not-allowed': 'Этот способ входа не включён в консоли Firebase',
    'auth/operation-not-supported-in-this-environment': 'Откройте сайт по адресу http(s)://, а не как файл: Google-вход на file:// не работает',
    'auth/user-disabled': 'Аккаунт отключён',
    'auth/invalid-action-code': 'Ссылка недействительна или уже использована. Запросите новую',
    'auth/expired-action-code': 'Срок действия ссылки истёк. Запросите новую',
    'auth/invalid-continue-uri': 'Некорректный адрес сайта для ссылки. Откройте сайт по http(s):// адресу',
    'auth/unauthorized-continue-uri': 'Домен сайта не добавлен в Firebase (Authentication → Settings → Authorized domains)',
    'auth/argument-error': 'Откройте сайт по адресу http(s)://, а не как файл'
  };
  return map[e && e.code] || ('Не удалось выполнить действие' + (e && e.code ? ' (' + e.code + ')' : ''));
}

// Проверяет, что Firebase загрузился и настроен. Если нет, показывает ошибку
function authReady() {
  if (window.GVAuth) return true;
  setAuthError(window.GVAuthMissing
    ? 'Firebase не настроен: заполните FIREBASE_CONFIG в файле js/config.js'
    : 'Сервис авторизации ещё загружается или недоступен. Проверьте интернет и повторите.');
  return false;
}

// Обработка формы: проверяем поля и вызываем нужное действие Firebase (вход, регистрация, сброс, ссылка)
async function submitAuth() {
  const mode = state.authMode;
  const v = id => document.getElementById(id).value;
  const email = v('auth-email').trim(), pw = v('auth-password'), name = v('auth-name').trim();
  setAuthError(''); setAuthInfo('');
  if (!/^\S+@\S+\.\S+$/.test(email)) return setAuthError('Введите корректный email');
  if (mode === 'login' || mode === 'signup') {
    if (!pw) return setAuthError('Введите пароль');
    if (mode === 'signup') {
      if (name.length < 2) return setAuthError('Введите имя (минимум 2 символа)');
      if (pw.length < 8) return setAuthError('Пароль должен быть не короче 8 символов');
    }
  }
  if (!authReady()) return;
  setAuthBusy(true);
  try {
    if (mode === 'login') {
      await GVAuth.signIn(email, pw);
      closeAuthModal(); gvToast('С возвращением, ' + state.currentUser.username + '!');
    } else if (mode === 'signup') {
      await GVAuth.signUp(name, email, pw);
      closeAuthModal(); gvToast('Аккаунт создан. Мы отправили письмо для подтверждения email');
    } else if (mode === 'link') {
      await GVAuth.sendLink(email);
      setAuthInfo('Мы отправили ссылку для входа на ' + email + '. Откройте письмо и перейдите по ссылке (проверьте «Спам»).');
    } else {
      await GVAuth.reset(email);
      setAuthInfo('Если такой аккаунт есть, мы отправили на ' + email + ' ссылку для сброса пароля.');
    }
  } catch (e) {
    setAuthError(authErrorText(e));
  } finally {
    setAuthBusy(false);
  }
}

// Вход через Google (всплывающее окно)
async function authGoogle() {
  setAuthError('');
  if (!authReady()) return;
  setAuthBusy(true);
  try {
    await GVAuth.google();
    closeAuthModal(); gvToast('Вы вошли как ' + state.currentUser.username);
  } catch (e) {
    setAuthError(authErrorText(e));
  } finally {
    setAuthBusy(false);
  }
}

// Выход из аккаунта и возврат на главную
async function logout() {
  try { if (window.GVAuth) await GVAuth.logout(); } catch (e) { console.warn(e); }
  state.currentUser = null;
  updateAuthUI();
  showView('home');
  gvToast('Вы вышли из аккаунта');
}

// Обновляет правый верхний угол шапки: кнопка «Войти» или аватар с именем пользователя
function updateAuthUI() {
  const authButtons = document.getElementById('auth-buttons');
  
  if (state.currentUser) {
    authButtons.innerHTML = `
      <div class="flex items-center gap-3">
        <button onclick="showView('profile')" class="flex items-center gap-3 bg-zinc-800/80 hover:bg-zinc-700 border border-zinc-700 hover:border-zinc-600 rounded-full pl-1 pr-4 py-1 transition group">
          <div class="w-8 h-8 rounded-full overflow-hidden bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center text-white font-bold text-xs ring-2 ring-zinc-900">
            ${state.currentUser.photo ? `<img src="${state.currentUser.photo}" referrerpolicy="no-referrer" class="w-full h-full object-cover" alt="">` : state.currentUser.avatar}
          </div>
          <div class="hidden sm:flex flex-col items-start leading-tight">
            <span class="text-sm font-semibold text-zinc-200 group-hover:text-white">${state.currentUser.username}</span>
            <span class="text-[10px] text-zinc-500 font-medium">Игрок</span>
          </div>
          <i class="fa-solid fa-chevron-down text-[10px] text-zinc-600 group-hover:text-zinc-400 transition"></i>
        </button>
        <button onclick="logout()" class="text-zinc-500 hover:text-red-400 transition" title="Выйти">
          <i class="fa-solid fa-right-from-bracket"></i>
        </button>
      </div>
    `;
  } else {
    authButtons.innerHTML = `
      <button onclick="showAuthModal()" class="bg-violet-600 hover:bg-violet-500 text-white font-semibold py-2 px-4 rounded-lg transition flex items-center gap-2">
        <i class="fa-solid fa-user"></i> Войти
      </button>
    `;
  }
}
