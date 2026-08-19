/**
 * factionColors.js
 *
 * 50 Faction desaturated-atlas color palette generated around the hue wheel in 6 bands.
 * Ensures adjacent factions on the map remain visually distinct at all scale levels.
 */

export const FACTION_PALETTE = [
  // Reds / Oranges / Browns (1–10)
  { id: 1, name: 'Brick Red', hex: '#B85C4E' },
  { id: 2, name: 'Rust Orange', hex: '#C17A4A' },
  { id: 3, name: 'Terracotta', hex: '#BD6B4F' },
  { id: 4, name: 'Burnt Sienna', hex: '#A5583C' },
  { id: 5, name: 'Clay Red', hex: '#9C5048' },
  { id: 6, name: 'Oxblood', hex: '#5C2E30' },
  { id: 7, name: 'Copper', hex: '#B87D52' },
  { id: 8, name: 'Chestnut', hex: '#7A4A3A' },
  { id: 9, name: 'Dusty Coral', hex: '#C48470' },
  { id: 10, name: 'Mahogany', hex: '#6B3A32' },

  // Golds / Ambers / Yellows (11–18)
  { id: 11, name: 'Burnt Gold', hex: '#D4A24C' },
  { id: 12, name: 'Mustard Olive', hex: '#C4B478' },
  { id: 13, name: 'Ochre', hex: '#B8923E' },
  { id: 14, name: 'Sand Gold', hex: '#D6C088' },
  { id: 15, name: 'Bronze Yellow', hex: '#A6863E' },
  { id: 16, name: 'Wheat', hex: '#CBB56A' },
  { id: 17, name: 'Amber Brown', hex: '#9A7638' },
  { id: 18, name: 'Pale Gold', hex: '#DECB94' },

  // Greens (19–27)
  { id: 19, name: 'Olive Green', hex: '#6B7A4F' },
  { id: 20, name: 'Moss', hex: '#7D8C5C' },
  { id: 21, name: 'Forest Sage', hex: '#566B4E' },
  { id: 22, name: 'Fern', hex: '#8A9A6B' },
  { id: 23, name: 'Deep Pine', hex: '#3F5240' },
  { id: 24, name: 'Sage Grey-Green', hex: '#8FA394' },
  { id: 25, name: 'Olive Drab', hex: '#5E6B3E' },
  { id: 26, name: 'Celadon', hex: '#9DAD8A' },
  { id: 27, name: 'Dark Juniper', hex: '#485844' },

  // Teals / Blues (28–36)
  { id: 28, name: 'Slate Blue', hex: '#7A8A93' },
  { id: 29, name: 'Dusty Teal', hex: '#5F8078' },
  { id: 30, name: 'Steel Blue', hex: '#5C7080' },
  { id: 31, name: 'Deep Teal', hex: '#3E5A56' },
  { id: 32, name: 'Powder Blue', hex: '#9BAFB6' },
  { id: 33, name: 'Navy Slate', hex: '#3A4A56' },
  { id: 34, name: 'Muted Cyan', hex: '#6B9895' },
  { id: 35, name: 'Storm Blue', hex: '#4E6270' },
  { id: 36, name: 'Pale Denim', hex: '#8CA0AC' },

  // Purples / Mauves (37–43)
  { id: 37, name: 'Dusty Mauve', hex: '#A98B8E' },
  { id: 38, name: 'Plum', hex: '#6E4A5C' },
  { id: 39, name: 'Heather', hex: '#8A7488' },
  { id: 40, name: 'Wine Purple', hex: '#5C3A48' },
  { id: 41, name: 'Lavender Grey', hex: '#9C8C9A' },
  { id: 42, name: 'Aubergine', hex: '#4A3244' },
  { id: 43, name: 'Dusty Orchid', hex: '#B08A9C' },

  // Neutrals / Creams / Greys (44–50)
  { id: 44, name: 'Nibiya Cream', hex: '#E8DFC0' },
  { id: 45, name: 'Pale Sand', hex: '#D8CBA0' },
  { id: 46, name: 'Warm Grey', hex: '#8C8272' },
  { id: 47, name: 'Cool Grey', hex: '#7C8280' },
  { id: 48, name: 'Bone', hex: '#DCD3B8' },
  { id: 49, name: 'Charcoal Brown', hex: '#4A3E36' },
  { id: 50, name: 'Driftwood', hex: '#A69C84' }
];

/**
 * Deterministic hash algorithm to map string keys (like nationId) to palette indices.
 */
function hashString(str) {
  let hash = 0;
  if (!str || str.length === 0) return hash;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0; // Convert to 32bit integer
  }
  return Math.abs(hash);
}

/**
 * Retrieve a faction color object or hex string deterministically.
 * @param {string|number} key Nation ID, key string, or numeric index (1-50)
 * @returns {string} Hex color string
 */
export function getFactionColor(key) {
  if (key === null || key === undefined) {
    return FACTION_PALETTE[0].hex;
  }

  // If passed an existing hex code, return it directly
  if (typeof key === 'string' && key.startsWith('#')) {
    return key;
  }

  // If passed a 1-based numeric index
  if (typeof key === 'number' && key >= 1 && key <= 50) {
    return FACTION_PALETTE[key - 1].hex;
  }

  // Otherwise, hash the string key
  const index = hashString(String(key)) % FACTION_PALETTE.length;
  return FACTION_PALETTE[index].hex;
}

export default {
  FACTION_PALETTE,
  getFactionColor
};
