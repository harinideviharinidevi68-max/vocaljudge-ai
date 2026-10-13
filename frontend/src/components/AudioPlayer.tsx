import React, { useRef, useState, useEffect } from 'react';
import { Play, Pause, RotateCcw, Volume2, VolumeX, FastForward } from 'lucide-react';
import { formatSeconds } from '../utils/formatters';

interface AudioPlayerProps {
  label: string;
  src: string;
  duration?: number;
  seekTime?: number | null;
  onTimeUpdate?: (currentTime: number) => void;
  accentColor?: string;
  badgeText?: string;
}

export const AudioPlayer: React.FC<AudioPlayerProps> = ({
  label,
  src,
  duration: initialDuration,
  seekTime,
  onTimeUpdate,
  accentColor = 'blue',
  badgeText,
}) => {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(initialDuration || 0);
  const [isMuted, setIsMuted] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1);

  // Sync external seek requests (e.g. from timeline or flaw card clicks)
  useEffect(() => {
    if (seekTime !== null && seekTime !== undefined && audioRef.current) {
      audioRef.current.currentTime = seekTime;
      setCurrentTime(seekTime);
      audioRef.current.play().catch(() => {});
      setIsPlaying(true);
    }
  }, [seekTime]);

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play().then(() => setIsPlaying(true)).catch(() => {});
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    setCurrentTime(val);
    if (audioRef.current) {
      audioRef.current.currentTime = val;
    }
  };

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      const cur = audioRef.current.currentTime;
      setCurrentTime(cur);
      onTimeUpdate?.(cur);
    }
  };

  const handleLoadedMetadata = () => {
    if (audioRef.current) {
      setDuration(audioRef.current.duration || initialDuration || 0);
    }
  };

  const restart = () => {
    if (audioRef.current) {
      audioRef.current.currentTime = 0;
      audioRef.current.play().catch(() => {});
      setIsPlaying(true);
    }
  };

  const toggleMute = () => {
    if (audioRef.current) {
      audioRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  const cyclePlaybackRate = () => {
    const rates = [0.75, 1.0, 1.25, 1.5];
    const nextIdx = (rates.indexOf(playbackRate) + 1) % rates.length;
    const nextRate = rates[nextIdx];
    setPlaybackRate(nextRate);
    if (audioRef.current) {
      audioRef.current.playbackRate = nextRate;
    }
  };

  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-sm">
      <audio
        ref={audioRef}
        src={src}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onEnded={() => setIsPlaying(false)}
      />

      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-2">
          <span className="font-semibold text-sm text-slate-100">{label}</span>
          {badgeText && (
            <span className="text-[11px] font-mono font-medium px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
              {badgeText}
            </span>
          )}
        </div>
        <div className="text-xs font-mono text-slate-400">
          <span className="text-slate-200">{formatSeconds(currentTime)}</span>
          <span className="mx-1">/</span>
          <span>{formatSeconds(duration)}</span>
        </div>
      </div>

      {/* Seek Progress Bar */}
      <div className="relative mb-3 flex items-center group">
        <input
          type="range"
          min={0}
          max={duration || 100}
          step={0.05}
          value={currentTime}
          onChange={handleSeek}
          className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
        <div 
          className="absolute left-0 top-0 h-2 bg-gradient-to-r from-blue-600 to-indigo-500 rounded-lg pointer-events-none opacity-80"
          style={{ width: `${progressPercent}%` }}
        />
      </div>

      {/* Player Controls */}
      <div className="flex items-center justify-between text-slate-300">
        <div className="flex items-center space-x-2">
          <button
            onClick={togglePlay}
            className="w-9 h-9 rounded-full bg-blue-600 hover:bg-blue-500 text-white flex items-center justify-center transition-colors shadow-md"
            title={isPlaying ? 'Pause' : 'Play'}
          >
            {isPlaying ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 ml-0.5 fill-current" />}
          </button>
          
          <button
            onClick={restart}
            className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
            title="Restart from beginning"
          >
            <RotateCcw className="w-4 h-4" />
          </button>

          <button
            onClick={cyclePlaybackRate}
            className="px-2 py-1 rounded-md text-xs font-mono font-semibold bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
            title="Cycle playback speed"
          >
            {playbackRate}x
          </button>
        </div>

        <button
          onClick={toggleMute}
          className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
          title={isMuted ? 'Unmute' : 'Mute'}
        >
          {isMuted ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4" />}
        </button>
      </div>
    </div>
  );
};
