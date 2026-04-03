import axios from 'axios';
import { supabaseAdmin } from '../config/supabase';
import { WeatherData, Zone, AlertType, AlertLevel } from '../types';
import { notifyZone } from './notification.service';

/**
 * Maps Open-Meteo WMO Weather codes to descriptions.
 */
function getWeatherDescription(code: number): string {
  if (code === 0) return 'Clear sky';
  if ([1, 2, 3].includes(code)) return 'Partly cloudy';
  if ([45, 48].includes(code)) return 'Foggy';
  if ([51, 53, 55].includes(code)) return 'Drizzle';
  if ([61, 63, 65].includes(code)) return 'Rain';
  if ([71, 73, 75].includes(code)) return 'Snow';
  if ([80, 81, 82].includes(code)) return 'Heavy showers';
  if ([85, 86].includes(code)) return 'Snow showers';
  if (code === 95) return 'Thunderstorm';
  if ([96, 99].includes(code)) return 'Severe thunderstorm';
  return 'Unknown';
}

/**
 * Fetches current marine/weather data from Open-Meteo.
 */
export async function fetchMarineWeather(lat: number, lng: number): Promise<WeatherData> {
  try {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&current=temperature_2m,relative_humidity_2m,wind_speed_10m,wind_direction_10m,weather_code,precipitation&hourly=wave_height&wind_speed_unit=kmh&timezone=Asia/Kolkata`;
    
    const response = await axios.get(url, { timeout: 10000 });
    const data = response.data;
    const current = data.current;
    
    const waveHeight = Array.isArray(data.hourly?.wave_height) && data.hourly.wave_height.length > 0
      ? (data.hourly.wave_height[0] ?? 0)
      : 0;

    return {
      wind_speed_kmh: current?.wind_speed_10m ?? 0,
      wave_height_m: waveHeight,
      tide_time: 'N/A', // Open-Meteo does not map tides
      temperature_c: current?.temperature_2m ?? 0,
      humidity: current?.relative_humidity_2m ?? 0,
      description: getWeatherDescription(current?.weather_code ?? -1),
    };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    throw new Error(`Failed to fetch weather data from Open-Meteo: ${msg}`);
  }
}

/**
 * Fetches 3-day forecast from Open-Meteo.
 */
export async function fetchForecast(lat: number, lng: number) {
  try {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&daily=temperature_2m_max,temperature_2m_min,weather_code,wind_speed_10m_max,precipitation_sum&wind_speed_unit=kmh&timezone=Asia/Kolkata&forecast_days=3`;
    const response = await axios.get(url, { timeout: 10000 });
    const daily = response.data.daily;
    
    if (!daily || !daily.time) return [];

    return daily.time.map((date: string, i: number) => ({
      date,
      min_temp: daily.temperature_2m_min[i] ?? 0,
      max_temp: daily.temperature_2m_max[i] ?? 0,
      description: getWeatherDescription(daily.weather_code[i] ?? -1),
      wind_speed_kmh: daily.wind_speed_10m_max[i] ?? 0,
      rain_mm: daily.precipitation_sum[i] ?? 0,
    }));
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    throw new Error(`Failed to fetch forecast from Open-Meteo: ${msg}`);
  }
}

/**
 * Evaluates weather thresholds and creates or deactivates alerts for a zone.
 * Rules:
 *   - wind >= 90 km/h OR wave >= 4m → RED cyclone alert
 *   - wind >= 60 km/h OR wave >= 3m → ORANGE storm_surge alert
 *   - wind >= 40 km/h OR wave >= 2m → YELLOW high_winds alert
 */
export async function checkAlertThresholds(weather: WeatherData, zone: Zone): Promise<void> {
  const { wind_speed_kmh: wind, wave_height_m: wave } = weather;

  let alertType: AlertType | null = null;
  let severityLevel: AlertLevel | null = null;

  if (wind >= 90 || wave >= 4) {
    alertType = 'cyclone';
    severityLevel = 'red';
  } else if (wind >= 60 || wave >= 3) {
    alertType = 'storm_surge';
    severityLevel = 'orange';
  } else if (wind >= 40 || wave >= 2) {
    alertType = 'high_winds';
    severityLevel = 'yellow';
  }

  if (alertType && severityLevel) {
    const { data: existingAlerts } = await supabaseAdmin
      .from('alerts')
      .select('id')
      .eq('zone_id', zone.id)
      .eq('is_active', true)
      .limit(1);

    if (!existingAlerts || existingAlerts.length === 0) {
      await createWeatherAlert(zone.id, alertType, severityLevel, weather);
    }
  } else {
    // No threshold crossed — deactivate any existing active alerts for this zone
    await supabaseAdmin
      .from('alerts')
      .update({ is_active: false })
      .eq('zone_id', zone.id)
      .eq('is_active', true);
  }
}

/**
 * Creates a weather-triggered alert.
 */
export async function createWeatherAlert(
  zoneId: string,
  alertType: AlertType,
  severityLevel: AlertLevel,
  weather: WeatherData
): Promise<Record<string, unknown>> {
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

  const titleMap: Record<AlertType, string> = {
    cyclone: '🌀 Cyclone Warning',
    flood: '🌊 Flood Alert',
    high_winds: '💨 High Winds Advisory',
    storm_surge: '⚠️ Storm Surge Alert',
  };

  const messageMap: Record<AlertLevel, string> = {
    red: `CRITICAL: Wind ${weather.wind_speed_kmh} km/h. Seek immediate shelter. Avoid coastal areas.`,
    orange: `WARNING: Wind ${weather.wind_speed_kmh} km/h. Exercise extreme caution near the coast.`,
    yellow: `ADVISORY: Wind ${weather.wind_speed_kmh} km/h. Monitor conditions. Fishermen advised to stay ashore.`,
  };

  const { data: alert, error } = await supabaseAdmin
    .from('alerts')
    .insert({
      zone_id: zoneId,
      alert_type: alertType,
      severity_level: severityLevel,
      title: titleMap[alertType],
      message: messageMap[severityLevel],
      is_active: true,
      expires_at: expiresAt,
    })
    .select()
    .single();

  if (error || !alert) {
    throw new Error(`Failed to create weather alert: ${error?.message}`);
  }

  notifyZone(zoneId, alert).catch((err: unknown) => {
    console.error(`[WeatherService] Failed to notify zone ${zoneId}:`, err);
  });

  return alert;
}
