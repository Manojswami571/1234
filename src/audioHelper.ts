// Custom zero-dependency Audio helper for Web Audio API synthesis and file audio playing
import { GreetingCardData } from './types';

// Frequencies for Happy Birthday melody
const NOTE_FREQS: Record<string, number> = {
  'G4': 392.00, 'A4': 440.00, 'B4': 493.88, 'C5': 523.25, 'D5': 587.33, 'E5': 659.25, 'F5': 698.46, 'G5': 783.99, 'A5': 880.00
};

const BIRTHDAY_MELODY = [
  { note: 'G4', dur: 0.75 }, { note: 'G4', dur: 0.25 }, { note: 'A4', dur: 1.0 }, { note: 'G4', dur: 1.0 }, { note: 'C5', dur: 1.0 }, { note: 'B4', dur: 2.0 },
  { note: 'G4', dur: 0.75 }, { note: 'G4', dur: 0.25 }, { note: 'A4', dur: 1.0 }, { note: 'G4', dur: 1.0 }, { note: 'D5', dur: 1.0 }, { note: 'C5', dur: 2.0 },
  { note: 'G4', dur: 0.75 }, { note: 'G4', dur: 0.25 }, { note: 'G5', dur: 1.0 }, { note: 'E5', dur: 1.0 }, { note: 'C5', dur: 1.0 }, { note: 'B4', dur: 1.0 }, { note: 'A4', dur: 2.0 },
  { note: 'F5', dur: 0.75 }, { note: 'F5', dur: 0.25 }, { note: 'E5', dur: 1.0 }, { note: 'C5', dur: 1.0 }, { note: 'D5', dur: 1.0 }, { note: 'C5', dur: 2.5 }
];

