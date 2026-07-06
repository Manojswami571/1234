import React, { useState, useEffect } from 'react';
import { GreetingCardData } from '../types';
import QRCode from 'qrcode';
import { 
  exportToStandaloneHTML, 
  saveCardToLocal, 
  listLocalCards, 
  deleteLocalCard, 
  encodeCardToURL,
  safeCopyTextToClipboard
} from '../utils';
import { 
  Download, FileJson, Link, Check, AlertCircle, Save, FolderOpen, Trash2, Upload, ExternalLink,
  QrCode, Printer, Zap, Sparkles
} from 'lucide-react';

interface ExportPanelProps {
  cardData: GreetingCardData;
  onLoadCard: (card: GreetingCardData) => void;
}

export default function ExportPanel({ cardData, onLoadCard }: ExportPanelProps) {
  const [copiedLink, setCopiedLink] = useState(false);
  const [savedLocally, setSavedLocally] = useState(false);
  const [localCards, setLocalCards] = useState<{ id: string; name: string; date: string }[]>([]);
  const [shareableURL, setShareableURL] = useState('');
  const [qrCodeUrl, setQrCodeUrl] = useState('');
  const [qrCodeError, setQrCodeError] = useState<string | null>(null);

  // Short link states
  const [shortURL, setShortURL] = useState('');
  const [isGeneratingShort, setIsGeneratingShort] = useState(false);
  const [shortError, setShortError] = useState<string | null>(null);
  const [copiedShort, setCopiedShort] = useState(false);

  // Update shareable link on data shifts
  useEffect(() => {
    const encoded = encodeCardToURL(cardData);
    const url = `${window.location.origin}${window.location.pathname}#card=${encoded}`;
    setShareableURL(url);
    setSavedLocally(false);
    // Reset short link when card configuration edits happen so they can refresh it
    setShortURL('');
  }, [cardData]);

  // Generate QR Code dynamically when shareableURL or shortURL changes
  useEffect(() => {
    const urlToEncode = shortURL || shareableURL;
    if (urlToEncode) {
      setQrCodeError(null);
      
      // Preemptively check if the URL exceeds standard QR Code binary capacity limits (~2950 chars)
      if (urlToEncode.length > 2950) {
        setQrCodeError("The card content (including custom drawings, high-resolution photo uploads, or voice recordings) contains too much data to fit inside a single physical QR code. To share this card, please use the direct link above or click 'Download Standalone HTML' below to save it as a self-contained file.");
        setQrCodeUrl('');
        return;
      }

      QRCode.toDataURL(urlToEncode, {
        width: 300,
        margin: 2,
        errorCorrectionLevel: 'L',
        color: {
          dark: '#000000',
          light: '#ffffff'
        }
      })
        .then(url => {
          setQrCodeUrl(url);
        })
        .catch(err => {
          console.warn("Failed to generate QR Code:", err);
          setQrCodeError("The card content (including custom drawings, high-resolution photo uploads, or voice recordings) contains too much data to fit inside a single physical QR code. To share this card, please use the direct link above or click 'Download Standalone HTML' below to save it as a self-contained file.");
          setQrCodeUrl('');
        });
    }
  }, [shareableURL, shortURL]);

  const handleGenerateShortLink = async () => {
    setIsGeneratingShort(true);
    setShortError(null);
    try {
      const response = await fetch('/api/shorten', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(cardData),
      });

      if (!response.ok) {
        let errMsg = 'Failed to shorten link on the server.';
        try {
          const errData = await response.json();
          if (errData && errData.error) {
            errMsg = errData.error;
          }
        } catch (_) {}
        throw new Error(errMsg);
      }

      const data = await response.json();
      if (data && data.shortId) {
        const url = `${window.location.origin}${window.location.pathname}?c=${data.shortId}`;
        setShortURL(url);
        // Copy to clipboard safely
        safeCopyTextToClipboard(url).then(() => {
          setCopiedShort(true);
          setTimeout(() => setCopiedShort(false), 2000);
        }).catch((e) => {
          console.warn("Clipboard auto-copy failed, but link was generated:", e);
        });
      } else {
        throw new Error('Invalid short link response.');
      }
    } catch (err: any) {
      console.error(err);
      setShortError(err.message || 'Failed to connect to the shortening service.');
    } finally {
      setIsGeneratingShort(false);
    }
  };

  const handlePrintQRCode = () => {
    const iframe = document.createElement('iframe');
    iframe.style.position = 'fixed';
    iframe.style.right = '0';
    iframe.style.bottom = '0';
    iframe.style.width = '0';
    iframe.style.height = '0';
    iframe.style.border = '0';
    document.body.appendChild(iframe);

    const doc = iframe.contentWindow?.document || iframe.contentDocument;
    if (doc) {
      doc.open();
      doc.write(`
        <html>
          <head>
            <title>Dear You - Share Card</title>
            <style>
              @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;700;800&family=Playfair+Display:ital,wght@0,700;1,400&display=swap');
              body {
                font-family: 'Inter', sans-serif;
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                min-height: 100vh;
                margin: 0;
                background-color: #ffffff;
                color: #171717;
                text-align: center;
                padding: 20px;
                box-sizing: border-box;
              }
              .card-tag {
                border: 2px dashed #d4d4d8;
                padding: 40px;
                border-radius: 24px;
                max-width: 380px;
                background: #fff;
                box-shadow: 0 4px 12px rgba(0,0,0,0.02);
              }
              .title {
                font-family: 'Playfair Display', serif;
                font-size: 28px;
                font-weight: 700;
                margin: 0 0 4px 0;
                color: ${cardData.customAccentColor || '#B33A2E'};
              }
              .subtitle {
                font-size: 13px;
                color: #71717a;
                margin: 0 0 24px 0;
                font-weight: 500;
              }
              .qr-container {
                display: inline-block;
                padding: 16px;
                border: 1px solid #e4e4e7;
                border-radius: 16px;
                background: #fff;
                margin-bottom: 24px;
              }
              .qr-image {
                display: block;
                width: 200px;
                height: 200px;
              }
              .instructions {
                font-size: 14px;
                font-weight: 700;
                color: #18181b;
                margin: 0 0 6px 0;
              }
              .hint {
                font-size: 11px;
                color: #71717a;
                margin: 0;
              }
              .recipient {
                font-size: 15px;
                font-weight: 700;
                margin-bottom: 12px;
                color: #27272a;
              }
              @media print {
                body {
                  min-height: auto;
                }
                .card-tag {
                  border-color: #a1a1aa;
                  box-shadow: none;
                }
              }
            </style>
          </head>
          <body>
            <div class="card-tag">
              <div class="title">Dear You</div>
              <div class="subtitle">An Interactive Greeting Card of Memories</div>
              
              <div class="recipient font-semibold">For: ${cardData.recipientName || 'Someone Special'}</div>

              <div class="qr-container">
                <img class="qr-image" src="${qrCodeUrl}" />
              </div>

              <p class="instructions">Scan with your phone camera</p>
              <p class="hint">To open and play your personalized interactive card ✨</p>
            </div>
            <script>
              window.onload = function() {
                window.focus();
                window.print();
                setTimeout(function() {
                  window.parent.document.body.removeChild(window.frameElement);
                }, 500);
              };
            </script>
          </body>
        </html>
      `);
      doc.close();
    }
  };

  // Load saved cards on startup
  useEffect(() => {
    setLocalCards(listLocalCards());
  }, []);

  // Standalone HTML Exporter
  const handleExportHTML = () => {
    const htmlContent = exportToStandaloneHTML(cardData);
    const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `DearYou_Card_${cardData.recipientName || 'Greeting'}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // JSON Template Exporter
  const handleExportJSON = () => {
    const jsonContent = JSON.stringify(cardData, null, 2);
    const blob = new Blob([jsonContent], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `DearYou_Design_${cardData.recipientName || 'Template'}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Import JSON Design Template
  const handleImportJSON = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string) as GreetingCardData;
        if (parsed && typeof parsed.passcode === 'string') {
          // Force generating a fresh layout ID to avoid overlapping
          parsed.id = `card-${Date.now()}`;
          onLoadCard(parsed);
          alert('Design Template Loaded Successfully!');
        } else {
          alert('Invalid design template format.');
        }
      } catch {
        alert('Failed to parse design file. Ensure it is a valid Dear You JSON design file.');
      }
    };
    reader.readAsText(file);
    e.target.value = ''; // Reset input
  };

  // Save to Local Storage Database
  const handleSaveLocal = () => {
    saveCardToLocal(cardData);
    setSavedLocally(true);
    setLocalCards(listLocalCards());
    setTimeout(() => setSavedLocally(false), 2000);
  };

  // Copy encoded state url
  const handleCopyLink = () => {
    safeCopyTextToClipboard(shareableURL).then(() => {
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    });
  };

  // Delete saved card
  const handleDeleteLocal = (id: string, name: string) => {
    if (confirm(`Are you sure you want to delete your saved card "${name}"?`)) {
      deleteLocalCard(id);
      setLocalCards(listLocalCards());
    }
  };

  // Load a card design
  const handleLoadSavedCard = (id: string) => {
    const key = `dear-you-cards-${id}`;
    const item = localStorage.getItem(key);
    if (item) {
      try {
        onLoadCard(JSON.parse(item));
      } catch {
        alert('Failed to load saved card.');
      }
    }
  };

  return (
    <div className="space-y-6" id="export-panel-root">
      {/* Prime Download Exporter */}
      <div className="p-4 rounded-xl border border-neutral-200 bg-white shadow-sm space-y-4">
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-full bg-rose-50 flex items-center justify-center text-rose-600 flex-shrink-0">
            <Download className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-xs font-bold text-neutral-800">Export Standalone Interactive Card</h3>
            <p className="text-[10px] text-neutral-400 mt-0.5 leading-normal">
              Downloads a highly customized, fully self-contained HTML card file. Encodes your uploaded photos directly. Send it via email or text; they can open it on any phone or laptop browser!
            </p>
          </div>
        </div>

        <button
          onClick={handleExportHTML}
          className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-neutral-900 hover:bg-neutral-800 text-white rounded-lg text-xs font-bold transition-all shadow-sm cursor-pointer"
        >
          <Download className="w-4 h-4" />
          Download Standalone Interactive HTML
        </button>
      </div>

      {/* Share / Copy Hash URL Link */}
      <div className="p-4 rounded-xl border border-neutral-200 bg-white shadow-sm space-y-4">
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-full bg-purple-50 flex items-center justify-center text-purple-600 flex-shrink-0">
            <Link className="w-4 h-4" />
          </div>
          <div className="flex-1">
            <h3 className="text-xs font-bold text-neutral-800">Share Your Greeting Card</h3>
            <p className="text-[10px] text-neutral-400 mt-0.5 leading-normal">
              Get a clean, short link to send via text or message. Safe for all heavy photos and signatures!
            </p>
          </div>
        </div>

        {/* Short Link Generator Section */}
        <div className="bg-gradient-to-r from-purple-50 to-indigo-50 border border-purple-100 rounded-xl p-3.5 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-purple-800 flex items-center gap-1">
              <Zap className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
              Short Link (Highly Recommended)
            </span>
            {shortURL && (
              <span className="text-[9px] bg-green-100 text-green-700 font-bold px-1.5 py-0.5 rounded-full animate-pulse">
                Active Link Created
              </span>
            )}
          </div>

          {shortURL ? (
            <div className="flex gap-2">
              <input
                type="text"
                readOnly
                value={shortURL}
                className="flex-1 text-[11px] bg-white border border-purple-200 rounded-lg px-2.5 py-1.5 focus:outline-none font-mono text-purple-700 font-semibold"
              />
              <button
                onClick={() => {
                  safeCopyTextToClipboard(shortURL).then(() => {
                    setCopiedShort(true);
                    setTimeout(() => setCopiedShort(false), 2000);
                  });
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1 transition-colors cursor-pointer ${
                  copiedShort 
                    ? 'bg-green-600 text-white' 
                    : 'bg-purple-600 hover:bg-purple-700 text-white shadow-sm'
                }`}
              >
                {copiedShort ? <Check className="w-3.5 h-3.5" /> : null}
                {copiedShort ? 'Copied' : 'Copy'}
              </button>
            </div>
          ) : (
            <button
              onClick={handleGenerateShortLink}
              disabled={isGeneratingShort}
              className="w-full py-2 px-4 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white rounded-lg text-xs font-bold transition-all shadow-md hover:shadow-lg disabled:opacity-50 cursor-pointer flex items-center justify-center gap-1.5"
            >
              <Sparkles className="w-3.5 h-3.5 animate-spin" style={{ animationDuration: isGeneratingShort ? '2s' : '0s' }} />
              {isGeneratingShort ? 'Generating Short Link...' : 'Create Short Link ⚡'}
            </button>
          )}

          {shortError && (
            <p className="text-[9px] text-red-600 font-semibold flex items-center gap-1 mt-1">
              <AlertCircle className="w-3 h-3 flex-shrink-0" />
              {shortError}
            </p>
          )}

          <p className="text-[9px] text-neutral-400 leading-normal">
            {shortURL 
              ? "This short link will keep your high-res photos and signatures fully safe and clean!"
              : "Click above to save this card to our database and produce a clean, micro-sized short link."}
          </p>
        </div>

        {/* Collapsible Hash/Encoded Long Link */}
        <details className="group border-t border-neutral-100 pt-3">
          <summary className="text-[10px] font-bold text-neutral-500 hover:text-neutral-700 cursor-pointer list-none flex items-center gap-1 select-none">
            <span className="transition-transform group-open:rotate-90">▶</span>
            Show decentralized full-length link (Very Long)
          </summary>
          <div className="space-y-2 mt-2.5 pl-3">
            <p className="text-[9px] text-neutral-400 leading-normal">
              This link encodes your card data completely inside the link hash segment. It does not store anything on our server, but can become extremely long.
            </p>
            <div className="flex gap-2">
              <input
                type="text"
                readOnly
                value={shareableURL}
                className="flex-1 text-[10px] bg-neutral-50 border border-neutral-200 rounded-lg px-2.5 py-1.5 focus:outline-none font-mono text-neutral-500 truncate"
              />
              <button
                onClick={handleCopyLink}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer ${
                  copiedLink 
                    ? 'bg-green-600 text-white' 
                    : 'bg-neutral-100 hover:bg-neutral-200 text-neutral-700'
                }`}
              >
                {copiedLink ? <Check className="w-3.5 h-3.5" /> : null}
                {copiedLink ? 'Copied' : 'Copy'}
              </button>
            </div>
          </div>
        </details>
      </div>

      {/* Offline Sharing & QR Code Section */}
      <div className="p-4 rounded-xl border border-neutral-200 bg-white shadow-sm space-y-4">
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-600 flex-shrink-0">
            <QrCode className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-xs font-bold text-neutral-800">Printable Gift QR Code</h3>
            <p className="text-[10px] text-neutral-400 mt-0.5 leading-normal">
              Print a beautiful physical gift tag containing a dynamic QR code. Your loved one can scan it with their phone camera to instantly unlock and view this digital card.
            </p>
          </div>
        </div>

        {qrCodeError ? (
          <div className="flex gap-2.5 p-3 rounded-lg border border-amber-100 bg-amber-50 text-amber-800 text-[10px] leading-normal font-medium">
            <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="font-bold">QR Code limit reached</p>
              <p className="text-neutral-500 font-normal">
                {qrCodeError}
              </p>
            </div>
          </div>
        ) : qrCodeUrl ? (
          <div className="flex flex-col sm:flex-row items-center gap-4 bg-neutral-50 p-3 rounded-xl border border-neutral-100">
            <div className="bg-white p-2.5 rounded-lg border border-neutral-200 shadow-sm flex-shrink-0">
              <img 
                src={qrCodeUrl} 
                alt="Card QR Code" 
                className="w-24 h-24 block"
              />
            </div>
            <div className="flex-1 text-center sm:text-left space-y-2">
              <span className="text-[11px] font-bold text-neutral-700 block">
                Offline Gift Label
              </span>
              <p className="text-[9px] text-neutral-400 leading-relaxed">
                Perfect for printing and attaching to a physical gift, box of chocolates, flower bouquet, or printed letter!
              </p>
              <button
                type="button"
                onClick={handlePrintQRCode}
                className="inline-flex items-center gap-1.5 py-1.5 px-3 bg-neutral-900 hover:bg-neutral-800 text-white rounded-lg text-[10px] font-bold transition-all shadow-xs cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5" />
                Print Gift Tag
              </button>
            </div>
          </div>
        ) : (
          <div className="py-6 text-center text-xs text-neutral-400 font-medium">
            Generating QR Code...
          </div>
        )}
      </div>

      {/* Backup Templates and Offline Save */}
      <div className="grid grid-cols-2 gap-3">
        {/* Offline local save */}
        <button
          onClick={handleSaveLocal}
          className={`p-3 rounded-xl border text-left flex flex-col justify-between transition-all ${
            savedLocally 
              ? 'border-green-300 bg-green-50/55' 
              : 'border-neutral-200 bg-white hover:bg-neutral-50'
          }`}
        >
          <div className="flex items-center justify-between w-full mb-1">
            <span className="text-[11px] font-bold text-neutral-700">Save Design locally</span>
            <Save className={`w-3.5 h-3.5 ${savedLocally ? 'text-green-600' : 'text-neutral-400'}`} />
          </div>
          <p className="text-[9px] text-neutral-400 leading-normal">Save in your current browser session database.</p>
          <span className="text-[10px] font-bold text-neutral-800 mt-2 block">
            {savedLocally ? 'Saved in Browser!' : 'Save Progress'}
          </span>
        </button>

        {/* JSON Backup and templates */}
        <div className="p-3 rounded-xl border border-neutral-200 bg-white hover:bg-neutral-50 text-left flex flex-col justify-between relative">
          <div className="flex items-center justify-between w-full mb-1">
            <span className="text-[11px] font-bold text-neutral-700">Backup JSON Design</span>
            <FileJson className="w-3.5 h-3.5 text-neutral-400" />
          </div>
          <p className="text-[9px] text-neutral-400 leading-normal">Download complete template JSON data backup.</p>
          <button
            onClick={handleExportJSON}
            className="text-[10px] font-bold text-neutral-800 mt-2 hover:underline text-left block"
          >
            Download JSON design
          </button>
        </div>
      </div>

      {/* Import / Upload JSON Panel */}
      <div className="p-4 rounded-xl border border-neutral-200 bg-neutral-50/40 space-y-3">
        <h4 className="text-xs font-bold text-neutral-700 flex items-center gap-1.5">
          <Upload className="w-3.5 h-3.5" />
          Import Saved JSON Design
        </h4>
        <div className="relative border border-dashed border-neutral-300 hover:border-neutral-400 transition-colors rounded-lg bg-white p-3 text-center cursor-pointer">
          <FileJson className="w-5 h-5 mx-auto mb-1 text-neutral-400" />
          <span className="text-[10px] font-semibold text-neutral-600">Select design backup file (.json)</span>
          <input
            type="file"
            accept=".json"
            onChange={handleImportJSON}
            className="absolute inset-0 opacity-0 cursor-pointer"
          />
        </div>
      </div>

      {/* Local Gallery Manager */}
      {localCards.length > 0 && (
        <div className="space-y-2 border-t border-neutral-200 pt-4">
          <h4 className="text-xs font-bold text-neutral-700 flex items-center gap-1.5">
            <FolderOpen className="w-3.5 h-3.5" />
            My Saved Card Gallery ({localCards.length})
          </h4>

          <div className="space-y-1.5 max-h-[160px] overflow-y-auto pr-1">
            {localCards.map((c) => (
              <div 
                key={c.id} 
                className="p-2.5 rounded-lg border border-neutral-200/70 bg-white hover:bg-neutral-50/60 flex items-center justify-between gap-2"
                style={{ contentVisibility: 'auto' }}
              >
                <button
                  onClick={() => handleLoadSavedCard(c.id)}
                  className="flex-1 text-left text-xs font-bold text-neutral-700 hover:text-neutral-900 truncate"
                >
                  {c.name}
                  <span className="block text-[9px] text-neutral-400 font-medium">{c.date}</span>
                </button>

                <button
                  onClick={() => handleDeleteLocal(c.id, c.name)}
                  className="p-1.5 text-neutral-400 hover:text-red-500 rounded-md hover:bg-red-50 transition-colors cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
