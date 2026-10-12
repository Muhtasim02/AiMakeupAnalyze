import { Router } from 'express';
import authRoutes from './authRoutes';
import productRoutes from './productRoutes';
import categoryRoutes from './categoryRoutes';
import brandRoutes from './brandRoutes';
import availabilityRoutes from './availabilityRoutes';
import userRoutes from './userRoutes';
import favoriteRoutes from './favoriteRoutes';
import recommendationRoutes from './recommendationRoutes';
import ingestionRoutes from './ingestionRoutes';
import analysisRoutes from './analysisRoutes';
import adminRoutes from './adminRoutes';
import orderRoutes from './orderRoutes';
import { checkDatabaseConnection } from '../config/db';

const apiRouter = Router();

// Health check endpoint for database and backend status
apiRouter.get('/health', async (req, res) => {
  const dbHealth = await checkDatabaseConnection();
  if (dbHealth.connected) {
    res.json({
      status: 'healthy',
      database: 'connected',
      message: dbHealth.message,
      version: dbHealth.version,
      timestamp: new Date().toISOString(),
    });
  } else {
    res.status(503).json({
      status: 'unhealthy',
      database: 'disconnected',
      message: dbHealth.message,
      timestamp: new Date().toISOString(),
    });
  }
});

// Mounted REST API endpoints
apiRouter.use('/auth', authRoutes);
apiRouter.use('/products', productRoutes);
apiRouter.use('/categories', categoryRoutes);
apiRouter.use('/brands', brandRoutes);
apiRouter.use('/availability', availabilityRoutes);
apiRouter.use('/user', userRoutes);
apiRouter.use('/favorites', favoriteRoutes);
apiRouter.use('/recommendations', recommendationRoutes);
apiRouter.use('/ingest', ingestionRoutes);
apiRouter.use('/analysis', analysisRoutes);
apiRouter.use('/admin', adminRoutes);
apiRouter.use('/orders', orderRoutes);

export default apiRouter;
