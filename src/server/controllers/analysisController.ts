import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { GeminiService } from '../services/geminiService';
import { RecommendationService } from '../services/recommendationService';
import { pool } from '../config/db';

export class AnalysisController {
  /**
   * POST /api/analysis/gemini-analyze
   * Receives image, validates it, and requests Gemini multimodal skin analysis
   */
  static async analyze(req: AuthRequest, res: Response) {
    try {
      const { imageBase64, mimeType = 'image/jpeg', clientColorimetry } = req.body;

      if (!imageBase64) {
        return res.status(400).json({
          success: false,
          error: 'Image data is required. Please upload a JPG, JPEG, or PNG photo.',
        });
      }

      // Check payload size (limit ~16MB)
      if (imageBase64.length > 16 * 1024 * 1024) {
        return res.status(400).json({
          success: false,
          error: 'Image file is too large. Please upload an image under 10MB.',
        });
      }

      // Call Gemini backend service with resilient colorimetry fallback
      const analysis = await GeminiService.analyzeSkinImage(imageBase64, mimeType, clientColorimetry);

      if (analysis.skinTone === 'Unknown') {
        return res.status(200).json({
          success: false,
          status: 'insufficient_image_quality',
          error: 'The image does not provide sufficient reliable facial skin information. Please ensure your face is clearly visible without heavy shadows or filters.',
          data: analysis,
        });
      }

      return res.json({
        success: true,
        data: analysis,
      });
    } catch (err: any) {
      console.error('[Analysis Controller Error]:', err);
      return res.status(500).json({
        success: false,
        error: 'Unable to analyze image. Please upload a clear photo taken under natural lighting.',
      });
    }
  }

  /**
   * POST /api/analysis/confirm
   * Saves user-confirmed (or manually edited) analysis into MySQL `skin_analysis`
   */
  static async confirm(req: AuthRequest, res: Response) {
    try {
      const userId = req.user?.userId || 1;
      const {
        skinTone,
        undertone,
        confidence = 0.87,
        explanation = '',
        imagePath = null,
      } = req.body;

      if (!skinTone || skinTone === 'Unknown') {
        return res.status(400).json({
          success: false,
          error: 'A valid skin tone selection is required to confirm recommendations.',
        });
      }

      if (!undertone || undertone === 'Unknown') {
        return res.status(400).json({
          success: false,
          error: 'A valid undertone selection is required to confirm recommendations.',
        });
      }

      // Convert confidence to percentage scale for MySQL confidence_score (DECIMAL 5,2)
      const confidenceScore = confidence <= 1.0 ? confidence * 100 : confidence;

      // 1. Insert into MySQL `skin_analysis`
      const [resDb]: any = await pool.query(
        `INSERT INTO skin_analysis (user_id, image_path, skin_tone, undertone, confidence_score, explanation)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [userId, imagePath, skinTone, undertone, confidenceScore, explanation]
      );

      const analysisId = resDb.insertId;

      // Update user's profile with their calibrated complexion
      try {
        await pool.query(
          'UPDATE users SET skin_tone = ?, undertone = ? WHERE user_id = ?',
          [skinTone, undertone, userId]
        );
      } catch (uErr) {
        console.warn('Could not update user skin tone in users table:', uErr);
      }

      // 2. Generate and store top personalized makeup recommendations in MySQL
      const matchingProducts = await RecommendationService.getUserRecommendations(userId, {
        skinTone,
        undertone,
      });

      // Clear any prior auto-generated recommendations and insert fresh ones
      await pool.query('DELETE FROM recommendations WHERE user_id = ? AND analysis_id IS NOT NULL', [userId]);

      for (const prod of matchingProducts.slice(0, 6)) {
        await pool.query(
          `INSERT INTO recommendations (user_id, analysis_id, product_id, score, reason)
           VALUES (?, ?, ?, ?, ?)`,
          [
            userId,
            analysisId,
            prod.productId,
            prod.matchPercentage,
            `Complexion Match (${prod.matchPercentage}%): Tailored for ${skinTone} depth and ${undertone} undertone complexion.`,
          ]
        );
      }

      return res.status(201).json({
        success: true,
        message: 'Skin analysis confirmed and saved to MySQL.',
        data: {
          analysisId,
          userId,
          skinTone,
          undertone,
          confidenceScore,
          explanation,
          analyzedAt: new Date().toISOString(),
        },
      });
    } catch (err: any) {
      console.error('[Confirm Analysis Error]:', err);
      return res.status(500).json({
        success: false,
        error: `Database error while saving analysis: ${err.message}`,
      });
    }
  }
}
