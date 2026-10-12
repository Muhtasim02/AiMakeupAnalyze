export type SkinTone = 'Very Fair' | 'Fair' | 'Light' | 'Medium' | 'Tan' | 'Deep' | 'Unknown';
export type Undertone = 'Warm' | 'Cool' | 'Neutral' | 'Olive' | 'Unknown';
export type ProductCategory = string;
export type AvailabilityStatus = string;

export interface ScoreBreakdown {
  skinToneMatch: number;
  undertoneMatch: number;
  budgetMatch: number;
  countryAvailability: number;
  categoryPreference: number;
  total: number;
}

export interface ProductVariant {
  variantId: number;
  productId: number;
  shadeName: string;
  shadeNumber?: string;
  shadeColor?: string;
  colorFamily?: string;
  swatchHex?: string;
  swatchImageUrl?: string;
  skinTone?: SkinTone | string;
  undertone?: Undertone | string;
  imageUrl?: string;
  purchaseLink?: string;
  isVerified?: boolean;
  isActive?: boolean;
}

export interface Product {
  id: string;
  productId?: number;
  name: string;
  brand: string;
  brandId?: number;
  brandOrigin?: string;
  brandWebsite?: string;
  officialUrl?: string;
  category: ProductCategory;
  categoryId?: number;
  price: number;
  currency: string;
  skinTone?: SkinTone | string;
  undertone?: Undertone | string;
  shade?: string;
  shadeName?: string;
  shadeHex?: string;
  hasVariants?: boolean;
  variantCount?: number;
  variants?: ProductVariant[];
  matchPercentage: number;
  matchScore?: number;
  scoreBreakdown?: ScoreBreakdown;
  reason?: string;
  availability: AvailabilityStatus;
  isAvailableInCountry?: boolean;
  country: string;
  rating?: number;
  reviewsCount?: number;
  image?: string;
  imageUrl?: string;
  image_url?: string;
  isVerified?: boolean;
  image_verified?: boolean;
  verificationStatus?: 'VERIFIED' | 'UNVERIFIED' | 'INCOMPLETE';
  barcode?: string;
  sourceUrl?: string;
  source_url?: string;
  sourceName?: string;
  description: string;
  coverage?: string;
  finish?: string;
  featured?: boolean;
  purchaseLink?: string;
  budgetCategory?: 'best_match' | 'slightly_above' | 'alternative';
  localPrice?: number;
  localCurrency?: string;
  availabilityList?: Array<{
    availabilityId: number;
    country: string;
    isAvailable: boolean;
    purchaseLink: string;
    localPrice: number;
    currency: string;
  }>;
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  password?: string;
  role?: 'admin' | 'user';
  skinTone: SkinTone;
  undertone: Undertone;
  budget: number;
  currency: string;
  country: string;
  avatarUrl?: string;
  savedFavoriteIds: string[];
  compareListIds: string[];
  lastAnalysisDate?: string;
}

export interface SkinAnalysisResult {
  skinTone: SkinTone;
  undertone: Undertone;
  confidence: number;
  analyzedAt: string;
  imagePreviewUrl?: string;
  hexColor: string;
  shadeFamily: string;
  notes: string;
  lightingQuality: 'Optimal' | 'Acceptable' | 'Sub-optimal' | 'Inconclusive / Dark';
}

export interface BrandItem {
  id: string;
  name: string;
  origin: string;
  type?: 'Local' | 'International';
  productCount: number;
  status?: 'Active' | 'Inactive';
}

export interface CategoryItem {
  id: string;
  name: ProductCategory;
  slug?: string;
  description?: string;
  activeCount?: number;
}
