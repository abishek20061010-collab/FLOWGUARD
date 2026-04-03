import { supabaseAdmin } from '../config/supabase';
import { Zone } from '../types';

/**
 * Calculates the great-circle distance between two coordinates using the Haversine formula.
 * @param lat1 - Latitude of point 1 in decimal degrees
 * @param lon1 - Longitude of point 1 in decimal degrees
 * @param lat2 - Latitude of point 2 in decimal degrees
 * @param lon2 - Longitude of point 2 in decimal degrees
 * @returns Distance in kilometers
 */
export function haversineDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const EARTH_RADIUS_KM = 6371;

  const toRad = (deg: number): number => (deg * Math.PI) / 180;

  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return EARTH_RADIUS_KM * c;
}

/**
 * Finds which zone a GPS coordinate falls within by comparing Haversine distance
 * to each zone's radius.
 * @param lat - Latitude of the point to check
 * @param lng - Longitude of the point to check
 * @returns The matching Zone or null if the point is not within any zone
 */
export async function getUserZone(
  lat: number,
  lng: number
): Promise<Zone | null> {
  const { data: zones, error } = await supabaseAdmin
    .from('zones')
    .select('*');

  if (error) {
    throw new Error(`Failed to fetch zones: ${error.message}`);
  }

  if (!zones || zones.length === 0) return null;

  for (const zone of zones as Zone[]) {
    const distance = haversineDistance(
      lat,
      lng,
      zone.center_latitude,
      zone.center_longitude
    );

    if (distance <= zone.radius_km) {
      return zone;
    }
  }

  return null;
}

/**
 * Fetches all zones that are marked as coastal.
 * @returns Array of coastal Zone records
 */
export async function getCoastalZones(): Promise<Zone[]> {
  const { data: zones, error } = await supabaseAdmin
    .from('zones')
    .select('*')
    .eq('is_coastal', true);

  if (error) {
    throw new Error(`Failed to fetch coastal zones: ${error.message}`);
  }

  return (zones as Zone[]) ?? [];
}
