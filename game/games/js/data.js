// ============ ДАННЫЕ ============
const GENRES = [
  { id: 'action', name: 'Экшен', icon: 'fa-gun', description: 'Динамичные игры с боями и сражениями', color: 'from-red-600 to-orange-600' },
  { id: 'rpg', name: 'RPG', icon: 'fa-dragon', description: 'Ролевые игры с прокачкой персонажа', color: 'from-purple-600 to-pink-600' },
  { id: 'adventure', name: 'Приключения', icon: 'fa-compass', description: 'Исследование миров и решение головоломок', color: 'from-emerald-600 to-teal-600' },
  { id: 'shooter', name: 'Шутер', icon: 'fa-crosshairs', description: 'Стрелялки от первого и третьего лица', color: 'from-blue-600 to-cyan-600' },
  { id: 'strategy', name: 'Стратегия', icon: 'fa-chess', description: 'Тактические и стратегические игры', color: 'from-amber-600 to-yellow-600' },
  { id: 'puzzle', name: 'Головоломка', icon: 'fa-puzzle-piece', description: 'Логические игры и головоломки', color: 'from-pink-600 to-rose-600' },
  { id: 'racing', name: 'Гонки', icon: 'fa-car', description: 'Гоночные симуляторы и аркады', color: 'from-orange-600 to-red-600' },
  { id: 'sport', name: 'Спорт', icon: 'fa-futbol', description: 'Спортивные симуляторы', color: 'from-green-600 to-emerald-600' }
];

const PLATFORMS = [
  { id: 'pc', name: 'PC', icon: 'fa-desktop', description: 'Игры для персональных компьютеров', color: 'from-blue-600 to-indigo-600' },
  { id: 'ps5', name: 'PlayStation 5', icon: 'fa-playstation', description: 'Эксклюзивы и мультиплатформенные игры для PS5', color: 'from-indigo-600 to-purple-600' },
  { id: 'xbox', name: 'Xbox Series X/S', icon: 'fa-xbox', description: 'Игры для консолей Xbox', color: 'from-green-600 to-emerald-600' },
  { id: 'switch', name: 'Nintendo Switch', icon: 'fa-gamepad', description: 'Портативные и домашние игры', color: 'from-red-600 to-pink-600' },
  { id: 'mobile', name: 'Mobile', icon: 'fa-mobile-screen', description: 'Игры для iOS и Android', color: 'from-purple-600 to-violet-600' }
];

const REVIEWS = {
  1: [
    { id: 1, user: 'NightCityRunner', avatar: 'Н', score: 9, title: 'После патчей — шедевр', body: 'Прошёл всю игру на ультрах после обновления 2.0. Сюжет, атмосфера, музыка — всё на высшем уровне.', tags: ['ЭТО ПОТРЯСЛО МЕНЯ', 'САУНДТРЕК НА ПОВТОРЕ'], rating: 'exceptional', pros: 'Сюжет, графика, музыка', cons: 'ИИ всё ещё хромает', likes: 234, dislikes: 12, date: '15.03.2024', helpful: true }
  ],
  2: [
    { id: 2, user: 'SoulsBorne', avatar: 'С', score: 10, title: 'Миядзаки снова гений', body: 'Elden Ring — это эволюция формулы Dark Souls. Открытый мир не портит опыт, а дополняет его.', tags: ['НЕ МОГУ ПЕРЕСТАТЬ ИГРАТЬ', 'ПРОВЕРЕННЫЙ ВРЕМЕНЕМ'], rating: 'exceptional', pros: 'Дизайн мира, боссы, свобода', cons: 'Оптимизация на PC', likes: 892, dislikes: 34, date: '28.02.2022', helpful: true }
  ]
};
