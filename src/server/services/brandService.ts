import { pool } from '../config/db';

export class BrandService {
  static async getAllBrands() {
    const query = `
      SELECT 
        b.brand_id,
        b.brand_name,
        b.country_origin,
        b.website,
        COUNT(p.product_id) as product_count
      FROM brands b
      LEFT JOIN products p ON b.brand_id = p.brand_id AND p.is_active = 1
      GROUP BY b.brand_id
      ORDER BY b.brand_name ASC
    `;
    const [rows]: any = await pool.query(query);
    return rows.map((r: any) => ({
      brandId: r.brand_id,
      brandName: r.brand_name,
      countryOrigin: r.country_origin,
      website: r.website,
      productCount: Number(r.product_count),
    }));
  }

  static async createBrand(data: { brandName: string; countryOrigin?: string; website?: string }) {
    const { brandName, countryOrigin = 'International', website = '' } = data;
    const [res]: any = await pool.query(
      `INSERT INTO brands (brand_name, country_origin, website) VALUES (?, ?, ?)`,
      [brandName, countryOrigin, website]
    );
    return {
      brandId: res.insertId,
      brandName,
      countryOrigin,
      website,
      productCount: 0,
    };
  }
}
