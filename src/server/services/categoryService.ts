import { pool } from '../config/db';

export class CategoryService {
  static async getAllCategories() {
    const query = `
      SELECT 
        c.category_id,
        c.category_name,
        c.description,
        COUNT(p.product_id) as product_count
      FROM categories c
      LEFT JOIN products p ON c.category_id = p.category_id AND p.is_active = 1
      GROUP BY c.category_id
      ORDER BY c.category_name ASC
    `;
    const [rows]: any = await pool.query(query);
    return rows.map((r: any) => ({
      categoryId: r.category_id,
      categoryName: r.category_name,
      description: r.description,
      productCount: Number(r.product_count),
    }));
  }

  static async createCategory(data: { categoryName: string; description?: string }) {
    const { categoryName, description = '' } = data;
    const [res]: any = await pool.query(
      `INSERT INTO categories (category_name, description) VALUES (?, ?)`,
      [categoryName, description]
    );
    return {
      categoryId: res.insertId,
      categoryName,
      description,
      productCount: 0,
    };
  }
}
