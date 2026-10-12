import { DatabaseSync } from 'node:sqlite';
import fs from 'node:fs';
import path from 'node:path';

const dbPath = path.resolve(process.cwd(), 'ai_makeupmatch.sqlite');
const db = new DatabaseSync(dbPath);

console.log('Seeding products across all beauty categories into ai_makeupmatch.sqlite...');

// Ensure barcode column exists
try {
  db.exec('ALTER TABLE products ADD COLUMN barcode VARCHAR(32) NULL');
} catch (e) {
  // column already exists
}

// Ensure all categories exist
const categories = [
  { id: 1, name: 'Foundation', desc: 'Liquid, cream, and stick foundations calibrated for full, medium, or sheer coverage.' },
  { id: 2, name: 'Concealer', desc: 'Brightening, blemish concealing, and color-correcting botanical liquid formulas.' },
  { id: 3, name: 'Setting Powder', desc: 'Translucent and tinted loose powders engineered for 12h shine control.' },
  { id: 4, name: 'Compact Powder', desc: 'Pressed powder foundations providing velvety matte touch-ups.' },
  { id: 5, name: 'BB Cream', desc: 'Blemish balm hybrids combining SPF hydration with lightweight skin tone matching.' },
  { id: 6, name: 'CC Cream', desc: 'Color-correcting tinted moisturizers combating redness and dullness.' },
  { id: 7, name: 'Primer', desc: 'Hydrating, pore-blurring, and mattifying bases to lock in foundation application.' },
  { id: 8, name: 'Tinted Moisturizer', desc: 'Ultra-breathable sheer dewy coverage for effortless daily wear.' },
  { id: 9, name: 'Bronzer', desc: 'Warm and olive sun-kissed powders sculpted for authentic facial warmth.' },
  { id: 10, name: 'Highlighter', desc: 'Luminous skin-enhancing pigments that catch calibrated daylight.' },
  { id: 11, name: 'Blush', desc: 'Mineral and cream cheek color pigments delivering healthy warmth.' },
  { id: 12, name: 'Lipstick', desc: 'Pigmented velvet, satin, and matte lip color formulas.' },
  { id: 13, name: 'Lip Gloss', desc: 'High-shine, plumping, and hydrating glosses with hyaluronic acid.' },
  { id: 14, name: 'Mascara', desc: 'Volumizing, lengthening, and waterproof lash formulations.' },
  { id: 15, name: 'Eyeliner', desc: 'Precision liquid, waterproof gel, and smudge-resistant pencil eyeliners.' },
  { id: 16, name: 'Eyeshadow', desc: 'Velvety matte and shimmering eyeshadow palettes.' },
];

for (const c of categories) {
  const existing = db.prepare('SELECT category_id FROM categories WHERE category_id = ?').get(c.id);
  if (!existing) {
    db.prepare('INSERT INTO categories (category_id, category_name, description) VALUES (?, ?, ?)').run(c.id, c.name, c.desc);
  } else {
    db.prepare('UPDATE categories SET category_name = ?, description = ? WHERE category_id = ?').run(c.name, c.desc, c.id);
  }
}

// Brand references
const brands = [
  { id: 1, name: 'Maybelline New York', origin: 'United States' },
  { id: 2, name: 'Fenty Beauty', origin: 'United States' },
  { id: 3, name: 'NARS Cosmetics', origin: 'France' },
  { id: 4, name: 'MAC Cosmetics', origin: 'Canada' },
  { id: 5, name: 'Rare Beauty', origin: 'United States' },
  { id: 6, name: "L'Oreal Paris", origin: 'France' },
  { id: 7, name: 'Estee Lauder', origin: 'United States' },
  { id: 8, name: 'Charlotte Tilbury', origin: 'United Kingdom' },
  { id: 9, name: 'Huda Beauty', origin: 'United Arab Emirates' },
  { id: 10, name: 'Clinique', origin: 'United States' },
  { id: 11, name: 'Anastasia Beverly Hills', origin: 'United States' },
  { id: 12, name: 'Dior Beauty', origin: 'France' },
  { id: 13, name: 'Bobbi Brown', origin: 'United States' },
  { id: 14, name: 'Laura Mercier', origin: 'France' },
  { id: 15, name: 'Make Up For Ever', origin: 'France' },
  { id: 16, name: 'Too Faced', origin: 'United States' },
  { id: 17, name: 'Urban Decay', origin: 'United States' },
  { id: 18, name: 'Smashbox', origin: 'United States' },
  { id: 19, name: 'NYX Professional Makeup', origin: 'United States' },
  { id: 20, name: 'e.l.f. Cosmetics', origin: 'United States' },
  { id: 21, name: 'Wet n Wild', origin: 'United States' },
  { id: 22, name: 'Milani', origin: 'United States' },
  { id: 23, name: 'Revlon', origin: 'United States' },
  { id: 24, name: 'Covergirl', origin: 'United States' },
  { id: 25, name: 'Benefit Cosmetics', origin: 'United States' },
  { id: 26, name: 'Glossier', origin: 'United States' },
  { id: 27, name: 'IT Cosmetics', origin: 'United States' },
  { id: 28, name: 'Hourglass Cosmetics', origin: 'United States' },
  { id: 29, name: 'Morphe', origin: 'United States' },
  { id: 30, name: 'ColourPop', origin: 'United States' },
  { id: 31, name: 'Milk Makeup', origin: 'United States' },
  { id: 32, name: 'Laura Geller', origin: 'United States' },
  { id: 33, name: 'Tarte Cosmetics', origin: 'United States' },
  { id: 34, name: 'Flormar', origin: 'Turkey' },
  { id: 35, name: 'Lafz', origin: 'Bangladesh' },
  { id: 36, name: 'Amazon Beauty Hub', origin: 'United States' },
  { id: 37, name: 'Sephora Collection', origin: 'France' },
  { id: 38, name: 'Ulta Beauty Collection', origin: 'United States' },
  { id: 39, name: 'Shajgoj Curated', origin: 'Bangladesh' },
  { id: 40, name: 'Nykaa Cosmetics', origin: 'India' },
  { id: 41, name: 'Boots No7', origin: 'United Kingdom' },
  { id: 42, name: 'KVD Beauty', origin: 'United States' },
];

