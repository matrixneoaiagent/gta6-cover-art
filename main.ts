/**
 * Vice Graphix // GTA 6-Style Multi-Panel Cover Art Generator
 * ==========================================================
 * Bounty: gta6-cover-art-01 (make.fun)
 * 
 * Features & Architecture:
 * - 100% Offline Static Web App running with zero network requests at runtime.
 * - Multi-panel comic poster layouts:
 *     1. "Vice Classic" (4 panels: large vertical hero panel on left, 3 stacked detail panels on right)
 *     2. "Ocean Drive" (3 panels: wide panoramic hero panel on top, 2 vertical split panels below)
 *     3. "Neon Grid" (5 panels: asymmetrical poster grid with prominent hero block and surrounding detail cells)
 *     4. "Poster Frame" (3 panels: full-bleed background panel with 2 elevated inset cards)
 * - Authentic 8-12px dark comic borders with clean miters and inner vignette.
 * - 4 Vice City Sunset & Neon color grade passes:
 *     1. "Sunset Boulevard" (warm golden highlights, magenta/purple midtones, deep navy shadows)
 *     2. "Neon Noir" (electric cyan & hot pink duo-tone punch)
 *     3. "Golden Hour" (rich amber, warm glow, high dynamic range)
 *     4. "Vibrant Pop" (punchy saturation, high contrast posterized feel)
 * - Per-panel image management: Pan X, Pan Y, and Zoom (1.0x - 3.0x) controls, direct canvas hit-testing to click and select panels, custom offline file upload via FileReader data URLs, and sample photo quick fill.
 * - Bold typography engine using bundled OFL fonts (Oswald Bold, Montserrat Bold) with 3D comic extrusion, sunset gradient fills, dual neon glows, and dark subtitle pill banners.
 * - Stylized vector badges: Leonida "VI" Crest, Parental Advisory (Leonida Explicit), and Retro Palm Sun Crest.
 * - Multi-resolution canvas export: 16:9 Landscape (1920x1080), 1:1 Square (1080x1080), and 4:5 Portrait (1080x1350).
 * - Full support for automated shot modes (?shot=cover, ?shot=editor, ?shot=square, ?shot=portrait).
 */

import { cpSync, existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-app.ts';

const here = fileURLToPath(new URL('.', import.meta.url));
const out = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

mkdirSync(out, { recursive: true });
cpSync(join(here, 'app'), join(out, 'app'), { recursive: true });
mkdirSync(join(out, 'screenshots'), { recursive: true });
if (existsSync(join(here, 'screenshots'))) cpSync(join(here, 'screenshots'), join(out, 'screenshots'), { recursive: true });

// The scorer's own caps (reference/gate.json): only text_max_bytes shapes the bytes; the others refuse an entry the
// scorer would refuse (more than 4 screenshots or one over 256 KiB; more than 993 files in app/ or 48 MiB of app
// files, in all, or a path under app/ over 1000 bytes: app/ counts beside /output's own 1000-entry cap, its
// screenshots/ and dossier.json).
writeFileSync(
  join(out, 'dossier.json'),
  buildDossier(out, {
    text_max_bytes: 163840,
    screenshots: { max: 4, max_bytes: 262144 },
    app_max_files: 993,
    app_max_bytes: 50331648,
    app_path_max_bytes: 1000,
  }),
);
