// Main Application Controller for Vice Graphix Cover Art Generator
import { drawCover, LAYOUTS, getPanelAtPoint } from './cover.js';
import { runShot } from './shots.js';

// DOM Elements
const canvas = document.getElementById('cover');
const captionInput = document.getElementById('caption');
const subtitleInput = document.getElementById('subtitle');
const letteringSelect = document.getElementById('lettering-style');
const badgeSelect = document.getElementById('badge-style');
const statusMsg = document.getElementById('status');
const panelTabs = document.getElementById('panel-tabs');
const activePanelTag = document.getElementById('active-panel-tag');
const panXInput = document.getElementById('pan-x');
const panYInput = document.getElementById('pan-y');
const zoomInput = document.getElementById('zoom');
const valPanX = document.getElementById('val-pan-x');
const valPanY = document.getElementById('val-pan-y');
const valZoom = document.getElementById('val-zoom');
const resTag = document.getElementById('res-tag');
const fileInput = document.getElementById('photo-file');

// App State
const state = {
  layout: 'classic',
  ratio: 'landscape',
  grade: 'sunset',
  lettering: 'sunset',
  badge: 'vi',
  activePanelIndex: 0,
  isShotMode: false,
  panels: [
    { image: null, panX: 0, panY: 0, zoom: 1.0 },
    { image: null, panX: 0, panY: 0, zoom: 1.0 },
    { image: null, panX: 0, panY: 0, zoom: 1.0 },
    { image: null, panX: 0, panY: 0, zoom: 1.0 },
    { image: null, panX: 0, panY: 0, zoom: 1.0 }
  ]
};

// Image Cache
const samples = {
  boulevard: null,
  pier: null
};

/**
 * Load an image offline safely resolving once fully decoded
 */
export function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = (err) => reject(err);
    img.src = src;
  });
}

/**
 * Renders the current state onto the canvas
 */
export function redraw() {
  const currentLayoutDef = LAYOUTS[state.layout] || LAYOUTS.classic;
  
  // Ensure we have enough panel states
  while (state.panels.length < currentLayoutDef.panels.length) {
    state.panels.push({ image: null, panX: 0, panY: 0, zoom: 1.0 });
  }

  drawCover(canvas, {
    layout: state.layout,
    grade: state.grade,
    panels: state.panels,
    activePanelIndex: state.activePanelIndex,
    showActiveHighlight: !state.isShotMode,
    title: captionInput ? captionInput.value : 'LEONIDA DREAMS',
    subtitle: subtitleInput ? subtitleInput.value : 'THE LEONIDA CHRONICLES',
    letteringStyle: state.lettering,
    badgeStyle: state.badge,
    defaultImage: samples.boulevard || samples.pier
  });
}

/**
 * Synchronize UI inputs with active panel state
 */
function syncPanelInputs() {
  const panel = state.panels[state.activePanelIndex] || { panX: 0, panY: 0, zoom: 1.0 };
  
  if (panXInput) {
    panXInput.value = Math.round(panel.panX * 100);
    valPanX.textContent = `${panXInput.value}%`;
  }
  if (panYInput) {
    panYInput.value = Math.round(panel.panY * 100);
    valPanY.textContent = `${panYInput.value}%`;
  }
  if (zoomInput) {
    zoomInput.value = Math.round(panel.zoom * 100);
    valZoom.textContent = `${panel.zoom.toFixed(1)}x`;
  }

  const currentLayoutDef = LAYOUTS[state.layout] || LAYOUTS.classic;
  const pDef = currentLayoutDef.panels[state.activePanelIndex] || { label: `Panel ${state.activePanelIndex + 1}` };
  if (activePanelTag) {
    activePanelTag.textContent = `Panel ${state.activePanelIndex + 1}: ${pDef.label}`;
  }

  // Update tab active classes
  if (panelTabs) {
    const tabs = panelTabs.querySelectorAll('.panel-tab');
    tabs.forEach((tab, idx) => {
      tab.classList.toggle('active', idx === state.activePanelIndex);
    });
  }
}

/**
 * Build panel tabs for current layout
 */
function buildPanelTabs() {
  if (!panelTabs) return;
  panelTabs.innerHTML = '';
  const currentLayoutDef = LAYOUTS[state.layout] || LAYOUTS.classic;

  currentLayoutDef.panels.forEach((p, idx) => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = `panel-tab ${idx === state.activePanelIndex ? 'active' : ''}`;
    btn.textContent = `P${idx + 1}: ${p.label}`;
    btn.addEventListener('click', () => {
      state.activePanelIndex = idx;
      syncPanelInputs();
      redraw();
    });
    panelTabs.appendChild(btn);
  });
}

/**
 * Setup canvas resolution based on ratio mode
 */
