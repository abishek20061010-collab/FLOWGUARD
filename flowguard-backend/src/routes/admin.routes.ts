import { Router } from 'express';
import {
  getDashboard,
  getAllReports,
  getClusteredReports,
  updateReportStatus,
  getAllSOS,
  updateSOSEvent,
  getAllZones,
  updateZoneRisk,
} from '../controllers/admin.controller';
import { authMiddleware } from '../middleware/auth.middleware';
import { adminOnlyMiddleware } from '../middleware/adminOnly.middleware';
import { uploadResolutionMiddleware } from '../middleware/upload.middleware';

const router = Router();

// All admin routes require auth + admin role
router.use(authMiddleware, adminOnlyMiddleware);

router.get('/dashboard', getDashboard);
router.get('/reports', getAllReports);
router.get('/reports/clustered', getClusteredReports);
router.patch('/reports/:id/status', uploadResolutionMiddleware, updateReportStatus);
router.get('/sos', getAllSOS);
router.patch('/sos/:id', updateSOSEvent);
router.get('/zones', getAllZones);
router.patch('/zones/:id/risk', updateZoneRisk);

export default router;
