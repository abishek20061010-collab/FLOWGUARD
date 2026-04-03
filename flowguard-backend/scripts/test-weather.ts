import { fetchMarineWeather } from './src/services/weather.service';
import { config } from './src/config/env';

async function testWeather() {
  console.log('☁️ Testing OpenWeatherMap API...');
  console.log('API Key configured:', config.openweather.apiKey.substring(0, 5) + '*****');

  // Test Coordinates: Chennai, Tamil Nadu
  const lat = 13.0827;
  const lon = 80.2707;

  try {
    const data = await fetchMarineWeather(lat, lon);
    console.log('\n✅ SUCCESS: Successfully fetched weather data!');
    console.log('----------- WEATHER IN CHENNAI -----------');
    console.log(`Condition : ${data.description}`);
    console.log(`Temp      : ${data.temperature_c}°C`);
    console.log(`Humidity  : ${data.humidity}%`);
    console.log(`Wind Speed: ${data.wind_speed_kmh} km/h`);
    console.log('------------------------------------------\n');
  } catch (err: any) {
    console.error('\n❌ FAILED: Could not fetch weather data!');
    console.error('Error Details:', err.response?.data || err.message);
  }

  process.exit(0);
}

testWeather();
