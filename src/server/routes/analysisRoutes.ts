import { Router } from 'express';
import { AnalysisController } from '../controllers/analysisController';
import { optionalAuth } from '../middleware/auth';

const router = Router();

// POST /api/analysis/gemini-analyze
router.post('/gemini-analyze', optionalAuth, AnalysisController.analyze);

// POST /api/analysis/confirm
router.post('/confirm', optionalAuth, AnalysisController.confirm);

export default router;
