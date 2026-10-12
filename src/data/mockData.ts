import { BrandItem, CategoryItem, Product, SkinAnalysisResult, UserProfile } from '../types/index';
import productsJson from './mockProductsData.json';

// Real authentic cosmetics photography assets
export const heroImg = 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=1200&auto=format&fit=crop&q=85';
export const foundationImg = 'https://images.openbeautyfacts.org/images/products/360/053/132/4483/front_nl.13.400.jpg';
export const concealerImg = 'https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=800&auto=format&fit=crop&q=80';
export const powderImg = 'https://images.unsplash.com/photo-1512496015851-a90fb38ba796?w=800&auto=format&fit=crop&q=80';

export const initialUserProfile: UserProfile = {
  id: 'usr_001',
  name: 'Anika Rahman',
  email: 'anika.rahman@example.com',
  role: 'user',
  skinTone: 'Medium',
  undertone: 'Warm',
  budget: 3000,
  currency: '৳',
  country: 'Bangladesh',
  savedFavoriteIds: ['prod_1', 'prod_3'],
  compareListIds: ['prod_1', 'prod_2'],
  lastAnalysisDate: 'Oct 03, 2026',
};

export const adminUserProfile: UserProfile = {
  id: 'usr_admin',
  name: 'System Administrator',
  email: 'admin@gmail.com',
  role: 'admin',
  skinTone: 'Medium',
  undertone: 'Warm',
  budget: 10000,
  currency: '৳',
  country: 'Bangladesh',
  savedFavoriteIds: [],
  compareListIds: [],
  lastAnalysisDate: 'Oct 06, 2026',
};

export const defaultAnalysisResult: SkinAnalysisResult = {
  skinTone: 'Medium',
  undertone: 'Warm',
  confidence: 87,
  analyzedAt: '2026-10-04T02:00:00.000Z',
  hexColor: '#CD9B74',
  shadeFamily: 'Golden Warm Medium (Tone 04 / W3)',
  lightingQuality: 'Optimal',
  notes: 'High clarity selfie detected with balanced natural light exposure. Golden and yellow spectral pigment dominance across cheekbone and jawline regions indicates a definitive Warm undertone with Medium melanin depth.',
};

export const sampleUploadImages = [
  {
    id: 'sample_01',
    label: 'Warm Medium Complexion',
    tone: 'Medium',
    undertone: 'Warm',
    hex: '#CD9B74',
    url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=500&auto=format&fit=crop&q=80',
    fallbackLocal: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=500&auto=format&fit=crop&q=80',
  },
  {
    id: 'sample_02',
    label: 'Deep Warm Complexion',
    tone: 'Deep',
    undertone: 'Warm',
    hex: '#7B4C33',
    url: 'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=500&auto=format&fit=crop&q=80',
    fallbackLocal: 'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=500&auto=format&fit=crop&q=80',
  },
  {
    id: 'sample_03',
    label: 'Fair Cool Complexion',
    tone: 'Fair',
    undertone: 'Cool',
    hex: '#F6E6DF',
    url: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=500&auto=format&fit=crop&q=80',
    fallbackLocal: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=500&auto=format&fit=crop&q=80',
  },
  {
    id: 'sample_04',
    label: 'Tan Olive Complexion',
    tone: 'Tan',
    undertone: 'Warm',
    hex: '#B88258',
    url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=500&auto=format&fit=crop&q=80',
    fallbackLocal: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=500&auto=format&fit=crop&q=80',
  },
];

export const mockProducts: Product[] = (productsJson as unknown as Product[]);

export const mockBrands: BrandItem[] = [
  { id: 'b_1', name: 'Maybelline New York', origin: 'United States', type: 'International', productCount: 6, status: 'Active' },
  { id: 'b_2', name: 'Fenty Beauty', origin: 'United States', type: 'International', productCount: 5, status: 'Active' },
  { id: 'b_3', name: 'NARS Cosmetics', origin: 'France', type: 'International', productCount: 5, status: 'Active' },
  { id: 'b_4', name: 'MAC Cosmetics', origin: 'Canada', type: 'International', productCount: 4, status: 'Active' },
  { id: 'b_5', name: 'Flormar', origin: 'Turkey', type: 'International', productCount: 3, status: 'Active' },
  { id: 'b_6', name: 'Lafz', origin: 'Bangladesh', type: 'Local', productCount: 4, status: 'Active' },
  { id: 'b_7', name: 'Rare Beauty', origin: 'United States', type: 'International', productCount: 3, status: 'Active' },
  { id: 'b_8', name: 'Wet n Wild', origin: 'United States', type: 'International', productCount: 3, status: 'Active' },
];

export const mockCategories: CategoryItem[] = [
  { id: 'c_1', name: 'Foundation', slug: 'foundation', description: 'Liquid, cream, and stick foundations', activeCount: 14 },
  { id: 'c_2', name: 'Concealer', slug: 'concealer', description: 'Brightening and blemish correcting formulas', activeCount: 6 },
  { id: 'c_3', name: 'Setting Powder', slug: 'setting-powder', description: 'Translucent and tinted setting powders', activeCount: 2 },
  { id: 'c_4', name: 'Compact Powder', slug: 'compact-powder', description: 'Velvety matte powder foundations', activeCount: 4 },
  { id: 'c_5', name: 'BB Cream', slug: 'bb-cream', description: 'Lightweight tinted skincare hybrids', activeCount: 2 },
  { id: 'c_6', name: 'CC Cream', slug: 'cc-cream', description: 'Color-correcting complexion hydrators', activeCount: 1 },
  { id: 'c_7', name: 'Primer', slug: 'primer', description: 'Smoothing base formulas', activeCount: 2 },
  { id: 'c_8', name: 'Tinted Moisturizer', slug: 'tinted-moisturizer', description: 'Ultra-sheer dewy skin tints', activeCount: 1 },
  { id: 'c_9', name: 'Bronzer', slug: 'bronzer', description: 'Sun-kissed warmth powders', activeCount: 1 },
  { id: 'c_10', name: 'Highlighter', slug: 'highlighter', description: 'Luminous light-reflecting pigments', activeCount: 1 },
];
