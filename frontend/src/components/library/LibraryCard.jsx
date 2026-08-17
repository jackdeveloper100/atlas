/**
 * components/library/LibraryCard.jsx
 *
 * Single Library item card matching exact prompt UI reference design.
 * Features uniform media box (grey placeholder + audio icon for audio; YouTube preview for video),
 * title, duration tag (e.g. 0m), and type label (AUDIO RECORD / VIDEO RECORD).
 */

import { Link } from 'react-router-dom';
import { Headphones, Video } from 'lucide-react';
import { formatDuration } from '../../utils/formatters';

function getYouTubeThumbnailUrl(url) {
  if (!url || typeof url !== 'string') return null;
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
  const match = url.match(regExp);
  return match && match[2].length === 11 ? `https://img.youtube.com/vi/${match[2]}/mqdefault.jpg` : null;
}

function LibraryCard({ item }) {
  const meta = item?.metadata || {};
  const isVideo = item?.item_type === 'video' || (meta.audio_url && (meta.audio_url.includes('youtu.be') || meta.audio_url.includes('youtube.com')));
  const coverUrl = meta.cover_image_url || getYouTubeThumbnailUrl(meta.audio_url);
  const durationFmt = Number.isFinite(item?.duration_seconds) && item.duration_seconds > 0
    ? formatDuration(item.duration_seconds)
    : '0m';

  return (
    <Link
      to={`/library/${item.id}`}
      className="group block text-ink transition-opacity hover:opacity-90 w-full no-underline"
    >
      {/* Uniform Media Box (Grey Placeholder / Artwork / YouTube Preview) */}
      <div className="w-full aspect-[1.1/1] bg-[#D9D9D9] rounded-md relative p-2 flex flex-col items-center justify-center overflow-hidden border border-rule/40 shadow-2xs">
        {coverUrl ? (
          <img
            src={coverUrl}
            alt={item.title}
            className="absolute inset-0 w-full h-full object-cover rounded-md"
          />
        ) : isVideo ? (
          <div className="flex flex-col items-center gap-2 text-ink/40">
            <Video size={36} strokeWidth={1.5} />
          </div>
        ) : (
          <div className="w-12 h-12 rounded-full bg-paper/80 border border-rule flex items-center justify-center text-ink/60 shadow-xs">
            <Headphones size={24} strokeWidth={1.5} />
          </div>
        )}
      </div>

      {/* Product Title & Duration Row */}
      <div className="flex items-center justify-between font-sans text-xs sm:text-sm font-bold text-ink mt-2.5 no-underline">
        <span className="truncate pr-2 no-underline">{item.title || 'Product'}</span>
        <span className="shrink-0 font-mono text-xs text-ink/70 no-underline">{durationFmt}</span>
      </div>

      {/* Type Label (AUDIO RECORD / VIDEO RECORD) */}
      <div className="font-mono text-[10px] uppercase font-bold text-ink/50 mt-1 tracking-wider">
        {isVideo ? 'VIDEO RECORD' : 'AUDIO RECORD'}
      </div>

      {/* Description Snippet */}
      {item.description && (
        <p className="font-sans text-xs text-ink/60 line-clamp-2 leading-relaxed mt-1.5 no-underline">
          {item.description}
        </p>
      )}
    </Link>
  );
}

export default LibraryCard;