function setCanvasResolution(w, h, ratioKey) {
  canvas.width = w;
  canvas.height = h;
  state.ratio = ratioKey;
  if (resTag) {
    resTag.textContent = `${w} × ${h} px`;
  }
}

// -------------------------------------------------------------
// EVENT LISTENERS & UI WIRING
// -------------------------------------------------------------

// Layout selector buttons
document.querySelectorAll('#layout-options .layout-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('#layout-options .layout-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    state.layout = btn.getAttribute('data-layout');
    state.activePanelIndex = 0;
    buildPanelTabs();
    syncPanelInputs();
    redraw();
  });
});

// Ratio toggle buttons
document.querySelectorAll('#ratio-options .toggle-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('#ratio-options .toggle-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    const w = parseInt(btn.getAttribute('data-w'), 10);
    const h = parseInt(btn.getAttribute('data-h'), 10);
    const ratio = btn.getAttribute('data-ratio');
    setCanvasResolution(w, h, ratio);
    redraw();
  });
});

// Grade selector buttons
document.querySelectorAll('#grade-options .grade-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('#grade-options .grade-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    state.grade = btn.getAttribute('data-grade');
    redraw();
  });
});

// Slider inputs
if (panXInput) {
  panXInput.addEventListener('input', (e) => {
    const val = parseInt(e.target.value, 10);
    valPanX.textContent = `${val}%`;
    if (!state.panels[state.activePanelIndex]) state.panels[state.activePanelIndex] = {};
    state.panels[state.activePanelIndex].panX = val / 100;
    redraw();
  });
}

if (panYInput) {
  panYInput.addEventListener('input', (e) => {
    const val = parseInt(e.target.value, 10);
    valPanY.textContent = `${val}%`;
    if (!state.panels[state.activePanelIndex]) state.panels[state.activePanelIndex] = {};
    state.panels[state.activePanelIndex].panY = val / 100;
    redraw();
  });
}

if (zoomInput) {
  zoomInput.addEventListener('input', (e) => {
    const val = parseInt(e.target.value, 10);
    const zoomVal = val / 100;
    valZoom.textContent = `${zoomVal.toFixed(1)}x`;
    if (!state.panels[state.activePanelIndex]) state.panels[state.activePanelIndex] = {};
    state.panels[state.activePanelIndex].zoom = zoomVal;
    redraw();
  });
}

// Sample photo buttons
document.getElementById('btn-sample-boulevard')?.addEventListener('click', () => {
  if (samples.boulevard) {
    state.panels[state.activePanelIndex].image = samples.boulevard;
    redraw();
  }
});

document.getElementById('btn-sample-pier')?.addEventListener('click', () => {
  if (samples.pier) {
    state.panels[state.activePanelIndex].image = samples.pier;
    redraw();
  }
});

// Upload custom photo offline via FileReader
if (fileInput) {
  fileInput.addEventListener('change', (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const customImg = await loadImage(event.target.result);
        state.panels[state.activePanelIndex].image = customImg;
        if (statusMsg) statusMsg.textContent = `Loaded ${file.name} to Panel ${state.activePanelIndex + 1}`;
        redraw();
      } catch (err) {
        if (statusMsg) statusMsg.textContent = 'Error loading image file';
      }
    };
    reader.readAsDataURL(file);
  });
}

// Fill all panels button
document.getElementById('btn-fill-all')?.addEventListener('click', () => {
  const currentImg = state.panels[state.activePanelIndex]?.image || samples.boulevard;
  state.panels.forEach(p => {
    p.image = currentImg;
  });
  if (statusMsg) statusMsg.textContent = 'Assigned photo to all panels';
  redraw();
});

// Typography inputs
if (captionInput) captionInput.addEventListener('input', redraw);
if (subtitleInput) subtitleInput.addEventListener('input', redraw);

if (letteringSelect) {
  letteringSelect.addEventListener('change', (e) => {
    state.lettering = e.target.value;
    redraw();
  });
}

if (badgeSelect) {
  badgeSelect.addEventListener('change', (e) => {
    state.badge = e.target.value;
    redraw();
  });
}

// Direct Canvas Click Hit-Testing
if (canvas) {
  canvas.addEventListener('click', (e) => {
    const clickedIndex = getPanelAtPoint(canvas, e.clientX, e.clientY, state.layout);
    state.activePanelIndex = clickedIndex;
    syncPanelInputs();
    redraw();
  });
}

