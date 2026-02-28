/**
 * VoiceNotePlayer — audio bubble with amber progress bar
 * Shows: ▶/⏸ icon · static waveform · elapsed / total duration
 */

import React, { useRef, useState, useEffect } from 'react';
import { Play, Pause } from 'lucide-react';

interface VoiceNotePlayerProps {
  url: string;
  duration: number; // total seconds (from metadata)
}

function formatSecs(s: number): string {
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${m}:${sec.toString().padStart(2, '0')}`;
}

const VoiceNotePlayer: React.FC<VoiceNotePlayerProps> = ({ url, duration }) => {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = useState(false);
  const [current, setCurrent] = useState(0);
  const [total, setTotal] = useState(duration > 0 ? duration : 0);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const onTimeUpdate = () => setCurrent(audio.currentTime);
    const onDurationChange = () => {
      if (isFinite(audio.duration)) setTotal(audio.duration);
    };
    const onEnded = () => {
      setPlaying(false);
      setCurrent(0);
    };

    audio.addEventListener('timeupdate', onTimeUpdate);
    audio.addEventListener('durationchange', onDurationChange);
    audio.addEventListener('ended', onEnded);

    return () => {
      audio.removeEventListener('timeupdate', onTimeUpdate);
      audio.removeEventListener('durationchange', onDurationChange);
      audio.removeEventListener('ended', onEnded);
    };
  }, []);

  const toggle = () => {
    const audio = audioRef.current;
    if (!audio) return;
    if (playing) {
      audio.pause();
      setPlaying(false);
    } else {
      audio.play().then(() => setPlaying(true)).catch(() => setPlaying(false));
    }
  };

  const progress = total > 0 ? (current / total) * 100 : 0;

  return (
    <div className="flex items-center gap-2 bg-card border border-border rounded-2xl px-3 py-2 shadow-sm min-w-[180px] max-w-[260px]">
      <audio ref={audioRef} src={url} preload="metadata" />

      {/* Play / Pause button */}
      <button
        onClick={toggle}
        className="w-8 h-8 rounded-full bg-amber-500 hover:bg-amber-600 flex items-center justify-center flex-shrink-0 transition-colors"
      >
        {playing ? (
          <Pause size={14} className="text-white" />
        ) : (
          <Play size={14} className="text-white ml-0.5" />
        )}
      </button>

      {/* Waveform + progress */}
      <div className="flex-1 flex flex-col gap-1 min-w-0">
        {/* Static waveform bars */}
        <div className="relative h-5 flex items-end gap-px overflow-hidden">
          {/* Background bars */}
          <div className="absolute inset-0 flex items-end gap-px">
            {[3,5,8,6,9,7,4,6,8,5,7,9,6,4,7,5,8,6,3,5].map((h, i) => (
              <div
                key={i}
                className="flex-1 rounded-full bg-border"
                style={{ height: `${h * 10}%` }}
              />
            ))}
          </div>
          {/* Amber fill overlay (clipped by progress) */}
          <div
            className="absolute inset-0 flex items-end gap-px overflow-hidden transition-all duration-200"
            style={{ width: `${progress}%` }}
          >
            {[3,5,8,6,9,7,4,6,8,5,7,9,6,4,7,5,8,6,3,5].map((h, i) => (
              <div
                key={i}
                className="flex-1 rounded-full bg-amber-500"
                style={{ height: `${h * 10}%` }}
              />
            ))}
          </div>
        </div>

        {/* Duration text */}
        <span className="text-[10px] text-muted-foreground leading-none">
          {playing ? formatSecs(current) : formatSecs(total > 0 ? total : duration)}
        </span>
      </div>
    </div>
  );
};

export default VoiceNotePlayer;