for (const b of brands) {
  const existing = db.prepare('SELECT brand_id FROM brands WHERE brand_id = ?').get(b.id);
  if (!existing) {
    db.prepare('INSERT INTO brands (brand_id, brand_name, country_origin, website) VALUES (?, ?, ?, ?)').run(b.id, b.name, b.origin, `https://example.com/${b.id}`);
  }
}

// Clear old products to recreate clean balanced catalog
db.exec('DELETE FROM favorites');
db.exec('DELETE FROM recommendations');
db.exec('DELETE FROM product_availability');
db.exec('DELETE FROM products');

console.log('Inserting products across ALL categories...');

const insertProd = db.prepare(`
  INSERT INTO products (
    product_id, barcode, brand_id, category_id, product_name, description, price, currency,
    image_url, skin_tone, undertone, shade_name, source_url, source_name, is_verified, is_active
  ) VALUES (
    ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, 1
  )
`);

const insertAvail = db.prepare(`
  INSERT INTO product_availability (
    product_id, country, is_available, purchase_link, local_price, currency
  ) VALUES (
    ?, ?, ?, ?, ?, ?
  )
`);

const tones = ['Very Fair', 'Fair', 'Light', 'Medium', 'Tan', 'Deep'];
const undertones = ['Warm', 'Cool', 'Neutral', 'Olive'];

let currentId = 1;

function addProduct(params) {
  const id = currentId++;
  const barcode = params.barcode || `890${String(id).padStart(9, '0')}`;
  insertProd.run(
    id,
    barcode,
    params.brandId,
    params.categoryId,
    params.name,
    params.description,
    params.price,
    params.currency || '৳',
    params.imageUrl || null,
    params.skinTone || 'Medium',
    params.undertone || 'Warm',
    params.shadeName || null,
    params.sourceUrl || `https://world.openbeautyfacts.org/product/${barcode}`,
    params.sourceName || 'Open Beauty Facts'
  );

  // Add availability for Bangladesh and Global markets
  const countries = ['Bangladesh', 'United States', 'United Kingdom', 'Canada', 'Australia', 'India'];
  for (const c of countries) {
    const isAvail = c === 'Bangladesh' || Math.random() > 0.15 ? 1 : 0;
    const localP = c === 'Bangladesh' ? params.price : Math.round(params.price / 115);
    const curr = c === 'Bangladesh' ? '৳' : c === 'United States' || c === 'Canada' || c === 'Australia' ? '$' : c === 'United Kingdom' ? '£' : '₹';
    insertAvail.run(
      id,
      c,
      isAvail,
      params.sourceUrl || 'https://shajgoj.com',
      localP,
      curr
    );
  }
}

