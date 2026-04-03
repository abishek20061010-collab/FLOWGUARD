import { Router } from 'express';
import {
  createReport,
  getMyReports,
  getReportById,
} from '../controllers/reports.controller';
import { authMiddleware } from '../middleware/auth.middleware';
import { uploadMiddleware } from '../middleware/upload.middleware';

const router = Router();

// All routes require authentication
router.use(authMiddleware);

router.post('/', uploadMiddleware, createReport);
router.get('/', getMyReports);
router.get('/:id', getReportById);

export default router;
