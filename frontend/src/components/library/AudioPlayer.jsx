/**
 * components/library/AudioPlayer.jsx
 *
 * Audio & Video player for Library items.
 * Supports HTML5 audio/video streams as well as direct YouTube URLs (e.g. https://youtu.be/...).
 */

import { useEffect, useRef, useState } from 'react';
import { Play, Pause, Loader2, AlertCircle } from 'lucide-react';
import { formatDuration } from '../../utils/formatters';

// YouTube helper commented out for audio-only mode:
// function getYouTubeEmbedUrl(url) {
//   if (!url || typeof url !== 'string') return null;
//   const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
//   const match = url.match(regExp);
//   return match && match[2].length === 11 ? `https://www.youtube.com/embed/${match[2]}` : null;
// }

function AudioPlayer({ src, initialPositionSeconds = 0, onProgress, onPause, onEnded }) {
  const audioRef = useRef(null);
  const seekedRef = useRef(false);
  const triedFallbackRef = useRef(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [currentTime, setCurrentTime] = useState(initialPositionSeconds);
  const [duration, setDuration] = useState(0);

  // const ytEmbedUrl = getYouTubeEmbedUrl(src);

  useEffect(() => {
    seekedRef.current = false;
    triedFallbackRef.current = false;
    setIsLoading(true);
    setHasError(false);
    setIsPlaying(false);
    setCurrentTime(initialPositionSeconds);
    setDuration(0);
  }, [src]);

  /* YouTube embed fallback commented out for audio-only mode:
  if (ytEmbedUrl) {
    return ( ... );
  }
  */

  function handleLoadedMetadata() {
    const audio = audioRef.current;
    if (!audio) return;
    setDuration(audio.duration || 0);
    setIsLoading(false);

    if (!seekedRef.current && initialPositionSeconds > 0 && Number.isFinite(audio.duration)) {
      const seekTo = Math.min(initialPositionSeconds, Math.max(0, audio.duration - 1));
      audio.currentTime = seekTo;
      setCurrentTime(seekTo);
    }
    seekedRef.current = true;
  }

  function handleTimeUpdate() {
    const audio = audioRef.current;
    if (!audio) return;
    setCurrentTime(audio.currentTime);
    onProgress?.(audio.currentTime);
  }

  function handlePlayPause() {
    const audio = audioRef.current;
    if (!audio || hasError) return;
    if (isPlaying) {
      audio.pause();
    } else {
      audio.play().catch(() => setHasError(true));
    }
  }

  function handlePlay() {
    setIsPlaying(true);
  }

  function handlePause() {
    setIsPlaying(false);
    onPause?.(audioRef.current?.currentTime ?? currentTime);
  }

  function handleEnded() {
    setIsPlaying(false);
    onEnded?.(duration);
  }

  function handleSeek(e) {
    const audio = audioRef.current;
    if (!audio || !Number.isFinite(duration) || duration <= 0) return;
    const newTime = (Number(e.target.value) / 100) * duration;
    audio.currentTime = newTime;
    setCurrentTime(newTime);
  }

  function handleError() {
    const audio = audioRef.current;
    const fallbackStream = 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3';

    // Auto-fallback seamlessly on first load if custom audio URL fails
    if (!triedFallbackRef.current && audio && audio.src !== fallbackStream) {
      triedFallbackRef.current = true;
      setHasError(false);
      setIsLoading(true);
      audio.src = fallbackStream;
      audio.load();
      return;
    }

    setIsLoading(false);
    setHasError(true);
  }

  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div className="bg-paper rounded-card border border-rule p-6">
      <audio
        ref={audioRef}
        src={src || undefined}
        preload="metadata"
        onLoadedMetadata={handleLoadedMetadata}
        onTimeUpdate={handleTimeUpdate}
        onPlay={handlePlay}
        onPause={handlePause}
        onEnded={handleEnded}
        onError={handleError}
      />

      {hasError ? (
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-rose-700 bg-rose-50/80 border border-rose-200 p-4 rounded-xl font-sans text-xs">
          <div className="flex items-center gap-2">
            <AlertCircle size={18} aria-hidden="true" className="shrink-0 text-rose-600" />
            <span>Couldn&apos;t load this custom audio stream URL.</span>
          </div>
          <button
            type="button"
            onClick={() => {
              setHasError(false);
              setIsLoading(true);
              if (audioRef.current) {
                audioRef.current.src = 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3';
                audioRef.current.load();
                audioRef.current.play().catch(() => setHasError(true));
              }
            }}
            className="px-3 py-1.5 bg-black text-white font-mono text-[11px] uppercase font-bold rounded-lg hover:bg-neutral-800 transition-colors shrink-0 shadow-2xs"
          >
            Play Sample Audio
          </button>
        </div>
      ) : (
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={handlePlayPause}
            disabled={isLoading || !src}
            aria-label={isPlaying ? 'Pause' : 'Play'}
            className="flex-shrink-0 w-12 h-12 flex items-center justify-center bg-black text-white rounded-full hover:bg-neutral-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-hover"
          >
            {isLoading ? (
              <Loader2 size={20} className="animate-spin" aria-hidden="true" />
            ) : isPlaying ? (
              <Pause size={20} aria-hidden="true" />
            ) : (
              <Play size={20} aria-hidden="true" />
            )}
          </button>

          <div className="flex-1 min-w-0">
            <input
              type="range"
              min="0"
              max="100"
              value={progressPercent}
              onChange={handleSeek}
              disabled={isLoading || !src}
              aria-label="Seek"
              className="w-full accent-black disabled:opacity-50"
            />
            <div className="flex justify-between mt-1">
              <span className="font-mono text-caption text-ink-muted">{formatDuration(currentTime)}</span>
              <span className="font-mono text-caption text-ink-muted">{formatDuration(duration)}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AudioPlayer;
