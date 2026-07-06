import { GreetingCardData } from './types';
import { THEMES } from './data';

// Fallback images
export const PLACEHOLDERS = {
  favorite: 'https://images.unsplash.com/photo-1518199266791-5375a83190b7?auto=format&fit=crop&w=600&q=80', // cozy couple/warm
  memories: [
    'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?auto=format&fit=crop&w=400&q=80', // sparklers
    'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=400&q=80', // smiling friends
    'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=400&q=80', // laughter
    'https://images.unsplash.com/photo-1511285560929-80b456fea0bc?auto=format&fit=crop&w=400&q=80', // Polaroid sunset
  ],
  headline: 'https://images.unsplash.com/photo-1530103862676-de8c9debad1d?auto=format&fit=crop&w=800&q=80', // balloons/party
  note: 'https://images.unsplash.com/photo-1513151233558-d860c5398176?auto=format&fit=crop&w=500&q=80', // confetti card
};

// LocalStorage helpers
const STORAGE_KEY_PREFIX = 'dear-you-cards-';

export function saveCardToLocal(card: GreetingCardData) {
  localStorage.setItem(`${STORAGE_KEY_PREFIX}${card.id}`, JSON.stringify(card));
}

export function loadCardFromLocal(id: string): GreetingCardData | null {
  const item = localStorage.getItem(`${STORAGE_KEY_PREFIX}${id}`);
  if (!item) return null;
  try {
    return JSON.parse(item);
  } catch {
    return null;
  }
}

export function listLocalCards(): { id: string; name: string; date: string }[] {
  const cards = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && key.startsWith(STORAGE_KEY_PREFIX)) {
      try {
        const item = JSON.parse(localStorage.getItem(key) || '');
        cards.push({
          id: item.id || key.replace(STORAGE_KEY_PREFIX, ''),
          name: item.name || 'Untitled Card',
          date: new Date().toLocaleDateString()
        });
      } catch {
        // ignore bad items
      }
    }
  }
  return cards;
}

export function deleteLocalCard(id: string) {
  localStorage.removeItem(`${STORAGE_KEY_PREFIX}${id}`);
}

// Compact state URL compression (Base64 JSON)
export function encodeCardToURL(card: GreetingCardData): string {
  // To avoid huge URLs when photos are heavy, we only include smaller items or we warn users
  // We strip base64 if it exceeds 100KB for shareable URL, or keep it if small
  const copy = { ...card };
  
  // Strip large images to keep shareable URL lightweight
  if (copy.favoritePhoto && copy.favoritePhoto.length > 20000) copy.favoritePhoto = null;
  if (copy.headlinePhoto && copy.headlinePhoto.length > 20000) copy.headlinePhoto = null;
  if (copy.notePhoto && copy.notePhoto.length > 20000) copy.notePhoto = null;
  copy.memoryPhotos = copy.memoryPhotos.map(p => (p && p.length > 20000) ? null : p);

  // Strip heavy custom signature drawings and custom audio URLs
  if (copy.signatureDrawing && copy.signatureDrawing.length > 10000) {
    copy.signatureDrawing = null;
  }
  if (copy.musicTrackUrl && copy.musicTrackUrl.length > 10000) {
    copy.musicTrackUrl = null;
    copy.musicTrackId = 'none';
    copy.musicTrackName = null;
  }

  try {
    const json = JSON.stringify(copy);
    return btoa(encodeURIComponent(json));
  } catch (e) {
    return '';
  }
}

export function decodeCardFromURL(hash: string): GreetingCardData | null {
  try {
    const json = decodeURIComponent(atob(hash));
    return JSON.parse(json);
  } catch {
    return null;
  }
}

/**
 * Compiles a completely self-contained interactive HTML file representing the greeting card.
 * All uploaded photos are stored as Base64 data strings.
 * Includes complete UI, CSS, mobile frame, passcode locking, candle blowing, and page flip logic.
 */
