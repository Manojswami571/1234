import React, { useState, useRef, useEffect } from 'react';
import { GreetingCardData } from '../types';
import { PRESET_MUSIC_TRACKS, CardMusicPlayer } from '../audioHelper';
import { Music, Volume2, VolumeX, Upload, Play, Pause, Trash2, Check, Disc, Sparkles } from 'lucide-react';

interface MusicSelectorProps {
  cardData: GreetingCardData;
  onChange: (newData: Partial<GreetingCardData>) => void;
}

export default function MusicSelector({ cardData, onChange }: MusicSelectorProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const playerRef = useRef<CardMusicPlayer | null>(null);

  // Initialize unified helper player instance for editing previews
  useEffect(() => {
    playerRef.current = new CardMusicPlayer();
    
    return () => {
      if (playerRef.current) {
        playerRef.current.stop();
      }
    };
  }, []);

  // Sync track selection with helper player
  useEffect(() => {
    if (playerRef.current) {
      playerRef.current.setTrack(cardData.musicTrackId, cardData.musicTrackUrl);
      // Keep state in sync if it was previously playing
      if (isPlaying) {
        playerRef.current.play();
      }
    }
  }, [cardData.musicTrackId, cardData.musicTrackUrl]);

  const togglePlay = () => {
    if (!playerRef.current) return;

    if (isPlaying) {
      playerRef.current.stop();
      setIsPlaying(false);
    } else {
      playerRef.current.play();
      setIsPlaying(true);
    }
  };

  const handleTrackSelect = (id: typeof cardData.musicTrackId) => {
    onChange({ musicTrackId: id });
  };

  const handleAudioUpload = (file: File) => {
    if (!file.type.startsWith('audio/')) {
      alert("Please upload a valid audio file.");
      return;
    }

    // Limit custom audio size to 10MB to keep local storage robust
    if (file.size > 10 * 1024 * 1024) {
      alert("Audio file is too large (limit 10MB). High-quality shorter tracks are recommended.");
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const base64 = e.target?.result as string;
      onChange({
        musicTrackId: 'custom',
        musicTrackUrl: base64,
        musicTrackName: file.name
      });
    };
    reader.readAsDataURL(file);
  };

  const removeCustomAudio = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isPlaying && cardData.musicTrackId === 'custom') {
      if (playerRef.current) {
        playerRef.current.stop();
      }
      setIsPlaying(false);
    }
    onChange({
      musicTrackId: 'none',
      musicTrackUrl: null,
      musicTrackName: null
    });
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) {
      handleAudioUpload(file);
    }
  };

  return (
    <div className="space-y-4">
      {/* Visual Live Playback Status Card */}
      <div className={`p-4 rounded-xl border flex items-center justify-between transition-all ${
        isPlaying && cardData.musicTrackId !== 'none'
          ? 'bg-neutral-900 text-white border-neutral-900 shadow-md shadow-neutral-200'
          : 'bg-neutral-50 text-neutral-800 border-neutral-200'
      }`}>
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-full flex items-center justify-center border ${
            isPlaying && cardData.musicTrackId !== 'none'
              ? 'bg-white/15 border-white/20'
              : 'bg-white border-neutral-200 shadow-sm'
          }`}>
            {cardData.musicTrackId === 'none' ? (
              <VolumeX className={`w-5 h-5 ${isPlaying ? 'text-red-500' : 'text-neutral-400'}`} />
            ) : (
              <Music className={`w-5 h-5 ${isPlaying ? 'text-green-500 animate-bounce' : 'text-neutral-500'}`} />
            )}
          </div>
          <div className="min-w-0">
            <h5 className="text-xs font-bold truncate">
              {cardData.musicTrackId === 'custom'
                ? cardData.musicTrackName || 'Custom Uploaded Sound'
                : PRESET_MUSIC_TRACKS.find(t => t.id === cardData.musicTrackId)?.name || 'No Track Selected'}
            </h5>
            <p className={`text-[10px] truncate mt-0.5 font-medium ${
              isPlaying && cardData.musicTrackId !== 'none' ? 'text-neutral-300' : 'text-neutral-500'
            }`}>
              {cardData.musicTrackId === 'none' 
                ? 'Choose a track or upload a custom loop' 
                : isPlaying ? 'Now playing preview...' : 'Preview paused'}
            </p>
          </div>
        </div>

        {cardData.musicTrackId !== 'none' && (
          <button
            type="button"
            onClick={togglePlay}
            className={`w-9 h-9 rounded-full flex items-center justify-center transition-all focus:outline-none ${
              isPlaying
                ? 'bg-white text-neutral-900 hover:scale-105 active:scale-95'
                : 'bg-neutral-900 text-white hover:bg-neutral-800'
            }`}
            title={isPlaying ? 'Pause Preview' : 'Play Preview'}
          >
            {isPlaying ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current ml-0.5" />}
          </button>
        )}
      </div>

      {/* Preset Tracks Grid Selection */}
      <div className="space-y-2">
        <span className="text-[11px] font-bold text-neutral-500 uppercase tracking-wider block">
          Preset Soundtracks
        </span>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {PRESET_MUSIC_TRACKS.map((track) => {
            const isSelected = cardData.musicTrackId === track.id;
            return (
              <button
                key={track.id}
                type="button"
                onClick={() => handleTrackSelect(track.id)}
                className={`p-3 rounded-xl border text-left flex items-start gap-3 transition-all ${
                  isSelected
                    ? 'bg-white border-neutral-900 shadow-sm ring-1 ring-neutral-900'
                    : 'bg-white border-neutral-200 hover:border-neutral-300 hover:bg-neutral-50/50'
                }`}
              >
                <div className={`w-6 h-6 rounded-lg flex items-center justify-center border text-xs mt-0.5 ${
                  isSelected ? 'bg-neutral-900 text-white border-neutral-900' : 'bg-neutral-50 text-neutral-400 border-neutral-200'
                }`}>
                  {isSelected ? <Check className="w-3.5 h-3.5" /> : <Disc className="w-3.5 h-3.5" />}
                </div>
                <div className="min-w-0 flex-1">
                  <span className="text-[11px] font-bold text-neutral-800 block truncate">
                    {track.name}
                  </span>
                  {'description' in track && (
                    <span className="text-[9px] text-neutral-400 font-medium block mt-0.5">
                      {track.description}
                    </span>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Custom Sound Uploader */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold text-neutral-500 uppercase tracking-wider block">
            Custom Audio Clip
          </span>
          {cardData.musicTrackUrl && (
            <button
              type="button"
              onClick={removeCustomAudio}
              className="text-[10px] text-red-600 hover:text-red-700 font-bold flex items-center gap-1 hover:bg-red-50 px-1.5 py-0.5 rounded transition-colors"
            >
              <Trash2 className="w-3 h-3" /> Remove Custom
            </button>
          )}
        </div>

        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`border border-dashed rounded-xl transition-all relative overflow-hidden flex flex-col items-center justify-center p-4 min-h-[95px] ${
            cardData.musicTrackId === 'custom' && cardData.musicTrackUrl
              ? 'bg-neutral-50 border-neutral-300'
              : 'bg-white hover:bg-neutral-50 border-neutral-300'
          } ${isDragOver ? 'border-neutral-900 bg-neutral-50 scale-[0.99]' : ''}`}
        >
          {cardData.musicTrackId === 'custom' && cardData.musicTrackUrl ? (
            <div className="text-center">
              <Upload className="w-6 h-6 text-neutral-500 mx-auto mb-1 animate-pulse" />
              <span className="text-[11px] font-bold text-neutral-700 block max-w-[200px] truncate mx-auto">
                {cardData.musicTrackName || 'Custom Uploaded Audio'}
              </span>
              <span className="text-[9px] text-neutral-400 mt-0.5 block">
                Stored successfully in Greeting Card
              </span>
            </div>
          ) : (
            <>
              <Upload className="w-6 h-6 text-neutral-400 mb-1" />
              <span className="text-[11px] font-bold text-neutral-700 text-center">
                Drag audio here, or browse
              </span>
              <span className="text-[9px] text-neutral-400 mt-0.5">MP3, WAV, AAC up to 10MB</span>
              <input
                type="file"
                accept="audio/*"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleAudioUpload(file);
                }}
                className="absolute inset-0 opacity-0 cursor-pointer"
              />
            </>
          )}
        </div>
      </div>
    </div>
  );
}
