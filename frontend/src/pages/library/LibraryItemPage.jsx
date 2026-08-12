/**
 * pages/library/LibraryItemPage.jsx
 *
 * Single Library item: metadata + AudioPlayer (Phase 4, audio only).
 *
 * Subscription access control is enforced entirely server-side
 * (authenticate + requireSubscription on every /api/library/* route).
 * This page does not gate itself — a 403 from the API is handled here with
 * an in-page "subscribe to continue" message, per the architecture decision
 * to keep ProtectedRoute auth-only and never trust the frontend for
 * subscription state.
 */

import { useEffect, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Loader2, AlertCircle, ArrowLeft, Headphones } from 'lucide-react';
import { getItem, getStreamUrl } from '../../services/library.service';
import { usePlaybackPosition } from '../../hooks/usePlaybackPosition';
import AudioPlayer from '../../components/library/AudioPlayer';
import LockedState from '../../components/ui/LockedState';

function LibraryItemPage() {
  const { id } = useParams();
  const { loadPosition, persistNow, schedulePersist } = usePlaybackPosition(id);
  const lastKnownTimeRef = useRef(0);

  const [item, setItem] = useState(null);
  const [streamUrl, setStreamUrl] = useState(null);
  const [initialPosition, setInitialPosition] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [requiresSubscription, setRequiresSubscription] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);
      setRequiresSubscription(false);

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  // Best-effort save before leaving the page (tab close, navigation away).
  useEffect(() => {
    function handleBeforeUnload() {
      persistNow(lastKnownTimeRef.current);
    }
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      persistNow(lastKnownTimeRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  function handleProgress(seconds) {
    lastKnownTimeRef.current = seconds;
    schedulePersist(seconds);
  }

  function handlePause(seconds) {
    lastKnownTimeRef.current = seconds;
    persistNow(seconds);
  }

  return (
    <div className="min-h-screen bg-ground px-4 md:px-6 py-12 md:py-16">
      <div className="max-w-3xl mx-auto">
        <Link
          to="/library"
          className="inline-flex items-center gap-2 font-sans text-small text-ink-muted hover:text-ink hover:underline transition-all duration-hover mb-8"
        >
          <ArrowLeft size={16} aria-hidden="true" />
          Back to Library
        </Link>

        {loading && (
          <div className="flex items-center gap-2 text-ink-muted font-sans text-body">
            <Loader2 size={20} className="animate-spin" aria-hidden="true" />
            Loading&hellip;
          </div>
        )}

        {!loading && requiresSubscription && (
          <LockedState
            title="AUDIO PRO FEATURE"
            description="Streaming audio narratives and playback position saving are exclusively available to active ATLAS Pro subscribers."
            buttonText="Upgrade to Pro"
            redirectPath="/pricing"
          />
        )}

        {!loading && !requiresSubscription && error && (
          <div className="bg-danger/10 border border-danger rounded-card p-4 flex items-center gap-2 text-danger font-sans text-body">
            <AlertCircle size={20} aria-hidden="true" />
            {error}
          </div>
        )}

        {!loading && !requiresSubscription && !error && item && (
          <div className="space-y-12">
            {/* Split Media + Detail Layout matching Figma Library - on click.png */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              {/* Left: Large Placeholder Artwork Box (#D9D9D9) */}
              <div className="lg:col-span-7 bg-[#D9D9D9] border border-rule rounded-card h-80 sm:h-96 flex items-center justify-center relative p-8">
                <div className="w-16 h-16 rounded-full bg-paper border border-rule flex items-center justify-center text-ink-muted shadow-xs">
                  <Headphones size={32} />
                </div>
              </div>

              {/* Right: Product Metadata + Audio Player */}
              <div className="lg:col-span-5 space-y-6">
                <div className="flex items-start justify-between">
                  <div>
                    <h1 className="font-sans font-bold text-heading tracking-tight text-ink">{item.title}</h1>
                    <p className="text-xs font-mono text-ink-muted mt-1 uppercase tracking-wider">Audio Record</p>
                  </div>
                  <span className="font-mono text-body font-bold text-ink shrink-0 ml-2">
                    {Number.isFinite(item.duration_seconds) ? `${Math.floor(item.duration_seconds / 60)}m` : '$XX.XX'}
                  </span>
                </div>

                {item.description && (
                  <p className="font-serif text-body text-ink-muted leading-relaxed">{item.description}</p>
                )}

                {/* Audio Player Component */}
                <AudioPlayer
                  src={streamUrl}
                  initialPositionSeconds={initialPosition}
                  onProgress={handleProgress}
                  onPause={handlePause}
                />
              </div>
            </div>

            {/* Bottom Recommendation Row matching Figma "You may also be interested in" */}
            <div className="border-t border-rule pt-8 space-y-6">
              <h3 className="font-sans font-bold text-subhead text-ink">You may also be interested in</h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {[1, 2, 3, 4].map((idx) => (
                  <div key={idx} className="bg-ground border border-rule rounded-card h-40 flex items-center justify-center p-4 hover:border-ink transition-colors cursor-pointer">
                    <span className="text-xs font-mono text-ink-faint uppercase">Related Track #{idx}</span>
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
