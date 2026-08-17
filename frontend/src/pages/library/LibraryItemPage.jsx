/**
 * pages/library/LibraryItemPage.jsx
 *
 * Single Library item detail view supporting Audio & Video (Uploaded files & Direct URLs).
 */

import { useEffect, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Loader2, AlertCircle, ArrowLeft, Headphones, Video } from 'lucide-react';
import { getItem, getStreamUrl } from '../../services/library.service';
import { usePlaybackPosition } from '../../hooks/usePlaybackPosition';
import AudioPlayer from '../../components/library/AudioPlayer';
import LockedState from '../../components/ui/LockedState';

function getYouTubeEmbedUrl(url) {
  if (!url || typeof url !== 'string') return null;
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
  const match = url.match(regExp);
  return match && match[2].length === 11 ? `https://www.youtube.com/embed/${match[2]}` : null;
}

function LibraryItemPage() {
  const { id } = useParams();
  const { loadPosition, persistNow, schedulePersist } = usePlaybackPosition(id);
  const lastKnownTimeRef = useRef(0);
  const videoRef = useRef(null);
  const videoSeekedRef = useRef(false);

  const [item, setItem] = useState(null);
  const [streamUrl, setStreamUrl] = useState(null);
  const [initialPosition, setInitialPosition] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [requiresSubscription, setRequiresSubscription] = useState(false);
  const [videoError, setVideoError] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);
      setRequiresSubscription(false);
      videoSeekedRef.current = false;

      try {
        const [itemRes, streamRes, savedPosition] = await Promise.all([
          getItem(id),
          getStreamUrl(id),
          loadPosition(),
        ]);

        if (cancelled) return;

        if (!itemRes.success) {
          setError(itemRes.error || 'This item is not available.');
          return;
        }

        setItem(itemRes.data);
        setInitialPosition(savedPosition || 0);
        lastKnownTimeRef.current = savedPosition || 0;
        setVideoError(false);

        if (streamRes.success) {
          setStreamUrl(streamRes.data.url);
        } else {
          setError(streamRes.error || 'Failed to generate a playback link.');
        }
      } catch (err) {
        if (cancelled) return;
        if (err.statusCode === 403) {
          setRequiresSubscription(true);
        } else {
          setError(err.message || 'Failed to load this item.');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [id]);

  useEffect(() => {
    function handleBeforeUnload() {
      persistNow(lastKnownTimeRef.current);
    }
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      persistNow(lastKnownTimeRef.current);
    };
  }, [id]);

  function handleProgress(seconds) {
    lastKnownTimeRef.current = seconds;
    schedulePersist(seconds);
  }

  function handlePause(seconds) {
    lastKnownTimeRef.current = seconds;
    persistNow(seconds);
  }

  // Video Event Handlers
  function handleVideoLoadedMetadata() {
    const video = videoRef.current;
    if (!video || videoSeekedRef.current) return;
    if (initialPosition > 0 && Number.isFinite(video.duration)) {
      const seekTo = Math.min(initialPosition, Math.max(0, video.duration - 1));
      video.currentTime = seekTo;
    }
    videoSeekedRef.current = true;
  }

  function handleVideoTimeUpdate() {
    const video = videoRef.current;
    if (!video) return;
    handleProgress(video.currentTime);
  }

  function handleVideoPause() {
    const video = videoRef.current;
    if (!video) return;
    handlePause(video.currentTime);
  }

  function handleVideoError() {
    setVideoError(true);
  }

  const meta = item?.metadata || {};
  const mediaSrc = streamUrl || meta.audio_url;
  const isVideo = item?.item_type === 'video' || (mediaSrc && (mediaSrc.includes('youtu.be') || mediaSrc.includes('youtube.com') || mediaSrc.endsWith('.mp4') || mediaSrc.endsWith('.webm')));
  const ytEmbedUrl = getYouTubeEmbedUrl(mediaSrc);
  const durationFmt = Number.isFinite(item?.duration_seconds) && item.duration_seconds > 0
    ? `${Math.floor(item.duration_seconds / 60)}m`
    : '0m';

  return (
    <div className="min-h-screen bg-ground px-4 md:px-6 py-8 sm:py-12">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Back Link */}
        <Link
          to="/library"
          className="inline-flex items-center gap-2 font-sans text-sm font-medium text-ink/70 hover:text-ink transition-colors"
        >
          <ArrowLeft size={16} aria-hidden="true" />
          Back to Library
        </Link>

        {loading && (
          <div className="flex items-center gap-2 text-ink/50 font-sans text-sm py-12 justify-center">
            <Loader2 size={20} className="animate-spin" aria-hidden="true" />
            Loading media item&hellip;
          </div>
        )}

        {!loading && requiresSubscription && (
          <LockedState
            title="ATLAS PRO SUBSCRIBER FEATURE"
            description="Audio & Video narratives are exclusively available to active ATLAS subscribers."
            buttonText="Upgrade to Pro"
            redirectPath="/pricing"
          />
        )}

        {!loading && !requiresSubscription && error && (
          <div className="bg-rose-50 border border-rose-200 rounded-xl p-4 flex items-center gap-2 text-rose-700 text-sm">
            <AlertCircle size={20} aria-hidden="true" />
            {error}
          </div>
        )}

        {!loading && !requiresSubscription && !error && item && (
          <div className="space-y-12">
            {/* Split Media + Metadata Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              {/* Left Column: Main Media Box */}
              <div className="lg:col-span-7">
                {ytEmbedUrl ? (
                  /* Case 1: YouTube Video Embed */
                  <div className="w-full aspect-video rounded-2xl overflow-hidden border border-rule shadow-md bg-black">
                    <iframe
                      src={ytEmbedUrl}
                      title={item.title}
                      className="w-full h-full border-0"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    />
                  </div>
                ) : isVideo && mediaSrc && !videoError ? (
                  /* Case 2: Uploaded / Direct Video File (HTML5 Video Player) */
                  <div className="w-full aspect-video rounded-2xl overflow-hidden border border-rule shadow-md bg-black flex items-center justify-center">
                    <video
                      ref={videoRef}
                      src={mediaSrc}
                      controls
                      playsInline
                      preload="metadata"
                      onLoadedMetadata={handleVideoLoadedMetadata}
                      onTimeUpdate={handleVideoTimeUpdate}
                      onPause={handleVideoPause}
                      onEnded={handleVideoPause}
                      onError={handleVideoError}
                      className="w-full h-full object-contain"
                    />
                  </div>
                ) : isVideo && mediaSrc && videoError ? (
                  /* Case 2b: Video failed to load — graceful fallback instead of a broken/blank player */
                  <div className="w-full aspect-video rounded-2xl border border-rule shadow-md bg-ground flex flex-col items-center justify-center gap-2 text-ink/60 p-8 text-center">
                    <AlertCircle size={28} aria-hidden="true" />
                    <span className="text-sm font-medium">Couldn&apos;t load this video. Please try again later.</span>
                  </div>
                ) : meta.cover_image_url ? (
                  /* Case 3: Audio Item with Cover Image Artwork */
                  <div className="w-full aspect-square sm:aspect-[1.1/1] bg-[#D9D9D9] border border-rule rounded-2xl overflow-hidden shadow-2xs relative">
                    <img
                      src={meta.cover_image_url}
                      alt={item.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                ) : (
                  /* Case 4: Audio Item Default Media Box Placeholder */
                  <div className="w-full aspect-square sm:aspect-[1.1/1] bg-[#D9D9D9] border border-rule rounded-2xl flex items-center justify-center p-8 shadow-2xs">
                    <div className="w-20 h-20 rounded-full bg-paper border border-rule flex items-center justify-center text-ink/60 shadow-xs">
                      {isVideo ? <Video size={36} /> : <Headphones size={36} />}
                    </div>
                  </div>
                )}
              </div>

              {/* Right Column: Title, Subtitle, Type Label, Description & Audio Player */}
              <div className="lg:col-span-5 space-y-5">
                <div>
                  <div className="flex items-baseline justify-between gap-2">
                    <h1 className="font-sans font-bold text-2xl sm:text-3xl tracking-tight text-ink">
                      {item.title}
                    </h1>
                    <span className="font-mono text-xs font-bold text-ink/70 shrink-0">{durationFmt}</span>
                  </div>

                  {meta.subtitle && (
                    <div className="text-xs font-mono text-ink/60 mt-1 font-semibold">
                      ({meta.subtitle})
                    </div>
                  )}

                  <div className="font-mono text-[11px] uppercase font-bold text-ink/50 mt-2 tracking-wider">
                    {isVideo ? 'VIDEO RECORD' : 'AUDIO RECORD'}
                  </div>
                </div>

                {item.description && (
                  <p className="font-serif text-sm text-ink/80 leading-relaxed pt-1">
                    {item.description}
                  </p>
                )}

                {/* Render Audio Player for Audio Tracks */}
                {!isVideo && !ytEmbedUrl && (
                  <div className="pt-2">
                    <AudioPlayer
                      src={mediaSrc}
                      initialPositionSeconds={initialPosition}
                      onProgress={handleProgress}
                      onPause={handlePause}
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Bottom Recommendations */}
            <div className="border-t border-rule pt-8 space-y-6">
              <h3 className="font-sans font-bold text-lg text-ink">You may also be interested in</h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {[1, 2, 3, 4].map((idx) => (
                  <div key={idx} className="bg-ground border border-rule rounded-xl h-36 flex flex-col items-center justify-center p-4 hover:border-ink transition-colors cursor-pointer text-center">
                    <Headphones className="w-5 h-5 text-ink/40 mb-2" />
                    <span className="text-xs font-mono text-ink/60 font-semibold uppercase">Related Track #{idx}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default LibraryItemPage;
