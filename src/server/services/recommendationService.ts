import { pool } from '../config/db';

export interface RecommendationOptions {
  skinTone?: string;
  undertone?: string;
  budget?: number;
  country?: string;
  category?: string;
  brand?: string;
  makeupLook?: string;
  preferredFinish?: string;
}

export interface ScoreResult {
  total: number;
  breakdown: {
    skinToneMatch: number;
    undertoneMatch: number;
    budgetMatch: number;
    countryAvailability: number;
    categoryPreference: number;
    total: number;
  };
  reason: string;
  budgetCategory: 'best_match' | 'slightly_above' | 'alternative';
}

export interface ScoredProduct {
  recommendationId: number | null;
  id: string;
  productId: number;
  name: string;
  description: string;
  brand: string;
  brandId: number;
  category: string;
  categoryId: number;
  price: number;
  currency: string;
  imageUrl: string;
  image: string;
  skinTone: string | null;
  undertone: string | null;
  shade: string | null;
  shadeName: string | null;
  matchPercentage: number;
  matchScore: number;
  scoreBreakdown: ScoreResult['breakdown'];
  reason: string;
  availability: string;
  isAvailableInCountry: boolean;
  country: string;
  purchaseLink: string;
  budgetCategory: 'best_match' | 'slightly_above' | 'alternative';
  variants?: any[];
  hasVariants?: boolean;
  variantCount?: number;
}

const TONE_HIERARCHY = ['Very Fair', 'Fair', 'Light', 'Medium', 'Tan', 'Deep'];

export class RecommendationService {
  /**
   * Evaluates budget fit
   */
  private static scoreBudget(price: number, budget: number): { score: number; category: 'best_match' | 'slightly_above' | 'alternative' } {
    if (budget <= 0 || price <= budget) {
      return { score: 15, category: 'best_match' };
    } else if (price <= budget * 1.25) {
      return { score: 7, category: 'slightly_above' };
    }
    return { score: 0, category: 'alternative' };
  }

  /**
   * 1. Foundation & Tinted Complexion Matcher
   * Heavily prioritizes verified complexion depth and undertone harmony.
   */
  static scoreFoundationMatch(
    product: any,
    userTone: string,
    userUndertone: string,
    userBudget: number,
    userCountry: string
  ): ScoreResult {
    const prodTone = product.skin_tone || '';
    const prodUndertone = product.undertone || '';
    const isAvail = Boolean(product.is_available === 1 || product.is_available === true);
    const price = Number(product.local_price || product.price || 0);

    let toneScore = 0;
    let undertoneScore = 0;
    const reasons: string[] = [];

    // Tone scoring (max 40)
    if (prodTone) {
      if (prodTone.toLowerCase() === userTone.toLowerCase()) {
        toneScore = 40;
        reasons.push(`matches your ${userTone.toLowerCase()} skin tone`);
      } else {
        const uIdx = TONE_HIERARCHY.findIndex(t => t.toLowerCase() === userTone.toLowerCase());
        const pIdx = TONE_HIERARCHY.findIndex(t => t.toLowerCase() === prodTone.toLowerCase());
        if (uIdx !== -1 && pIdx !== -1 && Math.abs(uIdx - pIdx) === 1) {
          toneScore = 24;
          reasons.push(`is a compatible shade adjacent to your ${userTone.toLowerCase()} depth`);
        } else {
          toneScore = 0;
        }
      }
    } else {
      // Missing tone info: partial neutral score (never full points)
      toneScore = 15;
      reasons.push(`shade depth suitability is unverified in catalog`);
    }

    // Undertone scoring (max 25)
    if (prodUndertone) {
      if (prodUndertone.toLowerCase() === userUndertone.toLowerCase()) {
        undertoneScore = 25;
        reasons.push(`harmonizes with your ${userUndertone.toLowerCase()} undertone`);
      } else if (
        userUndertone.toLowerCase() === 'neutral' ||
        prodUndertone.toLowerCase() === 'neutral' ||
        (userUndertone.toLowerCase() === 'warm' && prodUndertone.toLowerCase() === 'olive') ||
        (userUndertone.toLowerCase() === 'olive' && prodUndertone.toLowerCase() === 'warm')
      ) {
        undertoneScore = 16;
        reasons.push(`provides balanced undertone neutrality`);
      } else {
        undertoneScore = 0;
      }
    } else {
      undertoneScore = 10;
    }

    // Budget & Availability
    const { score: budgetScore, category: budgetCategory } = this.scoreBudget(price, userBudget);
    const countryScore = isAvail ? 10 : 0;
    const categoryPrefScore = 10;

    if (isAvail) reasons.push(`is available in ${userCountry}`);
    if (budgetScore === 15) reasons.push(`falls comfortably within your budget`);

    const total = Math.min(100, toneScore + undertoneScore + budgetScore + countryScore + categoryPrefScore);
    const reason = `Recommended because this foundation ${reasons.join(', ')}.`;

    return {
      total,
      breakdown: {
        skinToneMatch: toneScore,
        undertoneMatch: undertoneScore,
        budgetMatch: budgetScore,
        countryAvailability: countryScore,
        categoryPreference: categoryPrefScore,
        total,
      },
      reason,
      budgetCategory,
    };
  }

