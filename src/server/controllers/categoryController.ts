import { Request, Response } from 'express';
import { CategoryService } from '../services/categoryService';

export class CategoryController {
  static async getCategories(req: Request, res: Response) {
    try {
      const categories = await CategoryService.getAllCategories();
      return res.json({
        success: true,
        count: categories.length,
        data: categories,
      });
    } catch (err: any) {
      return res.status(500).json({
        success: false,
        error: `Database unavailable: ${err.message}`,
      });
    }
  }

  static async createCategory(req: Request, res: Response) {
    try {
      const { categoryName, description } = req.body;
      if (!categoryName) {
        return res.status(400).json({ success: false, error: 'Category name is required.' });
      }
      const category = await CategoryService.createCategory({ categoryName, description });
      return res.status(201).json({
        success: true,
        message: 'Category added successfully.',
        data: category,
      });
    } catch (err: any) {
      return res.status(500).json({
        success: false,
        error: `Failed to add category: ${err.message}`,
      });
    }
  }
}
