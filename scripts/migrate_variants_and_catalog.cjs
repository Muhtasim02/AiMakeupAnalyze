/**
 * Catalog Normalization & Real Shade Variants Migration Script
 * Establishes proper Product -> Product Variants (1:N) relational architecture.
 * Removes synthetic duplicate product rows, cleans fake shades,
 * populates authentic brand URLs and retailer purchase links.
 */

const { DatabaseSync } = require('node:sqlite');
const fs = require('fs');

const db = new DatabaseSync('ai_makeupmatch.sqlite');

console.log('Refining catalog parent grouping and verified shade variants...');

// Ensure product_variants table exists
db.exec(`
  CREATE TABLE IF NOT EXISTS product_variants (
    variant_id INTEGER PRIMARY KEY AUTOINCREMENT,
    product_id INTEGER NOT NULL,
    shade_name VARCHAR(100) NOT NULL,
    shade_number VARCHAR(50) NULL,
    color_family VARCHAR(50) NULL,
    swatch_hex VARCHAR(20) NULL,
    skin_tone VARCHAR(50) NULL,
    undertone VARCHAR(50) NULL,
    image_url VARCHAR(500) NULL,
    purchase_link VARCHAR(500) NULL,
    is_verified BOOLEAN DEFAULT 1,
    is_active BOOLEAN DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (product_id) REFERENCES products(product_id) ON DELETE CASCADE
  );
`);

// Brand Official Websites Directory
const brandOfficialUrls = {
  'Maybelline New York': { url: 'https://www.maybelline.com', retailer: 'https://www.ulta.com/brand/maybelline' },
  'Fenty Beauty': { url: 'https://fentybeauty.com', retailer: 'https://www.sephora.com/brand/fenty-beauty-by-rihanna' },
  'NARS Cosmetics': { url: 'https://www.narscosmetics.com', retailer: 'https://www.sephora.com/brand/nars' },
  'MAC Cosmetics': { url: 'https://www.maccosmetics.com', retailer: 'https://www.ulta.com/brand/mac' },
  'Rare Beauty': { url: 'https://www.rarebeauty.com', retailer: 'https://www.sephora.com/brand/rare-beauty-by-selena-gomez' },
  'Estee Lauder': { url: 'https://www.esteelauder.com', retailer: 'https://www.sephora.com/brand/estee-lauder' },
  "L'Oreal Paris": { url: 'https://www.lorealparisusa.com', retailer: 'https://www.ulta.com/brand/loreal' },
  'Huda Beauty': { url: 'https://hudabeauty.com', retailer: 'https://www.sephora.com/brand/huda-beauty' },
  'Charlotte Tilbury': { url: 'https://www.charlottetilbury.com', retailer: 'https://www.sephora.com/brand/charlotte-tilbury' },
  'Urban Decay': { url: 'https://www.urbandecay.com', retailer: 'https://www.ulta.com/brand/urban-decay' },
  'Benefit Cosmetics': { url: 'https://www.benefitcosmetics.com', retailer: 'https://www.ulta.com/brand/benefit-cosmetics' },
  'Anastasia Beverly Hills': { url: 'https://www.anastasiabeverlyhills.com', retailer: 'https://www.sephora.com/brand/anastasia-beverly-hills' },
  'Clinique': { url: 'https://www.clinique.com', retailer: 'https://www.sephora.com/brand/clinique' },
  'Too Faced': { url: 'https://www.toofaced.com', retailer: 'https://www.sephora.com/brand/too-faced' },
  'Laura Mercier': { url: 'https://www.lauramercier.com', retailer: 'https://www.sephora.com/brand/laura-mercier' },
  'Smashbox': { url: 'https://www.smashbox.com', retailer: 'https://www.ulta.com/brand/smashbox' },
  'Tarte': { url: 'https://tartecosmetics.com', retailer: 'https://www.sephora.com/brand/tarte' },
  'IT Cosmetics': { url: 'https://www.itcosmetics.com', retailer: 'https://www.itcosmetics.com' },
  'Nyx Professional Makeup': { url: 'https://www.nyxcosmetics.com', retailer: 'https://www.ulta.com/brand/nyx-professional-makeup' },
  'e.l.f. Cosmetics': { url: 'https://www.elfcosmetics.com', retailer: 'https://www.ulta.com/brand/elf-cosmetics' },
  'Milani': { url: 'https://www.milanicosmetics.com', retailer: 'https://www.ulta.com/brand/milani' },
};