  /**
   * 2. Concealer Matcher
   * Balances complexion depth matching with spot coverage and brightening flexibility.
   */
  static scoreConcealerMatch(
    product: any,
    userTone: string,
    userUndertone: string,
    userBudget: number,
    userCountry: string
  ): ScoreResult {
    const prodTone = product.skin_tone || '';
    const prodUndertone = product.undertone || '';
    const isAvail = Boolean(product.is_available === 1 || product.is_available === true);
    const price = Number(product.local_price || product.price || 0);

    let toneScore = 0;
    let undertoneScore = 0;
    const reasons: string[] = [];

    if (prodTone) {
      if (prodTone.toLowerCase() === userTone.toLowerCase()) {
        toneScore = 38;
        reasons.push(`matches your ${userTone.toLowerCase()} complexion for blemish concealing`);
      } else {
        const uIdx = TONE_HIERARCHY.findIndex(t => t.toLowerCase() === userTone.toLowerCase());
        const pIdx = TONE_HIERARCHY.findIndex(t => t.toLowerCase() === prodTone.toLowerCase());
        // For concealer, 1 step lighter can also be a desirable under-eye brightening shade
        if (uIdx !== -1 && pIdx !== -1 && pIdx === uIdx - 1) {
          toneScore = 34;
          reasons.push(`serves as an ideal under-eye brightening shade`);
        } else if (uIdx !== -1 && pIdx !== -1 && Math.abs(uIdx - pIdx) === 1) {
          toneScore = 22;
          reasons.push(`provides workable complexion coverage`);
        } else {
          toneScore = 0;
        }
      }
    } else {
      toneScore = 16;
    }

    if (prodUndertone) {
      if (prodUndertone.toLowerCase() === userUndertone.toLowerCase()) {
        undertoneScore = 25;
        reasons.push(`matches your ${userUndertone.toLowerCase()} undertone`);
      } else if (userUndertone.toLowerCase() === 'neutral' || prodUndertone.toLowerCase() === 'neutral') {
        undertoneScore = 18;
      } else {
        undertoneScore = 5;
      }
    } else {
      undertoneScore = 12;
    }

    const { score: budgetScore, category: budgetCategory } = this.scoreBudget(price, userBudget);
    const countryScore = isAvail ? 12 : 0;
    const categoryPrefScore = 10;

    if (isAvail) reasons.push(`is in stock in ${userCountry}`);

    const total = Math.min(100, toneScore + undertoneScore + budgetScore + countryScore + categoryPrefScore);
    const reason = `Recommended because this concealer ${reasons.join(', ')}.`;

    return {
      total,
      breakdown: {
        skinToneMatch: toneScore,
        undertoneMatch: undertoneScore,
        budgetMatch: budgetScore,
        countryAvailability: countryScore,
        categoryPreference: categoryPrefScore,
        total,
      },
      reason,
      budgetCategory,
    };
  }

