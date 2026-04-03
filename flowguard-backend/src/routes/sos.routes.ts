import { Router } from 'express';
import { triggerSOS, getMySOS } from '../controllers/sos.controller';
import { authMiddleware } from '../middleware/auth.middleware';

const router = Router();

// All SOS routes require authentication
router.use(authMiddleware);

router.post('/trigger', triggerSOS);
router.get('/my', getMySOS);

export default router;
