import React, { useState, useEffect } from 'react';
import {
  Shield,
  Plus,
  Edit2,
  Trash2,
  Search,
  AlertCircle,
  Package,
  Layers,
  CheckCircle2,
  Users,
  Globe,
  RefreshCw,
  ExternalLink,
  Check,
  X,
  Link as LinkIcon,
  DollarSign,
  Sparkles,
  Lock,
  ArrowRight,
  DownloadCloud,
  Upload,
  Camera,
  Palette,
  EyeOff,
} from 'lucide-react';
import { Product, UserProfile } from '../types';
import { ProductShadesManager } from '../components/ProductShadesManager';
import {
  importProductFromUrl,
  fetchAdminUsersOverview,
  AdminUserOverviewItem,
  fetchAdminStats,
  AdminStats,
  login as apiLogin,
  createProduct,
  updateProduct,
  deleteProduct,
  deactivateProduct,
  updateProductAvailability,
  createBrand,
  createCategory,
  fetchBrands,
  fetchCategories,
} from '../services/api';

interface AdminDashboardPageProps {
  products: Product[];
  currentUser?: UserProfile;
  onNavigateHome: () => void;
  onRefreshProducts?: () => void;
  onAdminAuthenticated?: (user: UserProfile) => void;
}

type AdminTab = 'products' | 'brands_categories' | 'import' | 'users';

