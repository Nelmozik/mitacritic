// База данных игровых новостей (GameVerse News)
// Содержит актуальные новости, анонсы, отчеты разработчиков и обновления с привязкой к каталогу игр

const NEWS_DATA = [
  {
    id: 'gta-6-fall-2025-details',
    title: 'Take-Two подтвердила окно релиза GTA VI: осень 2025 года и новые детали масштаба Вайс-Сити',
    category: 'announcements',
    categoryLabel: 'Анонс',
    categoryBadgeBg: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
    date: '8 ноября 2024',
    readTime: '4 мин',
    views: 8940,
    likes: 1250,
    gameId: 972995,
    featured: true,
    cover: 'https://media.rawg.io/media/screenshots/598/5983ffe274a237b33e0f0452364fba78.jpg',
    source: 'Take-Two Interactive / Rockstar Games',
    summary: 'Генеральный директор Take-Two Штраусс Зельник в квартальном отчёте подтвердил, что разработка Grand Theft Auto VI идёт строго по графику, а команда нацелена на революцию в жанре открытого мира.',
    content: `
      <p class="text-lg leading-relaxed text-zinc-300 mb-6">
        В рамках финансового отчёта издательства Take-Two Interactive глава компании Штраусс Зельник окончательно развеял слухи о возможном переносе релиза самой ожидаемой игры десятилетия. 
        <strong class="text-white">Grand Theft Auto VI</strong> выйдет на PlayStation 5 и Xbox Series X|S <strong>осенью 2025 года</strong>.
      </p>

      <blockquote class="border-l-4 border-amber-500 pl-4 py-2 my-6 bg-zinc-900/60 rounded-r-xl text-zinc-200 italic font-medium">
        «Rockstar Games продолжает оттачивать проект, чтобы создать непревзойденный уровень интерактивности и детализации. Мы уверены, что новая часть GTA установит совершенно новые творческие стандарты для всей индустрии развлечений».
        <span class="block text-xs text-zinc-400 not-italic mt-2">— Штраусс Зельник, CEO Take-Two</span>
      </blockquote>

      <h3 class="text-xl font-bold text-white mb-3 mt-8">Что известно о технологиях и масштабе:</h3>
      <ul class="list-disc list-inside space-y-2 text-zinc-300 mb-6 leading-relaxed">
        <li><strong>Эволюция физики воды и транспорта:</strong> Новая версия движка RAGE получила глубокую симуляцию океанских волн, аэродинамики лодок и физики суперкаров.</li>
        <li><strong>Плотность симуляции жизни:</strong> ИИ неигровых персонажей в Леониде и Вайс-Сити реагирует на погоду, действия дуэта главных героев Лусии и Джейсона и события в социальных сетях внутри игры.</li>
        <li><strong>Интерьеры зданий:</strong> Доля доступных для посещения помещений вырастет в разы по сравнению с GTA V.</li>
      </ul>

      <p class="text-zinc-300 leading-relaxed">
        Второй полноценный трейлер Rockstar планирует представить в ближайшие месяцы. Аналитики сходятся во мнении, что игра способна принести рекордный доход уже за первые 24 часа с момента запуска.
      </p>
    `
  },
  {
    id: 'monster-hunter-wilds-beta-record',
    title: 'Открытая бета Monster Hunter Wilds собрала свыше 460 000 одновременных игроков в Steam',
    category: 'updates',
    categoryLabel: 'Обновление',
    categoryBadgeBg: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
    date: '7 ноября 2024',
    readTime: '3 мин',
    views: 4520,
    likes: 620,
    gameId: 973391,
    featured: false,
    cover: 'https://media.rawg.io/media/screenshots/ec9/ec90763ad76a7cd2e5ab9eefb418af60.jpg',
    source: 'Capcom Community Update',
    summary: 'Тестирование долгожданного экшена от Capcom побило рекорды франшизы. Разработчики поблагодарили фанатов и рассказали об оптимизации к релизу 28 февраля 2025 года.',
    content: `
      <p class="text-lg leading-relaxed text-zinc-300 mb-6">
        Открытый бета-тест <strong>Monster Hunter Wilds</strong> произвёл настоящий фурор на ПК и консолях. Только на платформе Steam пиковый онлайн превысил <strong>463 тысячи охотников</strong>, сделав бету одним из самых громких сетевых событий года.
      </p>

      <h3 class="text-xl font-bold text-white mb-3 mt-8">Главные отзывы и улучшения к релизу:</h3>
      <p class="text-zinc-300 leading-relaxed mb-4">
        Продюсер серии Рёдзо Цудзимото отметил, что команда получила колоссальный объем телеметрии и уже работает над ключевыми замечаниями сообщества:
      </p>
      <ul class="list-disc list-inside space-y-2 text-zinc-300 mb-6 leading-relaxed">
        <li><strong>Оптимизация производительности:</strong> Бета-билд базировался на промежуточной версии. Финальный релиз получит улучшенный компилятор шейдеров и стабилизацию генерации кадров DLSS 3 / FSR 3.</li>
        <li><strong>Бесшовные биомы:</strong> Игроки высоко оценили динамическую смену климата — от песчаных бурь до сезона цветения.</li>
        <li><strong>Смена оружия на лету:</strong> Система ношения второго оружия в седельной сумке ездового питомца Сейкрета признана одним из лучших нововведений в серии.</li>
      </ul>
      <p class="text-zinc-300 leading-relaxed">
        Полный релиз состоится 28 февраля 2025 года одновременно на PC, PlayStation 5 и Xbox Series.
      </p>
    `
  },
  {
    id: 'kingdom-come-2-gameplay-crafting',
    title: 'Kingdom Come: Deliverance II показала 25 минут живого геймплея: Кутна-Гора, ковка мечей и арбалеты',
    category: 'releases',
    categoryLabel: 'Релиз',
    categoryBadgeBg: 'bg-violet-500/20 text-violet-300 border-violet-500/30',
    date: '6 ноября 2024',
    readTime: '5 мин',
    views: 6180,
    likes: 914,
    gameId: 980502,
    featured: false,
    cover: 'https://media.rawg.io/media/screenshots/9a8/9a8ecc33989862e3be29132189c3f7f6.jpg',
    source: 'Warhorse Studios',
    summary: 'Даниэль Вавра и студия Warhorse провели подробную презентацию средневековой RPG. Игроков ждёт город Кутна-Гора в натуральную величину, реалистичное огнестрельное оружие и нелинейные квесты.',
    content: `
      <p class="text-lg leading-relaxed text-zinc-300 mb-6">
        Студия Warhorse представила масштабную демонстрацию игрового процесса <strong>Kingdom Come: Deliverance II</strong>. Продолжение истории Индржиха из Скалицы станет значительно более кинематографичным, сохранив бескомпромиссный исторический реализм Богемии XV века.
      </p>

      <h3 class="text-xl font-bold text-white mb-3 mt-8">Ключевые особенности продолжения:</h3>
      <ul class="list-disc list-inside space-y-2 text-zinc-300 mb-6 leading-relaxed">
        <li><strong>Город серебряных рудников:</strong> Средневековая Кутна-Гора поражает размахом — сотни ремесленников, таверны, патрули городской стражи и политические интриги.</li>
        <li><strong>Новое оружие:</strong> В игре появились арбалеты и раннее пороховое оружие (ручницы), способное пробивать тяжелые латы с близкой дистанции.</li>
        <li><strong>Интерактивная кузница:</strong> Индржих сможет сам ковать уникальные клинки, контролируя нагрев стали и удары молотом в мини-игре.</li>
      </ul>

      <p class="text-zinc-300 leading-relaxed">
        Игра выходит <strong>11 февраля 2025 года</strong> с полной русской текстовой локализацией.
      </p>
    `
  },
  {
    id: 'witcher-4-polaris-full-production',
    title: 'The Witcher 4 (Project Polaris) вошла в фазу полномасштабного производства в Unreal Engine 5',
    category: 'announcements',
    categoryLabel: 'Анонс',
    categoryBadgeBg: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
    date: '5 ноября 2024',
    readTime: '3 мин',
    views: 7420,
    likes: 1105,
    gameId: 3328,
    featured: false,
    cover: 'https://media.rawg.io/media/screenshots/1ac/1ac19f31974314855ad7be266adeb500.jpg',
    source: 'CD Projekt RED',
    summary: 'Команда разработчиков следующей трилогии о Ведьмаке завершила подготовительный этап. В производстве занято свыше 400 ведущих специалистов польской студии.',
    content: `
      <p class="text-lg leading-relaxed text-zinc-300 mb-6">
        Компания <strong>CD Projekt RED</strong> объявила об успешном завершении предварительной подготовки проекта <em>Polaris</em> — первой главы новой ведьмачьей саги. Проект официально перешел в фазу активного полномасштабного продакшна.
      </p>

      <p class="text-zinc-300 leading-relaxed mb-4">
        Сотрудничество с Epic Games по глубокой кастомизации движка Unreal Engine 5 позволило адаптировать технологии Nanite и Lumen под огромные открытые пространства ведьмачьего мира без просадок кадровой частоты.
      </p>

      <blockquote class="border-l-4 border-violet-500 pl-4 py-2 my-6 bg-zinc-900/60 rounded-r-xl text-zinc-200 italic font-medium">
        «Мы стремимся подарить игрокам свободу ролевого отыгрыша и эмоциональный накал, превосходящий Дикую Охоту, сохраняя при этом взрослую славянскую и европейскую мифологию».
      </blockquote>

      <p class="text-zinc-300 leading-relaxed">
        По оценкам руководства, активная фаза разработки займёт около трёх лет.
      </p>
    `
  },
  {
    id: 'cyberpunk-2077-anniversary-modding',
    title: 'CD Projekt RED выпустила расширенный набор инструментов REDmod для Cyberpunk 2077',
    category: 'updates',
    categoryLabel: 'Обновление',
    categoryBadgeBg: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
    date: '4 ноября 2024',
    readTime: '2 мин',
    views: 3890,
    likes: 540,
    gameId: 41494,
    featured: false,
    cover: 'https://media.rawg.io/media/screenshots/814/814c25d6fd1fd34a4e6dade645a3bda7.jpg',
    source: 'Cyberpunk.net Community',
    summary: 'Авторы игры открыли мододелам доступ к анимациям, кастомным квестам и звуковым дорожкам Найт-Сити, дав сообществу неограниченный простор для творчества.',
    content: `
      <p class="text-lg leading-relaxed text-zinc-300 mb-6">
        Несмотря на завершение разработки контентных обновлений для <strong>Cyberpunk 2077</strong> после триумфального релиза дополнения Phantom Liberty, разработчики продолжают поддерживать творческое сообщество.
      </p>
      <p class="text-zinc-300 leading-relaxed mb-4">
        Новая версия REDmod позволяет интегрировать пользовательские диалоговые ветки, создавать авторские интерьеры в ранее запертых небоскребах и тонко настраивать поведение дорожного трафика.
      </p>
      <p class="text-zinc-300 leading-relaxed">
        Благодаря фанатским модификациям Найт-Сити уже обрел полноценное метро от третьего лица, систему летных автомобилей и переработанную механику киберимплантов.
      </p>
    `
  },
  {
    id: 'spider-man-2-pc-announcement',
    title: 'Marvel’s Spider-Man 2 выходит на ПК 30 января 2025 года: поддержка ультрашироких экранов и трассировки лучей',
    category: 'releases',
    categoryLabel: 'Релиз',
    categoryBadgeBg: 'bg-violet-500/20 text-violet-300 border-violet-500/30',
    date: '3 ноября 2024',
    readTime: '3 мин',
    views: 5740,
    likes: 830,
    gameId: 662316,
    featured: false,
    cover: 'https://media.rawg.io/media/screenshots/89b/89b077deb2a3ce38e071fdb5caae69c0.jpg',
    source: 'PlayStation Blog & Nixxes Software',
    summary: 'Sony Interactive Entertainment и студия Nixxes официально анонсировали дату релиза приключений Питера Паркера и Майлза Моралеса в Steam и Epic Games Store.',
    content: `
      <p class="text-lg leading-relaxed text-zinc-300 mb-6">
        Порт культового экшена <strong>Marvel’s Spider-Man 2</strong> от Insomniac Games доверен признанным мастерам переноса с консолей — нидерландской студии Nixxes Software. Релиз на персональных компьютерах состоится <strong>30 января 2025 года</strong>.
      </p>

      <h3 class="text-xl font-bold text-white mb-3 mt-8">Особенности ПК-версии:</h3>
      <ul class="list-disc list-inside space-y-2 text-zinc-300 mb-6 leading-relaxed">
        <li>Полная поддержка ультрашироких мониторов (соотношения 21:9, 32:9 и конфигурации из трёх мониторов 48:9).</li>
        <li>Разблокированная частота кадров и передовые апскейлеры: NVIDIA DLSS 3.7, AMD FSR 3.1 и Intel XeSS.</li>
        <li>Улучшенная геометрия отражений и реалистичные тени на улицах Манхэттена и Бруклина при помощи Ray Tracing.</li>
        <li>Поддержка тактильной отдачи и адаптивных триггеров контроллера DualSense при проводном подключении.</li>
      </ul>
      <p class="text-zinc-300 leading-relaxed">
        В состав издания войдет весь вышедший дополнительный контент, включая режим «Новая игра+» и альтернативные костюмы супергероев.
      </p>
    `
  },
  {
    id: 'clair-obscur-expedition-33-preview',
    title: 'Clair Obscur: Expedition 33 — почему эта пошаговая французская RPG стала сенсацией года',
    category: 'announcements',
    categoryLabel: 'Анонс',
    categoryBadgeBg: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
    date: '2 ноября 2024',
    readTime: '4 мин',
    views: 4120,
    likes: 670,
    gameId: 983210,
    featured: false,
    cover: 'https://media.rawg.io/media/screenshots/1e4/1e4dcb884c03242be7dab30fad77d7b2.jpg',
    source: 'Sandfall Interactive Preview',
    summary: 'Дебютный проект инди-студии Sandfall совмещает эстетику Прекрасной эпохи Франции, кинематографичность Final Fantasy и реактивную механику парирования в пошаговых боях.',
    content: `
      <p class="text-lg leading-relaxed text-zinc-300 mb-6">
        Каждый год загадочная Художница просыпается и рисует на гигантском монолите проклятое число. Каждый человек этого возраста мгновенно обращается в прах. Завтра она нарисует число 33. Экспедиция 33 отправляется в свой последний поход, чтобы уничтожить Художницу и разорвать бесконечный цикл смерти.
      </p>
      <p class="text-zinc-300 leading-relaxed mb-4">
        <strong>Clair Obscur: Expedition 33</strong> поразила геймеров уникальным подходом к пошаговым битвам: во время вражеских атак игрок может в реальном времени уклоняться, парировать удары с идеальным таймингом и проводить стремительные контратаки.
      </p>
      <p class="text-zinc-300 leading-relaxed">
        Игра выходит весной 2025 года на PC, Xbox Series (включая каталог Game Pass) и PlayStation 5.
      </p>
    `
  },
  {
    id: 'silksong-age-rating-australia',
    title: 'Hollow Knight: Silksong получила официальные возрастные рейтинги в Австралии и Корее',
    category: 'industry',
    categoryLabel: 'Индустрия',
    categoryBadgeBg: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30',
    date: '1 ноября 2024',
    readTime: '3 мин',
    views: 9230,
    likes: 1840,
    gameId: 292844,
    featured: false,
    cover: 'https://media.rawg.io/media/screenshots/9f9/9f9a0edd1478facde5209abe4000c015.jpg',
    source: 'Australian Classification Board',
    summary: 'Регуляторы Австралии и Южной Кореи официально присвоили метроидвании возрастные сертификаты категории PG за «мягкое фэнтезийное насилие».',
    content: `
      <p class="text-lg leading-relaxed text-zinc-300 mb-6">
        Национальные рейтинговые комиссии Австралии и Южной Кореи опубликовали официальные возрастные карточки метроидвании <strong>Hollow Knight: Silksong</strong> с отметкой PG за «мягкое фэнтезийное насилие».
      </p>
      <p class="text-zinc-300 leading-relaxed mb-4">
        В официальных отчётах классификационных советов детально описаны возрастные параметры проекта от австралийской студии Team Cherry.
      </p>
      <p class="text-zinc-300 leading-relaxed">
        История принцессы-воительницы Хорнет в царстве Фарлум предлагает более 165 уникальных врагов, динамичный акробатический геймплей с шелковыми нитями и атмосферный саундтрек от композитора Кристофера Ларкина.
      </p>
    `
  }
];

