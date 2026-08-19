/**
 * utils/mapLayout.js
 *
 * Computes SVG paths and label coordinates for map regions.
 * If a region provides a custom SVG `mapPath`, it is used directly.
 * Otherwise, a deterministic packed grid layout is calculated inside a 1000x600 SVG viewBox.
 */

import { getFactionColor } from './factionColors';

export function computeMapLayout(regions = [], nationsMap = {}) {
  if (!Array.isArray(regions) || regions.length === 0) {
    return [];
  }

  const SVG_WIDTH = 1000;
  const SVG_HEIGHT = 600;
  const PADDING = 20;

  const usableWidth = SVG_WIDTH - PADDING * 2;
  const usableHeight = SVG_HEIGHT - PADDING * 2;

  const total = regions.length;
  // Calculate grid dimensions (cols x rows)
  const cols = Math.ceil(Math.sqrt(total * (usableWidth / usableHeight)));
  const rows = Math.ceil(total / cols);

  const cellWidth = usableWidth / cols;
  const cellHeight = usableHeight / rows;

  return regions.map((region, index) => {
    const col = index % cols;
    const row = Math.floor(index / cols);

    const x = PADDING + col * cellWidth + 4;
    const y = PADDING + row * cellHeight + 4;
    const w = cellWidth - 8;
    const h = cellHeight - 8;

    // Default SVG path as rounded polygon rect
    const defaultPath = `M ${x} ${y} h ${w} v ${h} h -${w} Z`;
    const defaultCenterX = x + w / 2;
    const defaultCenterY = y + h / 2;

    const nation = nationsMap[region.nationId] || {};
    const fillColor = region.mapColor || nation.color || getFactionColor(region.nationId || nation.id || index + 1);

    return {
      ...region,
      svgPath: region.mapPath || defaultPath,
      labelX: region.mapLabelX !== null && region.mapLabelX !== undefined ? region.mapLabelX : defaultCenterX,
      labelY: region.mapLabelY !== null && region.mapLabelY !== undefined ? region.mapLabelY : defaultCenterY,
      fillColor,
      isCustomPath: Boolean(region.mapPath),
    };
  });
}

export default computeMapLayout;
