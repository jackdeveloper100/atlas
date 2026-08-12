import React, { useState, useEffect } from 'react';
import { Plus, Minus } from 'lucide-react';

export function YearScrubber({
  selectedYear,
  onYearChange,
  publishedYears = [],
  minYear = 0,
  maxYear = 0,
  isLoading = false,
}) {
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    let interval = null;
    if (isPlaying) {
      interval = setInterval(() => {
        onYearChange((prev) => {
          const idx = publishedYears.indexOf(prev);
          if (idx !== -1 && idx < publishedYears.length - 1) {
            return publishedYears[idx + 1];
          } else {
            setIsPlaying(false);
            return prev;
          }
        });
      }, 1200);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isPlaying, publishedYears, onYearChange]);

  const handleSliderChange = (e) => {
    const val = parseInt(e.target.value, 10);
    if (!isNaN(val)) {
      onYearChange(val);
    }
  };

  const incrementYear = () => {
    if (selectedYear < maxYear) onYearChange(selectedYear + 1);
  };

  const decrementYear = () => {
    if (selectedYear > minYear) onYearChange(selectedYear - 1);
  };

  return (
    <div className="bg-paper/95 backdrop-blur border border-rule rounded-card px-5 py-2.5 shadow-float inline-flex items-center gap-6 max-w-full overflow-x-auto no-scrollbar">
      {/* Slider Range matching Figma */}
      <div className="flex items-center gap-3 shrink-0">
        <span className="font-mono text-xs text-ink-muted">{minYear}</span>
        <input
          type="range"
          min={minYear}
          max={maxYear}
          step={1}
          value={selectedYear}
          onChange={handleSliderChange}
          disabled={isPlaying || isLoading}
          className="w-36 sm:w-48 h-1.5 bg-ground rounded-lg appearance-none cursor-pointer accent-ink focus:outline-none"
        />
        <span className="font-mono text-xs text-ink-muted">{maxYear}</span>
      </div>

      {/* Year Increment / Decrement Selector "+ 1924 -" */}
      <div className="flex items-center gap-2 font-mono text-sm font-bold text-ink shrink-0 bg-ground/60 px-3 py-1 rounded border border-rule">
        <button onClick={incrementYear} className="hover:text-accent transition-colors p-0.5" title="Next Year">
          <Plus className="w-3.5 h-3.5" />
        </button>
        <span>{selectedYear}</span>
        <button onClick={decrementYear} className="hover:text-accent transition-colors p-0.5" title="Previous Year">
          <Minus className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}

export default YearScrubber;
