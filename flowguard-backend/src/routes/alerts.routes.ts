import { Router } from 'express';
import {
  getAlerts,
  createAlert,
  deactivateAlert,
} from '../controllers/alerts.controller';
import { authMiddleware } from '../middleware/auth.middleware';
import { adminOnlyMiddleware } from '../middleware/adminOnly.middleware';

const router = Router();

// All routes require authentication
router.use(authMiddleware);

router.get('/', getAlerts);
router.post('/', adminOnlyMiddleware, createAlert);
router.patch('/:id/deactivate', adminOnlyMiddleware, deactivateAlert);

export default router;
