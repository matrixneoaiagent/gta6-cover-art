// GTA 6-Style Multi-Panel Cover Art Engine
// Offline Canvas 2D compositing, color grading, comic panel framing, and typography.

export const LAYOUTS = {
  classic: {
    id: 'classic',
    name: 'Vice Classic',
    panelCount: 4,
    // [x, y, w, h] normalized 0..1
    panels: [
      { id: 0, name: 'Hero Left', rect: [0, 0, 0.52, 1.0], defaultPan: [0, 0], defaultZoom: 1.15 },
      { id: 1, name: 'Top Right', rect: [0.52, 0, 0.48, 0.334], defaultPan: [0.1, -0.2], defaultZoom: 1.35 },
      { id: 2, name: 'Mid Right', rect: [0.52, 0.334, 0.48, 0.333], defaultPan: [-0.15, 0.1], defaultZoom: 1.4 },
      { id: 3, name: 'Bottom Right', rect: [0.52, 0.667, 0.48, 0.333], defaultPan: [0.2, 0.25], defaultZoom: 1.5 }
    ]
  },
  ocean: {
    id: 'ocean',
    name: 'Ocean Drive',
    panelCount: 3,
    panels: [
      { id: 0, name: 'Panorama Top', rect: [0, 0, 1.0, 0.52], defaultPan: [0, -0.15], defaultZoom: 1.1 },
      { id: 1, name: 'Split Left', rect: [0, 0.52, 0.50, 0.48], defaultPan: [-0.2, 0.1], defaultZoom: 1.35 },
      { id: 2, name: 'Split Right', rect: [0.50, 0.52, 0.50, 0.48], defaultPan: [0.2, 0.1], defaultZoom: 1.35 }
    ]
  },
  neon: {
    id: 'neon',
    name: 'Neon Grid',
    panelCount: 5,
    panels: [
      { id: 0, name: 'Main Hero', rect: [0, 0, 0.60, 0.62], defaultPan: [0, 0], defaultZoom: 1.2 },
      { id: 1, name: 'Upper Detail', rect: [0.60, 0, 0.40, 0.31], defaultPan: [0.15, -0.2], defaultZoom: 1.4 },
      { id: 2, name: 'Mid Detail', rect: [0.60, 0.31, 0.40, 0.31], defaultPan: [-0.1, 0.1], defaultZoom: 1.4 },
      { id: 3, name: 'Lower Left', rect: [0, 0.62, 0.38, 0.38], defaultPan: [-0.2, 0.2], defaultZoom: 1.5 },
      { id: 4, name: 'Lower Wide', rect: [0.38, 0.62, 0.62, 0.38], defaultPan: [0.1, 0.15], defaultZoom: 1.3 }
    ]
  },
  poster: {
    id: 'poster',
    name: 'Poster Frame',
    panelCount: 3,
    panels: [
      { id: 0, name: 'Full Backdrop', rect: [0, 0, 1.0, 1.0], defaultPan: [0, 0], defaultZoom: 1.05 },
      { id: 1, name: 'Inset Top', rect: [0.56, 0.08, 0.38, 0.38], defaultPan: [0.2, -0.1], defaultZoom: 1.45, elevated: true },
      { id: 2, name: 'Inset Bottom', rect: [0.06, 0.52, 0.38, 0.40], defaultPan: [-0.2, 0.2], defaultZoom: 1.45, elevated: true }
    ]
  }
};

/**
 * Draws the complete multi-panel cover on canvas.
 */
export function drawCover(canvas, state) {
  const ctx = canvas.getContext('2d');
  const { width: w, height: h } = canvas;
  const layout = LAYOUTS[state.layout] || LAYOUTS.classic;
  const borderWidth = Math.max(8, Math.round(w * 0.009));

  // 1. Draw base dark comic background
  ctx.save();
  ctx.fillStyle = '#0a0812';
  ctx.fillRect(0, 0, w, h);

  // 2. Render each panel
  layout.panels.forEach((p, idx) => {
    drawPanel(ctx, p, state, w, h, borderWidth, idx === state.selectedPanel);
  });

  // 3. Render thick comic borders & miters
  drawComicBorders(ctx, layout, w, h, borderWidth);

  // 4. Global Color Grade Presets & Film Grain
  applyGlobalColorGrade(ctx, state.grade || 'sunset', w, h);

  // 5. Stylized Badge / Stamp Overlay
  if (state.badge && state.badge !== 'none') {
    drawBadge(ctx, state.badge, w, h);
  }

  // 6. Typography Engine (Title, Subtitle, Shadows, Glows)
  drawTypography(ctx, state.title, state.subtitle, state.letteringStyle || 'bold-white', w, h);

  ctx.restore();
}

