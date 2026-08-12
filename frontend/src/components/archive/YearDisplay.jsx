import React from 'react';
import { Users, Shield, Calendar, Activity } from 'lucide-react';

/**
 * YearDisplay Component
 * Display card presenting large IBM Plex Mono year numbers and high-level snapshot stats.
 */
export function YearDisplay({ selectedYear, snapshot }) {
  // Real snapshot shape: nations/regions/events are top-level, world only has counts.
  const nationsCount = snapshot?.world?.nationCount ?? snapshot?.nations?.length ?? 0;
  const regionsCount = snapshot?.world?.regionCount ?? snapshot?.regions?.length ?? 0;
  const eventsCount = snapshot?.events?.length || 0;
  const quarter = snapshot?.simulation?.quarter;

  // Calculate total global population
  const totalPopulation =
    snapshot?.world?.totalPopulation ??
    snapshot?.nations?.reduce((sum, n) => sum + (n.population || 0), 0);

  const formattedYear = String(selectedYear).padStart(4, '0');

  return (
    <div className="bg-paper border border-rule rounded-card p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
      {/* Left: Large Year Counter & Epoch Badge */}
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-3">
          <span className="text-xs font-mono text-ink-muted uppercase">
            {quarter ? `SIMULATION CLOCK: Q${quarter}` : 'SIMULATION CLOCK: N/A'}
          </span>
        </div>
        <div className="flex items-baseline gap-2 mt-1">
          <span className="text-[12px] font-mono text-ink-muted uppercase tracking-widest">YEAR</span>
          <span className="font-mono text-4xl sm:text-5xl font-bold tracking-tight text-ink">
            {formattedYear}
          </span>
        </div>
      </div>

      {/* Right: High-level Snapshot Stats Metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-4 md:pt-0 border-t md:border-t-0 md:border-l border-rule md:pl-8 text-sm">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-ground border border-rule flex items-center justify-center text-ink-muted">
            <Users className="w-4 h-4" />
          </div>
          <div className="flex flex-col">
            <span className="text-[11px] font-mono text-ink-muted uppercase">NATIONS</span>
            <span className="font-mono font-bold text-ink">{nationsCount}</span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-ground border border-rule flex items-center justify-center text-ink-muted">
            <Shield className="w-4 h-4" />
          </div>
          <div className="flex flex-col">
            <span className="text-[11px] font-mono text-ink-muted uppercase">REGIONS</span>
            <span className="font-mono font-bold text-ink">{regionsCount}</span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-ground border border-rule flex items-center justify-center text-ink-muted">
            <Activity className="w-4 h-4" />
          </div>
          <div className="flex flex-col">
            <span className="text-[11px] font-mono text-ink-muted uppercase">GLOBAL POP</span>
            <span className="font-mono font-bold text-ink">
              {totalPopulation ? totalPopulation.toLocaleString() : 'N/A'}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-ground border border-rule flex items-center justify-center text-ink-muted">
            <Calendar className="w-4 h-4" />
          </div>
          <div className="flex flex-col">
            <span className="text-[11px] font-mono text-ink-muted uppercase">EVENTS</span>
            <span className="font-mono font-bold text-ink">{eventsCount}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default YearDisplay;
