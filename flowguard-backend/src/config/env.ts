import dotenv from 'dotenv';
dotenv.config();

/**
 * Reads an environment variable and throws if it is missing.
 */
function requireEnv(key: string): string {
  const value = process.env[key];
  if (!value || value.trim() === '') {
    throw new Error(
      `[FlowGuard] Missing required environment variable: ${key}. ` +
        `Check your .env file against .env.example.`
    );
  }
  return value.trim();
}

/**
 * Reads an optional environment variable with a fallback default.
 */
function optionalEnv(key: string, defaultValue: string): string {
  const value = process.env[key];
  return value && value.trim() !== '' ? value.trim() : defaultValue;
}

// ─── Validate & Export Config ─────────────────────────────────────────────────

export const config = {
  port: parseInt(optionalEnv('PORT', '3000'), 10),
  nodeEnv: optionalEnv('NODE_ENV', 'development'),

  supabase: {
    url: requireEnv('SUPABASE_URL'),
    serviceRoleKey: requireEnv('SUPABASE_SERVICE_ROLE_KEY'),
    anonKey: requireEnv('SUPABASE_ANON_KEY'),
  },

  firebase: {
    projectId: optionalEnv('FIREBASE_PROJECT_ID', ''),
    // Replace literal \n sequences stored in env with real newlines
    privateKey: optionalEnv('FIREBASE_PRIVATE_KEY', '').replace(/\\n/g, '\n'),
    clientEmail: optionalEnv('FIREBASE_CLIENT_EMAIL', ''),
  },

  twilio: {
    accountSid: optionalEnv('TWILIO_ACCOUNT_SID', ''),
    authToken: optionalEnv('TWILIO_AUTH_TOKEN', ''),
    phoneNumber: optionalEnv('TWILIO_PHONE_NUMBER', ''),
    emergencyNumber: optionalEnv('EMERGENCY_PHONE_NUMBER', ''),
  },

  openweather: {
    apiKey: requireEnv('OPENWEATHER_API_KEY'),
  },

  triageService: {
    url: optionalEnv('TRIAGE_SERVICE_URL', 'http://localhost:8000'),
  },

  cors: {
    origin: optionalEnv('FRONTEND_URL', 'http://localhost:5173'),
  },
} as const;

export type Config = typeof config;
