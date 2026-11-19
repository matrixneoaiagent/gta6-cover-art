// Interactive GTA 6 Cover Art Studio Controller
import { drawCover, LAYOUTS } from './cover.js';
import { runShot } from './shots.js';

const canvas = document.getElementById('coverCanvas');
const aspectLabel = document.getElementById('aspectLabel');
const statusMsg = document.getElementById('statusMsg');

const sliderPanX = document.getElementById('sliderPanX');
const sliderPanY = document.getElementById('sliderPanY');
const sliderZoom = document.getElementById('sliderZoom');
const panXVal = document.getElementById('panXVal');
const panYVal = document.getElementById('panYVal');
const zoomVal = document.getElementById('zoomVal');

const inputTitle = document.getElementById('inputTitle');
const inputSubtitle = document.getElementById('inputSubtitle');
const panelTabsContainer = document.getElementById('panelTabs');

// Preloaded images cache
const imageCache = new Map();

export const state = {
  layout: 'classic',
  selectedPanel: 0,
  panels: {}, // { [panelId]: { image, panX, panY, zoom } }
  defaultImage: null,
  grade: 'sunset',
  title: 'LEONIDA DREAMS',
  subtitle: 'THE LEONIDA CHRONICLES',
  letteringStyle: 'bold-white',
  badge: 'vi-crest',
  exportMode: false
};

/**
 * Loads an image from a local relative URL or data URL.
 */
export function loadImage(url) {
  if (imageCache.has(url)) {
    return Promise.resolve(imageCache.get(url));
  }
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      imageCache.set(url, img);
      resolve(img);
    };
    img.onerror = reject;
    img.src = url;
  });
}

/**
 * Redraws the cover canvas with the current state.
 */
export function redraw() {
  drawCover(canvas, state);
}

/**
 * Updates UI panel slider values to match currently selected panel.
 */
function updatePanelControlsUI() {
  const layout = LAYOUTS[state.layout] || LAYOUTS.classic;
  const panelDef = layout.panels[state.selectedPanel] || layout.panels[0];
  const pData = state.panels[panelDef.id] || {};

  const curPanX = pData.panX ?? panelDef.defaultPan[0];
  const curPanY = pData.panY ?? panelDef.defaultPan[1];
  const curZoom = pData.zoom ?? panelDef.defaultZoom;

  sliderPanX.value = Math.round(curPanX * 100);
  sliderPanY.value = Math.round(curPanY * 100);
  sliderZoom.value = Math.round(curZoom * 100);

  panXVal.textContent = `${sliderPanX.value}%`;
  panYVal.textContent = `${sliderPanY.value}%`;
  zoomVal.textContent = `${(curZoom).toFixed(2)}x`;
}

/**
 * Rebuilds panel tabs when layout changes.
 */
function renderPanelTabs() {
  panelTabsContainer.innerHTML = '';
  const layout = LAYOUTS[state.layout] || LAYOUTS.classic;

  if (state.selectedPanel >= layout.panels.length) {
    state.selectedPanel = 0;
  }

  layout.panels.forEach((p, idx) => {
    const tab = document.createElement('div');
    tab.className = `panel-tab ${idx === state.selectedPanel ? 'active' : ''}`;
    tab.textContent = `P${idx + 1}`;
    tab.title = p.name;
    tab.addEventListener('click', () => {
      state.selectedPanel = idx;
      renderPanelTabs();
      updatePanelControlsUI();
      redraw();
    });
    panelTabsContainer.appendChild(tab);
  });

  updatePanelControlsUI();
}

/**
 * Sets up user input event listeners.
 */
