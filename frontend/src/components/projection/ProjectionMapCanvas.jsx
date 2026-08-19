import React, { useState, useMemo } from 'react';
import { ZoomIn, ZoomOut, RotateCcw, Crown, Shield, MapPin, Compass, Eye } from 'lucide-react';
import { getFactionColor } from '../../utils/factionColors';
import aquaticFeatures from '../../config/aquatic_features.json';

/**
 * Subregions data definition matching atlas cartography.
 */
const DEFAULT_SUBREGIONS = [
  // Top Continent (Ashen Run & Vatoria)
  {
    id: 'amber-vale',
    name: 'Amber Vale',
    nationId: 'ashen-run',
    nationName: 'Ashen Run',
    colorIndex: 1, // Brick Red
    svgPath: 'M 350,80 Q 420,50 510,70 Q 540,110 500,150 Q 460,180 430,150 Q 400,220 370,180 Q 320,170 300,140 Q 280,100 350,80 Z',
    labelX: 410,
    labelY: 120,
    isCapital: true,
    capitalName: 'Ashen Citadel',
    gdp: '113,663',
    military: '2,847',
    reserves: '6,410',
    stability: '0.58',
  },
  {
    id: 'ashen-hinterland',
    name: 'Ashen Hinterland',
    nationId: 'ashen-run',
    nationName: 'Ashen Run',
    colorIndex: 1,
    svgPath: 'M 180,160 Q 240,140 280,170 Q 260,240 210,250 Q 160,230 140,190 Z',
    labelX: 210,
    labelY: 200,
    gdp: '94,200',
    military: '1,950',
    reserves: '4,800',
    stability: '0.64',
  },
  {
    id: 'vatoria-capital',
    name: 'Vatoria Capital',
    nationId: 'vatoria',
    nationName: 'Vatoria Domain',
    colorIndex: 29, // Dusty Teal
    svgPath: 'M 150,250 Q 240,240 250,300 Q 200,340 140,310 Z',
    labelX: 195,
    labelY: 285,
    isCapital: true,
    capitalName: 'Vatoria Prime',
    gdp: '142,500',
    military: '3,400',
    reserves: '8,200',
    stability: '0.72',
  },
  {
    id: 'vatoria-reach',
    name: 'Vatoria Reach',
    nationId: 'vatoria',
    nationName: 'Vatoria Domain',
    colorIndex: 29,
    svgPath: 'M 80,270 Q 140,260 150,320 Q 100,360 60,310 Z',
    labelX: 110,
    labelY: 310,
    isContested: true,
    gdp: '81,100',
    military: '1,420',
    reserves: '3,900',
    stability: '0.51',
  },
  {
    id: 'kelkelia-core',
    name: 'Kelkelia Core',
    nationId: 'kelkelia',
    nationName: 'Kelkelia Republic',
    colorIndex: 38, // Plum
    svgPath: 'M 250,370 Q 300,320 340,380 Q 300,430 240,410 Z',
    labelX: 285,
    labelY: 380,
    isCapital: true,
    capitalName: 'Kelkelia Grand Spires',
    gdp: '128,900',
    military: '2,900',
    reserves: '7,100',
    stability: '0.69',
  },
  {
    id: 'imperial-coastal',
    name: 'Imperial Coastal',
    nationId: 'imperial-merchant',
    nationName: 'Imperial Merchant League',
    colorIndex: 11, // Burnt Gold
    svgPath: 'M 350,320 Q 410,290 420,360 Q 370,410 330,370 Z',
    labelX: 375,
    labelY: 350,
    isCapital: true,
    capitalName: 'Port Imperial',
    gdp: '105,400',
    military: '2,100',
    reserves: '5,600',
    stability: '0.62',
  },
  {
    id: 'southern-marches',
    name: 'Southern Marches',
    nationId: 'southern-bloc',
    nationName: 'Southern Confederation',
    colorIndex: 7, // Copper
    svgPath: 'M 270,430 Q 320,420 330,470 Q 280,490 260,460 Z',
    labelX: 295,
    labelY: 455,
    isCapital: true,
    capitalName: 'Fortress South',
    gdp: '72,300',
    military: '1,650',
    reserves: '2,900',
    stability: '0.45',
  },

  // Bottom Archipelago (Island League)
  {
    id: 'isle-of-vales',
    name: 'Isle of Vales',
    nationId: 'island-league',
    nationName: 'Island League',
    colorIndex: 20, // Moss Green
    svgPath: 'M 100,620 Q 180,600 200,660 Q 150,720 80,690 Z',
    labelX: 140,
    labelY: 660,
    isCapital: true,
    capitalName: 'Vales Harbor',
    gdp: '88,000',
    military: '1,800',
    reserves: '4,200',
    stability: '0.78',
  },
  {
    id: 'azure-bay-region',
    name: 'Azure Bay Reach',
    nationId: 'island-league',
    nationName: 'Island League',
    colorIndex: 20,
    svgPath: 'M 180,680 Q 280,640 290,720 Q 220,780 160,740 Z',
    labelX: 230,
    labelY: 710,
    gdp: '119,300',
    military: '2,600',
    reserves: '6,800',
    stability: '0.81',
  },
  {
    id: 'verdant-ridge',
    name: 'Verdant Ridge',
    nationId: 'island-league',
    nationName: 'Island League',
    colorIndex: 20,
    svgPath: 'M 50,680 Q 140,670 140,760 Q 70,790 40,730 Z',
    labelX: 90,
    labelY: 730,
    gdp: '64,000',
    military: '1,200',
    reserves: '3,100',
    stability: '0.66',
  }
];

