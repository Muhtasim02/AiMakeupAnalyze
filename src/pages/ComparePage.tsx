import React from 'react';
import { Scale, X, Plus, ArrowRight, CheckCircle2 } from 'lucide-react';
import { Product } from '../types';
import { ProductImage } from '../components/ProductImage';

interface ComparePageProps {
  products: Product[];
  compareIds: string[];
  onRemoveFromCompare: (id: string) => void;
  onSelectProduct: (id: string) => void;
  onNavigate: (page: string) => void;
  onAddCompareId: (id: string) => void;
}

export const ComparePage: React.FC<ComparePageProps> = ({
  products,
  compareIds,
  onRemoveFromCompare,
  onSelectProduct,
  onNavigate,
  onAddCompareId,
}) => {
  const compareProducts = products.filter((p) => compareIds.includes(p.id));
  const availableToAdd = products.filter((p) => !compareIds.includes(p.id));

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between pb-6 border-b border-stone-200 gap-4">
        <div>
          <div className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-stone-500 mb-1">
            <Scale className="w-3.5 h-3.5 text-stone-700" />
            <span>Side-by-Side Formula Analysis</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-serif-display font-bold text-stone-950">
            Compare Makeup Products
          </h1>
          <p className="text-sm text-stone-600 mt-1">
            Evaluate brand formulations, shades, undertones, and pricing simultaneously.
          </p>
        </div>

        <div className="text-xs text-stone-500 font-mono-nums">
          <strong className="text-stone-900 font-semibold">{compareProducts.length}</strong> / 3 products selected
        </div>
      </div>

      {compareProducts.length === 0 ? (
        <div className="bg-white rounded-2xl border border-stone-200 p-16 text-center space-y-4 max-w-lg mx-auto">
          <div className="w-14 h-14 rounded-full bg-stone-100 text-stone-600 flex items-center justify-center mx-auto">
            <Scale className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-serif-display font-bold text-stone-900">
            No products to compare
          </h3>
          <p className="text-xs text-stone-500 max-w-sm mx-auto leading-relaxed">
            Click the balance/compare icon on any product cards to view 2 to 3 products side-by-side.
          </p>
          <button
            onClick={() => onNavigate('products')}
            className="mt-2 inline-flex items-center gap-2 px-5 py-2.5 text-xs font-semibold uppercase tracking-wider text-white bg-stone-950 hover:bg-stone-800 rounded-xl transition-all cursor-pointer"
          >
            <span>Browse Products</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          
          {/* Responsive Comparison Table / Grid */}
          <div className="bg-white rounded-2xl border border-stone-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-stone-200 bg-stone-50/80">
                    <th className="p-4 sm:p-6 text-xs font-semibold uppercase tracking-wider text-stone-500 w-44">
                      Specification
                    </th>
                    {compareProducts.map((product) => (
                      <th key={product.id} className="p-4 sm:p-6 min-w-[240px] align-top">
                        <div className="space-y-3">
                          <div className="relative aspect-[4/3] rounded-xl overflow-hidden bg-stone-100 border border-stone-200">
                            <ProductImage
                              src={product.image || product.imageUrl}
                              alt={product.name}
                              category={product.category}
                              shadeHex={product.shadeHex}
                              shadeName={product.shade}
                              isVerified={product.isVerified ?? Boolean(product.barcode || product.sourceUrl)}
                              className="w-full h-full object-cover"
                            />
                            <button
                              onClick={() => onRemoveFromCompare(product.id)}
                              className="absolute top-2 right-2 p-1.5 bg-stone-900/80 hover:bg-stone-900 text-white rounded-full transition-colors cursor-pointer z-10"
                              title="Remove from comparison"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                          <div>
                            <div className="text-xs text-stone-500 uppercase font-medium">{product.brand}</div>
                            <div
                              onClick={() => onSelectProduct(product.id)}
                              className="text-sm font-semibold text-stone-900 hover:text-stone-600 cursor-pointer line-clamp-2 mt-0.5"
                            >
                              {product.name}
                            </div>
                          </div>
                        </div>
                      </th>
                    ))}
                    {compareProducts.length < 3 && (
                      <th className="p-4 sm:p-6 min-w-[200px] align-middle text-center bg-stone-50/40 border-l border-dashed border-stone-200">
                        <div className="space-y-3">
                          <div className="w-12 h-12 rounded-xl border border-dashed border-stone-300 mx-auto flex items-center justify-center text-stone-400">
                            <Plus className="w-5 h-5" />
                          </div>
                          <div className="text-xs text-stone-500">
                            Add 3rd product to compare
                          </div>
                        </div>
                      </th>
                    )}
                  </tr>
                </thead>

                <tbody className="divide-y divide-stone-100 text-xs">
                  
                  {/* Match Score */}
                  <tr className="hover:bg-stone-50/50">
                    <td className="p-4 sm:p-6 font-semibold text-stone-900 bg-stone-50/40">
                      Match Score
                    </td>
                    {compareProducts.map((p) => (
                      <td key={p.id} className="p-4 sm:p-6">
                        <span className="inline-flex items-center gap-1.5 font-bold font-mono-nums text-sm text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-200">
                          {p.matchPercentage}% Compatible
                        </span>
                      </td>
                    ))}
                    {compareProducts.length < 3 && <td className="bg-stone-50/20" />}
                  </tr>

                  {/* Brand */}
                  <tr className="hover:bg-stone-50/50">
                    <td className="p-4 sm:p-6 font-semibold text-stone-900 bg-stone-50/40">
                      Brand
                    </td>
                    {compareProducts.map((p) => (
                      <td key={p.id} className="p-4 sm:p-6 font-medium text-stone-800">
                        {p.brand}
                      </td>
                    ))}
                    {compareProducts.length < 3 && <td className="bg-stone-50/20" />}
                  </tr>

                  {/* Category */}
                  <tr className="hover:bg-stone-50/50">
                    <td className="p-4 sm:p-6 font-semibold text-stone-900 bg-stone-50/40">
                      Category
                    </td>
                    {compareProducts.map((p) => (
                      <td key={p.id} className="p-4 sm:p-6 text-stone-700">
                        {p.category}
                      </td>
                    ))}
                    {compareProducts.length < 3 && <td className="bg-stone-50/20" />}
                  </tr>

                  {/* Price */}
                  <tr className="hover:bg-stone-50/50">
                    <td className="p-4 sm:p-6 font-semibold text-stone-900 bg-stone-50/40">
                      Price
                    </td>
                    {compareProducts.map((p) => (
                      <td key={p.id} className="p-4 sm:p-6 font-mono-nums font-bold text-stone-950 text-sm">
                        {p.currency}{p.price.toLocaleString()}
                      </td>
                    ))}
                    {compareProducts.length < 3 && <td className="bg-stone-50/20" />}
                  </tr>

                  {/* Shade & Swatch */}
                  <tr className="hover:bg-stone-50/50">
                    <td className="p-4 sm:p-6 font-semibold text-stone-900 bg-stone-50/40">
                      Shade
                    </td>
                    {compareProducts.map((p) => (
                      <td key={p.id} className="p-4 sm:p-6">
                        <div className="flex items-center gap-2">
                          <span
                            className="w-4 h-4 rounded-full border border-black/15 shadow-2xs shrink-0"
                            style={{ backgroundColor: p.shadeHex }}
                            aria-hidden="true"
                          />
                          <span className="font-medium text-stone-800">{p.shade}</span>
                        </div>
                      </td>
                    ))}
                    {compareProducts.length < 3 && <td className="bg-stone-50/20" />}
                  </tr>

                  {/* Skin Tone */}
                  <tr className="hover:bg-stone-50/50">
                    <td className="p-4 sm:p-6 font-semibold text-stone-900 bg-stone-50/40">
                      Skin Tone
                    </td>
                    {compareProducts.map((p) => (
                      <td key={p.id} className="p-4 sm:p-6 text-stone-700">
                        {p.skinTone}
                      </td>
                    ))}
                    {compareProducts.length < 3 && <td className="bg-stone-50/20" />}
                  </tr>

                  {/* Undertone */}
                  <tr className="hover:bg-stone-50/50">
                    <td className="p-4 sm:p-6 font-semibold text-stone-900 bg-stone-50/40">
                      Undertone
                    </td>
                    {compareProducts.map((p) => (
                      <td key={p.id} className="p-4 sm:p-6 text-stone-700">
                        {p.undertone}
                      </td>
                    ))}
                    {compareProducts.length < 3 && <td className="bg-stone-50/20" />}
                  </tr>

                  {/* Availability */}
                  <tr className="hover:bg-stone-50/50">
                    <td className="p-4 sm:p-6 font-semibold text-stone-900 bg-stone-50/40">
                      Availability
                    </td>
                    {compareProducts.map((p) => (
                      <td key={p.id} className="p-4 sm:p-6">
                        <span className={`font-medium ${
                          p.availability === 'In Stock'
                            ? 'text-emerald-700'
                            : p.availability === 'Low Stock'
                            ? 'text-amber-700'
                            : 'text-stone-400'
                        }`}>
                          {p.availability} ({p.country})
                        </span>
                      </td>
                    ))}
                    {compareProducts.length < 3 && <td className="bg-stone-50/20" />}
                  </tr>

                  {/* Coverage & Finish */}
                  <tr className="hover:bg-stone-50/50">
                    <td className="p-4 sm:p-6 font-semibold text-stone-900 bg-stone-50/40">
                      Coverage / Finish
                    </td>
                    {compareProducts.map((p) => (
                      <td key={p.id} className="p-4 sm:p-6 text-stone-600">
                        {p.coverage} Coverage · {p.finish} Finish
                      </td>
                    ))}
                    {compareProducts.length < 3 && <td className="bg-stone-50/20" />}
                  </tr>

                  {/* Action Row */}
                  <tr>
                    <td className="p-4 sm:p-6 bg-stone-50/40" />
                    {compareProducts.map((p) => (
                      <td key={p.id} className="p-4 sm:p-6">
                        <button
                          onClick={() => onSelectProduct(p.id)}
                          className="w-full py-2.5 px-4 bg-stone-900 hover:bg-stone-800 text-white rounded-lg text-xs font-semibold uppercase tracking-wider transition-colors cursor-pointer text-center"
                        >
                          View Full Details
                        </button>
                      </td>
                    ))}
                    {compareProducts.length < 3 && <td className="bg-stone-50/20" />}
                  </tr>

                </tbody>
              </table>
            </div>
          </div>

          {/* Quick Add Section if fewer than 3 */}
          {compareProducts.length < 3 && availableToAdd.length > 0 && (
            <div className="bg-stone-100/80 rounded-2xl p-6 border border-stone-200 space-y-4">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-stone-700">
                Quick Add More Products to Comparison
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {availableToAdd.slice(0, 3).map((item) => (
                  <div
                    key={item.id}
                    onClick={() => onAddCompareId(item.id)}
                    className="p-3 bg-white rounded-xl border border-stone-200 hover:border-stone-400 transition-all cursor-pointer flex items-center justify-between group"
                  >
                    <div className="flex items-center gap-3 overflow-hidden">
                      <img src={item.image} alt={item.name} className="w-10 h-10 object-cover rounded-md" />
                      <div className="overflow-hidden">
                        <div className="text-xs font-semibold text-stone-900 truncate">{item.name}</div>
                        <div className="text-[11px] text-stone-500 font-mono-nums">৳{item.price.toLocaleString()}</div>
                      </div>
                    </div>
                    <Plus className="w-4 h-4 text-stone-400 group-hover:text-stone-900 shrink-0 ml-2" />
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>
      )}

    </div>
  );
};
