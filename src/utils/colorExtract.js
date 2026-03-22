const sharp = require('sharp');

// Hue bucket ranges matching client-side colorUtils.js
const HUE_RANGES = [
  { name: 'Reds', test: (h) => h >= 345 || h < 15 },
  { name: 'Oranges', test: (h) => h >= 15 && h < 45 },
  { name: 'Yellows', test: (h) => h >= 45 && h < 75 },
  { name: 'Greens', test: (h) => h >= 75 && h < 165 },
  { name: 'Blues', test: (h) => h >= 165 && h < 255 },
  { name: 'Purples', test: (h) => h >= 255 && h < 345 },
];

function rgbToHsl(r, g, b) {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0, s = 0;
  const l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    if (max === r) h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
    else if (max === g) h = ((b - r) / d + 2) / 6;
    else h = ((r - g) / d + 4) / 6;
  }

  return { h: Math.round(h * 360), s: Math.round(s * 100), l: Math.round(l * 100) };
}

function toHex(r, g, b) {
  return '#' + [r, g, b].map((c) => Math.round(c).toString(16).padStart(2, '0')).join('');
}

function classifyHue(h, s) {
  if (s < 15) return 'Neutrals';
  for (const range of HUE_RANGES) {
    if (range.test(h)) return range.name;
  }
  return 'Neutrals';
}

/**
 * Extract dominant colors from an image using hue-bucket histogram.
 * Returns array of hex strings sorted by pixel count (up to 3).
 * First = dominant, rest = subdominants.
 */
async function extractDominantColors(input) {
  try {
    const { data } = await sharp(input)
      .resize(80, 80, { fit: 'cover' })
      .removeAlpha()
      .raw()
      .toBuffer({ resolveWithObject: true });

    // Bucket pixels by hue category
    const buckets = {};

    for (let i = 0; i < data.length; i += 3) {
      const r = data[i], g = data[i + 1], b = data[i + 2];
      const { h, s, l } = rgbToHsl(r, g, b);

      // Skip very dark or very bright pixels (not useful for classification)
      if (l < 8 || l > 95) continue;

      const bucket = classifyHue(h, s);

      if (!buckets[bucket]) {
        buckets[bucket] = { count: 0, r: 0, g: 0, b: 0 };
      }
      buckets[bucket].count++;
      buckets[bucket].r += r;
      buckets[bucket].g += g;
      buckets[bucket].b += b;
    }

    // Sort buckets by pixel count, prioritize chromatic over neutral
    const sorted = Object.entries(buckets)
      .map(([name, { count, r, g, b }]) => ({
        name,
        count,
        hex: toHex(r / count, g / count, b / count),
        isNeutral: name === 'Neutrals',
      }))
      .sort((a, b) => {
        // Chromatic buckets first if they have meaningful presence (>10% of largest)
        const maxCount = Math.max(a.count, b.count);
        const aSignificant = a.count > maxCount * 0.1;
        const bSignificant = b.count > maxCount * 0.1;
        if (aSignificant && !a.isNeutral && b.isNeutral) return -1;
        if (bSignificant && !b.isNeutral && a.isNeutral) return 1;
        return b.count - a.count;
      });

    if (sorted.length === 0) return [null];

    return sorted.slice(0, 3).map((b) => b.hex);
  } catch {
    return [null];
  }
}

/**
 * Legacy-compatible: returns single dominant color hex string.
 */
async function extractDominantColor(input) {
  const colors = await extractDominantColors(input);
  return colors[0] || null;
}

module.exports = { extractDominantColor, extractDominantColors };
