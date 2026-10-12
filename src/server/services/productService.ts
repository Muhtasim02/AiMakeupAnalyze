import { pool } from '../config/db';

export interface ProductFilterParams {
  category?: string;
  brand?: string;
  country?: string;
  maxPrice?: number;
  minPrice?: number;
  skinTone?: string;
  undertone?: string;
  availability?: string | boolean;
  search?: string;
  sort?: 'best_match' | 'lowest_price' | 'highest_price' | 'highest_match' | 'newest';
}

export interface VariantInput {
  variantId?: number;
  shadeName: string;
  shadeNumber?: string;
  colorFamily?: string;
  swatchHex?: string;
  swatchImageUrl?: string;
  skinTone?: string;
  undertone?: string;
  imageUrl?: string;
  purchaseLink?: string;
  isVerified?: boolean;
  isActive?: boolean;
}

export interface CreateProductInput {
  name: string;
  brandId: number;
  categoryId: number;
  description?: string;
  price?: number;
  currency?: string;
  imageUrl?: string;
  officialUrl?: string;
  sourceUrl?: string;
  skinTone?: string;
  undertone?: string;
  shadeName?: string;
  country?: string;
  isAvailable?: boolean;
  purchaseLink?: string;
  hasVariants?: boolean;
  variants?: VariantInput[];
}

export interface UpdateProductInput {
  name?: string;
  brandId?: number;
  categoryId?: number;
  description?: string;
  price?: number;
  currency?: string;
  imageUrl?: string;
  officialUrl?: string;
  sourceUrl?: string;
  purchaseLink?: string;
  skinTone?: string;
  undertone?: string;
  shadeName?: string;
  hasVariants?: boolean;
  variants?: VariantInput[];
}

