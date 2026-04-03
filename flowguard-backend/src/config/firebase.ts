import admin from 'firebase-admin';
import { config } from './env';

let messagingInstance: admin.messaging.Messaging | any;

try {
  if (config.firebase.projectId && config.firebase.privateKey && !config.firebase.privateKey.includes('YourKeyHere')) {
    if (!admin.apps.length) {
      admin.initializeApp({
        credential: admin.credential.cert({
          projectId: config.firebase.projectId,
          privateKey: config.firebase.privateKey,
          clientEmail: config.firebase.clientEmail,
        }),
      });
    }
    messagingInstance = admin.messaging();
  } else {
    throw new Error('Firebase credentials missing or using placeholders');
  }
} catch (err) {
  console.warn('[Firebase] Running in mock mode. Real push notifications will not be sent.');
  // Provide a mock messaging instance
  messagingInstance = {
    sendEachForMulticast: async (payload: any) => {
      console.log(`[Firebase Mock] Simulating push to ${payload.tokens?.length ?? 0} devices`);
      return {
        successCount: payload.tokens?.length ?? 0,
        failureCount: 0,
        responses: (payload.tokens ?? []).map(() => ({ success: true })),
      };
    },
  };
}

/**
 * Firebase Cloud Messaging instance for sending push notifications.
 */
export const firebaseMessaging = messagingInstance;

export default admin;
