import { Request, Response, NextFunction } from 'express';
import { supabaseAdmin } from '../config/supabase';
import { AuthenticatedRequest } from '../types';

// ─── POST /api/auth/register ──────────────────────────────────────────────────

/**
 * Registers a new user via Supabase Auth and creates their profile row.
 */
export async function register(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { email, password, full_name, phone_number, role, preferred_language } =
      req.body;

    if (!email || !password || !full_name || !phone_number) {
      res.status(400).json({
        success: false,
        error: 'email, password, full_name, and phone_number are required.',
        code: 400,
      });
      return;
    }

    // Create Supabase Auth user
    const { data: authData, error: authError } =
      await supabaseAdmin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
      });

    if (authError || !authData?.user) {
      throw new Error(authError?.message ?? 'Failed to create auth user.');
    }

    const userId = authData.user.id;

    // Insert into profiles table
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .insert({
        id: userId,
        full_name,
        phone_number,
        role: role ?? 'citizen',
        preferred_language: preferred_language ?? 'en',
        civic_coins: 0,
      })
      .select()
      .single();

    if (profileError) {
      // Roll back auth user to keep consistency
      await supabaseAdmin.auth.admin.deleteUser(userId);
      throw new Error(`Failed to create user profile: ${profileError.message}`);
    }

    res.status(201).json({
      success: true,
      message: 'User registered successfully.',
      data: { user: authData.user, profile },
    });
  } catch (err) {
    next(err);
  }
}

// ─── POST /api/auth/login ─────────────────────────────────────────────────────

/**
 * Signs in a user with email/password and returns tokens + profile.
 */
export async function login(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400).json({
        success: false,
        error: 'email and password are required.',
        code: 400,
      });
      return;
    }

    const { data: authData, error: authError } =
      await supabaseAdmin.auth.signInWithPassword({ email, password });

    if (authError || !authData?.user) {
      res.status(401).json({
        success: false,
        error: 'Invalid email or password.',
        code: 401,
      });
      return;
    }

    // Fetch profile
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .eq('id', authData.user.id)
      .single();

    if (profileError || !profile) {
      throw new Error('User authenticated but profile not found.');
    }

    res.status(200).json({
      success: true,
      message: 'Login successful.',
      data: {
        access_token: authData.session?.access_token,
        refresh_token: authData.session?.refresh_token,
        user: authData.user,
        profile,
      },
    });
  } catch (err) {
    next(err);
  }
}

// ─── POST /api/auth/logout ────────────────────────────────────────────────────

/**
 * Signs out the current user. Protected route.
 */
export async function logout(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const token = req.headers.authorization?.split(' ')[1] ?? '';
    await supabaseAdmin.auth.admin.signOut(token);

    res.status(200).json({
      success: true,
      message: 'Logged out successfully.',
    });
  } catch (err) {
    next(err);
  }
}

// ─── GET /api/auth/me ─────────────────────────────────────────────────────────

/**
 * Returns the currently authenticated user's profile.
 */
export async function getMe(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    res.status(200).json({
      success: true,
      data: req.user,
    });
  } catch (err) {
    next(err);
  }
}

// ─── POST /api/auth/refresh ───────────────────────────────────────────────────

/**
 * Refreshes access and refresh tokens using a valid refresh_token.
 */
export async function refreshToken(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { refresh_token } = req.body;

    if (!refresh_token) {
      res.status(400).json({
        success: false,
        error: 'refresh_token is required.',
        code: 400,
      });
      return;
    }

    const { data, error } =
      await supabaseAdmin.auth.refreshSession({ refresh_token });

    if (error || !data?.session) {
      res.status(401).json({
        success: false,
        error: 'Invalid or expired refresh token.',
        code: 401,
      });
      return;
    }

    res.status(200).json({
      success: true,
      message: 'Token refreshed successfully.',
      data: {
        access_token: data.session.access_token,
        refresh_token: data.session.refresh_token,
        user: data.user,
      },
    });
  } catch (err) {
    next(err);
  }
}

// ─── PATCH /api/auth/fcm-token ────────────────────────────────────────────────

/**
 * Updates the FCM token for the currently authenticated user.
 */
export async function updateFcmToken(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { fcm_token } = req.body;

    if (!fcm_token) {
      res.status(400).json({
        success: false,
        error: 'fcm_token is required.',
        code: 400,
      });
      return;
    }

    const { data: profile, error } = await supabaseAdmin
      .from('profiles')
      .update({ fcm_token })
      .eq('id', req.user!.id)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update FCM token: ${error.message}`);
    }

    res.status(200).json({
      success: true,
      message: 'FCM token updated successfully.',
      data: profile,
    });
  } catch (err) {
    next(err);
  }
}

// ─── POST /api/auth/complete-profile ──────────────────────────────────────────

/**
 * Creates the user's profile if it doesn't exist (used for Google OAuth flow).
 * Requires the JWT via 'Authorization: Bearer <token>'.
 */
export async function completeProfile(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({
        success: false,
        error: 'Authorization token is missing. Provide a Bearer token.',
      });
      return;
    }

    const token = authHeader.split(' ')[1];

    const { data: authData, error: authError } =
      await supabaseAdmin.auth.getUser(token);

    if (authError || !authData?.user) {
      res.status(401).json({
        success: false,
        error: 'Invalid or expired token.',
      });
      return;
    }

    const { phone_number, role, full_name } = req.body;

    if (!phone_number) {
      res.status(400).json({
        success: false,
        error: 'phone_number is required.',
      });
      return;
    }

    const nameToUse = full_name || authData.user.user_metadata?.full_name || 'Citizen';

    // Insert into profiles table
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .insert({
        id: authData.user.id,
        full_name: nameToUse,
        phone_number,
        role: role ?? 'citizen',
        preferred_language: 'en',
        civic_coins: 0,
      })
      .select()
      .single();

    if (profileError) {
      if (profileError.code === '23505') {
        res.status(400).json({ success: false, error: 'Phone number is already in use.' });
        return;
      }
      throw new Error(`Failed to complete user profile: ${profileError.message}`);
    }

    res.status(201).json({
      success: true,
      message: 'Profile completed successfully.',
      data: profile,
    });
  } catch (err) {
    next(err);
  }
}