export function exportToStandaloneHTML(card: GreetingCardData): string {
  const selectedTheme = THEMES.find(t => t.id === card.themeId) || THEMES[0];
  
  const accentColor = card.customAccentColor || selectedTheme.accent;
  const bgColor = card.customBgColor || selectedTheme.bg;
  const cardBgColor = card.customCardColor || selectedTheme.cardBg;
  const textColor = card.customTextColor || selectedTheme.textColor;
  const fontHeading = card.customFontHeading || selectedTheme.fontHeading;
  const fontBody = card.customFontBody || selectedTheme.fontBody;

  const favPhoto = card.favoritePhoto || PLACEHOLDERS.favorite;
  const mPhotos = card.memoryPhotos.map((p, i) => p || PLACEHOLDERS.memories[i]);
  const hPhoto = card.headlinePhoto || PLACEHOLDERS.headline;
  const nPhoto = card.notePhoto || PLACEHOLDERS.note;

  // Render the standalone HTML page
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>A Card For You: ${escapeHTML(card.recipientName || 'You')}</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Fredoka:wght@500;600;700&family=Caveat:wght@500;600;700&family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
<script src="https://cdn.jsdelivr.net/npm/canvas-confetti@1.6.0/dist/confetti.browser.min.js"></script>
<style>
  :root {
    --accent: ${accentColor};
    --bg-color: ${bgColor};
    --card-bg: ${cardBgColor};
    --text-color: ${textColor};
    --line: rgba(43, 27, 20, 0.1);
  }
  * { box-sizing: border-box; }
  body {
    margin: 0; padding: 0;
    background: radial-gradient(circle at 10% 10%, #ffffff 0%, transparent 45%), var(--bg-color);
    font-family: 'Inter', sans-serif;
    color: var(--text-color);
    min-height: 100vh;
    display: flex; align-items: center; justify-content: center;
    overflow-x: hidden;
  }
  
  .container {
    width: 100%; max-width: 400px;
    padding: 16px; display: flex; flex-direction: column; align-items: center;
  }

  .phone {
    width: 100%; max-width: 360px; height: 680px;
    background: #12100e; border-radius: 44px; padding: 14px;
    box-shadow: 0 25px 60px rgba(0,0,0,0.4); position: relative;
  }
  .phone-notch {
    position: absolute; top: 14px; left: 50%; transform: translateX(-50%);
    width: 110px; height: 22px; background: #12100e; border-radius: 0 0 16px 16px; z-index: 20;
  }
  .phone-screen {
    width: 100%; height: 100%; border-radius: 32px; overflow: hidden; position: relative;
    background: var(--accent); display: flex; flex-direction: column;
  }

  .tab-strip {
    position: absolute; top: 12px; left: 12px; right: 12px; z-index: 15;
    display: flex; gap: 4px; overflow-x: auto; scrollbar-width: none;
  }
  .tab-strip::-webkit-scrollbar { display: none; }
  .tab-chip {
    flex: 1 1 auto; font-size: 8px; font-weight: 700; color: rgba(255,255,255,0.4);
    background: rgba(255,255,255,0.1); padding: 4px 6px; border-radius: 6px;
    text-align: center; white-space: nowrap; transition: background 0.3s, color 0.3s;
  }
  .tab-chip.active { background: #fff; color: var(--accent); }

  .page-counter {
    position: absolute; top: 40px; right: 18px; z-index: 15;
    font-size: 10px; color: rgba(255,255,255,0.65); font-weight: 600;
  }

  .card-page {
    position: absolute; inset: 0; padding: 60px 24px 74px;
    display: flex; flex-direction: column; align-items: center; justify-content: center;
    text-align: center; color: #fff; opacity: 0; pointer-events: none;
    transition: opacity 0.4s ease, transform 0.4s ease; transform: scale(0.95);
  }
  .card-page.active { opacity: 1; pointer-events: auto; transform: scale(1); }

  .kicker {
    font-family: ${fontHeading}; font-weight: 600; font-size: 20px;
    line-height: 1.3; margin-bottom: 16px; text-shadow: 0 2px 4px rgba(0,0,0,0.15);
  }

  /* Page 1: Cover lock */
  .envelope {
    width: 160px; height: 110px; position: relative; margin-bottom: 24px;
    cursor: pointer;
  }
  .envelope-body { position: absolute; inset: 0; background: #fff; border-radius: 10px; box-shadow: 0 12px 28px rgba(0,0,0,0.3); }
  .envelope-flap {
    position: absolute; top: 0; left: 0; right: 0; height: 50%; background: #eae1d0;
    clip-path: polygon(0 0, 100% 0, 50% 100%); transform-origin: top center;
    transition: transform 0.6s ease; border-radius: 10px 10px 0 0; z-index: 5;
  }
  .envelope.open .envelope-flap { transform: rotateX(150deg); }
  .seal {
    position: absolute; top: 40%; left: 50%; transform: translate(-50%, -50%);
    width: 38px; height: 38px; border-radius: 50%; background: #C9973F;
    box-shadow: 0 4px 12px rgba(0,0,0,0.35); display: flex; align-items: center; justify-content: center;
    font-size: 16px; color: #fff; z-index: 10; transition: opacity 0.3s, transform 0.3s;
  }
  .envelope.open .seal { opacity: 0; transform: translate(-50%, -50%) scale(0.5); }

  /* Page 2: Pin Pad */
  .keypad { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; margin-top: 20px; width: 190px; }
  .key {
    background: rgba(255, 255, 255, 0.9); color: #2B1B14; border: none; border-radius: 12px;
    padding: 10px 0; font-family: ${fontHeading}; font-weight: 600; font-size: 16px; cursor: pointer;
    box-shadow: 0 2px 5px rgba(0,0,0,0.1); transition: background 0.1s, transform 0.1s;
  }
  .key:active { transform: scale(0.93); background: #eee; }
  .code-dots { display: flex; gap: 10px; margin: 16px 0 8px; }
  .code-dot { width: 14px; height: 14px; border-radius: 50%; border: 2.5px solid #fff; background: transparent; transition: background 0.2s; }
  .code-dot.filled { background: #fff; }
  .code-err { font-size: 12px; color: #ffd6cc; height: 16px; margin-top: 4px; font-weight: 600; }

  /* Page 3: Favorite Person */
  .frame-photo {
    width: 170px; height: 210px; border-radius: 50% / 40%; object-fit: ${card.favoritePhotoFit};
    border: 8px solid rgba(255,255,255,0.9); box-shadow: 0 12px 28px rgba(0,0,0,0.3);
    background: rgba(255,255,255,0.1);
  }
  .quote-chip {
    background: var(--card-bg); color: var(--text-color); font-family: ${fontBody}; font-size: 18px; font-weight: 600;
    padding: 10px 16px; border-radius: 12px; margin-top: 18px; max-width: 240px;
    box-shadow: 0 6px 16px rgba(0,0,0,0.18); line-height: 1.3;
  }

  /* Page 4: Memories */
  .memory-caption { font-family: ${fontBody}; font-size: 28px; font-weight: 700; margin-bottom: 12px; }
  .memory-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 10.5px; width: 100%; max-width: 240px; }
  .mpol {
    background: #fff; padding: 6px 6px 10px 6px; border-radius: 8px; box-shadow: 0 6px 16px rgba(0,0,0,0.22);
    display: flex; flex-direction: column; align-items: center; justify-content: space-between;
    border: 1px solid rgba(0,0,0,0.06); text-align: center;
  }
  .mpol-img {
    aspect-ratio: 1; width: 100%; border-radius: 6px; object-fit: cover; background: #eee;
  }
  .mpol-wish {
    font-family: ${fontBody}; font-size: 11px; font-weight: 700; color: #1a1a1a;
    margin-top: 6px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 95px;
  }

  /* Page 5: Cake and wish */
  .cake-wrap { cursor: pointer; display: flex; flex-direction: column; align-items: center; margin-top: 20px; }
  .candles { display: flex; gap: 5px; margin-bottom: -4px; justify-content: center; }
  .candle { width: 6px; height: 32px; background: #fff; border-radius: 2px; position: relative; }
  .flame {
    position: absolute; top: -14px; left: 50%; transform: translateX(-50%);
    width: 10px; height: 16px; border-radius: 50% 50% 50% 50%/60% 60% 40% 40%;
    background: radial-gradient(circle at 50% 70%, #fff59a, #ffb347 60%, #ff7a3d);
    transition: opacity 0.4s ease, transform 0.4s ease;
  }
  .flame.out { opacity: 0; transform: translateX(-50%) scaleY(0.1); }
  .cake-body {
    width: 170px; height: 74px; background: #fff; border-radius: 16px 16px 36px 36px;
    position: relative; box-shadow: 0 10px 24px rgba(0,0,0,0.22);
  }
  .cake-body::before {
    content: ''; position: absolute; top: -8px; left: 0; right: 0; height: 18px;
    background: #fff; border-radius: 10px; opacity: 0.9;
  }
  .blow-hint { font-size: 13px; margin-top: 20px; color: rgba(255,255,255,0.9); font-weight: 600; text-shadow: 0 1px 2px rgba(0,0,0,0.2); }

  /* Page 6: Big Reveal Photo */
  .headline-photo {
    width: 100%; max-width: 240px; height: 140px; object-fit: ${card.headlinePhotoFit}; border-radius: 16px; margin-top: 14px;
    box-shadow: 0 10px 24px rgba(0,0,0,0.3); border: 4px solid rgba(255,255,255,0.7);
  }

  /* Page 7: Handwritten note */
  .note-paper {
    background: #fdf9ef; color: #2B1B14; border-radius: 12px; padding: 22px 18px;
    width: 100%; max-width: 260px; box-shadow: 0 12px 28px rgba(0,0,0,0.3); transform: rotate(-1.5deg);
    font-family: ${fontBody}; font-size: 19px; line-height: 1.4; font-weight: 600;
    position: relative; text-align: left;
  }
  .note-paper::before {
    content: ''; position: absolute; top: -10px; left: 50%; transform: translateX(-50%) rotate(2deg);
    width: 60px; height: 20px; background: rgba(201,151,63,0.45);
  }
  .note-photo {
    width: 80px; height: 80px; object-fit: ${card.notePhotoFit}; border-radius: 8px;
    float: right; margin-left: 10px; margin-bottom: 5px; border: 3px solid #fff; box-shadow: 0 4px 10px rgba(0,0,0,0.18);
  }

  /* Page 8: Sign-off Outro */
  .sign-off { font-family: ${fontBody}; font-size: 26px; margin-top: 12px; font-weight: 700; text-align: right; width: 100%; max-width: 240px; }
  .hand-signature-container {
    margin-top: 8px; background: #fff; padding: 4px 10px; border-radius: 6px;
    box-shadow: 0 4px 10px rgba(0,0,0,0.15); display: inline-block; transform: rotate(-1deg);
    border: 1px solid rgba(0,0,0,0.06); max-width: 150px;
  }
  .hand-signature-img {
    height: 36px; object-fit: contain; display: block; mix-blend-mode: multiply; margin: 0 auto;
  }

  /* Action buttons */
  .next-pill {
    position: absolute; bottom: 20px; right: 20px; z-index: 15;
    background: #fff; color: var(--accent); border: none; padding: 10px 20px; border-radius: 999px;
    font-family: ${fontHeading}; font-weight: 700; font-size: 14px; cursor: pointer;
    display: flex; align-items: center; gap: 6px; box-shadow: 0 8px 18px rgba(0,0,0,0.25);
    transition: transform 0.2s, background 0.2s;
  }
  .next-pill:hover { transform: translateY(-1px); background: #fefefe; }
  .next-pill:active { transform: translateY(1px); }

  .prev-pill {
    position: absolute; bottom: 20px; left: 20px; z-index: 15;
    background: rgba(255,255,255,0.2); color: #fff; border: none; padding: 10px 18px; border-radius: 999px;
    font-family: 'Inter', sans-serif; font-weight: 600; font-size: 13px; cursor: pointer;
    transition: background 0.2s;
  }
  .prev-pill:hover { background: rgba(255,255,255,0.3); }

  .signature {
    text-align: center; margin-top: 24px; font-size: 11px; color: rgba(255,255,255,0.4);
    letter-spacing: 1px; text-transform: uppercase;
  }

  /* Custom entrance animation styles */
  .animated-text {
    opacity: 0;
    transition: opacity 0.5s ease, transform 0.5s ease;
  }
  
  /* Fade Style */
  .anim-fade .animated-text {
    transform: translateY(12px);
  }
  .active.anim-fade .animated-text {
    opacity: 1;
    transform: translateY(0);
  }

  /* Bounce Style */
  .anim-bounce .animated-text {
    transform: translateY(22px) scale(0.85);
    transition: opacity 0.7s cubic-bezier(0.34, 1.56, 0.64, 1), transform 0.7s cubic-bezier(0.34, 1.56, 0.64, 1);
  }
  .active.anim-bounce .animated-text {
    opacity: 1;
    transform: translateY(0) scale(1);
  }

  /* Typewriter style hides text or manages opacity when starting */
  .anim-typewriter .animated-text {
    opacity: 1;
  }

  /* Floating background music button style */
  .music-btn {
    position: absolute; top: 52px; left: 16px; z-index: 35;
    display: flex; align-items: center; gap: 6px;
    background: rgba(0,0,0,0.25); backdrop-filter: blur(4px); -webkit-backdrop-filter: blur(4px);
    color: #fff; border: 1px solid rgba(255,255,255,0.1); padding: 4px 10px; border-radius: 999px;
    font-family: 'Inter', sans-serif; font-weight: 700; font-size: 10px; cursor: pointer;
    box-shadow: 0 2px 6px rgba(0,0,0,0.15); transition: background 0.2s, transform 0.2s;
  }
  .music-btn:hover { background: rgba(0,0,0,0.35); transform: scale(1.02); }
  .music-btn:active { transform: scale(0.98); }
  .music-btn .status-badge {
    font-size: 8px; background: rgba(255,255,255,0.18); padding: 1.5px 5px; border-radius: 4px; font-weight: 900; text-transform: uppercase;
  }
</style>
</head>
<body>

<div class="container">
  <div class="phone">
    <div class="phone-notch"></div>
    <div class="phone-screen" id="screen">
      
      <!-- Background Music Controls -->
      ${card.musicTrackId && card.musicTrackId !== 'none' ? `
        <button class="music-btn" id="musicBtn">
          <span id="musicIcon">🔇</span>
          <span id="musicName" style="max-width: 80px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
            ${card.musicTrackId === 'custom' ? (escapeHTML(card.musicTrackName || 'Custom sound')) : (card.musicTrackId === 'birthday' ? 'Birthday Music' : 'Ambient Track')}
          </span>
          <span class="status-badge" id="musicStatus">PLAY</span>
        </button>
      ` : ''}
      
      <!-- Tab dots -->
      <div class="tab-strip" id="tabStrip">
        ${Array.from({ length: 8 }).map((_, i) => `<div class="tab-chip" id="tab-${i}">Page ${i + 1}</div>`).join('')}
      </div>

      <div class="page-counter" id="pageCounter">1 / 8</div>

      <!-- PAGE 0: Envelope Cover -->
      <div class="card-page active" id="page-0">
        <div class="envelope" id="envelope">
          <div class="envelope-body"></div>
          <div class="seal">💌</div>
          <div class="envelope-flap"></div>
        </div>
        <div class="kicker">A little something<br>special for you</div>
        <div class="blow-hint">Tap the envelope to open</div>
      </div>

      <!-- PAGE 1: Pin Pad Gate -->
      <div class="card-page" id="page-1">
        <div class="kicker">Enter your passcode</div>
        <div class="code-dots" id="codeDots">
          <div class="code-dot"></div>
          <div class="code-dot"></div>
          <div class="code-dot"></div>
          <div class="code-dot"></div>
        </div>
        <div class="code-err" id="codeErr"></div>
        <div class="keypad" id="keypad">
          <button class="key" data-val="1">1</button>
          <button class="key" data-val="2">2</button>
          <button class="key" data-val="3">3</button>
          <button class="key" data-val="4">4</button>
          <button class="key" data-val="5">5</button>
          <button class="key" data-val="6">6</button>
          <button class="key" data-val="7">7</button>
          <button class="key" data-val="8">8</button>
          <button class="key" data-val="9">9</button>
          <button class="key" data-val="⌫">⌫</button>
          <button class="key" data-val="0">0</button>
          <button class="key" data-val="✓">✓</button>
        </div>
      </div>

      <!-- PAGE 2: Favorite Person -->
      <div class="card-page anim-${card.wishAnimationStyle || 'fade'}" id="page-2">
        <div class="kicker">To My Favorite Person</div>
        <img class="frame-photo" src="${favPhoto}" style="filter: ${getFilterStyle(card.favoritePhotoFilter)};">
        <div class="quote-chip animated-text" data-text="&quot;${escapeHTML(card.favoriteQuote)}&quot;">"${escapeHTML(card.favoriteQuote)}"</div>
      </div>

      <!-- PAGE 3: Our Memories -->
      <div class="card-page anim-${card.wishAnimationStyle || 'fade'}" id="page-3">
        <div class="kicker">Beautiful Memories</div>
        <div class="memory-caption animated-text" data-text="${escapeHTML(card.memoryCaption)}">${escapeHTML(card.memoryCaption)}</div>
        <div class="memory-grid">
          <div class="mpol" style="transform: rotate(-1.5deg);">
            <img class="mpol-img" src="${mPhotos[0]}">
            <div class="mpol-wish animated-text" data-text="${escapeHTML(card.memoryWishes?.[0] || '✨')}">${escapeHTML(card.memoryWishes?.[0] || '✨')}</div>
          </div>
          <div class="mpol" style="transform: rotate(1.5deg);">
            <img class="mpol-img" src="${mPhotos[1]}">
            <div class="mpol-wish animated-text" data-text="${escapeHTML(card.memoryWishes?.[1] || '✨')}">${escapeHTML(card.memoryWishes?.[1] || '✨')}</div>
          </div>
          <div class="mpol" style="transform: rotate(-1deg);">
            <img class="mpol-img" src="${mPhotos[2]}">
            <div class="mpol-wish animated-text" data-text="${escapeHTML(card.memoryWishes?.[2] || '✨')}">${escapeHTML(card.memoryWishes?.[2] || '✨')}</div>
          </div>
          <div class="mpol" style="transform: rotate(1.2deg);">
            <img class="mpol-img" src="${mPhotos[3]}">
            <div class="mpol-wish animated-text" data-text="${escapeHTML(card.memoryWishes?.[3] || '✨')}">${escapeHTML(card.memoryWishes?.[3] || '✨')}</div>
          </div>
        </div>
      </div>

      <!-- PAGE 4: Make a Wish -->
      <div class="card-page anim-${card.wishAnimationStyle || 'fade'}" id="page-4">
        <div class="kicker">Make a Wish</div>
        <div class="cake-wrap" id="cake">
          <div class="candles">
            ${Array.from({ length: card.age }).map(() => `<div class="candle"><div class="flame"></div></div>`).join('')}
          </div>
          <div class="cake-body"></div>
        </div>
        <div class="blow-hint animated-text" id="cakeHint" data-text="${card.wishText}">${card.wishText}</div>
      </div>

      <!-- PAGE 5: Reveal Title -->
      <div class="card-page anim-${card.wishAnimationStyle || 'fade'}" id="page-5">
        <div class="kicker animated-text" data-text="${escapeHTML(card.headline)}">${escapeHTML(card.headline)}</div>
        <img class="headline-photo" src="${hPhoto}">
      </div>

      <!-- PAGE 6: Handwritten Letter -->
      <div class="card-page anim-${card.wishAnimationStyle || 'fade'}" id="page-6">
        <div class="note-paper">
          <img class="note-photo" src="${nPhoto}">
          <div class="animated-text" data-text="${escapeHTML(card.noteText)}">
            ${escapeHTML(card.noteText).replace(/\n/g, '<br>')}
          </div>
        </div>
      </div>

      <!-- PAGE 7: Sign Off Outro -->
      <div class="card-page anim-${card.wishAnimationStyle || 'fade'}" id="page-7">
        <div class="kicker animated-text" data-text="${escapeHTML(card.recipientName || 'Alex')},">${escapeHTML(card.recipientName || 'Alex')},</div>
        <div class="quote-chip animated-text" style="max-width: 250px;" data-text="&quot;${escapeHTML(card.finalMessage)}&quot;">"${escapeHTML(card.finalMessage)}"</div>
        <div class="sign-off">— ${escapeHTML(card.senderName || 'Sam')}</div>
        ${card.signatureDrawing ? `
          <div style="width: 100%; max-width: 240px; margin-top: 6px; display: flex; justify-content: flex-end;">
            <div class="hand-signature-container">
              <img class="hand-signature-img" src="${card.signatureDrawing}">
            </div>
          </div>
        ` : ''}
        <div class="signature">dear you</div>
      </div>

      <!-- Action pills -->
      <button class="prev-pill" id="prevBtn" style="display: none;">‹ back</button>
      <button class="next-pill" id="nextBtn" style="display: none;">next ›</button>

    </div>
  </div>
</div>

<script>
  const correctPasscode = "${card.passcode}";
  let currentPage = 0;
  let envelopeOpen = false;
  let enteredCode = "";
  let unlocked = false;
  let wishMade = false;

  const totalPages = 8;

  // Background Music configuration and engine
  const musicTrackId = "${card.musicTrackId || 'none'}";
  const musicTrackUrl = ${card.musicTrackUrl ? JSON.stringify(card.musicTrackUrl) : 'null'};
  let audioPlaying = false;
  let audioCtx = null;
  let synthTimeout = null;
  let audioEl = null;

  function getAudioContext() {
    if (!audioCtx) {
      audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (audioCtx.state === 'suspended') {
      audioCtx.resume();
    }
    return audioCtx;
  }

  const NOTE_FREQS = {
    'G4': 392.00, 'A4': 440.00, 'B4': 493.88, 'C5': 523.25, 'D5': 587.33, 'E5': 659.25, 'F5': 698.46, 'G5': 783.99, 'A5': 880.00
  };

  const BIRTHDAY_MELODY = [
    { note: 'G4', dur: 0.75 }, { note: 'G4', dur: 0.25 }, { note: 'A4', dur: 1.0 }, { note: 'G4', dur: 1.0 }, { note: 'C5', dur: 1.0 }, { note: 'B4', dur: 2.0 },
    { note: 'G4', dur: 0.75 }, { note: 'G4', dur: 0.25 }, { note: 'A4', dur: 1.0 }, { note: 'G4', dur: 1.0 }, { note: 'D5', dur: 1.0 }, { note: 'C5', dur: 2.0 },
    { note: 'G4', dur: 0.75 }, { note: 'G4', dur: 0.25 }, { note: 'G5', dur: 1.0 }, { note: 'E5', dur: 1.0 }, { note: 'C5', dur: 1.0 }, { note: 'B4', dur: 1.0 }, { note: 'A4', dur: 2.0 },
    { note: 'F5', dur: 0.75 }, { note: 'F5', dur: 0.25 }, { note: 'E5', dur: 1.0 }, { note: 'C5', dur: 1.0 }, { note: 'D5', dur: 1.0 }, { note: 'C5', dur: 2.5 }
  ];

  function playChime(frequency, time, duration) {
    const ctx = getAudioContext();
    const osc1 = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(frequency, time);
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(frequency * 2.01, time);

    const gain1 = ctx.createGain();
    const gain2 = ctx.createGain();

    gain1.gain.setValueAtTime(0, time);
    gain1.gain.linearRampToValueAtTime(0.18, time + 0.02);
    gain1.gain.exponentialRampToValueAtTime(0.0001, time + duration * 1.5);

    gain2.gain.setValueAtTime(0, time);
    gain2.gain.linearRampToValueAtTime(0.08, time + 0.005);
    gain2.gain.exponentialRampToValueAtTime(0.0001, time + 0.15);

    osc1.connect(gain1);
    osc2.connect(gain2);

    const delay = ctx.createDelay();
    delay.delayTime.setValueAtTime(0.28, time);
    const feedback = ctx.createGain();
    feedback.gain.setValueAtTime(0.35, time);

    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(1400, time);

    gain1.connect(ctx.destination);
    gain2.connect(ctx.destination);
    gain1.connect(delay);
    delay.connect(feedback);
    feedback.connect(delay);
    feedback.connect(filter);
    filter.connect(ctx.destination);

    osc1.start(time);
    osc2.start(time);
    osc1.stop(time + duration * 1.8);
    osc2.stop(time + duration * 1.8);
  }

  function startSynthLoop() {
    stopSynth();
    const ctx = getAudioContext();
    let nextNoteTime = ctx.currentTime + 0.1;

    function playMelodyLoop() {
      let accumTime = 0;
      BIRTHDAY_MELODY.forEach((item) => {
        const freq = NOTE_FREQS[item.note];
        const beatDuration = (60 / 120) * item.dur;
        const noteTime = nextNoteTime + accumTime;
        if (freq) {
          playChime(freq, noteTime, beatDuration);
        }
        accumTime += beatDuration;
      });

      const loopDurationSeconds = accumTime + 1.5;
      synthTimeout = setTimeout(() => {
        nextNoteTime = ctx.currentTime;
        playMelodyLoop();
      }, loopDurationSeconds * 1000);
    }

    playMelodyLoop();
  }

  function stopSynth() {
    if (synthTimeout) {
      clearTimeout(synthTimeout);
      synthTimeout = null;
    }
  }

  function startAudioElement(url) {
    stopAudioElement();
    audioEl = new Audio(url);
    audioEl.loop = true;
    audioEl.volume = 0.45;
    audioEl.play().catch(err => console.log("Autoplay blocked:", err));
  }

  function stopAudioElement() {
    if (audioEl) {
      audioEl.pause();
      audioEl.src = "";
      audioEl = null;
    }
  }

  const PRESETS = {
    lofi: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3',
    acoustic: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-8.mp3',
    ambient: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-16.mp3'
  };

  function playMusic() {
    if (musicTrackId === 'none') return;
    audioPlaying = true;
    updateMusicUI();

    if (musicTrackId === 'birthday') {
      startSynthLoop();
    } else if (musicTrackId === 'custom' && musicTrackUrl) {
      startAudioElement(musicTrackUrl);
    } else if (PRESETS[musicTrackId]) {
      startAudioElement(PRESETS[musicTrackId]);
    }
  }

  function stopMusic() {
    audioPlaying = false;
    updateMusicUI();
    stopSynth();
    stopAudioElement();
  }

  function updateMusicUI() {
    const icon = document.getElementById('musicIcon');
    const status = document.getElementById('musicStatus');
    if (!icon || !status) return;

    if (audioPlaying) {
      icon.textContent = '🔊';
      status.textContent = 'MUTE';
    } else {
      icon.textContent = '🔇';
      status.textContent = 'PLAY';
    }
  }

  // Typewriter effect function
  function runTypewriter(element, text) {
    if (element._typewriterInterval) {
      clearInterval(element._typewriterInterval);
    }
    
    // Decode HTML entities
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = text;
    const decodedText = tempDiv.textContent || tempDiv.innerText || text;

    element.innerHTML = "";
    let index = 0;
    
    const interval = setInterval(() => {
      if (index < decodedText.length) {
        const char = decodedText[index];
        if (char === "\n") {
          element.innerHTML += "<br>";
        } else {
          element.innerHTML += char === " " ? "&nbsp;" : char;
        }
        index++;
      } else {
        clearInterval(interval);
      }
    }, 25);
    
    element._typewriterInterval = interval;
  }

  function setPage(pageNum) {
    if (pageNum < 0 || pageNum >= totalPages) return;
    
    // Gating locks
    if (!unlocked && pageNum > 1) return;

    // Remove active state
    document.querySelectorAll('.card-page').forEach((p, idx) => {
      const isActive = idx === pageNum;
      p.classList.toggle('active', isActive);
      
      // Trigger typewriter typing if the card is configured for it
      if (isActive && "${card.wishAnimationStyle}" === "typewriter") {
        p.querySelectorAll('.animated-text').forEach(el => {
          const rawText = el.getAttribute('data-text');
          if (rawText) {
            runTypewriter(el, rawText);
          }
        });
      }
    });
    document.querySelectorAll('.tab-chip').forEach((t, idx) => {
      t.classList.toggle('active', idx === pageNum);
    });

    currentPage = pageNum;
    document.getElementById('pageCounter').textContent = (pageNum + 1) + " / " + totalPages;

    // Handle navigation button visibilities
    const prevBtn = document.getElementById('prevBtn');
    const nextBtn = document.getElementById('nextBtn');

    prevBtn.style.display = (pageNum > 0 && pageNum !== 1) ? 'block' : 'none';
    
    // Check if next button can be seen
    let canGoNext = true;
    if (pageNum === 0) canGoNext = false; // must tap envelope
    if (pageNum === 1 && !unlocked) canGoNext = false; // must input pin
    if (pageNum === 4 && !wishMade) canGoNext = false; // must blow candles
    if (pageNum === 7) canGoNext = false; // final page

    nextBtn.style.display = canGoNext ? 'block' : 'none';
  }

  // Cover Envelope Tap
  document.getElementById('envelope').addEventListener('click', () => {
    if (envelopeOpen) return;
    envelopeOpen = true;
    document.getElementById('envelope').classList.add('open');
    
    // Automatically attempt starting background music on first tap!
    setTimeout(() => {
      playMusic();
    }, 150);

    setTimeout(() => {
      unlocked = false;
      setPage(1);
    }, 600);
  });

  // Numeric Pin Pad Input
  document.querySelectorAll('.key').forEach(btn => {
    btn.addEventListener('click', () => {
      const val = btn.getAttribute('data-val');
      const errEl = document.getElementById('codeErr');
      errEl.textContent = "";

      if (val === "⌫") {
        enteredCode = enteredCode.slice(0, -1);
      } else if (val === "✓") {
        if (enteredCode === correctPasscode) {
          unlocked = true;
          confetti({
            particleCount: 50,
            spread: 40,
            origin: { y: 0.8 }
          });
          
          // Double check music is playing when unlocked successfully
          if (!audioPlaying) {
            playMusic();
          }

          setTimeout(() => {
            setPage(2);
          }, 400);
        } else {
          errEl.textContent = "Not quite! Try again.";
          enteredCode = "";
        }
      } else {
        if (enteredCode.length < 4) {
          enteredCode += val;
        }
      }

      // Update dots UI
      const dots = document.querySelectorAll('#codeDots .code-dot');
      dots.forEach((dot, idx) => {
        dot.classList.toggle('filled', idx < enteredCode.length);
      });
    });
  });

  // Virtual cake tapping / blow
  const cake = document.getElementById('cake');
  if (cake) {
    cake.addEventListener('click', () => {
      if (wishMade) return;
      wishMade = true;
      
      // Extinguish flames
      document.querySelectorAll('.flame').forEach(f => {
        f.classList.add('out');
      });

      const cakeHint = document.getElementById('cakeHint');
      const newText = "Your wish has been cast! ✨";
      if ("${card.wishAnimationStyle}" === "typewriter") {
        runTypewriter(cakeHint, newText);
      } else {
        cakeHint.textContent = newText;
      }

      // Massive confetti spray!
      confetti({
        particleCount: 150,
        spread: 80,
        origin: { y: 0.6 }
      });

      setTimeout(() => {
        setPage(5);
      }, 1500);
    });
  }

  // Navigation handlers
  document.getElementById('prevBtn').addEventListener('click', () => {
    setPage(currentPage - 1);
  });
  document.getElementById('nextBtn').addEventListener('click', () => {
    setPage(currentPage + 1);
  });

  // Music Button Toggle Listener
  const mBtn = document.getElementById('musicBtn');
  if (mBtn) {
    mBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      if (audioPlaying) {
        stopMusic();
      } else {
        playMusic();
      }
    });
  }

  // Initial render setup
  setPage(0);
<\/script>
</body>
</html>`;
}

function escapeHTML(str: string): string {
  if (!str) return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function getFilterStyle(filter: string): string {
  switch (filter) {
    case 'grayscale': return 'grayscale(100%)';
    case 'sepia': return 'sepia(100%)';
    case 'vintage': return 'sepia(40%) contrast(110%) saturate(120%)';
    case 'warm': return 'sepia(20%) saturate(130%)';
    default: return 'none';
  }
}
