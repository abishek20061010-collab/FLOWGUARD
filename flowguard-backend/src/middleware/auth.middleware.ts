import { Response, NextFunction } from 'express';
import { supabaseAdmin } from '../config/supabase';
import { AuthenticatedRequest } from '../types';

/**
 * Middleware that validates a Bearer JWT from the Authorization header,
 * fetches the full user profile from the profiles table, and attaches
 * it to req.user for downstream handlers.
 */
export async function authMiddleware(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({
        success: false,
        error: 'Authorization token is missing or malformed. Provide a Bearer token.',
        code: 401,
      });
      return;
    }

    const token = authHeader.split(' ')[1];

    // Development Mock Bypass
    if (process.env.NODE_ENV === 'development') {
      if (token === 'MOCK_CITIZEN_TOKEN' || token === 'MOCK_ADMIN_TOKEN') {
        const isCitizen = token === 'MOCK_CITIZEN_TOKEN';
        req.user = {
          id: isCitizen ? 'citizen-123' : 'admin-456',
          role: isCitizen ? 'citizen' : 'admin',
          full_name: isCitizen ? 'Mock Citizen' : 'Mock Admin',
          phone_number: '+919999999999',
          created_at: new Date().toISOString(),
          civic_coins: 0,
          fcm_token: null,
          preferred_language: 'en'
        };
        return next();
      }
    }

    // Verify token with Supabase Auth
    const { data: authData, error: authError } =
      await supabaseAdmin.auth.getUser(token);

    if (authError || !authData?.user) {
      res.status(401).json({
        success: false,
        error: 'Invalid or expired token. Please log in again.',
        code: 401,
      });
      return;
    }

    // Fetch full profile from profiles table
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .eq('id', authData.user.id)
      .single();

    if (profileError || !profile) {
      res.status(403).json({
        success: false,
        error: 'User profile not found. Account may have been deleted.',
        code: 403,
      });
      return;
    }

    req.user = profile;
    next();
  } catch (err) {
    next(err);
  }
}
