import { Product, ProductVariant } from '../types';

/**
 * Deterministic, calibrated cosmetic swatch colors for skin tone & undertone spectrum
 */
const SWATCH_PALETTE: Record<string, Record<string, string>> = {
  'Very Fair': {
    Cool: '#F8DFD7',
    Neutral: '#F7E2D6',
    Warm: '#FBE4CD',
    Olive: '#EED9C4',
    Universal: '#F7E2D6',
  },
  'Fair': {
    Cool: '#F4D2C1',
    Neutral: '#F2D3BF',
    Warm: '#F5D7B4',
    Olive: '#E8CEB0',
    Universal: '#F2D3BF',
  },
  'Light': {
    Cool: '#E9BEA8',
    Neutral: '#E6BF9D',
    Warm: '#E8C296',
    Olive: '#DDBB90',
    Universal: '#E6BF9D',
  },
  'Light-Medium': {
    Cool: '#DEB093',
    Neutral: '#DCAD87',
    Warm: '#DDB17E',
    Olive: '#D0AA7B',
    Universal: '#DCAD87',
  },
  'Medium': {
    Cool: '#D09B74',
    Neutral: '#CD976D',
    Warm: '#CE9560',
    Olive: '#C3935F',
    Universal: '#CD976D',
  },
  'Medium-Tan': {
    Cool: '#BB8359',
    Neutral: '#B87F52',
    Warm: '#B77C47',
    Olive: '#AD7948',
    Universal: '#B87F52',
  },
  'Tan': {
    Cool: '#A36B42',
    Neutral: '#A0663B',
    Warm: '#A26634',
    Olive: '#976237',
    Universal: '#A0663B',
  },
  'Deep': {
    Cool: '#754427',
    Neutral: '#723F1F',
    Warm: '#724119',
    Olive: '#6A3D1E',
    Universal: '#723F1F',
  },
  'Very Deep': {
    Cool: '#4A2715',
    Neutral: '#47230F',
    Warm: '#46230B',
    Olive: '#40200E',
    Universal: '#47230F',
  },
};

/**
 * Returns an authentic cosmetic hex color for a given skin tone & undertone
 */
export function getSwatchHex(tone?: string, undertone?: string, shadeName?: string): string {
  const normTone = (tone || 'Medium').trim();
  const normUndertone = (undertone || 'Warm').trim();

  // Check known tone in palette
  if (SWATCH_PALETTE[normTone]) {
    const toneMap = SWATCH_PALETTE[normTone];
    if (toneMap[normUndertone]) return toneMap[normUndertone];
    if (toneMap['Neutral']) return toneMap['Neutral'];
    if (toneMap['Warm']) return toneMap['Warm'];
  }

  // Fallback tone match
  for (const [t, map] of Object.entries(SWATCH_PALETTE)) {
    if (normTone.toLowerCase().includes(t.toLowerCase())) {
      return map[normUndertone] || map['Neutral'] || map['Warm'];
    }
  }

  return '#CD9B74';
}

/**
 * Extracts clean base product name by removing shade identifiers in parentheses or after dashes
 * Example: "Fit Me Matte + Poreless Foundation (100 Porcelain)" -> "Fit Me Matte + Poreless Foundation"
 */
export function extractBaseProductName(name: string): string {
  if (!name) return '';
  return name
    .replace(/\s*\([^)]*\)\s*$/, '') // remove "(100 Porcelain)"
    .replace(/\s*-\s*(Shade|shade|No\.|#)?\s*\d+.*$/i, '') // remove "- 100 Porcelain"
    .trim();
}

/**
 * Extracts shade name from parenthesis if not explicitly set
 */
export function extractShadeFromTitle(title: string): string | null {
  if (!title) return null;
  const match = title.match(/\(([^)]+)\)/);
  if (match && match[1]) {
    return match[1].trim();
  }
  return null;
}

/**
 * Deduplicates and groups a list of product records so each physical product appears ONCE.
 * All shades are aggregated into `product.variants` and can be switched dynamically on the card.
 */
