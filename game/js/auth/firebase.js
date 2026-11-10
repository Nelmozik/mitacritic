// Firebase auth
// Подключается после config.js и auth-ui.js. Конфиг — в js/config.js.
(async () => {
  // настоящие ключи Firebase начинаются с «AIza», если нет - конфиг ещё не заполнен
  if (!FIREBASE_CONFIG.apiKey.startsWith('AIza')) {
    window.GVAuthMissing = true;
    console.warn('GameVault: заполните FIREBASE_CONFIG, чтобы заработала авторизация');
  } else {
    try {
      // подключаем Firebase прямо с сервера Google (без npm и сборки)
      const { initializeApp } = await import('https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js');
      const A = await import('https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js');
      const app = initializeApp(FIREBASE_CONFIG);
      const auth = A.getAuth(app);
      auth.languageCode = 'ru';

      // База данных Firestore нужна для подписок. Если она не включена в консоли Firebase,
      // вход в аккаунт всё равно работает, просто подписки будут недоступны
      let F = null;
      let db = null;
      try {
        F = await import('https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js');
        db = F.getFirestore(app);
      } catch (e) {
        console.warn('Firestore не загрузился:', e);
      }

      // Функции работы с базой. Коллекции:
      //   users/{uid}               - публичные данные игрока (имя, фото), по ним ищем людей
      //   follows/{мойUid_чужойUid} - одна запись = одна подписка
      window.GVDB = db ? {
        // сохраняем имя и фото игрока, чтобы его можно было найти поиском
        async saveUser(u) {
          await F.setDoc(F.doc(db, 'users', u.id), {
            name: u.username,
            nameLower: u.username.toLowerCase(),
            photo: u.photo || null,
            updatedAt: F.serverTimestamp()
          }, { merge: true });
        },

        // поиск игроков только среди реально существующих в базе Firestore
        async searchUsers(text) {
          const q = text.trim().toLowerCase();
          if (!q) return [];
          try {
            const currentUid = auth.currentUser ? auth.currentUser.uid : null;
            const snap = await F.getDocs(F.query(F.collection(db, 'users'), F.limit(100)));
            const fakeList = ['cyberviking_99', 'vanya_playground', 'artorias_cinder', 'kira_v', 'alex_frostbite', 'mrakoborets_old', 'geralt_of_rivia_ru', 'carnage'];
            return snap.docs
              .map(d => {
                const data = d.data() || {};
                const name = data.name || data.username || data.displayName || '';
                return {
                  uid: d.id,
                  name: name,
                  photo: data.photo || null
                };
              })
              .filter(p => p.name && !fakeList.includes(p.name.toLowerCase()) && (!currentUid || p.uid !== currentUid) && p.name.toLowerCase().includes(q));
          } catch (e) {
            console.warn('searchUsers error:', e);
            return [];
          }
        },

        // подписаться на игрока
        async follow(person) {
          const me = auth.currentUser;
          await F.setDoc(F.doc(db, 'follows', me.uid + '_' + person.uid), {
            follower: me.uid,
            followerName: me.displayName || (me.email || 'user').split('@')[0],
            followerPhoto: me.photoURL || null,
            followed: person.uid,
            followedName: person.name,
            followedPhoto: person.photo || null,
            createdAt: F.serverTimestamp()
          });
        },

        // отписаться
        async unfollow(personUid) {
          await F.deleteDoc(F.doc(db, 'follows', auth.currentUser.uid + '_' + personUid));
        },

        // на кого подписан я
        async getFollowing() {
          const snap = await F.getDocs(F.query(F.collection(db, 'follows'), F.where('follower', '==', auth.currentUser.uid)));
          return snap.docs.map(d => ({ uid: d.data().followed, name: d.data().followedName, photo: d.data().followedPhoto || null }));
        },

        // кто подписан на меня
        async getFollowers() {
          const snap = await F.getDocs(F.query(F.collection(db, 'follows'), F.where('followed', '==', auth.currentUser.uid)));
          return snap.docs.map(d => ({ uid: d.data().follower, name: d.data().followerName, photo: d.data().followerPhoto || null }));
        },

        // сохранение профиля, списков игр и оценок в облако Firestore
        async saveProfileData(uid, data) {
          if (!db || !uid || !F) return;
          const payload = {
            updatedAt: F.serverTimestamp()
          };
          if (data.userLists !== undefined) payload.userLists = data.userLists;
          if (data.userRatings !== undefined) payload.userRatings = data.userRatings;
          if (data.userFavorites !== undefined) payload.userFavorites = data.userFavorites;
          if (data.userCollections !== undefined) payload.userCollections = data.userCollections;
          if (data.userCustom !== undefined) {
            payload.userCustom = data.userCustom;
            if (data.userCustom.avatar) {
              payload.photo = data.userCustom.avatar;
            }
          }
          if (data.recentlyViewed !== undefined) payload.recentlyViewed = data.recentlyViewed;
          await F.setDoc(F.doc(db, 'users', uid), payload, { merge: true });
        },

        // загрузка профиля, списков игр и оценок из облака Firestore
        async loadProfileData(uid) {
          if (!db || !uid || !F) return null;
          const snap = await F.getDoc(F.doc(db, 'users', uid));
          if (!snap.exists()) return null;
          return snap.data();
        },

        // автоматическая живая real-time синхронизация без перезагрузок и кнопок
        listenProfileData(uid, callback) {
          if (!db || !uid || !F || typeof F.onSnapshot !== 'function') return () => {};
          return F.onSnapshot(F.doc(db, 'users', uid), (snap) => {
            if (snap.exists() && typeof callback === 'function') {
              callback(snap.data());
            }
          }, (err) => {
            console.warn('Real-time sync listener error:', err);
          });
        }
      } : null;

      // превращаем пользователя Firebase в объект, который понимает наш сайт
      const mapUser = u => {
        const name = u.displayName || (u.email || 'user').split('@')[0];
        return {
          id: u.uid, username: name, email: u.email, avatar: (name[0] || '?').toUpperCase(),
          photo: u.photoURL || null, verified: u.emailVerified,
          joinDate: new Date(u.metadata.creationTime).toLocaleDateString('ru-RU')
        };
      };

      // активная подписка на изменения в облаке
      let unsubscribeProfile = null;

      // обновляем state.currentUser и шапку сайта
      const sync = () => {
        state.currentUser = auth.currentUser ? mapUser(auth.currentUser) : null;
        if (typeof loadUserData === 'function') loadUserData();
        updateAuthUI();

        if (state.currentUser && window.GVDB) {
          GVDB.saveUser(state.currentUser).catch(e => console.warn('saveUser:', e));
          // Автоматическая фоновая подписка: любые изменения профиля с любого устройства прилетают сразу
          if (unsubscribeProfile) {
            try { unsubscribeProfile(); } catch (e) {}
            unsubscribeProfile = null;
          }
          if (typeof GVDB.listenProfileData === 'function') {
            unsubscribeProfile = GVDB.listenProfileData(state.currentUser.id, (cloudData) => {
              if (typeof window.applyCloudProfileData === 'function') {
                window.applyCloudProfileData(cloudData);
              }
            });
          }
        } else if (!state.currentUser && unsubscribeProfile) {
          try { unsubscribeProfile(); } catch (e) {}
          unsubscribeProfile = null;
        }
      };

      // Firebase сам сообщает, когда пользователь вошёл или вышел (в том числе при обновлении страницы)
      A.onAuthStateChanged(auth, () => {
        sync();
        if (state.currentView === 'profile') showView('profile');
      });

      // набор функций авторизации, которые вызывает auth-ui.js
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

      // Если пользователь открыл сайт по ссылке из письма - завершаем вход
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
