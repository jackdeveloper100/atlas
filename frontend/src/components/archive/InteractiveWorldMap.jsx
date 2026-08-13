/**
 * InteractiveWorldMap.jsx
 *
 * Vector SVG interactive world map component matching Figma design photos.
 * Displays nation territory color fills and handles region selection clicks.
 */

import React, { useState } from 'react';
import { MapPin, Shield } from 'lucide-react';

const NATION_COLORS = [
  '#F0562D', // Red / Rust
  '#3B82F6', // Blue
  '#EAB308', // Gold / Yellow
  '#10B981', // Emerald / Green
  '#8B5CF6', // Purple
  '#F97316', // Orange
  '#06B6D4', // Cyan
  '#EC4899', // Pink
];

export function InteractiveWorldMap({ regions = [], nations = [], selectedRegionId, onSelectRegion }) {
  const [hoveredRegion, setHoveredRegion] = useState(null);

  // Map nation ID to distinct color fill
  const nationColorMap = React.useMemo(() => {
    const map = {};
    nations.forEach((n, idx) => {
      map[n.id] = NATION_COLORS[idx % NATION_COLORS.length];
    });
    return map;
  }, [nations]);

  const nationMap = React.useMemo(() => {
    const map = {};
    nations.forEach((n) => {
      map[n.id] = n;
    });
    return map;
  }, [nations]);

  // Pre-defined SVG landmass region paths matching Figma continent shapes
  const mapRegions = [
    {
      id: 'region_01',
      name: 'Amber Vale',
      nationId: nations[0]?.id || 'nation_01',
      path: 'M180,80 C240,40 320,50 380,80 C440,110 490,90 530,60 C570,30 620,50 640,90 C660,130 630,170 590,190 C550,210 520,250 480,270 C440,290 390,260 360,220 C330,180 290,160 250,180 C210,200 170,160 150,130 Z',
      labelX: 380,
      labelY: 150,
    },
    {
      id: 'region_02',
      name: 'Ashen Reach',
      nationId: nations[1]?.id || 'nation_02',
      path: 'M530,60 C580,20 640,40 680,80 C720,120 750,180 710,220 C670,260 620,240 580,210 C540,180 500,140 530,60 Z',
      labelX: 620,
      labelY: 130,
    },
    {
      id: 'region_03',
      name: 'Verdant Basin',
      nationId: nations[2]?.id || 'nation_03',
      path: 'M100,240 C160,200 240,210 300,250 C360,290 400,340 350,380 C300,420 220,410 160,370 C100,330 60,280 100,240 Z',
      labelX: 230,
      labelY: 310,
    },
    {
      id: 'region_04',
      name: 'Highland Ridge',
      nationId: nations[3]?.id || 'nation_04',
      path: 'M350,280 C410,260 480,290 520,330 C560,370 530,420 470,430 C410,440 360,390 330,350 Z',
      labelX: 430,
      labelY: 360,
    },
    {
      id: 'region_05',
      name: 'Eastern Sound',
      nationId: nations[0]?.id || 'nation_01',
      path: 'M540,320 C580,300 630,330 660,370 C690,410 670,450 620,460 C570,470 530,430 520,380 Z',
      labelX: 600,
      labelY: 390,
    },
  ];

  return (
    <div className="relative w-full bg-[#B5C2A4] rounded-card border border-rule overflow-hidden shadow-inner flex flex-col justify-between min-h-[460px] p-6">
      {/* Top Map Status Bar */}
      <div className="flex items-center justify-between text-xs font-mono font-bold text-ink/80 z-10 pointer-events-none">
        <span className="flex items-center gap-1.5 bg-paper/80 backdrop-blur-xs px-3 py-1 rounded-full border border-rule shadow-2xs">
          <MapPin className="w-3.5 h-3.5 text-red-600" />
          <span>INTERACTIVE WORLD MAP · CLICK REGION FOR INSPECTOR</span>
        </span>
        <span className="bg-paper/80 backdrop-blur-xs px-3 py-1 rounded-full border border-rule shadow-2xs">
          {regions.length || mapRegions.length} REGIONS INGRESSED
        </span>
      </div>

      {/* SVG Interactive Map Vector Canvas */}
      <div className="absolute inset-0 flex items-center justify-center p-4">
        <svg
          viewBox="0 0 850 500"
          className="w-full h-full max-h-[460px] drop-shadow-md select-none"
        >
          {/* Unclaimed Outer Outlines */}
          <g stroke="#667055" strokeWidth="1" strokeDasharray="3 3" fill="none" opacity="0.6">
            <path d="M680,120 Q 730,90, 780,140 T 820,240 T 720,320 Z" />
            <path d="M450,220 Q 480,200, 510,230 T 490,280 Z" />
            <path d="M570,40 Q 610,20, 650,50 T 630,90 Z" />
          </g>

          {/* Interactive Colored Landmass Regions */}
          {mapRegions.map((r, idx) => {
            const actualRegion = regions.find((reg) => reg.id === r.id) || r;
            const nation = nationMap[actualRegion.nationId] || nations[idx % nations.length];
            const fillColor = nationColorMap[nation?.id] || NATION_COLORS[idx % NATION_COLORS.length];
            const isHovered = hoveredRegion?.id === r.id;
            const isSelected = selectedRegionId === r.id;

            return (
              <g
                key={r.id}
                className="cursor-pointer transition-all duration-200"
                onMouseEnter={() => setHoveredRegion({ ...actualRegion, nation })}
                onMouseLeave={() => setHoveredRegion(null)}
                onClick={() => onSelectRegion({ ...actualRegion, nation })}
              >
                <path
                  d={r.path}
                  fill={fillColor}
                  stroke={isSelected ? '#000000' : isHovered ? '#111111' : '#4B5563'}
                  strokeWidth={isSelected ? '3.5' : isHovered ? '2.5' : '1.5'}
                  opacity={isHovered ? '0.95' : '0.85'}
                  className="transition-all duration-150"
                />

                {/* Region Label Text */}
                <text
                  x={r.labelX}
                  y={r.labelY}
                  fill="#FFFFFF"
                  fontSize="12"
                  fontWeight="bold"
                  textAnchor="middle"
                  className="pointer-events-none drop-shadow-sm font-sans tracking-wide"
                >
                  {actualRegion.name || r.name}
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      {/* Hover Info Tooltip Card */}
      {hoveredRegion && (
        <div className="absolute bottom-6 left-6 z-20 bg-paper/95 backdrop-blur-md border border-rule rounded-lg shadow-lg p-3 text-xs animate-in fade-in duration-150 max-w-xs">
          <div className="font-bold text-ink flex items-center gap-1.5">
            <MapPin className="w-3.5 h-3.5 text-amber-600" />
            <span>{hoveredRegion.name || hoveredRegion.id}</span>
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