// Quick Random Mix Button
document.getElementById('btn-quick-random')?.addEventListener('click', () => {
  const layouts = ['classic', 'ocean', 'neon', 'poster'];
  const grades = ['sunset', 'neon', 'golden', 'vibrant'];
  const badges = ['vi', 'advisory', 'palm'];
  const titles = ['LEONIDA DREAMS', 'VICE HEIST', 'PALM COAST', 'NIGHT SHIFT', 'OCEAN DRIVE'];
  const subtitles = ['THE LEONIDA CHRONICLES', 'BAD HABITS DIE HARD', 'SUNSET SYNDICATE', 'MIAMI NOIR'];

  state.layout = layouts[Math.floor(Math.random() * layouts.length)];
  state.grade = grades[Math.floor(Math.random() * grades.length)];
  state.badge = badges[Math.floor(Math.random() * badges.length)];
  
  // Update buttons
  document.querySelectorAll('#layout-options .layout-btn').forEach(b => {
    b.classList.toggle('active', b.getAttribute('data-layout') === state.layout);
  });
  document.querySelectorAll('#grade-options .grade-btn').forEach(b => {
    b.classList.toggle('active', b.getAttribute('data-grade') === state.grade);
  });
  if (badgeSelect) badgeSelect.value = state.badge;

  if (captionInput) captionInput.value = titles[Math.floor(Math.random() * titles.length)];
  if (subtitleInput) subtitleInput.value = subtitles[Math.floor(Math.random() * subtitles.length)];

  // Alternate images
  state.panels.forEach((p, idx) => {
    p.image = idx % 2 === 0 ? samples.boulevard : samples.pier;
  });

  buildPanelTabs();
  syncPanelInputs();
  redraw();
});

// Export High-Res PNG Button
document.getElementById('export')?.addEventListener('click', () => {
  // Temporary redraw without editor highlight before export
  drawCover(canvas, {
    layout: state.layout,
    grade: state.grade,
    panels: state.panels,
    activePanelIndex: state.activePanelIndex,
    showActiveHighlight: false,
    title: captionInput ? captionInput.value : 'LEONIDA DREAMS',
    subtitle: subtitleInput ? subtitleInput.value : 'THE LEONIDA CHRONICLES',
    letteringStyle: state.lettering,
    badgeStyle: state.badge,
    defaultImage: samples.boulevard || samples.pier
  });

  canvas.toBlob((blob) => {
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `vice-cover-${canvas.width}x${canvas.height}.png`;
    a.click();
    if (statusMsg) statusMsg.textContent = `Exported vice-cover-${canvas.width}x${canvas.height}.png`;
    // Restore editor highlight
    redraw();
  }, 'image/png');
});

// -------------------------------------------------------------
// INITIALIZATION & SHOT MODE HANDLING
// -------------------------------------------------------------

async function init() {
  try {
    // Preload offline sample photos
    const [boulevard, pier] = await Promise.all([
      loadImage('samples/boulevard.jpg'),
      loadImage('samples/pier.jpg')
    ]);
    samples.boulevard = boulevard;
    samples.pier = pier;

    // Distribute sample photos across panels for varied multi-panel poster feel
    state.panels[0].image = boulevard;
    state.panels[1].image = pier;
    state.panels[2].image = boulevard;
    state.panels[3].image = pier;
    state.panels[4].image = boulevard;
  } catch (err) {
    console.warn('Sample image load error:', err);
  }

  const searchParams = new URLSearchParams(location.search);
  const shot = searchParams.get('shot');

  if (shot) {
    state.isShotMode = true;
    await runShot(shot, searchParams, async (config) => {
      state.layout = config.layout;
      state.grade = config.grade;
      state.badge = config.badge;

      if (captionInput) captionInput.value = config.caption;
      if (subtitleInput) subtitleInput.value = config.subtitle;

      // Assign primary image according to query
      const primaryImg = config.photoKey === 'pier' ? samples.pier : samples.boulevard;
      const secondaryImg = config.photoKey === 'pier' ? samples.boulevard : samples.pier;

      // Smart assignment for rich multi-panel appearance
      state.panels.forEach((p, idx) => {
        p.image = (idx === 0) ? primaryImg : (idx % 2 === 1 ? secondaryImg : primaryImg);
        // Add subtle pan/zoom for varied cropping
        if (idx === 1) { p.panX = 0.1; p.panY = -0.1; p.zoom = 1.15; }
        if (idx === 2) { p.panX = -0.15; p.panY = 0.1; p.zoom = 1.2; }
      });

      // Sizing canvas to shot target resolution
      if (config.shot === 'cover') {
        canvas.width = 1280;
        canvas.height = 720;
      } else if (config.shot === 'square') {
        canvas.width = 1080;
        canvas.height = 1080;
      } else if (config.shot === 'portrait') {
        canvas.width = 1024;
        canvas.height = 1280;
      } else if (config.shot === 'editor') {
        canvas.width = 1920;
        canvas.height = 1080;
        state.isShotMode = false; // Show editor highlight on canvas
      }

      buildPanelTabs();
      syncPanelInputs();
      redraw();
    });
  } else {
    buildPanelTabs();
    syncPanelInputs();
    redraw();
  }
}

// Start application
init();
