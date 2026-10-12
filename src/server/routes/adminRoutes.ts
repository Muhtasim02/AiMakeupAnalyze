import { Router, Response } from 'express';
import { requireAuth, requireAdmin, AuthRequest } from '../middleware/auth';
import { pool } from '../config/db';
import { IngestionService, IngestedProductItem } from '../services/ingestionService';

const router = Router();

/**
 * GET /api/admin/stats
 * Provides basic application statistics for the Admin Dashboard overview.
 */
router.get('/stats', requireAuth, requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const [productCountRows]: any = await pool.query('SELECT COUNT(*) as total, SUM(CASE WHEN is_active = 1 THEN 1 ELSE 0 END) as active FROM products');
    const [brandCountRows]: any = await pool.query('SELECT COUNT(*) as total FROM brands');
    const [categoryCountRows]: any = await pool.query('SELECT COUNT(*) as total FROM categories');
    const [userCountRows]: any = await pool.query('SELECT COUNT(*) as total FROM users');

    return res.json({
      success: true,
      stats: {
        totalProducts: productCountRows[0]?.total || 0,
        activeProducts: productCountRows[0]?.active || 0,
        totalBrands: brandCountRows[0]?.total || 0,
        totalCategories: categoryCountRows[0]?.total || 0,
        totalUsers: userCountRows[0]?.total || 0,
      },
    });
  } catch (err: any) {
    console.error('Admin Stats Error:', err);
    return res.status(500).json({
      success: false,
      error: `Failed to retrieve admin stats: ${err.message}`,
    });
  }
});

/**
 * Unified Live URL Product Fetcher & Direct Importer (Daraz, Amazon, Sephora, Shajgoj, Brand sites)
 * Workflow: Enter product source -> Preview -> Validate -> Confirm import -> Save to database
 */
router.post('/import-url', requireAuth, requireAdmin, async (req: AuthRequest, res: Response) => {
  const { url, autoSave = false, customData } = req.body;

  if (!url || typeof url !== 'string' || !url.startsWith('http')) {
    return res.status(400).json({
      success: false,
      error: 'Valid HTTP/HTTPS product URL is required.',
    });
  }

  try {
    // 1. Fetch info from the URL
    const extractedItem = await IngestionService.previewFromUrl(url);

    // Merge any user overrides
    const finalItem: IngestedProductItem = {
      ...extractedItem,
      ...(customData || {}),
      purchaseLink: url,
      sourceUrl: url,
    };

    let productId: number | null = null;
    if (autoSave) {
      productId = await IngestionService.persistProductToDatabase(finalItem);
    }

    return res.json({
      success: true,
      message: autoSave
        ? `Successfully saved "${finalItem.productName}" into product catalog (ID #${productId}).`
        : `Successfully extracted product preview from ${url}.`,
      data: finalItem,
      saved: autoSave,
      productId,
    });
  } catch (err: any) {
    console.error('URL Import Error:', err);
    return res.status(500).json({
      success: false,
      error: err.message || 'Failed to extract and import product data from the provided URL.',
    });
  }
});

/**
 * POST /api/admin/save-imported-product
 * Explicitly saves verified product and all its confirmed shades into catalog
 */
router.post('/save-imported-product', requireAuth, requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const { product } = req.body;
    if (!product || !product.productName || !product.brandName) {
      return res.status(400).json({
        success: false,
        error: 'Product name and brand are required.',
      });
    }

    const productId = await IngestionService.persistProductToDatabase(product);
    return res.status(201).json({
      success: true,
      message: `Product "${product.productName}" and ${product.shades?.length || 0} shades successfully saved to database.`,
      productId,
    });
  } catch (err: any) {
    console.error('Save Imported Product Error:', err);
    return res.status(500).json({
      success: false,
      error: err.message || 'Failed to save imported product.',
    });
  }
});

/**
 * GET /api/admin/users-overview
 * Returns basic registered user information for administrative account review.
 * Avoids exposing private favorites, orders, or personal complexions.
 */
router.get('/users-overview', requireAuth, requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const [userRows]: any = await pool.query(`
      SELECT user_id, name, email, role, country, budget,
             COALESCE(last_login_at, created_at) as last_login_at,
             created_at
      FROM users
      ORDER BY user_id DESC
    `);

    const users = (userRows || []).map((u: any) => ({
      userId: u.user_id,
      name: u.name,
      email: u.email,
      role: u.role,
      country: u.country,
      budget: u.budget,
      lastLoginAt: u.last_login_at,
      createdAt: u.created_at,
      status: 'Active',
    }));

    return res.json({
      success: true,
      count: users.length,
      users,
    });
  } catch (err: any) {
    console.error('Users Overview Error:', err);
    return res.status(500).json({
      success: false,
      error: `Failed to retrieve users overview: ${err.message}`,
    });
  }
});

export default router;
