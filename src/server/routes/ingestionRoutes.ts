import { Router } from 'express';
import { IngestionController } from '../controllers/ingestionController';
import { requireAuth, requireAdmin } from '../middleware/auth';

const router = Router();

router.get('/sources', IngestionController.getSources);
router.get('/jobs', IngestionController.getJobs);

// Admin-only Ingestion & Crawling Endpoints
router.post('/preview', requireAuth, requireAdmin, IngestionController.preview);
router.post('/run', requireAuth, requireAdmin, IngestionController.run);
router.post('/sync-all', requireAuth, requireAdmin, IngestionController.syncAll);

export default router;
