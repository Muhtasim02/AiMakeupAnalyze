import { Router } from 'express';
import { BrandController } from '../controllers/brandController';
import { requireAuth, requireAdmin } from '../middleware/auth';

const router = Router();

router.get('/', BrandController.getBrands);
router.post('/', requireAuth, requireAdmin, BrandController.createBrand);

export default router;