/**
 * Renders an individual panel with image cropping, pan, zoom, and local color tint.
 */
function drawPanel(ctx, panelDef, state, canvasW, canvasH, borderWidth, isSelected) {
  const [rx, ry, rw, rh] = panelDef.rect;
  const px = Math.round(rx * canvasW);
  const py = Math.round(ry * canvasH);
  const pw = Math.round(rw * canvasW);
  const ph = Math.round(rh * canvasH);

  const panelData = (state.panels && state.panels[panelDef.id]) || {};
  const img = panelData.image || state.defaultImage;
  const panX = panelData.panX ?? panelDef.defaultPan[0];
  const panY = panelData.panY ?? panelDef.defaultPan[1];
  const zoom = panelData.zoom ?? panelDef.defaultZoom;

  ctx.save();

  // If elevated inset panel, draw shadow
  if (panelDef.elevated) {
    ctx.shadowColor = 'rgba(0, 0, 0, 0.85)';
    ctx.shadowBlur = Math.round(canvasW * 0.02);
    ctx.shadowOffsetX = Math.round(canvasW * 0.006);
    ctx.shadowOffsetY = Math.round(canvasW * 0.008);
    ctx.fillStyle = '#000000';
    ctx.fillRect(px, py, pw, ph);
    ctx.shadowColor = 'transparent';
  }

  // Clip to panel boundaries
  ctx.beginPath();
  ctx.rect(px, py, pw, ph);
  ctx.clip();

  // Fill dark background for the panel
  ctx.fillStyle = '#14121d';
  ctx.fillRect(px, py, pw, ph);

  if (img && img.naturalWidth && img.naturalHeight) {
    // Calculate aspect fill cover
    const scale = Math.max(pw / img.naturalWidth, ph / img.naturalHeight) * zoom;
    const drawnW = img.naturalWidth * scale;
    const drawnH = img.naturalHeight * scale;

    // Pan calculation
    const maxOffsetW = (drawnW - pw) / 2;
    const maxOffsetH = (drawnH - ph) / 2;
    const offsetX = (pw - drawnW) / 2 + panX * maxOffsetW;
    const offsetY = (ph - drawnH) / 2 + panY * maxOffsetH;

    // Per-panel filter adjustment for pop comic feel
    ctx.filter = 'contrast(112%) saturate(120%) brightness(103%)';
    ctx.drawImage(img, px + offsetX, py + offsetY, drawnW, drawnH);
    ctx.filter = 'none';

    // Subtle atmospheric panel gradient
    const panelGrad = ctx.createLinearGradient(px, py + ph * 0.35, px, py + ph);
    panelGrad.addColorStop(0, 'rgba(0, 0, 0, 0)');
    panelGrad.addColorStop(1, 'rgba(15, 8, 26, 0.48)');
    ctx.fillStyle = panelGrad;
    ctx.fillRect(px, py, pw, ph);
  } else {
    // Stylized procedural placeholder pattern if no image
    const patternGrad = ctx.createLinearGradient(px, py, px + pw, py + ph);
    patternGrad.addColorStop(0, '#2d113f');
    patternGrad.addColorStop(0.5, '#4f1a4e');
    patternGrad.addColorStop(1, '#1b1b3a');
    ctx.fillStyle = patternGrad;
    ctx.fillRect(px, py, pw, ph);

    // Neon grid lines
    ctx.strokeStyle = 'rgba(255, 0, 127, 0.2)';
    ctx.lineWidth = 2;
    for (let lx = px; lx < px + pw; lx += 40) {
      ctx.beginPath();
      ctx.moveTo(lx, py);
      ctx.lineTo(lx, py + ph);
      ctx.stroke();
    }
  }

  // Selection highlight outline for active panel during editing
  if (isSelected && !state.exportMode) {
    ctx.strokeStyle = '#00e5ff';
    ctx.lineWidth = Math.max(4, Math.round(borderWidth * 0.6));
    ctx.strokeRect(px + 2, py + 2, pw - 4, ph - 4);
  }

  ctx.restore();
}

