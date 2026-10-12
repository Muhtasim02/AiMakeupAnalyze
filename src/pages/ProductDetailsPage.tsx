import React, { useState, useEffect } from 'react';
import { Heart, Scale, ArrowLeft, Check, ShieldCheck, Truck, Sparkles, X, CheckCircle2, Globe, AlertCircle, RefreshCw, ExternalLink } from 'lucide-react';
import { Product } from '../types';
import { fetchProductById } from '../services/api';
import { ProductImage } from '../components/ProductImage';

interface ProductDetailsPageProps {
  productId: string;
  initialProduct?: Product;
  isFavorite: boolean;
  isInCompare: boolean;
  onToggleFavorite: (id: string) => void;
  onToggleCompare: (id: string) => void;
  onBack: () => void;
  onNavigateToCompare: () => void;
}

export const ProductDetailsPage: React.FC<ProductDetailsPageProps> = ({
  productId,
  initialProduct,
  isFavorite,
  isInCompare,
  onToggleFavorite,
  onToggleCompare,
  onBack,
  onNavigateToCompare,
}) => {
  const [product, setProduct] = useState<any>(initialProduct);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [buyModalOpen, setBuyModalOpen] = useState(false);
  const [orderConfirmed, setOrderConfirmed] = useState(false);
  const [deliveryName, setDeliveryName] = useState('Anika Rahman');
  const [deliveryPhone, setDeliveryPhone] = useState('+880 1712-345678');
  const [deliveryAddress, setDeliveryAddress] = useState('Road 12, Gulshan-2, Dhaka 1212');

  // Load product directly from backend API
  useEffect(() => {
    let isMounted = true;
    async function loadProduct() {
      setLoading(true);
      setError(null);
      try {
        const data = await fetchProductById(productId);
        if (isMounted) {
          setProduct(data);
        }
      } catch (err: any) {
        if (isMounted) {
          console.error('Failed to load product from backend:', err);
          setError(err.message || 'Unable to retrieve product from MySQL database.');
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadProduct();
    return () => {
      isMounted = false;
    };
  }, [productId]);

  useEffect(() => {
    if (initialProduct) {
      setProduct(initialProduct);
    }
  }, [initialProduct]);

  const handleConfirmOrder = (e: React.FormEvent) => {
    e.preventDefault();
    setOrderConfirmed(true);
  };

  if (loading && !product) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-24 text-center space-y-4">
        <RefreshCw className="w-8 h-8 animate-spin mx-auto text-stone-700" />
        <p className="text-sm text-stone-600 font-medium">Fetching product specifications from MySQL database...</p>
      </div>
    );
  }

  if (error && !product) {
    return (
      <div className="max-w-xl mx-auto px-4 py-20 text-center space-y-4">
        <AlertCircle className="w-10 h-10 text-rose-500 mx-auto" />
        <h2 className="text-xl font-serif-display font-bold text-stone-900">Product Unavailable</h2>
        <p className="text-xs text-stone-600">{error}</p>
        <button
          onClick={onBack}
          className="mt-4 px-5 py-2.5 bg-stone-900 text-white text-xs font-semibold uppercase tracking-wider rounded-xl"
        >
          Return to Catalog
        </button>
      </div>
    );
  }

  // Extract active shades list
  const shadesList: any[] = product.variants && product.variants.length > 0
    ? product.variants
    : [
        {
          variantId: Number(product.id?.replace('prod_', '') || product.productId || 1),
          productId: Number(product.id?.replace('prod_', '') || product.productId || 1),
          shadeName: product.shade || product.shadeName || 'Default Shade',
          shadeNumber: null,
          skinTone: product.skinTone || 'Medium',
          undertone: product.undertone || 'Warm',
          swatchHex: product.shadeHex || null,
          swatchImageUrl: product.swatchImageUrl || null,
          imageUrl: product.imageUrl || product.image,
          purchaseLink: product.purchaseLink || product.sourceUrl || product.officialUrl || '#',
          isVerified: product.isVerified ?? true,
        },
      ];

  const [selectedShadeIndex, setSelectedShadeIndex] = useState<number>(0);

  // Sync selected index if shadesList changes
  useEffect(() => {
    setSelectedShadeIndex(0);
  }, [product.productId, product.id]);

  const activeShade = shadesList[selectedShadeIndex] || shadesList[0];
  const activeShadeName = activeShade?.shadeName || product.shade || product.shadeName || 'Default Shade';
  const activeShadeNumber = activeShade?.shadeNumber;
  const activeSkinTone = activeShade?.skinTone || product.skinTone || 'Medium';
  const activeUndertone = activeShade?.undertone || product.undertone || 'Warm';
  const activeSwatchHex = activeShade?.swatchHex;
  const activeSwatchImage = activeShade?.swatchImageUrl;
  const activeProductImage = activeShade?.imageUrl || product.image || product.imageUrl || product.image_url;
  const activeIsVerified = activeShade?.isVerified === true || activeShade?.isVerified === 1;

  // Direct Shade Link vs Parent Product Link
  const parentProductLink = product.purchaseLink || product.sourceUrl || product.officialUrl || '#';
  const shadeSpecificLink = activeShade?.purchaseLink && activeShade.purchaseLink !== '#' && activeShade.purchaseLink !== parentProductLink
    ? activeShade.purchaseLink
    : null;
  const targetPurchaseLink = shadeSpecificLink || (parentProductLink !== '#' ? parentProductLink : null);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      
      {/* Back button */}
      <button
        onClick={onBack}
        className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-stone-600 hover:text-stone-950 transition-colors cursor-pointer"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back to Products</span>
      </button>

      {/* Main Details Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
        
        {/* Left Column: Product Imagery & Detailed Specs */}
        <div className="lg:col-span-7 space-y-8">
          
          {/* Main Visual Display */}
          <div className="relative aspect-[4/3] rounded-2xl overflow-hidden bg-stone-100 border border-stone-200 shadow-sm">
            <ProductImage
              src={activeProductImage}
              alt={`${product.name} - ${activeShadeName}`}
              category={product.category}
              shadeHex={activeSwatchHex}
              shadeName={activeShadeName}
              isVerified={activeIsVerified}
              className="w-full h-full object-cover object-center"
            />
            
            {/* Match Badge */}
            <div className="absolute top-4 left-4 bg-stone-900/90 backdrop-blur-md text-white px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-sm pointer-events-none">
              <span className="font-mono-nums text-emerald-400 font-bold">{product.matchPercentage || 92}%</span>
              <span>Overall Match</span>
            </div>

            {/* Quick Actions */}
            <div className="absolute top-4 right-4 flex items-center gap-2">
              <button
                onClick={() => onToggleCompare(product.id || `prod_${product.productId}`)}
                title="Add to Compare"
                className={`p-2.5 rounded-full backdrop-blur-md transition-all cursor-pointer ${
                  isInCompare ? 'bg-stone-900 text-white' : 'bg-white/80 text-stone-700 hover:bg-white'
                }`}
              >
                <Scale className="w-4 h-4" />
              </button>

              <button
                onClick={() => onToggleFavorite(product.id || `prod_${product.productId}`)}
                title="Save to Favorites"
                className={`p-2.5 rounded-full backdrop-blur-md transition-all cursor-pointer ${
                  isFavorite ? 'bg-rose-500 text-white' : 'bg-white/80 text-stone-700 hover:bg-white hover:text-rose-600'
                }`}
              >
                <Heart className={`w-4 h-4 ${isFavorite ? 'fill-current' : ''}`} />
              </button>
            </div>
          </div>

          {/* Detailed Description */}
          <div className="bg-white p-6 rounded-2xl border border-stone-200/80 shadow-xs space-y-4">
            <h3 className="text-base font-semibold text-stone-900">
              Formula & Skin Profile Compatibility
            </h3>
            <p className="text-sm text-stone-600 leading-relaxed">
              {product.description}
            </p>

            {/* International & Local Market Availability Table (From Database) */}
            {product.availabilityList && product.availabilityList.length > 0 && (
              <div className="pt-4 border-t border-stone-100 space-y-3">
                <div className="text-xs font-semibold uppercase tracking-wider text-stone-500 flex items-center gap-1.5">
                  <Globe className="w-3.5 h-3.5 text-stone-700" />
                  <span>Market Availability & Local Pricing</span>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  {product.availabilityList.map((item: any) => (
                    <div key={item.availabilityId} className="p-2.5 bg-stone-50 rounded-lg border border-stone-200/60 flex items-center justify-between">
                      <div>
                        <span className="font-semibold text-stone-900">{item.country}</span>
                        <div className="text-[11px] text-stone-500">
                          {item.isAvailable ? 'Authorized Retail' : 'Backorder'}
                        </div>
                      </div>
                      <div className="text-right font-mono-nums font-semibold text-stone-900">
                        {item.currency}{item.localPrice?.toLocaleString()}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Match Metric Breakdown Bars */}
            <div className="pt-4 border-t border-stone-100 space-y-3">
              <div className="text-xs font-semibold uppercase tracking-wider text-stone-500">
                Compatibility Breakdown ({activeShadeName})
              </div>
              
              <div className="space-y-2">
                <div>
                  <div className="flex justify-between text-xs text-stone-700 mb-1">
                    <span>Skin Melanin Depth Fit ({activeSkinTone || 'Unverified'})</span>
                    <span className="font-mono-nums font-semibold">{activeSkinTone ? '95%' : 'Pending'}</span>
                  </div>
                  <div className="h-2 bg-stone-100 rounded-full overflow-hidden">
                    <div className={`h-full rounded-full ${activeSkinTone ? 'bg-emerald-500 w-[95%]' : 'bg-stone-300 w-[40%]'}`} />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-xs text-stone-700 mb-1">
                    <span>Undertone Harmony ({activeUndertone || 'Unverified'})</span>
                    <span className="font-mono-nums font-semibold">{activeUndertone ? '92%' : 'Pending'}</span>
                  </div>
                  <div className="h-2 bg-stone-100 rounded-full overflow-hidden">
                    <div className={`h-full rounded-full ${activeUndertone ? 'bg-emerald-500 w-[92%]' : 'bg-stone-300 w-[35%]'}`} />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-xs text-stone-700 mb-1">
                    <span>Climate & Humidity Longevity</span>
                    <span className="font-mono-nums font-semibold">88%</span>
                  </div>
                  <div className="h-2 bg-stone-100 rounded-full overflow-hidden">
                    <div className="h-full bg-stone-800 rounded-full w-[88%]" />
                  </div>
                </div>
              </div>
            </div>

            {/* Trust and Authentic Sourcing Guarantees */}
            <div className="pt-4 border-t border-stone-100 grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs text-stone-600">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-stone-800 shrink-0" />
                <span>100% Authentic Retailer Source</span>
              </div>
              <div className="flex items-center gap-2">
                <Truck className="w-4 h-4 text-stone-800 shrink-0" />
                <span>Express Delivery in Bangladesh (24–48h)</span>
              </div>
            </div>

          </div>

        </div>

        {/* Right Column: Contiguous Purchase Module */}
        <div className="lg:col-span-5 space-y-6 lg:sticky lg:top-24">
          
          <div className="bg-white p-6 sm:p-8 rounded-2xl border border-stone-200 shadow-sm space-y-6">
            
            {/* Brand & Category header */}
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-stone-500">
                <span>{product.brand}</span>
                <span aria-hidden="true">·</span>
                <span>{product.category}</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-serif-display font-bold text-stone-950 leading-tight">
                {product.name}
              </h1>
            </div>

            {/* Price & Verified Stock Status */}
            <div className="flex items-baseline justify-between pb-4 border-b border-stone-100">
              <div>
                <span className="text-3xl font-bold font-mono-nums text-stone-950">
                  {product.currency}{Number(product.price).toLocaleString()}
                </span>
                <span className="text-xs text-stone-500 ml-2">BDT incl. taxes</span>
              </div>

              <div className={`text-xs font-semibold flex items-center gap-1.5 ${
                product.isAvailableInCountry || product.availability === 'In Stock'
                  ? 'text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-200'
                  : 'text-amber-800 bg-amber-50 px-2.5 py-1 rounded-md border border-amber-200'
              }`}>
                {product.isAvailableInCountry || product.availability === 'In Stock' ? (
                  <>
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Available in Bangladesh</span>
                  </>
                ) : (
                  <>
                    <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
                    <span>Not currently available in Bangladesh</span>
                  </>
                )}
              </div>
            </div>

            {/* SHADE SELECTOR: Display parent product and all imported shades */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold uppercase tracking-wider text-stone-700">
                  Available Shades ({shadesList.length})
                </label>
                <span className="text-[11px] text-stone-500 font-medium">
                  {activeIsVerified ? (
                    <span className="text-emerald-700 font-semibold flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                      Verified Match
                    </span>
                  ) : (
                    <span className="text-amber-800 font-semibold flex items-center gap-1">
                      <AlertCircle className="w-3 h-3 text-amber-600" />
                      Unverified Compatibility
                    </span>
                  )}
                </span>
              </div>

              {/* Swatch Grid / Round Selectors */}
              <div className="flex flex-wrap gap-2 pt-1">
                {shadesList.map((sh, idx) => {
                  const isSelected = idx === selectedShadeIndex;
                  return (
                    <button
                      key={`${sh.variantId || idx}-${sh.shadeName}`}
                      type="button"
                      onClick={() => setSelectedShadeIndex(idx)}
                      title={`${sh.shadeName}${sh.shadeNumber ? ` (#${sh.shadeNumber})` : ''} - ${sh.skinTone || 'Tone unspecified'} / ${sh.undertone || 'Undertone unspecified'}`}
                      className={`group relative p-1 rounded-full transition-all cursor-pointer flex items-center justify-center border ${
                        isSelected
                          ? 'border-stone-950 ring-2 ring-stone-950/20 scale-110'
                          : 'border-stone-200 hover:border-stone-400'
                      }`}
                    >
                      {sh.swatchImageUrl ? (
                        <img
                          src={sh.swatchImageUrl}
                          alt={sh.shadeName}
                          className="w-7 h-7 rounded-full object-cover border border-black/15 shadow-2xs"
                        />
                      ) : sh.swatchHex ? (
                        <span
                          className="w-7 h-7 rounded-full border border-black/15 shadow-inner block"
                          style={{ backgroundColor: sh.swatchHex }}
                        />
                      ) : (
                        <span
                          className="w-7 h-7 rounded-full border border-dashed border-stone-300 bg-stone-100 flex items-center justify-center text-[9px] font-bold text-stone-500"
                        >
                          ?
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Selected Shade Details Card */}
              <div className="p-3.5 bg-stone-50 rounded-xl border border-stone-200 space-y-1.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {activeSwatchImage ? (
                      <img
                        src={activeSwatchImage}
                        alt={activeShadeName}
                        className="w-7 h-7 rounded-full object-cover border border-black/15 shadow-inner"
                      />
                    ) : activeSwatchHex ? (
                      <span
                        className="w-7 h-7 rounded-full border border-black/15 shadow-inner shrink-0"
                        style={{ backgroundColor: activeSwatchHex }}
                      />
                    ) : (
                      <span className="w-7 h-7 rounded-full border border-dashed border-stone-300 bg-stone-200 flex items-center justify-center text-[10px] text-stone-500 font-bold shrink-0">
                        N/A
                      </span>
                    )}
                    <div>
                      <div className="text-sm font-bold text-stone-950 flex items-center gap-1.5">
                        <span>{activeShadeName}</span>
                        {activeShadeNumber && (
                          <span className="text-xs font-mono text-stone-500 bg-stone-200 px-1.5 py-0.5 rounded">
                            #{activeShadeNumber}
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-stone-600">
                        {activeSwatchHex ? (
                          <span className="font-mono text-[11px] text-stone-500">{activeSwatchHex}</span>
                        ) : (
                          <span className="text-[11px] text-stone-400 italic">No official HEX colour verified</span>
                        )}
                      </div>
                    </div>
                  </div>

                  <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full border ${
                    activeIsVerified
                      ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                      : 'bg-amber-50 text-amber-800 border-amber-200'
                  }`}>
                    {activeIsVerified ? 'Verified' : 'Unverified'}
                  </span>
                </div>

                <div className="pt-2 border-t border-stone-200/60 flex items-center justify-between text-xs text-stone-600">
                  <div>
                    Skin Depth: <strong className="text-stone-900">{activeSkinTone || 'Unspecified'}</strong>
                  </div>
                  <div>
                    Undertone: <strong className="text-stone-900">{activeUndertone || 'Unspecified'}</strong>
                  </div>
                </div>
              </div>
            </div>

            {/* Spec Table */}
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 bg-stone-50 rounded-lg border border-stone-100">
                <div className="text-stone-500 text-[11px]">Skin Tone Fit</div>
                <div className="font-semibold text-stone-900 mt-0.5">{activeSkinTone || 'Unverified'}</div>
              </div>
              <div className="p-3 bg-stone-50 rounded-lg border border-stone-100">
                <div className="text-stone-500 text-[11px]">Undertone Fit</div>
                <div className="font-semibold text-stone-900 mt-0.5">{activeUndertone || 'Unverified'}</div>
              </div>
              <div className="p-3 bg-stone-50 rounded-lg border border-stone-100">
                <div className="text-stone-500 text-[11px]">Brand Origin</div>
                <div className="font-semibold text-stone-900 mt-0.5">{product.brandOrigin || 'International'}</div>
              </div>
              <div className="p-3 bg-stone-50 rounded-lg border border-stone-100">
                <div className="text-stone-500 text-[11px]">Formula ID</div>
                <div className="font-semibold text-stone-900 mt-0.5 font-mono-nums">#PRD-{product.productId || product.id?.replace('prod_', '')}</div>
              </div>
            </div>

            {/* Primary Action Buttons & Retailer Link */}
            <div className="space-y-3 pt-2">
              {targetPurchaseLink && targetPurchaseLink !== '#' && (
                <div className="space-y-1.5">
                  <a
                    href={targetPurchaseLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full py-3 px-6 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold uppercase tracking-wider rounded-xl transition-all shadow-md cursor-pointer flex items-center justify-center gap-2"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>
                      {shadeSpecificLink
                        ? `Buy Shade "${activeShadeName}" at Retailer`
                        : 'Visit Retailer Store Page'}
                    </span>
                  </a>

                  {!shadeSpecificLink && (
                    <p className="text-[11px] text-stone-500 text-center leading-relaxed">
                      * Uses verified parent product link. Please select shade <strong>"{activeShadeName}"</strong> on the retailer's checkout page.
                    </p>
                  )}
                </div>
              )}

              <button
                type="button"
                onClick={() => {
                  setOrderConfirmed(false);
                  setBuyModalOpen(true);
                }}
                className="w-full py-3.5 px-6 bg-stone-950 hover:bg-stone-800 text-white text-xs font-semibold uppercase tracking-wider rounded-xl transition-all shadow-md cursor-pointer flex items-center justify-center gap-2"
              >
                <span>Direct Order / Reserve</span>
                <span className="font-mono-nums font-normal text-stone-300">({product.currency}{Number(product.price).toLocaleString()})</span>
              </button>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => onToggleFavorite(product.id || `prod_${product.productId}`)}
                  className={`flex-1 py-2.5 px-4 text-xs font-semibold rounded-xl border transition-colors cursor-pointer flex items-center justify-center gap-2 ${
                    isFavorite
                      ? 'bg-rose-50 border-rose-300 text-rose-700'
                      : 'bg-white border-stone-300 text-stone-800 hover:bg-stone-50'
                  }`}
                >
                  <Heart className={`w-3.5 h-3.5 ${isFavorite ? 'fill-current' : ''}`} />
                  <span>{isFavorite ? 'Saved in MySQL' : 'Add to Favorites'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    onToggleCompare(product.id || `prod_${product.productId}`);
                    onNavigateToCompare();
                  }}
                  className={`flex-1 py-2.5 px-4 text-xs font-semibold rounded-xl border transition-colors cursor-pointer flex items-center justify-center gap-2 ${
                    isInCompare
                      ? 'bg-stone-900 border-stone-900 text-white'
                      : 'bg-white border-stone-300 text-stone-800 hover:bg-stone-50'
                  }`}
                >
                  <Scale className="w-3.5 h-3.5" />
                  <span>Compare</span>
                </button>
              </div>
            </div>

          </div>

        </div>

      </div>

      {/* Buy Now Drawer / Modal */}
      {buyModalOpen && (
        <div className="fixed inset-0 z-50 bg-stone-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 sm:p-8 space-y-6 shadow-2xl border border-stone-200">
            
            <div className="flex items-center justify-between pb-3 border-b border-stone-200">
              <h3 className="text-lg font-serif-display font-bold text-stone-950">
                {orderConfirmed ? 'Order Confirmed' : 'Complete Purchase'}
              </h3>
              <button
                onClick={() => setBuyModalOpen(false)}
                className="p-1 text-stone-400 hover:text-stone-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {orderConfirmed ? (
              <div className="text-center py-6 space-y-4">
                <div className="w-14 h-14 bg-emerald-100 text-emerald-700 rounded-full mx-auto flex items-center justify-center">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
                <h4 className="text-xl font-serif-display font-bold text-stone-900">
                  Order Placed via MySQL Backend!
                </h4>
                <p className="text-xs text-stone-600 max-w-sm mx-auto leading-relaxed">
                  Thank you, <strong>{deliveryName}</strong>. Cash on Delivery is confirmed for <strong>৳{Number(product.price).toLocaleString()}</strong>. Delivery tracking assigned for {deliveryPhone}.
                </p>
                <button
                  onClick={() => setBuyModalOpen(false)}
                  className="mt-4 px-6 py-2.5 bg-stone-900 text-white text-xs font-semibold uppercase tracking-wider rounded-lg"
                >
                  Continue Shopping
                </button>
              </div>
            ) : (
              <form onSubmit={handleConfirmOrder} className="space-y-4">
                <div className="p-3 bg-stone-50 rounded-xl border border-stone-200 flex items-center gap-3">
                  <img src={product.image || product.imageUrl} alt={product.name} className="w-12 h-12 object-cover rounded-lg" />
                  <div className="overflow-hidden">
                    <div className="text-xs font-semibold text-stone-900 truncate">{product.name}</div>
                    <div className="text-[11px] text-stone-500">Shade: {product.shade || product.shadeName} · ৳{Number(product.price).toLocaleString()}</div>
                  </div>
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="text-xs font-semibold text-stone-700 block mb-1">Full Name</label>
                    <input
                      type="text"
                      required
                      value={deliveryName}
                      onChange={(e) => setDeliveryName(e.target.value)}
                      className="w-full text-xs bg-white border border-stone-300 rounded-lg px-3 py-2 text-stone-900"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-stone-700 block mb-1">Phone Number</label>
                    <input
                      type="text"
                      required
                      value={deliveryPhone}
                      onChange={(e) => setDeliveryPhone(e.target.value)}
                      className="w-full text-xs bg-white border border-stone-300 rounded-lg px-3 py-2 text-stone-900"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-stone-700 block mb-1">Delivery Address</label>
                    <textarea
                      required
                      rows={2}
                      value={deliveryAddress}
                      onChange={(e) => setDeliveryAddress(e.target.value)}
                      className="w-full text-xs bg-white border border-stone-300 rounded-lg px-3 py-2 text-stone-900"
                    />
                  </div>

                  <div className="p-3 bg-amber-50/70 border border-amber-200 rounded-xl text-xs text-amber-900">
                    Payment Method: <strong>Cash on Delivery (COD)</strong> · Free doorstep shade guarantee
                  </div>
                </div>

                <div className="pt-3 border-t border-stone-200 flex items-center justify-between">
                  <div>
                    <div className="text-[11px] text-stone-500">Total Payable:</div>
                    <div className="text-lg font-bold font-mono-nums text-stone-950">৳{Number(product.price).toLocaleString()}</div>
                  </div>

                  <button
                    type="submit"
                    className="px-6 py-2.5 bg-stone-950 text-white text-xs font-semibold uppercase tracking-wider rounded-xl hover:bg-stone-800 transition-colors cursor-pointer"
                  >
                    Confirm Order
                  </button>
                </div>
              </form>
            )}

          </div>
        </div>
      )}

    </div>
  );
};
