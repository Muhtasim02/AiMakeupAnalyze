import { Request, Response } from 'express';
import { ProductService } from '../services/productService';

export class ProductController {
  static async getProducts(req: Request, res: Response) {
    try {
      const {
        category,
        brand,
        country,
        maxPrice,
        minPrice,
        skinTone,
        undertone,
        availability,
        search,
        sort,
      } = req.query;

      const products = await ProductService.getProducts({
        category: category as string,
        brand: brand as string,
        country: country as string,
        maxPrice: maxPrice ? Number(maxPrice) : undefined,
        minPrice: minPrice ? Number(minPrice) : undefined,
        skinTone: skinTone as string,
        undertone: undertone as string,
        availability: availability as string,
        search: search as string,
        sort: sort as any,
      });

      return res.json({
        success: true,
        count: products.length,
        data: products,
      });
    } catch (err: any) {
      console.error('Error in getProducts controller:', err);
      return res.status(500).json({
        success: false,
        error: `Database unavailable: ${err.message}`,
      });
    }
  }

  static async getProductById(req: Request, res: Response) {
    try {
      const idParam = req.params.id;
      const numericId = Number(idParam.replace('prod_', ''));
      const country = (req.query.country as string) || 'Bangladesh';

      if (isNaN(numericId)) {
        return res.status(400).json({
          success: false,
          error: 'Invalid product ID format.',
        });
      }

      const product = await ProductService.getProductById(numericId, country);
      return res.json({
        success: true,
        data: product,
      });
    } catch (err: any) {
      return res.status(404).json({
        success: false,
        error: err.message || 'Product not found.',
      });
    }
  }

  static async search(req: Request, res: Response) {
    try {
      const query = (req.query.q as string) || (req.query.search as string) || '';
      const products = await ProductService.searchProducts(query);
      return res.json({
        success: true,
        count: products.length,
        data: products,
      });
    } catch (err: any) {
      return res.status(500).json({
        success: false,
        error: err.message || 'Search failed.',
      });
    }
  }

  static async getProductVariants(req: Request, res: Response) {
    try {
      const idParam = req.params.id;
      const numericId = Number(idParam.replace('prod_', ''));

      if (isNaN(numericId)) {
        return res.status(400).json({
          success: false,
          error: 'Invalid product ID format.',
        });
      }

      const variants = await ProductService.getProductVariants(numericId);
      return res.json({
        success: true,
        count: variants.length,
        data: variants,
      });
    } catch (err: any) {
      return res.status(500).json({
        success: false,
        error: err.message || 'Failed to fetch variants.',
      });
    }
  }

  static async addVariant(req: Request, res: Response) {
    try {
      const idParam = req.params.id;
      const numericId = Number(idParam.replace('prod_', ''));

      if (isNaN(numericId)) {
        return res.status(400).json({
          success: false,
          error: 'Invalid product ID.',
        });
      }

      const { shadeName } = req.body;
      if (!shadeName || typeof shadeName !== 'string' || !shadeName.trim()) {
        return res.status(400).json({
          success: false,
          error: 'Shade name is required.',
        });
      }

      const variant = await ProductService.addVariant(numericId, req.body);
      return res.status(201).json({
        success: true,
        message: 'Shade variant successfully added.',
        data: variant,
      });
    } catch (err: any) {
      return res.status(500).json({
        success: false,
        error: `Failed to add shade variant: ${err.message}`,
      });
    }
  }

  static async updateVariant(req: Request, res: Response) {
    try {
      const variantIdParam = req.params.variantId;
      const variantId = Number(variantIdParam);

      if (isNaN(variantId)) {
        return res.status(400).json({
          success: false,
          error: 'Invalid variant ID.',
        });
      }

      const updated = await ProductService.updateVariant(variantId, req.body);
      return res.json({
        success: true,
        message: 'Shade variant successfully updated.',
        data: updated,
      });
    } catch (err: any) {
      return res.status(500).json({
        success: false,
        error: `Failed to update shade variant: ${err.message}`,
      });
    }
  }

  static async deleteVariant(req: Request, res: Response) {
    try {
      const variantIdParam = req.params.variantId;
      const variantId = Number(variantIdParam);

      if (isNaN(variantId)) {
        return res.status(400).json({
          success: false,
          error: 'Invalid variant ID.',
        });
      }

      const result = await ProductService.deleteVariant(variantId);
      return res.json({
        success: true,
        message: result.message,
      });
    } catch (err: any) {
      return res.status(500).json({
        success: false,
        error: `Failed to delete shade variant: ${err.message}`,
      });
    }
  }

