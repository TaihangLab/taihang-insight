const WMO_WEATHER_MAP = {
  0: '晴',
  1: '大部晴朗',
  2: '多云',
  3: '阴天',
  45: '雾',
  48: '雾凇',
  51: '小毛毛雨',
  53: '毛毛雨',
  55: '密毛毛雨',
  61: '小雨',
  63: '中雨',
  65: '大雨',
  71: '小雪',
  73: '中雪',
  75: '大雪',
  77: '雪粒',
  80: '小阵雨',
  81: '阵雨',
  82: '大阵雨',
  85: '小阵雪',
  86: '大阵雪',
  95: '雷暴',
  96: '雷暴伴冰雹',
  99: '强雷暴伴冰雹'
};

const EN_WEATHER_PHRASES = [
  ['Heavy Rain Shower', '大阵雨'],
  ['Thunderstorm In Vicinity', '附近有雷暴'],
  ['Thunderstorm in Vicinity', '附近有雷暴'],
  ['Rain Shower', '阵雨'],
  ['Heavy Rain', '大雨'],
  ['Light Rain', '小雨'],
  ['Moderate Rain', '中雨'],
  ['Patchy Rain Possible', '可能有阵雨'],
  ['Patchy rain possible', '可能有阵雨'],
  ['Partly Cloudy', '局部多云'],
  ['Partly cloudy', '局部多云'],
  ['Mostly Cloudy', '大部多云'],
  ['Overcast', '阴天'],
  ['Clear', '晴朗'],
  ['Sunny', '晴'],
  ['Cloudy', '多云'],
  ['Mist', '薄雾'],
  ['Fog', '雾'],
  ['Light Snow', '小雪'],
  ['Moderate Snow', '中雪'],
  ['Heavy Snow', '大雪'],
  ['Thunderstorm', '雷暴'],
  ['In Vicinity', '附近'],
  ['Nearby', '附近']
];

function translateWeatherDesc(desc) {
  if (!desc || typeof desc !== 'string') return '';
  const trimmed = desc.trim();
  if (!trimmed) return '';
  if (/[\u4e00-\u9fff]/.test(trimmed)) return trimmed;

  return trimmed
    .split(',')
    .map((part) => {
      let text = part.trim();
      EN_WEATHER_PHRASES.forEach(([en, zh]) => {
        const regex = new RegExp(en.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
        text = text.replace(regex, zh);
      });
      return text.trim();
    })
    .filter(Boolean)
    .join('，');
}

function getWttrWeatherDesc(cur) {
  if (!cur) return '';

  const zhDesc = cur.lang_zh && cur.lang_zh[0] && cur.lang_zh[0].value;
  if (zhDesc && /[\u4e00-\u9fff]/.test(zhDesc)) {
    return zhDesc.trim();
  }

  const enDesc = cur.weatherDesc && cur.weatherDesc[0] && cur.weatherDesc[0].value;
  return translateWeatherDesc(enDesc);
}

function formatWeatherText(desc, tempC) {
  const text = (desc || '').trim();
  const temp = tempC != null && tempC !== '' ? `${tempC}°C` : '';
  return [text, temp].filter(Boolean).join(' ');
}

function parseWttrCurrent(cur) {
  if (!cur) return null;
  const desc = getWttrWeatherDesc(cur);
  const tempC = cur.temp_C != null ? cur.temp_C : '--';
  const humidity = cur.humidity != null ? cur.humidity : '--';
  return {
    weather: formatWeatherText(desc, tempC),
    airQuality: `湿度 ${humidity}%`
  };
}

function parseOpenMeteoCurrent(current) {
  if (!current) return null;
  const desc = WMO_WEATHER_MAP[current.weather_code] || '未知';
  return {
    weather: formatWeatherText(desc, Math.round(current.temperature_2m)),
    airQuality: `湿度 ${Math.round(current.relative_humidity_2m)}%`
  };
}

async function fetchWeatherByLocation() {
  const result = {
    location: '未知地区',
    weather: '-- --',
    airQuality: '',
    loading: false
  };

  const ipResp = await fetch('http://ip-api.com/json/?lang=zh-CN&fields=city,regionName,lat,lon');
  const ipData = await ipResp.json();
  const province = ipData.regionName || '';
  const city = ipData.city || '';
  const lat = ipData.lat;
  const lon = ipData.lon;

  if (province && city && province !== city) {
    result.location = `${province} ${city}`;
  } else {
    result.location = city || province || '未知地区';
  }

  try {
    const weatherCity = encodeURIComponent(city || '');
    const wttrResp = await fetch(`https://wttr.in/${weatherCity}?format=j1&lang=zh-cn`);
    const wttrData = await wttrResp.json();
    const parsed = parseWttrCurrent(wttrData && wttrData.current_condition && wttrData.current_condition[0]);
    if (parsed) {
      result.weather = parsed.weather;
      result.airQuality = parsed.airQuality;
      return result;
    }
  } catch (_) {
    /* wttr.in 失败，走备用 */
  }

  if (lat && lon) {
    const meteoResp = await fetch(
      `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,weather_code`
    );
    const meteo = await meteoResp.json();
    const parsed = parseOpenMeteoCurrent(meteo && meteo.current);
    if (parsed) {
      result.weather = parsed.weather;
      result.airQuality = parsed.airQuality;
    }
  }

  return result;
}

export {
  translateWeatherDesc,
  parseWttrCurrent,
  parseOpenMeteoCurrent,
  fetchWeatherByLocation
};
