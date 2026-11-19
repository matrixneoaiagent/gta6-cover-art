// Shot modes for automated screenshots in desktop Chrome / Playwright.
// Supports cover (landscape 1280x720), editor (1280x800), square (1080x1080), and portrait (1024x1280).

export async function runShot(shot, query, ctx) {
  const { canvas, state, redraw, renderPanelTabs, samples, loadImage } = ctx;

  const layoutParam = query.get('layout') || 'classic';
  const captionParam = query.get('caption') || 'LEONIDA DREAMS';
  const photoParam = query.get('photo') || 'boulevard';
  const gradeParam = query.get('grade') || 'sunset';
  const badgeParam = query.get('badge') || (shot === 'editor' ? 'vi-crest' : 'vi-crest');

  // Load primary and secondary images
  const primaryImg = samples[photoParam] || await loadImage(`./samples/${photoParam}.jpg`);
  const alternateImg = photoParam === 'boulevard' ? samples.pier : samples.boulevard;

  state.layout = layoutParam;
  state.title = captionParam.toUpperCase();
  state.grade = gradeParam;
  state.badge = badgeParam;
  state.letteringStyle = query.get('style') || 'sunset-grad';

  // Apply photo across layout panels with tailored crops
  state.panels = {
    0: { image: primaryImg, panX: 0, panY: 0, zoom: 1.15 },
    1: { image: alternateImg, panX: 0.15, panY: -0.2, zoom: 1.4 },
    2: { image: primaryImg, panX: -0.2, panY: 0.1, zoom: 1.35 },
    3: { image: alternateImg, panX: 0.2, panY: 0.25, zoom: 1.45 },
    4: { image: primaryImg, panX: 0, panY: 0.15, zoom: 1.25 }
  };
  state.defaultImage = primaryImg;

  if (shot === 'cover') {
    // 1-cover.jpg: Landscape 1280 x 720 exported cover
    document.body.classList.add('shot-cover');
    canvas.width = 1280;
    canvas.height = 720;
    state.exportMode = true;
    state.subtitle = 'THE LEONIDA CHRONICLES';
  } else if (shot === 'editor') {
    // 2-editor.jpg: Full browser editor view
    state.exportMode = false;
    state.subtitle = 'BAD HABITS DIE HARD';
    state.selectedPanel = 0;
    // Set UI elements to match
    const titleInput = document.getElementById('inputTitle');
    const subtitleInput = document.getElementById('inputSubtitle');
    if (titleInput) titleInput.value = state.title;
    if (subtitleInput) subtitleInput.value = state.subtitle;
    if (renderPanelTabs) renderPanelTabs();
  } else if (shot === 'square') {
    // 3-square-cover.jpg: 1080 x 1080 square cover
    document.body.classList.add('shot-square');
    canvas.width = 1080;
    canvas.height = 1080;
    state.exportMode = true;
    state.subtitle = 'SUNSET VICE SQUAD';
  } else if (shot === 'portrait') {
    // 4-portrait-cover.jpg: 1024 x 1280 portrait cover
    document.body.classList.add('shot-portrait');
    canvas.width = 1024;
    canvas.height = 1280;
    state.exportMode = true;
    state.subtitle = 'VICE DISTRICT REPORT';
  }

  if (document.fonts && document.fonts.ready) {
    await document.fonts.ready;
  }

  redraw();

  // Double requestAnimationFrame ensures all canvas operations are fully committed to buffer
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      // Small timeout to guarantee any async font glyph rasterization is finished
      setTimeout(() => {
        redraw();
        window.__shotReady = true;
      }, 50);
    });
  });
}
