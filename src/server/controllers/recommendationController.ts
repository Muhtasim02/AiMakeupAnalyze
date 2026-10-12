import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { RecommendationService } from '../services/recommendationService';

export class RecommendationController {
  static async getRecommendations(req: AuthRequest, res: Response) {
    try {
      const userId = req.user?.userId || 1;
      const { skinTone, undertone, budget, country, category, brand } = req.query;

      const recommendations = await RecommendationService.getUserRecommendations(userId, {
        skinTone: skinTone as string,
        undertone: undertone as string,
        budget: budget ? Number(budget) : undefined,
        country: country as string,
        category: category as string,
        brand: brand as string,
      });

      // Also categorize by budget: Best Matches (<= budget), Slightly Above Budget (<= 1.25x), Similar Alternatives
      const bestMatches = recommendations.filter(r => r.budgetCategory === 'best_match');
      const slightlyAbove = recommendations.filter(r => r.budgetCategory === 'slightly_above');
      const alternatives = recommendations.filter(r => r.budgetCategory === 'alternative');

      return res.json({
        success: true,
        count: recommendations.length,
        data: recommendations,
        groups: {
          bestMatches,
          slightlyAbove,
          alternatives,
        },
      });
    } catch (err: any) {
      console.error('Error in getRecommendations controller:', err);
      return res.status(500).json({
        success: false,
        error: `Database unavailable: ${err.message}`,
      });
    }
  }

  static async recordAnalysis(req: AuthRequest, res: Response) {
    try {
      const userId = req.user?.userId || 1;
      const { skinTone, undertone, confidenceScore, imagePath } = req.body;

      if (!skinTone || !undertone) {
        return res.status(400).json({
          success: false,
          error: 'skinTone and undertone are required.',
        });
      }

      const result = await RecommendationService.saveSkinAnalysis({
        userId,
        skinTone,
        undertone,
        confidenceScore: confidenceScore ? Number(confidenceScore) : 87.0,
        imagePath,
      });

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
}
