import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { FavoriteService } from '../services/favoriteService';

export class FavoriteController {
  static async getFavorites(req: AuthRequest, res: Response) {
    try {
      const userId = req.user?.userId || 1;
      const favorites = await FavoriteService.getUserFavorites(userId);
      return res.json({
        success: true,
        count: favorites.length,
        data: favorites,
      });
    } catch (err: any) {
      return res.status(500).json({
        success: false,
        error: `Database unavailable: ${err.message}`,
      });
    }
  }

  static async addFavorite(req: AuthRequest, res: Response) {
    try {
      const userId = req.user?.userId || 1;
      const { productId } = req.body;

      if (!productId) {
        return res.status(400).json({
          success: false,
          error: 'productId is required.',
        });
      }

      const numericId = typeof productId === 'string'
        ? Number(productId.replace('prod_', ''))
        : Number(productId);

      const result = await FavoriteService.addFavorite(userId, numericId);
      return res.status(201).json({
        success: true,
        data: result,
      });
    } catch (err: any) {
      return res.status(500).json({
        success: false,
        error: `Database unavailable: ${err.message}`,
      });
    }
  }

  static async deleteFavorite(req: AuthRequest, res: Response) {
    try {
      const userId = req.user?.userId || 1;
      const paramId = req.params.id;
      const numericId = Number(paramId.replace('prod_', ''));

      const result = await FavoriteService.removeFavorite(userId, numericId);
      return res.json({
        success: true,
        data: result,
      });
    } catch (err: any) {
      return res.status(500).json({
        success: false,
        error: `Database unavailable: ${err.message}`,
      });
    }
  }
}
