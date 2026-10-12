import React, { useState } from 'react';
import { Plus, Trash2, CheckCircle2, AlertCircle, Palette, Image as ImageIcon, Link as LinkIcon, Camera } from 'lucide-react';

export interface AdminShadeItem {
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

interface ProductShadesManagerProps {
  shades: AdminShadeItem[];
  onChange: (shades: AdminShadeItem[]) => void;
  defaultSkinTone?: string;
  defaultUndertone?: string;
}

const SKIN_TONES = ['Very Fair', 'Fair', 'Light', 'Medium', 'Tan', 'Deep', 'Universal'];
const UNDERTONES = ['Warm', 'Cool', 'Neutral', 'Olive', 'Universal'];

export const ProductShadesManager: React.FC<ProductShadesManagerProps> = ({
  shades,
  onChange,
  defaultSkinTone = 'Medium',
  defaultUndertone = 'Warm',
}) => {
  const [activeTab, setActiveTab] = useState<number>(0);

  const handleAddShade = () => {
    const newShadeNum = shades.length + 1;
    const newShades: AdminShadeItem[] = [
      ...shades,
      {
        shadeName: `Shade ${newShadeNum}`,
        shadeNumber: `${100 + newShadeNum * 10}`,
        swatchHex: '#D2A078',
        swatchImageUrl: '',
        skinTone: defaultSkinTone,
        undertone: defaultUndertone,
        imageUrl: '',
        purchaseLink: '',
        isVerified: false,
      },
    ];
    onChange(newShades);
    setActiveTab(newShades.length - 1);
  };

  const handleRemoveShade = (index: number) => {
    if (shades.length <= 1) {
      return;
    }
    const updated = shades.filter((_, i) => i !== index);
    onChange(updated);
    setActiveTab(Math.max(0, index - 1));
  };

  const handleUpdateField = (index: number, field: keyof AdminShadeItem, value: any) => {
    const updated = [...shades];
    updated[index] = {
      ...updated[index],
      [field]: value,
    };
    onChange(updated);
  };

  const current = shades[activeTab] || shades[0];

  return (
    <div className="space-y-4 pt-3 border-t border-stone-200">
      <div className="flex items-center justify-between">
        <div>
          <label className="font-bold text-stone-900 text-xs flex items-center gap-1.5">
            <Palette className="w-4 h-4 text-amber-700" />
            <span>Product Shades ({shades.length})</span>
          </label>
          <p className="text-[11px] text-stone-500">
            A product can have multiple shades. Configure name, colour HEX, swatch photo, and skin tone compatibility independently for each shade.
          </p>
        </div>
        <button
          type="button"
          onClick={handleAddShade}
          className="px-2.5 py-1.5 bg-stone-900 hover:bg-stone-800 text-white rounded-xl text-xs font-semibold flex items-center gap-1 cursor-pointer shadow-xs"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Add Shade</span>
        </button>
      </div>

      {/* Shade Pills / Selector */}
      <div className="flex flex-wrap gap-1.5 p-2 bg-stone-50 rounded-2xl border border-stone-200/80 max-h-36 overflow-y-auto">
        {shades.map((s, idx) => {
          const isSelected = idx === activeTab;
          return (
            <button
              key={`${idx}-${s.shadeName}`}
              type="button"
              onClick={() => setActiveTab(idx)}
              className={`px-2.5 py-1.5 rounded-xl text-xs font-medium flex items-center gap-2 transition-all cursor-pointer border ${
                isSelected
                  ? 'bg-stone-900 text-white border-stone-900 shadow-xs'
                  : 'bg-white text-stone-700 border-stone-200 hover:border-stone-300'
              }`}
            >
              <span
                className="w-3.5 h-3.5 rounded-full border border-black/20 shrink-0"
                style={{ backgroundColor: s.swatchHex || '#CCCCCC' }}
              />
              <span className="truncate max-w-[110px]">{s.shadeName || `Shade ${idx + 1}`}</span>
              {s.isVerified && (
                <span className={`w-1.5 h-1.5 rounded-full ${isSelected ? 'bg-emerald-400' : 'bg-emerald-600'}`} />
              )}
            </button>
          );
        })}
      </div>

      {/* Active Shade Form Editor */}
      {current && (
        <div className="p-4 bg-stone-50/70 rounded-2xl border border-stone-200 space-y-3.5 animate-fadeIn">
          <div className="flex items-center justify-between pb-2 border-b border-stone-200/70">
            <div className="flex items-center gap-2">
              <span
                className="w-5 h-5 rounded-full border border-black/20 shadow-xs"
                style={{ backgroundColor: current.swatchHex || '#CCCCCC' }}
              />
              <span className="text-xs font-bold text-stone-900">
                Editing Shade #{activeTab + 1}: {current.shadeName}
              </span>
            </div>

            <div className="flex items-center gap-3">
              <label className="flex items-center gap-1.5 text-[11px] text-stone-700 font-medium cursor-pointer">
                <input
                  type="checkbox"
                  checked={current.isVerified}
                  onChange={(e) => handleUpdateField(activeTab, 'isVerified', e.target.checked)}
                  className="rounded text-emerald-600 focus:ring-emerald-500"
                />
                <span>Verified Match</span>
              </label>

              {shades.length > 1 && (
                <button
                  type="button"
                  onClick={() => handleRemoveShade(activeTab)}
                  className="text-stone-400 hover:text-red-600 text-xs flex items-center gap-1 cursor-pointer p-1"
                  title="Remove this shade"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span className="text-[11px]">Remove</span>
                </button>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] font-semibold text-stone-700 block">Shade Name *</label>
              <input
                type="text"
                required
                value={current.shadeName}
                onChange={(e) => handleUpdateField(activeTab, 'shadeName', e.target.value)}
                placeholder="e.g. 220 Natural Beige"
                className="w-full mt-1 border border-stone-300 rounded-xl px-2.5 py-1.5 text-xs bg-white text-stone-900 focus:outline-none focus:ring-1 focus:ring-stone-900"
              />
            </div>

            <div>
              <label className="text-[11px] font-semibold text-stone-700 block">Shade Code / Number</label>
              <input
                type="text"
                value={current.shadeNumber || ''}
                onChange={(e) => handleUpdateField(activeTab, 'shadeNumber', e.target.value)}
                placeholder="e.g. 220 or 4N"
                className="w-full mt-1 border border-stone-300 rounded-xl px-2.5 py-1.5 text-xs bg-white text-stone-900 focus:outline-none focus:ring-1 focus:ring-stone-900"
              />
            </div>
          </div>

          {/* Color Picker & Manual HEX Input */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] font-semibold text-stone-700 block">
                Colour HEX (Manual Code or Picker)
              </label>
              <div className="flex items-center gap-2 mt-1">
                <input
                  type="color"
                  value={current.swatchHex && /^#[0-9A-Fa-f]{6}$/.test(current.swatchHex) ? current.swatchHex : '#D2A078'}
                  onChange={(e) => handleUpdateField(activeTab, 'swatchHex', e.target.value)}
                  className="w-9 h-8 p-0.5 rounded-lg border border-stone-300 cursor-pointer bg-white"
                />
                <input
                  type="text"
                  value={current.swatchHex || ''}
                  onChange={(e) => handleUpdateField(activeTab, 'swatchHex', e.target.value)}
                  placeholder="#D2A078 (optional or unverified)"
                  className="flex-1 border border-stone-300 rounded-xl px-2.5 py-1.5 text-xs bg-white font-mono text-stone-900 focus:outline-none focus:ring-1 focus:ring-stone-900"
                />
              </div>
            </div>

            <div>
              <label className="text-[11px] font-semibold text-stone-700 block">
                Swatch Image URL (Optional)
              </label>
              <div className="relative mt-1">
                <ImageIcon className="w-3.5 h-3.5 text-stone-400 absolute left-2.5 top-2 pointer-events-none" />
                <input
                  type="url"
                  value={current.swatchImageUrl || ''}
                  onChange={(e) => handleUpdateField(activeTab, 'swatchImageUrl', e.target.value)}
                  placeholder="https://.../swatch.jpg"
                  className="w-full pl-8 pr-2.5 py-1.5 border border-stone-300 rounded-xl text-xs bg-white text-stone-900 focus:outline-none focus:ring-1 focus:ring-stone-900"
                />
              </div>
            </div>
          </div>

          {/* Independent Compatibility Settings for THIS shade */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-2.5 bg-white rounded-xl border border-stone-200/80">
            <div>
              <label className="text-[11px] font-semibold text-stone-700 block">
                Compatible Skin Tone
              </label>
              <select
                value={current.skinTone}
                onChange={(e) => handleUpdateField(activeTab, 'skinTone', e.target.value)}
                className="w-full mt-1 border border-stone-300 rounded-xl px-2 py-1.5 text-xs bg-white text-stone-900 focus:outline-none"
              >
                {SKIN_TONES.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-[11px] font-semibold text-stone-700 block">
                Compatible Undertone
              </label>
              <select
                value={current.undertone}
                onChange={(e) => handleUpdateField(activeTab, 'undertone', e.target.value)}
                className="w-full mt-1 border border-stone-300 rounded-xl px-2 py-1.5 text-xs bg-white text-stone-900 focus:outline-none"
              >
                {UNDERTONES.map((u) => (
                  <option key={u} value={u}>{u}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Shade-specific URL & Image */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] font-semibold text-stone-700 block">
                Shade-Specific Purchase Link (If available)
              </label>
              <div className="relative mt-1">
                <LinkIcon className="w-3.5 h-3.5 text-stone-400 absolute left-2.5 top-2 pointer-events-none" />
                <input
                  type="url"
                  value={current.purchaseLink || ''}
                  onChange={(e) => handleUpdateField(activeTab, 'purchaseLink', e.target.value)}
                  placeholder="https://retailer.com/shade-220 (optional)"
                  className="w-full pl-8 pr-2.5 py-1.5 border border-stone-300 rounded-xl text-xs bg-white text-stone-900 focus:outline-none focus:ring-1 focus:ring-stone-900"
                />
              </div>
            </div>

            <div>
              <label className="text-[11px] font-semibold text-stone-700 block">
                Shade Product Photo URL (Optional)
              </label>
              <div className="relative mt-1">
                <Camera className="w-3.5 h-3.5 text-stone-400 absolute left-2.5 top-2 pointer-events-none" />
                <input
                  type="url"
                  value={current.imageUrl || ''}
                  onChange={(e) => handleUpdateField(activeTab, 'imageUrl', e.target.value)}
                  placeholder="https://.../shade-bottle.jpg (optional)"
                  className="w-full pl-8 pr-2.5 py-1.5 border border-stone-300 rounded-xl text-xs bg-white text-stone-900 focus:outline-none focus:ring-1 focus:ring-stone-900"
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
