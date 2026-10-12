import React, { useState, useEffect, useCallback } from 'react';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
import { CompareTray } from './components/CompareTray';
import { HomePage } from './pages/HomePage';
import { ProductsPage } from './pages/ProductsPage';
import { ProductDetailsPage } from './pages/ProductDetailsPage';
import { RecommendationsPage } from './pages/RecommendationsPage';
import { AnalyzeSelfiePage } from './pages/AnalyzeSelfiePage';
import { AnalysisResultPage } from './pages/AnalysisResultPage';
import { FavoritesPage } from './pages/FavoritesPage';
import { ComparePage } from './pages/ComparePage';
import { DashboardPage } from './pages/DashboardPage';
import { LoginPage } from './pages/LoginPage';
import { SignUpPage } from './pages/SignUpPage';
import { AdminDashboardPage } from './pages/AdminDashboardPage';
import {
  initialUserProfile,
  mockProducts,
  defaultAnalysisResult,
  heroImg,
} from './data/mockData';
import { deduplicateAndGroupProducts } from './utils/productUtils';
import {
  Product,
  ProductCategory,
  SkinAnalysisResult,
  SkinTone,
  Undertone,
  UserProfile,
} from './types';
import {
  checkBackendHealth,
  fetchProducts,
  fetchUserProfile,
  fetchFavorites,
  addFavorite as apiAddFavorite,
  removeFavorite as apiRemoveFavorite,
  login as apiLogin,
  register as apiRegister,
  GeminiSkinResponse,
} from './services/api';
import { AlertCircle, RefreshCw } from 'lucide-react';