// 1. FOUNDATIONS (250 shades across 8 top brands)
const foundationShades = [
  { brandId: 1, brand: 'Maybelline New York', line: 'Fit Me Matte + Poreless Foundation', price: 1350, img: 'https://images.openbeautyfacts.org/images/products/360/053/132/4483/front_nl.13.400.jpg' },
  { brandId: 1, brand: 'Maybelline New York', line: 'SuperStay 30H Active Wear Foundation', price: 1650, img: 'https://images.openbeautyfacts.org/images/products/360/053/151/8042/front_en.11.400.jpg' },
  { brandId: 2, brand: 'Fenty Beauty', line: 'Pro Filt\'r Soft Matte Longwear Foundation', price: 4200, img: 'https://images.openbeautyfacts.org/images/products/084/004/320/0034/front_en.3.400.jpg' },
  { brandId: 3, brand: 'NARS Cosmetics', line: 'Natural Radiant Longwear Foundation', price: 5400, img: 'https://images.openbeautyfacts.org/images/products/607/845/066/033/front_en.3.400.jpg' },
  { brandId: 4, brand: 'MAC Cosmetics', line: 'Studio Fix Fluid SPF 15 Foundation', price: 4100, img: 'https://images.openbeautyfacts.org/images/products/077/360/201/0531/front_en.3.400.jpg' },
  { brandId: 5, brand: 'Rare Beauty', line: 'Liquid Touch Weightless Foundation', price: 3800, img: 'https://images.openbeautyfacts.org/images/products/084/012/290/1000/front_en.3.400.jpg' },
  { brandId: 6, brand: "L'Oreal Paris", line: 'Infallible 24H Fresh Wear Foundation', price: 1750, img: 'https://images.openbeautyfacts.org/images/products/360/052/361/4486/front_en.3.400.jpg' },
  { brandId: 7, brand: 'Estee Lauder', line: 'Double Wear Stay-in-Place Foundation', price: 5800, img: 'https://images.openbeautyfacts.org/images/products/027/131/157/679/front_en.3.400.jpg' },
];

const toneShadeNames = {
  'Very Fair': ['100 Porcelain', '102 Fair Beige', '105 Fair Ivory', '108 Alabaster Light'],
  'Fair': ['110 Alabaster', '112 Natural Ivory', '115 Warm Ivory', '118 Light Cream'],
  'Light': ['120 Classic Ivory', '122 Creamy Beige', '125 Nude Beige', '128 Warm Nude', '130 Buff Beige', '140 Golden Light'],
  'Medium': ['210 Sandy Beige', '220 Natural Beige', '222 True Beige', '225 Soft Golden', '228 Soft Tan', '230 Natural Buff', '235 Pure Beige', '238 Rich Sun Beige', '240 Warm Golden', '245 Olive Medium', '250 Golden Honey'],
  'Tan': ['310 Sun Beige', '312 Amber Beige', '320 Natural Tan', '322 Warm Tan', '330 Toffee', '332 Golden Caramel', '335 Classic Tan', '340 Cappuccino', '345 Warm Olive Tan'],
  'Deep': ['355 Coconut', '360 Mocha', '362 Deep Golden', '365 Nutmeg', '370 Deep Bronze', '375 Java', '380 Espresso', '390 Rich Cocoa']
};

for (const f of foundationShades) {
  for (const [tone, shades] of Object.entries(toneShadeNames)) {
    for (const shade of shades) {
      const undertone = shade.includes('Warm') || shade.includes('Golden') || shade.includes('Honey') || shade.includes('Sun') || shade.includes('Olive') ? 'Warm' : shade.includes('Beige') || shade.includes('Ivory') || shade.includes('Mocha') ? 'Neutral' : 'Cool';
      addProduct({
        brandId: f.brandId,
        categoryId: 1,
        name: `${f.line} (${shade})`,
        description: `Authentic full-coverage liquid foundation from ${f.brand}. Formulated for ${tone} complexion with ${undertone} undertones.`,
        price: f.price,
        imageUrl: f.img,
        skinTone: tone,
        undertone: undertone,
        shadeName: shade,
      });
    }
  }
}

// 2. CONCEALERS (150 items across top formulas)
const concealers = [
  { brandId: 1, brand: 'Maybelline New York', line: 'Instant Age Rewind Multi-Use Eraser Concealer', price: 1150, img: 'https://images.openbeautyfacts.org/images/products/360/053/073/3859/front_en.11.400.jpg' },
  { brandId: 1, brand: 'Maybelline New York', line: 'Fit Me Concealer', price: 950, img: 'https://images.openbeautyfacts.org/images/products/360/053/073/3859/front_en.11.400.jpg' },
  { brandId: 3, brand: 'NARS Cosmetics', line: 'Radiant Creamy Concealer', price: 3800, img: 'https://images.openbeautyfacts.org/images/products/607/845/012/344/front_en.3.400.jpg' },
  { brandId: 5, brand: 'Rare Beauty', line: 'Liquid Touch Brightening Concealer', price: 2950, img: 'https://images.openbeautyfacts.org/images/products/084/012/290/1000/front_en.3.400.jpg' },
  { brandId: 6, brand: "L'Oreal Paris", line: 'Infallible Full Wear More Than Concealer', price: 1450, img: 'https://images.openbeautyfacts.org/images/products/360/052/361/4486/front_en.3.400.jpg' },
  { brandId: 20, brand: 'e.l.f. Cosmetics', line: '16HR Camo Concealer', price: 850, img: 'https://images.openbeautyfacts.org/images/products/060/933/285/8510/front_en.3.400.jpg' },
  { brandId: 33, brand: 'Tarte Cosmetics', line: 'Shape Tape Full Coverage Concealer', price: 3600, img: 'https://images.openbeautyfacts.org/images/products/084/673/301/1234/front_en.3.400.jpg' },
];

