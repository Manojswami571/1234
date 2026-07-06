import { CardTheme, GreetingCardData } from './types';

export const THEMES: CardTheme[] = [
  {
    id: 'vintage-kraft',
    name: 'Vintage Kraft',
    accent: '#B33A2E', // Brick Red
    bg: '#F3E9D8',     // Warm Parchment Dim
    cardBg: '#FAF3E6', // Warm Paper Light
    textColor: '#2B1B14',
    mutedTextColor: '#6b5648',
    fontHeading: '"Fredoka", sans-serif',
    fontBody: '"Caveat", cursive',
    description: 'Nostalgic warm parchment, charcoal ink, and rich brick red.',
    previewColors: ['#B33A2E', '#FAF3E6', '#2B1B14']
  },
  {
    id: 'cosmic-lavender',
    name: 'Cosmic Dreams',
    accent: '#7A4FA3', // Royal Purple
    bg: '#EAE5F3',     // Soft Lavender Dim
    cardBg: '#F5F2F9', // Clean light violet
    textColor: '#1E122C',
    mutedTextColor: '#5F5170',
    fontHeading: '"Fredoka", sans-serif',
    fontBody: '"Inter", sans-serif',
    description: 'Ethereal lavender tones with starry deep violet headings.',
    previewColors: ['#7A4FA3', '#F5F2F9', '#1E122C']
  },
  {
    id: 'emerald-mint',
    name: 'Mint Garden',
    accent: '#2E7D6B', // Forest Emerald
    bg: '#E2ECE9',     // Cool Sage Dim
    cardBg: '#EEF5F3', // Light Mint
    textColor: '#102A24',
    mutedTextColor: '#4D6B63',
    fontHeading: '"Fredoka", sans-serif',
    fontBody: '"Caveat", cursive',
    description: 'Fresh botanical sage, evergreen accents, and elegant scripts.',
    previewColors: ['#2E7D6B', '#EEF5F3', '#102A24']
  },
  {
    id: 'sunset-gold',
    name: 'Sunset Gold',
    accent: '#C9973F', // Warm Amber Gold
    bg: '#F5EEDA',     // Peach Sandy Dim
    cardBg: '#FDFBF7', // Sunny Cream
    textColor: '#3A2C18',
    mutedTextColor: '#8C7456',
    fontHeading: '"Fredoka", sans-serif',
    fontBody: '"Caveat", cursive',
    description: 'Cozy golden hour hues with toasted amber text.',
    previewColors: ['#C9973F', '#FDFBF7', '#3A2C18']
  },
  {
    id: 'bubblegum-joy',
    name: 'Bubblegum Spark',
    accent: '#E7A79A', // Pastel Rose
    bg: '#FDF2F0',     // Soft Pink Dim
    cardBg: '#FFFFFF', // Crisp White
    textColor: '#2E1E1B',
    mutedTextColor: '#7D6360',
    fontHeading: '"Fredoka", sans-serif',
    fontBody: '"Inter", sans-serif',
    description: 'Bright cheerful pastels, sweet rose accents, and playful vibe.',
    previewColors: ['#E7A79A', '#FFFFFF', '#2E1E1B']
  },
  {
    id: 'ocean-breeze',
    name: 'Ocean Breeze',
    accent: '#4A5FB3', // Slate Blue
    bg: '#E8EDF5',     // Foggy Blue Dim
    cardBg: '#F3F6FA', // Sea Foam White
    textColor: '#111E3D',
    mutedTextColor: '#526085',
    fontHeading: '"Fredoka", sans-serif',
    fontBody: '"Inter", sans-serif',
    description: 'Soothing marine elements with deep navy typography.',
    previewColors: ['#4A5FB3', '#F3F6FA', '#111E3D']
  },
  {
    id: 'cosmic-slate',
    name: 'Cosmic Slate',
    accent: '#38BDF8', // Sky Blue
    bg: '#0F172A',     // Slate 900
    cardBg: '#1E293B', // Slate 800
    textColor: '#F8FAFC', // Slate 50
    mutedTextColor: '#94A3B8', // Slate 400
    fontHeading: '"Space Grotesk", sans-serif',
    fontBody: '"Inter", sans-serif',
    description: 'Futuristic glowing space theme with starry blue accents & deep slate canvas.',
    previewColors: ['#38BDF8', '#1E293B', '#F8FAFC']
  },
  {
    id: 'sakura-blossom',
    name: 'Sakura Blossom',
    accent: '#DB2777', // Rose Pink
    bg: '#FFF1F2',     // Rose 50
    cardBg: '#FFFFFF', // Pure White
    textColor: '#4C0519', // Dark burgundy
    mutedTextColor: '#9F1239',
    fontHeading: '"Playfair Display", serif',
    fontBody: '"Caveat", cursive',
    description: 'Romantic cherry blossom aesthetic with timeless calligraphic elegance.',
    previewColors: ['#DB2777', '#FFFFFF', '#4C0519']
  },
  {
    id: 'retro-terminal',
    name: 'Hacker Terminal',
    accent: '#22C55E', // Green 500
    bg: '#050B06',     // Dark green black
    cardBg: '#0C1A0D', // Slightly lighter dark green
    textColor: '#4ADE80', // Light Green text
    mutedTextColor: '#15803D',
    fontHeading: '"Space Grotesk", sans-serif',
    fontBody: '"JetBrains Mono", monospace',
    description: 'A charming retro computing aesthetic with neon green cyber styling.',
    previewColors: ['#22C55E', '#0C1A0D', '#4ADE80']
  },
  {
    id: 'cozy-autumn',
    name: 'Cozy Autumn',
    accent: '#EA580C', // Rust Orange
    bg: '#FEF3C7',     // Amber 100
    cardBg: '#FFFBEB', // Amber 50
    textColor: '#451A03', // Deep brown
    mutedTextColor: '#78350F',
    fontHeading: '"Fredoka", sans-serif',
    fontBody: '"Caveat", cursive',
    description: 'Spiced pumpkin lattes, rustic crisp leaves, and warm golden hues.',
    previewColors: ['#EA580C', '#FFFBEB', '#451A03']
  },
  {
    id: 'royal-velvet',
    name: 'Royal Velvet',
    accent: '#F59E0B', // Amber Gold
    bg: '#2E1065',     // Violet 950
    cardBg: '#3B0764', // Violet 900
    textColor: '#FDF4FF', // Violet 50
    mutedTextColor: '#D8B4FE',
    fontHeading: '"Playfair Display", serif',
    fontBody: '"Inter", sans-serif',
    description: 'A highly regal palette blending rich imperial velvet with luxurious golden ink.',
    previewColors: ['#F59E0B', '#3B0764', '#FDF4FF']
  },
  {
    id: 'pretty-night',
    name: 'Pretty Night 🖤',
    accent: '#FBBF24', // Amber/Yellow Gold
    bg: '#121212',     // Very dark grainy charcoal/black
    cardBg: '#1A1A1A', // Card charcoal
    textColor: '#FFFFFF', // High-contrast white ink
    mutedTextColor: '#A3A3A3',
    fontHeading: '"Space Grotesk", sans-serif',
    fontBody: '"Caveat", cursive',
    description: 'A moody, retro-inspired aesthetic celebrating pretty nights & black-and-white dreams.',
    previewColors: ['#FBBF24', '#1A1A1A', '#FFFFFF']
  }
];

