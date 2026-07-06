import React, { useRef, useState, useEffect } from 'react';
import { Trash2, Edit2, RotateCcw } from 'lucide-react';

interface SignatureCanvasProps {
  signatureDrawing: string | null;
  onChange: (base64: string | null) => void;
  accentColor: string;
}

export default function SignatureCanvas({ signatureDrawing, onChange, accentColor }: SignatureCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [inkColor, setInkColor] = useState<'black' | 'blue' | 'accent'>('accent');
  const [penWidth, setPenWidth] = useState<number>(3);
  const [hasDrawn, setHasDrawn] = useState(false);

  // Map abstract colors to actual hex/rgb
  const getInkHex = () => {
    switch (inkColor) {
      case 'black':
        return '#1a1a1a';
      case 'blue':
        return '#1b3b6f';
      case 'accent':
      default:
        return accentColor || '#B33A2E';
    }
  };

  // Initialize and handle resize to ensure crisp high-DPI lines
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set up high DPI canvas resolution
    const resizeCanvas = () => {
      const rect = canvas.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;

      // Only resize if the physical dimensions actually changed
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      ctx.scale(dpr, dpr);

      // Set styles
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.strokeStyle = getInkHex();
      ctx.lineWidth = penWidth;

      // If we already have a signature stored, we can load and render it on this canvas,
      // but to prevent losing drawings, we also let the user clear/redraw.
      if (signatureDrawing) {
        const img = new Image();
        img.onload = () => {
          ctx.clearRect(0, 0, rect.width, rect.height);
          ctx.drawImage(img, 0, 0, rect.width, rect.height);
          setHasDrawn(true);
        };
        img.src = signatureDrawing;
      } else {
        ctx.clearRect(0, 0, rect.width, rect.height);
        setHasDrawn(false);
      }
    };

    resizeCanvas();

    // Resize on window change
    window.addEventListener('resize', resizeCanvas);
    return () => window.removeEventListener('resize', resizeCanvas);
  }, [signatureDrawing]);

  // Handle ink color change dynamically
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.strokeStyle = getInkHex();
    }
  }, [inkColor]);

  // Handle pen width change dynamically
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.lineWidth = penWidth;
    }
  }, [penWidth]);

  // Coordinate retrieval helpers
  const getCoordinates = (e: React.MouseEvent | React.TouchEvent): { x: number; y: number } | null => {
    const canvas = canvasRef.current;
    if (!canvas) return null;

    const rect = canvas.getBoundingClientRect();

    if ('touches' in e) {
      if (e.touches.length === 0) return null;
      return {
        x: e.touches[0].clientX - rect.left,
        y: e.touches[0].clientY - rect.top,
      };
    } else {
      return {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      };
    }
  };

  // Drawing Actions
  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const coords = getCoordinates(e);
    if (!coords) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.beginPath();
    ctx.moveTo(coords.x, coords.y);
    setIsDrawing(true);
    setHasDrawn(true);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    e.preventDefault();

    const coords = getCoordinates(e);
    if (!coords) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.lineTo(coords.x, coords.y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    if (!isDrawing) return;
    setIsDrawing(false);

    // Save state to parent component as data URL
    const canvas = canvasRef.current;
    if (canvas) {
      const dataUrl = canvas.toDataURL('image/png');
      onChange(dataUrl);
    }
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    ctx.clearRect(0, 0, rect.width, rect.height);
    setHasDrawn(false);
    onChange(null);
  };

  return (
    <div className="space-y-3" ref={containerRef}>
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-bold text-neutral-500 uppercase tracking-wider flex items-center gap-1">
          <Edit2 className="w-3 h-3 text-neutral-400" /> Draw Your Signature
        </span>
        {hasDrawn && (
          <button
            type="button"
            onClick={clearCanvas}
            className="text-[10px] text-red-600 hover:text-red-700 font-bold flex items-center gap-1 transition-colors px-2 py-1 rounded hover:bg-red-50"
          >
            <Trash2 className="w-3 h-3" /> Clear Ink
          </button>
        )}
      </div>

      {/* Signature Canvas Container */}
      <div className="relative border border-neutral-200 bg-neutral-50 rounded-xl overflow-hidden shadow-inner h-32 flex flex-col justify-between">
        {/* Draw Area */}
        <canvas
          ref={canvasRef}
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
          onTouchStart={startDrawing}
          onTouchMove={draw}
          onTouchEnd={stopDrawing}
          className="absolute inset-0 w-full h-full cursor-crosshair touch-none"
        />

        {/* Ink guideline */}
        {!hasDrawn && (
          <div className="absolute inset-x-4 bottom-8 border-t border-dashed border-neutral-300 pointer-events-none flex justify-center">
            <span className="text-[10px] text-neutral-400 font-semibold bg-neutral-50 px-2 -translate-y-1.5 uppercase tracking-wide">
              Sign Above the line
            </span>
          </div>
        )}
      </div>

      {/* Controls & Configuration Bar */}
      <div className="flex items-center justify-between gap-3 bg-neutral-50 p-2 rounded-lg border border-neutral-200">
        {/* Pen Ink colors */}
        <div className="flex items-center gap-1.5">
          <span className="text-[9px] font-bold text-neutral-500 uppercase">Ink:</span>
          <div className="flex gap-1 bg-white p-0.5 rounded-md border border-neutral-200 shadow-sm">
            <button
              type="button"
              onClick={() => setInkColor('accent')}
              className={`w-4 h-4 rounded-full border transition-transform ${
                inkColor === 'accent' ? 'scale-110 border-neutral-800' : 'border-transparent'
              }`}
              style={{ backgroundColor: accentColor || '#B33A2E' }}
              title="Theme Accent Ink"
            />
            <button
              type="button"
              onClick={() => setInkColor('black')}
              className={`w-4 h-4 rounded-full border bg-neutral-900 transition-transform ${
                inkColor === 'black' ? 'scale-110 border-neutral-800' : 'border-transparent'
              }`}
              title="Midnight Black Ink"
            />
            <button
              type="button"
              onClick={() => setInkColor('blue')}
              className={`w-4 h-4 rounded-full border bg-blue-900 transition-transform ${
                inkColor === 'blue' ? 'scale-110 border-neutral-800' : 'border-transparent'
              }`}
              title="Royal Blue Ink"
            />
          </div>
        </div>

        {/* Thickness selection */}
        <div className="flex items-center gap-1.5">
          <span className="text-[9px] font-bold text-neutral-500 uppercase">Pen:</span>
          <div className="flex gap-1 bg-white p-0.5 rounded-md border border-neutral-200 shadow-sm">
            {([1.5, 3, 5] as const).map((w) => (
              <button
                key={w}
                type="button"
                onClick={() => setPenWidth(w)}
                className={`px-1.5 py-0.5 text-[9px] font-extrabold rounded ${
                  penWidth === w ? 'bg-neutral-800 text-white' : 'text-neutral-500 hover:text-neutral-700'
                }`}
              >
                {w === 1.5 ? 'Fine' : w === 3 ? 'Medium' : 'Thick'}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
