import { Request, Response } from 'express';
import { BrandService } from '../services/brandService';

export class BrandController {
  static async getBrands(req: Request, res: Response) {
    try {
      const brands = await BrandService.getAllBrands();
      return res.json({
        success: true,
        count: brands.length,
        data: brands,
      });
    } catch (err: any) {
      return res.status(500).json({
        success: false,
        error: `Database unavailable: ${err.message}`,
      });
    }
  }

  static async createBrand(req: Request, res: Response) {
    try {
      const { brandName, countryOrigin, website } = req.body;
      if (!brandName) {
        return res.status(400).json({ success: false, error: 'Brand name is required.' });
      }
      const brand = await BrandService.createBrand({ brandName, countryOrigin, website });
      return res.status(201).json({
        success: true,
        message: 'Brand added successfully.',
        data: brand,
      });
    } catch (err: any) {
      return res.status(500).json({
        success: false,
        error: `Failed to add brand: ${err.message}`,
      });
    }
  }
}
