import { Response, NextFunction } from 'express';
import { supabaseAdmin } from '../config/supabase';
import { AuthenticatedRequest } from '../types';
import { getUserZone } from '../services/geofence.service';
import { notifyZone } from '../services/notification.service';

// ─── GET /api/alerts ─────────────────────────────────────────────────────────

/**
 * Returns active alerts for the user's zone or a specific zone.
 * If zone_id not provided, resolves it from the user's geolocation.
 */
export async function getAlerts(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { zone_id, active_only, lat, lng } = req.query;
    const onlyActive = active_only === 'true';

    let resolvedZoneId = zone_id as string | undefined;

    // If no zone_id, try to resolve from lat/lng
    if (!resolvedZoneId && lat && lng) {
      const zone = await getUserZone(
        parseFloat(lat as string),
        parseFloat(lng as string)
      );
      resolvedZoneId = zone?.id;
    }

    let query = supabaseAdmin
      .from('alerts')
      .select('*, zones(name, ward_number)')
      .order('triggered_at', { ascending: false });

    if (resolvedZoneId) query = query.eq('zone_id', resolvedZoneId);
    if (onlyActive) query = query.eq('is_active', true);

    const { data: alerts, error } = await query;

    if (error) {
      throw new Error(`Failed to fetch alerts: ${error.message}`);
    }

    res.status(200).json({
      success: true,
      data: alerts ?? [],
    });
  } catch (err) {
    next(err);
  }
}

// ─── POST /api/alerts ────────────────────────────────────────────────────────

/**
 * Creates a new alert for a zone and notifies subscribers. Admin only.
 */
export async function createAlert(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { zone_id, alert_type, severity_level, title, message, expires_at } =
      req.body;

    if (!zone_id || !alert_type || !severity_level || !title || !message || !expires_at) {
      res.status(400).json({
        success: false,
        error:
          'zone_id, alert_type, severity_level, title, message, and expires_at are required.',
        code: 400,
      });
      return;
    }

    const { data: alert, error } = await supabaseAdmin
      .from('alerts')
      .insert({
        zone_id,
        alert_type,
        severity_level,
        title,
        message,
        is_active: true,
        expires_at,
      })
      .select()
      .single();

    if (error || !alert) {
      throw new Error(`Failed to create alert: ${error?.message}`);
    }

    // Notify zone subscribers asynchronously
    notifyZone(zone_id, alert).catch((err: unknown) => {
      console.error('[AlertsController] Zone notification failed:', err);
    });

    res.status(201).json({
      success: true,
      message: 'Alert created and zone notified.',
      data: alert,
    });
  } catch (err) {
    next(err);
  }
}

// ─── PATCH /api/alerts/:id/deactivate ────────────────────────────────────────

/**
 * Deactivates an alert by setting is_active to false. Admin only.
 */
export async function deactivateAlert(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { id } = req.params;

    const { data: alert, error } = await supabaseAdmin
      .from('alerts')
      .update({ is_active: false })
      .eq('id', id)
      .select()
      .single();

    if (error || !alert) {
      res.status(404).json({
        success: false,
        error: 'Alert not found.',
        code: 404,
      });
      return;
    }

    res.status(200).json({
      success: true,
      message: 'Alert deactivated.',
      data: alert,
    });
  } catch (err) {
    next(err);
  }
}
