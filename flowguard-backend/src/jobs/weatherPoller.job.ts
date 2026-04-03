import cron from 'node-cron';
import { getCoastalZones } from '../services/geofence.service';
import { fetchMarineWeather, checkAlertThresholds } from '../services/weather.service';

/**
 * Polls OpenWeatherMap for all coastal zones every 15 minutes.
 * Evaluates weather thresholds and creates/deactivates alerts accordingly.
 * Each zone is wrapped in a try-catch so failures are isolated.
 */
async function pollWeather(): Promise<void> {
  console.info('[WeatherPoller] Starting coastal weather poll...');

  let zones;
  try {
    zones = await getCoastalZones();
  } catch (err: unknown) {
    console.error('[WeatherPoller] Failed to fetch coastal zones:', err);
    return;
  }

  if (!zones || zones.length === 0) {
    console.info('[WeatherPoller] No coastal zones found. Skipping.');
    return;
  }

  for (const zone of zones) {
    try {
      const weather = await fetchMarineWeather(
        zone.center_latitude,
        zone.center_longitude
      );

      await checkAlertThresholds(weather, zone);

      console.info(
        `[WeatherPoller] ✅ Zone: ${zone.name} | ` +
          `Wind: ${weather.wind_speed_kmh} km/h | ` +
          `Wave: ${weather.wave_height_m} m`
      );
    } catch (err: unknown) {
      console.error(
        `[WeatherPoller] ❌ Failed to poll weather for zone "${zone.name}":`,
        err instanceof Error ? err.message : String(err)
      );
      // Continue with the next zone
    }
  }

  console.info('[WeatherPoller] Coastal weather poll complete.');
}

/**
 * Schedules the weather poller cron job (every 15 minutes)
 * and immediately runs one poll on server startup.
 */
export function startWeatherPoller(): void {
  // Schedule: every 15 minutes
  cron.schedule('*/15 * * * *', () => {
    pollWeather().catch((err: unknown) => {
      console.error('[WeatherPoller] Unhandled error in polling tick:', err);
    });
  });

  // Run once immediately on startup
  pollWeather().catch((err: unknown) => {
    console.error('[WeatherPoller] Startup poll failed:', err);
  });

  console.info('[WeatherPoller] Scheduled — running every 15 minutes.');
}
