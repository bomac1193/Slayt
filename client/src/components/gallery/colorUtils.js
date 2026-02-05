// Color extraction and classification utilities for AI Color Sort mode

export const HUE_BUCKETS = [
  { name: 'Reds', range: [345, 15], color: '#ef4444' },
  { name: 'Oranges', range: [15, 45], color: '#f97316' },
  { name: 'Yellows', range: [45, 75], color: '#eab308' },
  { name: 'Greens', range: [75, 165], color: '#22c55e' },
  { name: 'Blues', range: [165, 255], color: '#3b82f6' },
  { name: 'Purples', range: [255, 345], color: '#a855f7' },
  { name: 'Neutrals', range: null, color: '#a1a1aa' },
];

/**
 * Extract dominant color from an image URL using canvas averaging.
 * Draws image at 50x50 and computes average RGB.
 * Returns hex string or null on failure.
 */
export function extractDominantColor(imageUrl) {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';

    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        canvas.width = 50;
        canvas.height = 50;
        ctx.drawImage(img, 0, 0, 50, 50);

        const imageData = ctx.getImageData(0, 0, 50, 50).data;
        let r = 0, g = 0, b = 0;
        const pixelCount = imageData.length / 4;

        for (let i = 0; i < imageData.length; i += 4) {
          r += imageData[i];
          g += imageData[i + 1];
          b += imageData[i + 2];
        }

        r = Math.round(r / pixelCount);
        g = Math.round(g / pixelCount);
        b = Math.round(b / pixelCount);

        const hex = '#' + [r, g, b].map((c) => c.toString(16).padStart(2, '0')).join('');
        resolve(hex);
      } catch {
        resolve(null);
      }
    };

    img.onerror = () => resolve(null);
    img.src = imageUrl;
  });
}

/**
 * Convert hex color to HSL values.
 * Returns { h: 0-360, s: 0-100, l: 0-100 }
 */
export function hexToHsl(hex) {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result) return { h: 0, s: 0, l: 0 };

  let r = parseInt(result[1], 16) / 255;
  let g = parseInt(result[2], 16) / 255;
  let b = parseInt(result[3], 16) / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h, s;
  const l = (max + min) / 2;

  if (max === min) {
    h = s = 0;
  } else {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
      case g: h = ((b - r) / d + 2) / 6; break;
      case b: h = ((r - g) / d + 4) / 6; break;
    }
  }

  return {
    h: Math.round(h * 360),
    s: Math.round(s * 100),
    l: Math.round(l * 100),
  };
}

/**
 * Classify a hex color into a hue bucket name.
 * Returns bucket name string.
 */
export function classifyColor(hex) {
  if (!hex) return 'Neutrals';

  const { h, s } = hexToHsl(hex);

  // Low saturation = neutral
  if (s < 15) return 'Neutrals';

  // Reds wrap around 360 (345-360 and 0-15)
  if (h >= 345 || h < 15) return 'Reds';
  if (h >= 15 && h < 45) return 'Oranges';
  if (h >= 45 && h < 75) return 'Yellows';
  if (h >= 75 && h < 165) return 'Greens';
  if (h >= 165 && h < 255) return 'Blues';
  if (h >= 255 && h < 345) return 'Purples';

  return 'Neutrals';
}
