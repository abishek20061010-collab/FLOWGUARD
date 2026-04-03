import { firebaseMessaging } from '../config/firebase';
import { twilioClient } from '../config/twilio';
import { supabaseAdmin } from '../config/supabase';
import { config } from '../config/env';
import { NotificationChannel } from '../types';

// ─── FCM Push Notifications ───────────────────────────────────────────────────

/**
 * Sends a multicast FCM push notification to multiple device tokens.
 * Filters out null/empty tokens. Logs results to notifications_log.
 * Does not throw if some or all tokens fail.
 * @param fcmTokens - Array of FCM device registration tokens
 * @param title     - Notification title
 * @param body      - Notification body text
 * @param data      - Optional key-value data payload
 * @param userId    - Optional user ID for notification logging
 * @param alertId   - Optional alert ID for notification logging
 */
export async function sendPushNotification(
  fcmTokens: string[],
  title: string,
  body: string,
  data: Record<string, string> = {},
  userId?: string,
  alertId?: string
): Promise<void> {
  const validTokens = fcmTokens.filter((t) => t && t.trim() !== '');

  if (validTokens.length === 0) {
    console.warn('[NotificationService] No valid FCM tokens to send push notification to.');
    return;
  }

  try {
    const response = await firebaseMessaging.sendEachForMulticast({
      tokens: validTokens,
      notification: { title, body },
      data,
    });

    console.log(
      `[NotificationService] FCM sent: ${response.successCount} succeeded, ${response.failureCount} failed.`
    );

    // Log results to notifications_log (best-effort, no throw)
    const logEntries = response.responses.map((res: any) => ({
      user_id: userId ?? 'system',
      alert_id: alertId ?? null,
      channel: 'fcm' as NotificationChannel,
      status: res.success ? 'sent' : 'failed',
    }));

    // Only log if we have a valid userId
    if (userId) {
      const { error: logFcmError } = await supabaseAdmin
        .from('notifications_log')
        .insert(logEntries);
      if (logFcmError) {
        console.error('[NotificationService] Failed to log FCM results:', logFcmError.message);
      }
    }
  } catch (err: unknown) {
    console.error('[NotificationService] FCM multicast error:', err);
    // Do not rethrow — notification failures should not crash the request
  }
}

// ─── SMS ──────────────────────────────────────────────────────────────────────

/**
 * Sends an SMS message via Twilio. Logs result to notifications_log.
 * Returns false on failure without throwing.
 * @param to      - Recipient phone number (E.164 format)
 * @param message - SMS message body
 * @param userId  - Optional user ID for notification logging
 * @param alertId - Optional alert ID for notification logging
 * @returns Boolean indicating success
 */
export async function sendSMS(
  to: string,
  message: string,
  userId?: string,
  alertId?: string
): Promise<boolean> {
  try {
    await twilioClient.messages.create({
      from: config.twilio.phoneNumber,
      to,
      body: message,
    });

    console.log(`[NotificationService] SMS sent to ${to}`);

    if (userId) {
      const { error: logSentError } = await supabaseAdmin
        .from('notifications_log')
        .insert({
          user_id: userId,
          alert_id: alertId ?? null,
          channel: 'sms' as NotificationChannel,
          status: 'sent',
        });
      if (logSentError) {
        console.error('[NotificationService] Failed to log SMS result:', logSentError.message);
      }
    }

    return true;
  } catch (err: unknown) {
    console.error(`[NotificationService] SMS to ${to} failed:`, err);

    if (userId) {
      const { error: logFailError } = await supabaseAdmin
        .from('notifications_log')
        .insert({
          user_id: userId,
          alert_id: alertId ?? null,
          channel: 'sms' as NotificationChannel,
          status: 'failed',
        });
      if (logFailError) {
        console.error('[NotificationService] Failed to log SMS failure:', logFailError.message);
      }
    }

    return false;
  }
}

// ─── Zone Notification ────────────────────────────────────────────────────────

/**
 * Notifies all users in a zone who have submitted reports.
 * Sends FCM push to all matched users. Sends SMS for RED level alerts only.
 * @param zoneId - Target zone ID
 * @param alert  - The alert object to notify about
 */
export async function notifyZone(
  zoneId: string,
  alert: Record<string, unknown>
): Promise<void> {
  // Fetch user IDs of reporters in this zone
  const { data: reports, error: reportsError } = await supabaseAdmin
    .from('reports')
    .select('user_id')
    .eq('zone_id', zoneId);

  if (reportsError) {
    console.error(
      `[NotificationService] Could not fetch reports for zone ${zoneId}:`,
      reportsError.message
    );
    return;
  }

  if (!reports || reports.length === 0) {
    console.info(`[NotificationService] No reporters found in zone ${zoneId}.`);
    return;
  }

  const uniqueUserIds = [...new Set(reports.map((r) => r.user_id as string))];

  // Fetch profiles for these users
  const { data: profiles, error: profilesError } = await supabaseAdmin
    .from('profiles')
    .select('id, full_name, phone_number, fcm_token')
    .in('id', uniqueUserIds);

  if (profilesError || !profiles) {
    console.error(
      `[NotificationService] Could not fetch profiles for zone ${zoneId}:`,
      profilesError?.message
    );
    return;
  }

  // Send FCM push to all users with tokens
  const fcmTokens = profiles
    .map((p) => p.fcm_token as string | null)
    .filter((t): t is string => !!t);

  if (fcmTokens.length > 0) {
    await sendPushNotification(
      fcmTokens,
      (alert.title as string) ?? 'FlowGuard Alert',
      (alert.message as string) ?? 'An alert has been issued for your zone.',
      {
        alert_id: String(alert.id ?? ''),
        zone_id: zoneId,
        severity_level: String(alert.severity_level ?? ''),
      },
      undefined,
      String(alert.id ?? '')
    );
  }

  // For RED level alerts, also send SMS
  if (alert.severity_level === 'red') {
    for (const profile of profiles) {
      if (profile.phone_number) {
        const smsMessage =
          `FLOWGUARD ALERT: ${alert.title} — ${alert.message} ` +
          `Stay safe. This is an automated emergency notification.`;

        await sendSMS(
          profile.phone_number as string,
          smsMessage,
          profile.id as string,
          String(alert.id ?? '')
        );
      }
    }
  }
}
