// Handles automated screenshot modes via URL query parameters
// Ensures fonts are ready, sample photos loaded across panels, and window.__shotReady set.

export async function runShot(shot, query, setupScene) {
  const layout = query.get('layout') || (shot === 'square' ? 'ocean' : shot === 'portrait' ? 'neon' : 'classic');
  const caption = query.get('caption') || (shot === 'cover' ? 'LEONIDA DREAMS' : 'VICE CITY NIGHTS');
  const subtitle = query.get('subtitle') || (shot === 'square' ? 'BAD HABITS DIE HARD' : 'THE LEONIDA CHRONICLES');
  const photoKey = query.get('photo') || 'boulevard';
  const grade = query.get('grade') || (shot === 'portrait' ? 'neon' : 'sunset');
  const badge = query.get('badge') || (shot === 'square' ? 'advisory' : 'vi');

  // Add shot-specific class to body for full-bleed or editor styling
  if (shot === 'cover') {
    document.body.classList.add('shot-cover');
  } else if (shot === 'square') {
    document.body.classList.add('shot-square');
  } else if (shot === 'portrait') {
    document.body.classList.add('shot-portrait');
  } else if (shot === 'editor') {
    document.body.classList.add('shot-editor');
  }

  // Await offline font loading
  if (document.fonts && document.fonts.ready) {
    try {
      await document.fonts.ready;
    } catch {
      // Continue if font API fails
    }
  }

  // Setup the scene with custom parameters
  await setupScene({
    shot,
    layout,
    caption,
    subtitle,
    photoKey,
    grade,
    badge
  });

  // Double requestAnimationFrame ensures all canvas draw calls and DOM layout flushes finish
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      window.__shotReady = true;
    });
  });
}
