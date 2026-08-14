/**
 * MetricCard.jsx
 *
 * Generic metric renderer supporting 11 display types:
 * number, percentage, currency, rating, text, progress, sparkline, bar, line, donut, badge.
 */

import React from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

export function MetricCard({ metric }) {
  if (!metric) return null;

  const {
    label,
    value,
    numericValue,
    unit,
    prefix,
    suffix,
    description,
    trendValue,
    trendType,
    displayType = 'number',
    series = [],
  } = metric;

  const formattedValue = () => {
    if (value !== null && value !== undefined && value !== '') return `${prefix || ''}${value}${suffix || ''}`;
    if (numericValue !== null && numericValue !== undefined) {
      if (displayType === 'currency') return `${prefix || '$'}${numericValue.toLocaleString()}${suffix || ''}`;
      if (displayType === 'percentage') return `${prefix || ''}${numericValue}%${suffix || ''}`;
      return `${prefix || ''}${numericValue.toLocaleString()}${suffix || ''}`;
    }
    return '—';
  };

  const renderTrend = () => {
    if (!trendType || trendValue === null || trendValue === undefined) return null;
    let colorClass = 'text-gray-500';
    let Icon = Minus;

    if (trendType === 'up') {
      colorClass = 'text-emerald-600';
      Icon = TrendingUp;
    } else if (trendType === 'down') {
      colorClass = 'text-rose-600';
      Icon = TrendingDown;
    }

    return (
      <div className={`flex items-center text-xs font-mono font-medium ${colorClass} gap-1 mt-1`}>
        <Icon className="w-3.5 h-3.5" />
        <span>{trendValue > 0 ? `+${trendValue}%` : `${trendValue}%`}</span>
      </div>
    );
  };

  const renderSeriesGraphic = () => {
    if (!Array.isArray(series) || series.length === 0) return null;

    const values = series.map((s) => Number(s.value));
    const min = Math.min(...values);
    const max = Math.max(...values);
    const range = max - min || 1;

    if (displayType === 'bar') {
      return (
        <div className="flex items-end gap-1 h-12 mt-3 pt-2 border-t border-rule/30">
          {series.map((pt, i) => {
            const heightPct = Math.max(10, Math.round(((pt.value - min) / range) * 100));
            return (
              <div key={i} className="flex-1 flex flex-col items-center group">
                <div
                  className="w-full bg-accent/70 group-hover:bg-accent rounded-t transition-all"
                  style={{ height: `${heightPct}%` }}
                />
              </div>
            );
          })}
        </div>
      );
    }

    // Default sparkline / line
    const width = 180;
    const height = 36;
    const points = series
      .map((pt, i) => {
        const x = (i / Math.max(1, series.length - 1)) * width;
        const y = height - ((pt.value - min) / range) * (height - 8) - 4;
        return `${x},${y}`;
      })
      .join(' ');

    return (
      <div className="mt-3 pt-2 border-t border-rule/30">
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-9 stroke-accent fill-none stroke-2">
          <polyline points={points} />
        </svg>
      </div>
    );
  };

  const renderContent = () => {
    if (displayType === 'progress') {
      const pct = Math.min(100, Math.max(0, numericValue || 0));
      return (
        <div className="mt-2">
          <div className="flex justify-between text-xs font-mono font-semibold mb-1">
            <span>{formattedValue()}</span>
            <span>{pct}%</span>
          </div>
          <div className="w-full h-2 bg-rule/30 rounded-full overflow-hidden">
            <div className="h-full bg-accent transition-all duration-300" style={{ width: `${pct}%` }} />
          </div>
        </div>
      );
    }

    if (displayType === 'badge') {
      return (
        <div className="mt-2 inline-block px-2.5 py-1 rounded-full text-xs font-semibold bg-accent/15 text-accent border border-accent/30">
          {formattedValue()}
        </div>
      );
    }

    return (
      <>
        <div className="text-2xl font-serif font-bold text-ink mt-1">
          {formattedValue()}
          {unit && <span className="text-xs font-sans font-normal text-ink/60 ml-1.5">{unit}</span>}
        </div>
        {renderTrend()}
        {renderSeriesGraphic()}
      </>
    );
  };

  return (
    <div className="bg-paper border border-rule rounded-card p-4 shadow-2xs hover:shadow-xs transition-all flex flex-col justify-between">
      <div>
        <div className="text-xs font-mono font-bold uppercase tracking-wider text-ink/60">{label}</div>
        {description && <div className="text-[11px] text-ink/50 mt-0.5">{description}</div>}
        {renderContent()}
      </div>
    </div>
  );
}

export default MetricCard;
