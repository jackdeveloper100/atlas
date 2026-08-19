'use strict';

/**
 * engine/src/batch/mapBuilder.js
 *
 * Server-side daily batch job runner for ATLAS map processing.
 * - Groups subregion polygons by nation ID.
 * - Dissolves internal subregion boundaries using polygon-clipping (union).
 * - Computes pole-of-inaccessibility (polylabel) label anchor points per nation.
 * - Precomputes contested subregion hatch overlays.
 * - Outputs immutable date-versioned JSON bundles for R2 / Storage publishing.
 *
 * MUST NEVER be shipped to client browser bundles.
 */

const polygonClipping = require('polygon-clipping');
const polylabel = require('polylabel');

/**
 * Convert simple SVG path (M, L, Q commands) to polygon coordinate ring [[x, y], ...]
 */
function parseSvgPathToRing(svgPath, samplesPerCurve = 8) {
  if (!svgPath || typeof svgPath !== 'string') return [];
  
  const ring = [];
  // Tokenize SVG commands
  const commands = svgPath.match(/([A-Za-z])|(-?\d+(?:\.\d+)?)/g) || [];
  let currX = 0;
  let currY = 0;
  let i = 0;

  while (i < commands.length) {
    const cmd = commands[i];
    if (/[A-Za-z]/.test(cmd)) {
      i++;
      if (cmd === 'M' || cmd === 'L') {
        const x = parseFloat(commands[i++]);
        const y = parseFloat(commands[i++]);
        currX = x;
        currY = y;
        ring.push([x, y]);
      } else if (cmd === 'Q') {
        const cx = parseFloat(commands[i++]);
        const cy = parseFloat(commands[i++]);
        const x = parseFloat(commands[i++]);
        const y = parseFloat(commands[i++]);
        
        // Sample quadratic bezier curve
        for (let t = 1; t <= samplesPerCurve; t++) {
          const step = t / samplesPerCurve;
          const px = (1 - step) * (1 - step) * currX + 2 * (1 - step) * step * cx + step * step * x;
          const py = (1 - step) * (1 - step) * currY + 2 * (1 - step) * step * cy + step * step * y;
          ring.push([px, py]);
        }
        currX = x;
        currY = y;
      } else if (cmd === 'Z' || cmd === 'z') {
        if (ring.length > 0 && (ring[0][0] !== currX || ring[0][1] !== currY)) {
          ring.push([ring[0][0], ring[0][1]]);
        }
      }
    } else {
      i++;
    }
  }

  // Ensure ring is closed
  if (ring.length > 2) {
    const first = ring[0];
    const last = ring[ring.length - 1];
    if (first[0] !== last[0] || first[1] !== last[1]) {
      ring.push([first[0], first[1]]);
    }
  }

  return ring;
}

/**
 * Convert GeoJSON MultiPolygon or Polygon coordinates array back to SVG Path string.
 */
function polygonCoordinatesToSvgPath(multiPolygonCoords) {
  let pathStr = '';
  if (!multiPolygonCoords || !Array.isArray(multiPolygonCoords)) return pathStr;

  // Handle Polygon vs MultiPolygon coordinates structure
  const polygons = Array.isArray(multiPolygonCoords[0][0][0])
    ? multiPolygonCoords
    : [multiPolygonCoords];

  for (const poly of polygons) {
    for (let r = 0; r < poly.length; r++) {
      const ring = poly[r];
      if (!ring || ring.length === 0) continue;
      
      for (let p = 0; p < ring.length; p++) {
        const [x, y] = ring[p];
        if (p === 0) {
          pathStr += `M ${x.toFixed(1)},${y.toFixed(1)} `;
        } else {
          pathStr += `L ${x.toFixed(1)},${y.toFixed(1)} `;
        }
      }
      pathStr += 'Z ';
    }
  }

  return pathStr.trim();
}

/**
 * Main batch map builder logic.
 * @param {Array} subregions Subregion polygon objects
 * @param {Array} nations Faction/Nation definitions
 * @param {string} snapshotDate Date string (YYYY-MM-DD)
 */
