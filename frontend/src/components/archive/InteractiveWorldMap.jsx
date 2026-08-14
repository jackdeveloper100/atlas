/**
 * InteractiveWorldMap.jsx
 *
 * Vector SVG interactive world map rendering dynamic database regions and colors.
 */

import React, { useState, useMemo } from 'react';
import { MapPin, Shield } from 'lucide-react';
import { computeMapLayout } from '../../utils/mapLayout';

export function InteractiveWorldMap({ regions = [], nations = [], selectedRegionId, onSelectRegion }) {
  const [hoveredRegion, setHoveredRegion] = useState(null);

  const nationsMap = useMemo(() => {
    const map = {};
    (nations || []).forEach((n) => {
      map[n.id] = n;
    });
    return map;
  }, [nations]);

  const mapRegions = useMemo(() => {
    return computeMapLayout(regions, nationsMap);
  }, [regions, nationsMap]);

  return (
    <div className="relative w-full bg-[#B5C2A4] rounded-card border border-rule overflow-hidden shadow-inner flex flex-col justify-between min-h-[460px] p-6">
      {/* Top Map Status Bar */}
      <div className="flex items-center justify-between text-xs font-mono font-bold text-ink/80 z-10 pointer-events-none">
        <span className="flex items-center gap-1.5 bg-paper/80 backdrop-blur-xs px-3 py-1 rounded-full border border-rule shadow-2xs">
          <MapPin className="w-3.5 h-3.5 text-red-600" />
          <span>INTERACTIVE WORLD MAP · CLICK REGION FOR INSPECTOR</span>
        </span>
        <span className="bg-paper/80 backdrop-blur-xs px-3 py-1 rounded-full border border-rule shadow-2xs">
          {regions.length} REGIONS
        </span>
      </div>

      {/* SVG Canvas */}
      <div className="absolute inset-0 flex items-center justify-center p-4">
        <svg viewBox="0 0 1000 600" className="w-full h-full max-h-[460px] drop-shadow-md select-none">
          {mapRegions.map((r) => {
            const nation = nationsMap[r.nationId] || {};
            const isHovered = hoveredRegion?.id === r.id;
            const isSelected = selectedRegionId === r.id;

            return (
              <g
                key={r.id}
                className="cursor-pointer transition-all duration-200"
                onMouseEnter={() => setHoveredRegion({ ...r, nation })}
                onMouseLeave={() => setHoveredRegion(null)}
                onClick={() => onSelectRegion && onSelectRegion({ ...r, nation })}
              >
                <path
                  d={r.svgPath}
                  fill={r.fillColor}
                  stroke={isSelected ? '#000000' : isHovered ? '#111111' : '#4B5563'}
                  strokeWidth={isSelected ? '3.5' : isHovered ? '2.5' : '1.5'}
                  opacity={isHovered ? '0.95' : '0.85'}
                  className="transition-all duration-150"
                />

                <text
                  x={r.labelX}
                  y={r.labelY}
                  fill="#FFFFFF"
                  fontSize="12"
                  fontWeight="bold"
                  textAnchor="middle"
                  className="pointer-events-none drop-shadow-sm font-sans tracking-wide"
                >
                  {r.name}
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      {/* Hover Info Tooltip */}
      {hoveredRegion && (
        <div className="absolute bottom-6 left-6 z-20 bg-paper/95 backdrop-blur-md border border-rule rounded-lg shadow-lg p-3 text-xs animate-in fade-in duration-150 max-w-xs">
          <div className="font-bold text-ink flex items-center gap-1.5">
            <MapPin className="w-3.5 h-3.5 text-amber-600" />
            <span>{hoveredRegion.name}</span>
          </div>
          <div className="text-ink/70 flex items-center gap-1 mt-1">
            <Shield className="w-3 h-3 text-ink/50" />
            <span>{hoveredRegion.nation?.name || 'Controlled Territory'}</span>
          </div>
          <div className="text-[10px] text-ink/50 mt-1 font-mono">
            Click territory to open full inspection panel →
          </div>
        </div>
      )}
    </div>
  );
}

export default InteractiveWorldMap;
