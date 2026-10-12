import { Request, Response } from 'express';
import { AvailabilityService } from '../services/availabilityService';

export class AvailabilityController {
  static async getAvailability(req: Request, res: Response) {
    try {
      const { productId, country } = req.query;
      const records = await AvailabilityService.getAvailability({
        productId: productId ? Number(productId) : undefined,
        country: country as string,
      });

      return res.json({
        success: true,
        count: records.length,
        data: records,
      });
    } catch (err: any) {
      return res.status(500).json({
        success: false,
        error: `Database unavailable: ${err.message}`,
      });
    }
  }
}
