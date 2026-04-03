import { Router } from 'express';
import {
  getMarineWeather,
  getWeatherForecast,
  getCoastalStatus,
} from '../controllers/weather.controller';
import { authMiddleware } from '../middleware/auth.middleware';

const router = Router();

// All weather routes require authentication
router.use(authMiddleware);

router.get('/marine', getMarineWeather);
router.get('/forecast', getWeatherForecast);
router.get('/coastal-status', getCoastalStatus);

export default router;
