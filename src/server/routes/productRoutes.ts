import { Router } from 'express';
import { ProductController } from '../controllers/productController';
import { requireAuth, requireAdmin } from '../middleware/auth';

const router = Router();

router.get('/search', ProductController.search);
router.get('/', ProductController.getProducts);
router.get('/:id', ProductController.getProductById);
router.get('/:id/variants', ProductController.getProductVariants);

// Admin Product Management (Restricted strictly to admin@gmail.com)
router.post('/', requireAuth, requireAdmin, ProductController.createProduct);
router.put('/:id', requireAuth, requireAdmin, ProductController.updateProduct);
router.delete('/:id', requireAuth, requireAdmin, ProductController.deleteProduct);
router.post('/:id/deactivate', requireAuth, requireAdmin, ProductController.deactivateProduct);
router.put('/:id/availability', requireAuth, requireAdmin, ProductController.updateAvailability);

// Admin Shade Variant Management
router.post('/:id/variants', requireAuth, requireAdmin, ProductController.addVariant);
router.put('/:id/variants/:variantId', requireAuth, requireAdmin, ProductController.updateVariant);
router.delete('/:id/variants/:variantId', requireAuth, requireAdmin, ProductController.deleteVariant);

export default router;