export const AdminDashboardPage: React.FC<AdminDashboardPageProps> = ({
  products,
  currentUser,
  onNavigateHome,
  onRefreshProducts,
  onAdminAuthenticated,
}) => {
  // Server-Side Authorization Check: Role must be 'admin'
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState<boolean>(() => {
    return currentUser?.role === 'admin';
  });

  const [adminEmailInput, setAdminEmailInput] = useState<string>('');
  const [adminPasswordInput, setAdminPasswordInput] = useState<string>('');
  const [authError, setAuthError] = useState<string | null>(null);
  const [isAuthenticating, setIsAuthenticating] = useState<boolean>(false);

  // Active Tab
  const [activeTab, setActiveTab] = useState<AdminTab>('products');
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Live Statistics
  const [stats, setStats] = useState<AdminStats>({
    totalProducts: products.length,
    activeProducts: products.length,
    totalBrands: 0,
    totalCategories: 0,
    totalUsers: 0,
  });

  // User Accounts
  const [usersList, setUsersList] = useState<AdminUserOverviewItem[]>([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState<boolean>(false);

  // Live Brands & Categories
  const [brands, setBrands] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);

  // Local reactive copy of products for immediate feedback
  const [localProducts, setLocalProducts] = useState<Product[]>(products);

  useEffect(() => {
    setLocalProducts(products);
  }, [products]);

  // Modals & Action Dialogs
  const [isAddProductOpen, setIsAddProductOpen] = useState(false);
  const [isEditProductOpen, setIsEditProductOpen] = useState(false);
  const [isAvailabilityModalOpen, setIsAvailabilityModalOpen] = useState(false);
  const [isAddBrandOpen, setIsAddBrandOpen] = useState(false);
  const [isAddCategoryOpen, setIsAddCategoryOpen] = useState(false);

  // In-UI Confirmation Dialogs (no window.confirm, safe for iframes)
  const [deleteConfirmProduct, setDeleteConfirmProduct] = useState<Product | null>(null);
  const [deactivateConfirmProduct, setDeactivateConfirmProduct] = useState<Product | null>(null);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);
  const [isDeactivating, setIsDeactivating] = useState<boolean>(false);

  // Target product for edit or availability update
  const [selectedProduct, setSelectedProduct] = useState<any | null>(null);

  // Form States: New / Edit Product
  const [formName, setFormName] = useState('');
  const [formBrandId, setFormBrandId] = useState<number>(1);
  const [formCategoryId, setFormCategoryId] = useState<number>(1);
  const [formDescription, setFormDescription] = useState('');
  const [formPrice, setFormPrice] = useState<number>(1500);
  const [formCurrency, setFormCurrency] = useState('৳');
  const [formImageUrl, setFormImageUrl] = useState('/src/assets/images/product_foundation_bottle_1791104563365.jpg');
  const [formSkinTone, setFormSkinTone] = useState('Medium');
  const [formUndertone, setFormUndertone] = useState('Warm');
  const [formShadeName, setFormShadeName] = useState('Natural Beige');
  const [formCountry, setFormCountry] = useState('Bangladesh');
  const [formIsAvailable, setFormIsAvailable] = useState(true);
  const [formPurchaseLink, setFormPurchaseLink] = useState('https://shajgoj.com');

  // Multi-Shade Support in Product Creation and Editing
  interface AdminFormShade {
    variantId?: number;
    shadeName: string;
    shadeNumber?: string;
    swatchHex?: string;
    swatchImageUrl?: string;
    skinTone: string;
    undertone: string;
    imageUrl?: string;
    purchaseLink?: string;
    isVerified: boolean;
  }

  const [formShades, setFormShades] = useState<AdminFormShade[]>([
    {
      shadeName: 'Natural Beige',
      shadeNumber: '220',
      swatchHex: '#D4A373',
      swatchImageUrl: '',
      skinTone: 'Medium',
      undertone: 'Warm',
      imageUrl: '',
      purchaseLink: '',
      isVerified: true,
    },
  ]);

  // Form States: Availability & Price
  const [availCountry, setAvailCountry] = useState('Bangladesh');
  const [availIsAvailable, setAvailIsAvailable] = useState(true);
  const [availPrice, setAvailPrice] = useState<number>(1500);
  const [availPurchaseLink, setAvailPurchaseLink] = useState('https://shajgoj.com');

  // Form States: Brand
  const [newBrandName, setNewBrandName] = useState('');
  const [newBrandOrigin, setNewBrandOrigin] = useState('Bangladesh');
  const [newBrandWebsite, setNewBrandWebsite] = useState('https://');

  // Form States: Category
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newCategoryDescription, setNewCategoryDescription] = useState('');

  // Search Filter for Product list
  const [adminSearch, setAdminSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');

  // Unified Product Importer State
  const [importUrlInput, setImportUrlInput] = useState<string>('');
  const [isImportingUrl, setIsImportingUrl] = useState<boolean>(false);
  const [importPreview, setImportPreview] = useState<any | null>(null);
  const [importError, setImportError] = useState<string | null>(null);
  const [isSavingImport, setIsSavingImport] = useState<boolean>(false);

  // Update authentication status when currentUser changes
  useEffect(() => {
    if (currentUser?.role === 'admin') {
      setIsAdminAuthenticated(true);
    }
  }, [currentUser]);

  // Load Metadata when authenticated
  const loadMeta = async () => {
    if (!isAdminAuthenticated) return;
    setIsLoadingUsers(true);
    try {
      const [brs, cats, statData, userAccounts] = await Promise.all([
        fetchBrands().catch(() => []),
        fetchCategories().catch(() => []),
        fetchAdminStats().catch(() => null),
        fetchAdminUsersOverview().catch(() => []),
      ]);
      if (brs && brs.length > 0) setBrands(brs);
      if (cats && cats.length > 0) setCategories(cats);
      if (statData) setStats(statData);
      if (userAccounts && userAccounts.length > 0) setUsersList(userAccounts);
    } catch (err: any) {
      console.warn('Metadata load notice:', err.message);
    } finally {
      setIsLoadingUsers(false);
    }
  };

  useEffect(() => {
    if (isAdminAuthenticated) {
      loadMeta();
    }
  }, [isAdminAuthenticated]);

  // Handle Admin Login submission
  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adminEmailInput.trim() || !adminPasswordInput.trim()) {
      setAuthError('Please enter both email and password.');
      return;
    }

    setIsAuthenticating(true);
    setAuthError(null);

    try {
      const result = await apiLogin(adminEmailInput.trim(), adminPasswordInput.trim());
      if (result?.user?.role === 'admin') {
        setIsAdminAuthenticated(true);
        if (onAdminAuthenticated) {
          onAdminAuthenticated({
            id: String(result.user.userId),
            name: result.user.name,
            email: result.user.email,
            role: 'admin',
            country: result.user.country || 'Bangladesh',
            budget: result.user.budget || 3000,
            currency: '৳',
            skinTone: result.user.skinTone || 'Medium',
            undertone: result.user.undertone || 'Warm',
            savedFavoriteIds: [],
            compareListIds: [],
          });
        }
        setNotification({ type: 'success', message: 'Administrator authorized successfully.' });
      } else {
        setAuthError('Access denied: Your account does not have administrative privileges.');
      }
    } catch (err: any) {
      setAuthError(err.message || 'Authentication failed. Please verify credentials.');
    } finally {
      setIsAuthenticating(false);
    }
  };

  // Device Photo Upload Handler
  const handleDevicePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setNotification({ type: 'error', message: 'Please select an image file (JPG, PNG, WebP).' });
      return;
    }

    if (file.size > 15 * 1024 * 1024) {
      setNotification({ type: 'error', message: 'Image size should be under 15MB.' });
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const base64 = reader.result as string;
      setFormImageUrl(base64);
      setNotification({ type: 'success', message: 'Photo loaded from device ready for catalog.' });
    };
    reader.readAsDataURL(file);
  };

  // Add Product Submit
  const handleCreateProductSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) {
      setNotification({ type: 'error', message: 'Product name is required.' });
      return;
    }

    try {
      await createProduct({
        name: formName.trim(),
        brandId: Number(formBrandId),
        categoryId: Number(formCategoryId),
        description: formDescription,
        price: Number(formPrice),
        currency: formCurrency,
        imageUrl: formImageUrl,
        skinTone: formShades[0]?.skinTone || formSkinTone,
        undertone: formShades[0]?.undertone || formUndertone,
        shadeName: formShades[0]?.shadeName || formShadeName,
        country: formCountry,
        isAvailable: formIsAvailable,
        purchaseLink: formPurchaseLink.trim() || undefined,
        sourceUrl: formPurchaseLink.trim() || undefined,
        variants: formShades,
      });

      setNotification({ type: 'success', message: `Product "${formName}" with ${formShades.length} shades created successfully.` });
      setIsAddProductOpen(false);
      resetProductForm();
      if (onRefreshProducts) onRefreshProducts();
      loadMeta();
    } catch (err: any) {
      setNotification({ type: 'error', message: `Failed to create product: ${err.message}` });
    }
  };

  // Edit Product Submit
  const handleUpdateProductSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProduct) return;

    try {
      const prodId = Number(selectedProduct.productId || String(selectedProduct.id || '').replace('prod_', ''));
      if (!prodId || isNaN(prodId)) {
        throw new Error('Invalid product identification number.');
      }

      const updatedProductResult = await updateProduct(prodId, {
        name: formName.trim(),
        brandId: Number(formBrandId),
        categoryId: Number(formCategoryId),
        description: formDescription,
        price: Number(formPrice),
        currency: formCurrency,
        imageUrl: formImageUrl,
        skinTone: formShades[0]?.skinTone || formSkinTone,
        undertone: formShades[0]?.undertone || formUndertone,
        shadeName: formShades[0]?.shadeName || formShadeName,
        purchaseLink: formPurchaseLink.trim() || undefined,
        sourceUrl: formPurchaseLink.trim() || undefined,
        officialUrl: formPurchaseLink.trim() || undefined,
        variants: formShades,
      });

      // Optimistically update localProducts
      setLocalProducts((prev) =>
        prev.map((p) => {
          const currentId = Number(p.productId || String(p.id || '').replace('prod_', ''));
          if (currentId === prodId) {
            return {
              ...p,
              name: formName.trim(),
              description: formDescription,
              price: Number(formPrice),
              currency: formCurrency,
              imageUrl: formImageUrl,
              image: formImageUrl,
              shade: formShades[0]?.shadeName || formShadeName,
              shadeName: formShades[0]?.shadeName || formShadeName,
              skinTone: formShades[0]?.skinTone || formSkinTone,
              undertone: formShades[0]?.undertone || formUndertone,
              purchaseLink: formPurchaseLink.trim() || p.purchaseLink,
              sourceUrl: formPurchaseLink.trim() || p.sourceUrl,
              variants: formShades.map((v, i) => ({
                variantId: v.variantId || prodId + i,
                productId: prodId,
                shadeName: v.shadeName,
                shadeNumber: v.shadeNumber,
                swatchHex: v.swatchHex,
                swatchImageUrl: v.swatchImageUrl,
                skinTone: v.skinTone,
                undertone: v.undertone,
                imageUrl: v.imageUrl || formImageUrl,
                purchaseLink: v.purchaseLink || formPurchaseLink,
                isVerified: v.isVerified,
                isActive: true,
              })),
              variantCount: formShades.length,
              hasVariants: formShades.length > 1,
            };
          }
          return p;
        })
      );

      setNotification({
        type: 'success',
        message: `Product "${formName}" and ${formShades.length} shade(s) updated successfully in the database and website.`,
      });
      setIsEditProductOpen(false);
      setSelectedProduct(null);
      if (onRefreshProducts) await onRefreshProducts();
      loadMeta();
    } catch (err: any) {
      setNotification({ type: 'error', message: `Failed to update product: ${err.message}` });
    }
  };

  // Open In-UI Permanent Delete Dialog
  const handleDeleteProduct = (product: Product) => {
    setDeleteConfirmProduct(product);
  };

  // Confirm Permanent Delete Action
  const handleConfirmDeleteProduct = async () => {
    if (!deleteConfirmProduct) return;
    const product = deleteConfirmProduct;
    const prodId = Number(product.productId || String(product.id || '').replace('prod_', ''));
    if (!prodId || isNaN(prodId)) {
      setNotification({ type: 'error', message: 'Invalid product identification number.' });
      setDeleteConfirmProduct(null);
      return;
    }

    setIsDeleting(true);
    try {
      await deleteProduct(prodId);
      // Immediately remove from local state
      setLocalProducts((prev) =>
        prev.filter((p) => {
          const currentId = Number(p.productId || String(p.id || '').replace('prod_', ''));
          return currentId !== prodId && p.id !== product.id && p.id !== `prod_${prodId}`;
        })
      );
      setNotification({
        type: 'success',
        message: `Product "${product.name}" was permanently removed from database, admin console, and storefront catalog.`,
      });
      setDeleteConfirmProduct(null);
      if (onRefreshProducts) await onRefreshProducts();
      loadMeta();
    } catch (err: any) {
      setNotification({ type: 'error', message: `Failed to delete product: ${err.message}` });
    } finally {
      setIsDeleting(false);
    }
  };

  // Open In-UI Deactivate Dialog
  const handleDeactivate = (product: Product) => {
    setDeactivateConfirmProduct(product);
  };

  // Confirm Deactivate Action
  const handleConfirmDeactivateProduct = async () => {
    if (!deactivateConfirmProduct) return;
    const product = deactivateConfirmProduct;
    const prodId = Number(product.productId || String(product.id || '').replace('prod_', ''));
    if (!prodId || isNaN(prodId)) {
      setNotification({ type: 'error', message: 'Invalid product identification number.' });
      setDeactivateConfirmProduct(null);
      return;
    }

    setIsDeactivating(true);
    try {
      await deactivateProduct(prodId);
      setLocalProducts((prev) =>
        prev.filter((p) => {
          const currentId = Number(p.productId || String(p.id || '').replace('prod_', ''));
          return currentId !== prodId && p.id !== product.id;
        })
      );
      setNotification({
        type: 'success',
        message: `Product "${product.name}" deactivated and safely hidden from storefront catalog.`,
      });
      setDeactivateConfirmProduct(null);
      if (onRefreshProducts) await onRefreshProducts();
      loadMeta();
    } catch (err: any) {
      setNotification({ type: 'error', message: `Failed to deactivate: ${err.message}` });
    } finally {
      setIsDeactivating(false);
    }
  };

  // Update Availability Submit
  const handleUpdateAvailabilitySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProduct) return;

    try {
      const prodId = selectedProduct.productId || Number(selectedProduct.id?.replace('prod_', ''));
      await updateProductAvailability(prodId, {
        country: availCountry,
        isAvailable: availIsAvailable,
        localPrice: Number(availPrice),
        currency: formCurrency,
        purchaseLink: availPurchaseLink,
      });

      setNotification({ type: 'success', message: `Availability updated for ${availCountry}.` });
      setIsAvailabilityModalOpen(false);
      setSelectedProduct(null);
      if (onRefreshProducts) onRefreshProducts();
    } catch (err: any) {
      setNotification({ type: 'error', message: `Failed to update availability: ${err.message}` });
    }
  };

  // Create Brand Submit
  const handleCreateBrandSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBrandName.trim()) return;

    try {
      await createBrand({
        brandName: newBrandName.trim(),
        countryOrigin: newBrandOrigin.trim(),
        website: newBrandWebsite.trim(),
      });
      setNotification({ type: 'success', message: `Brand "${newBrandName}" added.` });
      setIsAddBrandOpen(false);
      setNewBrandName('');
      loadMeta();
    } catch (err: any) {
      setNotification({ type: 'error', message: `Failed to add brand: ${err.message}` });
    }
  };

  // Create Category Submit
  const handleCreateCategorySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCategoryName.trim()) return;

    try {
      await createCategory({
        categoryName: newCategoryName.trim(),
        description: newCategoryDescription.trim(),
      });
      setNotification({ type: 'success', message: `Category "${newCategoryName}" added.` });
      setIsAddCategoryOpen(false);
      setNewCategoryName('');
      setNewCategoryDescription('');
      loadMeta();
    } catch (err: any) {
      setNotification({ type: 'error', message: `Failed to add category: ${err.message}` });
    }
  };

  // Unified Product Importer: Step 1 - Fetch Preview
  const handleFetchPreview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!importUrlInput.trim() || !importUrlInput.startsWith('http')) {
      setImportError('Please provide a valid HTTP/HTTPS product URL.');
      return;
    }

    setIsImportingUrl(true);
    setImportError(null);
    setImportPreview(null);

    try {
      const res = await importProductFromUrl({
        url: importUrlInput.trim(),
        autoSave: false,
      });

      if (res?.data) {
        setImportPreview(res.data);
      } else {
        setImportError('No structured product information could be extracted from this URL.');
      }
    } catch (err: any) {
      setImportError(err.message || 'Failed to extract product preview.');
    } finally {
      setIsImportingUrl(false);
    }
  };

  // Unified Product Importer: Step 2 - Confirm & Save
  const handleConfirmSaveImport = async () => {
    if (!importPreview) return;

    setIsSavingImport(true);
    try {
      const res = await importProductFromUrl({
        url: importPreview.sourceUrl || importUrlInput,
        autoSave: true,
        customData: importPreview,
      });

      setNotification({
        type: 'success',
        message: `Successfully imported "${importPreview.productName}" into product catalog (ID #${res?.productId}).`,
      });
      setImportPreview(null);
      setImportUrlInput('');
      if (onRefreshProducts) onRefreshProducts();
      loadMeta();
    } catch (err: any) {
      setNotification({ type: 'error', message: `Failed to save product: ${err.message}` });
    } finally {
      setIsSavingImport(false);
    }
  };

  const resetProductForm = () => {
    setFormName('');
    setFormDescription('');
    setFormPrice(1500);
    setFormShadeName('Natural Beige');
    setFormSkinTone('Medium');
    setFormUndertone('Warm');
    setFormImageUrl('/src/assets/images/product_foundation_bottle_1791104563365.jpg');
    setFormPurchaseLink('https://shajgoj.com');
    setFormShades([
      {
        shadeName: 'Natural Beige',
        shadeNumber: '220',
        swatchHex: '#D4A373',
        swatchImageUrl: '',
        skinTone: 'Medium',
        undertone: 'Warm',
        imageUrl: '',
        purchaseLink: '',
        isVerified: true,
      },
    ]);
  };

  const openEditModal = (p: Product) => {
    setSelectedProduct(p);
    setFormName(p.name);
    setFormDescription(p.description || '');
    setFormPrice(p.price || 1500);
    setFormCurrency(p.currency || '৳');
    setFormImageUrl(p.imageUrl || p.image || '');
    setFormSkinTone(p.skinTone || 'Medium');
    setFormUndertone(p.undertone || 'Warm');
    setFormShadeName(p.shade || p.shadeName || '');
    setFormBrandId(p.brandId || 1);
    setFormCategoryId(p.categoryId || 1);
    setFormPurchaseLink(p.purchaseLink || p.sourceUrl || p.officialUrl || '');

    // Map existing variants if present, otherwise populate from parent product
    if (p.variants && p.variants.length > 0) {
      setFormShades(
        p.variants.map((v) => ({
          variantId: v.variantId,
          shadeName: v.shadeName,
          shadeNumber: v.shadeNumber || '',
          swatchHex: v.swatchHex || '',
          swatchImageUrl: v.swatchImageUrl || '',
          skinTone: (v.skinTone as string) || p.skinTone || 'Medium',
          undertone: (v.undertone as string) || p.undertone || 'Warm',
          imageUrl: v.imageUrl || '',
          purchaseLink: v.purchaseLink || '',
          isVerified: v.isVerified ?? true,
        }))
      );
    } else {
      setFormShades([
        {
          shadeName: p.shade || p.shadeName || 'Default Shade',
          shadeNumber: '',
          swatchHex: p.shadeHex || '',
          swatchImageUrl: '',
          skinTone: p.skinTone || 'Medium',
          undertone: p.undertone || 'Warm',
          imageUrl: p.imageUrl || p.image || '',
          purchaseLink: p.purchaseLink || '',
          isVerified: p.isVerified ?? true,
        },
      ]);
    }

    setIsEditProductOpen(true);
  };

  const openAvailabilityModal = (p: Product) => {
    setSelectedProduct(p);
    setAvailPrice(p.price || 1500);
    setAvailCountry(p.country || 'Bangladesh');
    setAvailIsAvailable(p.isAvailableInCountry ?? true);
    setAvailPurchaseLink(p.sourceUrl || 'https://shajgoj.com');
    setIsAvailabilityModalOpen(true);
  };

  const filteredProducts = localProducts.filter((p) => {
    const matchesSearch =
      !adminSearch.trim() ||
      p.name.toLowerCase().includes(adminSearch.toLowerCase()) ||
      p.brand.toLowerCase().includes(adminSearch.toLowerCase()) ||
      (p.shade && p.shade.toLowerCase().includes(adminSearch.toLowerCase()));

    const matchesCategory =
      categoryFilter === 'All' ||
      p.category.toLowerCase() === categoryFilter.toLowerCase();

    return matchesSearch && matchesCategory;
  });

  // ----------------------------------------------------
  // Unauthenticated / Permission Gate
  // ----------------------------------------------------
  if (!isAdminAuthenticated) {
    return (
      <div className="min-h-screen bg-[#FAF8F5] flex items-center justify-center px-4 py-12">
        <div className="max-w-md w-full bg-white rounded-3xl p-8 sm:p-10 border border-stone-200/90 shadow-xl space-y-6">
          <div className="text-center space-y-2">
            <div className="w-12 h-12 bg-amber-50 text-amber-800 rounded-2xl flex items-center justify-center mx-auto border border-amber-200/70">
              <Lock className="w-6 h-6" />
            </div>
            <h1 className="text-2xl font-serif-display font-bold text-stone-950">
              Administrator Access
            </h1>
            <p className="text-xs text-stone-600 max-w-xs mx-auto leading-relaxed">
              Administrative credentials are required to manage product catalogs, brand metadata, and application users.
            </p>
          </div>

          {authError && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-800 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
              <span>{authError}</span>
            </div>
          )}

          <form onSubmit={handleAdminLogin} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-stone-700">Admin Email</label>
              <input
                type="email"
                required
                value={adminEmailInput}
                onChange={(e) => setAdminEmailInput(e.target.value)}
                placeholder="Enter admin email address"
                className="w-full text-xs bg-white border border-stone-300 rounded-xl px-3 py-2.5 text-stone-900 placeholder-stone-400 focus:outline-none focus:ring-1 focus:ring-stone-900"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-stone-700">Admin Password</label>
              <input
                type="password"
                required
                value={adminPasswordInput}
                onChange={(e) => setAdminPasswordInput(e.target.value)}
                placeholder="Enter administrator password"
                className="w-full text-xs bg-white border border-stone-300 rounded-xl px-3 py-2.5 text-stone-900 placeholder-stone-400 focus:outline-none focus:ring-1 focus:ring-stone-900"
              />
            </div>

            <button
              type="submit"
              disabled={isAuthenticating}
              className="w-full py-3 px-4 bg-stone-950 hover:bg-stone-800 text-white text-xs font-semibold uppercase tracking-wider rounded-xl transition-all shadow-md cursor-pointer flex items-center justify-center gap-2 mt-2 disabled:opacity-50"
            >
              {isAuthenticating ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Verifying Credentials...</span>
                </>
              ) : (
                <>
                  <span>Authenticate Admin</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          <div className="pt-2 border-t border-stone-100 text-center">
            <button
              onClick={onNavigateHome}
              className="text-xs text-stone-500 hover:text-stone-800 cursor-pointer"
            >
              Return to Public Storefront
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ----------------------------------------------------
  // Authorized Admin View
  // ----------------------------------------------------
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Top Banner & Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-stone-200">
        <div>
          <div className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-amber-800 bg-amber-50 px-3 py-1 rounded-full mb-2 border border-amber-200">
            <Shield className="w-3.5 h-3.5 text-amber-700" />
            <span>Admin Management Console</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-serif-display font-bold text-stone-950">
            Application Administration
          </h1>
          <p className="text-xs text-stone-600 mt-1">
            Maintain catalog products, manage brands & categories, import items, and review users.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              if (onRefreshProducts) onRefreshProducts();
              loadMeta();
              setNotification({ type: 'success', message: 'Data refreshed.' });
            }}
            className="px-3.5 py-2 text-xs font-medium text-stone-700 bg-white border border-stone-200 rounded-xl hover:bg-stone-50 flex items-center gap-2 cursor-pointer shadow-xs"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Refresh</span>
          </button>
          <button
            onClick={onNavigateHome}
            className="px-3.5 py-2 text-xs font-medium text-stone-700 bg-stone-100 rounded-xl hover:bg-stone-200 cursor-pointer"
          >
            View Store
          </button>
        </div>
      </div>

      {/* Notification Toast */}
      {notification && (
        <div
          className={`p-3.5 rounded-xl border text-xs flex items-center justify-between ${
            notification.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : 'bg-red-50 border-red-200 text-red-800'
          }`}
        >
          <div className="flex items-center gap-2">
            {notification.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
            )}
            <span>{notification.message}</span>
          </div>
          <button
            onClick={() => setNotification(null)}
            className="text-stone-400 hover:text-stone-600 cursor-pointer ml-4"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Core Application Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-stone-200/80 shadow-xs">
          <div className="flex items-center justify-between text-stone-500 mb-2">
            <span className="text-xs font-medium">Catalog Products</span>
            <Package className="w-4 h-4 text-amber-700" />
          </div>
          <div className="text-2xl font-bold text-stone-900">{stats.totalProducts || products.length}</div>
          <div className="text-[11px] text-emerald-700 mt-0.5">Active & verified entries</div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-stone-200/80 shadow-xs">
          <div className="flex items-center justify-between text-stone-500 mb-2">
            <span className="text-xs font-medium">Brands</span>
            <Globe className="w-4 h-4 text-stone-600" />
          </div>
          <div className="text-2xl font-bold text-stone-900">{brands.length || stats.totalBrands}</div>
          <div className="text-[11px] text-stone-500 mt-0.5">Verified beauty brands</div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-stone-200/80 shadow-xs">
          <div className="flex items-center justify-between text-stone-500 mb-2">
            <span className="text-xs font-medium">Categories</span>
            <Layers className="w-4 h-4 text-stone-600" />
          </div>
          <div className="text-2xl font-bold text-stone-900">{categories.length || stats.totalCategories}</div>
          <div className="text-[11px] text-stone-500 mt-0.5">Cosmetic categories</div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-stone-200/80 shadow-xs">
          <div className="flex items-center justify-between text-stone-500 mb-2">
            <span className="text-xs font-medium">Registered Users</span>
            <Users className="w-4 h-4 text-stone-600" />
          </div>
          <div className="text-2xl font-bold text-stone-900">{usersList.length || stats.totalUsers || 5}</div>
          <div className="text-[11px] text-stone-500 mt-0.5">User accounts</div>
        </div>
      </div>

      {/* Admin Tab Navigation */}
      <div className="flex border-b border-stone-200 gap-2 sm:gap-6 overflow-x-auto">
        <button
          onClick={() => setActiveTab('products')}
          className={`pb-3 text-xs sm:text-sm font-semibold transition-colors border-b-2 cursor-pointer flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'products'
              ? 'border-stone-950 text-stone-950'
              : 'border-transparent text-stone-500 hover:text-stone-800'
          }`}
        >
          <Package className="w-4 h-4" />
          <span>Product Catalog</span>
        </button>

        <button
          onClick={() => setActiveTab('brands_categories')}
          className={`pb-3 text-xs sm:text-sm font-semibold transition-colors border-b-2 cursor-pointer flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'brands_categories'
              ? 'border-stone-950 text-stone-950'
              : 'border-transparent text-stone-500 hover:text-stone-800'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>Brands & Categories</span>
        </button>

        <button
          onClick={() => setActiveTab('import')}
          className={`pb-3 text-xs sm:text-sm font-semibold transition-colors border-b-2 cursor-pointer flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'import'
              ? 'border-stone-950 text-stone-950'
              : 'border-transparent text-stone-500 hover:text-stone-800'
          }`}
        >
          <DownloadCloud className="w-4 h-4" />
          <span>Product Importer</span>
        </button>

        <button
          onClick={() => setActiveTab('users')}
          className={`pb-3 text-xs sm:text-sm font-semibold transition-colors border-b-2 cursor-pointer flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'users'
              ? 'border-stone-950 text-stone-950'
              : 'border-transparent text-stone-500 hover:text-stone-800'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Registered Users</span>
        </button>
      </div>

      {/* ---------------------------------------------------- */}
      {/* TAB 1: PRODUCT CATALOG */}
      {/* ---------------------------------------------------- */}
      {activeTab === 'products' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
            <div className="flex flex-1 items-center gap-3">
              <div className="relative flex-1 max-w-md">
                <input
                  type="text"
                  placeholder="Search products by title, brand, or shade..."
                  value={adminSearch}
                  onChange={(e) => setAdminSearch(e.target.value)}
                  className="w-full text-xs bg-white border border-stone-200 rounded-xl pl-9 pr-3 py-2.5 text-stone-900 placeholder-stone-400 focus:outline-none focus:ring-1 focus:ring-stone-900"
                />
                <Search className="w-4 h-4 text-stone-400 absolute left-3 top-3" />
              </div>

              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="text-xs bg-white border border-stone-200 rounded-xl px-3 py-2.5 text-stone-800 focus:outline-none"
              >
                <option value="All">All Categories</option>
                {categories.map((c) => (
                  <option key={c.categoryId || c.category_id} value={c.categoryName || c.category_name}>
                    {c.categoryName || c.category_name}
                  </option>
                ))}
              </select>
            </div>

            <button
              onClick={() => {
                resetProductForm();
                setIsAddProductOpen(true);
              }}
              className="px-4 py-2.5 bg-stone-950 text-white rounded-xl text-xs font-semibold hover:bg-stone-800 transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-xs whitespace-nowrap"
            >
              <Plus className="w-4 h-4" />
              <span>Add New Product</span>
            </button>
          </div>

          {/* Product Table */}
          <div className="bg-white border border-stone-200 rounded-2xl overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-stone-700">
                <thead className="bg-stone-50 border-b border-stone-200 text-stone-500 font-medium">
                  <tr>
                    <th className="py-3 px-4">Product</th>
                    <th className="py-3 px-4">Brand</th>
                    <th className="py-3 px-4">Category</th>
                    <th className="py-3 px-4">Shade</th>
                    <th className="py-3 px-4">Tone / Undertone</th>
                    <th className="py-3 px-4">Price</th>
                    <th className="py-3 px-4">Availability</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100">
                  {filteredProducts.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-8 text-center text-stone-500 text-xs">
                        No products match your search criteria.
                      </td>
                    </tr>
                  ) : (
                    filteredProducts.slice(0, 50).map((p) => (
                      <tr key={p.id} className="hover:bg-stone-50/70 transition-colors">
                        <td className="py-3 px-4 flex items-center gap-3">
                          <img
                            src={p.imageUrl || p.image || '/src/assets/images/product_foundation_bottle_1791104563365.jpg'}
                            alt={p.name}
                            className="w-10 h-10 object-cover rounded-lg border border-stone-200 shrink-0"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src =
                                '/src/assets/images/product_foundation_bottle_1791104563365.jpg';
                            }}
                          />
                          <div className="font-semibold text-stone-900 max-w-[200px] truncate" title={p.name}>
                            {p.name}
                          </div>
                        </td>
                        <td className="py-3 px-4">{p.brand}</td>
                        <td className="py-3 px-4">
                          <span className="px-2 py-0.5 rounded-full bg-stone-100 text-[11px] text-stone-700">
                            {p.category}
                          </span>
                        </td>
                        <td className="py-3 px-4 font-mono text-[11px]">
                          {p.shade || p.shadeName || '—'}
                        </td>
                        <td className="py-3 px-4 text-[11px]">
                          {p.skinTone ? `${p.skinTone} / ${p.undertone || 'Any'}` : 'Universal'}
                        </td>
                        <td className="py-3 px-4 font-semibold text-stone-900">
                          {p.currency || '৳'} {p.price?.toLocaleString()}
                        </td>
                        <td className="py-3 px-4">
                          <button
                            onClick={() => openAvailabilityModal(p)}
                            className="text-[11px] text-stone-600 hover:text-stone-900 hover:underline cursor-pointer flex items-center gap-1"
                          >
                            <span>{p.isAvailableInCountry ? 'Available' : 'Unavailable'}</span>
                            <Edit2 className="w-3 h-3 text-stone-400" />
                          </button>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <div className="inline-flex items-center gap-1">
                            <button
                              onClick={() => openEditModal(p)}
                              className="p-1.5 text-stone-500 hover:text-stone-900 hover:bg-stone-100 rounded-lg cursor-pointer"
                              title="Edit product & shades"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDeactivate(p)}
                              className="p-1.5 text-stone-400 hover:text-amber-800 hover:bg-amber-50 rounded-lg cursor-pointer"
                              title="Deactivate / Hide from store"
                            >
                              <EyeOff className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDeleteProduct(p)}
                              className="p-1.5 text-stone-400 hover:text-red-700 hover:bg-red-50 rounded-lg cursor-pointer"
                              title="Delete product permanently"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
            {filteredProducts.length > 50 && (
              <div className="p-3 bg-stone-50 border-t border-stone-200 text-center text-[11px] text-stone-500">
                Showing first 50 of {filteredProducts.length} items. Use search to locate specific records.
              </div>
            )}
          </div>
        </div>
      )}

      {/* ---------------------------------------------------- */}
      {/* TAB 2: BRANDS & CATEGORIES */}
      {/* ---------------------------------------------------- */}
      {activeTab === 'brands_categories' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Brands Section */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-semibold text-stone-950">Beauty Brands ({brands.length})</h2>
                <p className="text-xs text-stone-500">Verified manufacturer catalogs</p>
              </div>
              <button
                onClick={() => setIsAddBrandOpen(true)}
                className="px-3 py-1.5 bg-stone-950 text-white rounded-xl text-xs font-semibold hover:bg-stone-800 cursor-pointer flex items-center gap-1.5"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Brand</span>
              </button>
            </div>

            <div className="bg-white border border-stone-200 rounded-2xl overflow-hidden divide-y divide-stone-100 max-h-[500px] overflow-y-auto shadow-xs">
              {brands.map((b) => (
                <div key={b.brandId || b.brand_id} className="p-3.5 flex items-center justify-between text-xs">
                  <div>
                    <div className="font-semibold text-stone-900">{b.brandName || b.brand_name}</div>
                    <div className="text-[11px] text-stone-500">
                      Origin: {b.countryOrigin || b.country_origin || 'International'}
                    </div>
                  </div>
                  {b.website && (
                    <a
                      href={b.website}
                      target="_blank"
                      rel="noreferrer"
                      className="text-stone-400 hover:text-stone-700 p-1"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Categories Section */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-semibold text-stone-950">Cosmetic Categories ({categories.length})</h2>
                <p className="text-xs text-stone-500">Classification taxonomy for recommendations</p>
              </div>
              <button
                onClick={() => setIsAddCategoryOpen(true)}
                className="px-3 py-1.5 bg-stone-950 text-white rounded-xl text-xs font-semibold hover:bg-stone-800 cursor-pointer flex items-center gap-1.5"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Category</span>
              </button>
            </div>

            <div className="bg-white border border-stone-200 rounded-2xl overflow-hidden divide-y divide-stone-100 max-h-[500px] overflow-y-auto shadow-xs">
              {categories.map((c) => (
                <div key={c.categoryId || c.category_id} className="p-3.5 text-xs">
                  <div className="font-semibold text-stone-900">{c.categoryName || c.category_name}</div>
                  <div className="text-[11px] text-stone-500 mt-0.5">
                    {c.description || 'Standard cosmetic makeup category'}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ---------------------------------------------------- */}
      {/* TAB 3: UNIFIED PRODUCT IMPORTER */}
      {/* ---------------------------------------------------- */}
      {activeTab === 'import' && (
        <div className="max-w-3xl mx-auto space-y-6">
          <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-xs space-y-5">
            <div>
              <h2 className="text-base font-semibold text-stone-950 flex items-center gap-2">
                <DownloadCloud className="w-5 h-5 text-amber-800" />
                <span>Unified Product Importer</span>
              </h2>
              <p className="text-xs text-stone-600 mt-1">
                Import and verify cosmetic products from Daraz, Sephora, Amazon, Shajgoj, or brand websites using structured metadata extraction.
              </p>
            </div>

            {/* Step 1: Input URL */}
            <form onSubmit={handleFetchPreview} className="space-y-3">
              <label className="text-xs font-semibold text-stone-700">Product Page Source URL</label>
              <div className="flex gap-2">
                <input
                  type="url"
                  required
                  value={importUrlInput}
                  onChange={(e) => setImportUrlInput(e.target.value)}
                  placeholder="https://www.daraz.com.bd/products/maybelline-fit-me-..."
                  className="flex-1 text-xs bg-white border border-stone-300 rounded-xl px-3 py-2.5 text-stone-900 placeholder-stone-400 focus:outline-none focus:ring-1 focus:ring-stone-900"
                />
                <button
                  type="submit"
                  disabled={isImportingUrl}
                  className="px-4 py-2.5 bg-stone-950 text-white rounded-xl text-xs font-semibold hover:bg-stone-800 cursor-pointer disabled:opacity-50 flex items-center gap-2 whitespace-nowrap shadow-xs"
                >
                  {isImportingUrl ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Extracting...</span>
                    </>
                  ) : (
                    <>
                      <span>Preview Product</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </>
                  )}
                </button>
              </div>
            </form>

            {importError && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-800 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                <span>{importError}</span>
              </div>
            )}

            {/* Step 2 & 3: Preview, Validation & Confirmation */}
            {importPreview && (
              <div className="pt-4 border-t border-stone-200 space-y-4 animate-fadeIn">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold uppercase tracking-wider text-amber-800">
                    Extracted Product Preview
                  </span>
                  <span className="text-[11px] px-2 py-0.5 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-full font-medium">
                    Verified Source
                  </span>
                </div>

                {/* Duplicate Product Alert */}
                {importPreview.isDuplicate && (
                  <div className="p-3 bg-amber-50 border border-amber-300 rounded-xl text-xs text-amber-900 flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                    <div>
                      <strong>Existing Product Detected:</strong> A product matching this formula already exists in your catalog (ID #{importPreview.duplicateProductId}). Confirming will update existing shades and add any newly extracted variants without creating duplicates.
                    </div>
                  </div>
                )}

                <div className="p-4 bg-stone-50 rounded-xl border border-stone-200 flex flex-col sm:flex-row gap-4 items-start">
                  {importPreview.imageUrl && (
                    <img
                      src={importPreview.imageUrl}
                      alt={importPreview.productName}
                      className="w-20 h-20 object-cover rounded-xl border border-stone-200 shrink-0 bg-white"
                    />
                  )}
                  <div className="space-y-1.5 flex-1 text-xs">
                    <div className="font-bold text-stone-900 text-sm">{importPreview.productName}</div>
                    <div className="text-stone-600">
                      Brand: <strong className="text-stone-800">{importPreview.brandName}</strong> | Category:{' '}
                      <strong className="text-stone-800">{importPreview.categoryName}</strong>
                    </div>
                    <div className="text-stone-600">
                      Total Shades Detected: <strong className="text-stone-900 font-bold">{importPreview.shades?.length || 1}</strong>
                    </div>
                    <div className="text-stone-900 font-semibold text-sm">
                      Price: {importPreview.currency || '৳'} {importPreview.price || 1500}
                    </div>
                  </div>
                </div>

                {/* Interactive Multi-Shade Editor & Preview before saving */}
                <ProductShadesManager
                  shades={importPreview.shades || []}
                  onChange={(updatedShades) => {
                    setImportPreview({
                      ...importPreview,
                      shades: updatedShades,
                    });
                  }}
                  defaultSkinTone={importPreview.skinTone || 'Medium'}
                  defaultUndertone={importPreview.undertone || 'Warm'}
                />

                <div className="flex justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setImportPreview(null)}
                    className="px-4 py-2 border border-stone-200 text-stone-600 text-xs font-medium rounded-xl hover:bg-stone-50 cursor-pointer"
                  >
                    Discard Preview
                  </button>
                  <button
                    type="button"
                    onClick={handleConfirmSaveImport}
                    disabled={isSavingImport}
                    className="px-5 py-2 bg-stone-950 text-white text-xs font-semibold rounded-xl hover:bg-stone-800 cursor-pointer flex items-center gap-2 shadow-xs disabled:opacity-50"
                  >
                    {isSavingImport ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        <span>Saving to Database...</span>
                      </>
                    ) : (
                      <>
                        <Check className="w-4 h-4" />
                        <span>Confirm & Add to Catalog</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ---------------------------------------------------- */}
      {/* TAB 4: REGISTERED USERS */}
      {/* ---------------------------------------------------- */}
      {activeTab === 'users' && (
        <div className="space-y-4">
          <div>
            <h2 className="text-base font-semibold text-stone-950">Registered User Accounts ({usersList.length})</h2>
            <p className="text-xs text-stone-500">
              Basic account registration data. Personal analysis history, orders, and favorites are kept private.
            </p>
          </div>

          <div className="bg-white border border-stone-200 rounded-2xl overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-stone-700">
                <thead className="bg-stone-50 border-b border-stone-200 text-stone-500 font-medium">
                  <tr>
                    <th className="py-3 px-4">User ID</th>
                    <th className="py-3 px-4">Full Name</th>
                    <th className="py-3 px-4">Email Address</th>
                    <th className="py-3 px-4">Role</th>
                    <th className="py-3 px-4">Country</th>
                    <th className="py-3 px-4">Registered Date</th>
                    <th className="py-3 px-4">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100">
                  {usersList.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-stone-500 text-xs">
                        {isLoadingUsers ? 'Loading registered users...' : 'No registered users found.'}
                      </td>
                    </tr>
                  ) : (
                    usersList.map((u) => (
                      <tr key={u.userId} className="hover:bg-stone-50/70 transition-colors">
                        <td className="py-3 px-4 font-mono text-[11px] text-stone-500">#{u.userId}</td>
                        <td className="py-3 px-4 font-semibold text-stone-900">{u.name}</td>
                        <td className="py-3 px-4 text-stone-600">{u.email}</td>
                        <td className="py-3 px-4">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[11px] font-medium ${
                              u.role === 'admin'
                                ? 'bg-amber-100 text-amber-900 font-bold'
                                : 'bg-stone-100 text-stone-700'
                            }`}
                          >
                            {u.role || 'user'}
                          </span>
                        </td>
                        <td className="py-3 px-4">{u.country || 'Bangladesh'}</td>
                        <td className="py-3 px-4 text-stone-500 text-[11px]">
                          {u.createdAt ? new Date(u.createdAt).toLocaleDateString() : 'Recent'}
                        </td>
                        <td className="py-3 px-4">
                          <span className="inline-flex items-center gap-1 text-[11px] text-emerald-700 font-medium">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                            Active
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ---------------------------------------------------- */}
      {/* MODAL: ADD PRODUCT */}
      {/* ---------------------------------------------------- */}
      {isAddProductOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 space-y-5 border border-stone-200 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-stone-100">
              <h3 className="text-base font-bold text-stone-950">Add Product to Catalog</h3>
              <button
                onClick={() => setIsAddProductOpen(false)}
                className="text-stone-400 hover:text-stone-600 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateProductSubmit} className="space-y-4 text-xs">
              <div>
                <label className="font-semibold text-stone-700">Product Name *</label>
                <input
                  type="text"
                  required
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="e.g. Fit Me Matte + Poreless Foundation"
                  className="w-full mt-1 border border-stone-300 rounded-xl px-3 py-2 text-stone-900 focus:outline-none focus:ring-1 focus:ring-stone-900"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-stone-700">Brand *</label>
                  <select
                    value={formBrandId}
                    onChange={(e) => setFormBrandId(Number(e.target.value))}
                    className="w-full mt-1 border border-stone-300 rounded-xl px-3 py-2 text-stone-900 focus:outline-none"
                  >
                    {brands.map((b) => (
                      <option key={b.brandId || b.brand_id} value={b.brandId || b.brand_id}>
                        {b.brandName || b.brand_name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="font-semibold text-stone-700">Category *</label>
                  <select
                    value={formCategoryId}
                    onChange={(e) => setFormCategoryId(Number(e.target.value))}
                    className="w-full mt-1 border border-stone-300 rounded-xl px-3 py-2 text-stone-900 focus:outline-none"
                  >
                    {categories.map((c) => (
                      <option key={c.categoryId || c.category_id} value={c.categoryId || c.category_id}>
                        {c.categoryName || c.category_name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-stone-700">Price (BDT / Currency) *</label>
                  <input
                    type="number"
                    required
                    value={formPrice}
                    onChange={(e) => setFormPrice(Number(e.target.value))}
                    className="w-full mt-1 border border-stone-300 rounded-xl px-3 py-2 text-stone-900 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="font-semibold text-stone-700">Shade Name</label>
                  <input
                    type="text"
                    value={formShadeName}
                    onChange={(e) => setFormShadeName(e.target.value)}
                    placeholder="e.g. 220 Natural Beige"
                    className="w-full mt-1 border border-stone-300 rounded-xl px-3 py-2 text-stone-900 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-stone-700">Skin Tone Suitability</label>
                  <select
                    value={formSkinTone}
                    onChange={(e) => setFormSkinTone(e.target.value)}
                    className="w-full mt-1 border border-stone-300 rounded-xl px-3 py-2 text-stone-900 focus:outline-none"
                  >
                    <option value="Very Fair">Very Fair</option>
                    <option value="Fair">Fair</option>
                    <option value="Light">Light</option>
                    <option value="Medium">Medium</option>
                    <option value="Tan">Tan</option>
                    <option value="Deep">Deep</option>
                    <option value="Universal">Universal / All</option>
                  </select>
                </div>
                <div>
                  <label className="font-semibold text-stone-700">Undertone</label>
                  <select
                    value={formUndertone}
                    onChange={(e) => setFormUndertone(e.target.value)}
                    className="w-full mt-1 border border-stone-300 rounded-xl px-3 py-2 text-stone-900 focus:outline-none"
                  >
                    <option value="Warm">Warm</option>
                    <option value="Cool">Cool</option>
                    <option value="Neutral">Neutral</option>
                    <option value="Olive">Olive</option>
                    <option value="Universal">Universal</option>
                  </select>
                </div>
              </div>

              {/* Device Photo Upload & Image Selection */}
              <div className="space-y-1.5">
                <label className="font-semibold text-stone-700 block">Product Photo *</label>
                <div className="flex flex-col sm:flex-row gap-3 items-start p-3 bg-stone-50 rounded-2xl border border-stone-200">
                  <div className="w-20 h-20 rounded-xl border border-stone-200 bg-white flex items-center justify-center overflow-hidden shrink-0 relative group shadow-2xs">
                    {formImageUrl ? (
                      <>
                        <img src={formImageUrl} alt="Preview" className="w-full h-full object-cover" />
                        <button
                          type="button"
                          onClick={() => setFormImageUrl('')}
                          className="absolute inset-0 bg-black/60 text-white opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity cursor-pointer"
                          title="Remove photo"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </>
                    ) : (
                      <Camera className="w-6 h-6 text-stone-300" />
                    )}
                  </div>

                  <div className="flex-1 space-y-2 w-full text-xs">
                    <label className="cursor-pointer inline-flex items-center gap-2 px-3 py-1.5 bg-stone-900 text-white hover:bg-stone-800 rounded-xl text-xs font-semibold transition-colors shadow-2xs">
                      <Upload className="w-3.5 h-3.5 text-amber-300" />
                      <span>Upload Photo from Device</span>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleDevicePhotoChange}
                      />
                    </label>
                    <div className="text-[11px] text-stone-500">
                      Upload high-res photo from your phone/computer, or paste URL below.
                    </div>
                    <input
                      type="text"
                      value={formImageUrl.startsWith('data:') ? 'Photo loaded from your device (Base64 ready)' : formImageUrl}
                      onChange={(e) => setFormImageUrl(e.target.value)}
                      placeholder="Or enter image URL (https://...)"
                      className="w-full border border-stone-300 bg-white rounded-xl px-3 py-1.5 text-xs text-stone-900 focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Product Source Link (Where product is coming from) */}
              <div>
                <label className="font-semibold text-stone-700 block">
                  Product Source Link / Store URL (Where product is coming from)
                </label>
                <div className="relative mt-1">
                  <LinkIcon className="w-3.5 h-3.5 text-stone-400 absolute left-3 top-2.5 pointer-events-none" />
                  <input
                    type="url"
                    value={formPurchaseLink}
                    onChange={(e) => setFormPurchaseLink(e.target.value)}
                    placeholder="https://www.sephora.com/product/... or https://daraz.com.bd/..."
                    className="w-full pl-9 pr-3 py-2 border border-stone-300 rounded-xl text-stone-900 text-xs focus:outline-none focus:ring-1 focus:ring-stone-900"
                  />
                </div>
                <p className="text-[11px] text-stone-500 mt-1">
                  Shoppers clicking "Details" on the product card will be taken directly to this store link.
                </p>
              </div>

              {/* Multi-Shade Manager */}
              <ProductShadesManager
                shades={formShades}
                onChange={setFormShades}
                defaultSkinTone={formSkinTone}
                defaultUndertone={formUndertone}
              />

              <div>
                <label className="font-semibold text-stone-700">Description</label>
                <textarea
                  rows={2}
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  className="w-full mt-1 border border-stone-300 rounded-xl px-3 py-2 text-stone-900 focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-stone-100">
                <button
                  type="button"
                  onClick={() => setIsAddProductOpen(false)}
                  className="px-4 py-2 border border-stone-200 text-stone-600 rounded-xl hover:bg-stone-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-stone-950 text-white rounded-xl font-semibold hover:bg-stone-800 cursor-pointer"
                >
                  Save Product
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ---------------------------------------------------- */}
      {/* MODAL: EDIT PRODUCT */}
      {/* ---------------------------------------------------- */}
      {isEditProductOpen && selectedProduct && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 space-y-5 border border-stone-200 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-stone-100">
              <h3 className="text-base font-bold text-stone-950">Edit Product Information</h3>
              <button
                onClick={() => {
                  setIsEditProductOpen(false);
                  setSelectedProduct(null);
                }}
                className="text-stone-400 hover:text-stone-600 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUpdateProductSubmit} className="space-y-4 text-xs">
              <div>
                <label className="font-semibold text-stone-700">Product Name *</label>
                <input
                  type="text"
                  required
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  className="w-full mt-1 border border-stone-300 rounded-xl px-3 py-2 text-stone-900 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-stone-700">Price *</label>
                  <input
                    type="number"
                    required
                    value={formPrice}
                    onChange={(e) => setFormPrice(Number(e.target.value))}
                    className="w-full mt-1 border border-stone-300 rounded-xl px-3 py-2 text-stone-900 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="font-semibold text-stone-700">Shade Name</label>
                  <input
                    type="text"
                    value={formShadeName}
                    onChange={(e) => setFormShadeName(e.target.value)}
                    className="w-full mt-1 border border-stone-300 rounded-xl px-3 py-2 text-stone-900 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-stone-700">Skin Tone</label>
                  <select
                    value={formSkinTone}
                    onChange={(e) => setFormSkinTone(e.target.value)}
                    className="w-full mt-1 border border-stone-300 rounded-xl px-3 py-2 text-stone-900 focus:outline-none"
                  >
                    <option value="Very Fair">Very Fair</option>
                    <option value="Fair">Fair</option>
                    <option value="Light">Light</option>
                    <option value="Medium">Medium</option>
                    <option value="Tan">Tan</option>
                    <option value="Deep">Deep</option>
                    <option value="Universal">Universal</option>
                  </select>
                </div>
                <div>
                  <label className="font-semibold text-stone-700">Undertone</label>
                  <select
                    value={formUndertone}
                    onChange={(e) => setFormUndertone(e.target.value)}
                    className="w-full mt-1 border border-stone-300 rounded-xl px-3 py-2 text-stone-900 focus:outline-none"
                  >
                    <option value="Warm">Warm</option>
                    <option value="Cool">Cool</option>
                    <option value="Neutral">Neutral</option>
                    <option value="Olive">Olive</option>
                    <option value="Universal">Universal</option>
                  </select>
                </div>
              </div>

              {/* Device Photo Upload & Image Selection */}
              <div className="space-y-1.5">
                <label className="font-semibold text-stone-700 block">Product Photo *</label>
                <div className="flex flex-col sm:flex-row gap-3 items-start p-3 bg-stone-50 rounded-2xl border border-stone-200">
                  <div className="w-20 h-20 rounded-xl border border-stone-200 bg-white flex items-center justify-center overflow-hidden shrink-0 relative group shadow-2xs">
                    {formImageUrl ? (
                      <>
                        <img src={formImageUrl} alt="Preview" className="w-full h-full object-cover" />
                        <button
                          type="button"
                          onClick={() => setFormImageUrl('')}
                          className="absolute inset-0 bg-black/60 text-white opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity cursor-pointer"
                          title="Remove photo"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </>
                    ) : (
                      <Camera className="w-6 h-6 text-stone-300" />
                    )}
                  </div>

                  <div className="flex-1 space-y-2 w-full text-xs">
                    <label className="cursor-pointer inline-flex items-center gap-2 px-3 py-1.5 bg-stone-900 text-white hover:bg-stone-800 rounded-xl text-xs font-semibold transition-colors shadow-2xs">
                      <Upload className="w-3.5 h-3.5 text-amber-300" />
                      <span>Upload New Photo from Device</span>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleDevicePhotoChange}
                      />
                    </label>
                    <div className="text-[11px] text-stone-500">
                      Upload high-res photo from your phone/computer, or paste URL below.
                    </div>
                    <input
                      type="text"
                      value={formImageUrl.startsWith('data:') ? 'Photo loaded from your device (Base64 ready)' : formImageUrl}
                      onChange={(e) => setFormImageUrl(e.target.value)}
                      placeholder="Or enter image URL (https://...)"
                      className="w-full border border-stone-300 bg-white rounded-xl px-3 py-1.5 text-xs text-stone-900 focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Product Source Link (Where product is coming from) */}
              <div>
                <label className="font-semibold text-stone-700 block">
                  Product Source Link / Store URL (Where product is coming from)
                </label>
                <div className="relative mt-1">
                  <LinkIcon className="w-3.5 h-3.5 text-stone-400 absolute left-3 top-2.5 pointer-events-none" />
                  <input
                    type="url"
                    value={formPurchaseLink}
                    onChange={(e) => setFormPurchaseLink(e.target.value)}
                    placeholder="https://www.sephora.com/product/... or https://daraz.com.bd/..."
                    className="w-full pl-9 pr-3 py-2 border border-stone-300 rounded-xl text-stone-900 text-xs focus:outline-none focus:ring-1 focus:ring-stone-900"
                  />
                </div>
                <p className="text-[11px] text-stone-500 mt-1">
                  Shoppers clicking "Details" on the product card will be taken directly to this store link.
                </p>
              </div>

              {/* Multi-Shade Manager */}
              <ProductShadesManager
                shades={formShades}
                onChange={setFormShades}
                defaultSkinTone={formSkinTone}
                defaultUndertone={formUndertone}
              />

              <div>
                <label className="font-semibold text-stone-700">Description</label>
                <textarea
                  rows={2}
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  className="w-full mt-1 border border-stone-300 rounded-xl px-3 py-2 text-stone-900 focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-stone-100">
                <button
                  type="button"
                  onClick={() => {
                    if (selectedProduct) {
                      setIsEditProductOpen(false);
                      handleDeleteProduct(selectedProduct);
                    }
                  }}
                  className="px-3.5 py-2 text-red-600 hover:text-white hover:bg-red-600 border border-red-200 hover:border-red-600 rounded-xl transition-colors cursor-pointer flex items-center gap-1.5 font-medium"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Delete Product</span>
                </button>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setIsEditProductOpen(false)}
                    className="px-4 py-2 border border-stone-200 text-stone-600 rounded-xl hover:bg-stone-50 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-stone-950 text-white rounded-xl font-semibold hover:bg-stone-800 cursor-pointer"
                  >
                    Update Product
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ---------------------------------------------------- */}
      {/* MODAL: AVAILABILITY & COUNTRY PRICE */}
      {/* ---------------------------------------------------- */}
      {isAvailabilityModalOpen && selectedProduct && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-5 border border-stone-200 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-stone-100">
              <div>
                <h3 className="text-base font-bold text-stone-950">Country Availability & Price</h3>
                <p className="text-xs text-stone-500 truncate max-w-xs">{selectedProduct.name}</p>
              </div>
              <button
                onClick={() => setIsAvailabilityModalOpen(false)}
                className="text-stone-400 hover:text-stone-600 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUpdateAvailabilitySubmit} className="space-y-4 text-xs">
              <div>
                <label className="font-semibold text-stone-700">Country *</label>
                <select
                  value={availCountry}
                  onChange={(e) => setAvailCountry(e.target.value)}
                  className="w-full mt-1 border border-stone-300 rounded-xl px-3 py-2 text-stone-900 focus:outline-none"
                >
                  <option value="Bangladesh">Bangladesh</option>
                  <option value="United States">United States</option>
                  <option value="United Kingdom">United Kingdom</option>
                  <option value="Canada">Canada</option>
                  <option value="Australia">Australia</option>
                  <option value="India">India</option>
                </select>
              </div>

              <div>
                <label className="font-semibold text-stone-700">Local Country Price *</label>
                <input
                  type="number"
                  required
                  value={availPrice}
                  onChange={(e) => setAvailPrice(Number(e.target.value))}
                  className="w-full mt-1 border border-stone-300 rounded-xl px-3 py-2 text-stone-900 focus:outline-none"
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="availCheck"
                  checked={availIsAvailable}
                  onChange={(e) => setAvailIsAvailable(e.target.checked)}
                  className="rounded text-stone-900 focus:ring-stone-900"
                />
                <label htmlFor="availCheck" className="font-medium text-stone-800 cursor-pointer">
                  In Stock & Available in this Country
                </label>
              </div>

              <div>
                <label className="font-semibold text-stone-700">Direct Purchase Link</label>
                <input
                  type="url"
                  value={availPurchaseLink}
                  onChange={(e) => setAvailPurchaseLink(e.target.value)}
                  className="w-full mt-1 border border-stone-300 rounded-xl px-3 py-2 text-stone-900 focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-stone-100">
                <button
                  type="button"
                  onClick={() => setIsAvailabilityModalOpen(false)}
                  className="px-4 py-2 border border-stone-200 text-stone-600 rounded-xl hover:bg-stone-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-stone-950 text-white rounded-xl font-semibold hover:bg-stone-800 cursor-pointer"
                >
                  Save Availability
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ---------------------------------------------------- */}
      {/* MODAL: ADD BRAND */}
      {/* ---------------------------------------------------- */}
      {isAddBrandOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 space-y-4 border border-stone-200 shadow-2xl">
            <div className="flex items-center justify-between pb-2 border-b border-stone-100">
              <h3 className="text-base font-bold text-stone-950">Add Brand</h3>
              <button onClick={() => setIsAddBrandOpen(false)} className="text-stone-400 hover:text-stone-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleCreateBrandSubmit} className="space-y-3 text-xs">
              <div>
                <label className="font-semibold text-stone-700">Brand Name *</label>
                <input
                  type="text"
                  required
                  value={newBrandName}
                  onChange={(e) => setNewBrandName(e.target.value)}
                  placeholder="e.g. Fenty Beauty"
                  className="w-full mt-1 border border-stone-300 rounded-xl px-3 py-2 text-stone-900 focus:outline-none"
                />
              </div>
              <div>
                <label className="font-semibold text-stone-700">Country Origin</label>
                <input
                  type="text"
                  value={newBrandOrigin}
                  onChange={(e) => setNewBrandOrigin(e.target.value)}
                  placeholder="e.g. United States"
                  className="w-full mt-1 border border-stone-300 rounded-xl px-3 py-2 text-stone-900 focus:outline-none"
                />
              </div>
              <div>
                <label className="font-semibold text-stone-700">Official Website</label>
                <input
                  type="url"
                  value={newBrandWebsite}
                  onChange={(e) => setNewBrandWebsite(e.target.value)}
                  className="w-full mt-1 border border-stone-300 rounded-xl px-3 py-2 text-stone-900 focus:outline-none"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2 border-t border-stone-100">
                <button
                  type="button"
                  onClick={() => setIsAddBrandOpen(false)}
                  className="px-3 py-1.5 border border-stone-200 text-stone-600 rounded-xl"
                >
                  Cancel
                </button>
                <button type="submit" className="px-4 py-1.5 bg-stone-950 text-white rounded-xl font-semibold">
                  Save Brand
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ---------------------------------------------------- */}
      {/* MODAL: ADD CATEGORY */}
      {/* ---------------------------------------------------- */}
      {isAddCategoryOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 space-y-4 border border-stone-200 shadow-2xl">
            <div className="flex items-center justify-between pb-2 border-b border-stone-100">
              <h3 className="text-base font-bold text-stone-950">Add Category</h3>
              <button onClick={() => setIsAddCategoryOpen(false)} className="text-stone-400 hover:text-stone-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleCreateCategorySubmit} className="space-y-3 text-xs">
              <div>
                <label className="font-semibold text-stone-700">Category Name *</label>
                <input
                  type="text"
                  required
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                  placeholder="e.g. Setting Spray"
                  className="w-full mt-1 border border-stone-300 rounded-xl px-3 py-2 text-stone-900 focus:outline-none"
                />
              </div>
              <div>
                <label className="font-semibold text-stone-700">Description</label>
                <textarea
                  rows={2}
                  value={newCategoryDescription}
                  onChange={(e) => setNewCategoryDescription(e.target.value)}
                  placeholder="Category purpose..."
                  className="w-full mt-1 border border-stone-300 rounded-xl px-3 py-2 text-stone-900 focus:outline-none"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2 border-t border-stone-100">
                <button
                  type="button"
                  onClick={() => setIsAddCategoryOpen(false)}
                  className="px-3 py-1.5 border border-stone-200 text-stone-600 rounded-xl"
                >
                  Cancel
                </button>
                <button type="submit" className="px-4 py-1.5 bg-stone-950 text-white rounded-xl font-semibold">
                  Save Category
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ---------------------------------------------------- */}
      {/* MODAL: CONFIRM PERMANENT DELETE */}
      {/* ---------------------------------------------------- */}
      {deleteConfirmProduct && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-7 space-y-5 border border-stone-200 shadow-2xl">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-2xl bg-red-50 text-red-600 flex items-center justify-center shrink-0 border border-red-200">
                <Trash2 className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-bold text-stone-950 font-serif-display">
                  Delete Product Permanently?
                </h3>
                <p className="text-xs text-stone-600 leading-relaxed">
                  Are you sure you want to delete <span className="font-semibold text-stone-900">"{deleteConfirmProduct.name}"</span>?
                </p>
              </div>
            </div>

            <div className="p-3.5 bg-stone-50 rounded-2xl border border-stone-200 flex items-center gap-3">
              <img
                src={deleteConfirmProduct.imageUrl || deleteConfirmProduct.image || '/src/assets/images/product_foundation_bottle_1791104563365.jpg'}
                alt={deleteConfirmProduct.name}
                className="w-12 h-12 object-cover rounded-xl border border-stone-200 shrink-0"
              />
              <div className="text-xs space-y-0.5 min-w-0 flex-1">
                <div className="font-semibold text-stone-900 truncate">{deleteConfirmProduct.name}</div>
                <div className="text-[11px] text-stone-500">{deleteConfirmProduct.brand} · {deleteConfirmProduct.category}</div>
                <div className="text-[11px] text-stone-700 font-mono">
                  {deleteConfirmProduct.variants?.length || deleteConfirmProduct.variantCount || 1} shade variant(s) · {deleteConfirmProduct.currency || '৳'}{deleteConfirmProduct.price}
                </div>
              </div>
            </div>

            <div className="p-3 bg-red-50/70 border border-red-200/80 rounded-xl text-[11px] text-red-900 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
              <span>
                <strong>Database Cascade:</strong> This product and all its linked shade variants will be removed from the database. It will immediately disappear from the admin console and storefront pages.
              </span>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-stone-100">
              <button
                type="button"
                disabled={isDeleting}
                onClick={() => setDeleteConfirmProduct(null)}
                className="px-4 py-2 border border-stone-300 text-stone-700 hover:bg-stone-50 rounded-xl text-xs font-semibold cursor-pointer transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isDeleting}
                onClick={handleConfirmDeleteProduct}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-semibold cursor-pointer transition-colors flex items-center gap-1.5 shadow-sm disabled:opacity-50"
              >
                {isDeleting ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Deleting Product...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Yes, Permanently Delete</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ---------------------------------------------------- */}
      {/* MODAL: CONFIRM DEACTIVATE */}
      {/* ---------------------------------------------------- */}
      {deactivateConfirmProduct && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-7 space-y-5 border border-stone-200 shadow-2xl">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-700 flex items-center justify-center shrink-0 border border-amber-200">
                <EyeOff className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-bold text-stone-950 font-serif-display">
                  Deactivate Product?
                </h3>
                <p className="text-xs text-stone-600 leading-relaxed">
                  Deactivating <span className="font-semibold text-stone-900">"{deactivateConfirmProduct.name}"</span> will safely hide it from storefront catalog and recommendations while preserving database history.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-stone-100">
              <button
                type="button"
                disabled={isDeactivating}
                onClick={() => setDeactivateConfirmProduct(null)}
                className="px-4 py-2 border border-stone-300 text-stone-700 hover:bg-stone-50 rounded-xl text-xs font-semibold cursor-pointer transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isDeactivating}
                onClick={handleConfirmDeactivateProduct}
                className="px-4 py-2 bg-stone-950 hover:bg-stone-800 text-white rounded-xl text-xs font-semibold cursor-pointer transition-colors flex items-center gap-1.5 shadow-sm disabled:opacity-50"
              >
                {isDeactivating ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Deactivating...</span>
                  </>
                ) : (
                  <>
                    <EyeOff className="w-3.5 h-3.5" />
                    <span>Deactivate & Hide</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
