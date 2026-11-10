// Статистика оценок
// Генерирует правдоподобное распределение оценок по средней оценке игры.
// Используется когда у игры нет реального поля distribution.
function ratingDistribution(avg) {
  if (!avg || avg <= 0) return null;

  // Центр распределения — округлённая средняя оценка
  const center = Math.round(avg);
  const dist = {};

  // Нормальное распределение вокруг центра
  for (let k = 1; k <= 10; k++) {
    const diff = Math.abs(k - center);
    // Чем дальше от центра — тем меньше оценок
    dist[k] = Math.max(1, Math.round(100 * Math.exp(-0.5 * diff * diff)));
  }

  // Нормализуем до 100%
  const total = Object.values(dist).reduce((a, b) => a + b, 0);
  for (const k in dist) {
    dist[k] = Math.round((dist[k] / total) * 100);
  }

  return dist;
}
