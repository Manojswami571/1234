import React, { useState } from 'react';
import { CardTheme, GreetingCardData } from '../types';
import { THEMES } from '../data';
import { 
  Palette, Sliders, Type, Check, RefreshCw, Sparkles, 
  Upload, Trash2, Image as ImageIcon 
} from 'lucide-react';

interface CardThemeSelectorProps {
  cardData: GreetingCardData;
  onChange: (newData: Partial<GreetingCardData>) => void;
}

export default function CardThemeSelector({ cardData, onChange }: CardThemeSelectorProps) {
  const [isAdvancedOpen, setIsAdvancedOpen] = useState(false);

  const selectedTheme = THEMES.find(t => t.id === cardData.themeId) || THEMES[0];

  const handleThemeSelect = (theme: CardTheme) => {
    onChange({
      themeId: theme.id,
      customAccentColor: theme.accent,
      customBgColor: theme.bg,
      customCardColor: theme.cardBg,
      customTextColor: theme.textColor,
      customFontHeading: theme.fontHeading,
      customFontBody: theme.fontBody,
    });
  };

  const fontsHeading = [
    { name: 'Fredoka (Friendly)', value: '"Fredoka", sans-serif' },
    { name: 'Space Grotesk (Tech)', value: '"Space Grotesk", sans-serif' },
    { name: 'Playfair Display (Serif)', value: '"Playfair Display", serif' },
    { name: 'Inter (Modern Sans)', value: '"Inter", sans-serif' },
  ];

  const fontsBody = [
    { name: 'Caveat (Warm Script)', value: '"Caveat", cursive' },
    { name: 'Inter (Clean Sans)', value: '"Inter", sans-serif' },
    { name: 'JetBrains Mono (Retro)', value: '"JetBrains Mono", monospace' },
  ];

  const quickColors = [
    '#B33A2E', '#7A4FA3', '#2E7D6B', '#C9973F', '#E7A79A', '#4A5FB3',
    '#1E293B', '#E11D48', '#059669', '#D97706', '#2563EB', '#7C3AED'
  ];

  const resetToThemeDefaults = () => {
    handleThemeSelect(selectedTheme);
  };

  return (
    <div className="space-y-4" id="theme-selector-root">
      {/* Predefined Themes Grid */}
      <div className="grid grid-cols-2 gap-3">
        {THEMES.map((theme) => {
          const isSelected = cardData.themeId === theme.id;
          return (
            <button
              key={theme.id}
              onClick={() => handleThemeSelect(theme)}
              className={`p-3 rounded-xl border text-left transition-all ${
                isSelected
                  ? 'border-neutral-800 bg-white shadow-sm ring-2 ring-neutral-800/10'
                  : 'border-neutral-200 bg-neutral-50 hover:bg-neutral-100 hover:border-neutral-300'
              }`}
              style={{ contentVisibility: 'auto' }}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="font-semibold text-xs text-neutral-800">{theme.name}</span>
                {isSelected && (
                  <span className="w-4 h-4 rounded-full bg-neutral-900 text-white flex items-center justify-center">
                    <Check className="w-2.5 h-2.5" />
                  </span>
                )}
              </div>
              
              <div className="flex gap-1.5 items-center mb-1">
                {theme.previewColors.map((c, i) => (
                  <span
                    key={i}
                    className="w-4 h-4 rounded-full border border-black/5 block"
                    style={{ backgroundColor: c }}
                  />
                ))}
              </div>
              <p className="text-[10px] text-neutral-500 line-clamp-1 leading-tight">{theme.description}</p>
            </button>
          );
        })}
      </div>

      {/* Custom Background Image Uploader */}
      <div className="border-t border-neutral-200/80 pt-3 space-y-2">
        <label className="block text-xs font-semibold text-neutral-600 flex items-center gap-1.5">
          <ImageIcon className="w-3.5 h-3.5 text-neutral-500" />
          Custom Card Background Image (e.g. Your Selfie!)
        </label>
        
        {cardData.customBgImage ? (
          <div className="relative rounded-xl border border-neutral-200 bg-neutral-50 p-2.5 flex items-center justify-between gap-3 animate-in fade-in duration-150">
            <div className="flex items-center gap-2.5 overflow-hidden">
              <img
                src={cardData.customBgImage}
                alt="Background preview"
                className="w-12 h-12 rounded-lg object-cover border border-neutral-200"
              />
              <div className="overflow-hidden">
                <p className="text-[11px] font-bold text-neutral-700 truncate">Background Image Active</p>
                <p className="text-[9px] text-green-600 font-semibold flex items-center gap-0.5 mt-0.5">
                  <Check className="w-2.5 h-2.5" /> Applied to all pages
                </p>
              </div>
            </div>
            <button
              onClick={() => onChange({ customBgImage: null })}
              className="p-1.5 text-neutral-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
              title="Remove background image"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <div className="relative border border-dashed border-neutral-300 hover:border-neutral-400 rounded-xl bg-white hover:bg-neutral-50/50 p-3 flex flex-col items-center justify-center transition-all cursor-pointer">
            <Upload className="w-5 h-5 text-neutral-400 mb-1" />
            <span className="text-[10px] font-bold text-neutral-700">Click to upload your custom background image</span>
            <span className="text-[8px] text-neutral-400 mt-0.5">Drag & drop or tap to select image</span>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) {
                  const reader = new FileReader();
                  reader.onload = (event) => {
                    onChange({ customBgImage: event.target?.result as string });
                  };
                  reader.readAsDataURL(file);
                }
              }}
              className="absolute inset-0 opacity-0 cursor-pointer"
            />
          </div>
        )}
        <p className="text-[9px] text-neutral-400 leading-tight">
          💡 <strong>Tip:</strong> Set the theme to <strong>Pretty Night 🖤</strong> above when using dark or black-and-white background photos to match the vibe perfectly!
        </p>
      </div>

      {/* Advanced Customization Toggle */}
      <div className="border-t border-neutral-200/80 pt-3">
        <button
          onClick={() => setIsAdvancedOpen(!isAdvancedOpen)}
          className="flex items-center justify-between w-full text-xs font-semibold text-neutral-600 hover:text-neutral-900 transition-colors"
        >
          <span className="flex items-center gap-1.5">
            <Palette className="w-3.5 h-3.5" />
            Custom Palette & Typography
          </span>
          <span className="text-[10px] text-neutral-400">
            {isAdvancedOpen ? 'Collapse' : 'Expand'}
          </span>
        </button>

        {isAdvancedOpen && (
          <div className="mt-4 space-y-4 p-4 rounded-xl bg-neutral-50/50 border border-neutral-200/60 animate-in fade-in slide-in-from-top-2 duration-200">
            {/* Color Customizers */}
            <div className="space-y-3">
              <div>
                <label className="block text-[11px] font-medium text-neutral-500 mb-1.5">Accent Accent Color</label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={cardData.customAccentColor || selectedTheme.accent}
                    onChange={(e) => onChange({ customAccentColor: e.target.value })}
                    className="w-8 h-8 rounded-lg border border-neutral-200 cursor-pointer overflow-hidden bg-transparent"
                  />
                  <div className="flex flex-wrap gap-1">
                    {quickColors.map((c) => (
                      <button
                        key={c}
                        onClick={() => onChange({ customAccentColor: c })}
                        className={`w-5 h-5 rounded-full border transition-transform ${
                          (cardData.customAccentColor || selectedTheme.accent) === c ? 'scale-110 ring-2 ring-black/10 border-white' : 'border-black/5 hover:scale-105'
                        }`}
                        style={{ backgroundColor: c }}
                      />
                    ))}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-[10px] font-medium text-neutral-500 mb-1">Canvas Bg</label>
                  <input
                    type="color"
                    value={cardData.customBgColor || selectedTheme.bg}
                    onChange={(e) => onChange({ customBgColor: e.target.value })}
                    className="w-full h-8 rounded-lg border border-neutral-200 cursor-pointer bg-transparent"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-medium text-neutral-500 mb-1">Card Paper</label>
                  <input
                    type="color"
                    value={cardData.customCardColor || selectedTheme.cardBg}
                    onChange={(e) => onChange({ customCardColor: e.target.value })}
                    className="w-full h-8 rounded-lg border border-neutral-200 cursor-pointer bg-transparent"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-medium text-neutral-500 mb-1">Ink Color</label>
                  <input
                    type="color"
                    value={cardData.customTextColor || selectedTheme.textColor}
                    onChange={(e) => onChange({ customTextColor: e.target.value })}
                    className="w-full h-8 rounded-lg border border-neutral-200 cursor-pointer bg-transparent"
                  />
                </div>
              </div>
            </div>

            {/* Typography Customizers */}
            <div className="space-y-3 pt-2 border-t border-neutral-200/50">
              <div>
                <label className="flex items-center gap-1 text-[11px] font-medium text-neutral-500 mb-1">
                  <Type className="w-3 h-3" />
                  Heading Font
                </label>
                <select
                  value={cardData.customFontHeading || selectedTheme.fontHeading}
                  onChange={(e) => onChange({ customFontHeading: e.target.value })}
                  className="w-full text-xs bg-white border border-neutral-200 rounded-lg p-2 focus:ring-1 focus:ring-neutral-400 focus:outline-none"
                >
                  {fontsHeading.map(f => (
                    <option key={f.value} value={f.value}>{f.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="flex items-center gap-1 text-[11px] font-medium text-neutral-500 mb-1">
                  <Type className="w-3 h-3" />
                  Letter / Script Font
                </label>
                <select
                  value={cardData.customFontBody || selectedTheme.fontBody}
                  onChange={(e) => onChange({ customFontBody: e.target.value })}
                  className="w-full text-xs bg-white border border-neutral-200 rounded-lg p-2 focus:ring-1 focus:ring-neutral-400 focus:outline-none"
                >
                  {fontsBody.map(f => (
                    <option key={f.value} value={f.value}>{f.name}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Reset Button */}
            <button
              onClick={resetToThemeDefaults}
              className="flex items-center gap-1.5 justify-center w-full mt-2 py-2 text-[10px] font-medium text-neutral-500 hover:text-neutral-800 border border-dashed border-neutral-300 rounded-lg hover:border-neutral-400 transition-colors"
            >
              <RefreshCw className="w-3 h-3" />
              Reset to Original Theme Preset
            </button>
          </div>
        )}
      </div>

      {/* Wish Entrance Animation Section */}
      <div className="border-t border-neutral-200/80 pt-3">
        <label className="block text-xs font-semibold text-neutral-600 mb-1.5 flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-neutral-500 animate-pulse" />
          Wish & Text Entrance Animation
        </label>
        <div className="flex gap-1.5 bg-neutral-100 p-0.5 rounded-lg">
          {([
            { id: 'fade', name: 'Fade In', desc: 'Smooth elegant fading' },
            { id: 'typewriter', name: 'Typewriter', desc: 'Character by character typing' },
            { id: 'bounce', name: 'Playful Bounce', desc: 'Fun bouncing spring' }
          ] as const).map((anim) => (
            <button
              key={anim.id}
              onClick={() => onChange({ wishAnimationStyle: anim.id })}
              className={`flex-1 py-1.5 px-2 text-[10px] font-bold rounded-md transition-all ${
                cardData.wishAnimationStyle === anim.id
                  ? 'bg-neutral-900 text-white shadow-sm'
                  : 'text-neutral-500 hover:text-neutral-800 hover:bg-neutral-200/50'
              }`}
              title={anim.desc}
            >
              {anim.name}
            </button>
          ))}
        </div>
        <p className="text-[10px] text-neutral-400 mt-1 leading-tight">
          Select an entrance animation that will play automatically as each page loads.
        </p>
      </div>
    </div>
  );
}
