import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../types';

/**
 * Middleware that restricts access to admin users only.
 * Must be used after authMiddleware so that req.user is populated.
 */
export function adminOnlyMiddleware(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void {
  if (!req.user || req.user.role !== 'admin') {
    res.status(403).json({
      success: false,
      error: 'Admin access required. You do not have permission to perform this action.',
      code: 403,
    });
    return;
  }
  next();
}