  /**
   * 3. Lipstick & Lip Cosmetics Matcher
   * Evaluates lip color family, undertone harmony, and finish preferences.
   * NEVER rejects a lipstick because foundation skin_tone is different!
   */
  static scoreLipstickMatch(
    product: any,
    userTone: string,
    userUndertone: string,
    userBudget: number,
    userCountry: string
  ): ScoreResult {
    const isAvail = Boolean(product.is_available === 1 || product.is_available === true);
    const price = Number(product.local_price || product.price || 0);
    const shade = (product.shade_name || product.product_name || '').toLowerCase();
    const prodUndertone = (product.undertone || '').toLowerCase();

    // Lip color harmony score (max 38)
    let colorHarmonyScore = 32;
    const reasons: string[] = [];

    // Flexible undertone harmony suggestion
    let undertoneScore = 20;
    if (prodUndertone) {
      if (prodUndertone === userUndertone.toLowerCase()) {
        undertoneScore = 25;
        reasons.push(`harmonizes with your ${userUndertone.toLowerCase()} undertone`);
      } else if (prodUndertone === 'universal' || prodUndertone === 'neutral' || userUndertone.toLowerCase() === 'neutral') {
        undertoneScore = 22;
        reasons.push(`features a versatile neutral color balance`);
      } else {
        undertoneScore = 15;
      }
    } else {
      // Suggest based on shade keywords
      if (userUndertone.toLowerCase() === 'warm' && (shade.includes('peach') || shade.includes('coral') || shade.includes('warm') || shade.includes('terracotta') || shade.includes('nude'))) {
        colorHarmonyScore = 38;
        reasons.push(`features warm peach/nude tones that flatter warm complexions`);
      } else if (userUndertone.toLowerCase() === 'cool' && (shade.includes('berry') || shade.includes('rose') || shade.includes('pink') || shade.includes('plum') || shade.includes('ruby') || shade.includes('mauve'))) {
        colorHarmonyScore = 38;
        reasons.push(`features rosy berry pigments complementary to cool complexions`);
      } else {
        reasons.push(`offers a versatile cosmetic lip shade`);
      }
    }

    const { score: budgetScore, category: budgetCategory } = this.scoreBudget(price, userBudget);
    const countryScore = isAvail ? 12 : 0;
    const categoryPrefScore = 15;

    if (isAvail) reasons.push(`is available in ${userCountry}`);

    const total = Math.min(100, colorHarmonyScore + undertoneScore + budgetScore + countryScore + categoryPrefScore);
    const reason = `Recommended because this lipstick shade ${reasons.join(', ')}.`;

    return {
      total,
      breakdown: {
        skinToneMatch: colorHarmonyScore,
        undertoneMatch: undertoneScore,
        budgetMatch: budgetScore,
        countryAvailability: countryScore,
        categoryPreference: categoryPrefScore,
        total,
      },
      reason,
      budgetCategory,
    };
  }

  /**
   * 4. Blush Matcher
   * Evaluates blush color family (peach, rose, berry, coral, terracotta) and undertone harmony.
   */
  static scoreBlushMatch(
    product: any,
    userTone: string,
    userUndertone: string,
    userBudget: number,
    userCountry: string
  ): ScoreResult {
    const isAvail = Boolean(product.is_available === 1 || product.is_available === true);
    const price = Number(product.local_price || product.price || 0);
    const shade = (product.shade_name || product.product_name || '').toLowerCase();
    const prodUndertone = (product.undertone || '').toLowerCase();

    let colorScore = 32;
    let undertoneScore = 20;
    const reasons: string[] = [];

    if (prodUndertone === userUndertone.toLowerCase()) {
      undertoneScore = 25;
      reasons.push(`complements your ${userUndertone.toLowerCase()} undertone`);
    } else if (userUndertone.toLowerCase() === 'neutral' || prodUndertone === 'neutral' || prodUndertone === 'universal') {
      undertoneScore = 22;
      reasons.push(`provides a universally flattering flush`);
    }

    if (userUndertone.toLowerCase() === 'warm' && (shade.includes('peach') || shade.includes('coral') || shade.includes('apricot') || shade.includes('warm'))) {
      colorScore = 38;
      reasons.push(`offers luminous warm coral/peach radiance`);
    } else if (userUndertone.toLowerCase() === 'cool' && (shade.includes('rose') || shade.includes('pink') || shade.includes('berry') || shade.includes('mauve'))) {
      colorScore = 38;
      reasons.push(`provides soft rosy cheek pigmentation`);
    }

    const { score: budgetScore, category: budgetCategory } = this.scoreBudget(price, userBudget);
    const countryScore = isAvail ? 12 : 0;
    const categoryPrefScore = 15;

    if (isAvail) reasons.push(`is available in ${userCountry}`);

    const total = Math.min(100, colorScore + undertoneScore + budgetScore + countryScore + categoryPrefScore);
    const reason = `Recommended because this blush ${reasons.join(', ')}.`;

    return {
      total,
      breakdown: {
        skinToneMatch: colorScore,
        undertoneMatch: undertoneScore,
        budgetMatch: budgetScore,
        countryAvailability: countryScore,
        categoryPreference: categoryPrefScore,
        total,
      },
      reason,
      budgetCategory,
    };
  }

