import { Response, NextFunction } from 'express';
import { supabaseAdmin } from '../config/supabase';
import { AuthenticatedRequest } from '../types';
import { sendPushNotification, sendSMS } from '../services/notification.service';
import { config } from '../config/env';

// ─── POST /api/sos/trigger ────────────────────────────────────────────────────

/**
 * Triggers an SOS emergency event. Sends FCM to all admins and SMS to emergency number.
 * Updates sms_sent/fcm_sent flags without throwing on partial failures.
 */
export async function triggerSOS(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { latitude, longitude } = req.body;

    if (!latitude || !longitude) {
      res.status(400).json({
        success: false,
        error: 'latitude and longitude are required.',
        code: 400,
      });
      return;
    }

    const lat = parseFloat(latitude);
    const lng = parseFloat(longitude);
    const user = req.user!;
    const timestamp = new Date().toISOString();

    // 1. Insert SOS event
    const { data: sosEvent, error: sosError } = await supabaseAdmin
      .from('sos_events')
      .insert({
        user_id: user.id,
        latitude: lat,
        longitude: lng,
        status: 'active',
        sms_sent: false,
        fcm_sent: false,
      })
      .select()
      .single();

    if (sosError || !sosEvent) {
      throw new Error(`Failed to create SOS event: ${sosError?.message}`);
    }

    // 2. Fetch all admin FCM tokens
    const { data: admins, error: adminsError } = await supabaseAdmin
      .from('profiles')
      .select('id, fcm_token')
      .eq('role', 'admin');

    let fcmSent = false;
    let smsSent = false;

    // 3. Send FCM push to all admins
    if (!adminsError && admins && admins.length > 0) {
      const adminTokens = admins
        .map((a) => a.fcm_token as string | null)
        .filter((t): t is string => !!t);

      try {
        await sendPushNotification(
          adminTokens,
          '🆘 SOS Alert',
          `Emergency at [${lat.toFixed(4)}, ${lng.toFixed(4)}] from ${user.full_name}`,
          {
            sos_id: sosEvent.id,
            latitude: String(lat),
            longitude: String(lng),
            user_name: user.full_name,
            phone_number: user.phone_number,
            type: 'sos',
          }
        );
        fcmSent = true;
      } catch (fcmErr: unknown) {
        console.error('[SOSController] FCM push failed:', fcmErr);
        fcmSent = false;
      }
    }

    // 4. Send Twilio SMS to emergency number
    const smsMessage =
      `FLOWGUARD SOS: ${user.full_name} needs help at ` +
      `Lat:${lat.toFixed(6)} Lng:${lng.toFixed(6)}. ` +
      `Phone: ${user.phone_number}. Time: ${timestamp}`;

    try {
      smsSent = await sendSMS(
        config.twilio.emergencyNumber,
        smsMessage,
        user.id,
        sosEvent.id
      );
    } catch (smsErr: unknown) {
      console.error('[SOSController] SMS failed:', smsErr);
      smsSent = false;
    }

    // 5. Update SOS event with sent flags
    const { error: updateError } = await supabaseAdmin
      .from('sos_events')
      .update({ sms_sent: smsSent, fcm_sent: fcmSent })
      .eq('id', sosEvent.id);

    if (updateError) {
      console.error('[SOSController] Failed to update SOS flags:', updateError.message);
    }

    // 6. Log to notifications_log
    await supabaseAdmin
      .from('notifications_log')
      .insert({
        user_id: user.id,
        alert_id: null,
        channel: 'sms',
        status: smsSent ? 'sent' : 'failed',
      })
      .then(({ error }) => {
        if (error) console.error('[SOSController] Failed to log SMS notification:', error.message);
      });

    // 7. Return the SOS event
    const { data: finalSos } = await supabaseAdmin
      .from('sos_events')
      .select('*')
      .eq('id', sosEvent.id)
      .single();

    res.status(201).json({
      success: true,
      message: 'SOS triggered. Emergency services have been notified.',
      data: finalSos ?? sosEvent,
    });
  } catch (err) {
    next(err);
  }
}

// ─── GET /api/sos/my ─────────────────────────────────────────────────────────

/**
 * Returns all SOS events for the currently authenticated user.
 */
export async function getMySOS(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { data: events, error } = await supabaseAdmin
      .from('sos_events')
      .select('*')
      .eq('user_id', req.user!.id)
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`Failed to fetch SOS events: ${error.message}`);
    }

    res.status(200).json({
      success: true,
      data: events ?? [],
    });
  } catch (err) {
    next(err);
  }
}
