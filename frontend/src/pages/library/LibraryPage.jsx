/**
 * pages/library/LibraryPage.jsx
 *
 * Atlas Library Page layout matching Screenshot 2 & stripe.png reference design.
 * Features a centered max-width container (~840px), category sidebar,
 * dynamic filtering by category, and dynamic 4-column product grid created by admin.
 */

import { useEffect, useState, useMemo } from 'react';
import { Loader2, AlertCircle, Headphones } from 'lucide-react';
import { listItems } from '../../services/library.service';
import LibraryGrid from '../../components/library/LibraryGrid';
import LockedState from '../../components/ui/LockedState';

function LibraryPage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState('Overview');

  const categories = ['Overview', 'Political', 'Economy', 'Health', 'Law'];

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);
      try {
        const res = await listItems({ type: 'audio' });
        if (cancelled) return;
        if (res.success && res.data.items?.length > 0) {
          setItems(res.data.items);
        } else {
          setItems([]);
        }
      } catch (err) {
        if (!cancelled) setError(err.message || 'Failed to load the library.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  // Filter items dynamically by category (Only dynamic items created by admin)
  const categoryFilteredItems = useMemo(() => {
    return items.filter((item) => {
      if (selectedCategory === 'Overview') return true;
      const cat = item.metadata?.category || 'Political';
      return cat === selectedCategory;
    });
  }, [items, selectedCategory]);

  return (
    <div className="w-full bg-white min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
        <div className="flex flex-col md:flex-row gap-8 lg:gap-12 items-start">
          {/* Left Category Sidebar (~110px width) */}
          <aside className="w-full md:w-32 lg:w-36 shrink-0 flex flex-row md:flex-col gap-2 overflow-x-auto no-scrollbar">
            {categories.map((cat) => {
              const isActive = selectedCategory === cat;
              return (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`text-center text-xs font-medium px-3.5 py-2 transition-all shrink-0 ${
                    isActive
                      ? 'bg-black text-white font-semibold shadow-xs'
                      : 'text-ink hover:bg-neutral-100'
                  }`}
                >
                  {cat}
                </button>
              );
            })}
          </aside>

          {/* Dynamic Product Area */}
          <main className="flex-1 w-full min-w-0">
            {loading && (
              <div className="flex items-center gap-2 text-neutral-500 font-sans text-xs py-12 justify-center">
                <Loader2 size={16} className="animate-spin" aria-hidden="true" />
                Loading library items&hellip;
              </div>
            )}

            {!loading && error && (
              error.includes('403') || error.toLowerCase().includes('subscription') || error.toLowerCase().includes('subscriber') ? (
                <LockedState
                  title="LIBRARY PRO FEATURE"
                  description="Audio narratives drawn from simulated history are exclusively available to active ATLAS Pro subscribers."
                  buttonText="Upgrade to Pro"
                  redirectPath="/pricing"
                />
              ) : (
                <div className="bg-red-50 border border-red-200 rounded-md p-4 flex items-center gap-2 text-red-700 text-xs font-sans">
                  <AlertCircle size={16} aria-hidden="true" />
                  {error}
                </div>
              )
            )}

            {!loading && !error && (
              categoryFilteredItems.length > 0 ? (
                <LibraryGrid items={categoryFilteredItems} />
              ) : (
                <div className="p-16 text-center border border-dashed border-rule rounded-2xl bg-ground/40 space-y-3">
                  <div className="w-12 h-12 rounded-full bg-paper border border-rule mx-auto flex items-center justify-center text-ink/40">
                    <Headphones className="w-6 h-6" />
                  </div>
                  <h3 className="font-display text-lg font-bold text-ink">No Audio Tracks Available</h3>
                  <p className="text-xs text-ink/60 max-w-sm mx-auto">
                    There are no published audio tracks in the "{selectedCategory}" category yet.
                  </p>
                </div>
              )
            )}
          </main>
        </div>
      </div>
    </div>
  );
}

export default LibraryPage;
