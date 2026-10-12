/**
 * Frontend API Service Layer for AI MakeupMatch
 * Connects React UI directly to Express.js REST API + MySQL database
 */

import { Product, ProductCategory, SkinAnalysisResult, SkinTone, Undertone, UserProfile } from '../types';

const API_BASE_URL = '/api';

// Storage key for optional auth token
const TOKEN_KEY = 'makeupmatch_auth_token';

export function getAuthToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function setAuthToken(token: string) {
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearAuthToken() {
  localStorage.removeItem(TOKEN_KEY);
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = getAuthToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  // Include admin role header for admin mutations
  const isMutation = options.method === 'POST' || options.method === 'PUT' || options.method === 'DELETE';
  const isAdminTarget = endpoint.startsWith('/admin') || endpoint.startsWith('/products') || endpoint.startsWith('/brands') || endpoint.startsWith('/categories');
  const userRole = localStorage.getItem('makeupmatch_user_role');
  if ((isAdminTarget && isMutation) || userRole === 'admin') {
    headers['X-Admin-Role'] = 'admin';
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    const errorMsg = data?.error || `Request failed with status ${response.status}`;
    throw new Error(errorMsg);
  }

  return data;
}

// 1. Health & Database Status
export async function checkBackendHealth(): Promise<{ status: string; database: string; message: string; version?: string }> {
  try {
    const res = await request<{ status: string; database: string; message: string; version?: string }>('/health');
    return res || {
      status: 'unhealthy',
      database: 'disconnected',
      message: 'Empty response received from backend',
    };
  } catch (err: any) {
    return {
      status: 'unhealthy',
      database: 'disconnected',
      message: err.message || 'Unable to reach backend Express API',
    };
  }
}

// 2. Authentication
export async function login(email: string, password: string) {
  const result: any = await request('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
  if (result.data?.token) {
    setAuthToken(result.data.token);
  }
  return result.data;
}

export async function register(userData: {
  name: string;
  email: string;
  password: string;
  country?: string;
  budget?: number;
  skinTone?: string;
  undertone?: string;
}) {
  const result: any = await request('/auth/register', {
    method: 'POST',
    body: JSON.stringify(userData),
  });
  if (result.data?.token) {
    setAuthToken(result.data.token);
  }
  return result.data;
}

// 3. Products
export async function fetchProducts(filters: {
  category?: string;
  brand?: string;
  country?: string;
  maxPrice?: number;
  minPrice?: number;
  skinTone?: string;
  undertone?: string;
  availability?: string | boolean;
  search?: string;
  sort?: string;
} = {}): Promise<Product[]> {
  const queryParams = new URLSearchParams();
  Object.entries(filters).forEach(([key, val]) => {
    if (val !== undefined && val !== null && val !== 'All' && val !== '') {
      queryParams.append(key, String(val));
    }
  });

  const endpoint = `/products${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
  const response: any = await request(endpoint);
  return response.data || [];
}

export async function fetchProductById(productId: string | number, country: string = 'Bangladesh'): Promise<any> {
  const numericId = typeof productId === 'string' ? productId.replace('prod_', '') : productId;
  const response: any = await request(`/products/${numericId}?country=${encodeURIComponent(country)}`);
  return response.data;
}

export async function searchProducts(searchTerm: string): Promise<Product[]> {
  const response: any = await request(`/products/search?q=${encodeURIComponent(searchTerm)}`);
  return response.data || [];
}

export async function fetchProductVariants(productId: string | number): Promise<any[]> {
  const numericId = typeof productId === 'string' ? productId.replace('prod_', '') : productId;
  const response: any = await request(`/products/${numericId}/variants`);
  return response.data || [];
}

// Admin Product CRUD
export async function createProduct(productData: any): Promise<any> {
  const response: any = await request('/products', {
    method: 'POST',
    body: JSON.stringify(productData),
  });
  return response.data;
}

export async function updateProduct(productId: string | number, productData: any): Promise<any> {
  const numericId = typeof productId === 'string' ? productId.replace('prod_', '') : productId;
  const response: any = await request(`/products/${numericId}`, {
    method: 'PUT',
    body: JSON.stringify(productData),
  });
  return response.data;
}

export async function addVariantToProduct(productId: string | number, variantData: any): Promise<any> {
  const numericId = typeof productId === 'string' ? productId.replace('prod_', '') : productId;
  const response: any = await request(`/products/${numericId}/variants`, {
    method: 'POST',
    body: JSON.stringify(variantData),
  });
  return response.data;
}

export async function updateVariantOfProduct(productId: string | number, variantId: string | number, variantData: any): Promise<any> {
  const numericId = typeof productId === 'string' ? productId.replace('prod_', '') : productId;
  const response: any = await request(`/products/${numericId}/variants/${variantId}`, {
    method: 'PUT',
    body: JSON.stringify(variantData),
  });
  return response.data;
}

export async function deleteVariantOfProduct(productId: string | number, variantId: string | number): Promise<any> {
  const numericId = typeof productId === 'string' ? productId.replace('prod_', '') : productId;
  const response: any = await request(`/products/${numericId}/variants/${variantId}`, {
    method: 'DELETE',
  });
  return response;
}

export async function saveImportedProduct(product: any): Promise<any> {
  const response: any = await request('/admin/save-imported-product', {
    method: 'POST',
    body: JSON.stringify({ product }),
  });
  return response;
}

export async function deleteProduct(productId: string | number): Promise<any> {
  const numericId = typeof productId === 'string' ? productId.replace('prod_', '') : productId;
  const response: any = await request(`/products/${numericId}`, {
    method: 'DELETE',
  });
  return response.data || response;
}

export async function deactivateProduct(productId: string | number): Promise<any> {
  const numericId = typeof productId === 'string' ? productId.replace('prod_', '') : productId;
  const response: any = await request(`/products/${numericId}/deactivate`, {
    method: 'POST',
  });
  return response.data || response;
}

export async function updateProductAvailability(productId: string | number, availabilityData: any): Promise<any> {
  const numericId = typeof productId === 'string' ? productId.replace('prod_', '') : productId;
  const response: any = await request(`/products/${numericId}/availability`, {
    method: 'PUT',
    body: JSON.stringify(availabilityData),
  });
  return response.data;
}

// 4. Categories & Brands
export async function fetchCategories(): Promise<any[]> {
  const response: any = await request('/categories');
  return response.data || [];
}

export async function createCategory(data: { categoryName: string; description?: string }): Promise<any> {
  const response: any = await request('/categories', {
    method: 'POST',
    body: JSON.stringify(data),
  });
  return response.data;
}

export async function fetchBrands(): Promise<any[]> {
  const response: any = await request('/brands');
  return response.data || [];
}

export async function createBrand(data: { brandName: string; countryOrigin?: string; website?: string }): Promise<any> {
  const response: any = await request('/brands', {
    method: 'POST',
    body: JSON.stringify(data),
  });
  return response.data;
}

// 5. Product Availability
export async function fetchAvailability(params: { productId?: number; country?: string } = {}): Promise<any[]> {
  const queryParams = new URLSearchParams();
  if (params.productId) queryParams.append('productId', String(params.productId));
  if (params.country && params.country !== 'All') queryParams.append('country', params.country);

  const endpoint = `/availability${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
  const response: any = await request(endpoint);
  return response.data || [];
}

// 6. User Profile
export async function fetchUserProfile(): Promise<UserProfile> {
  const response: any = await request('/user/profile');
  const d = response.data;
  return {
    id: `usr_${d.user_id}`,
    name: d.name,
    email: d.email,
    country: d.country || 'Bangladesh',
    budget: Number(d.budget) || 3000,
    currency: d.country === 'United States' ? '$' : '৳',
    skinTone: ((d.skinTone || d.skin_tone || d.latestAnalysis?.skin_tone) as SkinTone) || 'Medium',
    undertone: ((d.undertone || d.undertone || d.latestAnalysis?.undertone) as Undertone) || 'Warm',
    savedFavoriteIds: [],
    compareListIds: ['prod_1', 'prod_2'],
    lastAnalysisDate: d.latestAnalysis?.analyzed_at
      ? new Date(d.latestAnalysis.analyzed_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
      : 'Oct 03, 2026',
  };
}

export async function updateUserProfile(data: { name?: string; country?: string; budget?: number }) {
  const response: any = await request('/user/profile', {
    method: 'PUT',
    body: JSON.stringify(data),
  });
  return response.data;
}

// 7. Favorites
export async function fetchFavorites(): Promise<Product[]> {
  const response: any = await request('/favorites');
  return response.data || [];
}

export async function addFavorite(productId: string | number) {
  const numericId = typeof productId === 'string' ? Number(productId.replace('prod_', '')) : productId;
  const response: any = await request('/favorites', {
    method: 'POST',
    body: JSON.stringify({ productId: numericId }),
  });
  return response.data;
}

export async function removeFavorite(productId: string | number) {
  const numericId = typeof productId === 'string' ? Number(productId.replace('prod_', '')) : productId;
  const response: any = await request(`/favorites/${numericId}`, {
    method: 'DELETE',
  });
  return response.data;
}

// 7b. Orders
export async function createOrder(data: {
  productId?: number | string;
  productName?: string;
  shadeName?: string;
  price?: number;
  currency?: string;
  quantity?: number;
  shippingAddress?: string;
  itemsSummary?: string;
}) {
  const response: any = await request('/orders', {
    method: 'POST',
    body: JSON.stringify(data),
  });
  return response;
}

export async function fetchUserOrders() {
  const response: any = await request('/orders');
  return response.data || [];
}

// 8. Recommendations Engine
export interface RecommendationResult {
  data: Product[];
  groups: {
    bestMatches: Product[];
    slightlyAbove: Product[];
    alternatives: Product[];
  };
}

export async function fetchRecommendations(filters: {
  skinTone?: string;
  undertone?: string;
  budget?: number;
  country?: string;
  category?: string;
} = {}): Promise<RecommendationResult> {
  const queryParams = new URLSearchParams();
  if (filters.skinTone && filters.skinTone !== 'All') queryParams.append('skinTone', filters.skinTone);
  if (filters.undertone && filters.undertone !== 'All') queryParams.append('undertone', filters.undertone);
  if (filters.budget !== undefined) queryParams.append('budget', String(filters.budget));
  if (filters.country && filters.country !== 'All') queryParams.append('country', filters.country);
  if (filters.category && filters.category !== 'All') queryParams.append('category', filters.category);

  const endpoint = `/recommendations${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
  const response: any = await request(endpoint);
  return {
    data: response.data || [],
    groups: response.groups || {
      bestMatches: [],
      slightlyAbove: [],
      alternatives: [],
    },
  };
}

// 9. Product Data Ingestion System
export async function fetchIngestionSources(): Promise<any[]> {
  const response: any = await request('/ingest/sources');
  return response.data || [];
}

export async function previewIngestionUrl(url: string): Promise<any> {
  const response: any = await request('/ingest/preview', {
    method: 'POST',
    body: JSON.stringify({ url }),
  });
  return response.data;
}

export async function runIngestionJob(params: {
  sourceId?: string;
  customUrl?: string;
  categoryTag?: string;
  pageSize?: number;
}): Promise<any> {
  const response: any = await request('/ingest/run', {
    method: 'POST',
    body: JSON.stringify(params),
  });
  return response;
}

export async function fetchIngestionJobs(): Promise<any[]> {
  const response: any = await request('/ingest/jobs');
  return response.data || [];
}

export async function syncAllHubs(hubs?: string[]): Promise<any> {
  const response: any = await request('/ingest/sync-all', {
    method: 'POST',
    body: JSON.stringify({ hubs }),
  });
  return response;
}

// 10. Gemini AI Skin Analysis
export interface GeminiSkinResponse {
  skinTone: 'Very Fair' | 'Fair' | 'Light' | 'Medium' | 'Tan' | 'Deep' | 'Unknown';
  undertone: 'Cool' | 'Warm' | 'Neutral' | 'Olive' | 'Unknown';
  confidence: number;
  explanation?: string;
  hexColor?: string;
  source?: string;
}

export async function analyzeSkinWithGemini(params: {
  imageBase64: string;
  mimeType?: string;
  clientColorimetry?: any;
}): Promise<GeminiSkinResponse> {
  const response: any = await request('/analysis/gemini-analyze', {
    method: 'POST',
    body: JSON.stringify(params),
  });
  return response.data;
}

export async function confirmSkinAnalysis(params: {
  skinTone: string;
  undertone: string;
  confidence?: number;
  explanation?: string;
  imagePath?: string;
}): Promise<any> {
  const response: any = await request('/analysis/confirm', {
    method: 'POST',
    body: JSON.stringify(params),
  });
  return response.data;
}

// 11. Admin Raw SQL Console & Live URL Product Importer
export async function executeAdminSql(query: string): Promise<{
  success: boolean;
  type: string;
  query: string;
  executionTimeMs: number;
  data?: any[];
  columns?: string[];
  rowCount?: number;
  affectedRows?: number;
  insertId?: number | null;
  message?: string;
}> {
  return await request('/admin/sql', {
    method: 'POST',
    body: JSON.stringify({ query }),
  });
}

export async function importProductFromUrl(params: {
  url: string;
  autoSave?: boolean;
  customData?: any;
}): Promise<{
  success: boolean;
  message: string;
  data: any;
  saved: boolean;
  productId?: number;
}> {
  return await request('/admin/import-url', {
    method: 'POST',
    body: JSON.stringify(params),
  });
}

export interface AdminStats {
  totalProducts: number;
  activeProducts: number;
  totalBrands: number;
  totalCategories: number;
  totalUsers: number;
}

export async function fetchAdminStats(): Promise<AdminStats> {
  const res: any = await request('/admin/stats');
  return res?.stats || {
    totalProducts: 0,
    activeProducts: 0,
    totalBrands: 0,
    totalCategories: 0,
    totalUsers: 0,
  };
}

export interface AdminUserOverviewItem {
  userId: number;
  name: string;
  email: string;
  role: string;
  country: string;
  budget?: number;
  skinTone?: string;
  undertone?: string;
  lastLoginAt: string;
  createdAt: string;
  status?: string;
  favorites?: any[];
  orders?: any[];
}

export async function fetchAdminUsersOverview(): Promise<AdminUserOverviewItem[]> {
  const res = await request<{ success: boolean; users: AdminUserOverviewItem[] }>('/admin/users-overview');
  return res?.users || [];
}
