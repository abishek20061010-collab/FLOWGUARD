import { Request, Response, NextFunction } from 'express';
import multer from 'multer';
import { config } from '../config/env';

/**
 * Global Express error handler.
 * Handles Supabase errors, Multer errors, and generic errors.
 * Never exposes stack traces in production.
 */
export function errorHandler(
  err: Error & { status?: number; code?: string; statusCode?: number },
  req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _next: NextFunction
): void {
  // Always log in development for debugging
  if (config.nodeEnv === 'development') {
    console.error('[FlowGuard Error]', {
      message: err.message,
      stack: err.stack,
      code: err.code,
      status: err.status ?? err.statusCode,
      path: req.path,
      method: req.method,
    });
  } else {
    // In production log minimal info without stack traces
    console.error('[FlowGuard Error]', {
      message: err.message,
      path: req.path,
      method: req.method,
    });
  }

  // ── Multer Errors ──────────────────────────────────────────────────────────
  if (err instanceof multer.MulterError) {
    let errorMessage = 'File upload error.';
    let statusCode = 400;

    switch (err.code) {
      case 'LIMIT_FILE_SIZE':
        errorMessage = 'File too large. Maximum allowed size is 5 MB.';
        break;
      case 'LIMIT_UNEXPECTED_FILE':
        errorMessage =
          err.message ||
          'Unexpected file field. Use "photo" as the field name.';
        break;
      case 'LIMIT_FILE_COUNT':
        errorMessage = 'Too many files. Only one file is allowed per request.';
        break;
      default:
        errorMessage = err.message || errorMessage;
    }

    res.status(statusCode).json({
      success: false,
      error: errorMessage,
      code: statusCode,
    });
    return;
  }

  // ── Supabase Errors (identified by PGRST or auth error codes) ────────────
  if (
    err.message?.toLowerCase().includes('pgrst') ||
    err.message?.toLowerCase().includes('jwt') ||
    err.message?.toLowerCase().includes('supabase')
  ) {
    res.status(500).json({
      success: false,
      error: 'Database operation failed. Please try again.',
      code: 500,
    });
    return;
  }

  // ── HTTP Errors with status property ─────────────────────────────────────
  const status = err.status ?? err.statusCode ?? 500;

  res.status(status).json({
    success: false,
    error: err.message || 'An unexpected error occurred.',
    code: status,
  });
}