const concealerShades = [
  { tone: 'Very Fair', shades: ['05 Ivory', '10 Light Fair', '11 Cool Alabaster'] },
  { tone: 'Fair', shades: ['15 Fair Neutral', '20 Light Warm', '22 Light Honey'] },
  { tone: 'Light', shades: ['25 Light Medium', '30 Medium Light', '32 Golden Buff'] },
  { tone: 'Medium', shades: ['35 Medium Golden', '40 Sand Medium', '45 Honey Glow', '50 Medium Olive', '55 Warm Caramel'] },
  { tone: 'Tan', shades: ['60 Tan Warm', '65 Deep Tan', '70 Toffee Bronze'] },
  { tone: 'Deep', shades: ['75 Rich Hazelnut', '80 Deep Cocoa', '85 Espresso'] },
];

for (const c of concealers) {
  for (const group of concealerShades) {
    for (const shade of group.shades) {
      const undertone = shade.includes('Warm') || shade.includes('Golden') || shade.includes('Honey') || shade.includes('Bronze') ? 'Warm' : shade.includes('Cool') || shade.includes('Alabaster') ? 'Cool' : 'Neutral';
      addProduct({
        brandId: c.brandId,
        categoryId: 2,
        name: `${c.line} (${shade})`,
        description: `Award-winning brightening concealer from ${c.brand}. Crease-resistant 24h wear for ${group.tone} complexion with ${undertone} undertones.`,
        price: c.price,
        imageUrl: c.img,
        skinTone: group.tone,
        undertone: undertone,
        shadeName: shade,
      });
    }
  }
}

// 3. SETTING POWDER (80 items)
const settingPowders = [
  { brandId: 14, brand: 'Laura Mercier', line: 'Translucent Loose Setting Powder', price: 4600, img: 'https://images.openbeautyfacts.org/images/products/073/615/017/0034/front_en.3.400.jpg' },
  { brandId: 1, brand: 'Maybelline New York', line: 'Fit Me Loose Finishing Powder', price: 1250, img: 'https://images.openbeautyfacts.org/images/products/041/554/502/012/front_en.3.400.jpg' },
  { brandId: 9, brand: 'Huda Beauty', line: 'Easy Bake Loose Baking & Setting Powder', price: 4400, img: 'https://images.openbeautyfacts.org/images/products/629/110/603/1234/front_en.3.400.jpg' },
  { brandId: 2, brand: 'Fenty Beauty', line: 'Pro Filt\'r Instant Retouch Setting Powder', price: 3800, img: 'https://images.openbeautyfacts.org/images/products/084/004/320/0034/front_en.3.400.jpg' },
  { brandId: 19, brand: 'NYX Professional Makeup', line: 'HD Studio Photogenic Finishing Powder', price: 1100, img: 'https://images.openbeautyfacts.org/images/products/080/089/709/1234/front_en.3.400.jpg' },
];

const powderShades = [
  { tone: 'Very Fair', undertone: 'Neutral', shade: 'Translucent 01' },
  { tone: 'Fair', undertone: 'Cool', shade: 'Fair Rose 05' },
  { tone: 'Light', undertone: 'Warm', shade: 'Light 10' },
  { tone: 'Medium', undertone: 'Warm', shade: 'Banana Warm 20' },
  { tone: 'Medium', undertone: 'Neutral', shade: 'Medium 25' },
  { tone: 'Medium', undertone: 'Olive', shade: 'Olive Medium 28' },
  { tone: 'Tan', undertone: 'Warm', shade: 'Honey Bronze 30' },
  { tone: 'Deep', undertone: 'Neutral', shade: 'Deep Rich Coffee 40' },
];

for (const sp of settingPowders) {
  for (const ps of powderShades) {
    addProduct({
      brandId: sp.brandId,
      categoryId: 3,
      name: `${sp.line} - ${ps.shade}`,
      description: `Micro-milled pore-blurring loose setting powder by ${sp.brand}. 16-hour shine control and photo-friendly flashback-free finish.`,
      price: sp.price,
      imageUrl: sp.img,
      skinTone: ps.tone,
      undertone: ps.undertone,
      shadeName: ps.shade,
    });
  }
}

// 4. COMPACT POWDER (80 items)
const compactPowders = [
  { brandId: 4, brand: 'MAC Cosmetics', line: 'Studio Fix Powder Plus Foundation', price: 3950, img: 'https://images.openbeautyfacts.org/images/products/077/360/201/0531/front_en.3.400.jpg' },
  { brandId: 1, brand: 'Maybelline New York', line: 'Fit Me Matte + Poreless Pressed Powder', price: 1050, img: 'https://images.openbeautyfacts.org/images/products/360/053/132/4483/front_nl.13.400.jpg' },
  { brandId: 6, brand: "L'Oreal Paris", line: 'Infallible 24H Fresh Wear Foundation-in-a-Powder', price: 1650, img: 'https://images.openbeautyfacts.org/images/products/360/052/361/4486/front_en.3.400.jpg' },
  { brandId: 8, brand: 'Charlotte Tilbury', line: 'Airbrush Flawless Finish Setting Powder', price: 5400, img: 'https://images.openbeautyfacts.org/images/products/506/054/272/1234/front_en.3.400.jpg' },
];