// Управление состоянием лайков новостей в LocalStorage
function getNewsLikesState() {
  try {
    const uid = (typeof state !== 'undefined' && state.currentUser) ? state.currentUser.id : null;
    if (!uid) return {};
    return JSON.parse(localStorage.getItem(`gv_news_likes_${uid}`) || '{}');
  } catch (e) {
    return {};
  }
}

function hasLikedNews(newsId) {
  if (typeof state === 'undefined' || !state.currentUser) return false;
  const likes = getNewsLikesState();
  return !!likes[newsId];
}

function toggleLikeNews(newsId) {
  // Обязательная проверка авторизации: ставить лайки могут только вошедшие пользователи
  if (typeof state === 'undefined' || !state.currentUser) {
    if (typeof showAuthModal === 'function') showAuthModal();
    if (typeof gvToast === 'function') gvToast('Войдите в аккаунт, чтобы ставить лайки новостям');
    return false;
  }

  const uid = state.currentUser.id;
  const likes = getNewsLikesState();
  const current = !!likes[newsId];
  if (current) {
    delete likes[newsId];
    if (typeof gvToast === 'function') gvToast('Вы убрали отметку «Понравилось»');
  } else {
    likes[newsId] = true;
    if (typeof playSound === 'function') playSound('favorite');
  }
  try {
    localStorage.setItem(`gv_news_likes_${uid}`, JSON.stringify(likes));
  } catch (e) {}

  const item = NEWS_DATA.find(n => n.id === newsId);
  const total = item ? item.likes + (likes[newsId] ? 1 : 0) : 0;
  const totalStr = total.toLocaleString('ru-RU');

  // Обновляем все элементы счётчиков
  const countSelectors = [`#news-like-count-${newsId}`, `.news-like-count-${newsId}`];
  countSelectors.forEach(sel => {
    document.querySelectorAll(sel).forEach(el => {
      el.textContent = totalStr;
    });
  });

  // Обновляем все кнопки лайка для этой новости
  const btnSelectors = [`#news-like-btn-${newsId}`, `.news-like-btn-${newsId}`, `[data-news-like="${newsId}"]`];
  btnSelectors.forEach(sel => {
    document.querySelectorAll(sel).forEach(btn => {
      const icon = btn.querySelector('i');
      if (likes[newsId]) {
        btn.classList.remove('text-zinc-400', 'hover:text-rose-400');
        btn.classList.add('text-rose-500');
        if (icon) icon.className = 'fa-solid fa-heart text-rose-500 animate-scale-up';
      } else {
        btn.classList.remove('text-rose-500', 'border-rose-500/40', 'bg-rose-500/10');
        btn.classList.add('text-zinc-400', 'hover:text-rose-400');
        if (icon) icon.className = 'fa-regular fa-heart';
      }
    });
  });

  return !current;
}

window.NEWS_DATA = NEWS_DATA;
window.hasLikedNews = hasLikedNews;
window.toggleLikeNews = toggleLikeNews;
