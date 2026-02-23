// Simple background remover for mostly-white backgrounds using Jimp
// Usage:
//   node scripts/remove-logo-bg.js src/assets/your-logo.jpeg public/prime-logo-clean.png
// If no args provided, it will try a sensible default based on your current repo.

// Robust import to handle various Jimp export styles across versions
const jimpModule = await import('jimp');
const Jimp = jimpModule.default || jimpModule.Jimp || jimpModule;
import { existsSync } from 'fs';
import { mkdirSync } from 'fs';
import { dirname } from 'path';

const [,, inArg, outArg] = process.argv;
const input = inArg || 'src/assets/7c958081-4360-4059-8757-490f5a0a16f9.jpeg';
const output = outArg || 'public/prime-logo-clean.png';

const THRESHOLD = 245; // 0-255; pixels brighter than this are treated as background
const SOFT = 15; // expand threshold softly to catch near-white

(async () => {
  try {
    const img = await Jimp.read(input);
    img.scan(0, 0, img.bitmap.width, img.bitmap.height, function (x, y, idx) {
      const r = this.bitmap.data[idx + 0];
      const g = this.bitmap.data[idx + 1];
      const b = this.bitmap.data[idx + 2];
      const a = this.bitmap.data[idx + 3];

      // Treat near-white as background (simple chroma key)
      if (r > THRESHOLD && g > THRESHOLD && b > THRESHOLD) {
        this.bitmap.data[idx + 3] = 0; // fully transparent
      } else if (r > THRESHOLD - SOFT && g > THRESHOLD - SOFT && b > THRESHOLD - SOFT) {
        // feather edge: partially transparent
        const dist = Math.max(r, g, b) - Math.min(r, g, b);
        const fade = Math.min(1, (Math.max(r, g, b) - (THRESHOLD - SOFT)) / SOFT);
        this.bitmap.data[idx + 3] = Math.max(0, Math.round(a * (1 - fade * 0.9)));
      }
    });

    // Ensure output folder
    const dir = dirname(output);
    if (!existsSync(dir)) mkdirSync(dir, { recursive: true });

    if (typeof img.writeAsync === 'function') {
      await img.writeAsync(output);
    } else if (typeof img.write === 'function') {
      await new Promise((resolve, reject) => img.write(output, (err) => err ? reject(err) : resolve(null)));
    } else {
      throw new Error('No supported write method on Jimp instance');
    }
    console.log(`Saved cleaned logo -> ${output}`);
    console.log('Tip: The Login page will automatically use /prime-logo-clean.png if present.');
  } catch (e) {
    console.error('Failed to process image:', e);
    process.exit(1);
  }
})();
