import { pool } from '../config/db';

export class AvailabilityService {
  static async getAvailability(filters: { productId?: number; country?: string }) {
    let query = `
      SELECT 
        pa.availability_id,
        pa.product_id,
        p.product_name,
        b.brand_name,
        pa.country,
        pa.is_available,
        pa.purchase_link,
        pa.local_price,
        pa.currency
      FROM product_availability pa
      INNER JOIN products p ON pa.product_id = p.product_id
      INNER JOIN brands b ON p.brand_id = b.brand_id
      WHERE 1=1
    `;
    const params: any[] = [];

    if (filters.productId) {
      query += ' AND pa.product_id = ?';
      params.push(filters.productId);
    }
    if (filters.country && filters.country !== 'All') {
      query += ' AND pa.country = ?';
      params.push(filters.country);
    }

    query += ' ORDER BY pa.country ASC, p.product_name ASC';

    const [rows]: any = await pool.query(query, params);
    return rows.map((r: any) => ({
      availabilityId: r.availability_id,
      productId: r.product_id,
      productName: r.product_name,
      brandName: r.brand_name,
      country: r.country,
      isAvailable: r.is_available === 1,
      purchaseLink: r.purchase_link,
      localPrice: Number(r.local_price),
      currency: r.currency,
    }));
  }
}