export class ProductService {
  /**
   * Fetch catalog products with parameterized SQL, accurate variant counts,
   * case-insensitive search across products, brands, categories, descriptions, and shade variants.
   */
  static async getProducts(filters: ProductFilterParams = {}) {
    const {
      category,
      brand,
      country = 'Bangladesh',
      maxPrice,
      minPrice,
      skinTone,
      undertone,
      availability,
      search,
      sort = 'best_match',
    } = filters;

    let query = `
      SELECT 
        p.product_id,
        p.product_name,
        p.description,
        p.price,
        p.currency,
        p.image_url,
        p.skin_tone,
        p.undertone,
        p.shade_name,
        p.official_url,
        p.verification_status,
        p.has_variants,
        p.is_active,
        p.created_at,
        b.brand_id,
        b.brand_name,
        b.country_origin,
        b.website as brand_website,
        c.category_id,
        c.category_name,
        (SELECT COUNT(*) FROM product_variants pv WHERE pv.product_id = p.product_id AND pv.is_active = 1) as variant_count,
        COALESCE(pa.is_available, 0) as is_available,
        COALESCE(pa.country, ?) as availability_country,
        COALESCE(pa.local_price, p.price) as local_price,
        COALESCE(pa.currency, p.currency) as local_currency,
        COALESCE(pa.purchase_link, p.official_url, '#') as purchase_link
      FROM products p
      INNER JOIN brands b ON p.brand_id = b.brand_id
      INNER JOIN categories c ON p.category_id = c.category_id
      LEFT JOIN product_availability pa ON p.product_id = pa.product_id 
        ${country && country !== 'All' ? 'AND pa.country = ?' : ''}
      WHERE p.is_active = 1
    `;

    const params: any[] = [country];
    if (country && country !== 'All') {
      params.push(country);
    }

    if (category && category !== 'All') {
      if (!isNaN(Number(category))) {
        query += ' AND c.category_id = ?';
        params.push(Number(category));
      } else {
        query += ' AND LOWER(c.category_name) = LOWER(?)';
        params.push(category);
      }
    }

    if (brand && brand !== 'All') {
      if (!isNaN(Number(brand))) {
        query += ' AND b.brand_id = ?';
        params.push(Number(brand));
      } else {
        query += ' AND LOWER(b.brand_name) = LOWER(?)';
        params.push(brand);
      }
    }

    if (skinTone && skinTone !== 'All') {
      query += ` AND (
        p.skin_tone = ? OR 
        EXISTS (SELECT 1 FROM product_variants pv WHERE pv.product_id = p.product_id AND pv.skin_tone = ?)
      )`;
      params.push(skinTone, skinTone);
    }

    if (undertone && undertone !== 'All') {
      query += ` AND (
        p.undertone = ? OR 
        EXISTS (SELECT 1 FROM product_variants pv WHERE pv.product_id = p.product_id AND pv.undertone = ?)
      )`;
      params.push(undertone, undertone);
    }

    if (maxPrice !== undefined && !isNaN(Number(maxPrice))) {
      query += ' AND (pa.local_price <= ? OR (pa.local_price IS NULL AND p.price <= ?))';
      params.push(Number(maxPrice), Number(maxPrice));
    }

    if (minPrice !== undefined && !isNaN(Number(minPrice))) {
      query += ' AND (pa.local_price >= ? OR (pa.local_price IS NULL AND p.price >= ?))';
      params.push(Number(minPrice), Number(minPrice));
    }

    if (availability !== undefined && availability !== 'All' && availability !== '') {
      const isAvail = availability === true || availability === 'true' || availability === '1';
      query += ' AND pa.is_available = ?';
      params.push(isAvail ? 1 : 0);
    }

    // Comprehensive search matching product name, brand, category, description, and shade variants
    if (search && search.trim() !== '') {
      const cleanSearch = `%${search.trim().toLowerCase()}%`;
      query += ` AND (
        LOWER(p.product_name) LIKE ? OR 
        LOWER(p.description) LIKE ? OR 
        LOWER(b.brand_name) LIKE ? OR 
        LOWER(c.category_name) LIKE ? OR
        EXISTS (
          SELECT 1 FROM product_variants pv 
          WHERE pv.product_id = p.product_id AND LOWER(pv.shade_name) LIKE ?
        )
      )`;
      params.push(cleanSearch, cleanSearch, cleanSearch, cleanSearch, cleanSearch);
    }

    // Grouping
    query += ' GROUP BY p.product_id';

    // Sorting
    if (sort === 'lowest_price') {
      query += ' ORDER BY COALESCE(pa.local_price, p.price) ASC';
    } else if (sort === 'highest_price') {
      query += ' ORDER BY COALESCE(pa.local_price, p.price) DESC';
    } else if (sort === 'newest') {
      query += ' ORDER BY p.created_at DESC';
    } else {
      query += ' ORDER BY p.product_id ASC';
    }

    const [rows]: any = await pool.query(query, params);

    const mapped = rows.map((r: any) => {
      const isAvail = Boolean(r.is_available === 1 || r.is_available === true);
      const vCount = Number(r.variant_count || 0);

      return {
        id: `prod_${r.product_id}`,
        productId: r.product_id,
        name: r.product_name,
        description: r.description,
        brand: r.brand_name,
        brandId: r.brand_id,
        brandOrigin: r.country_origin,
        brandWebsite: r.brand_website,
        officialUrl: r.official_url || r.brand_website,
        category: r.category_name,
        categoryId: r.category_id,
        price: Number(r.local_price || r.price),
        currency: r.local_currency || r.currency || '৳',
        imageUrl: r.image_url,
        image: r.image_url,
        skinTone: r.skin_tone,
        undertone: r.undertone,
        shade: r.shade_name,
        shadeName: r.shade_name,
        hasVariants: Boolean(r.has_variants === 1 || vCount > 0),
        variantCount: vCount,
        matchPercentage: 90,
        availability: isAvail ? `Available in ${country}` : `Not currently available in ${country}`,
        isAvailableInCountry: isAvail,
        country: r.availability_country,
        localPrice: Number(r.local_price || r.price),
        localCurrency: r.local_currency || r.currency,
        purchaseLink: r.purchase_link || r.official_url || '#',
        sourceUrl: r.purchase_link || r.official_url || '#',
        verificationStatus: r.verification_status || 'VERIFIED',
      };
    });

    // Fetch real variants for all returned products from product_variants table
    const productIds = mapped.map((m: any) => m.productId);
    const variantsByProductId = new Map<number, any[]>();

    if (productIds.length > 0) {
      try {
        const [variantRows]: any = await pool.query(
          `SELECT variant_id, product_id, shade_name, shade_number, color_family, swatch_hex, swatch_image_url, skin_tone, undertone, image_url, purchase_link, is_verified, is_active
           FROM product_variants
           WHERE is_active = 1
           ORDER BY variant_id ASC`
        );
        for (const v of variantRows || []) {
          if (!variantsByProductId.has(v.product_id)) {
            variantsByProductId.set(v.product_id, []);
          }
          variantsByProductId.get(v.product_id)!.push({
            variantId: v.variant_id,
            productId: v.product_id,
            shadeName: v.shade_name,
            shadeNumber: v.shade_number,
            colorFamily: v.color_family,
            swatchHex: v.swatch_hex,
            swatchImageUrl: v.swatch_image_url,
            skinTone: v.skin_tone,
            undertone: v.undertone,
            imageUrl: v.image_url,
            purchaseLink: v.purchase_link,
            price: undefined,
            isVerified: v.is_verified === 1,
            isActive: v.is_active === 1,
          });
        }
      } catch (err: any) {
        console.warn('Error loading product_variants in getProducts:', err.message);
      }
    }

    // Attach real variants and group if legacy duplicates exist
    const groupedMap = new Map<string, any>();

    for (const item of mapped) {
      const cleanName = item.name.replace(/\s*\([^)]*\)\s*$/, '').trim();
      const groupKey = `${item.brand.toLowerCase()}___${cleanName.toLowerCase()}`;

      // Real variants from database
      const dbVariants = variantsByProductId.get(item.productId) || [];

      let itemVariants = dbVariants.length > 0 ? [...dbVariants] : [
        {
          variantId: item.productId,
          productId: item.productId,
          shadeName: item.shade || 'Default Shade',
          skinTone: item.skinTone || 'Medium',
          undertone: item.undertone || 'Warm',
          imageUrl: item.imageUrl,
          purchaseLink: item.purchaseLink,
          price: item.price,
          isVerified: true,
          isActive: true,
        }
      ];

      if (!groupedMap.has(groupKey)) {
        groupedMap.set(groupKey, {
          ...item,
          name: cleanName,
          variants: itemVariants,
          hasVariants: itemVariants.length > 1,
          variantCount: itemVariants.length,
          shade: itemVariants[0]?.shadeName || item.shade,
          shadeName: itemVariants[0]?.shadeName || item.shadeName,
        });
      } else {
        const existing = groupedMap.get(groupKey)!;
        // Merge any additional variants into existing group
        for (const iv of itemVariants) {
          const exists = existing.variants.some((v: any) => v.shadeName.toLowerCase() === iv.shadeName.toLowerCase());
          if (!exists) {
            existing.variants.push(iv);
          }
        }
        existing.variantCount = existing.variants.length;
        existing.hasVariants = existing.variants.length > 1;
      }
    }