for (const cp of compactPowders) {
  for (const tone of tones) {
    for (const ut of ['Warm', 'Neutral', 'Cool']) {
      addProduct({
        brandId: cp.brandId,
        categoryId: 4,
        name: `${cp.line} - ${tone} ${ut}`,
        description: `Silky velvety pressed compact powder from ${cp.brand}. Medium buildable matte coverage with oil control.`,
        price: cp.price,
        imageUrl: cp.img,
        skinTone: tone,
        undertone: ut,
        shadeName: `${tone} ${ut}`,
      });
    }
  }
}

// 5. BB CREAM & CC CREAM & TINTED MOISTURIZER (90 items)
const hybridComplexions = [
  { brandId: 1, brand: 'Maybelline New York', line: 'Dream Fresh BB Cream 8-in-1 Skin Perfector', catId: 5, price: 1100, img: 'https://images.openbeautyfacts.org/images/products/360/053/073/3859/front_en.11.400.jpg' },
  { brandId: 27, brand: 'IT Cosmetics', line: 'Your Skin But Better CC+ Cream SPF 50+', catId: 6, price: 4400, img: 'https://images.openbeautyfacts.org/images/products/084/222/210/0123/front_en.3.400.jpg' },
  { brandId: 6, brand: "L'Oreal Paris", line: 'Magic Skin Beautifier BB Cream', catId: 5, price: 1350, img: 'https://images.openbeautyfacts.org/images/products/360/052/361/4486/front_en.3.400.jpg' },
  { brandId: 14, brand: 'Laura Mercier', line: 'Tinted Moisturizer Natural Skin Perfector SPF 30', catId: 8, price: 4800, img: 'https://images.openbeautyfacts.org/images/products/073/615/017/0034/front_en.3.400.jpg' },
  { brandId: 5, brand: 'Rare Beauty', line: 'Positive Light Tinted Moisturizer Broad Spectrum SPF 20', catId: 8, price: 3400, img: 'https://images.openbeautyfacts.org/images/products/084/012/290/1000/front_en.3.400.jpg' },
];

for (const hc of hybridComplexions) {
  for (const tone of tones) {
    for (const ut of ['Warm', 'Neutral']) {
      addProduct({
        brandId: hc.brandId,
        categoryId: hc.catId,
        name: `${hc.line} (${tone} ${ut})`,
        description: `Hydrating hybrid complexion enhancer infused with skincare actives and broad spectrum SPF from ${hc.brand}.`,
        price: hc.price,
        imageUrl: hc.img,
        skinTone: tone,
        undertone: ut,
        shadeName: `${tone} ${ut}`,
      });
    }
  }
}

// 6. PRIMERS (40 items)
const primers = [
  { brandId: 18, brand: 'Smashbox', line: 'The Original Photo Finish Smooth & Blur Primer', price: 3950, img: 'https://images.openbeautyfacts.org/images/products/060/771/001/0012/front_en.3.400.jpg' },
  { brandId: 25, brand: 'Benefit Cosmetics', line: 'The POREfessional Pore Minimizing Primer', price: 3800, img: 'https://images.openbeautyfacts.org/images/products/060/200/400/1234/front_en.3.400.jpg' },
  { brandId: 20, brand: 'e.l.f. Cosmetics', line: 'Power Grip Primer with 4% Niacinamide', price: 1250, img: 'https://images.openbeautyfacts.org/images/products/060/933/285/8510/front_en.3.400.jpg' },
  { brandId: 1, brand: 'Maybelline New York', line: 'Baby Skin Instant Pore Eraser Primer', price: 950, img: 'https://images.openbeautyfacts.org/images/products/360/053/073/3859/front_en.11.400.jpg' },
  { brandId: 6, brand: "L'Oreal Paris", line: 'Prime Lab 24H Pore Minimizer', price: 1600, img: 'https://images.openbeautyfacts.org/images/products/360/052/361/4486/front_en.3.400.jpg' },
  { brandId: 4, brand: 'MAC Cosmetics', line: 'Prep + Prime Fix+ Primer & Setting Spray', price: 3300, img: 'https://images.openbeautyfacts.org/images/products/077/360/201/0531/front_en.3.400.jpg' },
];

for (const pr of primers) {
  for (const t of ['Fair', 'Medium', 'Tan']) {
    addProduct({
      brandId: pr.brandId,
      categoryId: 7,
      name: `${pr.line}`,
      description: `Weightless smoothing base primer by ${pr.brand}. Locks in foundation for up to 16 hours and creates a velvety canvas.`,
      price: pr.price,
      imageUrl: pr.img,
      skinTone: t,
      undertone: 'Warm',
      shadeName: 'Universal Invisible',
    });
  }
}

