import React, { useState, useEffect } from 'react';
import CardPreview from './CardPreview';
import { GreetingCardData } from '../types';
import { X } from 'lucide-react';

interface PresentModalProps {
  isOpen: boolean;
  onClose: () => void;
  cardData: GreetingCardData;
}

export default function PresentModal({ isOpen, onClose, cardData }: PresentModalProps) {
  const [activePage, setActivePage] = useState<number>(0);

  // Reset active page to 0 (Envelope Cover) every time the modal opens
  useEffect(() => {
    if (isOpen) {
      setActivePage(0);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-neutral-950/90 z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="relative w-full max-w-sm h-[90vh] flex flex-col justify-center">
        {/* Floating Close Button */}
        <button
          onClick={onClose}
          className="absolute top-[-36px] right-2 flex items-center gap-1.5 text-xs text-white/80 hover:text-white font-bold tracking-tight bg-white/10 hover:bg-white/20 px-3 py-1.5 rounded-full backdrop-blur-sm transition-all"
        >
          <X className="w-3.5 h-3.5" />
          Close Present Mode
        </button>

        {/* Realistic Mobile phone shell */}
        <div className="w-full h-[680px] bg-[#12100e] border-4 border-neutral-800 rounded-[48px] p-3 shadow-2xl relative">
          {/* Top Speaker ear piece and notch */}
          <div className="absolute top-3 left-1/2 -translate-x-1/2 w-28 h-5 bg-[#12100e] rounded-b-2xl z-40 flex items-center justify-center">
            <span className="w-8 h-1 bg-neutral-800 rounded-full block" />
          </div>

          <div className="w-full h-full rounded-[38px] overflow-hidden relative">
            <CardPreview 
              cardData={cardData} 
              activePage={activePage} 
              setActivePage={setActivePage} 
              gatedMode={true} 
            />
          </div>
        </div>
      </div>
    </div>
  );
}
