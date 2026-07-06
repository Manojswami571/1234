export interface GreetingCardData {
  id: string;
  name: string;
  passcode: string;
  themeId: string;
  
  // Page 2: Favorite Person Page
  favoritePhoto: string | null; // base64 or placeholder URL
  favoriteQuote: string;
  favoritePhotoFit: 'cover' | 'contain' | 'fill';
  favoritePhotoFilter: 'none' | 'grayscale' | 'sepia' | 'vintage' | 'warm';

  // Page 3: Our Memories Page
  memoryCaption: string;
  memoryPhotos: (string | null)[]; // 4 photos
  memoryPhotosFit: ('cover' | 'contain')[];
  memoryWishes: string[]; // custom wish or short message with each photo

  // Page 4: Make a Wish Page
  age: number; // candle count
  wishText: string;

  // Page 5: The Big Reveal / Celebration cover
  headline: string;
  headlinePhoto: string | null;
  headlinePhotoFit: 'cover' | 'contain';

  // Page 6: Handwritten Letter
  noteText: string;
  notePhoto: string | null;
  notePhotoFit: 'cover' | 'contain';

  // Page 7: Sign-off
  finalMessage: string;
  senderName: string;
  recipientName: string;
  signatureDrawing: string | null; // base64 drawing data URL from signature canvas
  wishAnimationStyle: 'fade' | 'typewriter' | 'bounce'; // Entrance animation style for pages
  musicTrackId: 'none' | 'birthday' | 'acoustic' | 'lofi' | 'ambient' | 'custom';
  musicTrackUrl: string | null; // Base64 data URL for custom uploads
  musicTrackName: string | null; // Display name of custom upload or selected track

  // Custom styling attributes override
  customAccentColor: string;
  customBgColor: string;
  customCardColor: string;
  customTextColor: string;
  customFontHeading: string;
  customFontBody: string;
  customBgImage: string | null;
}

export interface CardTheme {
  id: string;
  name: string;
  accent: string;
  bg: string;
  cardBg: string;
  textColor: string;
  mutedTextColor: string;
  fontHeading: string;
  fontBody: string;
  description: string;
  previewColors: string[];
}