export const PRESET_MUSIC_TRACKS = [
  { id: 'none', name: 'No Music (Muted)', url: null, type: 'none' },
  { id: 'birthday', name: '🎵 Music Box: Happy Birthday', url: 'synth', type: 'synth', description: 'Cozy, loopable clockwork chiming' },
  { id: 'lofi', name: '✨ Warm Cozy Lofi Beat', url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3', type: 'audio', description: 'Chilled nostalgic vinyl aesthetic' },
  { id: 'acoustic', name: '🎸 Melodic Acoustic Guitar', url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-8.mp3', type: 'audio', description: 'Sunny, relaxing instrumental strumming' },
  { id: 'ambient', name: '🌌 Celestial Ambient Spaces', url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-16.mp3', type: 'audio', description: 'Ethereal synth waves and starry chords' }
] as const;

export class CardMusicPlayer {
  private audioCtx: AudioContext | null = null;
  private audioEl: HTMLAudioElement | null = null;
  private synthTimeoutId: any = null;
  private currentTrackId: string = 'none';
  private customTrackUrl: string | null = null;
  private isPlaying: boolean = false;
  private tempo = 120; // BPM

  constructor() {}

  // Initialize Audio Context on demand (due to autoplay browser restrictions)
  private getAudioContext(): AudioContext {
    if (!this.audioCtx) {
      this.audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    if (this.audioCtx.state === 'suspended') {
      this.audioCtx.resume();
    }
    return this.audioCtx;
  }

  // Set track configurations
  public setTrack(trackId: string, customUrl: string | null = null) {
    this.currentTrackId = trackId;
    this.customTrackUrl = customUrl;

    if (this.isPlaying) {
      this.stop();
      this.play();
    }
  }

  // Play a chime/bell note for the music box synth
  private playChime(frequency: number, time: number, duration: number) {
    const ctx = this.getAudioContext();
    
    // Primary sound generator (sine wave for pure bell tone)
    const osc1 = ctx.createOscillator();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(frequency, time);

    // Bright overtone for the metallic hit sound
    const osc2 = ctx.createOscillator();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(frequency * 2.01, time); // slightly detuned octave for realistic resonance

    const gain1 = ctx.createGain();
    const gain2 = ctx.createGain();

    // Envelopes
    // Primary bell tone envelope (gentle attack, beautiful long decay)
    gain1.gain.setValueAtTime(0, time);
    gain1.gain.linearRampToValueAtTime(0.18, time + 0.02);
    gain1.gain.exponentialRampToValueAtTime(0.0001, time + duration * 1.5);

    // Overtone envelope (extremely rapid decay for the initial strike chime)
    gain2.gain.setValueAtTime(0, time);
    gain2.gain.linearRampToValueAtTime(0.08, time + 0.005);
    gain2.gain.exponentialRampToValueAtTime(0.0001, time + 0.15);

    // Connect nodes
    osc1.connect(gain1);
    osc2.connect(gain2);

    // Add a simple delay effect for cozy ambient warmth
    const delay = ctx.createDelay();
    delay.delayTime.setValueAtTime(0.28, time);
    const feedback = ctx.createGain();
    feedback.gain.setValueAtTime(0.35, time);

    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(1400, time);

    // Wiring
    gain1.connect(ctx.destination);
    gain2.connect(ctx.destination);

    gain1.connect(delay);
    delay.connect(feedback);
    feedback.connect(delay);
    feedback.connect(filter);
    filter.connect(ctx.destination);

    // Start & Stop
    osc1.start(time);
    osc2.start(time);
    osc1.stop(time + duration * 1.8);
    osc2.stop(time + duration * 1.8);
  }

  // Play the loopable Happy Birthday synthesizer melody
  private startSynthLoop() {
    this.stopSynth();
    const ctx = this.getAudioContext();
    let nextNoteTime = ctx.currentTime + 0.1;

    const playMelodyLoop = () => {
      let accumTime = 0;
      BIRTHDAY_MELODY.forEach((item) => {
        const freq = NOTE_FREQS[item.note];
        const beatDuration = (60 / this.tempo) * item.dur;
        const noteTime = nextNoteTime + accumTime;
        
        if (freq) {
          this.playChime(freq, noteTime, beatDuration);
        }
        accumTime += beatDuration;
      });

      // Schedule next loop iteration nicely
      const loopDurationSeconds = accumTime + 1.5; // add tiny gap before next loop
      this.synthTimeoutId = setTimeout(() => {
        nextNoteTime = ctx.currentTime;
        playMelodyLoop();
      }, loopDurationSeconds * 1000);
    };

    playMelodyLoop();
  }

  private stopSynth() {
    if (this.synthTimeoutId) {
      clearTimeout(this.synthTimeoutId);
      this.synthTimeoutId = null;
    }
  }

  // Standard audio tags for streamable preset MP3s or custom uploaded base64 data URLs
  private startAudioElement(url: string) {
    this.stopAudioElement();
    this.audioEl = new Audio(url);
    this.audioEl.loop = true;
    this.audioEl.volume = 0.45;
    
    // Catch browser autoplay restriction
    this.audioEl.play().catch((err) => {
      console.warn("Autoplay blocked or audio load error, waiting for interaction", err);
    });
  }

  private stopAudioElement() {
    if (this.audioEl) {
      this.audioEl.pause();
      this.audioEl.src = "";
      this.audioEl = null;
    }
  }

  // Core controlling functions
  public play() {
    this.isPlaying = true;
    
    if (this.currentTrackId === 'none') {
      return;
    }

    if (this.currentTrackId === 'birthday') {
      this.startSynthLoop();
    } else if (this.currentTrackId === 'custom' && this.customTrackUrl) {
      this.startAudioElement(this.customTrackUrl);
    } else {
      // Preset audio URLs
      const preset = PRESET_MUSIC_TRACKS.find(t => t.id === this.currentTrackId);
      if (preset && preset.url && preset.url !== 'synth') {
        this.startAudioElement(preset.url);
      }
    }
  }

  public stop() {
    this.isPlaying = false;
    this.stopSynth();
    this.stopAudioElement();
  }

  public getIsPlaying(): boolean {
    return this.isPlaying;
  }
}

export function playPartyPopSound() {
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();
    
    // 1. Initial short "pop" high frequency pitch sweep
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    
    osc.type = 'sine';
    osc.frequency.setValueAtTime(140, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(1100, ctx.currentTime + 0.05);
    osc.frequency.exponentialRampToValueAtTime(70, ctx.currentTime + 0.15);
    
    gain.gain.setValueAtTime(0.001, ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0.3, ctx.currentTime + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15);
    
    osc.connect(gain);
    gain.connect(ctx.destination);
    
    osc.start();
    osc.stop(ctx.currentTime + 0.18);

    // 2. Add high frequency burst (air release noise)
    const bufferSize = ctx.sampleRate * 0.08; // 80ms noise
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    const noise = ctx.createBufferSource();
    noise.buffer = buffer;

    const noiseFilter = ctx.createBiquadFilter();
    noiseFilter.type = 'highpass';
    noiseFilter.frequency.setValueAtTime(2800, ctx.currentTime);

    const noiseGain = ctx.createGain();
    noiseGain.gain.setValueAtTime(0.14, ctx.currentTime);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.06);

    noise.connect(noiseFilter);
    noiseFilter.connect(noiseGain);
    noiseGain.connect(ctx.destination);

    noise.start();
    noise.stop(ctx.currentTime + 0.08);
  } catch (e) {
    console.warn("Failed to play party pop sound:", e);
  }
}