function initEvents() {
  // Layout buttons
  document.querySelectorAll('#layoutBtns button').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('#layoutBtns button').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      state.layout = btn.dataset.layout;
      state.selectedPanel = 0;
      renderPanelTabs();
      redraw();
    });
  });

  // Aspect ratio / canvas size buttons
  document.querySelectorAll('#aspectBtns button').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('#aspectBtns button').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const w = parseInt(btn.dataset.w, 10);
      const h = parseInt(btn.dataset.h, 10);
      canvas.width = w;
      canvas.height = h;
      aspectLabel.textContent = `${w} × ${h} (${btn.querySelector('span').textContent})`;
      redraw();
    });
  });

  // Color Grade buttons
  document.querySelectorAll('#gradeBtns button').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('#gradeBtns button').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      state.grade = btn.dataset.grade;
      redraw();
    });
  });

  // Badge buttons
  document.querySelectorAll('#badgeBtns button').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('#badgeBtns button').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      state.badge = btn.dataset.badge;
      redraw();
    });
  });

  // Lettering style buttons
  document.querySelectorAll('#styleBtns button').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('#styleBtns button').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      state.letteringStyle = btn.dataset.style;
      redraw();
    });
  });

  // Sliders
  sliderPanX.addEventListener('input', () => {
    const val = parseInt(sliderPanX.value, 10) / 100;
    panXVal.textContent = `${sliderPanX.value}%`;
    getOrCreatePanelData().panX = val;
    redraw();
  });

  sliderPanY.addEventListener('input', () => {
    const val = parseInt(sliderPanY.value, 10) / 100;
    panYVal.textContent = `${sliderPanY.value}%`;
    getOrCreatePanelData().panY = val;
    redraw();
  });

  sliderZoom.addEventListener('input', () => {
    const val = parseInt(sliderZoom.value, 10) / 100;
    zoomVal.textContent = `${val.toFixed(2)}x`;
    getOrCreatePanelData().zoom = val;
    redraw();
  });

  // Typography inputs
  inputTitle.addEventListener('input', () => {
    state.title = inputTitle.value;
    redraw();
  });

  inputSubtitle.addEventListener('input', () => {
    state.subtitle = inputSubtitle.value;
    redraw();
  });

  // Sample photo quick buttons
  document.getElementById('btnSampleBoulevard').addEventListener('click', async () => {
    const img = await loadImage('./samples/boulevard.jpg');
    state.defaultImage = img;
    getOrCreatePanelData().image = img;
    redraw();
  });

  document.getElementById('btnSamplePier').addEventListener('click', async () => {
    const img = await loadImage('./samples/pier.jpg');
    state.defaultImage = img;
    getOrCreatePanelData().image = img;
    redraw();
  });

  // Fill all panels with current image
  document.getElementById('btnFillAll').addEventListener('click', () => {
    const curImg = getOrCreatePanelData().image || state.defaultImage;
    if (!curImg) return;
    const layout = LAYOUTS[state.layout] || LAYOUTS.classic;
    layout.panels.forEach(p => {
      if (!state.panels[p.id]) state.panels[p.id] = {};
      state.panels[p.id].image = curImg;
    });
    redraw();
  });

  // Custom photo file upload (offline local data URL)
  document.getElementById('photoFileInput').addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (evt) => {
      const dataUrl = evt.target.result;
      const img = await loadImage(dataUrl);
      state.defaultImage = img;
      getOrCreatePanelData().image = img;
      redraw();
    };
    reader.readAsDataURL(file);
  });

  // Canvas interactive panel click selection
  canvas.addEventListener('click', (e) => {
    const rect = canvas.getBoundingClientRect();
    const nx = (e.clientX - rect.left) / rect.width;
    const ny = (e.clientY - rect.top) / rect.height;

    const layout = LAYOUTS[state.layout] || LAYOUTS.classic;
    // Check in reverse order so elevated/top panels are hit first
    for (let i = layout.panels.length - 1; i >= 0; i--) {
      const [rx, ry, rw, rh] = layout.panels[i].rect;
      if (nx >= rx && nx <= rx + rw && ny >= ry && ny <= ry + rh) {
        state.selectedPanel = i;
        renderPanelTabs();
        redraw();
        break;
      }
    }
  });

  // Export PNG button
  document.getElementById('btnExport').addEventListener('click', () => {
    state.exportMode = true;
    redraw();

    canvas.toBlob((blob) => {
      if (!blob) return;
      const a = document.createElement('a');
      const filename = `gta6-cover-${canvas.width}x${canvas.height}.png`;
      a.href = URL.createObjectURL(blob);
      a.download = filename;
      a.click();
      state.exportMode = false;
      redraw();
      statusMsg.textContent = `Exported ${filename}`;
      setTimeout(() => { statusMsg.textContent = ''; }, 4000);
    }, 'image/png');
  });
}

function getOrCreatePanelData() {
  const layout = LAYOUTS[state.layout] || LAYOUTS.classic;
  const panelDef = layout.panels[state.selectedPanel] || layout.panels[0];
  if (!state.panels[panelDef.id]) {
    state.panels[panelDef.id] = {
      image: state.defaultImage,
      panX: panelDef.defaultPan[0],
      panY: panelDef.defaultPan[1],
      zoom: panelDef.defaultZoom
    };
  }
  return state.panels[panelDef.id];
}

/**
 * Initializes app on page load.
 */
async function init() {
  initEvents();

  // Wait for local fonts to load so text rendering is crisp
  if (document.fonts && document.fonts.ready) {
    await document.fonts.ready;
  }

  // Preload default sample photos
  const boulevardImg = await loadImage('./samples/boulevard.jpg');
  const pierImg = await loadImage('./samples/pier.jpg');
  state.defaultImage = boulevardImg;

  // Check URL query parameters for screenshot shot mode
  const searchParams = new URLSearchParams(window.location.search);
  const shot = searchParams.get('shot');

  if (shot) {
    await runShot(shot, searchParams, {
      loadImage,
      canvas,
      state,
      redraw,
      renderPanelTabs,
      samples: { boulevard: boulevardImg, pier: pierImg }
    });
  } else {
    // Normal editor mode default setup
    // Assign varied initial sample images and framing across panels for immediate beauty
    state.panels[0] = { image: boulevardImg, panX: 0, panY: 0, zoom: 1.15 };
    state.panels[1] = { image: pierImg, panX: 0.1, panY: -0.2, zoom: 1.4 };
    state.panels[2] = { image: boulevardImg, panX: -0.15, panY: 0.1, zoom: 1.35 };
    state.panels[3] = { image: pierImg, panX: 0.2, panY: 0.2, zoom: 1.5 };

    renderPanelTabs();
    redraw();
  }
}

// Start app
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
