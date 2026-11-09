// Демо-отзывы и обзоры игроков (Steam, Epic Games Store, Playground.ru)
// Генерируются детерминированно на основе ID игры для живой атмосферы на странице игры.

// Простой генератор псевдослучайных чисел (mulberry32): одно и то же зерно -> одна и та же последовательность
function seededRandom(seed) {
  let a = seed >>> 0;
  return function () {
    a = (a + 0x6D2B79F5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Пул реальных геймеров и рецензентов с популярных площадок
const REVIEW_AUTHORS = [
  // Steam сообщество
  { user: 'CyberViking_99', source: 'steam', hours: '142 ч. в игре', avatar: 'C', avatarBg: 'from-blue-600 to-cyan-600' },
  { user: 'Artorias_Cinder', source: 'steam', hours: '215 ч. в игре', avatar: 'A', avatarBg: 'from-amber-600 to-red-600' },
  { user: 'PixelWanderer', source: 'steam', hours: '68 ч. в игре', avatar: 'P', avatarBg: 'from-emerald-600 to-teal-600' },
  { user: 'Geralt_Of_Rivia_RU', source: 'steam', hours: '340 ч. в игре', avatar: 'G', avatarBg: 'from-stone-600 to-zinc-700' },
  { user: 'Sova_Sniper', source: 'steam', hours: '84 ч. в игре', avatar: 'S', avatarBg: 'from-blue-500 to-indigo-600' },
  { user: 'Cheburek_Destroyer', source: 'steam', hours: '51 ч. в игре', avatar: 'C', avatarBg: 'from-orange-600 to-amber-600' },
  { user: 'NightCity_Phantom', source: 'steam', hours: '128 ч. в игре', avatar: 'N', avatarBg: 'from-purple-600 to-pink-600' },
  { user: 'NeonSamurai_X', source: 'steam', hours: '190 ч. в игре', avatar: 'N', avatarBg: 'from-fuchsia-600 to-purple-600' },

  // Playground.ru
  { user: 'Vanya_Playground', source: 'playground', hours: 'Эксперт PG (400+ рец.)', avatar: 'V', avatarBg: 'from-red-600 to-rose-700' },
  { user: 'Mrakoborets_Old', source: 'playground', hours: 'Олдфаг Playground', avatar: 'M', avatarBg: 'from-slate-700 to-zinc-800' },
  { user: 'Dmitry_Gamer_PG', source: 'playground', hours: 'Рецензент PG', avatar: 'D', avatarBg: 'from-red-700 to-amber-700' },
  { user: 'Stalker_Zaton', source: 'playground', hours: 'Ветеран форума', avatar: 'S', avatarBg: 'from-green-700 to-emerald-900' },
  { user: 'HardcoreFanatic', source: 'playground', hours: 'PG Критик', avatar: 'H', avatarBg: 'from-red-800 to-zinc-900' },
  { user: 'OldSchool_Gamer', source: 'playground', hours: 'Модератор PG', avatar: 'O', avatarBg: 'from-yellow-700 to-stone-800' },

  // Epic Games Store
  { user: 'Alex_Frostbite', source: 'epic', hours: 'Проверено EGS • 78 ч.', avatar: 'A', avatarBg: 'from-zinc-700 to-neutral-900' },
  { user: 'BioHazard_23', source: 'epic', hours: 'Куплено в EGS • 54 ч.', avatar: 'B', avatarBg: 'from-violet-700 to-indigo-900' },
  { user: 'Kira_V', source: 'epic', hours: 'Проверено EGS • 92 ч.', avatar: 'K', avatarBg: 'from-rose-600 to-pink-700' },
  { user: 'ShadowHunter_EGS', source: 'epic', hours: 'Куплено в EGS • 115 ч.', avatar: 'S', avatarBg: 'from-cyan-700 to-blue-800' },
  { user: 'ProstoDen4ik', source: 'epic', hours: 'Проверено EGS • 41 ч.', avatar: 'P', avatarBg: 'from-teal-600 to-emerald-800' }
];

// Живые шаблоны отзывов со спецификой платформ
// {t} - название игры, {g} - жанр, {y} - год релиза
const DEMO_TEMPLATES = {
  exceptional: [
    {
      source: 'steam',
      title: 'Зашёл на 15 минут проверить оптимизацию — наиграл 120 часов',
      body: 'Купил {t} по скидке на распродаже в Steam. Думал побегаю часик перед сном... В итоге очнулся в 5 утра с красными глазами, напрочь забыв про сон и дела. Графика потрясающая, музыка пробирает до мурашек, а боевая система и мир в жанре «{g}» вылизаны до блеска. 10/10, один из лучших проектов за последние годы.',
      pros: 'Атмосфера, саундтрек, затягивает намертво',
      cons: 'Кот не кормлен, режим сна уничтожен'
    },
    {
      source: 'playground',
      title: 'Развёрнутый разбор: эталонная работа над деталями и атмосферой',
      body: 'С технической и художественной точки зрения {t} — монументальный проект. Левел-дизайн и работа со светом создают невероятное погружение. Сюжет держит планку от пролога до финальных титров, а внимание к мелочам поражает воображение. Для жанра «{g}» это безоговорочная планка качества, на которую стоит равняться всей индустрии.',
      pros: 'Режиссура, детализация окружения, глубина механик',
      cons: 'Пара незначительных шероховатостей на старте'
    },
    {
      source: 'epic',
      title: 'Прошёл на одном дыхании на геймпаде в 4K',
      body: 'Забрал в EGS и прошёл за пару недель на геймпаде перед большим экраном. Потрясающая кинематографичность, плавная анимация и великолепная оптимизация. {t} отрабатывает каждый вложенный рубль, ни секунды духоты. Браво разработчикам!',
      pros: 'Кинематографичность, стабильный FPS, отзывчивое управление',
      cons: 'История закончилась слишком быстро, хочется добавки'
    },
    {
      source: 'steam',
      title: 'Шедевр, аналогов которому единицы',
      body: 'Долго откладывал прохождение {t}, думал что оценки завышены хайпом. Как же я ошибался! Игра дарит редкое сегодня ощущение настоящего первооткрывательского приключения. Ты исследуешь этот мир не ради галочек в чек-листе, а потому что искренне интересно, что спрятано за следующим поворотом.',
      pros: 'Живой мир, постановка квестов, визуальный стиль',
      cons: 'Хочется стереть себе память и пройти заново'
    },
    {
      source: 'playground',
      title: 'Игра, которая возвращает искреннюю любовь к видеоиграм',
      body: 'После засилья однотипных сервисных поделок {t} ощущается как глоток свежего горного воздуха. Видно, что проект делали талантливые люди с душой, а не маркетологи по сухим таблицам Excel. Качественный саундтрек, яркие персонажи и выверенный геймплейный баланс.',
      pros: 'Душевность, баланс, отличный сюжет',
      cons: 'Требует хорошей видеокарты для ультра-настроек'
    },
    {
      source: 'steam',
      title: 'Саундтрек сразу улетел в личный плейлист',
      body: 'Тот редкий случай, когда финальные титры смотришь стоя. В {t} потрясающая химия между персонажами и геймплейная петля, от которой просто физически тяжело оторваться. Обязательно к прохождению всем ценителям хороших игр.',
      pros: 'Саундтрек года, проработка мира, мощный финал',
      cons: 'Трудно найти что-то сопоставимое после неё'
    }
  ],
  recommended: [
    {
      source: 'steam',
      title: 'Крепкая игра на свои деньги, фанатам зайдёт на ура',
      body: 'Провёл в {t} больше 40 часов. Есть спорные геймдизайнерские решения и небольшие просадки темпа в середине, но плюсы однозначно перевешивают. Если вам близок жанр «{g}», брать на распродаже точно стоит.',
      pros: 'Увлекательный геймплей, приятный визуал',
      cons: 'Местами ощущается самоповтор второстепенных активностей'
    },
    {
      source: 'playground',
      title: 'Добротный представитель жанра с парочкой шероховатостей',
      body: 'В сухом остатке {t} — хорошая, ладно скроенная игра. Базовая механика работает как часы, атмосфера выдержана отлично. Разработчикам немного не хватило смелости в полировке эндгейма, но удовольствие от прохождения гарантировано.',
      pros: 'Грамотный темп, звук, дизайн локаций',
      cons: 'ИИ противников звёзд с неба не хватает'
    },
    {
      source: 'epic',
      title: 'Отличный проект для вечернего отдыха после работы',
      body: 'Приятно сесть вечером после работы на диван и залипнуть в {t}. Игра не перегружает лишней духотой, даёт хороший челлендж и стабильно держит высокую кадровую частоту. Рекомендую к покупке.',
      pros: 'Легко втянуться, приятный темп, оптимизация',
      cons: 'Хотелось бы чуть больше разнообразия билдов и экипировки'
    },
    {
      source: 'steam',
      title: 'Патчи пошли проекту исключительно на пользу',
      body: 'На релизе в {y} году были технические вопросы, но сейчас {t} довели до ума. Прошёл с большим удовольствием. Не шедевр на века, но очень крепкий и честный проект, который честно уважает время игрока.',
      pros: 'Исправленная оптимизация, бодрый экшен',
      cons: 'Сюжетные твисты местами предсказуемы'
    },
    {
      source: 'playground',
      title: 'Крепкий середняк, который приятно удивил',
      body: 'Ожидал от {t} гораздо меньшего на фоне скептических комментариев, а в итоге залип на пару недель. Есть своя изюминка, отличные второстепенные задания и классная атмосфера. Советую дать игре шанс.',
      pros: 'Атмосфера, побочные квесты, физика',
      cons: 'Лицевые анимации в некоторых диалогах простоваты'
    }
  ],
  meh: [
    {
      source: 'playground',
      title: 'Потенциал был огромный, но реализация подвела',
      body: 'В {t} чувствуются отличные задумки на бумаге, но реализация подкачала. Первые часов 5 интересно, а потом игра начинает ходить по кругу одних и тех же механик. В жанре «{g}» есть проекты куда выразительнее и богаче на контент.',
      pros: 'Красивые пейзажи, неплохая задумка',
      cons: 'Однообразие, провисание сценария ближе к финалу'
    },
    {
      source: 'steam',
      title: 'Играбельно, но строго по жирной скидке',
      body: 'Купил {t} на распродаже. Не могу сказать, что всё плохо, но вау-эффекта нет совершенно. Постоянный гринд и бэктрекинг быстро утомляют. Пройти можно, но перепроходить точно не потянет.',
      pros: 'Приятная стилистика, неплохой звук',
      cons: 'Душный бэктрекинг, слабый баланс сложности'
    },
    {
      source: 'epic',
      title: 'Смешанные чувства после прохождения',
      body: 'Графика в {t} действительно радует глаз, но геймплейно игре катастрофически не хватает глубины. Всё слишком упрощено. Проект на один раз исключительно для галочки.',
      pros: 'Графика и визуальные спецэффекты',
      cons: 'Поверхностные механики, слабое ощущение прогресса'
    }
  ],
  skip: [
    {
      source: 'steam',
      title: 'Оформил возврат средств через 1.8 часа игры',
      body: 'К сожалению, {t} не спасают даже патчи. Ужасная оптимизация, деревянное управление и бесконечные баги с физикой. Разработчики выпустили откровенно сырой продукт. Не рекомендую тратить время и нервы.',
      pros: 'Красивый вступительный ролик',
      cons: 'Ужасная производительность, баги, скучный игровой процесс'
    },
    {
      source: 'playground',
      title: 'Главное разочарование года: обещали золотые горы',
      body: 'Сколько было красивых обещаний в дневниках разработчиков... В итоге на релизе {t} оказалась бледной тенью собственных трейлеров. Сюжет дырявый, оптимизации нет, механики работают криво. Проходите мимо.',
      pros: 'Нашлась пара атмосферных эмбиент-треков',
      cons: 'Сломанный баланс, вылеты, обман ожиданий аудитории'
    }
  ]
};

// Теги рецензий
const DEMO_TAGS = {
  exceptional: ['ЭТО ПОТРЯСЛО МЕНЯ', 'НЕ МОГУ ПЕРЕСТАТЬ ИГРАТЬ', 'ПРОВЕРЕННЫЙ ВРЕМЕНЕМ', 'ШЕДЕВР'],
  recommended: ['СТОИТ ПОПРОБОВАТЬ', 'ХОРОШО НА ВЕЧЕР', 'ДОБРОТНЫЙ ПРОЕКТ'],
  meh: ['НА ЛЮБИТЕЛЯ', 'ТОЛЬКО ПО СКИДКЕ'],
  skip: ['ПРОПУСТИТЬ', 'СЫРОЙ ПРОДУКТ']
};

// Реалистичные даты отзывов
const DEMO_DATES = [
  '14.10.2024', '03.08.2024', '22.05.2024', '18.03.2024',
  '29.11.2023', '15.09.2023', '07.07.2023', '24.04.2023',
  '12.01.2025', '04.02.2025', '19.12.2024', '08.06.2024'
];

// Выбираем группу шаблонов по рейтингу игры
function demoTone(rating) {
  if (rating >= 8.2) return 'exceptional';
  if (rating >= 6.8) return 'recommended';
  if (rating >= 5.0) return 'meh';
  return 'skip';
}

// Создаём список отзывов игроков для одной игры
function makeDemoReviews(game) {
  const rand = seededRandom(game.id);
  const tone = demoTone(game.rating);
  const templates = DEMO_TEMPLATES[tone].slice();

  // Перемешиваем шаблоны
  for (let i = templates.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [templates[i], templates[j]] = [templates[j], templates[i]];
  }

  // Перемешиваем авторов для разнообразия площадок (Steam, PG, Epic)
  const authors = REVIEW_AUTHORS.slice();
  for (let i = authors.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [authors[i], authors[j]] = [authors[j], authors[i]];
  }

  // От 3 до 5 отзывов
  const count = Math.min(templates.length, 3 + Math.floor(rand() * 3));
  const genre = (game.genres && game.genres[0]) ? game.genres[0].toLowerCase() : 'игры';
  const year = game.year || 2023;
  const list = [];

  for (let i = 0; i < count; i++) {
    const tpl = templates[i];
    const author = authors[i % authors.length];

    // Подставляем переменные игры
    const fill = text => text.replace(/\{t\}/g, game.title).replace(/\{g\}/g, genre).replace(/\{y\}/g, String(year));

    // Оценка около рейтинга игры
    let score = Math.round(game.rating + (rand() * 1.6 - 0.8));
    score = Math.max(1, Math.min(10, score));

    // Случайная дата из пула
    const dateIdx = Math.floor(rand() * DEMO_DATES.length);
    const dateStr = DEMO_DATES[dateIdx];

    // Теги
    const tagPool = DEMO_TAGS[tone];
    const tagCount = Math.min(tagPool.length, Math.floor(rand() * 2) + 1);
    const selectedTags = tagPool.slice(0, tagCount);

    // Лайки в духе Steam / Playground
    const likes = 15 + Math.floor(rand() * 180);
    const dislikes = Math.floor(rand() * 12);

    list.push({
      id: game.id * 10 + i + 1000000000,
      demo: true,
      user: author.user,
      source: tpl.source || author.source,
      hours: author.hours,
      avatar: author.avatar,
      avatarBg: author.avatarBg,
      score: score,
      title: fill(tpl.title),
      body: fill(tpl.body),
      tags: selectedTags,
      rating: tone,
      pros: fill(tpl.pros),
      cons: fill(tpl.cons),
      likes: likes,
      dislikes: dislikes,
      date: dateStr,
      helpful: false
    });
  }
  return list;
}

// Уже обработанные игры, чтобы не генерировать отзывы повторно
const demoDone = {};

// Возвращает все отзывы игры: настоящие (написанные пользователем) и демо.
function getReviews(game) {
  if (!demoDone[game.id]) {
    demoDone[game.id] = true;
    const isRel = typeof isGameReleased === 'function' ? isGameReleased(game) : (game.status === 'released');
    if (isRel) {
      REVIEWS[game.id] = (REVIEWS[game.id] || []).concat(makeDemoReviews(game));
    }
  }
  return REVIEWS[game.id] || [];
}
