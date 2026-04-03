import { Router } from 'express';
import {
  register,
  login,
  logout,
  getMe,
  refreshToken,
  updateFcmToken,
  completeProfile,
} from '../controllers/auth.controller';
import { authMiddleware } from '../middleware/auth.middleware';

const router = Router();

router.post('/register', register);
router.post('/login', login);
router.post('/logout', authMiddleware, logout);
router.get('/me', authMiddleware, getMe);
router.post('/refresh', refreshToken);
router.patch('/fcm-token', authMiddleware, updateFcmToken);
router.post('/complete-profile', completeProfile);

export default router;
