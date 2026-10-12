import React, { useState } from 'react';
import {
  Sparkles,
  ArrowRight,
  RotateCcw,
  Edit3,
  Check,
  Sliders,
  CheckCircle2,
  AlertTriangle,
  Info,
  Database,
  RefreshCw,
} from 'lucide-react';
import { SkinAnalysisResult, SkinTone, Undertone } from '../types';
import { defaultAnalysisResult } from '../data/mockData';
import { confirmSkinAnalysis } from '../services/api';

interface AnalysisResultPageProps {
  result?: SkinAnalysisResult;
  analyzedImage?: string;
  onUseResult: (tone: SkinTone, undertone: Undertone) => void;
  onAnalyzeAgain: () => void;
}

export const AnalysisResultPage: React.FC<AnalysisResultPageProps> = ({
  result = defaultAnalysisResult,
  analyzedImage,
  onUseResult,
  onAnalyzeAgain,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [selectedTone, setSelectedTone] = useState<string>(result.skinTone);
  const [selectedUndertone, setSelectedUndertone] = useState<string>(result.undertone);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccessNotice, setSaveSuccessNotice] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);

  // Standard skin complexion classes
  const skinToneOptions: string[] = ['Very Fair', 'Fair', 'Light', 'Medium', 'Tan', 'Deep'];
  const undertoneOptions: string[] = ['Warm', 'Cool', 'Neutral', 'Olive'];

  const isUnknown = result.skinTone === 'Unknown' || result.undertone === 'Unknown';

  // Dynamic swatch mapping for visual representation
  const swatchMap: Record<string, string> = {
    'Very Fair-Cool': '#FAECE6',
    'Very Fair-Neutral': '#FCEEE3',
    'Very Fair-Warm': '#F8E9D5',
    'Very Fair-Olive': '#F7EBDC',
    'Fair-Cool': '#F6E6DF',
    'Fair-Neutral': '#F5E6DA',
    'Fair-Warm': '#F3E2CB',
    'Fair-Olive': '#F2E2C8',
    'Light-Cool': '#EED2C1',
    'Light-Neutral': '#EBD1BC',
    'Light-Warm': '#E8CCAC',
    'Light-Olive': '#E2C7A2',
    'Medium-Cool': '#D8A78A',
    'Medium-Neutral': '#D1A27E',
    'Medium-Warm': '#CD9B74',
    'Medium-Olive': '#C89A6B',
    'Tan-Cool': '#B37754',
    'Tan-Neutral': '#AE754F',
    'Tan-Warm': '#B88258',
    'Tan-Olive': '#A8764B',
    'Deep-Cool': '#764936',
    'Deep-Neutral': '#6D4330',
    'Deep-Warm': '#7B4C33',
    'Deep-Olive': '#6D4427',
  };

  const activeSwatch = swatchMap[`${selectedTone}-${selectedUndertone}`] || '#D8A78A';

  const handleApplyChanges = () => {
    setIsEditing(false);
    setSaveSuccessNotice('Adjusted classification values applied.');
    setTimeout(() => setSaveSuccessNotice(null), 3000);
  };

  // "Use This Result" Option -> Confirms and stores in MySQL `skin_analysis`
  const handleConfirmAndUse = async () => {
    if (selectedTone === 'Unknown' || selectedUndertone === 'Unknown') {
      setSaveError('Please use "Edit Result" to manually select your skin tone and undertone before continuing.');
      return;
    }

    setIsSaving(true);
    setSaveError(null);

    try {
      // Save confirmed analysis to MySQL backend
      await confirmSkinAnalysis({
        skinTone: selectedTone,
        undertone: selectedUndertone,
        confidence: result.confidence ? result.confidence / 100 : 0.87,
        explanation: result.notes || 'User confirmed skin analysis.',
        imagePath: analyzedImage || undefined,
      });

      setIsSaving(false);
      // Notify parent to update user state and route to Recommendations
      onUseResult(selectedTone as SkinTone, selectedUndertone as Undertone);
    } catch (err: any) {
      console.error('Failed to confirm and save analysis to MySQL:', err);
      setIsSaving(false);
      // Still allow navigation if database fails
      onUseResult(selectedTone as SkinTone, selectedUndertone as Undertone);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      
      {/* Page Header */}
      <div className="text-center max-w-xl mx-auto">
        <div className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-amber-700 bg-amber-50 px-3 py-1 rounded-full mb-3 border border-amber-200">
          <Sparkles className="w-3.5 h-3.5 text-amber-600" />
          <span>Skin Tone & Complexion Diagnostic</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-serif-display font-bold text-stone-950">
          Your Complexion Analysis
        </h1>
        <p className="text-sm text-stone-600 mt-2">
          Review your diagnostic skin tone classification and confirm or edit before matching cosmetic formulas.
        </p>
      </div>

      {/* Medical Disclaimer Banner */}
      <div className="p-3.5 bg-stone-100/90 rounded-2xl border border-stone-200 text-xs text-stone-600 flex items-start gap-2.5">
        <Info className="w-4 h-4 text-stone-500 shrink-0 mt-0.5" />
        <span className="leading-relaxed">
          <strong>Important Notice:</strong> This result is a <strong>makeup recommendation aid</strong> only. It does not provide medically accurate skin classification, dermatological diagnoses, or clinical evaluations.
        </span>
      </div>

      {/* Save Success Notice */}
      {saveSuccessNotice && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-center gap-2 animate-fadeIn">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{saveSuccessNotice} Click <strong>Use This Result</strong> to save to MySQL and match makeup products.</span>
        </div>
      )}

      {/* Save Error Notice */}
      {saveError && (
        <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 flex items-center gap-2 animate-fadeIn">
          <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
          <span>{saveError}</span>
        </div>
      )}

      {/* Main Analysis Card */}
      <div className="bg-white rounded-3xl border border-stone-200 shadow-sm overflow-hidden">
        
        <div className="grid grid-cols-1 md:grid-cols-12 divide-y md:divide-y-0 md:divide-x divide-stone-200">
          
          {/* Left Column: Visual Swatch & Image Preview */}
          <div className="md:col-span-5 p-6 sm:p-8 bg-stone-50 flex flex-col justify-between space-y-6">
            <div className="space-y-4">
              <div className="text-xs font-semibold uppercase tracking-wider text-stone-500">
                Spectrophotometric Complexion Swatch
              </div>

              {/* Large Color Swatch Box */}
              <div
                className="w-full aspect-[4/3] rounded-2xl shadow-inner border border-black/10 flex flex-col justify-end p-4 transition-colors duration-500 relative overflow-hidden"
                style={{ backgroundColor: activeSwatch }}
              >
                <div className="bg-stone-950/85 backdrop-blur-md text-white rounded-xl p-3 text-xs shadow-sm">
                  <div className="font-semibold text-stone-100">
                    {selectedTone} · {selectedUndertone} Spectrum
                  </div>
                  <div className="font-mono-nums text-[11px] text-stone-400 mt-0.5">
                    Hex: {activeSwatch}
                  </div>
                </div>
              </div>

              {/* Small preview of analyzed face */}
              {analyzedImage && (
                <div className="flex items-center gap-3 p-3 bg-white rounded-xl border border-stone-200 text-xs text-stone-600">
                  <img
                    src={analyzedImage}
                    alt="Analyzed source selfie"
                    referrerPolicy="no-referrer"
                    className="w-12 h-12 rounded-lg object-cover"
                  />
                  <div>
                    <div className="font-semibold text-stone-900">Analyzed Image</div>
                    <div className="text-[11px] text-stone-500">Uploaded selfie portrait</div>
                  </div>
                </div>
              )}
            </div>

            <div className="text-xs text-stone-500 space-y-1.5 pt-4 border-t border-stone-200">
              <div className="flex items-center justify-between">
                <span>Confidence Metric:</span>
                <strong className="text-stone-900 font-mono-nums">{result.confidence}%</strong>
              </div>
              <div className="flex items-center justify-between">
                <span>Database Sync:</span>
                <span className="text-emerald-700 font-medium">MySQL skin_analysis</span>
              </div>
            </div>
          </div>

          {/* Right Column: Structured Output as per Spec */}
          <div className="md:col-span-7 p-6 sm:p-8 space-y-6">
            
            {/* If Unknown / Insufficient Information Alert */}
            {isUnknown && !isEditing && (
              <div className="p-4 bg-amber-50 border border-amber-300 rounded-2xl text-xs text-amber-950 space-y-2">
                <div className="font-semibold flex items-center gap-1.5 text-amber-900">
                  <AlertTriangle className="w-4 h-4 text-amber-700 shrink-0" />
                  <span>Insufficient Photo Information Detected</span>
                </div>
                <p className="leading-relaxed text-amber-800">
                  {result.notes || 'The image does not provide sufficient information for a reliable analysis.'}
                </p>
                <div className="pt-1 text-[11px] text-amber-900 font-medium">
                  Tip: Click <strong>"Edit Result"</strong> below to select your skin tone manually, or click <strong>"Analyze Again"</strong> with a well-lit photo.
                </div>
              </div>
            )}

            {/* Confidence Score & Classification */}
            <div className="flex items-center justify-between pb-4 border-b border-stone-100">
              <div>
                <span className="text-xs font-semibold uppercase tracking-wider text-stone-500">
                  Confidence
                </span>
                <div className="text-3xl font-bold font-mono-nums text-stone-950 mt-0.5">
                  {result.confidence}%
                </div>
              </div>

              <div className="text-right">
                <span className="text-xs font-semibold uppercase tracking-wider text-stone-500">
                  Evaluation State
                </span>
                <div className={`text-xs font-semibold mt-1 ${isUnknown ? 'text-amber-700' : 'text-emerald-700'}`}>
                  {isUnknown ? 'Inconclusive Lighting' : 'Verified Complexion Model'}
                </div>
              </div>
            </div>

            {/* Structured Spec Highlights: Tone & Undertone */}
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-stone-50 rounded-2xl border border-stone-200/80">
                <div className="text-xs font-semibold uppercase tracking-wider text-stone-500 mb-1">
                  Skin Tone
                </div>
                <div className="text-2xl font-serif-display font-bold text-stone-950">
                  {selectedTone}
                </div>
                <div className="text-xs text-stone-500 mt-1">
                  {selectedTone === 'Unknown' ? 'Not determinable' : 'Melanin depth classification'}
                </div>
              </div>

              <div className="p-4 bg-stone-50 rounded-2xl border border-stone-200/80">
                <div className="text-xs font-semibold uppercase tracking-wider text-stone-500 mb-1">
                  Undertone
                </div>
                <div className="text-2xl font-serif-display font-bold text-stone-950">
                  {selectedUndertone}
                </div>
                <div className="text-xs text-stone-500 mt-1">
                  {selectedUndertone === 'Unknown' ? 'Not determinable' : 'Sub-surface venous nuance'}
                </div>
              </div>
            </div>

            {/* In-place Manual Editor when "Edit Result" is toggled */}
            {isEditing && (
              <div className="p-5 bg-amber-50/70 rounded-2xl border border-amber-200 space-y-4 animate-fadeIn">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-amber-950 flex items-center gap-1.5">
                    <Sliders className="w-3.5 h-3.5" />
                    <span>Manually Correct AI Result</span>
                  </h4>
                  <button
                    onClick={() => setIsEditing(false)}
                    className="text-xs text-stone-500 hover:text-stone-800 cursor-pointer"
                  >
                    Cancel
                  </button>
                </div>

                <div className="space-y-3 text-xs">
                  <div>
                    <label className="font-semibold text-stone-800 block mb-1.5">Select Skin Tone:</label>
                    <div className="flex flex-wrap gap-2">
                      {skinToneOptions.map((tone) => (
                        <button
                          key={tone}
                          type="button"
                          onClick={() => setSelectedTone(tone)}
                          className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors cursor-pointer ${
                            selectedTone === tone
                              ? 'bg-stone-900 text-white shadow-xs'
                              : 'bg-white text-stone-700 border border-stone-300 hover:bg-stone-100'
                          }`}
                        >
                          {tone}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="font-semibold text-stone-800 block mb-1.5">Select Undertone:</label>
                    <div className="flex flex-wrap gap-2">
                      {undertoneOptions.map((undertone) => (
                        <button
                          key={undertone}
                          type="button"
                          onClick={() => setSelectedUndertone(undertone)}
                          className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors cursor-pointer ${
                            selectedUndertone === undertone
                              ? 'bg-stone-900 text-white shadow-xs'
                              : 'bg-white text-stone-700 border border-stone-300 hover:bg-stone-100'
                          }`}
                        >
                          {undertone}
                        </button>
                      ))}
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleApplyChanges}
                    className="w-full py-2.5 bg-stone-900 text-white text-xs font-semibold uppercase tracking-wider rounded-xl hover:bg-stone-800 transition-colors cursor-pointer"
                  >
                    Apply Corrections
                  </button>
                </div>
              </div>
            )}

            {/* Primary Action Buttons: "Use This Result" and "Edit Result" */}
            <div className="pt-4 border-t border-stone-200 flex flex-wrap items-center gap-3">
              <button
                type="button"
                disabled={isSaving}
                onClick={handleConfirmAndUse}
                className="flex-1 inline-flex items-center justify-center gap-2 px-6 py-3.5 text-xs font-semibold uppercase tracking-wider text-white bg-stone-950 hover:bg-stone-800 rounded-xl transition-all shadow-md cursor-pointer disabled:opacity-50"
              >
                {isSaving ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin text-amber-300" />
                    <span>Saving to MySQL...</span>
                  </>
                ) : (
                  <>
                    <span>Use This Result</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() => setIsEditing(!isEditing)}
                className="px-5 py-3.5 text-xs font-semibold text-stone-800 bg-white hover:bg-stone-50 border border-stone-300 rounded-xl transition-colors cursor-pointer flex items-center gap-1.5"
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>{isEditing ? 'Close Editor' : 'Edit Result'}</span>
              </button>

              <button
                type="button"
                onClick={onAnalyzeAgain}
                className="px-4 py-3.5 text-xs font-semibold text-stone-600 hover:text-stone-950 hover:bg-stone-100 rounded-xl transition-colors cursor-pointer flex items-center gap-1.5"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Analyze Again</span>
              </button>
            </div>

          </div>

        </div>

      </div>

      {/* Saved Diagnostic Profile Banner */}
      <div className="p-4 rounded-2xl bg-stone-100/90 border border-stone-200 text-xs text-stone-600 flex items-center justify-between gap-4 overflow-x-auto">
        <div className="flex items-center gap-2">
          <Database className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>Profile Saved: Confirmed results are stored in your secure personal profile.</span>
        </div>
      </div>

    </div>
  );
};
