import React, { useState, useEffect, useRef } from 'react';
import { GreetingCardData } from '../types';
import { THEMES } from '../data';
import { PLACEHOLDERS } from '../utils';
import { CardMusicPlayer, playPartyPopSound } from '../audioHelper';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ChevronLeft, ChevronRight, Lock, Key, Heart, 
  Sparkles, Gift, Mail, RefreshCw, Send, HelpCircle,
  Music, Volume2, VolumeX
} from 'lucide-react';

interface CardPreviewProps {
  cardData: GreetingCardData;
  activePage: number;
  setActivePage: (p: number) => void;
  gatedMode?: boolean; // True when showing real recipient locked simulation
}

interface AnimatedWishProps {
  key?: React.Key;
  text: string;
  style?: 'fade' | 'typewriter' | 'bounce';
  className?: string;
  fontFamily?: string;
  delay?: number;
}

function AnimatedWish({ text, style = 'fade', className = '', fontFamily, delay = 0.2 }: AnimatedWishProps) {
  const letters = Array.from(text);

  // Typewriter variants
  const containerVariants = {
    hidden: { opacity: 1 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.03,
        delayChildren: delay,
      }
    }
  };

  const letterVariants = {
    hidden: { opacity: 0, display: 'inline-block' },
    visible: {
      opacity: 1,
      display: 'inline-block',
      transition: { duration: 0.1 }
    }
  };

  // Bounce variants (staggered bounce per word)
  const bounceContainerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.05,
        delayChildren: delay,
      }
    }
  };

  const bounceWordVariants = {
    hidden: { y: 20, opacity: 0, scale: 0.8 },
    visible: {
      y: 0,
      opacity: 1,
      scale: 1,
      transition: {
        type: 'spring',
        damping: 10,
        stiffness: 150,
      }
    }
  };

  // Standard Fade In variant
  const fadeVariants = {
    hidden: { opacity: 0, y: 15 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.6,
        delay: delay,
        ease: 'easeOut',
      }
    }
  };

  if (style === 'typewriter') {
    return (
      <motion.span
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className={className}
        style={{ fontFamily }}
      >
        {letters.map((char, index) => {
          if (char === '\n') {
            return <br key={index} />;
          }
          return (
            <motion.span key={index} variants={letterVariants}>
              {char === ' ' ? '\u00A0' : char}
            </motion.span>
          );
        })}
      </motion.span>
    );
  }

  if (style === 'bounce') {
    const words = text.split(' ');
    return (
      <motion.span
        variants={bounceContainerVariants}
        initial="hidden"
        animate="visible"
        className={`inline-flex flex-wrap justify-center gap-x-1 ${className}`}
        style={{ fontFamily }}
      >
        {words.map((word, index) => (
          <motion.span
            key={index}
            variants={bounceWordVariants}
            className="inline-block"
          >
            {word}
          </motion.span>
        ))}
      </motion.span>
    );
  }

  // Fallback / default is 'fade'
  return (
    <motion.span
      variants={fadeVariants}
      initial="hidden"
      animate="visible"
      className={className}
      style={{ fontFamily }}
    >
      {text}
    </motion.span>
  );
}

interface PopperParticle {
  id: number;
  startX: number;
  startY: number;
  targetX: number;
  targetY: number;
  midX: number;
  midY: number;
  color: string;
  size: number;
  type: 'rectangle' | 'circle' | 'star' | 'emoji' | 'ribbon';
  emoji?: string;
  rotation: number;
  spinDirection: number;
  duration: number;
  delay: number;
}