    const deduplicated = Array.from(groupedMap.values()).map((p) => {
      // If skinTone filter was requested, pick the variant matching that skinTone
      if (skinTone && skinTone !== 'All') {
        const matchingVariant =
          p.variants.find(
            (v: any) =>
              v.skinTone?.toLowerCase() === skinTone.toLowerCase() &&
              (!undertone || undertone === 'All' || v.undertone?.toLowerCase() === undertone.toLowerCase())
          ) || p.variants.find((v: any) => v.skinTone?.toLowerCase() === skinTone.toLowerCase());

        if (matchingVariant) {
          p.shade = matchingVariant.shadeName;
          p.shadeName = matchingVariant.shadeName;
          p.skinTone = matchingVariant.skinTone;
          p.undertone = matchingVariant.undertone;
          p.imageUrl = matchingVariant.imageUrl || p.imageUrl;
          p.image = p.imageUrl;
          p.purchaseLink = matchingVariant.purchaseLink || p.purchaseLink;
          p.sourceUrl = matchingVariant.purchaseLink || p.sourceUrl;
        }
      }
      return p;
    });

    return deduplicated;
  }

  /**
   * Fetch single product with all associated real verified shade variants and regional availability
   */
  static async getProductById(productId: number, country: string = 'Bangladesh') {
    const query = `
      SELECT 
        p.product_id,
        p.product_name,
        p.description,
        p.price,
        p.currency,
        p.image_url,
        p.skin_tone,
        p.undertone,
        p.shade_name,
        p.official_url,
        p.verification_status,
        p.has_variants,
        p.is_active,
        p.created_at,
        b.brand_id,
        b.brand_name,
        b.country_origin,
        b.website as brand_website,
        c.category_id,
        c.category_name,
        c.description as category_description
      FROM products p
      INNER JOIN brands b ON p.brand_id = b.brand_id
      INNER JOIN categories c ON p.category_id = c.category_id
      WHERE p.product_id = ?
    `;

    const [rows]: any = await pool.query(query, [productId]);
    if (rows.length === 0) {
      throw new Error(`Product with ID ${productId} not found.`);
    }

    const p = rows[0];

    // 1. Fetch real variants for this product
    const [variantRows]: any = await pool.query(
      `SELECT variant_id, product_id, shade_name, shade_number, color_family, swatch_hex, swatch_image_url, skin_tone, undertone, image_url, purchase_link, is_verified, is_active
       FROM product_variants 
       WHERE product_id = ? AND is_active = 1
       ORDER BY variant_id ASC`,
      [productId]
    );

    // 2. Fetch availability across all countries
    const [availRows]: any = await pool.query(
      `SELECT availability_id, country, is_available, purchase_link, local_price, currency 
       FROM product_availability WHERE product_id = ?`,
      [productId]
    );

    const countryAvail = availRows.find((a: any) => a.country.toLowerCase() === country.toLowerCase());
    const isAvailInSelectedCountry = countryAvail ? countryAvail.is_available === 1 : false;

    const variants = (variantRows || []).map((v: any) => ({
      variantId: v.variant_id,
      productId: v.product_id,
      shadeName: v.shade_name,
      shadeNumber: v.shade_number,
      colorFamily: v.color_family,
      swatchHex: v.swatch_hex,
      swatchImageUrl: v.swatch_image_url,
      skinTone: v.skin_tone,
      undertone: v.undertone,
      imageUrl: v.image_url || p.image_url,
      purchaseLink: v.purchase_link || countryAvail?.purchase_link || p.official_url,
      isVerified: v.is_verified === 1,
      isActive: v.is_active === 1,
    }));

    return {
      id: `prod_${p.product_id}`,
      productId: p.product_id,
      name: p.product_name,
      description: p.description,
      brand: p.brand_name,
      brandId: p.brand_id,
      brandOrigin: p.country_origin,
      brandWebsite: p.brand_website,
      officialUrl: p.official_url || p.brand_website,
      category: p.category_name,
      categoryId: p.category_id,
      categoryDescription: p.category_description,
      price: Number(countryAvail?.local_price || p.price),
      currency: countryAvail?.currency || p.currency || '৳',
      imageUrl: p.image_url,
      image: p.image_url,
      skinTone: p.skin_tone,
      undertone: p.undertone,
      shade: p.shade_name,
      shadeName: p.shade_name,
      hasVariants: Boolean(p.has_variants === 1 || variants.length > 0),
      variantCount: variants.length,
      variants,
      matchPercentage: 92,
      availability: isAvailInSelectedCountry ? `Available in ${country}` : `Not currently available in ${country}`,
      isAvailableInCountry: isAvailInSelectedCountry,
      purchaseLink: countryAvail?.purchase_link || p.official_url || '#',
      verificationStatus: p.verification_status || 'VERIFIED',
      availabilityList: availRows.map((a: any) => ({
        availabilityId: a.availability_id,
        country: a.country,
        isAvailable: a.is_available === 1,
        purchaseLink: a.purchase_link,
        localPrice: Number(a.local_price),
        currency: a.currency,
      })),
    };
  }

  /**
   * Fetch all variants for a specific product
   */
  static async getProductVariants(productId: number) {
    const [rows]: any = await pool.query(
      `SELECT pv.variant_id, pv.product_id, pv.shade_name, pv.shade_number, pv.color_family, pv.swatch_hex, pv.swatch_image_url,
              pv.skin_tone, pv.undertone, pv.image_url, pv.purchase_link, pv.is_verified, pv.is_active,
              p.product_name, b.brand_name
       FROM product_variants pv
       JOIN products p ON pv.product_id = p.product_id
       JOIN brands b ON p.brand_id = b.brand_id
       WHERE pv.product_id = ? AND pv.is_active = 1
       ORDER BY pv.variant_id ASC`,
      [productId]
    );

    return (rows || []).map((v: any) => ({
      variantId: v.variant_id,
      productId: v.product_id,
      productName: v.product_name,
      brandName: v.brand_name,
      shadeName: v.shade_name,
      shadeNumber: v.shade_number,
      colorFamily: v.color_family,
      swatchHex: v.swatch_hex,
      swatchImageUrl: v.swatch_image_url,
      skinTone: v.skin_tone,
      undertone: v.undertone,
      imageUrl: v.image_url,
      purchaseLink: v.purchase_link,
      isVerified: v.is_verified === 1,
      isActive: v.is_active === 1,
    }));
  }

  /**
   * Add a single shade variant to an existing product
   */
  static async addVariant(productId: number, data: VariantInput) {
    const {
      shadeName,
      shadeNumber = null,
      colorFamily = null,
      swatchHex = null,
      swatchImageUrl = null,
      skinTone = null,
      undertone = null,
      imageUrl = null,
      purchaseLink = null,
      isVerified = false,
    } = data;

    const [res]: any = await pool.query(
      `INSERT INTO product_variants (product_id, shade_name, shade_number, color_family, swatch_hex, swatch_image_url, skin_tone, undertone, image_url, purchase_link, is_verified, is_active)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)`,
      [
        productId,
        shadeName,
        shadeNumber,
        colorFamily,
        swatchHex,
        swatchImageUrl,
        skinTone,
        undertone,
        imageUrl,
        purchaseLink,
        isVerified ? 1 : 0,
      ]
    );

    await pool.query('UPDATE products SET has_variants = 1 WHERE product_id = ?', [productId]);

    return {
      variantId: res.insertId,
      productId,
      shadeName,
      shadeNumber,
      colorFamily,
      swatchHex,
      swatchImageUrl,
      skinTone,
      undertone,
      imageUrl,
      purchaseLink,
      isVerified: Boolean(isVerified),
      isActive: true,
    };
  }

  /**
   * Update a specific shade variant
   */
  static async updateVariant(variantId: number, data: Partial<VariantInput>) {
    const fields: string[] = [];
    const values: any[] = [];

    if (data.shadeName !== undefined) { fields.push('shade_name = ?'); values.push(data.shadeName); }
    if (data.shadeNumber !== undefined) { fields.push('shade_number = ?'); values.push(data.shadeNumber); }
    if (data.colorFamily !== undefined) { fields.push('color_family = ?'); values.push(data.colorFamily); }
    if (data.swatchHex !== undefined) { fields.push('swatch_hex = ?'); values.push(data.swatchHex); }
    if (data.swatchImageUrl !== undefined) { fields.push('swatch_image_url = ?'); values.push(data.swatchImageUrl); }
    if (data.skinTone !== undefined) { fields.push('skin_tone = ?'); values.push(data.skinTone); }
    if (data.undertone !== undefined) { fields.push('undertone = ?'); values.push(data.undertone); }
    if (data.imageUrl !== undefined) { fields.push('image_url = ?'); values.push(data.imageUrl); }
    if (data.purchaseLink !== undefined) { fields.push('purchase_link = ?'); values.push(data.purchaseLink); }
    if (data.isVerified !== undefined) { fields.push('is_verified = ?'); values.push(data.isVerified ? 1 : 0); }
    if (data.isActive !== undefined) { fields.push('is_active = ?'); values.push(data.isActive ? 1 : 0); }

    if (fields.length > 0) {
      values.push(variantId);
      await pool.query(`UPDATE product_variants SET ${fields.join(', ')} WHERE variant_id = ?`, values);
    }

    const [rows]: any = await pool.query('SELECT * FROM product_variants WHERE variant_id = ?', [variantId]);
    return rows[0] || null;
  }

  /**
   * Remove a shade variant
   */
  static async deleteVariant(variantId: number) {
    await pool.query('DELETE FROM product_variants WHERE variant_id = ?', [variantId]);
    return { success: true, message: `Shade variant ${variantId} removed.` };
  }

  static async createProduct(data: CreateProductInput) {
    const {
      name,
      brandId,
      categoryId,
      description = '',
      price = 0,
      currency = '৳',
      imageUrl = '/src/assets/images/product_foundation_bottle_1791104563365.jpg',
      officialUrl,
      sourceUrl,
      skinTone = 'Medium',
      undertone = 'Warm',
      shadeName = 'Default Shade',
      country = 'Bangladesh',
      isAvailable = true,
      purchaseLink,
      hasVariants = true,
      variants = [],
    } = data;

    const finalLink = purchaseLink || sourceUrl || officialUrl || '#';
    const computedHasVariants = hasVariants || (variants && variants.length > 0);

    const [res]: any = await pool.query(
      `INSERT INTO products (brand_id, category_id, product_name, description, price, currency, image_url, official_url, source_url, skin_tone, undertone, shade_name, has_variants, is_verified, is_active)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, 1)`,
      [brandId, categoryId, name, description, price, currency, imageUrl, finalLink, finalLink, skinTone, undertone, shadeName, computedHasVariants ? 1 : 0]
    );

    const newProductId = res.insertId;

    // Create availability record with direct purchase/source link
    await pool.query(
      `INSERT INTO product_availability (product_id, country, is_available, purchase_link, local_price, currency)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [newProductId, country, isAvailable ? 1 : 0, finalLink, price, currency]
    );

    // Save all provided shades as individual linked variant records
    if (variants && variants.length > 0) {
      for (const v of variants) {
        if (!v.shadeName) continue;
        await pool.query(
          `INSERT INTO product_variants (product_id, shade_name, shade_number, color_family, swatch_hex, swatch_image_url, skin_tone, undertone, image_url, purchase_link, is_verified, is_active)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)`,
          [
            newProductId,
            v.shadeName,
            v.shadeNumber || null,
            v.colorFamily || null,
            v.swatchHex || null,
            v.swatchImageUrl || null,
            v.skinTone || null,
            v.undertone || null,
            v.imageUrl || imageUrl,
            v.purchaseLink || finalLink,
            v.isVerified ? 1 : 0,
          ]
        );
      }
    }

    return this.getProductById(newProductId, country);
  }

  static async updateProduct(productId: number, data: UpdateProductInput) {
    const fields: string[] = [];
    const values: any[] = [];

    if (data.name !== undefined) { fields.push('product_name = ?'); values.push(data.name); }
    if (data.brandId !== undefined) { fields.push('brand_id = ?'); values.push(data.brandId); }
    if (data.categoryId !== undefined) { fields.push('category_id = ?'); values.push(data.categoryId); }
    if (data.description !== undefined) { fields.push('description = ?'); values.push(data.description); }
    if (data.price !== undefined) { fields.push('price = ?'); values.push(data.price); }
    if (data.currency !== undefined) { fields.push('currency = ?'); values.push(data.currency); }
    if (data.imageUrl !== undefined) { fields.push('image_url = ?'); values.push(data.imageUrl); }
    if (data.officialUrl !== undefined || data.sourceUrl !== undefined || data.purchaseLink !== undefined) {
      const link = data.purchaseLink || data.sourceUrl || data.officialUrl || '#';
      fields.push('official_url = ?'); values.push(link);
      fields.push('source_url = ?'); values.push(link);
    }
    if (data.skinTone !== undefined) { fields.push('skin_tone = ?'); values.push(data.skinTone); }
    if (data.undertone !== undefined) { fields.push('undertone = ?'); values.push(data.undertone); }
    if (data.shadeName !== undefined) { fields.push('shade_name = ?'); values.push(data.shadeName); }
    if (data.hasVariants !== undefined) { fields.push('has_variants = ?'); values.push(data.hasVariants ? 1 : 0); }

    if (fields.length > 0) {
      values.push(productId);
      await pool.query(`UPDATE products SET ${fields.join(', ')} WHERE product_id = ?`, values);
    }

    const availUpdates: string[] = [];
    const availParams: any[] = [];
    if (data.price !== undefined) {
      availUpdates.push('local_price = ?');
      availParams.push(data.price);
    }
    if (data.currency !== undefined) {
      availUpdates.push('currency = ?');
      availParams.push(data.currency);
    }
    if (data.purchaseLink || data.sourceUrl || data.officialUrl) {
      const link = data.purchaseLink || data.sourceUrl || data.officialUrl || '#';
      availUpdates.push('purchase_link = ?');
      availParams.push(link);
    }
    if (availUpdates.length > 0) {
      availParams.push(productId);
      await pool.query(`UPDATE product_availability SET ${availUpdates.join(', ')} WHERE product_id = ?`, availParams);
    }

    // If variants array passed, sync them
    if (data.variants && Array.isArray(data.variants)) {
      try {
        const [existingVariants]: any = await pool.query(
          'SELECT variant_id FROM product_variants WHERE product_id = ?',
          [productId]
        );
        const existingIds = new Set<number>((existingVariants || []).map((ev: any) => Number(ev.variant_id)));
        const keptIds = new Set<number>();

        for (const v of data.variants) {
          if (v.variantId && existingIds.has(v.variantId)) {
            await this.updateVariant(v.variantId, v);
            keptIds.add(v.variantId);
          } else if (v.shadeName) {
            const newVar = await this.addVariant(productId, v);
            if (newVar?.variantId) {
              keptIds.add(newVar.variantId);
            }
          }
        }

        // Remove any variants that were deleted from the shade list
        for (const oldId of existingIds) {
          if (!keptIds.has(oldId)) {
            await pool.query('DELETE FROM product_variants WHERE variant_id = ? AND product_id = ?', [oldId, productId]);
          }
        }
      } catch (varErr: any) {
        console.warn('Error syncing variants in updateProduct:', varErr.message);
      }
    }

    return this.getProductById(productId);
  }

  static async deactivateProduct(productId: number) {
    await pool.query('UPDATE products SET is_active = 0 WHERE product_id = ?', [productId]);
    await pool.query('UPDATE product_variants SET is_active = 0 WHERE product_id = ?', [productId]);

    try {
      const [prodRows]: any = await pool.query('SELECT product_name FROM products WHERE product_id = ?', [productId]);
      if (prodRows && prodRows.length > 0) {
        const cleanBase = prodRows[0].product_name.replace(/\s*\([^)]*\)\s*$/, '').trim();
        if (cleanBase) {
          await pool.query(
            'UPDATE products SET is_active = 0 WHERE (product_name LIKE ? OR product_name = ?) AND product_id != ?',
            [`${cleanBase} (%`, cleanBase, productId]
          );
        }
      }
    } catch {}

    return { success: true, message: `Product ${productId} deactivated.` };
  }

  static async deleteProduct(productId: number) {
    // 1. Delete linked variants
    try {
      await pool.query('DELETE FROM product_variants WHERE product_id = ?', [productId]);
    } catch (e: any) {
      console.warn('Notice deleting product_variants:', e.message);
    }

    // 2. Delete linked product availability records
    try {
      await pool.query('DELETE FROM product_availability WHERE product_id = ?', [productId]);
    } catch (e: any) {
      console.warn('Notice deleting product_availability:', e.message);
    }

    // 3. Delete linked user favorites
    try {
      await pool.query('DELETE FROM favorites WHERE product_id = ?', [productId]);
    } catch (e: any) {
      console.warn('Notice deleting favorites:', e.message);
    }

    // 4. Delete recommendations
    try {
      await pool.query('DELETE FROM recommendations WHERE product_id = ?', [productId]);
    } catch (e: any) {
      console.warn('Notice deleting recommendations:', e.message);
    }

    // 5. Clean up any related child/duplicate rows for this product
    try {
      const [prodRows]: any = await pool.query('SELECT product_name FROM products WHERE product_id = ?', [productId]);
      if (prodRows && prodRows.length > 0) {
        const rawName = prodRows[0].product_name;
        const cleanBase = rawName.replace(/\s*\([^)]*\)\s*$/, '').trim();
        if (cleanBase) {
          const [children]: any = await pool.query(
            'SELECT product_id FROM products WHERE (product_name LIKE ? OR product_name = ?) AND product_id != ?',
            [`${cleanBase} (%`, cleanBase, productId]
          );
          for (const ch of children || []) {
            await pool.query('DELETE FROM product_variants WHERE product_id = ?', [ch.product_id]).catch(() => {});
            await pool.query('DELETE FROM product_availability WHERE product_id = ?', [ch.product_id]).catch(() => {});
            await pool.query('DELETE FROM favorites WHERE product_id = ?', [ch.product_id]).catch(() => {});
            await pool.query('DELETE FROM recommendations WHERE product_id = ?', [ch.product_id]).catch(() => {});
            await pool.query('DELETE FROM products WHERE product_id = ?', [ch.product_id]).catch(() => {});
          }
        }
      }
    } catch (cErr: any) {
      console.warn('Notice cleaning legacy duplicate products:', cErr.message);
    }

    // 6. Delete the parent product record
    await pool.query('DELETE FROM products WHERE product_id = ?', [productId]);

    return { success: true, message: `Product #${productId} permanently deleted from catalog.` };
  }

  static async updateProductAvailability(
    productId: number,
    data: {
      country: string;
      isAvailable: boolean;
      localPrice?: number;
      currency?: string;
      purchaseLink?: string;
    }
  ) {
    const { country, isAvailable, localPrice, currency = '৳', purchaseLink } = data;

    const [existing]: any = await pool.query(
      'SELECT availability_id FROM product_availability WHERE product_id = ? AND country = ?',
      [productId, country]
    );

    if (existing.length > 0) {
      const updates: string[] = ['is_available = ?'];
      const vals: any[] = [isAvailable ? 1 : 0];
      if (localPrice !== undefined) { updates.push('local_price = ?'); vals.push(localPrice); }
      if (currency !== undefined) { updates.push('currency = ?'); vals.push(currency); }
      if (purchaseLink !== undefined) { updates.push('purchase_link = ?'); vals.push(purchaseLink); }

      vals.push(productId, country);
      await pool.query(`UPDATE product_availability SET ${updates.join(', ')} WHERE product_id = ? AND country = ?`, vals);
    } else {
      const priceToUse = localPrice !== undefined ? localPrice : 1500;
      await pool.query(
        `INSERT INTO product_availability (product_id, country, is_available, purchase_link, local_price, currency)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [productId, country, isAvailable ? 1 : 0, purchaseLink || '#', priceToUse, currency]
      );
    }

    return this.getProductById(productId, country);
  }

  static async searchProducts(term: string) {
    return this.getProducts({ search: term });
  }
}