// Precomputed dissolved national border paths for Nation View mode
const DISSOLVED_NATION_BORDERS = [
  {
    nationId: 'ashen-run',
    name: 'Ashen Run',
    colorHex: getFactionColor(1),
    dissolvedPath: 'M 180,160 Q 240,140 280,170 Q 260,240 210,250 Q 160,230 140,190 Z M 350,80 Q 420,50 510,70 Q 540,110 500,150 Q 460,180 430,150 Q 400,220 370,180 Q 320,170 300,140 Q 280,100 350,80 Z',
    labelX: 380,
    labelY: 135,
    capitalX: 410,
    capitalY: 120,
    capitalName: 'Ashen Citadel'
  },
  {
    nationId: 'vatoria',
    name: 'Vatoria Domain',
    colorHex: getFactionColor(29),
    dissolvedPath: 'M 80,270 Q 140,260 150,320 Q 100,360 60,310 Z M 150,250 Q 240,240 250,300 Q 200,340 140,310 Z',
    labelX: 160,
    labelY: 295,
    capitalX: 195,
    capitalY: 285,
    capitalName: 'Vatoria Prime'
  },
  {
    nationId: 'kelkelia',
    name: 'Kelkelia Republic',
    colorHex: getFactionColor(38),
    dissolvedPath: 'M 250,370 Q 300,320 340,380 Q 300,430 240,410 Z',
    labelX: 285,
    labelY: 380,
    capitalX: 285,
    capitalY: 380,
    capitalName: 'Kelkelia Grand Spires'
  },
  {
    nationId: 'imperial-merchant',
    name: 'Imperial Merchant League',
    colorHex: getFactionColor(11),
    dissolvedPath: 'M 350,320 Q 410,290 420,360 Q 370,410 330,370 Z',
    labelX: 375,
    labelY: 350,
    capitalX: 375,
    capitalY: 350,
    capitalName: 'Port Imperial'
  },
  {
    nationId: 'southern-bloc',
    name: 'Southern Confederation',
    colorHex: getFactionColor(7),
    dissolvedPath: 'M 270,430 Q 320,420 330,470 Q 280,490 260,460 Z',
    labelX: 295,
    labelY: 455,
    capitalX: 295,
    capitalY: 455,
    capitalName: 'Fortress South'
  },
  {
    nationId: 'island-league',
    name: 'Island League',
    colorHex: getFactionColor(20),
    dissolvedPath: 'M 50,680 Q 140,670 140,760 Q 70,790 40,730 Z M 100,620 Q 180,600 200,660 Q 150,720 80,690 Z M 180,680 Q 280,640 290,720 Q 220,780 160,740 Z',
    labelX: 160,
    labelY: 690,
    capitalX: 140,
    capitalY: 660,
    capitalName: 'Vales Harbor'
  }
];

