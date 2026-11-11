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
      //   users/{uid}               - публичные данные игрока (только name, nameLower, photo, updatedAt)
      //   private/{uid}             - приватные данные (email, списки, личные настройки, доступные только владельцу)
      //   follows/{мойUid_чужойUid} - одна запись = одна подписка
      window.GVDB = db ? {
        // сохраняем имя и фото игрока в публичный users/{uid}, email строго в private/{uid}
        async saveUser(u) {
          try {
            const userRef = F.doc(db, 'users', u.id);
            const snap = await F.getDoc(userRef);
            let realName = u.username;
            const existing = snap.exists() ? snap.data() : null;
            // Если текущее имя u.username — просто часть email (например при входе по ссылке),
            // а в базе уже сохранено нормальное имя игрока (например, Carnage), не затираем его!
            if (existing && existing.name && realName === (u.email || '').split('@')[0]) {
              realName = existing.name;
              u.username = realName;
              u.avatar = (realName[0] || '?').toUpperCase();
              if (state.currentUser && state.currentUser.id === u.id) {
                state.currentUser.username = realName;
                state.currentUser.avatar = u.avatar;
                if (typeof updateAuthUI === 'function') updateAuthUI();
              }
            }

            // Валидация имени: от 2 до 32 символов (требование правил Firestore)
            let validName = String(realName || 'Игрок').trim();
            if (validName.length < 2) validName = (validName + '_player').slice(0, 32);
            if (validName.length > 32) validName = validName.slice(0, 32);

            // Валидация фото: только https:// ссылка до 500 символов или null
            let validPhoto = u.photo || (existing ? existing.photo : null) || null;
            if (validPhoto && (!String(validPhoto).startsWith('https://') || String(validPhoto).length > 500)) {
              validPhoto = null;
            }

            // В публичный users/{uid} пишем ТОЛЬКО разрешённые поля: name, nameLower, photo, updatedAt
            // Перезапись без merge: true автоматически вычищает старое поле email из документа!
            const publicData = {
              name: validName,
              nameLower: validName.toLowerCase(),
              photo: validPhoto,
              updatedAt: F.serverTimestamp()
            };
            await F.setDoc(userRef, publicData);

            // Приватные данные (email) пишем строго в приватную коллекцию private/{uid}
            if (u.email) {
              try {
                await F.setDoc(F.doc(db, 'private', u.id), {
                  email: u.email,
                  updatedAt: F.serverTimestamp()
                }, { merge: true });
              } catch (privErr) {
                console.warn('private save error:', privErr);
              }
            }
          } catch (err) {
            console.warn('saveUser error:', err);
          }
        },

        // поиск игроков только среди реально существующих в базе Firestore по префиксу nameLower
        async searchUsers(text) {
          const q = text.trim().toLowerCase();
          if (!q) return [];
          try {
            const currentUid = auth.currentUser ? auth.currentUser.uid : null;
            const usersRef = F.collection(db, 'users');
            const qRef = F.query(
              usersRef,
              F.where('nameLower', '>=', q),
              F.where('nameLower', '<=', q + '\uf8ff'),
              F.limit(20)
            );
            const snap = await F.getDocs(qRef);
            return snap.docs
              .map(d => {
                const data = d.data() || {};
                return {
                  uid: d.id,
                  name: data.name || '',
                  photo: data.photo || null
                };
              })
              .filter(p => p.name && (!currentUid || p.uid !== currentUid));
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
        async unfollow(personUidOrName) {
          if (!auth.currentUser || !personUidOrName) return;
          const meUid = auth.currentUser.uid;
          try {
            await F.deleteDoc(F.doc(db, 'follows', meUid + '_' + personUidOrName));
          } catch (e) {}
          try {
            const snap = await F.getDocs(F.query(F.collection(db, 'follows'), F.where('follower', '==', meUid)));
            const target = String(personUidOrName).toLowerCase();
            for (const d of snap.docs) {
              const data = d.data() || {};
              const fUid = String(data.followed || '').toLowerCase();
              const fName = String(data.followedName || '').toLowerCase();
              if (fUid === target || fName === target || fUid.includes(target) || fName.includes(target)) {
                await F.deleteDoc(d.ref);
              }
            }
          } catch (e) {
            console.warn('unfollow query error:', e);
          }
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

        // сохранение личных списков, оценок и настроек в приватную коллекцию private/{uid}
        async saveProfileData(uid, data) {
          if (!db || !uid || !F) return;
          const payload = {
            updatedAt: F.serverTimestamp()
          };
          if (data.userLists !== undefined) payload.userLists = data.userLists;
          if (data.userRatings !== undefined) payload.userRatings = data.userRatings;
          if (data.userFavorites !== undefined) payload.userFavorites = data.userFavorites;
          if (data.userCollections !== undefined) payload.userCollections = data.userCollections;
          if (data.userCustom !== undefined) payload.userCustom = data.userCustom;
          if (data.recentlyViewed !== undefined) payload.recentlyViewed = data.recentlyViewed;
          await F.setDoc(F.doc(db, 'private', uid), payload, { merge: true });

          // Если пользователь обновил аватарку на валидный https URL, синхронизируем в публичный users/{uid}
          if (data.userCustom && data.userCustom.avatar && String(data.userCustom.avatar).startsWith('https://') && String(data.userCustom.avatar).length <= 500) {
            try {
              await F.updateDoc(F.doc(db, 'users', uid), {
                photo: data.userCustom.avatar,
                updatedAt: F.serverTimestamp()
              });
            } catch (e) {}
          }
        },

        // загрузка личных данных из private/{uid} (с мягкой обратной совместимостью)
        async loadProfileData(uid) {
          if (!db || !uid || !F) return null;
          try {
            const snap = await F.getDoc(F.doc(db, 'private', uid));
            if (snap.exists()) return snap.data();
            const legacySnap = await F.getDoc(F.doc(db, 'users', uid));
            if (legacySnap.exists()) return legacySnap.data();
          } catch (e) {
            console.warn('loadProfileData error:', e);
          }
          return null;
        },

        // живая синхронизация из приватной коллекции private/{uid}
        listenProfileData(uid, callback) {
          if (!db || !uid || !F || typeof F.onSnapshot !== 'function') return () => {};
          return F.onSnapshot(F.doc(db, 'private', uid), (snap) => {
            if (snap.exists() && typeof callback === 'function') {
              callback(snap.data());
            }
          }, (err) => {
            console.warn('Real-time sync listener error:', err);
          });
        },

        // Получение всех реальных отзывов для игры из Firestore (доступно всем, включая гостей)
        async getReviews(gameId) {
          if (!db || !F) return [];
          try {
            const gid = Number(gameId);
            const qRef = F.query(
              F.collection(db, 'reviews'),
              F.where('gameId', '==', gid)
            );
            const snap = await F.getDocs(qRef);
            const list = [];
            snap.forEach(d => {
              const data = d.data() || {};
              list.push({
                id: data.id || d.id,
                gameId: data.gameId,
                user: data.userName || 'Игрок',
                userId: data.userId,
                score: Number(data.rating || 8),
                rating: data.badge || 'recommended',
                title: data.title || '',
                body: data.body || '',
                pros: data.pros || '',
                cons: data.cons || '',
                tags: Array.isArray(data.tags) ? data.tags : [],
                likes: Number(data.likes || 0),
                date: data.date || '',
                createdAt: data.createdAt
              });
            });
            // Сортируем: свежие отзывы сверху
            list.sort((a, b) => (Number(b.id) || 0) - (Number(a.id) || 0));
            return list;
          } catch (e) {
            console.warn('GVDB.getReviews error:', e);
            return [];
          }
        },

        // Сохранение нового отзыва в Firestore
        async addReview(review) {
          if (!db || !F || !auth.currentUser) return;
          const user = auth.currentUser;
          const revId = String(review.id || Date.now());
          const docData = {
            id: Number(review.id || Date.now()),
            userId: user.uid,
            userName: user.displayName || (user.email || 'user').split('@')[0],
            gameId: Number(review.gameId),
            rating: Number(review.score || 8),
            badge: String(review.rating || 'recommended'),
            title: String(review.title || '').slice(0, 100),
            body: String(review.body || '').slice(0, 5000),
            pros: String(review.pros || '').slice(0, 500),
            cons: String(review.cons || '').slice(0, 500),
            tags: Array.isArray(review.tags) ? review.tags.slice(0, 10) : [],
            date: String(review.date || new Date().toLocaleDateString('ru-RU')),
            likes: 0,
            createdAt: F.serverTimestamp(),
            updatedAt: F.serverTimestamp()
          };
          await F.setDoc(F.doc(db, 'reviews', revId), docData);
        },

        // Удаление отзыва из Firestore
        async deleteReview(reviewId) {
          if (!db || !F || !auth.currentUser) return;
          try {
            await F.deleteDoc(F.doc(db, 'reviews', String(reviewId)));
          } catch (e) {
            console.warn('GVDB.deleteReview error:', e);
          }
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
        async checkEmailMethods(email) {
          const normEmail = (email || '').trim().toLowerCase();
          try {
            return await A.fetchSignInMethodsForEmail(auth, normEmail);
          } catch (e) {
            if (e && e.code === 'auth/quota-exceeded') throw e;
            console.warn('checkEmailMethods error:', e);
            return [];
          }
        },
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
          const normEmail = (email || '').trim().toLowerCase();
          const targetUrl = (location.origin.includes('localhost') || location.origin.includes('127.0.0.1'))
            ? location.origin + location.pathname
            : 'https://gamevault0726.web.app';
          // Ссылка ведёт обратно на чистый домен; Firebase завершит вход при открытии
          await A.sendSignInLinkToEmail(auth, normEmail, {
            url: targetUrl,
            handleCodeInApp: true
          });
          try { localStorage.setItem('gv_link_email', normEmail); } catch (e) {}
        },
        async logout() { await A.signOut(auth); },
        async setName(name) { await A.updateProfile(auth.currentUser, { displayName: name }); sync(); }
      };

      // Межвкладочная синхронизация авторизации: если пользователь открыл ссылку в другой вкладке,
      // основная вкладка мгновенно подхватывает авторизацию и закрывает окно входа
      try {
        if (typeof BroadcastChannel !== 'undefined') {
          const authChannel = new BroadcastChannel('gv_auth_sync');
          authChannel.onmessage = (ev) => {
            if (ev.data && (ev.data.type === 'SIGN_IN_SUCCESS' || ev.data.action === 'login')) {
              if (typeof closeAuthModal === 'function') closeAuthModal();
              sync();
              if (typeof gvToast === 'function') gvToast('Вход успешно выполнен через ссылку!');
              if (state.currentView === 'profile' && typeof showView === 'function') showView('profile');
            }
          };
        }
        window.addEventListener('storage', (ev) => {
          if (ev.key === 'gv_auth_signal') {
            if (typeof closeAuthModal === 'function') closeAuthModal();
            sync();
            if (typeof gvToast === 'function') gvToast('Вход успешно выполнен через ссылку!');
            if (state.currentView === 'profile' && typeof showView === 'function') showView('profile');
          }
        });
      } catch (err) {}

      // Если пользователь открыл сайт по ссылке из письма - завершаем вход
      if (A.isSignInWithEmailLink(auth, location.href)) {
        let email = null;
        try { email = localStorage.getItem('gv_link_email'); } catch (e) {}
        // Ссылку могли открыть на другом устройстве или в другом браузере
        if (!email) email = (prompt('Подтвердите ваш email, на который пришла ссылка:') || '').trim();
        try {
          if (!email) throw { code: 'auth/invalid-email' };
          email = email.trim().toLowerCase();
          try {
            const methods = await A.fetchSignInMethodsForEmail(auth, email);
            if (methods && methods.includes('password')) {
              throw { code: 'gv/registered-with-password' };
            }
          } catch (mErr) {
            if (mErr && mErr.code === 'gv/registered-with-password') throw mErr;
          }
          await A.signInWithEmailLink(auth, email, location.href);
          try { localStorage.removeItem('gv_link_email'); } catch (e) {}
          sync();

          // Оповещаем другие открытые вкладки сайта через gv_sync и gv_auth_sync
          if (typeof broadcastSyncEvent === 'function') {
            broadcastSyncEvent('AUTH_STATE_CHANGED', { action: 'login', user: state.currentUser });
          }
          try {
            if (typeof BroadcastChannel !== 'undefined') {
              const bc = new BroadcastChannel('gv_auth_sync');
              bc.postMessage({ type: 'SIGN_IN_SUCCESS', user: state.currentUser });
            }
            localStorage.setItem('gv_auth_signal', String(Date.now()));
          } catch (e) {}

          // Если ссылка открыта как дочерняя вкладка или окно, возвращаем фокус на главную и закрываем дубликат
          if (window.opener && !window.opener.closed) {
            try { window.opener.focus(); } catch (e) {}
            setTimeout(() => {
              try { window.close(); } catch (e) {}
            }, 800);
          } else {
            // Вкладка открыта независимо (из почтового клиента или веб-интерфейса почты)
            if (typeof gvToast === 'function') {
              gvToast('Вы успешно вошли как ' + state.currentUser.username + '! Можете закрыть эту вкладку или продолжить пользоваться сайтом здесь.');
            }
            if (typeof showView === 'function') {
              showView('home', {}, false);
            }
          }
        } catch (e) {
          showAuthModal('link');
          setAuthError(authErrorText(e));
        }
        // Убираем служебные параметры Firebase из адресной строки и фиксируем чистый URL
        const cleanPath = location.pathname.replace(/\/$/, '') || '/';
        history.replaceState({ view: 'home', params: {}, scrollY: 0 }, '', cleanPath);
      }
    } catch (e) {
      console.error('Firebase не загрузился:', e);
    }
  }
})();
