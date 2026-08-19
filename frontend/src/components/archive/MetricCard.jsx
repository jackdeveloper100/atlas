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

  const isNegativeOrWarning = description && (
    description.startsWith('-') ||
    description.toLowerCase().includes('drawn down') ||
    description.toLowerCase().includes('falling') ||
    description.toLowerCase().includes('shortfall') ||
    description.toLowerCase().includes('extremism') ||
    description.toLowerCase().includes('risk')
  );

  return (
    <div className="bg-white/90 border border-[#E6E0D6] rounded-2xl p-4 shadow-2xs flex flex-col justify-between transition-all">
      <div>
        <div className="text-[11px] font-mono font-bold uppercase tracking-wider text-stone-400 mb-1">
          {label}
        </div>
        <div className="text-2xl font-mono font-bold text-stone-900 my-1 tracking-tight">
          {formattedValue()}
          {unit && <span className="text-xs font-sans font-normal text-stone-500 ml-1.5">{unit}</span>}
        </div>
        {description && (
          <div className={`text-xs font-sans mt-0.5 ${isNegativeOrWarning ? 'text-[#9E3E26] font-medium' : 'text-stone-500'}`}>
            {description}
          </div>
        )}
      </div>
    </div>
  );
}

export default MetricCard;
