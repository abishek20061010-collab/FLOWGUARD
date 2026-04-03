import axios from 'axios';
import { config } from '../config/env';
import { supabaseAdmin } from '../config/supabase';
import { WeatherData, Zone, AlertType, AlertLevel } from '../types';
import { notifyZone } from './notification.service';

const OWM_BASE = 'https://api.openweathermap.org/data/2.5';

/**
 * Fetches current marine/weather data from OpenWeatherMap for a given coordinate.
 * @param lat - Latitude of the location
 * @param lng - Longitude of the location
 * @returns WeatherData transformed from the OWM response
 */
export async function fetchMarineWeather(
  lat: number,
  lng: number
): Promise<WeatherData> {
  try {
    const response = await axios.get(`${OWM_BASE}/weather`, {
      params: {
        lat,
        lon: lng,
        appid: config.openweather.apiKey,
        units: 'metric',
      },
      timeout: 10000,
    });

    const data = response.data;

    const windSpeedMs: number = data?.wind?.speed ?? 0;
    const windSpeedKmh = parseFloat((windSpeedMs * 3.6).toFixed(2));

    return {
      wind_speed_kmh: windSpeedKmh,
      wave_height_m: 0, // OWM current weather does not include wave height
      tide_time: null,
      temperature_c: data?.main?.temp ?? 0,
      humidity: data?.main?.humidity ?? 0,
      description: data?.weather?.[0]?.description ?? 'unknown',
    };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    throw new Error(`Failed to fetch weather data from OpenWeatherMap: ${msg}`);
  }
}

/**
 * Evaluates weather thresholds and creates or deactivates alerts for a zone.
 * Rules:
 *   - wind >= 90 km/h OR wave >= 4m → RED cyclone alert
 *   - wind >= 60 km/h OR wave >= 3m → ORANGE storm_surge alert
 *   - wind >= 40 km/h OR wave >= 2m → YELLOW high_winds alert
 * @param weather - Current weather data for the zone
 * @param zone    - The zone to evaluate
 */
export async function checkAlertThresholds(
  weather: WeatherData,
  zone: Zone
): Promise<void> {
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
    // Check if an active alert already exists for this zone
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
 * Creates a weather-triggered alert in the database and notifies zone subscribers.
 * Alert expires 24 hours from creation time.
 * @param zoneId        - Target zone ID
 * @param alertType     - Type of weather alert
 * @param severityLevel - Alert severity level
 * @param weather       - Current weather data that triggered the alert
 * @returns The created alert record
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

  // Notify users in the zone asynchronously — do not block
  notifyZone(zoneId, alert).catch((err: unknown) => {
    console.error(`[WeatherService] Failed to notify zone ${zoneId}:`, err);
  });

  return alert;
}