// 7. BRONZERS (50 items)
const bronzers = [
  { brandId: 25, brand: 'Benefit Cosmetics', line: 'Hoola Matte Powder Bronzer', price: 3800, img: 'https://images.openbeautyfacts.org/images/products/060/200/400/1234/front_en.3.400.jpg' },
  { brandId: 2, brand: 'Fenty Beauty', line: 'Sun Stalk\'r Instant Warmth Bronzer', price: 3950, img: 'https://images.openbeautyfacts.org/images/products/084/004/320/0034/front_en.3.400.jpg' },
  { brandId: 3, brand: 'NARS Cosmetics', line: 'Laguna Bronzing Powder', price: 4400, img: 'https://images.openbeautyfacts.org/images/products/607/845/012/344/front_en.3.400.jpg' },
  { brandId: 22, brand: 'Milani', line: 'Silky Matte Bronzing Powder', price: 1550, img: 'https://images.openbeautyfacts.org/images/products/071/748/970/1234/front_en.3.400.jpg' },
];

const bronzerShades = [
  { tone: 'Fair', shade: 'Hoola Lite / Sun Sizzle 01', ut: 'Neutral' },
  { tone: 'Medium', shade: 'Original Warm Golden 02', ut: 'Warm' },
  { tone: 'Medium', shade: 'Olive Undertone Terracotta 03', ut: 'Olive' },
  { tone: 'Tan', shade: 'Caramel Sunkissed 04', ut: 'Warm' },
  { tone: 'Deep', shade: 'Deep Mocha Bronze 05', ut: 'Warm' },
];

for (const b of bronzers) {
  for (const bs of bronzerShades) {
    addProduct({
      brandId: b.brandId,
      categoryId: 9,
      name: `${b.line} (${bs.shade})`,
      description: `Seamless sculpted matte warmth from ${b.brand}. Infused with silky pigments for natural dimension.`,
      price: b.price,
      imageUrl: b.img,
      skinTone: bs.tone,
      undertone: bs.ut,
      shadeName: bs.shade,
    });
  }
}

// 8. HIGHLIGHTERS (50 items)
const highlighters = [
  { brandId: 2, brand: 'Fenty Beauty', line: 'Killawatt Freestyle Highlighter (Trophy Wife Gold)', price: 4200, tone: 'Medium', ut: 'Warm', img: 'https://images.openbeautyfacts.org/images/products/084/004/320/0034/front_en.3.400.jpg' },
  { brandId: 2, brand: 'Fenty Beauty', line: 'Killawatt Freestyle Highlighter (Lightning Dust/Fire Crystal)', price: 4200, tone: 'Fair', ut: 'Cool', img: 'https://images.openbeautyfacts.org/images/products/084/004/320/0034/front_en.3.400.jpg' },
  { brandId: 5, brand: 'Rare Beauty', line: 'Positive Light Liquid Luminizer (Mesmerize Rose Gold)', price: 2950, tone: 'Medium', ut: 'Warm', img: 'https://images.openbeautyfacts.org/images/products/084/012/290/1000/front_en.3.400.jpg' },
  { brandId: 5, brand: 'Rare Beauty', line: 'Positive Light Liquid Luminizer (Enlighten Champagne)', price: 2950, tone: 'Fair', ut: 'Neutral', img: 'https://images.openbeautyfacts.org/images/products/084/012/290/1000/front_en.3.400.jpg' },
  { brandId: 18, brand: 'Smashbox', line: 'Shimmering Skin Perfector Pressed (Champagne Pop)', price: 4200, tone: 'Medium', ut: 'Warm', img: 'https://images.openbeautyfacts.org/images/products/060/771/001/0012/front_en.3.400.jpg' },
  { brandId: 1, brand: 'Maybelline New York', line: 'Master Chrome Metallic Highlighter (Molten Gold)', price: 1250, tone: 'Medium', ut: 'Warm', img: 'https://images.openbeautyfacts.org/images/products/360/053/132/4483/front_nl.13.400.jpg' },
  { brandId: 1, brand: 'Maybelline New York', line: 'Master Chrome Metallic Highlighter (Rose Gold)', price: 1250, tone: 'Fair', ut: 'Cool', img: 'https://images.openbeautyfacts.org/images/products/360/053/132/4483/front_nl.13.400.jpg' },
];

for (const hl of highlighters) {
  for (const t of [hl.tone, 'Tan', 'Deep']) {
    addProduct({
      brandId: hl.brandId,
      categoryId: 10,
      name: `${hl.line} - ${t} Glow`,
      description: `Ultra-reflective micro-pearl formula from ${hl.brand} for a radiant lit-from-within glow.`,
      price: hl.price,
      imageUrl: hl.img,
      skinTone: t,
      undertone: hl.ut,
      shadeName: hl.line.split('(')[1]?.replace(')', '') || 'Radiant Pearl',
    });
  }
}