export function deduplicateAndGroupProducts(
  products: Product[],
  preferredTone?: string,
  preferredUndertone?: string
): Product[] {
  if (!products || products.length === 0) return [];

  const groups = new Map<string, { baseProduct: Product; variants: ProductVariant[] }>();

  for (const p of products) {
    const cleanName = extractBaseProductName(p.name);
    const brand = p.brand || 'Cosmetic';
    const groupKey = `${brand.toLowerCase()}___${cleanName.toLowerCase()}`;

    // Extract shade name for this record
    const shadeName = p.shade || p.shadeName || extractShadeFromTitle(p.name) || 'Default Shade';
    const swatchHex = p.shadeHex || getSwatchHex(p.skinTone, p.undertone, shadeName);

    const variant: ProductVariant = {
      variantId: typeof p.productId === 'number' ? p.productId : Number(String(p.id).replace('prod_', '') || 1),
      productId: typeof p.productId === 'number' ? p.productId : Number(String(p.id).replace('prod_', '') || 1),
      shadeName,
      skinTone: p.skinTone || 'Medium',
      undertone: p.undertone || 'Warm',
      swatchHex,
      imageUrl: p.imageUrl || p.image,
      purchaseLink: p.purchaseLink || p.sourceUrl || p.officialUrl || '#',
      isVerified: p.isVerified ?? true,
      isActive: true,
    };

    if (!groups.has(groupKey)) {
      // First instance of this base product
      const baseProduct: Product = {
        ...p,
        name: cleanName,
        shade: shadeName,
        shadeName: shadeName,
        shadeHex: swatchHex,
        sourceUrl: p.sourceUrl || p.officialUrl || p.purchaseLink,
        purchaseLink: p.purchaseLink || p.sourceUrl || p.officialUrl || '#',
      };

      const initialVariants: ProductVariant[] = [];
      // If the incoming product already has variants from DB, include them
      if (p.variants && p.variants.length > 0) {
        for (const v of p.variants) {
          initialVariants.push({
            ...v,
            swatchHex: v.swatchHex || getSwatchHex(v.skinTone, v.undertone, v.shadeName),
          });
        }
      } else {
        initialVariants.push(variant);
      }

      groups.set(groupKey, {
        baseProduct,
        variants: initialVariants,
      });
    } else {
      // Subsequent shade of the same product
      const existing = groups.get(groupKey)!;
      // Add variant if not already present
      const alreadyHasVariant = existing.variants.some(
        (v) => v.shadeName.toLowerCase() === shadeName.toLowerCase()
      );
      if (!alreadyHasVariant) {
        existing.variants.push(variant);
      }
    }
  }

  // Finalize each grouped product: pick best active shade & attach full variant list
  const results: Product[] = [];

  for (const { baseProduct, variants } of groups.values()) {
    // Sort variants by shade name / tone
    const sortedVariants = [...variants].sort((a, b) => a.shadeName.localeCompare(b.shadeName));

    // Choose default active variant:
    // If user has preferred tone & undertone, pick the closest matching variant
    let defaultVariant = sortedVariants[0];

    if (preferredTone && preferredTone !== 'All') {
      const exactMatch = sortedVariants.find(
        (v) =>
          v.skinTone?.toLowerCase() === preferredTone.toLowerCase() &&
          (!preferredUndertone || preferredUndertone === 'All' || v.undertone?.toLowerCase() === preferredUndertone.toLowerCase())
      );
      if (exactMatch) {
        defaultVariant = exactMatch;
      } else {
        const toneMatch = sortedVariants.find(
          (v) => v.skinTone?.toLowerCase() === preferredTone.toLowerCase()
        );
        if (toneMatch) defaultVariant = toneMatch;
      }
    }

    const finalized: Product = {
      ...baseProduct,
      shade: defaultVariant.shadeName,
      shadeName: defaultVariant.shadeName,
      shadeHex: defaultVariant.swatchHex || getSwatchHex(defaultVariant.skinTone, defaultVariant.undertone, defaultVariant.shadeName),
      skinTone: defaultVariant.skinTone || baseProduct.skinTone,
      undertone: defaultVariant.undertone || baseProduct.undertone,
      imageUrl: defaultVariant.imageUrl || baseProduct.imageUrl || baseProduct.image,
      image: defaultVariant.imageUrl || baseProduct.imageUrl || baseProduct.image,
      purchaseLink: defaultVariant.purchaseLink || baseProduct.purchaseLink,
      sourceUrl: defaultVariant.purchaseLink || baseProduct.sourceUrl || baseProduct.purchaseLink,
      variants: sortedVariants,
      hasVariants: sortedVariants.length > 1,
      variantCount: sortedVariants.length,
    };

    results.push(finalized);
  }

  return results;
}
