import { Router } from 'express';
import { UserController } from '../controllers/userController';
import { optionalAuth } from '../middleware/auth';

const router = Router();

router.get('/profile', optionalAuth, UserController.getProfile);
router.put('/profile', optionalAuth, UserController.updateProfile);

export default router;
