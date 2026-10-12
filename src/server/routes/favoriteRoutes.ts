import { Router } from 'express';
import { FavoriteController } from '../controllers/favoriteController';
import { optionalAuth } from '../middleware/auth';

const router = Router();

router.get('/', optionalAuth, FavoriteController.getFavorites);
router.post('/', optionalAuth, FavoriteController.addFavorite);
router.delete('/:id', optionalAuth, FavoriteController.deleteFavorite);

export default router;
