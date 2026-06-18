const WEATHER_PHRASES = [
  ['Rain With Thunderstorm', '雷阵雨'],
  ['Light Rain Shower', '小阵雨'],
  ['Heavy Rain Shower', '大阵雨'],
  ['Rain Shower', '阵雨'],
  ['Light Rain', '小雨'],
  ['Heavy Rain', '大雨'],
  ['Moderate Rain', '中雨'],
  ['Partly Cloudy', '局部多云'],
  ['Mostly Cloudy', '大部多云'],
  ['Overcast', '阴天'],
  ['Clear', '晴'],
  ['Sunny', '晴'],
  ['Cloudy', '多云'],
  ['Fog', '雾'],
  ['Mist', '薄雾'],
  ['Haze', '霾'],
  ['Snow', '雪'],
  ['Light Snow', '小雪'],
  ['Heavy Snow', '大雪'],
  ['Thunderstorm', '雷暴'],
  ['Drizzle', '毛毛雨'],
];

/**
 * 将 wttr.in 等接口返回的英文天气描述转为中文。
 */
export function translateWeatherDesc(desc) {
  if (!desc) return '';
  const text = String(desc).trim();
  if (/[\u4e00-\u9fff]/.test(text)) {
    return text.replace(/\s*,\s*/g, '、');
  }

  let translated = text;
  WEATHER_PHRASES.forEach(([en, zh]) => {
    translated = translated.replace(new RegExp(en, 'gi'), zh);
  });

  const parts = translated
    .split(',')
    .map((part) => part.trim())
    .filter(Boolean);

  const unique = [];
  parts.forEach((part) => {
    if (!unique.includes(part)) unique.push(part);
  });

  return unique.join('、');
}

export function isChineseWeatherDesc(desc) {
  return /[\u4e00-\u9fff]/.test(String(desc || ''));
}
