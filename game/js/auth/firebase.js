// ============ FIREBASE AUTH ============
// Подключается после config.js и auth-ui.js. Конфиг — в js/config.js.
(async () => {
  if (FIREBASE_CONFIG.apiKey.startsWith('ВСТАВЬТЕ')) {
    window.GVAuthMissing = true;
    console.warn('GameVault: заполните FIREBASE_CONFIG, чтобы заработала авторизация');
  } else {
    try {
      const { initializeApp } = await import('https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js');
      const A = await import('https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js');
      const auth = A.getAuth(initializeApp(FIREBASE_CONFIG));
      auth.languageCode = 'ru';

      const mapUser = u => {
        const name = u.displayName || (u.email || 'user').split('@')[0];
        return {
          id: u.uid, username: name, email: u.email, avatar: (name[0] || '?').toUpperCase(),
          photo: u.photoURL || null, verified: u.emailVerified,
          joinDate: new Date(u.metadata.creationTime).toLocaleDateString('ru-RU')
        };
      };
      const sync = () => {
        state.currentUser = auth.currentUser ? mapUser(auth.currentUser) : null;
        updateAuthUI();
      };

      A.onAuthStateChanged(auth, () => {
        sync();
        if (state.currentView === 'profile') showView('profile');
      });

      window.GVAuth = {
        async signIn(email, pw) { await A.signInWithEmailAndPassword(auth, email, pw); sync(); },
        async signUp(name, email, pw) {
          const cred = await A.createUserWithEmailAndPassword(auth, email, pw);
          await A.updateProfile(cred.user, { displayName: name });
          A.sendEmailVerification(cred.user).catch(() => {});
          sync();
        },
        async google() { await A.signInWithPopup(auth, new A.GoogleAuthProvider()); sync(); },
        async reset(email) { await A.sendPasswordResetEmail(auth, email); },
        async sendLink(email) {
          // Ссылка ведёт обратно на эту же страницу; Firebase завершит вход при открытии
          await A.sendSignInLinkToEmail(auth, email, {
            url: location.origin + location.pathname,
            handleCodeInApp: true
          });
          try { localStorage.setItem('gv_link_email', email); } catch (e) {}
        },
        async logout() { await A.signOut(auth); },
        async setName(name) { await A.updateProfile(auth.currentUser, { displayName: name }); sync(); }
      };

      // Пользователь перешёл по ссылке из письма: завершаем вход
      if (A.isSignInWithEmailLink(auth, location.href)) {
        let email = null;
        try { email = localStorage.getItem('gv_link_email'); } catch (e) {}
        // Ссылку могли открыть на другом устройстве или в другом браузере
        if (!email) email = (prompt('Подтвердите ваш email, на который пришла ссылка:') || '').trim();
        try {
          if (!email) throw { code: 'auth/invalid-email' };
          await A.signInWithEmailLink(auth, email, location.href);
          try { localStorage.removeItem('gv_link_email'); } catch (e) {}
          sync();
          gvToast('Вы вошли как ' + state.currentUser.username);
        } catch (e) {
          showAuthModal('link');
          setAuthError(authErrorText(e));
        }
        history.replaceState(null, '', location.pathname); // убрать служебные параметры из адреса
      }
    } catch (e) {
      console.error('Firebase не загрузился:', e);
    }
  }
})();
