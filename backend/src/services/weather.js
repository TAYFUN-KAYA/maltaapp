const MALTA_LAT = 35.8989;
const MALTA_LON = 14.5146;

const conditionMap = {
  Clear: 'sunny',
  Clouds: 'cloudy',
  Rain: 'rainy',
  Drizzle: 'rainy',
  Thunderstorm: 'storm',
  Snow: 'cloudy',
  Mist: 'cloudy',
  Fog: 'cloudy',
};

function fallbackWeather() {
  return {
    location: 'Malta',
    temp: 28,
    condition: 'sunny',
    conditionText: 'Güneşli',
    humidity: 65,
    windKmh: 12,
    seaTemp: 26,
    uvIndex: 8,
    source: 'fallback',
    updatedAt: new Date(),
  };
}

async function getMaltaWeather(lang = 'tr') {
  const apiKey = process.env.OPENWEATHER_API_KEY;
  if (!apiKey) return fallbackWeather();

  try {
    const url = new URL('https://api.openweathermap.org/data/2.5/weather');
    url.searchParams.set('lat', String(MALTA_LAT));
    url.searchParams.set('lon', String(MALTA_LON));
    url.searchParams.set('appid', apiKey);
    url.searchParams.set('units', 'metric');
    url.searchParams.set('lang', lang === 'tr' ? 'tr' : lang === 'de' ? 'de' : lang === 'es' ? 'es' : 'en');

    const res = await fetch(url);
    if (!res.ok) throw new Error(`OpenWeather ${res.status}`);
    const data = await res.json();

    const temp = Math.round(data.main.temp);
    const main = data.weather?.[0]?.main || 'Clear';

    return {
      location: 'Malta',
      temp,
      condition: conditionMap[main] || 'cloudy',
      conditionText: data.weather?.[0]?.description || main,
      humidity: data.main.humidity,
      windKmh: Math.round((data.wind?.speed || 0) * 3.6),
      seaTemp: Math.max(16, Math.round(temp - 2)),
      uvIndex: null,
      source: 'openweathermap',
      updatedAt: new Date(data.dt * 1000),
    };
  } catch (err) {
    console.warn('OpenWeatherMap error:', err.message);
    return fallbackWeather();
  }
}

module.exports = { getMaltaWeather };
