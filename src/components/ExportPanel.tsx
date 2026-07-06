import React, { useState, useEffect } from 'react';
import { GreetingCardData } from '../types';
import QRCode from 'qrcode';
import { 
  exportToStandaloneHTML, 
  saveCardToLocal, 
  listLocalCards, 
  deleteLocalCard, 
  encodeCardToURL 
} from '../utils';
import { 
  Download, FileJson, Link, Check, AlertCircle, Save, FolderOpen, Trash2, Upload, ExternalLink,
  QrCode, Printer
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

  // Update shareable link on data shifts
  useEffect(() => {
    const encoded = encodeCardToURL(cardData);
    const url = `${window.location.origin}${window.location.pathname}#card=${encoded}`;
    setShareableURL(url);
    setSavedLocally(false);
  }, [cardData]);

  // Generate QR Code dynamically when shareableURL changes
  useEffect(() => {
    if (shareableURL) {
      setQrCodeError(null);
      QRCode.toDataURL(shareableURL, {
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
          console.error("Failed to generate QR Code:", err);
          setQrCodeError("The card content (including custom drawings, high-resolution photo uploads, or voice recordings) contains too much data to fit inside a single physical QR code. To share this card, please use the direct link above or click 'Download Standalone HTML' below to save it as a self-contained file.");
          setQrCodeUrl('');
        });
    }
  }, [shareableURL]);

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
    navigator.clipboard.writeText(shareableURL);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
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
          <div>
            <h3 className="text-xs font-bold text-neutral-800">Quick Shareable Link</h3>
            <p className="text-[10px] text-neutral-400 mt-0.5 leading-normal">
              Encodes your card colors, texts, and settings directly in the URL hash fragment. Large custom images might be excluded to keep the URL concise.
            </p>
          </div>
        </div>

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

        <div className="flex gap-2 p-2.5 rounded-lg bg-amber-50 border border-amber-200/60 text-[10px] text-amber-800 font-medium">
          <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
          <span>Note: For cards with heavy photos, download the Standalone HTML file above to ensure images never break.</span>
        </div>
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