  /**
   * 5. Eye Makeup Matcher (Eyeshadow, Eyeliner, Mascara)
   * Does NOT judge products by foundation skin tone!
   */
  static scoreEyeMakeupMatch(
    product: any,
    userBudget: number,
    userCountry: string
  ): ScoreResult {
    const isAvail = Boolean(product.is_available === 1 || product.is_available === true);
    const price = Number(product.local_price || product.price || 0);

    const qualityScore = 40;
    const categoryPrefScore = 20;
    const { score: budgetScore, category: budgetCategory } = this.scoreBudget(price, userBudget);
    const countryScore = isAvail ? 20 : 0;

    const reasons: string[] = ['features verified high-performance cosmetic formulation'];
    if (isAvail) reasons.push(`is available locally in ${userCountry}`);
    if (budgetScore === 15) reasons.push(`fits your budget criteria`);

    const total = Math.min(100, qualityScore + categoryPrefScore + budgetScore + countryScore);
    const reason = `Recommended because this eye makeup product ${reasons.join(', ')}.`;

    return {
      total,
      breakdown: {
        skinToneMatch: 20,
        undertoneMatch: 20,
        budgetMatch: budgetScore,
        countryAvailability: countryScore,
        categoryPreference: categoryPrefScore,
        total,
      },
      reason,
      budgetCategory,
    };
  }

  /**
   * 6. Powder Matcher (Compact & Setting Powders)
   * Handles translucent formulations (universal) vs tinted complexion powders.
   */
  static scorePowderMatch(
    product: any,
    userTone: string,
    userUndertone: string,
    userBudget: number,
    userCountry: string
  ): ScoreResult {
    const isAvail = Boolean(product.is_available === 1 || product.is_available === true);
    const price = Number(product.local_price || product.price || 0);
    const prodTone = product.skin_tone || '';
    const shade = (product.shade_name || product.product_name || '').toLowerCase();

    let toneScore = 30;
    let undertoneScore = 20;
    const reasons: string[] = [];

    if (shade.includes('translucent') || shade.includes('universal') || prodTone === 'Universal') {
      toneScore = 38;
      undertoneScore = 24;
      reasons.push(`features translucent oil-control suitable for all skin tones`);
    } else if (prodTone && prodTone.toLowerCase() === userTone.toLowerCase()) {
      toneScore = 38;
      reasons.push(`matches your ${userTone.toLowerCase()} skin depth`);
    }

    const { score: budgetScore, category: budgetCategory } = this.scoreBudget(price, userBudget);
    const countryScore = isAvail ? 12 : 0;
    const categoryPrefScore = 15;

    if (isAvail) reasons.push(`is available in ${userCountry}`);

    const total = Math.min(100, toneScore + undertoneScore + budgetScore + countryScore + categoryPrefScore);
    const reason = `Recommended because this powder ${reasons.join(', ')}.`;

    return {
      total,
      breakdown: {
        skinToneMatch: toneScore,
        undertoneMatch: undertoneScore,
        budgetMatch: budgetScore,
        countryAvailability: countryScore,
        categoryPreference: categoryPrefScore,
        total,
      },
      reason,
      budgetCategory,
    };
  }

