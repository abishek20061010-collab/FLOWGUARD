// Load and validate environment variables first — this must be the first import
import './config/env';

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';

import { config } from './config/env';
import { errorHandler } from './middleware/errorHandler';
import { startWeatherPoller } from './jobs/weatherPoller.job';

// Routes
import authRoutes from './routes/auth.routes';
import reportsRoutes from './routes/reports.routes';
import adminRoutes from './routes/admin.routes';
import alertsRoutes from './routes/alerts.routes';
import sosRoutes from './routes/sos.routes';
import weatherRoutes from './routes/weather.routes';

const app = express();

// ─── Security & HTTP Headers ──────────────────────────────────────────────────
app.use(helmet());

// ─── CORS ─────────────────────────────────────────────────────────────────────
app.use(
  cors({
    origin: config.cors.origin,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

// ─── Request Logging ──────────────────────────────────────────────────────────
if (config.nodeEnv === 'development') {
  app.use(morgan('dev'));
}

// ─── Body Parsers ─────────────────────────────────────────────────────────────
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ─── Health Check ─────────────────────────────────────────────────────────────
app.get('/health', (_req, res) => {
  res.status(200).json({
    success: true,
    data: {
      status: 'ok',
      timestamp: new Date().toISOString(),
      environment: config.nodeEnv,
    },
  });
});

// ─── API Routes ───────────────────────────────────────────────────────────────
app.use('/api/auth', authRoutes);
app.use('/api/reports', reportsRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/alerts', alertsRoutes);
app.use('/api/sos', sosRoutes);
app.use('/api/weather', weatherRoutes);

// ─── 404 Handler ─────────────────────────────────────────────────────────────
app.use((_req, res) => {
  res.status(404).json({
    success: false,
    error: 'Route not found.',
    code: 404,
  });
});

// ─── Global Error Handler (must be last) ─────────────────────────────────────
app.use(errorHandler);

// ─── Start Server ─────────────────────────────────────────────────────────────
app.listen(config.port, () => {
  console.log(`\n🚀 FlowGuard API running on port ${config.port}`);
  console.log(`   Environment : ${config.nodeEnv}`);
  console.log(`   CORS origin : ${config.cors.origin}`);
  console.log(`   Health check: http://localhost:${config.port}/health\n`);

  // Start weather poller cron job
  startWeatherPoller();
});

export default app;
