import { createClient } from '@supabase/supabase-js';
import { config } from './env';

/**
 * Admin client — uses the SERVICE_ROLE_KEY, bypasses Row Level Security.
 * Use ONLY in server-side service files and controllers. Never expose to clients.
 */
export const supabaseAdmin = createClient(
  config.supabase.url,
  config.supabase.serviceRoleKey,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);

/**
 * Public client — uses the ANON_KEY, respects Row Level Security.
 * Use for user-scoped operations where RLS policies should be enforced.
 */
export const supabaseClient = createClient(
  config.supabase.url,
  config.supabase.anonKey,
  {
    auth: {
      autoRefreshToken: true,
      persistSession: false,
    },
  }
);