/**
 * Draws crisp, comic book black border lines separating all panels.
 */
function drawComicBorders(ctx, layout, w, h, borderWidth) {
  ctx.save();
  ctx.fillStyle = '#06050b';
  ctx.strokeStyle = '#06050b';
  ctx.lineWidth = borderWidth;

  // Outer canvas framing border
  ctx.strokeRect(borderWidth / 2, borderWidth / 2, w - borderWidth, h - borderWidth);

  // Dividers between panels
  layout.panels.forEach(p => {
    const [rx, ry, rw, rh] = p.rect;
    const px = Math.round(rx * w);
    const py = Math.round(ry * h);
    const pw = Math.round(rw * w);
    const ph = Math.round(rh * h);

    if (p.elevated) {
      // Inset panels get a prominent solid border
      ctx.lineWidth = borderWidth * 1.25;
      ctx.strokeRect(px, py, pw, ph);
    } else {
      ctx.lineWidth = borderWidth;
      ctx.strokeRect(px, py, pw, ph);
    }
  });

  ctx.restore();
}

/**
 * Canvas color grading filters: Sunset Boulevard, Neon Noir, Golden Hour, Vibrant Pop.
 */
function applyGlobalColorGrade(ctx, grade, w, h) {
  ctx.save();

  if (grade === 'sunset') {
    // Sunset Boulevard: Golden top, magenta mid, navy/purple shadows
    const grad = ctx.createLinearGradient(0, 0, 0, h);
    grad.addColorStop(0, 'rgba(255, 170, 0, 0.20)');
    grad.addColorStop(0.45, 'rgba(255, 0, 128, 0.22)');
    grad.addColorStop(1, 'rgba(20, 10, 48, 0.40)');
    ctx.globalCompositeOperation = 'overlay';
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);

    // Warm radial sunburst highlight
    const radial = ctx.createRadialGradient(w * 0.3, h * 0.25, 10, w * 0.3, h * 0.25, w * 0.7);
    radial.addColorStop(0, 'rgba(255, 230, 130, 0.25)');
    radial.addColorStop(1, 'rgba(255, 0, 100, 0)');
    ctx.globalCompositeOperation = 'screen';
    ctx.fillStyle = radial;
    ctx.fillRect(0, 0, w, h);
  } else if (grade === 'neon') {
    // Neon Noir: Electric cyan & hot pink duo-tone punch
    const grad = ctx.createLinearGradient(0, 0, w, h);
    grad.addColorStop(0, 'rgba(0, 229, 255, 0.35)');
    grad.addColorStop(0.5, 'rgba(157, 78, 221, 0.25)');
    grad.addColorStop(1, 'rgba(255, 0, 127, 0.35)');
    ctx.globalCompositeOperation = 'color';
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);

    const grad2 = ctx.createLinearGradient(w, 0, 0, h);
    grad2.addColorStop(0, 'rgba(255, 0, 127, 0.25)');
    grad2.addColorStop(1, 'rgba(0, 229, 255, 0.20)');
    ctx.globalCompositeOperation = 'screen';
    ctx.fillStyle = grad2;
    ctx.fillRect(0, 0, w, h);
  } else if (grade === 'golden') {
    // Golden Hour: Rich amber, warm glow, high dynamic range
    const grad = ctx.createLinearGradient(0, 0, 0, h);
    grad.addColorStop(0, 'rgba(255, 200, 60, 0.30)');
    grad.addColorStop(0.6, 'rgba(255, 110, 30, 0.25)');
    grad.addColorStop(1, 'rgba(60, 20, 10, 0.35)');
    ctx.globalCompositeOperation = 'overlay';
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);
  } else if (grade === 'vibrant') {
    // Vibrant Pop: Comic saturation punch
    const grad = ctx.createLinearGradient(0, h * 0.4, 0, h);
    grad.addColorStop(0, 'rgba(255, 255, 255, 0)');
    grad.addColorStop(1, 'rgba(255, 0, 120, 0.30)');
    ctx.globalCompositeOperation = 'soft-light';
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);
  }

  // Cinematic vignette
  ctx.globalCompositeOperation = 'multiply';
  const vig = ctx.createRadialGradient(w / 2, h / 2, Math.min(w, h) * 0.45, w / 2, h / 2, Math.max(w, h) * 0.85);
  vig.addColorStop(0, 'rgba(0, 0, 0, 0)');
  vig.addColorStop(1, 'rgba(0, 0, 0, 0.55)');
  ctx.fillStyle = vig;
  ctx.fillRect(0, 0, w, h);

  ctx.restore();
}

