import axios from 'axios';
import { Response, NextFunction } from 'express';
import { supabaseAdmin } from '../config/supabase';
import { AuthenticatedRequest, WeatherData } from '../types';
import { config } from '../config/env';
import { getCoastalZones } from '../services/geofence.service';

const OWM_BASE = 'https://api.openweathermap.org/data/2.5';

// ─── GET /api/weather/marine ─────────────────────────────────────────────────

/**
 * Returns current weather data for a coordinate from OpenWeatherMap.
 */
export async function getMarineWeather(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { lat, lng } = req.query;

    if (!lat || !lng) {
      res.status(400).json({
        success: false,
        error: 'lat and lng query parameters are required.',
        code: 400,
      });
      return;
    }

    const response = await axios.get(`${OWM_BASE}/weather`, {
      params: {
        lat: parseFloat(lat as string),
        lon: parseFloat(lng as string),
        appid: config.openweather.apiKey,
        units: 'metric',
      },
      timeout: 10000,
    });

    const d = response.data;

    const weather: WeatherData = {
      wind_speed_kmh: parseFloat(((d?.wind?.speed ?? 0) * 3.6).toFixed(2)),
      wave_height_m: 0,
      tide_time: null,
      temperature_c: d?.main?.temp ?? 0,
      humidity: d?.main?.humidity ?? 0,
      description: d?.weather?.[0]?.description ?? 'unknown',
    };

    res.status(200).json({
      success: true,
      data: weather,
    });
  } catch (err: unknown) {
    if (axios.isAxiosError(err)) {
      const message =
        err.response?.data?.message ?? err.message ?? 'OpenWeatherMap request failed';
      const status = err.response?.status ?? 502;
      res.status(status).json({
        success: false,
        error: `Weather API error: ${message}`,
        code: status,
      });
      return;
    }
    next(err);
  }
}

// ─── GET /api/weather/forecast ───────────────────────────────────────────────

/**
 * Returns a simplified 3-day weather forecast from the OWM 5-day API.
 */
export async function getWeatherForecast(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { lat, lng } = req.query;

    if (!lat || !lng) {
      res.status(400).json({
        success: false,
        error: 'lat and lng query parameters are required.',
        code: 400,
      });
      return;
    }

    const response = await axios.get(`${OWM_BASE}/forecast`, {
      params: {
        lat: parseFloat(lat as string),
        lon: parseFloat(lng as string),
        appid: config.openweather.apiKey,
        units: 'metric',
        cnt: 24, // 8 slots/day × 3 days
      },
      timeout: 10000,
    });

    const list: Array<{
      dt_txt: string;
      main: { temp_min: number; temp_max: number };
      weather: Array<{ description: string }>;
      wind: { speed: number };
      rain?: { '3h'?: number };
    }> = response.data?.list ?? [];

    // Group by date and aggregate
    const dayMap = new Map<
      string,
      {
        temps: number[];
        descriptions: string[];
        winds: number[];
        rain: number;
      }
    >();

    for (const item of list) {
      const date = item.dt_txt.split(' ')[0];
      if (!dayMap.has(date)) {
        dayMap.set(date, { temps: [], descriptions: [], winds: [], rain: 0 });
      }
      const entry = dayMap.get(date)!;
      entry.temps.push(item.main.temp_min, item.main.temp_max);
      entry.descriptions.push(item.weather?.[0]?.description ?? 'unknown');
      entry.winds.push(item.wind?.speed ?? 0);
      entry.rain += item.rain?.['3h'] ?? 0;
    }

    const forecast = Array.from(dayMap.entries())
      .slice(0, 3)
      .map(([date, data]) => ({
        date,
        min_temp: parseFloat(Math.min(...data.temps).toFixed(1)),
        max_temp: parseFloat(Math.max(...data.temps).toFixed(1)),
        description: data.descriptions[0] ?? 'unknown',
        wind_speed_kmh: parseFloat(
          ((data.winds.reduce((a, b) => a + b, 0) / data.winds.length) * 3.6).toFixed(2)
        ),
        rain_mm: parseFloat(data.rain.toFixed(2)),
      }));

    res.status(200).json({
      success: true,
      data: forecast,
    });
  } catch (err: unknown) {
    if (axios.isAxiosError(err)) {
      const message = err.response?.data?.message ?? err.message;
      const status = err.response?.status ?? 502;
      res.status(status).json({
        success: false,
        error: `Forecast API error: ${message}`,
        code: status,
      });
      return;
    }
    next(err);
  }
}

// ─── GET /api/weather/coastal-status ─────────────────────────────────────────

/**
 * Returns current weather and active alert level for all coastal zones.
 */
export async function getCoastalStatus(
  _req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const zones = await getCoastalZones();

    const results = await Promise.allSettled(
      zones.map(async (zone) => {
        // Fetch current weather
        const weatherRes = await axios.get(`${OWM_BASE}/weather`, {
          params: {
            lat: zone.center_latitude,
            lon: zone.center_longitude,
            appid: config.openweather.apiKey,
            units: 'metric',
          },
          timeout: 8000,
        });

        const d = weatherRes.data;
        const weather: WeatherData = {
          wind_speed_kmh: parseFloat(((d?.wind?.speed ?? 0) * 3.6).toFixed(2)),
          wave_height_m: 0,
          tide_time: null,
          temperature_c: d?.main?.temp ?? 0,
          humidity: d?.main?.humidity ?? 0,
          description: d?.weather?.[0]?.description ?? 'unknown',
        };

        // Fetch current active alert for this zone
        const { data: activeAlerts } = await supabaseAdmin
          .from('alerts')
          .select('severity_level')
          .eq('zone_id', zone.id)
          .eq('is_active', true)
          .order('triggered_at', { ascending: false })
          .limit(1);

        const currentAlertLevel =
          activeAlerts && activeAlerts.length > 0
            ? activeAlerts[0].severity_level
            : 'none';

        return { zone, weather, current_alert_level: currentAlertLevel };
      })
    );

    const coastalStatus = results.map((result, idx) => {
      if (result.status === 'fulfilled') {
        return result.value;
      } else {
        return {
          zone: zones[idx],
          weather: null,
          current_alert_level: 'unknown',
          error: result.reason?.message ?? 'Failed to fetch weather',
        };
      }
    });

    res.status(200).json({
      success: true,
      data: coastalStatus,
    });
  } catch (err) {
    next(err);
  }
}
