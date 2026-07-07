import React, { useState, useEffect } from 'react';
import { DEFAULT_CARD_DATA } from './data';
import { GreetingCardData } from './types';
import { decodeCardFromURL } from './utils';
import CardEditor from './components/CardEditor';
import CardPreview from './components/CardPreview';
import ExportPanel from './components/ExportPanel';
import PresentModal from './components/PresentModal';
import { 
  Sparkles, Gift, Play, RotateCcw, PenTool, Share2, 
  Eye, Heart, ShieldAlert, Check, Moon, Sun, Laptop, ArrowRight
} from 'lucide-react';

export default function App() {
  const [cardData, setCardData] = useState<GreetingCardData>(DEFAULT_CARD_DATA);
  const [activePreviewPage, setActivePreviewPage] = useState<number>(0);
  const [isPresentModeOpen, setIsPresentModeOpen] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'edit' | 'export'>('edit');
  
  // Detect if loaded from deep-link share URL
  const [isRecipientView, setIsRecipientView] = useState<boolean>(false);

  useEffect(() => {
    const handleUrlLoading = async () => {
      // 1. Check for query parameter short link ID (e.g. ?c=abc or ?cardId=abc)
      const params = new URLSearchParams(window.location.search);
      const shortId = params.get('c') || params.get('cardId');
      
      if (shortId) {
        let loaded = false;
        try {
          const response = await fetch(`/api/card/${shortId}`);
          if (response.ok) {
            const cardJson = await response.json();
            if (cardJson && cardJson.id) {
              setCardData(cardJson);
              setIsRecipientView(true);
              setIsPresentModeOpen(true);
              loaded = true;
            }
          }
        } catch (e) {
          console.error('Failed to load card from server database:', e);
        }

        // Fallback to client-side npoint.io fetch if backend fetch failed or returned invalid data
        if (!loaded) {
          try {
            const response = await fetch(`https://api.npoint.io/documents/${shortId}`);
            if (response.ok) {
              const resJson = await response.json();
              const cardJson = resJson.contents || resJson;
              if (cardJson && cardJson.id) {
                setCardData(cardJson);
                setIsRecipientView(true);
                setIsPresentModeOpen(true);
              }
            }
          } catch (e) {
            console.error('Failed to load card from fallback database:', e);
          }
        }
      }

      // 2. Fallback to hash-based loading
      const hash = window.location.hash;
      if (hash && hash.startsWith('#card=')) {
        const b64Data = hash.replace('#card=', '');
        const decoded = decodeCardFromURL(b64Data);
        if (decoded) {
          setCardData(decoded);
          setIsRecipientView(true);
          setIsPresentModeOpen(true);
        }
      }
    };

    handleUrlLoading();

    const handleHashChange = () => {
      const hash = window.location.hash;
      if (hash && hash.startsWith('#card=')) {
        const b64Data = hash.replace('#card=', '');
        const decoded = decodeCardFromURL(b64Data);
        if (decoded) {
          setCardData(decoded);
          setIsRecipientView(true);
          setIsPresentModeOpen(true);
        }
      }
    };

    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  const handleCardDataChange = (newData: Partial<GreetingCardData>) => {
    setCardData(prev => ({ ...prev, ...newData }));
  };

  const handleLoadCard = (loadedCard: GreetingCardData) => {
    setCardData(loadedCard);
    setActivePreviewPage(0);
  };

  const handleReset = () => {
    if (confirm('Are you sure you want to discard your current design and reset to the default birthday theme?')) {
      setCardData({
        ...DEFAULT_CARD_DATA,
        id: `card-${Date.now()}`
      });
      setActivePreviewPage(0);
    }
  };

  return (
    <div className="min-h-screen bg-neutral-100 flex flex-col text-neutral-800 font-sans selection:bg-rose-100 selection:text-neutral-900">
      
      {/* Header Bar */}
      <header className="bg-white/85 border-b border-neutral-200/80 sticky top-0 z-30 backdrop-blur-md px-6 py-4 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-rose-500 via-amber-500 to-indigo-600 flex items-center justify-center shadow-md">
            <Heart className="w-5 h-5 text-white animate-pulse" />
          </div>
          <div>
            <h1 className="text-base font-bold tracking-tight text-neutral-900 flex items-center gap-1.5">
              Dear You
              <span className="text-[10px] font-semibold bg-rose-50 text-rose-600 border border-rose-100 px-1.5 py-0.5 rounded-full">
                Card Maker
              </span>
            </h1>
            <p className="text-[10px] text-neutral-400 font-medium tracking-tight">
              Create a personalized virtual card they will cherish and replay
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleReset}
            className="flex items-center gap-1.5 py-2 px-3 text-xs font-semibold text-neutral-600 hover:text-neutral-900 border border-neutral-200 rounded-lg hover:bg-neutral-50 transition-all cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Start Over
          </button>

          <button
            onClick={() => {
              setIsRecipientView(false);
              setIsPresentModeOpen(true);
            }}
            className="flex items-center gap-1.5 py-2 px-4 text-xs font-bold text-white bg-neutral-900 hover:bg-neutral-800 rounded-lg shadow-sm transition-all hover:translate-y-[-1px] cursor-pointer"
          >
            <Play className="w-3.5 h-3.5" />
            Present Card
          </button>
        </div>
      </header>

      {/* Main Workspace split panel layout */}
      <div className="flex-1 max-w-7xl w-full mx-auto grid grid-cols-1 lg:grid-cols-12 gap-0">
        
        {/* Left Side: Customizer Controls Panel */}
        <div className="col-span-1 lg:col-span-5 p-6 lg:border-r border-neutral-200 bg-white/50 flex flex-col h-[calc(100vh-76px)] overflow-y-auto">
          {/* Controls Panel Tabs */}
          <div className="flex gap-1.5 bg-neutral-100 p-1 rounded-xl mb-6">
            <button
              onClick={() => setActiveTab('edit')}
              className={`flex-1 py-2.5 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                activeTab === 'edit'
                  ? 'bg-white text-neutral-800 shadow-sm'
                  : 'text-neutral-500 hover:text-neutral-700'
              }`}
            >
              <PenTool className="w-3.5 h-3.5" />
              1. Customize Content
            </button>
            <button
              onClick={() => setActiveTab('export')}
              className={`flex-1 py-2.5 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                activeTab === 'export'
                  ? 'bg-white text-neutral-800 shadow-sm'
                  : 'text-neutral-500 hover:text-neutral-700'
              }`}
            >
              <Share2 className="w-3.5 h-3.5" />
              2. Export & Share
            </button>
          </div>

          {/* Active Tab Panel */}
          <div className="flex-1">
            {activeTab === 'edit' ? (
              <CardEditor 
                cardData={cardData} 
                onChange={handleCardDataChange}
                activePreviewPage={activePreviewPage}
                setActivePreviewPage={setActivePreviewPage}
              />
            ) : (
              <ExportPanel 
                cardData={cardData} 
                onLoadCard={handleLoadCard}
              />
            )}
          </div>
        </div>

        {/* Right Side: Visual Live Simulator Screen */}
        <div className="col-span-1 lg:col-span-7 bg-neutral-50 p-6 flex flex-col items-center justify-center relative overflow-hidden">
          {/* Subtle Stage Background elements */}
          <div className="absolute top-10 left-10 w-44 h-44 rounded-full bg-rose-200/20 blur-3xl pointer-events-none" />
          <div className="absolute bottom-10 right-10 w-44 h-44 rounded-full bg-blue-200/20 blur-3xl pointer-events-none" />

          {/* Top instruction line */}
          <div className="text-center mb-5 z-10">
            <span className="inline-flex items-center gap-1 px-3 py-1 bg-white border border-neutral-200 text-[10px] font-bold text-neutral-600 rounded-full shadow-sm">
              <Eye className="w-3.5 h-3.5 text-neutral-500" />
              Live Editor Preview Mode
            </span>
          </div>

          {/* Simulated Premium Phone shell container */}
          <div className="w-full max-w-[310px] h-[580px] bg-[#12100e] border-4 border-neutral-800 rounded-[44px] p-2.5 shadow-2xl relative transition-all hover:scale-[1.01]">
            {/* Notch */}
            <div className="absolute top-2.5 left-1/2 -translate-x-1/2 w-24 h-4 bg-[#12100e] rounded-b-xl z-40 flex items-center justify-center">
              <span className="w-6 h-0.5 bg-neutral-800 rounded-full block" />
            </div>

            {/* Inner Interactive Card screen frame */}
            <div className="w-full h-full rounded-[34px] overflow-hidden relative">
              <CardPreview 
                cardData={cardData} 
                activePage={activePreviewPage} 
                setActivePage={setActivePreviewPage} 
                gatedMode={false} // ungated in editor preview
              />
            </div>
          </div>

          {/* Bottom helper tip */}
          <p className="text-[10px] text-neutral-400 font-medium text-center mt-6 max-w-sm leading-normal">
            Your custom designs are fully responsive. Try switching edit steps on the left to automatically preview different pages of your card!
          </p>
        </div>

      </div>

      {/* Recipient / Creator Presentation Modal */}
      <PresentModal
        isOpen={isPresentModeOpen}
        onClose={() => {
          setIsPresentModeOpen(false);
          // Clean hash so we can re-open/edit
          if (isRecipientView) {
            window.location.hash = '';
            setIsRecipientView(false);
          }
        }}
        cardData={cardData}
      />
    </div>
  );
}