  static async createProduct(req: Request, res: Response) {
    try {
      const {
        name,
        brandId,
        categoryId,
        description,
        price,
        currency,
        imageUrl,
        skinTone,
        undertone,
        shadeName,
        country,
        isAvailable,
        purchaseLink,
        sourceUrl,
        variants,
      } = req.body;

      if (!name || !brandId || !categoryId) {
        return res.status(400).json({
          success: false,
          error: 'Name, brandId, and categoryId are required.',
        });
      }

      const product = await ProductService.createProduct({
        name,
        brandId: Number(brandId),
        categoryId: Number(categoryId),
        description,
        price: price ? Number(price) : 0,
        currency,
        imageUrl,
        skinTone,
        undertone,
        shadeName,
        country,
        isAvailable: isAvailable !== false,
        purchaseLink: purchaseLink || sourceUrl,
        sourceUrl: sourceUrl || purchaseLink,
        variants,
      });

      return res.status(201).json({
        success: true,
        message: 'Product successfully created.',
        data: product,
      });
    } catch (err: any) {
      console.error('Error creating product:', err);
      return res.status(500).json({
        success: false,
        error: `Failed to create product: ${err.message}`,
      });
    }
  }

  static async updateProduct(req: Request, res: Response) {
    try {
      const idParam = req.params.id;
      const numericId = Number(idParam.replace('prod_', ''));

      if (isNaN(numericId)) {
        return res.status(400).json({
          success: false,
          error: 'Invalid product ID.',
        });
      }

      const product = await ProductService.updateProduct(numericId, req.body);
      return res.json({
        success: true,
        message: 'Product successfully updated.',
        data: product,
      });
    } catch (err: any) {
      console.error('Error updating product:', err);
      return res.status(500).json({
        success: false,
        error: `Failed to update product: ${err.message}`,
      });
    }
  }

  static async deactivateProduct(req: Request, res: Response) {
    try {
      const idParam = req.params.id;
      const numericId = Number(idParam.replace('prod_', ''));

      if (isNaN(numericId)) {
        return res.status(400).json({
          success: false,
          error: 'Invalid product ID.',
        });
      }

      const permanent = req.query.permanent === 'true' || req.body?.permanent === true;
      if (permanent) {
        const result = await ProductService.deleteProduct(numericId);
        return res.json({
          success: true,
          message: 'Product permanently deleted.',
          data: result,
        });
      }

      const result = await ProductService.deactivateProduct(numericId);
      return res.json({
        success: true,
        message: 'Product successfully deactivated.',
        data: result,
      });
    } catch (err: any) {
      return res.status(500).json({
        success: false,
        error: `Failed to remove product: ${err.message}`,
      });
    }
  }

  static async deleteProduct(req: Request, res: Response) {
    try {
      const idParam = req.params.id;
      const numericId = Number(idParam.replace('prod_', ''));

      if (isNaN(numericId)) {
        return res.status(400).json({
          success: false,
          error: 'Invalid product ID.',
        });
      }

      const result = await ProductService.deleteProduct(numericId);
      return res.json({
        success: true,
        message: result.message,
        data: result,
      });
    } catch (err: any) {
      return res.status(500).json({
        success: false,
        error: `Failed to delete product: ${err.message}`,
      });
    }
  }

  static async updateAvailability(req: Request, res: Response) {
    try {
      const idParam = req.params.id;
      const numericId = Number(idParam.replace('prod_', ''));
      const { country = 'Bangladesh', isAvailable = true, localPrice, currency, purchaseLink } = req.body;

      if (isNaN(numericId)) {
        return res.status(400).json({
          success: false,
          error: 'Invalid product ID.',
        });
      }

      const product = await ProductService.updateProductAvailability(numericId, {
        country,
        isAvailable: Boolean(isAvailable),
        localPrice: localPrice !== undefined ? Number(localPrice) : undefined,
        currency,
        purchaseLink,
      });

      return res.json({
        success: true,
        message: 'Product availability and price updated.',
        data: product,
      });
    } catch (err: any) {
      return res.status(500).json({
        success: false,
        error: `Failed to update availability: ${err.message}`,
      });
    }
  }
}
