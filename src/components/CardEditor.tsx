import React, { useState } from 'react';
import { GreetingCardData } from '../types';
import CardThemeSelector from './CardThemeSelector';
import SignatureCanvas from './SignatureCanvas';
import MusicSelector from './MusicSelector';
import { compressImageFile } from '../utils';
import { 
  Lock, Heart, Image as ImageIcon, Sparkles, Send, Music,
  ChevronDown, ChevronUp, User, Users, Compass, Sliders, Type, HelpCircle, FileText
} from 'lucide-react';

interface CardEditorProps {
  cardData: GreetingCardData;
  onChange: (newData: Partial<GreetingCardData>) => void;
  activePreviewPage: number;
  setActivePreviewPage: (p: number) => void;
}

export default function CardEditor({ cardData, onChange, activePreviewPage, setActivePreviewPage }: CardEditorProps) {
  const [openStep, setOpenStep] = useState<number>(0);

  const handleFileChange = (key: string, file: File, index?: number) => {
    compressImageFile(file)
      .then((compressedBase64) => {
        if (typeof index === 'number') {
          const nextPhotos = [...cardData.memoryPhotos];
          nextPhotos[index] = compressedBase64;
          onChange({ memoryPhotos: nextPhotos });
        } else {
          onChange({ [key]: compressedBase64 });
        }
      })
      .catch((err) => {
        console.warn("Failed to compress image, falling back to original size:", err);
        const reader = new FileReader();
        reader.onload = (e) => {
          const base64 = e.target?.result as string;
          if (typeof index === 'number') {
            const nextPhotos = [...cardData.memoryPhotos];
            nextPhotos[index] = base64;
            onChange({ memoryPhotos: nextPhotos });
          } else {
            onChange({ [key]: base64 });
          }
        };
        reader.readAsDataURL(file);
      });
  };

  const removePhoto = (key: string, index?: number) => {
    if (typeof index === 'number') {
      const nextPhotos = [...cardData.memoryPhotos];
      nextPhotos[index] = null;
      onChange({ memoryPhotos: nextPhotos });
    } else {
      onChange({ [key]: null });
    }
  };

  // 7 structured editing steps
  const steps = [
    {
      title: "Names & Privacy Passcode",
      desc: "Set the names and a gate passcode",
      icon: Lock,
      page: 1,
      render: () => (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-neutral-600 mb-1">To (Recipient)</label>
              <div className="relative">
                <User className="absolute left-3 top-2.5 w-3.5 h-3.5 text-neutral-400" />
                <input
                  type="text"
                  value={cardData.recipientName || ''}
                  onChange={(e) => onChange({ recipientName: e.target.value })}
                  placeholder="e.g. Alex"
                  className="w-full text-xs bg-white border border-neutral-200 rounded-lg pl-9 pr-3 py-2 focus:ring-1 focus:ring-neutral-800 focus:outline-none"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-neutral-600 mb-1">From (Sender)</label>
              <div className="relative">
                <User className="absolute left-3 top-2.5 w-3.5 h-3.5 text-neutral-400" />
                <input
                  type="text"
                  value={cardData.senderName || ''}
                  onChange={(e) => onChange({ senderName: e.target.value })}
                  placeholder="e.g. Sam"
                  className="w-full text-xs bg-white border border-neutral-200 rounded-lg pl-9 pr-3 py-2 focus:ring-1 focus:ring-neutral-800 focus:outline-none"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-neutral-600 mb-1">4-Digit Gate Passcode</label>
            <input
              type="text"
              maxLength={4}
              pattern="\d*"
              value={cardData.passcode}
              onChange={(e) => {
                const val = e.target.value.replace(/\D/g, '');
                onChange({ passcode: val });
              }}
              className="w-full tracking-widest text-center font-mono font-bold text-sm bg-white border border-neutral-200 rounded-lg p-2.5 focus:ring-1 focus:ring-neutral-800 focus:outline-none"
              placeholder="1206"
            />
            <p className="text-[10px] text-neutral-400 mt-1 leading-normal">
              A birthday, an anniversary, or an inside joke. Your recipient will enter this passcode on their virtual card keypad to unlock it!
            </p>
          </div>
        </div>
      )
    },
    {
      title: "Visual Theme Selector",
      desc: "Customize the colors and typography",
      icon: Compass,
      page: 2,
      render: () => (
        <CardThemeSelector cardData={cardData} onChange={onChange} />
      )
    },
    {
      title: "Ambient Music & Sound",
      desc: "Add a beautiful background track or upload custom audio",
      icon: Music,
      page: 2,
      render: () => (
        <MusicSelector cardData={cardData} onChange={onChange} />
      )
    },
    {
      title: "Page 1: Favorite Person Portrait",
      desc: "A beautiful frame for your favorite picture",
      icon: Heart,
      page: 2,
      render: () => (
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-neutral-600 mb-1">Portrait Photo</label>
            <ImageUploader
              imageSrc={cardData.favoritePhoto}
              onFileSelected={(file) => handleFileChange('favoritePhoto', file)}
              onRemove={() => removePhoto('favoritePhoto')}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-neutral-600 mb-1">Photo Fit</label>
              <div className="flex gap-1 bg-neutral-100 p-0.5 rounded-lg">
                {(['cover', 'contain'] as const).map((fit) => (
                  <button
                    key={fit}
                    onClick={() => onChange({ favoritePhotoFit: fit })}
                    className={`flex-1 py-1 text-[10px] font-medium rounded-md capitalize transition-colors ${
                      cardData.favoritePhotoFit === fit ? 'bg-white text-neutral-800 shadow-sm' : 'text-neutral-500 hover:text-neutral-700'
                    }`}
                  >
                    {fit}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-neutral-600 mb-1">Photo Filter</label>
              <select
                value={cardData.favoritePhotoFilter}
                onChange={(e) => onChange({ favoritePhotoFilter: e.target.value as any })}
                className="w-full text-[11px] bg-white border border-neutral-200 rounded-lg p-1.5 focus:outline-none focus:ring-1 focus:ring-neutral-800"
              >
                <option value="none">None (Original)</option>
                <option value="grayscale">Noir (Grayscale)</option>
                <option value="sepia">Warm Sepia</option>
                <option value="vintage">Polaroid Vintage</option>
                <option value="warm">Sunny Warm</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-neutral-600 mb-1">A line about them</label>
            <textarea
              value={cardData.favoriteQuote}
              onChange={(e) => onChange({ favoriteQuote: e.target.value })}
              className="w-full text-xs bg-white border border-neutral-200 rounded-lg p-2.5 focus:ring-1 focus:ring-neutral-800 focus:outline-none min-height-[70px]"
              maxLength={160}
              placeholder="e.g. Completely and perfectly happy."
            />
            <div className="flex justify-between text-[10px] text-neutral-400 mt-1">
              <span>Short & sweet is best</span>
              <span>{cardData.favoriteQuote.length}/160</span>
            </div>
          </div>
        </div>
      )
    },
    {
      title: "Page 2: Shared Memories Grid",
      desc: "Four memory moments on a neat polaroid collage",
      icon: Users,
      page: 3,
      render: () => (
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-neutral-600 mb-1">Memories Caption</label>
            <input
              type="text"
              value={cardData.memoryCaption}
              onChange={(e) => onChange({ memoryCaption: e.target.value })}
              placeholder="e.g. i love you / summer days"
              className="w-full text-xs bg-white border border-neutral-200 rounded-lg p-2 focus:ring-1 focus:ring-neutral-800 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-neutral-600 mb-1">Four Memory Photos & Wishes</label>
            <div className="grid grid-cols-2 gap-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="relative space-y-2 p-2 bg-neutral-50 rounded-xl border border-neutral-200">
                  <div className="text-[10px] font-bold text-neutral-500">Photo {i+1}</div>
                  <ImageUploader
                    imageSrc={cardData.memoryPhotos[i]}
                    onFileSelected={(file) => handleFileChange('memoryPhotos', file, i)}
                    onRemove={() => removePhoto('memoryPhotos', i)}
                    compact
                  />
                  <div>
                    <label className="block text-[9px] font-semibold text-neutral-500 mb-0.5">Wish / Msg</label>
                    <input
                      type="text"
                      value={cardData.memoryWishes?.[i] || ''}
                      onChange={(e) => {
                        const nextWishes = [...(cardData.memoryWishes || ['', '', '', ''])];
                        nextWishes[i] = e.target.value;
                        onChange({ memoryWishes: nextWishes });
                      }}
                      placeholder={`Wish ${i+1}`}
                      className="w-full text-[10px] bg-white border border-neutral-200 rounded p-1 focus:ring-1 focus:ring-neutral-800 focus:outline-none"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )
    },
    {
      title: "Page 3: Interactive Make-a-Wish",
      desc: "A virtual cake with blow-out birthday candles",
      icon: Sparkles,
      page: 4,
      render: () => (
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-neutral-600 mb-1">Number of Candles</label>
            <input
              type="number"
              min={1}
              max={12}
              value={cardData.age}
              onChange={(e) => {
                const val = Math.max(1, Math.min(12, parseInt(e.target.value) || 1));
                onChange({ age: val });
              }}
              className="w-full text-xs bg-white border border-neutral-200 rounded-lg p-2 focus:ring-1 focus:ring-neutral-800 focus:outline-none"
            />
            <p className="text-[10px] text-neutral-400 mt-1">
              Supports 1 to 12 candles on the virtual cake for beautiful spacing.
            </p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-neutral-600 mb-1">Wish prompt instructions</label>
            <textarea
              value={cardData.wishText}
              onChange={(e) => onChange({ wishText: e.target.value })}
              className="w-full text-xs bg-white border border-neutral-200 rounded-lg p-2 focus:ring-1 focus:ring-neutral-800 focus:outline-none"
              placeholder="Close your eyes, make a silent wish, and tap below to blow out the candles!"
            />
          </div>
        </div>
      )
    },
    {
      title: "Page 4: The Celebration Reveal",
      desc: "The big headline and highlight photo",
      icon: ImageIcon,
      page: 5,
      render: () => (
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-neutral-600 mb-1">Big Celebration Headline</label>
            <input
              type="text"
              value={cardData.headline}
              onChange={(e) => onChange({ headline: e.target.value })}
              className="w-full text-xs bg-white border border-neutral-200 rounded-lg p-2 focus:ring-1 focus:ring-neutral-800 focus:outline-none"
              placeholder="Happy Birthday, My Favorite Human!"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-neutral-600 mb-1">Celebration Photo</label>
            <ImageUploader
              imageSrc={cardData.headlinePhoto}
              onFileSelected={(file) => handleFileChange('headlinePhoto', file)}
              onRemove={() => removePhoto('headlinePhoto')}
            />
          </div>
        </div>
      )
    },
    {
      title: "Page 5: Handwritten Note",
      desc: "Write a letter that feels handwritten on paper",
      icon: FileText,
      page: 6,
      render: () => (
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-neutral-600 mb-1">Handwritten Letter Text</label>
            <textarea
              value={cardData.noteText}
              onChange={(e) => onChange({ noteText: e.target.value })}
              className="w-full text-xs bg-white border border-neutral-200 rounded-lg p-2.5 focus:ring-1 focus:ring-neutral-800 focus:outline-none min-h-[120px] leading-relaxed"
              placeholder="Write your long-form letter..."
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-neutral-600 mb-1">Side Stamp/Photo</label>
            <ImageUploader
              imageSrc={cardData.notePhoto}
              onFileSelected={(file) => handleFileChange('notePhoto', file)}
              onRemove={() => removePhoto('notePhoto')}
            />
            <p className="text-[10px] text-neutral-400 mt-1">
              This floats inside the handwritten note card as a taped Polaroid memory scrap!
            </p>
          </div>
        </div>
      )
    },
    {
      title: "Page 6: Sign-off & Closing",
      desc: "Leave them with a final warm closing phrase and a hand-drawn signature",
      icon: Send,
      page: 7,
      render: () => (
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-neutral-600 mb-1">Closing Phrase</label>
            <textarea
              value={cardData.finalMessage}
              onChange={(e) => onChange({ finalMessage: e.target.value })}
              className="w-full text-xs bg-white border border-neutral-200 rounded-lg p-2 focus:ring-1 focus:ring-neutral-800 focus:outline-none"
              placeholder="Here's to another trip around the sun together..."
            />
          </div>

          <div className="pt-2 border-t border-neutral-100">
            <SignatureCanvas
              signatureDrawing={cardData.signatureDrawing}
              onChange={(base64) => onChange({ signatureDrawing: base64 })}
              accentColor={cardData.customAccentColor}
            />
          </div>
        </div>
      )
    }
  ];

  const handleStepClick = (idx: number, targetPage: number) => {
    setOpenStep(openStep === idx ? -1 : idx);
    setActivePreviewPage(targetPage);
  };

  return (
    <div className="space-y-3" id="card-editor-accordion">
      {steps.map((step, idx) => {
        const isOpen = openStep === idx;
        const IconComponent = step.icon;
        return (
          <div 
            key={idx} 
            className={`border rounded-xl transition-all ${
              isOpen 
                ? 'bg-neutral-50/70 border-neutral-300 shadow-sm' 
                : 'bg-white border-neutral-200 hover:border-neutral-300'
            }`}
            style={{ contentVisibility: 'auto' }}
          >
            {/* Header Accordion Trigger */}
            <button
              onClick={() => handleStepClick(idx, step.page)}
              className="w-full px-4 py-3 flex items-center justify-between text-left focus:outline-none"
            >
              <div className="flex items-center gap-3">
                <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                  isOpen ? 'bg-neutral-900 text-white scale-105' : 'bg-neutral-100 text-neutral-600'
                }`}>
                  {idx + 1}
                </span>
                <div>
                  <h4 className="text-xs font-bold text-neutral-800 flex items-center gap-1.5">
                    <IconComponent className="w-3.5 h-3.5 text-neutral-500" />
                    {step.title}
                  </h4>
                  <p className="text-[10px] text-neutral-400 mt-0.5 font-medium">{step.desc}</p>
                </div>
              </div>
              <div>
                {isOpen ? (
                  <ChevronUp className="w-4 h-4 text-neutral-400" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-neutral-400" />
                )}
              </div>
            </button>

            {/* Step Body */}
            {isOpen && (
              <div className="px-4 pb-4 pt-1 border-t border-neutral-200/50">
                {step.render()}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

/* Helper Image Uploader Component with drag & drop support */
interface ImageUploaderProps {
  imageSrc: string | null;
  onFileSelected: (file: File) => void;
  onRemove: () => void;
  compact?: boolean;
}

function ImageUploader({ imageSrc, onFileSelected, onRemove, compact = false }: ImageUploaderProps) {
  const [isDragOver, setIsDragOver] = useState(false);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith('image/')) {
      onFileSelected(file);
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onFileSelected(file);
    }
  };

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`border border-dashed rounded-xl transition-all relative overflow-hidden flex flex-col items-center justify-center ${
        imageSrc ? 'bg-neutral-50 border-neutral-200' : 'bg-white hover:bg-neutral-50 border-neutral-300'
      } ${isDragOver ? 'border-neutral-900 bg-neutral-50 scale-[0.99]' : ''} ${
        compact ? 'p-3 min-h-[90px]' : 'p-6 min-h-[140px]'
      }`}
    >
      {imageSrc ? (
        <div className="w-full flex flex-col items-center">
          <img
            src={imageSrc}
            alt="Upload preview"
            className={`object-cover rounded-lg border border-neutral-200 ${
              compact ? 'w-16 h-16' : 'w-24 h-24'
            }`}
          />
          <button
            onClick={(e) => {
              e.stopPropagation();
              onRemove();
            }}
            className="mt-2 text-[10px] text-red-500 hover:text-red-700 font-semibold"
          >
            Remove Image
          </button>
        </div>
      ) : (
        <>
          <ImageIcon className={`text-neutral-400 ${compact ? 'w-5 h-5 mb-1' : 'w-8 h-8 mb-2'}`} />
          <span className="text-[11px] font-semibold text-neutral-700 text-center">
            {compact ? 'Upload image' : 'Drag image here, or browse'}
          </span>
          <span className="text-[9px] text-neutral-400 mt-1">PNG, JPG up to 5MB</span>
          <input
            type="file"
            accept="image/*"
            onChange={handleFileInput}
            className="absolute inset-0 opacity-0 cursor-pointer"
          />
        </>
      )}
    </div>
  );
}
