import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { AuthService } from '../services/authService';

export class UserController {
  static async getProfile(req: AuthRequest, res: Response) {
    try {
      // Default to user_id 1 if unauthenticated or testing
      const userId = req.user?.userId || 1;
      const profile = await AuthService.getUserProfile(userId);
      return res.json({
        success: true,
        data: profile,
      });
    } catch (err: any) {
      return res.status(500).json({
        success: false,
        error: `Database unavailable: ${err.message}`,
      });
    }
  }

  static async updateProfile(req: AuthRequest, res: Response) {
    try {
      const userId = req.user?.userId || 1;
      const { name, country, budget } = req.body;

      const updated = await AuthService.updateUserProfile(userId, {
        name,
        country,
        budget: budget ? Number(budget) : undefined,
      });

      return res.json({
        success: true,
        data: updated,
      });
    } catch (err: any) {
      return res.status(500).json({
        success: false,
        error: `Database unavailable: ${err.message}`,
      });
    }
  }
}
