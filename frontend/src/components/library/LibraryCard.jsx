/**
 * components/library/LibraryCard.jsx
 *
 * Single Library product card matching Screenshot 2 reference design.
 * Dimensions: ~108px width, 100px height light-gray placeholder (#D8D8D8),
 * tight 6-9px typography, and monochrome feature icons.
 */

import { Link } from 'react-router-dom';
import { Settings, HelpCircle, Users } from 'lucide-react';
import { formatDuration } from '../../utils/formatters';

function LibraryCard({ item }) {
  const showBadge = item?.showBadge !== false;

  return (
    <Link
      to={`/library/${item.id}`}
      className="group block text-ink transition-opacity hover:opacity-90 w-full no-underline"
    >
      {/* Light Gray Image Placeholder (#D9D9D9 per DESIGN.md) */}
      <div className="w-full aspect-[1.1/1] bg-[#D9D9D9] rounded-md relative p-2 flex flex-col justify-end overflow-hidden">
        {showBadge && (
          <span className="text-[10px] font-sans font-medium text-neutral-600 absolute bottom-2 right-2 pointer-events-none text-right leading-none">
            Included in subscription
          </span>
        )}
      </div>

      {/* Product Title & Price Row */}
      <div className="flex items-center justify-between font-sans text-xs sm:text-sm font-bold text-ink mt-2 no-underline">
        <span className="truncate pr-2 no-underline">{item.title || 'Product'}</span>
        <span className="shrink-0 no-underline">{Number.isFinite(item.duration_seconds) ? formatDuration(item.duration_seconds) : '$XX.XX'}</span>
      </div>

      {/* Description Snippet */}
      <p className="font-sans text-xs text-neutral-500 line-clamp-2 leading-relaxed mt-1 no-underline">
        {item.description || 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed eu rhoncus nunc, at scelerisque velit.'}
      </p>

      {/* Bottom Action Icons */}
      <div className="flex items-center gap-2 text-neutral-500 mt-2">
        <Settings size={14} strokeWidth={1.5} />
        <HelpCircle size={14} strokeWidth={1.5} />
        <Users size={14} strokeWidth={1.5} />
      </div>
    </Link>
  );
}

export default LibraryCard;