  /**
   * 7. Face Color Matcher (Bronzer, Contour, Highlighter)
   */
  static scoreFaceColorProductMatch(
    product: any,
    userTone: string,
    userUndertone: string,
    userBudget: number,
    userCountry: string
  ): ScoreResult {
    const isAvail = Boolean(product.is_available === 1 || product.is_available === true);
    const price = Number(product.local_price || product.price || 0);
    const cat = (product.category_name || '').toLowerCase();

    let formulaScore = 35;
    let undertoneScore = 20;
    const reasons: string[] = [];

    if (cat.includes('highlighter')) {
      if (userUndertone.toLowerCase() === 'warm') {
        reasons.push(`delivers golden-champagne dimension flattering warm complexions`);
      } else {
        reasons.push(`provides luminous light-reflecting facial radiance`);
      }
    } else if (cat.includes('bronzer')) {
      reasons.push(`adds sun-kissed facial warmth without muddy undertones`);
    } else {
      reasons.push(`defines natural facial contours with buildable depth`);
    }

    const { score: budgetScore, category: budgetCategory } = this.scoreBudget(price, userBudget);
    const countryScore = isAvail ? 12 : 0;
    const categoryPrefScore = 15;

    if (isAvail) reasons.push(`is available in ${userCountry}`);

    const total = Math.min(100, formulaScore + undertoneScore + budgetScore + countryScore + categoryPrefScore);
    const reason = `Recommended because this product ${reasons.join(', ')}.`;

    return {
      total,
      breakdown: {
        skinToneMatch: formulaScore,
        undertoneMatch: undertoneScore,
        budgetMatch: budgetScore,
        countryAvailability: countryScore,
        categoryPreference: categoryPrefScore,
        total,
      },
      reason,
      budgetCategory,
    };
  }

  /**
   * 8. General Cosmetic Matcher (Primers, Setting Sprays, Skincare)
   */
  static scoreGeneralMakeupMatch(
    product: any,
    userBudget: number,
    userCountry: string
  ): ScoreResult {
    const isAvail = Boolean(product.is_available === 1 || product.is_available === true);
    const price = Number(product.local_price || product.price || 0);

    const baseScore = 40;
    const categoryPrefScore = 20;
    const { score: budgetScore, category: budgetCategory } = this.scoreBudget(price, userBudget);
    const countryScore = isAvail ? 20 : 0;

    const reasons: string[] = ['provides reliable cosmetic longevity and finish preparation'];
    if (isAvail) reasons.push(`is in stock in ${userCountry}`);

    const total = Math.min(100, baseScore + categoryPrefScore + budgetScore + countryScore);
    const reason = `Recommended because this formula ${reasons.join(', ')}.`;

    return {
      total,
      breakdown: {
        skinToneMatch: 20,
        undertoneMatch: 20,
        budgetMatch: budgetScore,
        countryAvailability: countryScore,
        categoryPreference: categoryPrefScore,
        total,
      },
      reason,
      budgetCategory,
    };
  }

  /**
   * Routes each product to its category-specific matching strategy.
   */
  static calculateCategoryScore(
    product: any,
    userTone: string,
    userUndertone: string,
    userBudget: number,
    userCountry: string,
    preferredCategory?: string
  ): ScoreResult {
    const category = (product.category_name || '').toLowerCase();

    // 1. Foundation & Base
    if (category.includes('foundation') || category.includes('bb cream') || category.includes('cc cream') || category.includes('tinted moisturizer')) {
      return this.scoreFoundationMatch(product, userTone, userUndertone, userBudget, userCountry);
    }

    // 2. Concealer
    if (category.includes('concealer')) {
      return this.scoreConcealerMatch(product, userTone, userUndertone, userBudget, userCountry);
    }

    // 3. Lipstick & Lip Makeup
    if (category.includes('lipstick') || category.includes('lip gloss') || category.includes('lip liner') || category.includes('lip')) {
      return this.scoreLipstickMatch(product, userTone, userUndertone, userBudget, userCountry);
    }

    // 4. Blush
    if (category.includes('blush')) {
      return this.scoreBlushMatch(product, userTone, userUndertone, userBudget, userCountry);
    }

    // 5. Eye Makeup
    if (category.includes('mascara') || category.includes('eyeliner') || category.includes('eyeshadow')) {
      return this.scoreEyeMakeupMatch(product, userBudget, userCountry);
    }

    // 6. Powders
    if (category.includes('powder')) {
      return this.scorePowderMatch(product, userTone, userUndertone, userBudget, userCountry);
    }

    // 7. Bronzer, Contour, Highlighter
    if (category.includes('bronzer') || category.includes('contour') || category.includes('highlighter')) {
      return this.scoreFaceColorProductMatch(product, userTone, userUndertone, userBudget, userCountry);
    }

    // 8. General (Setting spray, primer, etc.)
    return this.scoreGeneralMakeupMatch(product, userBudget, userCountry);
  }

