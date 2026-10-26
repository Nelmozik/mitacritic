// Распределение оценок для страницы игры.
// В данных RAWG, которые мы выгрузили, есть только средняя оценка игры (rating),
// а сколько человек поставили 10, 9, 8 и т.д. - нет. Поэтому распределение считаем сами:
// подбираем такие проценты по оценкам от 1 до 10, чтобы их среднее значение
// совпало со средней оценкой игры. То есть цифры приблизительные, а не точные.

// Возвращает объект вида { 10: 35, 9: 28, ... , 1: 0 }, где значения - проценты (в сумме 100).
// Для игры без оценок возвращает null.
function ratingDistribution(rating) {
  if (!rating || rating <= 0) return null;

  // оценка не может быть меньше 1 и больше 10
  const target = Math.max(1, Math.min(10, rating));
  const sigma = 1.7; // насколько «размазаны» оценки вокруг среднего

  // веса оценок 1..10 для «центра» mu: чем ближе оценка к центру, тем больше вес
  function weights(mu) {
    const w = [];
    for (let k = 1; k <= 10; k++) {
      w.push(Math.exp(-Math.pow(k - mu, 2) / (2 * sigma * sigma)));
    }
    return w;
  }

  // среднее значение оценки при данном центре
  function meanFor(mu) {
    const w = weights(mu);
    let sum = 0;
    let total = 0;
    for (let k = 1; k <= 10; k++) {
      sum += k * w[k - 1];
      total += w[k - 1];
    }
    return sum / total;
  }

  // ищем центр методом деления пополам (бинарный поиск), чтобы среднее стало равно target
  let low = -5;
  let high = 16;
  for (let i = 0; i < 60; i++) {
    const mid = (low + high) / 2;
    if (meanFor(mid) < target) low = mid;
    else high = mid;
  }

  // переводим веса в проценты
  const w = weights((low + high) / 2);
  const total = w.reduce((a, b) => a + b, 0);
  const exact = w.map(x => (x / total) * 100);

  // округляем до целых так, чтобы сумма была ровно 100
  const result = exact.map(x => Math.floor(x));
  let left = 100 - result.reduce((a, b) => a + b, 0);
  const order = exact
    .map((x, i) => ({ i: i, frac: x - Math.floor(x) }))
    .sort((a, b) => b.frac - a.frac);
  for (let n = 0; n < left; n++) result[order[n].i]++;

  // складываем в объект: ключ - оценка, значение - процент
  const dist = {};
  for (let k = 1; k <= 10; k++) dist[k] = result[k - 1];
  return dist;
}