export default function CardPreview({ cardData, activePage, setActivePage, gatedMode = false }: CardPreviewProps) {
  // Gated local states for passcode/opening simulation
  const [envelopeOpen, setEnvelopeOpen] = useState(false);
  const [enteredPin, setEnteredPin] = useState('');
  const [pinError, setPinError] = useState('');
  const [isUnlocked, setIsUnlocked] = useState(!gatedMode); // unlocked by default in editor mode
  const [candlesBlown, setCandlesBlown] = useState(false);
  const [confettiBurst, setConfettiBurst] = useState<{ id: number; x: number; y: number; color: string; delay: number }[]>([]);
  const [isPopping, setIsPopping] = useState(false);
  const [popperParticles, setPopperParticles] = useState<PopperParticle[]>([]);
  const [lastShotTime, setLastShotTime] = useState<number>(0);
  const [decorations, setDecorations] = useState<{ id: number; emoji: string; left: number; delay: number; duration: number; size: number; rotate: number }[]>([]);

  useEffect(() => {
    const emojis = ['🎈', '🎈', '💖', '✨', '🌸', '🌟', '🎈', '🎉', '💝', '✨', '🎈', '💖'];
    const items = Array.from({ length: 15 }).map((_, i) => ({
      id: i,
      emoji: emojis[i % emojis.length],
      left: Math.random() * 90 + 5, // 5% to 95%
      delay: Math.random() * 12, // 0s to 12s delay
      duration: 15 + Math.random() * 12, // 15s to 27s float time
      size: Math.random() * 10 + 16, // 16px to 26px size
      rotate: Math.random() * 40 - 20, // -20deg to +20deg tilt
    }));
    setDecorations(items);
  }, []);

  // Music Player logic
  const musicPlayerRef = useRef<CardMusicPlayer | null>(null);
  const [isMusicPlaying, setIsMusicPlaying] = useState(false);

  useEffect(() => {
    musicPlayerRef.current = new CardMusicPlayer();
    return () => {
      if (musicPlayerRef.current) {
        musicPlayerRef.current.stop();
      }
    };
  }, []);

  // Sync track selection
  useEffect(() => {
    if (musicPlayerRef.current) {
      musicPlayerRef.current.setTrack(cardData.musicTrackId, cardData.musicTrackUrl);
      if (isMusicPlaying) {
        musicPlayerRef.current.play();
      }
    }
  }, [cardData.musicTrackId, cardData.musicTrackUrl]);

  // Attempt auto-play when card is unlocked or when activePage moves past page 1 (envelope/passcode pages)
  useEffect(() => {
    if (isUnlocked && cardData.musicTrackId && cardData.musicTrackId !== 'none' && activePage > 1) {
      const timer = setTimeout(() => {
        if (musicPlayerRef.current && !isMusicPlaying) {
          musicPlayerRef.current.play();
          setIsMusicPlaying(true);
        }
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [isUnlocked, activePage, cardData.musicTrackId]);

  const toggleMusicPlay = () => {
    if (!musicPlayerRef.current) return;
    if (isMusicPlaying) {
      musicPlayerRef.current.stop();
      setIsMusicPlaying(false);
    } else {
      musicPlayerRef.current.play();
      setIsMusicPlaying(true);
    }
  };

  // Smooth slide-fade directional transitions
  const [prevPage, setPrevPage] = useState(activePage);
  const [direction, setDirection] = useState(1);

  if (activePage !== prevPage) {
    setDirection(activePage > prevPage ? 1 : -1);
    setPrevPage(activePage);
  }

  const pageVariants = {
    enter: (dir: number) => ({
      rotateY: dir > 0 ? 65 : -65,
      x: dir > 0 ? 40 : -40,
      opacity: 0,
      scale: 0.96,
      transformOrigin: dir > 0 ? "left center" : "right center",
    }),
    center: (dir: number) => ({
      rotateY: 0,
      x: 0,
      opacity: 1,
      scale: 1,
      transformOrigin: dir > 0 ? "left center" : "right center",
    }),
    exit: (dir: number) => ({
      rotateY: dir > 0 ? -65 : 65,
      x: dir > 0 ? -40 : 40,
      opacity: 0,
      scale: 0.96,
      transformOrigin: dir > 0 ? "left center" : "right center",
    }),
  };

  const pageTransition = {
    type: 'spring',
    stiffness: 140,
    damping: 20,
    mass: 1.1,
  };

  // Find theme
  const selectedTheme = THEMES.find(t => t.id === cardData.themeId) || THEMES[0];
  const accent = cardData.customAccentColor || selectedTheme.accent;
  const bg = cardData.customBgColor || selectedTheme.bg;
  const cardBg = cardData.customCardColor || selectedTheme.cardBg;
  const text = cardData.customTextColor || selectedTheme.textColor;
  const headingFont = cardData.customFontHeading || selectedTheme.fontHeading;
  const bodyFont = cardData.customFontBody || selectedTheme.fontBody;

  // Sync unlock state if gatedMode shifts
  useEffect(() => {
    setIsUnlocked(!gatedMode);
    if (gatedMode) {
      setEnvelopeOpen(false);
      setEnteredPin('');
      setPinError('');
      setCandlesBlown(false);
    }
  }, [gatedMode]);

  // Page limits
  const totalPages = 8; // 0 envelope, 1 passcode, 2 favorite, 3 memories, 4 wish, 5 headline, 6 note, 7 final

  const handleNext = () => {
    if (activePage < totalPages - 1) {
      setActivePage(activePage + 1);
    }
  };

  const handlePrev = () => {
    if (activePage > 0) {
      setActivePage(activePage - 1);
    }
  };

  // Envelope tap to open
  const handleEnvelopeTap = () => {
    setEnvelopeOpen(true);
    setTimeout(() => {
      setActivePage(1); // Go to passcode verification page
    }, 600);
  };

  // Virtual Pinpad entry
  const handlePinPress = (val: string) => {
    setPinError('');
    if (val === '⌫') {
      setEnteredPin(prev => prev.slice(0, -1));
    } else if (val === '✓') {
      if (enteredPin === cardData.passcode) {
        setIsUnlocked(true);
        triggerConfetti();
        setTimeout(() => {
          setActivePage(2); // Go to favorite person cover
        }, 500);
      } else {
        setPinError('Incorrect passcode, try again!');
        setEnteredPin('');
      }
    } else {
      if (enteredPin.length < 4) {
        setEnteredPin(prev => prev + val);
      }
    }
  };

  // Virtual candle tapping
  const handleBlowCandles = () => {
    if (candlesBlown) return;
    setCandlesBlown(true);
    triggerConfetti();
    setTimeout(() => {
      setActivePage(5); // Go to headline page automatically
    }, 1800);
  };

  // Confetti trigger
  const triggerConfetti = () => {
    // 1. Traditional background falling confetti burst
    const colors = [accent, '#E7A79A', '#C9973F', '#2E7D6B', '#4A5FB3', '#F43F5E', '#10B981', '#F59E0B'];
    const burst = Array.from({ length: 60 }).map((_, i) => ({
      id: i + Math.random(),
      x: 20 + Math.random() * 60, // percentage x
      y: 30 + Math.random() * 40, // percentage y
      color: colors[Math.floor(Math.random() * colors.length)],
      delay: Math.random() * 0.4
    }));
    setConfettiBurst(burst);
    // Clear traditional after 3 seconds
    setTimeout(() => {
      setConfettiBurst([]);
    }, 3000);

    // 2. High-end multi-volley Party Bomber/Popper simulation
    setIsPopping(true);
    
    const fireVolley = (volleyNum: number, delayMs: number) => {
      setTimeout(() => {
        playPartyPopSound();
        setLastShotTime(Date.now());

        const colorsList = [accent, '#F43F5E', '#10B981', '#3B82F6', '#F59E0B', '#EC4899', '#8B5CF6', '#06B6D4', '#EAB308'];
        const shapes: ('rectangle' | 'circle' | 'star' | 'emoji' | 'ribbon')[] = ['rectangle', 'circle', 'star', 'emoji', 'ribbon'];
        const emojis = ['🎉', '🎈', '💖', '✨', '🌟', '🧁', '🎁', '🎂', '🍭', '🌸'];

        const newParticles: PopperParticle[] = [];

        // Firing 25 particles from left launcher, 25 particles from right launcher
        for (let i = 0; i < 25; i++) {
          const lTargetX = 15 + Math.random() * 60;
          const lTargetY = 30 + Math.random() * 50;
          const leftParticle: PopperParticle = {
            id: Math.random() + i + (volleyNum * 100),
            startX: 2,
            startY: 95,
            targetX: lTargetX,
            targetY: lTargetY,
            midX: (2 + lTargetX) / 2 + (Math.random() * 20 - 10),
            midY: Math.max(5, lTargetY - (25 + Math.random() * 30)), // high-altitude apex
            color: colorsList[Math.floor(Math.random() * colorsList.length)],
            size: 8 + Math.random() * 12,
            type: shapes[Math.floor(Math.random() * shapes.length)],
            emoji: emojis[Math.floor(Math.random() * emojis.length)],
            rotation: Math.random() * 360,
            spinDirection: Math.random() > 0.5 ? 1 : -1,
            duration: 1.6 + Math.random() * 1.2,
            delay: Math.random() * 0.12
          };
          newParticles.push(leftParticle);

          const rTargetX = 25 + Math.random() * 60;
          const rTargetY = 30 + Math.random() * 50;
          const rightParticle: PopperParticle = {
            id: Math.random() + i + 1000 + (volleyNum * 100),
            startX: 98,
            startY: 95,
            targetX: rTargetX,
            targetY: rTargetY,
            midX: (98 + rTargetX) / 2 + (Math.random() * 20 - 10),
            midY: Math.max(5, rTargetY - (25 + Math.random() * 30)), // high-altitude apex
            color: colorsList[Math.floor(Math.random() * colorsList.length)],
            size: 8 + Math.random() * 12,
            type: shapes[Math.floor(Math.random() * shapes.length)],
            emoji: emojis[Math.floor(Math.random() * emojis.length)],
            rotation: Math.random() * 360,
            spinDirection: Math.random() > 0.5 ? 1 : -1,
            duration: 1.6 + Math.random() * 1.2,
            delay: Math.random() * 0.12
          };
          newParticles.push(rightParticle);
        }

        setPopperParticles(prev => [...prev, ...newParticles]);
      }, delayMs);
    };

    fireVolley(0, 0);
    fireVolley(1, 250);
    fireVolley(2, 550);
    fireVolley(3, 900);

    setTimeout(() => {
      setIsPopping(false);
      setPopperParticles([]);
    }, 4500);
  };

  // Automatically trigger confetti when reaching the final page
  useEffect(() => {
    if (activePage === totalPages - 1) {
      triggerConfetti();
    }
  }, [activePage, totalPages]);

  // Filters mapping
  const getFilterClass = (filter: string) => {
    switch (filter) {
      case 'grayscale': return 'grayscale contrast-110';
      case 'sepia': return 'sepia contrast-105 brightness-95';
      case 'vintage': return 'sepia-[0.35] saturate-125 contrast-110 hue-rotate-[5deg]';
      case 'warm': return 'saturate-130 brightness-105 sepia-[0.1]';
      default: return '';
    }
  };

  // Tab labels
  const tabNames = ['Cover', 'Unlock', 'Favorite', 'Memories', 'Wish', 'Reveal', 'Letter', 'End'];

  return (
    <div 
      className="relative w-full h-full flex flex-col items-center justify-between overflow-hidden"
      style={{ 
        backgroundColor: bg,
        backgroundImage: cardData.customBgImage 
          ? `linear-gradient(rgba(0, 0, 0, 0.45), rgba(0, 0, 0, 0.65)), url(${cardData.customBgImage})`
          : `radial-gradient(circle at 10% 20%, rgba(255,255,255,0.4) 0%, transparent 60%)`,
        backgroundSize: 'cover',
        backgroundPosition: 'center'
      }}
    >
      {/* Floating Background Decorations */}
      <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden select-none opacity-45">
        {decorations.map(dec => (
          <motion.div
            key={dec.id}
            initial={{ y: '110%', x: `${dec.left}%`, scale: 0.8, opacity: 0 }}
            animate={{
              y: '-10%',
              x: [
                `${dec.left}%`,
                `${dec.left + (Math.sin(dec.id) * 8)}%`,
                `${dec.left - (Math.sin(dec.id + 1) * 8)}%`,
                `${dec.left}%`
              ],
              opacity: [0, 0.65, 0.65, 0],
              rotate: [dec.rotate, dec.rotate + 15, dec.rotate - 15, dec.rotate]
            }}
            transition={{
              duration: dec.duration,
              delay: dec.delay,
              repeat: Infinity,
              ease: 'linear'
            }}
            className="absolute font-sans"
            style={{ fontSize: dec.size }}
          >
            {dec.emoji}
          </motion.div>
        ))}
      </div>
      {/* Tab strip indicator */}
      <div className="absolute top-4 left-3 right-3 z-30 flex gap-1 px-1 overflow-x-auto scrollbar-none">
        {tabNames.map((name, i) => {
          const isCurrent = activePage === i;
          const isPassable = !gatedMode || isUnlocked || i <= 1;
          return (
            <button
              key={i}
              disabled={!isPassable}
              onClick={() => setActivePage(i)}
              className={`flex-1 min-w-[36px] py-1 text-[8px] font-bold tracking-tight rounded-md border text-center transition-all ${
                isCurrent
                  ? 'bg-white text-neutral-900 border-white shadow-sm'
                  : 'bg-black/10 hover:bg-black/15 text-white/60 border-transparent'
              }`}
            >
              {name}
            </button>
          );
        })}
      </div>

      {/* Page Progress Indicator */}
      <div className="absolute top-11 right-5 z-30 text-[9px] font-bold text-white/70">
        {activePage + 1} / {totalPages}
      </div>

      {/* Background Music floating controller */}
      {cardData.musicTrackId && cardData.musicTrackId !== 'none' && (
        <button
          onClick={toggleMusicPlay}
          className="absolute top-11 left-5 z-30 flex items-center gap-2 bg-black/25 backdrop-blur-sm hover:bg-black/40 text-white pl-2.5 pr-3 py-1 rounded-full text-[10px] font-bold border border-white/10 transition-all cursor-pointer shadow-sm group"
        >
          {isMusicPlaying ? (
            <Volume2 className="w-3.5 h-3.5 text-green-400 animate-pulse" />
          ) : (
            <VolumeX className="w-3.5 h-3.5 text-white/60" />
          )}
          <span className="max-w-[100px] truncate">
            {cardData.musicTrackId === 'custom' 
              ? (cardData.musicTrackName || 'Custom Audio') 
              : (cardData.musicTrackId === 'birthday' ? 'Birthday Music' : 'Ambient Music')}
          </span>
          <span className="text-[8px] bg-white/15 px-1.5 py-0.5 rounded text-white/80 group-hover:bg-white/25 uppercase font-black">
            {isMusicPlaying ? 'Mute' : 'Play'}
          </span>
        </button>
      )}

      {/* Confetti canvas overlay */}
      {confettiBurst.length > 0 && (
        <div className="absolute inset-0 pointer-events-none z-50 overflow-hidden">
          {confettiBurst.map(p => (
            <motion.div
              key={p.id}
              initial={{ y: '100%', x: `${p.x}%`, scale: 0, opacity: 1, rotate: 0 }}
              animate={{ 
                y: '-20%', 
                x: `${p.x + (Math.random() * 20 - 10)}%`, 
                scale: [1, 1.5, 1, 0.5],
                opacity: [1, 1, 0.8, 0],
                rotate: 360 + Math.random() * 360
              }}
              transition={{ duration: 2 + Math.random() * 1.5, delay: p.delay, ease: 'easeOut' }}
              className="absolute w-2 h-3 rounded-sm"
              style={{ backgroundColor: p.color }}
            />
          ))}
        </div>
      )}

      {/* Party Bomber Particle Overlay */}
      {popperParticles.length > 0 && (
        <div className="absolute inset-0 pointer-events-none z-50 overflow-hidden">
          {popperParticles.map(p => {
            const renderShape = () => {
              switch (p.type) {
                case 'circle':
                  return (
                    <div 
                      className="rounded-full shadow-sm" 
                      style={{ width: p.size, height: p.size, backgroundColor: p.color }} 
                    />
                  );
                case 'star':
                  return (
                    <span 
                      style={{ fontSize: p.size, color: p.color }} 
                      className="drop-shadow-sm font-sans block select-none"
                    >
                      ★
                    </span>
                  );
                case 'emoji':
                  return (
                    <span 
                      style={{ fontSize: p.size }} 
                      className="drop-shadow-sm block select-none"
                    >
                      {p.emoji || '✨'}
                    </span>
                  );
                case 'ribbon':
                  return (
                    <svg 
                      width={p.size * 2} 
                      height={p.size} 
                      viewBox="0 0 40 20" 
                      fill="none" 
                      stroke={p.color} 
                      strokeWidth="2"
                      strokeLinecap="round"
                      className="opacity-90"
                    >
                      <path d="M2,10 Q10,2 20,10 T38,10" />
                    </svg>
                  );
                default: // rectangle
                  return (
                    <div 
                      className="rounded-[1.5px] shadow-sm animate-pulse" 
                      style={{ 
                        width: p.size * 1.4, 
                        height: p.size * 0.6, 
                        backgroundColor: p.color 
                      }} 
                    />
                  );
              }
            };

            return (
              <motion.div
                key={p.id}
                initial={{ 
                  left: `${p.startX}%`, 
                  top: `${p.startY}%`, 
                  scale: 0.1, 
                  opacity: 0, 
                  rotate: p.rotation 
                }}
                animate={{ 
                  left: [
                    `${p.startX}%`,
                    `${p.midX}%`,
                    `${p.targetX}%`
                  ],
                  top: [
                    `${p.startY}%`,
                    `${p.midY}%`,
                    `${p.targetY}%`
                  ],
                  scale: [0.1, 1.4, 1.0, 0.4],
                  opacity: [0, 1, 1, 0.8, 0],
                  rotate: [
                    p.rotation, 
                    p.rotation + (180 * p.spinDirection), 
                    p.rotation + (540 * p.spinDirection)
                  ]
                }}
                transition={{ 
                  duration: p.duration, 
                  delay: p.delay, 
                  ease: [0.1, 0.8, 0.25, 1.0]
                }}
                className="absolute flex items-center justify-center -translate-x-1/2 -translate-y-1/2"
              >
                {renderShape()}
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Party Bomber Cannon Launchers (Visual overlay) */}
      {isPopping && (
        <div className="absolute inset-x-0 bottom-0 top-0 pointer-events-none z-50 overflow-hidden">
          {/* Left Cannon */}
          <motion.div
            initial={{ y: 90, x: -90, rotate: 45, opacity: 0 }}
            animate={{ 
              y: 0, 
              x: 0, 
              opacity: 1,
              // Recoil shaking when firing
              scale: [1, 0.75, 1.3, 0.9, 1],
              rotate: [45, 25, 62, 40, 45],
            }}
            transition={{
              type: 'spring',
              stiffness: 180,
              damping: 10,
              scale: { duration: 0.6, ease: 'easeOut' },
              rotate: { duration: 0.6, ease: 'easeOut' }
            }}
            key={`left-cannon-${lastShotTime}`}
            className="absolute bottom-4 left-4 w-12 h-12 flex items-center justify-center text-3xl select-none"
          >
            🎉
          </motion.div>

          {/* Right Cannon */}
          <motion.div
            initial={{ y: 90, x: 90, rotate: -45, opacity: 0 }}
            animate={{ 
              y: 0, 
              x: 0, 
              opacity: 1,
              // Recoil shaking when firing
              scale: [1, 0.75, 1.3, 0.9, 1],
              rotate: [-45, -25, -62, -40, -45],
            }}
            transition={{
              type: 'spring',
              stiffness: 180,
              damping: 10,
              scale: { duration: 0.6, ease: 'easeOut' },
              rotate: { duration: 0.6, ease: 'easeOut' }
            }}
            key={`right-cannon-${lastShotTime}`}
            className="absolute bottom-4 right-4 w-12 h-12 flex items-center justify-center text-3xl select-none"
            style={{ transform: 'scaleX(-1)' }}
          >
            🎉
          </motion.div>
        </div>
      )}

      {/* Active Page Screen Area */}
      <div 
        className="w-full flex-1 flex flex-col items-center justify-center px-6 relative pt-12 pb-14"
        style={{ perspective: '1200px', transformStyle: 'preserve-3d' }}
      >
        <AnimatePresence custom={direction} mode="wait">
          {/* PAGE 0: Envelope Cover */}
          {activePage === 0 && (
            <motion.div
              key="page-0"
              custom={direction}
              variants={pageVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={pageTransition}
              style={{ backfaceVisibility: 'hidden', transformStyle: 'preserve-3d', transformOrigin: direction > 0 ? "left center" : "right center" }}
              className="flex flex-col items-center justify-center text-center text-white"
            >
              {/* Envelope interactive animation */}
              <div 
                onClick={handleEnvelopeTap}
                className="group relative w-44 h-32 cursor-pointer mb-6"
              >
                {/* Back flap */}
                <div className="absolute inset-0 bg-white/95 rounded-2xl shadow-xl border border-black/5" />
                
                {/* Wax Seal emoji sticker */}
                <div 
                  className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-10 h-10 rounded-full flex items-center justify-center shadow-lg border border-white/20 text-lg transition-all z-20 ${
                    envelopeOpen ? 'opacity-0 scale-50' : 'bg-amber-500 scale-100 group-hover:scale-110'
                  }`}
                >
                  💌
                </div>

                {/* Front flap */}
                <div 
                  className="absolute top-0 left-0 right-0 h-[52%] bg-neutral-200/90 rounded-t-2xl origin-top transition-transform duration-500 z-10"
                  style={{ 
                    clipPath: 'polygon(0 0, 100% 0, 50% 100%)',
                    transform: envelopeOpen ? 'rotateX(155deg)' : 'rotateX(0deg)'
                  }}
                />
              </div>

              <h2 className="text-xl font-bold tracking-tight mb-2 max-w-xs" style={{ fontFamily: headingFont }}>
                A little something<br />special just for you
              </h2>
              <p className="text-[11px] text-white/80 font-medium">
                {envelopeOpen ? 'Opening greeting card...' : 'Tap the envelope to open'}
              </p>
            </motion.div>
          )}

          {/* PAGE 1: Passcode Authentication Screen */}
          {activePage === 1 && (
            <motion.div
              key="page-1"
              custom={direction}
              variants={pageVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={pageTransition}
              style={{ backfaceVisibility: 'hidden', transformStyle: 'preserve-3d', transformOrigin: direction > 0 ? "left center" : "right center" }}
              className="flex flex-col items-center justify-center text-center text-white w-full max-w-[240px]"
            >
              <h3 className="text-base font-bold mb-1" style={{ fontFamily: headingFont }}>
                Enter passcode
              </h3>
              <p className="text-[10px] text-white/70 mb-4 font-medium">
                Set by {cardData.senderName || 'Sam'} to keep it private
              </p>

              {/* Pin indicator dots */}
              <div className="flex gap-2.5 mb-2.5">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div
                    key={i}
                    className={`w-3.5 h-3.5 rounded-full border-2 border-white transition-all duration-150 ${
                      i < enteredPin.length ? 'bg-white scale-110' : 'bg-transparent'
                    }`}
                  />
                ))}
              </div>

              {/* Error warning */}
              <div className="text-[10px] text-rose-200 h-4 font-semibold mb-2">
                {pinError}
              </div>

              {/* Grid numeric Pinpad */}
              <div className="grid grid-cols-3 gap-2 w-full">
                {['1', '2', '3', '4', '5', '6', '7', '8', '9', '⌫', '0', '✓'].map((num) => (
                  <button
                    key={num}
                    onClick={() => handlePinPress(num)}
                    className="py-2.5 bg-white/95 hover:bg-white text-neutral-800 rounded-xl font-bold text-xs shadow-sm transition-all active:scale-95 flex items-center justify-center font-sans"
                  >
                    {num}
                  </button>
                ))}
              </div>
            </motion.div>
          )}

          {/* PAGE 2: Favorite Person Cover Page */}
          {activePage === 2 && (isUnlocked || !gatedMode) && (
            <motion.div
              key="page-2"
              custom={direction}
              variants={pageVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={pageTransition}
              style={{ backfaceVisibility: 'hidden', transformStyle: 'preserve-3d', transformOrigin: direction > 0 ? "left center" : "right center" }}
              className="flex flex-col items-center justify-center text-center w-full"
            >
              <h2 className="text-lg font-bold text-white mb-4 drop-shadow-sm leading-snug" style={{ fontFamily: headingFont }}>
                To My Favorite Person
              </h2>

              {/* Polariod Portrait Image Frame */}
              <div className="p-3 pb-8 bg-white shadow-xl rounded-sm transform rotate-[-1deg] max-w-[190px] border border-black/5">
                <img
                  src={cardData.favoritePhoto || PLACEHOLDERS.favorite}
                  alt="Favorite person"
                  className={`w-40 h-48 rounded-sm ${getFilterClass(cardData.favoritePhotoFilter)}`}
                  style={{ objectFit: cardData.favoritePhotoFit }}
                  loading="lazy"
                />
              </div>

              {/* Beautiful custom styled quotes sticker */}
              <div 
                className="mt-5 px-4 py-2.5 rounded-2xl text-center max-w-[220px] shadow-md leading-relaxed border border-black/5 min-h-[50px] flex items-center justify-center"
                style={{ 
                  backgroundColor: cardBg, 
                  color: text,
                  fontFamily: bodyFont
                }}
              >
                <p className="text-base font-semibold leading-normal w-full">
                  <AnimatedWish 
                    text={`"${cardData.favoriteQuote}"`}
                    style={cardData.wishAnimationStyle}
                    delay={0.3}
                  />
                </p>
              </div>
            </motion.div>
          )}

          {/* PAGE 3: Memories Photo Grid */}
          {activePage === 3 && (isUnlocked || !gatedMode) && (
            <motion.div
              key="page-3"
              custom={direction}
              variants={pageVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={pageTransition}
              style={{ backfaceVisibility: 'hidden', transformStyle: 'preserve-3d', transformOrigin: direction > 0 ? "left center" : "right center" }}
              className="flex flex-col items-center justify-center text-center w-full"
            >
              <h2 className="text-lg font-bold text-white mb-2 leading-tight drop-shadow-sm" style={{ fontFamily: headingFont }}>
                Beautiful Memories
              </h2>
              
              <div 
                className="text-2xl font-bold tracking-tight mb-5 drop-shadow-sm min-h-[32px] flex items-center justify-center"
                style={{ fontFamily: bodyFont, color: '#fff' }}
              >
                <AnimatedWish 
                  text={cardData.memoryCaption}
                  style={cardData.wishAnimationStyle}
                  delay={0.25}
                />
              </div>

              {/* Grid Layout of 4 memories */}
              <div className="grid grid-cols-2 gap-3 w-full max-w-[240px]">
                {Array.from({ length: 4 }).map((_, i) => {
                  const photo = cardData.memoryPhotos[i] || PLACEHOLDERS.memories[i];
                  const wish = cardData.memoryWishes?.[i] || '✨';
                  const rotations = ['rotate-[-1.5deg]', 'rotate-[1.5deg]', 'rotate-[-1deg]', 'rotate-[1.2deg]'];
                  return (
                    <motion.div 
                      key={i}
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.1 }}
                      className={`bg-white p-1.5 pb-2 rounded-lg shadow-md border border-neutral-200/40 text-center flex flex-col justify-between ${rotations[i]}`}
                    >
                      <div className="aspect-square w-full bg-neutral-100 rounded overflow-hidden">
                        <img
                           src={photo}
                           alt={`Memory ${i+1}`}
                           className="w-full h-full object-cover"
                           loading="lazy"
                        />
                      </div>
                      <div 
                        className="text-[10px] font-bold text-neutral-800 line-clamp-1 px-0.5 mt-1.5 leading-tight min-h-[14px]"
                        style={{ fontFamily: bodyFont }}
                      >
                        <AnimatedWish 
                          text={wish}
                          style={cardData.wishAnimationStyle}
                          delay={0.45 + i * 0.1}
                        />
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </motion.div>
          )}

          {/* PAGE 4: Make a Wish (Interactive Candle Blowing) */}
          {activePage === 4 && (isUnlocked || !gatedMode) && (
            <motion.div
              key="page-4"
              custom={direction}
              variants={pageVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={pageTransition}
              style={{ backfaceVisibility: 'hidden', transformStyle: 'preserve-3d', transformOrigin: direction > 0 ? "left center" : "right center" }}
              className="flex flex-col items-center justify-center text-center w-full"
            >
              <h2 className="text-lg font-bold text-white mb-2 leading-tight drop-shadow-sm" style={{ fontFamily: headingFont }}>
                Make a Wish
              </h2>

              {/* Birthday Cake and Interactive Candle container */}
              <div 
                onClick={handleBlowCandles}
                className="group relative cursor-pointer my-6 flex flex-col items-center transition-transform hover:scale-105 active:scale-95"
              >
                {/* Grid layout for candles based on the count */}
                <div className="flex gap-1.5 mb-[-3px] justify-center z-10">
                  {Array.from({ length: Math.min(12, Math.max(1, cardData.age)) }).map((_, i) => (
                    <div key={i} className="w-1.5 h-7 bg-white rounded-sm relative shadow-sm">
                      {/* Interactive Flame */}
                      <div 
                        className={`absolute top-[-10px] left-1/2 -translate-x-1/2 w-2.5 h-4 rounded-full origin-bottom transition-all duration-300 ${
                          candlesBlown ? 'opacity-0 scale-y-0' : 'scale-100'
                        }`}
                        style={{ 
                          background: 'radial-gradient(circle at 50% 70%, #fff59a, #ffb347 60%, #ff7a3d)',
                          boxShadow: '0 0 8px #ffb347',
                          animation: candlesBlown ? 'none' : `flicker ${1 + Math.random()}s infinite alternate`
                        }}
                      />
                    </div>
                  ))}
                </div>

                {/* Cake body */}
                <div className="w-40 h-16 bg-white rounded-b-3xl rounded-t-lg shadow-xl relative border-t-4 border-white/20">
                  {/* Frosted drip effect */}
                  <div className="absolute top-0 left-0 right-0 h-4 bg-white/90 rounded-b-md shadow-inner flex overflow-hidden">
                    {Array.from({ length: 8 }).map((_, i) => (
                      <div key={i} className="flex-1 bg-white/95 h-3 rounded-b-full mx-[1px]" />
                    ))}
                  </div>
                  {/* Decorative frosting stars */}
                  <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-rose-300 block" />
                    <span className="w-2 h-2 rounded-full bg-amber-300 block" />
                    <span className="w-2 h-2 rounded-full bg-sky-300 block" />
                  </div>
                </div>
              </div>

              <div className="text-xs text-white/90 font-semibold px-4 drop-shadow-sm min-h-[36px] flex items-center justify-center">
                {candlesBlown ? (
                  <AnimatedWish 
                    key="blown"
                    text="Your wish has been cast! ✨"
                    style={cardData.wishAnimationStyle}
                    delay={0.15}
                  />
                ) : (
                  <AnimatedWish 
                    key="not-blown"
                    text={cardData.wishText}
                    style={cardData.wishAnimationStyle}
                    delay={0.25}
                  />
                )}
              </div>

              {!candlesBlown && (
                <p className="text-[9px] text-white/70 uppercase tracking-widest mt-1.5 font-bold animate-pulse">
                  Tap the cake to blow out candles
                </p>
              )}
            </motion.div>
          )}

          {/* PAGE 5: Celebration Big Reveal Photo */}
          {activePage === 5 && (isUnlocked || !gatedMode) && (
            <motion.div
              key="page-5"
              custom={direction}
              variants={pageVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={pageTransition}
              style={{ backfaceVisibility: 'hidden', transformStyle: 'preserve-3d', transformOrigin: direction > 0 ? "left center" : "right center" }}
              className="flex flex-col items-center justify-center text-center w-full"
            >
              <h2 className="text-xl font-extrabold text-white leading-tight drop-shadow-sm mb-6 max-w-xs min-h-[50px] flex items-center justify-center" style={{ fontFamily: headingFont }}>
                <AnimatedWish 
                  text={cardData.headline}
                  style={cardData.wishAnimationStyle}
                  delay={0.2}
                />
              </h2>

              {/* Highlight cover reveal image */}
              <div className="p-1 rounded-2xl bg-white/40 border border-white/50 shadow-2xl max-w-[240px] transform rotate-[1deg]">
                <img
                  src={cardData.headlinePhoto || PLACEHOLDERS.headline}
                  alt="Celebration moment"
                  className="w-full h-32 object-cover rounded-xl"
                  loading="lazy"
                />
              </div>
            </motion.div>
          )}

          {/* PAGE 6: Notebook handwritten note page */}
          {activePage === 6 && (isUnlocked || !gatedMode) && (
            <motion.div
              key="page-6"
              custom={direction}
              variants={pageVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={pageTransition}
              style={{ backfaceVisibility: 'hidden', transformStyle: 'preserve-3d', transformOrigin: direction > 0 ? "left center" : "right center" }}
              className="flex flex-col items-center justify-center w-full"
            >
              {/* Parchment/Notebook paper texture representation */}
              <div 
                className="w-full max-w-[250px] p-5 pb-6 bg-[#fdf9ef] rounded-xl shadow-2xl relative transform rotate-[-1deg] border border-[#e6dece] text-left"
                style={{ color: '#2B1B14' }}
              >
                {/* Golden tape styling at top of note */}
                <div className="absolute top-[-10px] left-1/2 -translate-x-1/2 w-14 h-5 bg-amber-500/35 shadow-sm transform rotate-[3deg]" />

                {/* Polaroid stamp inside note */}
                <div className="w-16 h-16 p-1 pb-3 bg-white border border-neutral-200 shadow-md rounded-sm float-right ml-2.5 mb-2 rotate-[4deg]">
                  <img
                    src={cardData.notePhoto || PLACEHOLDERS.note}
                    alt="Stamp memo"
                    className="w-full h-full object-cover rounded-sm"
                    loading="lazy"
                  />
                </div>

                {/* Letter Body Text */}
                <div 
                  className="text-[14px] leading-relaxed font-semibold whitespace-pre-line"
                  style={{ fontFamily: bodyFont }}
                >
                  <AnimatedWish 
                    text={cardData.noteText}
                    style={cardData.wishAnimationStyle}
                    delay={0.3}
                  />
                </div>
              </div>
            </motion.div>
          )}

          {/* PAGE 7: Outro / Farewell Signature page */}
          {activePage === 7 && (isUnlocked || !gatedMode) && (
            <motion.div
              key="page-7"
              custom={direction}
              variants={pageVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={pageTransition}
              style={{ backfaceVisibility: 'hidden', transformStyle: 'preserve-3d', transformOrigin: direction > 0 ? "left center" : "right center" }}
              className="flex flex-col items-center justify-center text-center w-full"
            >
              <h2 className="text-xl font-bold text-white mb-2 drop-shadow-sm capitalize min-h-[28px] flex items-center justify-center" style={{ fontFamily: headingFont }}>
                <AnimatedWish 
                  text={`${cardData.recipientName || 'Alex'},`}
                  style={cardData.wishAnimationStyle}
                  delay={0.15}
                />
              </h2>

              <div 
                className="px-5 py-4 rounded-2xl max-w-[240px] shadow-lg leading-relaxed text-center text-base font-semibold mb-6 border border-black/5 min-h-[56px] flex items-center justify-center"
                style={{ 
                  backgroundColor: cardBg, 
                  color: text,
                  fontFamily: bodyFont
                }}
              >
                <p className="w-full">
                  <AnimatedWish 
                    text={`"${cardData.finalMessage}"`}
                    style={cardData.wishAnimationStyle}
                    delay={0.3}
                  />
                </p>
              </div>

              <div 
                className="text-2xl font-bold text-right w-full max-w-[220px] drop-shadow-sm text-white flex flex-col items-end"
                style={{ fontFamily: bodyFont }}
              >
                <span>— {cardData.senderName || 'Sam'}</span>
                {cardData.signatureDrawing && (
                  <motion.div 
                    initial={{ scale: 0.85, opacity: 0, rotate: -3 }}
                    animate={{ scale: 1, opacity: 1, rotate: -1 }}
                    transition={{ delay: 0.3, type: "spring", stiffness: 100 }}
                    className="mt-2 bg-white/95 p-1.5 px-3 rounded-lg shadow-md border border-neutral-200/40 max-w-[160px]"
                  >
                    <img 
                      src={cardData.signatureDrawing} 
                      alt="Handwritten Signature" 
                      className="h-10 object-contain mx-auto mix-blend-multiply" 
                    />
                  </motion.div>
                )}
              </div>

              <p className="text-[9px] uppercase tracking-widest text-white/40 font-bold mt-12 font-sans">
                made with dear you
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Floating Celebrate Button */}
      {isUnlocked && activePage >= 2 && (
        <motion.button
          whileHover={{ scale: 1.08, rotate: 1 }}
          whileTap={{ scale: 0.95 }}
          onClick={triggerConfetti}
          className="absolute bottom-16 right-5 z-30 flex items-center gap-1 py-1 px-2.5 bg-gradient-to-r from-pink-500 via-rose-500 to-amber-500 text-white rounded-full text-[10px] font-extrabold shadow-lg border border-white/20 transition-all cursor-pointer"
          style={{ fontFamily: headingFont }}
        >
          <Sparkles className="w-3 h-3 text-white/90 animate-pulse" />
          <span>Celebrate 🎉</span>
        </motion.button>
      )}

      {/* Navigation Pills bar */}
      <div className="absolute bottom-4 left-3 right-3 z-30 flex justify-between items-center px-2">
        {/* Previous page button */}
        {activePage > 0 && (!gatedMode || activePage !== 1) ? (
          <button
            onClick={handlePrev}
            className="flex items-center gap-1 py-1.5 px-3 bg-black/20 hover:bg-black/30 border border-white/20 rounded-full text-xs font-bold text-white transition-all active:scale-95 cursor-pointer"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
            Back
          </button>
        ) : (
          <div />
        )}

        {/* Next page button */}
        {activePage < totalPages - 1 && (!gatedMode || (isUnlocked && activePage !== 0 && activePage !== 1 && (activePage !== 4 || candlesBlown))) ? (
          <button
            onClick={handleNext}
            className="flex items-center gap-1 py-1.5 px-4 bg-white hover:bg-neutral-50 text-neutral-950 rounded-full text-xs font-bold shadow-md transition-all active:scale-95 cursor-pointer"
            style={{ fontFamily: headingFont }}
          >
            Next
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        ) : (
          <div />
        )}
      </div>

      {/* Custom Keyframe animation hacks */}
      <style>{`
        @keyframes flicker {
          0% { transform: translateX(-50%) scale(0.96) rotate(-1deg); }
          50% { transform: translateX(-50%) scale(1.05) rotate(1deg); }
          100% { transform: translateX(-50%) scale(1.01) rotate(0.5deg); }
        }
      `}</style>
    </div>
  );
}