function buildDailyMapBundle(subregions = [], nations = [], snapshotDate = new Date().toISOString().split('T')[0]) {
  const nationsMap = {};
  (nations || []).forEach((n) => {
    nationsMap[n.id || n.nationId] = {
      nationId: n.id || n.nationId,
      name: n.name,
      color: n.color || n.fillColor || '#B85C4E',
      capitalSubregionId: n.capitalSubregionId || null,
      subregionIds: []
    };
  });

  // Group subregions by nationId
  const subregionsByNation = {};
  const contestedOverlays = [];

  (subregions || []).forEach((sub) => {
    const nationId = sub.nationId || sub.nation || 'unclaimed';
    if (!subregionsByNation[nationId]) {
      subregionsByNation[nationId] = [];
    }
    subregionsByNation[nationId].push(sub);

    if (nationsMap[nationId]) {
      nationsMap[nationId].subregionIds.push(sub.id);
    }

    // Precompute contested overlay paths
    if (sub.isContested) {
      contestedOverlays.push({
        subregionId: sub.id,
        svgPath: sub.svgPath,
        contestedBy: sub.contestedBy || []
      });
    }
  });

  const dissolvedNations = [];

  // Dissolve subregions for each nation
  Object.keys(subregionsByNation).forEach((nationId) => {
    const subs = subregionsByNation[nationId];
    const nationDef = nationsMap[nationId] || {
      nationId,
      name: nationId.replace(/-/g, ' ').toUpperCase(),
      color: '#A69C84',
      subregionIds: subs.map(s => s.id)
    };

    // Convert all subregion SVG paths to polygon rings
    const rings = subs
      .map(s => parseSvgPathToRing(s.svgPath))
      .filter(r => r && r.length > 2);

    let dissolvedPath = '';
    let labelPoint = [0, 0];
    let capitalPoint = null;

    if (rings.length === 1) {
      // Single subregion: construct polygon and calculate label point
      const poly = [rings[0]];
      dissolvedPath = polygonCoordinatesToSvgPath([poly]);
      labelPoint = polylabel(poly, 1.0);
    } else if (rings.length > 1) {
      try {
        // Run polygon union using polygon-clipping library
        const multiPolyGeoms = rings.map(ring => [[ring]]);
        const merged = polygonClipping.union(...multiPolyGeoms);
        dissolvedPath = polygonCoordinatesToSvgPath(merged);

        // Find largest polygon ring in merged MultiPolygon for polylabel placement
        let maxArea = 0;
        let largestPolyRing = merged[0] ? merged[0][0] : rings[0];

        merged.forEach((polyGeom) => {
          const outerRing = polyGeom[0];
          if (outerRing && outerRing.length > maxArea) {
            maxArea = outerRing.length;
            largestPolyRing = outerRing;
          }
        });

        labelPoint = polylabel([largestPolyRing], 1.0);
      } catch (err) {
        // Fallback if polygon clipping fails on complex shapes
        dissolvedPath = subs.map(s => s.svgPath).join(' ');
        const firstSub = subs[0];
        labelPoint = [firstSub.labelX || 200, firstSub.labelY || 200];
      }
    } else {
      // Fallback
      dissolvedPath = subs.map(s => s.svgPath).join(' ');
    }

    // Determine Capital City token coordinates
    let capitalSub = subs.find(s => s.id === nationDef.capitalSubregionId || s.isCapital);
    if (!capitalSub && subs.length > 0) {
      capitalSub = subs[0]; // Default capital to first subregion anchor if not set
    }

    if (capitalSub) {
      capitalPoint = [
        capitalSub.labelX || capitalSub.capitalX || labelPoint[0],
        capitalSub.labelY || capitalSub.capitalY || labelPoint[1]
      ];
    } else {
      capitalPoint = labelPoint;
    }

    dissolvedNations.push({
      nationId,
      name: nationDef.name,
      color: nationDef.color,
      borderPath: dissolvedPath,
      labelPoint: [Math.round(labelPoint[0]), Math.round(labelPoint[1])],
      capitalPoint: [Math.round(capitalPoint[0]), Math.round(capitalPoint[1])],
      subregionIds: nationDef.subregionIds
    });
  });

  return {
    date: snapshotDate,
    nations: dissolvedNations,
    subregions: subregions.map(s => ({
      id: s.id,
      name: s.name,
      nationId: s.nationId || s.nation,
      svgPath: s.svgPath,
      labelX: s.labelX,
      labelY: s.labelY,
      isContested: !!s.isContested
    })),
    contestedOverlays
  };
}

module.exports = {
  buildDailyMapBundle,
  parseSvgPathToRing,
  polygonCoordinatesToSvgPath
};