  /**
   * Deterministic category-aware recommendations
   */
  static calculateDeterministicScore(
    product: any,
    userTone: string,
    userUndertone: string,
    userBudget: number,
    userCountry: string,
    preferredCategory?: string
  ): ScoreResult {
    const res = this.calculateCategoryScore(product, userTone, userUndertone, userBudget, userCountry, preferredCategory);

    // Apply category bonus/filter if preferredCategory is specified
    if (preferredCategory && preferredCategory !== 'All') {
      const matchCat = (product.category_name || '').toLowerCase() === preferredCategory.toLowerCase();
      if (!matchCat) {
        return {
          ...res,
          total: Math.max(10, res.total - 30),
        };
      }
    }

    return res;
  }

  /**
   * Fetch recommendations ranked strictly by:
   * 1. Category relevance & highest match score (DESC)
   * 2. Local Country availability (DESC)
   * 3. Price (ASC)
   */
  static async getUserRecommendations(userId: number, options: RecommendationOptions = {}): Promise<ScoredProduct[]> {
    const targetTone = options.skinTone || 'Medium';
    const targetUndertone = options.undertone || 'Warm';
    const targetBudget = options.budget !== undefined ? options.budget : 3000;
    const targetCountry = options.country || 'Bangladesh';
    const targetCategory = options.category;

    // Fetch all active products joined with country availability
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
        p.is_active,
        b.brand_id,
        b.brand_name,
        b.country_origin,
        c.category_id,
        c.category_name,
        COALESCE(pa.is_available, 0) as is_available,
        COALESCE(pa.country, ?) as availability_country,
        COALESCE(pa.local_price, p.price) as local_price,
        COALESCE(pa.currency, p.currency) as local_currency,
        COALESCE(pa.purchase_link, '#') as purchase_link
      FROM products p
      INNER JOIN brands b ON p.brand_id = b.brand_id
      INNER JOIN categories c ON p.category_id = c.category_id
      LEFT JOIN product_availability pa ON p.product_id = pa.product_id AND pa.country = ?
      WHERE p.is_active = 1
    `;

    const params: any[] = [targetCountry, targetCountry];

    if (targetCategory && targetCategory !== 'All') {
      query += ` AND LOWER(c.category_name) = LOWER(?)`;
      params.push(targetCategory);
    }

    const [rows]: any = await pool.query(query, params);

    // Fetch all active shade variants linked to products
    const [allVariantsRows]: any = await pool.query(
      `SELECT pv.variant_id, pv.product_id, pv.shade_name, pv.shade_number, pv.color_family, pv.swatch_hex, pv.swatch_image_url,
              pv.skin_tone, pv.undertone, pv.image_url, pv.purchase_link, pv.is_verified, pv.is_active
       FROM product_variants pv
       WHERE pv.is_active = 1
       ORDER BY pv.variant_id ASC`
    );

    const variantsByProdId = new Map<number, any[]>();
    for (const v of allVariantsRows || []) {
      const pId = Number(v.product_id);
      if (!variantsByProdId.has(pId)) {
        variantsByProdId.set(pId, []);
      }
      variantsByProdId.get(pId)!.push(v);
    }

    // Evaluate each product and find its best-matching shade based on database compatibility records
    const scoredList: ScoredProduct[] = rows.map((r: any) => {
      const prodVariants = variantsByProdId.get(r.product_id) || [];
      const isAvail = Boolean(r.is_available === 1 || r.is_available === true);

      // Candidate shades to test: actual product_variants plus parent shade if distinct
      const candidateShades: any[] = [...prodVariants];
      if (candidateShades.length === 0) {
        candidateShades.push({
          variant_id: r.product_id,
          product_id: r.product_id,
          shade_name: r.shade_name || 'Natural Shade',
          shade_number: null,
          swatch_hex: null,
          swatch_image_url: null,
          skin_tone: r.skin_tone,
          undertone: r.undertone,
          image_url: r.image_url,
          purchase_link: r.purchase_link,
          is_verified: 1,
        });
      }

      let bestScore = -1;
      let bestResult: ScoreResult | null = null;
      let bestShadeItem: any = candidateShades[0];
      let hasVerifiedMatch = false;

      for (const shade of candidateShades) {
        // Create an evaluation item representing this specific shade
        const evalItem = {
          ...r,
          skin_tone: shade.skin_tone,
          undertone: shade.undertone,
          shade_name: shade.shade_name,
        };

        const res = this.calculateDeterministicScore(
          evalItem,
          targetTone,
          targetUndertone,
          targetBudget,
          targetCountry,
          targetCategory
        );

        // Enforce: unverified shades must never be recommended as verified matches
        const isShadeVerified = shade.is_verified === 1 || shade.is_verified === true;
        let adjustedTotal = res.total;

        if (!isShadeVerified) {
          adjustedTotal = Math.min(adjustedTotal, 55); // Ceiling for unverified matches
          res.total = adjustedTotal;
          res.breakdown.total = adjustedTotal;
          res.reason = `Shade "${shade.shade_name}" is unverified in catalog. Compatibility cannot be confirmed.`;
        } else if (
          shade.skin_tone &&
          shade.skin_tone.toLowerCase() === targetTone.toLowerCase() &&
          shade.undertone &&
          (shade.undertone.toLowerCase() === targetUndertone.toLowerCase() || targetUndertone.toLowerCase() === 'neutral')
        ) {
          hasVerifiedMatch = true;
        }

        if (adjustedTotal > bestScore) {
          bestScore = adjustedTotal;
          bestResult = res;
          bestShadeItem = shade;
        }
      }

      if (!bestResult) {
        bestResult = this.calculateDeterministicScore(r, targetTone, targetUndertone, targetBudget, targetCountry, targetCategory);
      }

      // If category is foundation or concealer and no verified match exists
      const isComplexion = (r.category_name || '').toLowerCase().includes('foundation') || (r.category_name || '').toLowerCase().includes('concealer');
      if (isComplexion && !hasVerifiedMatch) {
        bestResult.reason = `No verified match is available for your ${targetTone} depth and ${targetUndertone} undertone in this formulation.`;
        bestScore = Math.min(bestScore, 58);
        bestResult.total = bestScore;
      }

      const mappedVariants = candidateShades.map((v: any) => ({
        variantId: v.variant_id,
        productId: r.product_id,
        shadeName: v.shade_name,
        shadeNumber: v.shade_number,
        colorFamily: v.color_family,
        swatchHex: v.swatch_hex,
        swatchImageUrl: v.swatch_image_url,
        skinTone: v.skin_tone,
        undertone: v.undertone,
        imageUrl: v.image_url || r.image_url,
        purchaseLink: v.purchase_link || r.purchase_link,
        isVerified: v.is_verified === 1 || v.is_verified === true,
        isActive: true,
      }));

      return {
        recommendationId: null,
        id: `prod_${r.product_id}`,
        productId: r.product_id,
        name: r.product_name,
        description: r.description,
        brand: r.brand_name,
        brandId: r.brand_id,
        category: r.category_name,
        categoryId: r.category_id,
        price: Number(r.local_price || r.price),
        currency: r.local_currency || r.currency || '৳',
        imageUrl: bestShadeItem.image_url || r.image_url,
        image: bestShadeItem.image_url || r.image_url,
        skinTone: bestShadeItem.skin_tone || r.skin_tone,
        undertone: bestShadeItem.undertone || r.undertone,
        shade: bestShadeItem.shade_name,
        shadeName: bestShadeItem.shade_name,
        matchPercentage: bestResult.total,
        matchScore: bestResult.total,
        scoreBreakdown: bestResult.breakdown,
        reason: bestResult.reason,
        availability: isAvail ? `Available in ${targetCountry}` : `Not currently available in ${targetCountry}`,
        isAvailableInCountry: isAvail,
        country: targetCountry,
        purchaseLink: bestShadeItem.purchase_link || r.purchase_link || '#',
        budgetCategory: bestResult.budgetCategory,
        variants: mappedVariants,
        hasVariants: mappedVariants.length > 1,
        variantCount: mappedVariants.length,
      } as any;
    });

    // Deduplicate recommendations by base product name and brand so only 1 card shows per product,
    // with the highest-matching verified shade selected and all shade variants attached
    const baseProductMap = new Map<string, any>();

    for (const item of scoredList) {
      const cleanName = item.name.replace(/\s*\([^)]*\)\s*$/, '').trim();
      const groupKey = `${item.brand.toLowerCase()}___${cleanName.toLowerCase()}`;

      if (!baseProductMap.has(groupKey)) {
        baseProductMap.set(groupKey, {
          ...item,
          name: cleanName,
        });
      } else {
        const existing = baseProductMap.get(groupKey)!;
        // Merge variants
        for (const v of item.variants || []) {
          const exists = existing.variants.some((ev: any) => ev.shadeName.toLowerCase() === v.shadeName.toLowerCase());
          if (!exists) {
            existing.variants.push(v);
            existing.variantCount = existing.variants.length;
            existing.hasVariants = true;
          }
        }
        // If current item scored higher for the user, update the displayed representation
        if (item.matchPercentage > existing.matchPercentage) {
          existing.matchPercentage = item.matchPercentage;
          existing.matchScore = item.matchScore;
          existing.scoreBreakdown = item.scoreBreakdown;
          existing.reason = item.reason;
          existing.shade = item.shade;
          existing.shadeName = item.shadeName;
          existing.skinTone = item.skinTone;
          existing.undertone = item.undertone;
          existing.imageUrl = item.imageUrl;
          existing.image = item.image;
          existing.purchaseLink = item.purchaseLink;
        }
      }
    }

    const deduplicatedRecommendations = Array.from(baseProductMap.values());

    // Rank products:
    // 1. Highest match score (DESC)
    // 2. Country availability (DESC)
    // 3. Lower price (ASC)
    deduplicatedRecommendations.sort((a, b) => {
      if (b.matchPercentage !== a.matchPercentage) {
        return b.matchPercentage - a.matchPercentage;
      }
      if (a.isAvailableInCountry !== b.isAvailableInCountry) {
        return a.isAvailableInCountry ? -1 : 1;
      }
      return a.price - b.price;
    });

    return deduplicatedRecommendations;
  }

  static async saveSkinAnalysis(data: {
    userId: number;
    skinTone: string;
    undertone: string;
    confidenceScore?: number;
    imagePath?: string;
  }) {
    const { userId, skinTone, undertone, confidenceScore = 87.0, imagePath = null } = data;

    const [res]: any = await pool.query(
      `INSERT INTO skin_analysis (user_id, skin_tone, undertone, confidence_score, image_path)
       VALUES (?, ?, ?, ?, ?)`,
      [userId, skinTone, undertone, confidenceScore, imagePath]
    );

    const analysisId = res.insertId;

    // Populate top recommendations using the category-aware algorithm
    const topProducts = await this.getUserRecommendations(userId, { skinTone, undertone });
    for (const prod of topProducts.slice(0, 6)) {
      await pool.query(
        `INSERT INTO recommendations (user_id, analysis_id, product_id, score, reason)
         VALUES (?, ?, ?, ?, ?)`,
        [userId, analysisId, prod.productId, prod.matchPercentage, prod.reason]
      );
    }

    return {
      analysisId,
      userId,
      skinTone,
      undertone,
      confidenceScore,
      imagePath,
      analyzedAt: new Date().toISOString(),
    };
  }
}
