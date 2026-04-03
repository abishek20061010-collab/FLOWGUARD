import { sendSMS } from './src/services/notification.service';
import { config } from './src/config/env';

async function runTest() {
  console.log('🚀 Starting Twilio SMS Test...');
  console.log(`📱 From Number : ${config.twilio.phoneNumber}`);
  console.log(`📱 To Number   : ${config.twilio.emergencyNumber}`);
  console.log('----------------------------------------');

  const testMessage = "🔔 FLOWGUARD TEST: Your Twilio SMS integration is working perfectly!";

  try {
    const success = await sendSMS(config.twilio.emergencyNumber, testMessage);
    
    if (success) {
      console.log('✅ SUCCESS: SMS request sent to Twilio!');
    } else {
      console.log('❌ FAILED: SMS failed to send. Check the error logs above.');
    }
  } catch (err) {
    console.error('Crash during SMS test:', err);
  }

  process.exit(0);
}

runTest();
