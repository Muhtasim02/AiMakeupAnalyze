import { Router } from 'express';
import { RecommendationController } from '../controllers/recommendationController';
import { optionalAuth } from '../middleware/auth';

const router = Router();

router.get('/', optionalAuth, RecommendationController.getRecommendations);
router.post('/analyze', optionalAuth, RecommendationController.recordAnalysis);

export default router;