// 9. BLUSHES (70 items)
const blushes = [
  { brandId: 5, brand: 'Rare Beauty', line: 'Soft Pinch Liquid Blush (Joy - Dewy Peach)', price: 2950, tone: 'Medium', ut: 'Warm', img: 'https://images.openbeautyfacts.org/images/products/084/012/290/1000/front_en.3.400.jpg' },
  { brandId: 5, brand: 'Rare Beauty', line: 'Soft Pinch Liquid Blush (Hope - Nude Mauve)', price: 2950, tone: 'Fair', ut: 'Neutral', img: 'https://images.openbeautyfacts.org/images/products/084/012/290/1000/front_en.3.400.jpg' },
  { brandId: 5, brand: 'Rare Beauty', line: 'Soft Pinch Liquid Blush (Love - Matte Terracotta)', price: 2950, tone: 'Tan', ut: 'Warm', img: 'https://images.openbeautyfacts.org/images/products/084/012/290/1000/front_en.3.400.jpg' },
  { brandId: 5, brand: 'Rare Beauty', line: 'Soft Pinch Liquid Blush (Encourage - Soft Neutral Pink)', price: 2950, tone: 'Medium', ut: 'Neutral', img: 'https://images.openbeautyfacts.org/images/products/084/012/290/1000/front_en.3.400.jpg' },
  { brandId: 3, brand: 'NARS Cosmetics', line: 'Blush in Orgasm (Peachy Pink with Golden Shimmer)', price: 3750, tone: 'Medium', ut: 'Warm', img: 'https://images.openbeautyfacts.org/images/products/607/845/012/344/front_en.3.400.jpg' },
  { brandId: 3, brand: 'NARS Cosmetics', line: 'Blush in Dolce Vita (Matte Dusty Rose)', price: 3750, tone: 'Tan', ut: 'Warm', img: 'https://images.openbeautyfacts.org/images/products/607/845/012/344/front_en.3.400.jpg' },
  { brandId: 22, brand: 'Milani', line: 'Baked Blush (Luminoso Peachy Shimmer)', price: 1450, tone: 'Medium', ut: 'Warm', img: 'https://images.openbeautyfacts.org/images/products/071/748/970/1234/front_en.3.400.jpg' },
  { brandId: 22, brand: 'Milani', line: 'Baked Blush (Rose D\'Oro Golden Berry)', price: 1450, tone: 'Tan', ut: 'Warm', img: 'https://images.openbeautyfacts.org/images/products/071/748/970/1234/front_en.3.400.jpg' },
  { brandId: 1, brand: 'Maybelline New York', line: 'Fit Me Blush (Peach 35)', price: 850, tone: 'Medium', ut: 'Warm', img: 'https://images.openbeautyfacts.org/images/products/360/053/132/4483/front_nl.13.400.jpg' },
  { brandId: 1, brand: 'Maybelline New York', line: 'Fit Me Blush (Rose 25)', price: 850, tone: 'Fair', ut: 'Cool', img: 'https://images.openbeautyfacts.org/images/products/360/053/132/4483/front_nl.13.400.jpg' },
];

for (const bl of blushes) {
  for (const t of ['Fair', 'Light', 'Medium', 'Tan', 'Deep']) {
    addProduct({
      brandId: bl.brandId,
      categoryId: 11,
      name: `${bl.line} - ${t} Tone`,
      description: `High-impact blendable cheek color from ${bl.brand}. Natural flushed radiance.`,
      price: bl.price,
      imageUrl: bl.img,
      skinTone: t,
      undertone: bl.ut,
      shadeName: bl.line.split('(')[1]?.replace(')', '') || 'Rosy Glow',
    });
  }
}

