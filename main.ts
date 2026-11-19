/**
 * GTA 6-Style Multi-Panel Cover Art Generator - Entrypoint & Dossier Builder
 * make.fun bounty: gta6-cover-art-01
 *
 * ARCHITECTURE OVERVIEW:
 * 1. Offline Static Web Application:
 *    - All application code resides under `app/` and runs entirely client-side without any network
 *      requests, remote CDNs, or external APIs.
 *    - Fully responsive UI featuring dark glassmorphic styling, neon accent controls, and live canvas preview.
 *
 * 2. Multi-Panel Cover Engine (`app/src/cover.js`):
 *    - Implements 4 distinct iconic layouts:
 *      * "Vice Classic": 4 panels (1 dominant vertical hero panel on left, 3 stacked horizontal panels on right).
 *      * "Ocean Drive": 3 panels (1 panoramic hero panel across top, 2 vertical split panels below).
 *      * "Neon Grid": 5 panels (asymmetrical poster grid with prominent hero box and surrounding detail panels).
 *      * "Poster Frame": 1 dominant full-bleed background panel with 2 elevated inset accent panels.
 *    - Comic Framing: 8-14px thick solid dark comic borders dividing all panels with clean miters.
 *    - Per-panel transformation pipeline: supports custom per-panel photo assignment, pan offsets (X, Y),
 *      and zoom scaling (1x to 3x) with automatic aspect-fill cover calculation.
 *
 * 3. Color Grading & Atmospheric Presets:
 *    - "Sunset Boulevard": Golden hour highlights, vibrant magenta midtones, deep navy shadows, sunburst glow.
 *    - "Neon Noir": Electric cyan & hot pink duo-tone punch with color compositing.
 *    - "Golden Hour": Rich amber warmth, intense sunset radiance, and contrast pop.
 *    - "Vibrant Pop": Saturated comic poster color curve with cinematic vignette.
 *
 * 4. Local Typography & Badging System:
 *    - Bundled local fonts (`app/fonts/Oswald-Bold.ttf`, `app/fonts/Montserrat-Bold.ttf`) under SIL OFL.
 *    - 3D block extruded shadows, sunset gradient fills, neon glow strokes, and double outline effects.
 *    - Original stylized badges: Roman numeral "VI" crest, Parental Advisory box, and Palm Tree district crest.
 *
 * 5. Multi-Aspect Canvas Export:
 *    - Supports 16:9 Landscape (1920x1080), 1:1 Square (1080x1080), and 4:5 Portrait (1080x1350).
 *    - Direct offline PNG export triggering client-side download via Blob and Object URL.
 *
 * 6. Automated Shot Modes (`app/src/shots.js`):
 *    - Supports query parameters `?shot=cover`, `?shot=editor`, `?shot=square`, and `?shot=portrait`
 *      for automated screenshot capture with Playwright.
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
if (existsSync(join(here, 'screenshots'))) {
  cpSync(join(here, 'screenshots'), join(out, 'screenshots'), { recursive: true });
}

// Scorer caps: text max 160 KiB, max 4 screenshots <= 256 KiB, max 993 app files <= 48 MiB
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
