import { Router } from 'express';
import { CategoryController } from '../controllers/categoryController';
import { requireAuth, requireAdmin } from '../middleware/auth';

const router = Router();

router.get('/', CategoryController.getCategories);
router.post('/', requireAuth, requireAdmin, CategoryController.createCategory);

export default router;
