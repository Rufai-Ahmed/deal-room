import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const here = dirname(fileURLToPath(import.meta.url));
const publicDir = join(here, '../../apps/web/public');

const mark = (size, bg, fg) => `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" width="${size}" height="${size}">
  <rect width="32" height="32" rx="7" fill="${bg}"/>
  <path d="M9.5 7.25A1.75 1.75 0 0 1 11.25 5.5h7.19c.46 0 .9.18 1.23.51l3.32 3.32c.33.33.51.77.51 1.23V24.25A1.75 1.75 0 0 1 21.75 26h-10.5a1.75 1.75 0 0 1-1.75-1.75V7.25Z" fill="none" stroke="${fg}" stroke-width="1.6"/>
  <path d="M18.5 5.9v3.85c0 .69.56 1.25 1.25 1.25h3.85" fill="none" stroke="${fg}" stroke-width="1.6" stroke-linecap="round"/>
  <circle cx="16.5" cy="18.5" r="4" fill="none" stroke="${fg}" stroke-width="1.6"/>
  <circle cx="16.5" cy="18.5" r="1.6" fill="${fg}"/>
</svg>`;

const ogCard = `
<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <defs>
    <pattern id="grid" width="28" height="28" patternUnits="userSpaceOnUse">
      <path d="M28 0H0V28" fill="none" stroke="#e3ded4" stroke-width="1"/>
    </pattern>
  </defs>
  <rect width="1200" height="630" fill="#fbfaf8"/>
  <rect width="1200" height="630" fill="url(#grid)" opacity="0.55"/>
  <rect x="0" y="0" width="1200" height="8" fill="#14523c"/>

  <g transform="translate(80, 92) scale(1.5)">
    <rect width="32" height="32" rx="7" fill="#14523c"/>
    <path d="M9.5 7.25A1.75 1.75 0 0 1 11.25 5.5h7.19c.46 0 .9.18 1.23.51l3.32 3.32c.33.33.51.77.51 1.23V24.25A1.75 1.75 0 0 1 21.75 26h-10.5a1.75 1.75 0 0 1-1.75-1.75V7.25Z" fill="none" stroke="#fbfaf8" stroke-width="1.6"/>
    <path d="M18.5 5.9v3.85c0 .69.56 1.25 1.25 1.25h3.85" fill="none" stroke="#fbfaf8" stroke-width="1.6" stroke-linecap="round"/>
    <circle cx="16.5" cy="18.5" r="4" fill="none" stroke="#fbfaf8" stroke-width="1.6"/>
    <circle cx="16.5" cy="18.5" r="1.6" fill="#fbfaf8"/>
  </g>
  <text x="146" y="122" font-family="Georgia, serif" font-size="34" fill="#101215">Deal Room</text>

  <text x="80" y="290" font-family="Georgia, serif" font-size="76" fill="#101215">Know whether your deck</text>
  <text x="80" y="372" font-family="Georgia, serif" font-size="76" fill="#101215">was actually read.</text>

  <text x="80" y="446" font-family="Helvetica, Arial, sans-serif" font-size="26" fill="#4a4740">Controlled document links for founders raising investment.</text>

  <g font-family="Helvetica, Arial, sans-serif" font-size="20" fill="#8a847a">
    <text x="80" y="546">PER-INVESTOR LINKS</text>
    <text x="392" y="546">PAGE-LEVEL ATTENTION</text>
    <text x="760" y="546">BOT-FILTERED OPENS</text>
  </g>
  <rect x="80" y="566" width="1040" height="1" fill="#d3ccbe"/>
</svg>`;

await mkdir(publicDir, { recursive: true });

for (const size of [192, 512]) {
  await sharp(Buffer.from(mark(size, '#14523c', '#fbfaf8')))
    .resize(size, size)
    .png()
    .toFile(join(publicDir, `icon-${size}.png`));
}

await sharp(Buffer.from(ogCard)).png().toFile(join(publicDir, 'og.png'));

await writeFile(
  join(publicDir, 'apple-touch-icon.png'),
  await sharp(Buffer.from(mark(180, '#14523c', '#fbfaf8')))
    .resize(180, 180)
    .png()
    .toBuffer(),
);

console.log('brand assets written to apps/web/public');