/**
 * Stylized Badges: Roman numeral VI crest, Parental Advisory, Palm Tree crest.
 */
function drawBadge(ctx, badgeType, w, h) {
  ctx.save();
  const scale = w / 1080;

  if (badgeType === 'vi-crest') {
    // Roman numeral "VI" Badge (upper right corner)
    const bx = w - 110 * scale;
    const by = 80 * scale;
    const bw = 130 * scale;
    const bh = 95 * scale;

    ctx.translate(bx, by);

    // Drop shadow
    ctx.shadowColor = 'rgba(0, 0, 0, 0.8)';
    ctx.shadowBlur = 12 * scale;
    ctx.shadowOffsetX = 3 * scale;
    ctx.shadowOffsetY = 4 * scale;

    // Outer dark octagonal/diamond backplate
    ctx.fillStyle = '#0f0c19';
    ctx.strokeStyle = '#ff007f';
    ctx.lineWidth = 4 * scale;

    ctx.beginPath();
    const r = 8 * scale;
    ctx.roundRect(-bw / 2, -bh / 2, bw, bh, r);
    ctx.fill();
    ctx.stroke();

    // Inner gold/cyan border
    ctx.shadowColor = 'transparent';
    ctx.strokeStyle = '#ffaa00';
    ctx.lineWidth = 2 * scale;
    ctx.strokeRect(-bw / 2 + 5 * scale, -bh / 2 + 5 * scale, bw - 10 * scale, bh - 10 * scale);

    // Roman numeral "VI"
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = `bold ${Math.round(48 * scale)}px Oswald, sans-serif`;

    // Metallic gradient for "VI"
    const viGrad = ctx.createLinearGradient(0, -25 * scale, 0, 20 * scale);
    viGrad.addColorStop(0, '#ffffff');
    viGrad.addColorStop(0.4, '#ffe699');
    viGrad.addColorStop(0.7, '#ffaa00');
    viGrad.addColorStop(1, '#ff3b88');
    ctx.fillStyle = viGrad;

    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 6 * scale;
    ctx.strokeText('VI', 0, -5 * scale);
    ctx.fillText('VI', 0, -5 * scale);

    // Banner: "LEONIDA"
    ctx.font = `bold ${Math.round(11 * scale)}px Montserrat, sans-serif`;
    ctx.fillStyle = '#00e5ff';
    ctx.letterSpacing = '2px';
    ctx.fillText('LEONIDA', 0, 28 * scale);
  } else if (badgeType === 'parental') {
    // Parental Advisory badge (lower left corner)
    const bw = 180 * scale;
    const bh = 100 * scale;
    const bx = 30 * scale;
    const by = h - bh - 30 * scale;

    ctx.save();
    ctx.translate(bx, by);

    // Shadow
    ctx.shadowColor = 'rgba(0, 0, 0, 0.85)';
    ctx.shadowBlur = 10 * scale;
    ctx.shadowOffsetX = 4 * scale;
    ctx.shadowOffsetY = 4 * scale;

    // White box with black border
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, bw, bh);
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 4 * scale;
    ctx.strokeRect(0, 0, bw, bh);

    ctx.shadowColor = 'transparent';

    // Black header bar
    ctx.fillStyle = '#000000';
    ctx.fillRect(4 * scale, 4 * scale, bw - 8 * scale, 34 * scale);

    // "PARENTAL" text in white
    ctx.fillStyle = '#ffffff';
    ctx.font = `bold ${Math.round(18 * scale)}px Oswald, sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('PARENTAL', bw / 2, 21 * scale);

    // "ADVISORY" text in black
    ctx.fillStyle = '#000000';
    ctx.font = `bold ${Math.round(22 * scale)}px Oswald, sans-serif`;
    ctx.fillText('ADVISORY', bw / 2, 58 * scale);

    // "LEONIDA EXPLICIT" text
    ctx.font = `bold ${Math.round(10 * scale)}px Montserrat, sans-serif`;
    ctx.letterSpacing = '1px';
    ctx.fillText('LEONIDA EXPLICIT', bw / 2, 84 * scale);

    ctx.restore();
  } else if (badgeType === 'palm') {
    // Palm Tree Crest (upper left corner)
    const cx = 95 * scale;
    const cy = 95 * scale;
    const radius = 55 * scale;

    ctx.save();
    ctx.translate(cx, cy);

    ctx.shadowColor = 'rgba(0, 0, 0, 0.75)';
    ctx.shadowBlur = 12 * scale;
    ctx.shadowOffsetX = 3 * scale;
    ctx.shadowOffsetY = 4 * scale;

    // Outer circle
    ctx.fillStyle = '#140c24';
    ctx.beginPath();
    ctx.arc(0, 0, radius, 0, Math.PI * 2);
    ctx.fill();

    // Sunset arc fill
    const sunGrad = ctx.createLinearGradient(0, -radius * 0.7, 0, radius * 0.5);
    sunGrad.addColorStop(0, '#ffaa00');
    sunGrad.addColorStop(0.6, '#ff007f');
    sunGrad.addColorStop(1, '#9d4edd');
    ctx.fillStyle = sunGrad;
    ctx.beginPath();
    ctx.arc(0, 0, radius * 0.78, 0, Math.PI * 2);
    ctx.fill();

    // Palm tree silhouettes
    ctx.fillStyle = '#0b0816';
    // Trunk
    ctx.beginPath();
    ctx.moveTo(-10 * scale, radius * 0.6);
    ctx.quadraticCurveTo(-5 * scale, 0, -8 * scale, -15 * scale);
    ctx.lineTo(-4 * scale, -15 * scale);
    ctx.quadraticCurveTo(0 * scale, 0, -5 * scale, radius * 0.6);
    ctx.fill();

    // Fronds
    drawPalmFronds(ctx, -6 * scale, -15 * scale, 22 * scale);

    // Second smaller palm
    ctx.beginPath();
    ctx.moveTo(8 * scale, radius * 0.6);
    ctx.quadraticCurveTo(12 * scale, 5 * scale, 10 * scale, -8 * scale);
    ctx.lineTo(14 * scale, -8 * scale);
    ctx.quadraticCurveTo(16 * scale, 5 * scale, 13 * scale, radius * 0.6);
    ctx.fill();
    drawPalmFronds(ctx, 12 * scale, -8 * scale, 18 * scale);

    // Outer ring
    ctx.shadowColor = 'transparent';
    ctx.strokeStyle = '#00e5ff';
    ctx.lineWidth = 3.5 * scale;
    ctx.beginPath();
    ctx.arc(0, 0, radius, 0, Math.PI * 2);
    ctx.stroke();

    ctx.restore();
  }

  ctx.restore();
}

function drawPalmFronds(ctx, cx, cy, size) {
  const angles = [-0.9, -0.5, -0.1, 0.3, 0.7, 1.1, 1.5, 2.0];
  angles.forEach(ang => {
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(ang);
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.quadraticCurveTo(size * 0.6, -size * 0.25, size, size * 0.3);
    ctx.quadraticCurveTo(size * 0.5, 0, 0, 0);
    ctx.fill();
    ctx.restore();
  });
}

/**
 * Lettering and Typography: bold outlines, gradients, drop shadows.
 */
function drawTypography(ctx, title, subtitle, letteringStyle, w, h) {
  const cleanTitle = (title || 'LEONIDA DREAMS').trim().toUpperCase();
  const cleanSubtitle = (subtitle || 'THE VICE CHRONICLES').trim().toUpperCase();
  if (!cleanTitle && !cleanSubtitle) return;

  ctx.save();

  // Position at bottom center
  const scale = w / 1080;
  const bottomMargin = h * 0.08;
  const centerY = h - bottomMargin;

  // Title sizing calculation
  let titleFontSize = Math.round(w * 0.115);
  ctx.font = `bold ${titleFontSize}px Oswald, sans-serif`;

  while (ctx.measureText(cleanTitle).width > w * 0.88 && titleFontSize > 24) {
    titleFontSize -= 3;
    ctx.font = `bold ${titleFontSize}px Oswald, sans-serif`;
  }

  const strokeWidth = Math.max(8, Math.round(titleFontSize * 0.16));

  ctx.textAlign = 'center';
  ctx.textBaseline = 'bottom';
  ctx.lineJoin = 'miter';
  ctx.miterLimit = 3;

  // 1. Heavy 3D block extruded drop shadow (GTA style poster depth)
  const shadowSteps = 6;
  const stepDist = Math.max(2, Math.round(2.5 * scale));
  ctx.fillStyle = '#000000';
  ctx.strokeStyle = '#000000';
  ctx.lineWidth = strokeWidth * 2;
  for (let s = shadowSteps; s >= 1; s--) {
    const ox = s * stepDist;
    const oy = s * stepDist;
    ctx.strokeText(cleanTitle, w / 2 + ox, centerY + oy);
    ctx.fillText(cleanTitle, w / 2 + ox, centerY + oy);
  }

  // Draw main thick black outline stroke
  ctx.strokeText(cleanTitle, w / 2, centerY);

  // Apply chosen Lettering Style Fill
  if (letteringStyle === 'sunset-grad') {
    // Sunset gradient fill (yellow -> vivid orange -> hot pink -> violet)
    const textGrad = ctx.createLinearGradient(0, centerY - titleFontSize, 0, centerY);
    textGrad.addColorStop(0, '#fff490');
    textGrad.addColorStop(0.3, '#ffaa00');
    textGrad.addColorStop(0.65, '#ff007f');
    textGrad.addColorStop(1, '#9d4edd');
    ctx.fillStyle = textGrad;
  } else if (letteringStyle === 'neon-glow') {
    // Neon electric cyan with hot pink glow
    ctx.shadowColor = '#ff007f';
    ctx.shadowBlur = Math.round(26 * scale);
    ctx.fillStyle = '#00f5ff';
  } else {
    // Classic bold white
    ctx.fillStyle = '#ffffff';
  }

  ctx.fillText(cleanTitle, w / 2, centerY);

  // Re-stroke inner thin line for crispness if gradient
  if (letteringStyle === 'sunset-grad') {
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = Math.max(1, Math.round(scale * 1.5));
    ctx.strokeText(cleanTitle, w / 2, centerY);
  }

  // 2. Subtitle / Tagline rendering
  if (cleanSubtitle) {
    ctx.shadowColor = 'rgba(0, 0, 0, 0.9)';
    ctx.shadowBlur = 8 * scale;
    ctx.shadowOffsetX = 2 * scale;
    ctx.shadowOffsetY = 3 * scale;

    const subFontSize = Math.round(titleFontSize * 0.26);
    ctx.font = `bold ${subFontSize}px Montserrat, sans-serif`;

    // Subtitle badge strip or glowing pill
    const subWidth = ctx.measureText(cleanSubtitle).width + 36 * scale;
    const subHeight = subFontSize * 1.8;
    const subY = centerY + 8 * scale;

    // Dark pill backing for subtitle legibility
    ctx.fillStyle = 'rgba(8, 6, 14, 0.88)';
    ctx.strokeStyle = '#ff007f';
    ctx.lineWidth = Math.max(2, Math.round(scale * 2));

    ctx.beginPath();
    ctx.roundRect((w - subWidth) / 2, subY, subWidth, subHeight, 4 * scale);
    ctx.fill();
    ctx.stroke();

    ctx.shadowColor = 'transparent';
    ctx.fillStyle = '#00e5ff';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(cleanSubtitle, w / 2, subY + subHeight / 2 + 1);
  }

  ctx.restore();
}