export function ProjectionMapCanvas({ selectedRegion, onSelectRegion }) {
  const [zoomScale, setZoomScale] = useState(1.0);
  const [hoveredEntity, setHoveredEntity] = useState(null);
  const [clickedCapitalId, setClickedCapitalId] = useState(null);

  // Zoom threshold: < 1.8x is Nation View, >= 1.8x is Region View
  const isRegionView = zoomScale >= 1.8;

  const handleZoomIn = () => setZoomScale((z) => Math.min(Number((z + 0.3).toFixed(1)), 3.0));
  const handleZoomOut = () => setZoomScale((z) => Math.max(Number((z - 0.3).toFixed(1)), 1.0));
  const handleResetZoom = () => setZoomScale(1.0);

  const handleWheel = (e) => {
    if (e.deltaY < 0) {
      handleZoomIn();
    } else {
      handleZoomOut();
    }
  };

  const handleCapitalClick = (e, nation, capitalSubregion) => {
    e.stopPropagation();
    setClickedCapitalId(nation.nationId);
    setTimeout(() => setClickedCapitalId(null), 600);

    const targetRegion = capitalSubregion || DEFAULT_SUBREGIONS.find((s) => s.nationId === nation.nationId) || {
      id: `${nation.nationId}-capital`,
      name: nation.capitalName || nation.name,
      nation: nation.name,
      gdp: '120,000',
      military: '3,000',
      reserves: '7,000',
      stability: '0.75'
    };

    if (onSelectRegion) {
      onSelectRegion(targetRegion);
    }
  };

  return (
    <div
      className="relative w-full h-full min-h-[calc(100vh-48px)] bg-[#BACAA3] overflow-hidden select-none"
      onWheel={handleWheel}
    >
      {/* Top Floating Control Bar */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 z-30 flex items-center gap-3 bg-white/90 backdrop-blur-md px-4 py-2 rounded-2xl border border-stone-300 shadow-lg text-stone-800 font-sans text-xs">
        {/* Zoom Mode Badge */}
        <div className="flex items-center gap-2 font-mono font-bold border-r border-stone-300 pr-3">
          <Eye className="w-4 h-4 text-amber-700" />
          <span className="bg-amber-100 text-amber-900 px-2 py-0.5 rounded-full text-[11px] font-semibold uppercase tracking-wider">
            {isRegionView ? 'Region View (Zoom 2)' : 'Nation View (Zoom 1)'}
          </span>
          <span className="text-stone-400">|</span>
          <span className="font-mono text-stone-600">{zoomScale.toFixed(1)}x</span>
        </div>

        {/* Zoom Controls */}
        <div className="flex items-center gap-1">
          <button
            onClick={handleZoomIn}
            title="Zoom In (Region View)"
            className="p-1.5 hover:bg-stone-100 rounded-lg text-stone-700 transition-colors cursor-pointer"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
          <button
            onClick={handleZoomOut}
            title="Zoom Out (Nation View)"
            className="p-1.5 hover:bg-stone-100 rounded-lg text-stone-700 transition-colors cursor-pointer"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
          <button
            onClick={handleResetZoom}
            title="Reset Map View"
            className="p-1.5 hover:bg-stone-100 rounded-lg text-stone-700 transition-colors cursor-pointer"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Map SVG Container */}
      <div
        className="w-full h-full flex items-center justify-center transition-transform duration-300 ease-out"
        style={{ transform: `scale(${zoomScale})`, transformOrigin: 'center center' }}
      >
        <svg
          viewBox="0 0 1000 850"
          className="w-full h-full object-cover max-h-[calc(100vh-48px)] drop-shadow-sm"
          onClick={() => onSelectRegion && onSelectRegion(null)}
        >
          <defs>
            {/* Contested Subregion Diagonal Hatch Pattern */}
            <pattern id="contested-hatch" width="8" height="8" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
              <line x1="0" y1="0" x2="0" y2="8" stroke="rgba(0,0,0,0.3)" strokeWidth="2.5" />
            </pattern>

            {/* Capital Token Glow Filter */}
            <filter id="capital-glow" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>

          {/* Cartographic Ocean / Coastline Guides */}
          <g stroke="#8FA076" strokeWidth="1" fill="none" opacity="0.65">
            <path d="M 520,380 Q 560,330 600,400 Q 550,480 490,420 Z" />
            <path d="M 680,200 Q 740,160 780,230 Q 720,300 660,250 Z" />
            <path d="M 720,410 Q 800,380 840,460 Q 760,520 700,460 Z" />
            <path d="M 570,580 Q 680,550 720,680 Q 640,780 560,720 Q 540,650 570,580 Z" />
          </g>

          {/* Aquatic Feature Cartographic Labels */}
          <g className="pointer-events-none select-none">
            {aquaticFeatures.map((water) => (
              <text
                key={water.id}
                x={water.labelX}
                y={water.labelY}
                fill={water.color || '#4A626C'}
                fontSize={water.fontSize || 14}
                fontStyle={water.fontStyle || 'italic'}
                letterSpacing={water.letterSpacing || '0.15em'}
                textAnchor="middle"
                className="font-serif opacity-75 drop-shadow-xs"
              >
                {water.name}
              </text>
            ))}
          </g>

          {/* LAYER 1: NATION VIEW (Dissolved National Borders + Anchor Labels) when scale < 1.8x */}
          {!isRegionView && (
            <g className="transition-opacity duration-300">
              {DISSOLVED_NATION_BORDERS.map((nation) => {
                const isHovered = hoveredEntity?.id === nation.nationId;
                const isSelected = selectedRegion && selectedRegion.nation === nation.name;

                return (
                  <g
                    key={nation.nationId}
                    className="cursor-pointer transition-all duration-200"
                    onMouseEnter={() => setHoveredEntity({ id: nation.nationId, type: 'nation', name: nation.name })}
                    onMouseLeave={() => setHoveredEntity(null)}
                    onClick={(e) => {
                      e.stopPropagation();
                      const capSub = DEFAULT_SUBREGIONS.find((s) => s.nationId === nation.nationId && s.isCapital);
                      handleCapitalClick(e, nation, capSub);
                    }}
                  >
                    {/* Precomputed Dissolved National Border Path */}
                    <path
                      d={nation.dissolvedPath}
                      fill={nation.colorHex}
                      stroke={isSelected ? '#000000' : isHovered ? '#111111' : '#3B4B28'}
                      strokeWidth={isSelected ? '3.5' : isHovered ? '2.5' : '1.5'}
                      opacity={isHovered ? '0.98' : '0.92'}
                      className="transition-all duration-150 drop-shadow-sm"
                    />

                    {/* Precomputed Pole-of-Inaccessibility Nation Label */}
                    <text
                      x={nation.labelX}
                      y={nation.labelY}
                      fill="#FFFFFF"
                      fontSize="14"
                      fontWeight="bold"
                      textAnchor="middle"
                      className="pointer-events-none drop-shadow-md font-sans tracking-wider uppercase"
                    >
                      {nation.name}
                    </text>
                  </g>
                );
              })}
            </g>
          )}

          {/* LAYER 2: REGION VIEW (Individual Subregion Boundaries) when scale >= 1.8x */}
          {isRegionView && (
            <g className="transition-opacity duration-300">
              {DEFAULT_SUBREGIONS.map((r) => {
                const nationColor = getFactionColor(r.colorIndex);
                const isSelected = selectedRegion?.id === r.id;
                const isHovered = hoveredEntity?.id === r.id;

                return (
                  <g
                    key={r.id}
                    className="cursor-pointer transition-all duration-200"
                    onMouseEnter={() => setHoveredEntity({ id: r.id, type: 'region', name: r.name, nation: r.nationName })}
                    onMouseLeave={() => setHoveredEntity(null)}
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelectRegion && onSelectRegion(r);
                    }}
                  >
                    {/* Subregion Polygon Path */}
                    <path
                      d={r.svgPath}
                      fill={nationColor}
                      stroke={isSelected ? '#000000' : isHovered ? '#1B1B1B' : '#455A2A'}
                      strokeWidth={isSelected ? '3.5' : isHovered ? '2.2' : '1.2'}
                      opacity={isHovered ? '0.98' : '0.90'}
                      className="transition-all duration-150 drop-shadow-xs"
                    />

                    {/* Precalculated Contested Subregion Hatch Overlay */}
                    {r.isContested && (
                      <path
                        d={r.svgPath}
                        fill="url(#contested-hatch)"
                        pointerEvents="none"
                      />
                    )}

                    {/* Subregion Label */}
                    <text
                      x={r.labelX}
                      y={r.labelY}
                      fill="#FFFFFF"
                      fontSize="11"
                      fontWeight="bold"
                      textAnchor="middle"
                      className="pointer-events-none drop-shadow-md font-sans tracking-wide"
                    >
                      {r.name}
                    </text>
                  </g>
                );
              })}
            </g>
          )}

          {/* LAYER 3: INTERACTABLE CAPITAL CITY TOKENS (Rendered on both view levels) */}
          <g>
            {DISSOLVED_NATION_BORDERS.map((nation) => {
              const capSub = DEFAULT_SUBREGIONS.find((s) => s.nationId === nation.nationId && s.isCapital);
              const cx = nation.capitalX;
              const cy = nation.capitalY;
              const isClicked = clickedCapitalId === nation.nationId;

              return (
                <g
                  key={`capital-${nation.nationId}`}
                  transform={`translate(${cx}, ${cy})`}
                  className="cursor-pointer group"
                  onClick={(e) => handleCapitalClick(e, nation, capSub)}
                  onMouseEnter={() => setHoveredEntity({ id: `cap-${nation.nationId}`, type: 'capital', name: nation.capitalName, nation: nation.name })}
                  onMouseLeave={() => setHoveredEntity(null)}
                >
                  {/* Outer Pulsing Aura */}
                  <circle
                    r="12"
                    fill={nation.colorHex}
                    opacity="0.3"
                    className="animate-ping group-hover:opacity-60 transition-opacity"
                  />

                  {/* Token Background Shield Badge */}
                  <circle
                    r="9"
                    fill="#1E293B"
                    stroke="#F59E0B"
                    strokeWidth="2"
                    filter="url(#capital-glow)"
                    className={`transition-transform duration-200 group-hover:scale-125 ${isClicked ? 'scale-150 stroke-white' : ''}`}
                  />

                  {/* Inner Crown Vector Icon */}
                  <g transform="translate(-5, -5) scale(0.42)">
                    <path
                      d="M2 4l3 12h14l3-12-6 7-4-8-4 8-6-7z"
                      fill="#F59E0B"
                      stroke="#FFFFFF"
                      strokeWidth="1.5"
                    />
                  </g>
                </g>
              );
            })}
          </g>
        </svg>
      </div>

      {/* Floating Hover Tooltip */}
      {hoveredEntity && (
        <div className="absolute bottom-6 left-6 z-40 bg-white/95 backdrop-blur-md border border-stone-300 rounded-xl shadow-xl p-3 text-xs text-stone-800 animate-in fade-in duration-150 max-w-xs pointer-events-none">
          <div className="font-bold text-stone-900 flex items-center gap-1.5">
            {hoveredEntity.type === 'capital' ? (
              <Crown className="w-3.5 h-3.5 text-amber-600" />
            ) : (
              <Shield className="w-3.5 h-3.5 text-stone-600" />
            )}
            <span>{hoveredEntity.name}</span>
          </div>
          {hoveredEntity.nation && (
            <div className="text-stone-500 text-[11px] mt-0.5">
              Territory of {hoveredEntity.nation}
            </div>
          )}
          <div className="text-[10px] text-stone-400 font-mono mt-1">
            {hoveredEntity.type === 'capital'
              ? '★ Click Capital Token to open Dossier Inspector Panel →'
              : 'Click territory to inspect →'}
          </div>
        </div>
      )}
    </div>
  );
}

export default ProjectionMapCanvas;
