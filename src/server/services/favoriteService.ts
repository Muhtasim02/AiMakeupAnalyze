import { pool } from '../config/db';

export class FavoriteService {
  static async getUserFavorites(userId: number) {
    const query = `
      SELECT 
        f.favorite_id,
        COALESCE(f.saved_at, CURRENT_TIMESTAMP) as created_at,
        p.product_id,
        p.product_name,
        p.description,
        p.price,
        p.currency,
        p.image_url,
        p.skin_tone,
        p.undertone,
        p.shade_name,
        b.brand_name,
        c.category_name
      FROM favorites f
      INNER JOIN products p ON f.product_id = p.product_id
      INNER JOIN brands b ON p.brand_id = b.brand_id
      INNER JOIN categories c ON p.category_id = c.category_id
      WHERE f.user_id = ?
      ORDER BY f.favorite_id DESC
    `;
    const [rows]: any = await pool.query(query, [userId]);
    return rows.map((r: any) => ({
      favoriteId: r.favorite_id,
      id: `prod_${r.product_id}`,
      productId: r.product_id,
      name: r.product_name,
      description: r.description,
      brand: r.brand_name,
      category: r.category_name,
      price: Number(r.price),
      currency: r.currency || '৳',
      imageUrl: r.image_url,
      image: r.image_url,
      skinTone: r.skin_tone,
      undertone: r.undertone,
      shade: r.shade_name,
      shadeName: r.shade_name,
      matchPercentage: r.skin_tone === 'Medium' && r.undertone === 'Warm' ? 92 : 87,
      availability: 'In Stock',
      createdAt: r.created_at,
    }));
  }

  static async addFavorite(userId: number, productId: number) {
    // Check if already favorited
    const [existing]: any = await pool.query(
      'SELECT favorite_id FROM favorites WHERE user_id = ? AND product_id = ?',
      [userId, productId]
    );

    if (existing.length > 0) {
      return { success: true, message: 'Product already in favorites.', favoriteId: existing[0].favorite_id };
    }

    const [res]: any = await pool.query(
      'INSERT INTO favorites (user_id, product_id) VALUES (?, ?)',
      [userId, productId]
    );

    return {
      success: true,
      message: 'Product added to favorites successfully.',
      favoriteId: res.insertId,
    };
  }

  static async removeFavorite(userId: number, productId: number) {
    await pool.query(
      'DELETE FROM favorites WHERE user_id = ? AND (product_id = ? OR favorite_id = ?)',
      [userId, productId, productId]
    );
    return {
      success: true,
      message: 'Product removed from favorites.',
    };
  }
}