// 10. LIPSTICKS & LIP GLOSSES (60 items)
const lipItems = [
  { brandId: 4, brand: 'MAC Cosmetics', line: 'Matte Lipstick (Velvet Teddy Warm Nude)', catId: 12, price: 2600, tone: 'Medium', ut: 'Warm', img: 'https://images.openbeautyfacts.org/images/products/077/360/201/0531/front_en.3.400.jpg' },
  { brandId: 4, brand: 'MAC Cosmetics', line: 'Retro Matte Lipstick (Ruby Woo Iconic Red)', catId: 12, price: 2600, tone: 'Fair', ut: 'Cool', img: 'https://images.openbeautyfacts.org/images/products/077/360/201/0531/front_en.3.400.jpg' },
  { brandId: 4, brand: 'MAC Cosmetics', line: 'Matte Lipstick (Taupe Muted Reddish Taupe)', catId: 12, price: 2600, tone: 'Tan', ut: 'Warm', img: 'https://images.openbeautyfacts.org/images/products/077/360/201/0531/front_en.3.400.jpg' },
  { brandId: 8, brand: 'Charlotte Tilbury', line: 'Matte Revolution Lipstick (Pillow Talk)', catId: 12, price: 4200, tone: 'Fair', ut: 'Neutral', img: 'https://images.openbeautyfacts.org/images/products/506/054/272/1234/front_en.3.400.jpg' },
  { brandId: 1, brand: 'Maybelline New York', line: 'SuperStay Matte Ink (130 Self-Starter Terracotta)', catId: 12, price: 1150, tone: 'Medium', ut: 'Warm', img: 'https://images.openbeautyfacts.org/images/products/360/053/151/8042/front_en.11.400.jpg' },
  { brandId: 1, brand: 'Maybelline New York', line: 'SuperStay Matte Ink (117 Ground-Breaker Crimson)', catId: 12, price: 1150, tone: 'Tan', ut: 'Warm', img: 'https://images.openbeautyfacts.org/images/products/360/053/151/8042/front_en.11.400.jpg' },
  { brandId: 2, brand: 'Fenty Beauty', line: 'Gloss Bomb Universal Lip Luminizer (Fenty Glow)', catId: 13, price: 2550, tone: 'Medium', ut: 'Warm', img: 'https://images.openbeautyfacts.org/images/products/084/004/320/0034/front_en.3.400.jpg' },
  { brandId: 1, brand: 'Maybelline New York', line: 'Lifter Gloss with Hyaluronic Acid (008 Stone)', catId: 13, price: 1250, tone: 'Medium', ut: 'Neutral', img: 'https://images.openbeautyfacts.org/images/products/360/053/151/8042/front_en.11.400.jpg' },
];

for (const li of lipItems) {
  for (const t of ['Fair', 'Medium', 'Tan', 'Deep']) {
    addProduct({
      brandId: li.brandId,
      categoryId: li.catId,
      name: `${li.line} - Shade ${t}`,
      description: `Pigmented high-performance lip formulation from ${li.brand}.`,
      price: li.price,
      imageUrl: li.img,
      skinTone: t,
      undertone: li.ut,
      shadeName: li.line.split('(')[1]?.replace(')', '') || 'Classic',
    });
  }
}

// 11. MASCARA, EYELINER, EYESHADOW (60 items)
const eyeItems = [
  { brandId: 1, brand: 'Maybelline New York', line: 'Lash Sensational Sky High Waterproof Mascara', catId: 14, price: 1350, img: 'https://images.openbeautyfacts.org/images/products/360/053/151/8042/front_en.11.400.jpg' },
  { brandId: 6, brand: "L'Oreal Paris", line: 'Voluminous Lash Paradise Waterproof Mascara', catId: 14, price: 1450, img: 'https://images.openbeautyfacts.org/images/products/360/052/361/4486/front_en.3.400.jpg' },
  { brandId: 1, brand: 'Maybelline New York', line: 'Hyper Easy Liquid Brush Tip Pen Eyeliner', catId: 15, price: 950, img: 'https://images.openbeautyfacts.org/images/products/360/053/151/8042/front_en.11.400.jpg' },
  { brandId: 19, brand: 'NYX Professional Makeup', line: 'Epic Ink Waterproof Precision Liquid Eyeliner', catId: 15, price: 1200, img: 'https://images.openbeautyfacts.org/images/products/080/089/709/1234/front_en.3.400.jpg' },
  { brandId: 17, brand: 'Urban Decay', line: 'Naked3 Rose-Gold Neutral Eyeshadow Palette', catId: 16, price: 6200, img: 'https://images.openbeautyfacts.org/images/products/360/597/012/1234/front_en.3.400.jpg' },
  { brandId: 11, brand: 'Anastasia Beverly Hills', line: 'Soft Glam Eyeshadow Palette', catId: 16, price: 5800, img: 'https://images.openbeautyfacts.org/images/products/068/930/418/1234/front_en.3.400.jpg' },
];

for (const ei of eyeItems) {
  for (const t of ['Fair', 'Medium', 'Tan']) {
    addProduct({
      brandId: ei.brandId,
      categoryId: ei.catId,
      name: `${ei.line}`,
      description: `High performance eye formulation from ${ei.brand}. Smudge-proof and 24h wear.`,
      price: ei.price,
      imageUrl: ei.img,
      skinTone: t,
      undertone: 'Warm',
      shadeName: 'Universal',
    });
  }
}

const totalCount = db.prepare('SELECT COUNT(*) as count FROM products').get().count;
const categoryCounts = db.prepare(`
  SELECT c.category_name, COUNT(p.product_id) as count
  FROM categories c
  LEFT JOIN products p ON c.category_id = p.category_id
  GROUP BY c.category_id
  ORDER BY count DESC
`).all();

console.log(`\n========================================`);
console.log(` DATABASE RE-SEEDED SUCCESSFULLY!`);
console.log(` Total Products: ${totalCount}`);
console.log(`========================================`);
console.table(categoryCounts);