export const App: React.FC = () => {
  // Authentication Barrier: User must log in or sign up before viewing app
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login');

  const [currentPage, setCurrentPage] = useState<string>('home');
  const [user, setUser] = useState<UserProfile>(initialUserProfile);
  const [products, setProducts] = useState<Product[]>(mockProducts);
  const [recentAnalysis, setRecentAnalysis] = useState<SkinAnalysisResult>(defaultAnalysisResult);
  const [analyzedImageSrc, setAnalyzedImageSrc] = useState<string | undefined>(undefined);
  const [favoriteIds, setFavoriteIds] = useState<string[]>(initialUserProfile.savedFavoriteIds);
  const [compareIds, setCompareIds] = useState<string[]>(initialUserProfile.compareListIds);
  const [selectedProductId, setSelectedProductId] = useState<string>('prod_1');
  const [productFilterParams, setProductFilterParams] = useState<{ category?: ProductCategory; brand?: string }>({});

  // Database status
  const [dbStatus, setDbStatus] = useState<{ connected: boolean; message: string; version?: string } | null>(null);
  const [dbError, setDbError] = useState<string | null>(null);
  const [isInitializing, setIsInitializing] = useState<boolean>(true);

  // Load initial backend data
  const loadInitialBackendData = useCallback(async () => {
    setIsInitializing(true);
    setDbError(null);
    try {
      // 1. Health check
      const health = await checkBackendHealth();
      const isConnected = health?.database === 'connected';
      setDbStatus({
        connected: isConnected,
        message: health?.message || 'Database status unknown',
        version: health?.version,
      });

      // 2. Fetch Catalog Products
      const dbProducts = await fetchProducts();
      if (dbProducts && dbProducts.length > 0) {
        setProducts(deduplicateAndGroupProducts(dbProducts));
      }

      // 3. Fetch User Profile
      try {
        const userProf = await fetchUserProfile();
        if (userProf) {
          setUser((prev) => ({
            ...prev,
            id: userProf.id,
            name: userProf.name,
            email: userProf.email,
            country: userProf.country,
            budget: userProf.budget,
            skinTone: userProf.skinTone,
            undertone: userProf.undertone,
            lastAnalysisDate: userProf.lastAnalysisDate,
          }));
        }
      } catch (userErr) {
        console.warn('Could not load user profile from MySQL, using baseline user:', userErr);
      }

      // 4. Fetch Favorites
      try {
        const apiFavorites = await fetchFavorites();
        if (apiFavorites && apiFavorites.length > 0) {
          const ids = apiFavorites.map((f: any) => f.id || `prod_${f.productId}`);
          setFavoriteIds(ids);
        }
      } catch (favErr) {
        console.warn('Could not load favorites from MySQL:', favErr);
      }

    } catch (err: any) {
      console.error('Failed to connect to backend database:', err);
    } finally {
      setIsInitializing(false);
    }
  }, []);

  // Quick refresh without full-page reinitialization
  const refreshCatalogProducts = useCallback(async () => {
    try {
      const dbProducts = await fetchProducts();
      if (Array.isArray(dbProducts)) {
        setProducts(deduplicateAndGroupProducts(dbProducts));
      }
    } catch (err) {
      console.error('Failed to refresh catalog products:', err);
    }
  }, []);

  useEffect(() => {
    loadInitialBackendData();
  }, [loadInitialBackendData]);

  // Scroll to top on page navigation
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [currentPage, selectedProductId, isAuthenticated]);

  const handleNavigate = (page: string, params?: Record<string, string>) => {
    if (page === 'products' && params) {
      setProductFilterParams({
        category: (params.category as ProductCategory) || 'All',
        brand: params.brand || 'All',
      });
    }
    setCurrentPage(page);
  };

  const handleSelectProduct = (productId: string) => {
    setSelectedProductId(productId);
    setCurrentPage('product-details');
  };

  const handleToggleFavorite = async (productId: string) => {
    const isCurrentlyFav = favoriteIds.includes(productId);
    setFavoriteIds((prev) =>
      isCurrentlyFav ? prev.filter((id) => id !== productId) : [...prev, productId]
    );

    try {
      if (isCurrentlyFav) {
        await apiRemoveFavorite(productId);
      } else {
        await apiAddFavorite(productId);
      }
    } catch (err: any) {
      console.error('Error synchronizing favorite with database:', err);
    }
  };

  const handleToggleCompare = (productId: string) => {
    setCompareIds((prev) => {
      if (prev.includes(productId)) {
        return prev.filter((id) => id !== productId);
      }
      if (prev.length >= 3) {
        return [...prev.slice(1), productId];
      }
      return [...prev, productId];
    });
  };

  const handleRemoveFromCompare = (productId: string) => {
    setCompareIds((prev) => prev.filter((id) => id !== productId));
  };

  const handleAddCompareId = (productId: string) => {
    if (!compareIds.includes(productId) && compareIds.length < 3) {
      setCompareIds((prev) => [...prev, productId]);
    }
  };

  const handleClearCompare = () => {
    setCompareIds([]);
  };

  // Analyze Selfie Flow with Gemini Output
  const handleAnalyzeComplete = (imageSrc: string, geminiResult: GeminiSkinResponse) => {
    setAnalyzedImageSrc(imageSrc);
    const confidencePct = geminiResult.confidence <= 1
      ? Math.round(geminiResult.confidence * 100)
      : Math.round(geminiResult.confidence);

    setRecentAnalysis({
      skinTone: geminiResult.skinTone as SkinTone,
      undertone: geminiResult.undertone as Undertone,
      confidence: confidencePct,
      hexColor: geminiResult.hexColor || '#CD9B74',
      shadeFamily: geminiResult.skinTone === 'Unknown'
        ? 'Inconclusive Complexion'
        : `${geminiResult.skinTone} ${geminiResult.undertone} Shade Spectrum`,
      lightingQuality: geminiResult.skinTone === 'Unknown' ? 'Sub-optimal' : 'Optimal',
      notes: geminiResult.explanation || '',
      analyzedAt: new Date().toISOString(),
      imagePreviewUrl: imageSrc,
    });
    setCurrentPage('analysis-result');
  };

  const handleUseAnalysisResult = (tone: SkinTone, undertone: Undertone) => {
    setUser((prev) => ({
      ...prev,
      skinTone: tone,
      undertone,
      lastAnalysisDate: 'Just now',
    }));
    setCurrentPage('recommendations');
  };

  const handleLoginSuccess = async (email: string, password?: string) => {
    try {
      const loginPass = password || '';
      const loginData = await apiLogin(email, loginPass);
      if (loginData?.user) {
        setUser((prev) => ({
          ...prev,
          id: String(loginData.user.userId || 'usr_001'),
          name: loginData.user.name,
          email: loginData.user.email,
          role: loginData.user.role || (email === 'admin@gmail.com' ? 'admin' : 'user'),
          country: loginData.user.country,
          budget: loginData.user.budget,
          skinTone: loginData.user.skinTone || prev.skinTone || 'Medium',
          undertone: loginData.user.undertone || prev.undertone || 'Warm',
        }));

        // Load this user's persistent favorites from the shared database
        try {
          const userFavs = await fetchFavorites();
          if (userFavs) {
            setFavoriteIds(userFavs.map((f: any) => f.id || `prod_${f.productId}`));
          }
        } catch {}

        // Load profile and calibrated skin tone
        try {
          const profile = await fetchUserProfile();
          if (profile) {
            setUser((prev) => ({
              ...prev,
              skinTone: profile.skinTone || prev.skinTone,
              undertone: profile.undertone || prev.undertone,
              lastAnalysisDate: profile.lastAnalysisDate || prev.lastAnalysisDate,
            }));
          }
        } catch {}
      }
    } catch (err) {
      console.warn('Backend login fallback:', err);
      setUser((prev) => ({
        ...prev,
        email,
        role: email === 'admin@gmail.com' ? 'admin' : 'user',
      }));
    }

    localStorage.setItem('makeupmatch_is_logged_in', 'true');
    setIsAuthenticated(true);
    setCurrentPage(email === 'admin@gmail.com' ? 'admin' : 'home');
  };

  const handleSignUpSuccess = async (newProfile: Partial<UserProfile>) => {
    try {
      const regData = await apiRegister({
        name: newProfile.name || 'Member',
        email: newProfile.email || 'user@example.com',
        password: newProfile.password || '12345678',
        country: newProfile.country || 'Bangladesh',
        budget: newProfile.budget || 3000,
        skinTone: newProfile.skinTone || 'Medium',
        undertone: newProfile.undertone || 'Warm',
      });

      if (regData?.user) {
        setUser((prev) => ({
          ...prev,
          ...newProfile,
          id: `usr_${regData.user.userId}`,
          skinTone: (regData.user.skinTone || newProfile.skinTone || 'Medium') as SkinTone,
          undertone: (regData.user.undertone || newProfile.undertone || 'Warm') as Undertone,
        }));
        setFavoriteIds([]);
      }
    } catch (err) {
      console.warn('Backend registration fallback:', err);
      setUser((prev) => ({ ...prev, ...newProfile }));
    }

    localStorage.setItem('makeupmatch_is_logged_in', 'true');
    setIsAuthenticated(true);
    setCurrentPage('home');
  };

  const handleLogout = () => {
    localStorage.removeItem('makeupmatch_is_logged_in');
    localStorage.removeItem('makeupmatch_auth_token');
    setIsAuthenticated(false);
    setAuthMode('login');
  };

  const currentSelectedProduct =
    products.find((p) => p.id === selectedProductId || `prod_${p.productId}` === selectedProductId) || products[0];

  // GATE: If user is not logged in, enforce login or sign up screen first
  if (!isAuthenticated) {
    if (authMode === 'signup') {
      return (
        <SignUpPage
          onSignUpSuccess={handleSignUpSuccess}
          onNavigateToLogin={() => setAuthMode('login')}
        />
      );
    }

    return (
      <LoginPage
        onLoginSuccess={handleLoginSuccess}
        onNavigateToSignUp={() => setAuthMode('signup')}
        onNavigateHome={() => setAuthMode('login')}
      />
    );
  }

  // Once authenticated, render full application
  return (
    <div className="min-h-screen flex flex-col bg-[#FAF8F5] text-stone-900 selection:bg-stone-200">
      
      {/* Primary Clean Navigation */}
      <Navbar
        currentPage={currentPage}
        onNavigate={handleNavigate}
        user={user}
        favoritesCount={favoriteIds.length}
        compareCount={compareIds.length}
        onLogout={handleLogout}
      />

      {/* Main View Area */}
      <main className="flex-1">
        {currentPage === 'home' && (
          <HomePage
            onNavigate={handleNavigate}
            featuredProducts={products}
            favoriteIds={favoriteIds}
            compareIds={compareIds}
            onToggleFavorite={handleToggleFavorite}
            onToggleCompare={handleToggleCompare}
            onSelectProduct={handleSelectProduct}
          />
        )}

        {currentPage === 'dashboard' && (
          <DashboardPage
            user={user}
            recentAnalysis={recentAnalysis}
            recommendedProducts={products.filter((p) => p.skinTone === user.skinTone && p.undertone === user.undertone)}
            favoriteIds={favoriteIds}
            compareIds={compareIds}
            onToggleFavorite={handleToggleFavorite}
            onToggleCompare={handleToggleCompare}
            onSelectProduct={handleSelectProduct}
            onNavigate={handleNavigate}
          />
        )}

        {currentPage === 'analyze-selfie' && (
          <AnalyzeSelfiePage
            onAnalyzeComplete={handleAnalyzeComplete}
            onNavigate={handleNavigate}
          />
        )}

        {currentPage === 'analysis-result' && (
          <AnalysisResultPage
            result={recentAnalysis}
            analyzedImage={analyzedImageSrc}
            onUseResult={handleUseAnalysisResult}
            onAnalyzeAgain={() => setCurrentPage('analyze-selfie')}
          />
        )}

        {currentPage === 'products' && (
          <ProductsPage
            products={products}
            favoriteIds={favoriteIds}
            compareIds={compareIds}
            onToggleFavorite={handleToggleFavorite}
            onToggleCompare={handleToggleCompare}
            onSelectProduct={handleSelectProduct}
            initialCategory={productFilterParams.category}
            initialBrand={productFilterParams.brand}
          />
        )}

        {currentPage === 'product-details' && (
          <ProductDetailsPage
            productId={selectedProductId}
            initialProduct={currentSelectedProduct}
            isFavorite={favoriteIds.includes(currentSelectedProduct.id)}
            isInCompare={compareIds.includes(currentSelectedProduct.id)}
            onToggleFavorite={handleToggleFavorite}
            onToggleCompare={handleToggleCompare}
            onBack={() => setCurrentPage('products')}
            onNavigateToCompare={() => setCurrentPage('compare')}
          />
        )}

        {currentPage === 'recommendations' && (
          <RecommendationsPage
            user={user}
            products={products}
            favoriteIds={favoriteIds}
            compareIds={compareIds}
            onToggleFavorite={handleToggleFavorite}
            onToggleCompare={handleToggleCompare}
            onSelectProduct={handleSelectProduct}
            onNavigate={handleNavigate}
          />
        )}

        {currentPage === 'favorites' && (
          <FavoritesPage
            products={products}
            favoriteIds={favoriteIds}
            compareIds={compareIds}
            onToggleFavorite={handleToggleFavorite}
            onToggleCompare={handleToggleCompare}
            onSelectProduct={handleSelectProduct}
            onNavigate={handleNavigate}
          />
        )}

        {currentPage === 'compare' && (
          <ComparePage
            products={products}
            compareIds={compareIds}
            onRemoveFromCompare={handleRemoveFromCompare}
            onSelectProduct={handleSelectProduct}
            onNavigate={handleNavigate}
            onAddCompareId={handleAddCompareId}
          />
        )}

        {currentPage === 'admin' && (
          <AdminDashboardPage
            products={products}
            currentUser={user}
            onAdminAuthenticated={(adminProf) => {
              setUser(adminProf);
            }}
            onNavigateHome={() => setCurrentPage('home')}
            onRefreshProducts={refreshCatalogProducts}
          />
        )}
      </main>

      {/* Floating Compare Tray */}
      {currentPage !== 'compare' && (
        <CompareTray
          products={products}
          compareIds={compareIds}
          onRemoveFromCompare={handleRemoveFromCompare}
          onClearCompare={handleClearCompare}
          onOpenCompare={() => setCurrentPage('compare')}
        />
      )}

      {/* Production Footer */}
      <Footer onNavigate={handleNavigate} />

    </div>
  );
};

export default App;

