import { Response, NextFunction } from 'express';
import { supabaseAdmin } from '../config/supabase';
import { AuthenticatedRequest } from '../types';
import { getCoastalZones } from '../services/geofence.service';
import { fetchMarineWeather, fetchForecast } from '../services/weather.service';

// ─── GET /api/weather/marine ─────────────────────────────────────────────────

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

    const weather = await fetchMarineWeather(parseFloat(lat as string), parseFloat(lng as string));

    res.status(200).json({
      success: true,
      data: weather,
    });
  } catch (err: unknown) {
    next(err);
  }
}

// ─── GET /api/weather/forecast ───────────────────────────────────────────────

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

    const forecast = await fetchForecast(parseFloat(lat as string), parseFloat(lng as string));

    res.status(200).json({
      success: true,
      data: forecast,
    });
  } catch (err: unknown) {
    next(err);
  }
}

// ─── GET /api/weather/coastal-status ─────────────────────────────────────────

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
        const weather = await fetchMarineWeather(zone.center_latitude, zone.center_longitude);

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
