import twilio from 'twilio';
import { config } from './env';

let instance: any;

if (
  config.twilio.accountSid &&
  config.twilio.authToken &&
  !config.twilio.accountSid.includes('ACxxxxxxxx') &&
  !config.twilio.authToken.includes('your-auth-token')
) {
  instance = twilio(config.twilio.accountSid, config.twilio.authToken);
} else {
  console.warn('[Twilio] Running in mock mode. Real SMS messages will not be sent.');
  instance = {
    messages: {
      create: async (payload: any) => {
        console.log(`[Twilio Mock] Simulating SMS to ${payload.to}`);
        return { sid: 'mock_sid' };
      },
    },
  };
}

/**
 * Twilio REST client initialized with credentials from config.
 * Used for sending SMS alerts and SOS notifications.
 */
export const twilioClient = instance;