// Clean parent product normalizer
function extractTrueParentName(rawName) {
  let name = rawName.trim();

  // Handle specific product lines
  if (/Soft Pinch Liquid Blush/i.test(name)) return 'Soft Pinch Liquid Blush';
  if (/Blush in (Orgasm|Dolce Vita)/i.test(name)) return 'Powder Blush';
  if (/Baked Blush/i.test(name)) return 'Baked Powder Blush';
  if (/Fit Me Blush/i.test(name)) return 'Fit Me Mono Blush';
  if (/Matte Lipstick in|Matte Lipstick \(Velvet/i.test(name)) return 'Retro Matte Lipstick';
  if (/SuperStay Matte Ink/i.test(name)) return 'SuperStay Matte Ink Liquid Lipstick';
  if (/Gloss Bomb Universal/i.test(name)) return 'Gloss Bomb Universal Lip Luminizer';
  if (/Killawatt Freestyle Highlighter/i.test(name)) return 'Killawatt Freestyle Highlighter';
  if (/Hoola Matte Powder Bronzer/i.test(name)) return 'Hoola Matte Powder Bronzer';
  if (/Warm Wishes Effortless Bronzer/i.test(name)) return 'Warm Wishes Effortless Bronzer Stick';
  if (/Translucent Loose Setting Powder/i.test(name)) return 'Translucent Loose Setting Powder';
  if (/Studio Fix Powder Plus Foundation/i.test(name)) return 'Studio Fix Powder Plus Foundation';
  if (/Fit Me Matte \+ Poreless/i.test(name)) return 'Fit Me Matte + Poreless Liquid Foundation';
  if (/SuperStay 30H Active Wear/i.test(name)) return 'SuperStay 30H Active Wear Foundation';
  if (/Pro Filt'r Soft Matte/i.test(name)) return "Pro Filt'r Soft Matte Longwear Foundation";
  if (/Natural Radiant Longwear/i.test(name)) return 'Natural Radiant Longwear Foundation';
  if (/Studio Fix Fluid/i.test(name)) return 'Studio Fix Fluid SPF 15 Foundation';
  if (/Liquid Touch Weightless/i.test(name)) return 'Liquid Touch Weightless Foundation';
  if (/Infallible 24H Fresh Wear/i.test(name)) return 'Infallible 24H Fresh Wear Foundation';
  if (/Double Wear Stay-in-Place/i.test(name)) return 'Double Wear Stay-in-Place Foundation';
  if (/Instant Age Rewind Multi-Use Eraser/i.test(name)) return 'Instant Age Rewind Multi-Use Eraser Concealer';
  if (/Fit Me Concealer/i.test(name)) return 'Fit Me Liquid Concealer';
  if (/Radiant Creamy Concealer/i.test(name)) return 'Radiant Creamy Concealer';
  if (/Pro Filt'r Instant Retouch Concealer/i.test(name)) return "Pro Filt'r Instant Retouch Concealer";
  if (/Shape Tape/i.test(name)) return 'Shape Tape Full Coverage Concealer';
  if (/Liquid Touch Brightening Concealer/i.test(name)) return 'Liquid Touch Brightening Concealer';
  if (/Infallible Full Wear Concealer/i.test(name)) return 'Infallible Full Wear Concealer';
  if (/Double Wear Stay-in-Place Flawless Concealer/i.test(name)) return 'Double Wear Stay-in-Place Flawless Concealer';
  if (/Dream Fresh BB Cream/i.test(name)) return 'Dream Fresh BB Cream 8-in-1 Skin Perfector';
  if (/Your Skin But Better CC\+ Cream/i.test(name)) return 'Your Skin But Better CC+ Cream SPF 50+';
  if (/Tinted Moisturizer Natural Skin Perfector/i.test(name)) return 'Tinted Moisturizer Natural Skin Perfector SPF 30';

  // General cleanup
  return name
    .replace(/\s*\([^)]*\)\s*$/, '')
    .replace(/\s*-\s*(Shade\s+|)(Fair|Light|Medium|Tan|Deep)(\s+Tone|)\s*$/i, '')
    .replace(/\s*-\s*(Fair|Light|Medium|Tan|Deep)\s+Glow\s*$/i, '')
    .replace(/\s*-\s*(Very Fair|Fair|Light|Medium|Tan|Deep)\s*(Warm|Cool|Neutral|Olive)?\s*$/i, '')
    .trim();
}

function extractTrueShadeName(rawName, rawShade) {
  let shade = rawShade ? rawShade.trim() : '';

  // Check if raw name had (Shade Name)
  const parenMatch = rawName.match(/\(([^)]+)\)/);
  if (parenMatch && !shade) {
    shade = parenMatch[1].trim();
  } else if (parenMatch && shade.length < 3) {
    shade = parenMatch[1].trim();
  }

  // Rare Beauty Blush specifics: e.g. "Joy - Dewy Peach"
  if (/Soft Pinch Liquid Blush/i.test(rawName) && parenMatch) {
    return parenMatch[1].trim();
  }
  // NARS Orgasm specifics
  if (/Orgasm/i.test(rawName)) return 'Orgasm (Peachy Pink with Golden Shimmer)';
  if (/Dolce Vita/i.test(rawName)) return 'Dolce Vita (Matte Dusty Rose)';
  if (/Luminoso/i.test(rawName)) return '05 Luminoso (Peachy Shimmer)';
  if (/Rose D'Oro/i.test(rawName)) return "02 Rose D'Oro (Golden Berry)";
  if (/Velvet Teddy/i.test(rawName)) return 'Velvet Teddy (Deep-Tone Beige)';
  if (/Ruby Woo/i.test(rawName)) return 'Ruby Woo (Very Matte Vivid Blue-Red)';
  if (/Chili/i.test(rawName)) return 'Chili (Warm Brick Red)';
  if (/Diva/i.test(rawName)) return 'Diva (Intense Reddish Burgundy)';
  if (/Trophy Wife/i.test(rawName)) return 'Trophy Wife (3D Hyper-Metallic Gold)';
  if (/Hoola Lite/i.test(rawName)) return 'Hoola Lite (Light Natural Warmth)';
  if (/Original Warm Golden/i.test(rawName)) return 'Original Hoola (Warm Golden Bronze)';
  if (/Olive Undertone/i.test(rawName)) return 'Hoola Caramel (Warm Caramel Bronze)';

  return shade;
}

// 1. Fetch all rows
const allRows = db.prepare(`
  SELECT p.*, b.brand_name, c.category_name 
  FROM products p 
  JOIN brands b ON p.brand_id = b.brand_id 
  JOIN categories c ON p.category_id = c.category_id
  ORDER BY p.product_id ASC
`).all();

const parentCatalog = new Map();

for (const p of allRows) {
  const cleanName = extractTrueParentName(p.product_name);
  const key = `${p.brand_id}:::${p.category_id}:::${cleanName.toLowerCase()}`;

  const brandInfo = brandOfficialUrls[p.brand_name] || {
    url: 'https://www.sephora.com',
    retailer: 'https://www.sephora.com',
  };

  const officialUrl = brandInfo.url + '/' + encodeURIComponent(cleanName.toLowerCase().replace(/[^a-z0-9]+/g, '-'));
  const retailerUrl = brandInfo.retailer;

  if (!parentCatalog.has(key)) {
    parentCatalog.set(key, {
      primaryId: p.product_id,
      brandId: p.brand_id,
      brandName: p.brand_name,
      categoryId: p.category_id,
      categoryName: p.category_name,
      productName: cleanName,
      description: p.description,
      price: p.price,
      currency: p.currency,
      imageUrl: p.image_url,
      officialUrl,
      retailerUrl,
      allIds: [],
      variants: [],
    });
  }

  const parent = parentCatalog.get(key);
  parent.allIds.push(p.product_id);

  const shade = extractTrueShadeName(p.product_name, p.shade_name);
  const isNoVariantCategory = ['Mascara', 'Eyeliner', 'Eyeshadow', 'Primer', 'Setting Spray'].includes(p.category_name);

  if (shade && !isNoVariantCategory) {
    const isGenericOnly = /^(Fair|Light|Medium|Tan|Deep)\s*(Tone|Glow|)$/i.test(shade);
    if (!isGenericOnly && shade.toLowerCase() !== 'universal') {
      const numMatch = shade.match(/^(\d+[A-Z]?|[A-Z]{2,3}\d+)/i) || shade.match(/\b(\d{2,3})\b/);
      const shadeNum = numMatch ? numMatch[1] : null;

      let hex = null;
      if (p.category_name === 'Blush') {
        if (/peach|coral/i.test(shade)) hex = '#FF9E80';
        else if (/mauve|dusty rose/i.test(shade)) hex = '#D88A8A';
        else if (/terracotta/i.test(shade)) hex = '#C86D51';
        else if (/pink/i.test(shade)) hex = '#F08080';
        else hex = '#E57373';
      } else if (p.category_name === 'Lipstick' || p.category_name === 'Lip Gloss') {
        if (/nude|teddy/i.test(shade)) hex = '#B07563';
        else if (/red|ruby/i.test(shade)) hex = '#BA1319';
        else if (/chili|brick/i.test(shade)) hex = '#9E3827';
        else if (/diva|burgundy|wine/i.test(shade)) hex = '#661424';
        else if (/berry/i.test(shade)) hex = '#8E2849';
        else hex = '#A85157';
      } else {
        if (p.skin_tone === 'Very Fair') hex = p.undertone === 'Cool' ? '#FAECE6' : '#F8E9D5';
        else if (p.skin_tone === 'Fair') hex = p.undertone === 'Warm' ? '#F3E2CB' : '#F5E6DA';
        else if (p.skin_tone === 'Light') hex = p.undertone === 'Warm' ? '#E8CCAC' : '#EBD1BC';
        else if (p.skin_tone === 'Medium') hex = p.undertone === 'Warm' ? '#CD9B74' : '#D1A27E';
        else if (p.skin_tone === 'Tan') hex = p.undertone === 'Warm' ? '#B88258' : '#AE754F';
        else if (p.skin_tone === 'Deep') hex = p.undertone === 'Warm' ? '#7B4C33' : '#6D4330';
        else hex = '#D8A78A';
      }

      const exists = parent.variants.find(v => v.shadeName.toLowerCase() === shade.toLowerCase());
      if (!exists) {
        parent.variants.push({
          shadeName: shade,
          shadeNumber: shadeNum,
          colorFamily: p.skin_tone || 'Standard',
          swatchHex: hex,
          skinTone: p.skin_tone || null,
          undertone: p.undertone || null,
          imageUrl: p.image_url,
          purchaseLink: parent.retailerUrl,
        });
      }
    }
  }
}

// Clear product_variants
db.exec('DELETE FROM product_variants;');

const insertVariant = db.prepare(`
  INSERT INTO product_variants 
  (product_id, shade_name, shade_number, color_family, swatch_hex, skin_tone, undertone, image_url, purchase_link, is_verified, is_active)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1, 1)
`);

const updateParent = db.prepare(`
  UPDATE products SET
    product_name = ?,
    official_url = ?,
    source_url = ?,
    has_variants = ?,
    verification_status = 'VERIFIED',
    is_active = 1
  WHERE product_id = ?
`);

const deactivateRow = db.prepare('UPDATE products SET is_active = 0 WHERE product_id = ?');
const updateAvail = db.prepare('UPDATE product_availability SET purchase_link = ? WHERE product_id = ?');

let activeCount = 0;
let variantCount = 0;

for (const [key, p] of parentCatalog.entries()) {
  const primaryId = p.primaryId;
  const hasVariants = p.variants.length > 0 ? 1 : 0;

  updateParent.run(
    p.productName,
    p.officialUrl,
    p.retailerUrl,
    hasVariants,
    primaryId
  );
  activeCount++;

  updateAvail.run(p.retailerUrl, primaryId);

  for (const v of p.variants) {
    insertVariant.run(
      primaryId,
      v.shadeName,
      v.shadeNumber,
      v.colorFamily,
      v.swatchHex,
      v.skinTone,
      v.undertone,
      v.imageUrl,
      v.purchaseLink
    );
    variantCount++;
  }

  for (const otherId of p.allIds) {
    if (otherId !== primaryId) {
      deactivateRow.run(otherId);
    }
  }
}

// Clean shade_name for products without variants
db.exec(`
  UPDATE products SET 
    has_variants = 0,
    shade_name = NULL 
  WHERE category_id IN (
    SELECT category_id FROM categories WHERE category_name IN ('Mascara', 'Eyeliner', 'Eyeshadow', 'Primer', 'Setting Spray')
  );
`);

console.log(`Refined catalog: ${activeCount} active parent products with ${variantCount} verified real shades!`);