export const DEFAULT_CARD_DATA: GreetingCardData = {
  id: 'default-card-1',
  name: 'Birthday card for favorite person',
  passcode: '1206',
  themeId: 'vintage-kraft',

  // Page 2: Favorite Person
  favoritePhoto: null, // fallback in render
  favoriteQuote: 'You make the world a little brighter, a little warmer, and a whole lot louder in the best way.',
  favoritePhotoFit: 'cover',
  favoritePhotoFilter: 'none',

  // Page 3: Memories
  memoryCaption: 'our favorite days',
  memoryPhotos: [null, null, null, null],
  memoryPhotosFit: ['cover', 'cover', 'cover', 'cover'],
  memoryWishes: ['Joy & Laughter', 'Adventures Together', 'Quiet Cozy Afternoons', 'To many more years!'],

  // Page 4: Make a Wish
  age: 6,
  wishText: 'Close your eyes, make a silent wish, and tap below to blow out the candles!',

  // Page 5: Big Reveal
  headline: 'Happy Birthday, My Favorite Human!',
  headlinePhoto: null,
  headlinePhotoFit: 'cover',

  // Page 6: Handwritten Letter
  noteText: 'Happy birthday! Grateful for every late-night conversation, every spontaneous adventure, and all the quiet moments in between. You mean the absolute world to me, and I hope this year brings you as much happiness as you bring to everyone around you.',
  notePhoto: null,
  notePhotoFit: 'cover',

  // Page 7: Sign-off
  finalMessage: "Here's to another spectacular trip around the sun together.",
  senderName: 'Sam',
  recipientName: 'Alex',
  signatureDrawing: null,
  wishAnimationStyle: 'fade',
  musicTrackId: 'none',
  musicTrackUrl: null,
  musicTrackName: null,

  // Custom colors matching 'vintage-kraft'
  customAccentColor: '#B33A2E',
  customBgColor: '#F3E9D8',
  customCardColor: '#FAF3E6',
  customTextColor: '#2B1B14',
  customFontHeading: '"Fredoka", sans-serif',
  customFontBody: '"Caveat", cursive',
  customBgImage: null,
};
