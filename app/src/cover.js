// Vice Graphix Cover Art Engine
// Renders multi-panel comic layouts, sunset & neon color grades, original vector badges, and bold typography.

export const LAYOUTS = {
  classic: {
    name: 'Vice Classic',
    panels: [
      { id: 0, x: 0, y: 0, w: 0.52, h: 1.0, label: 'Hero Left' },
      { id: 1, x: 0.52, y: 0, w: 0.48, h: 0.333, label: 'Top Right' },
      { id: 2, x: 0.52, y: 0.333, w: 0.48, h: 0.334, label: 'Mid Right' },
      { id: 3, x: 0.52, y: 0.667, w: 0.48, h: 0.333, label: 'Bottom Right' }
    ]
  },
  ocean: {
    name: 'Ocean Drive',
    panels: [
      { id: 0, x: 0, y: 0, w: 1.0, h: 0.52, label: 'Top Panoramic Hero' },
      { id: 1, x: 0, y: 0.52, w: 0.50, h: 0.48, label: 'Bottom Left' },
      { id: 2, x: 0.50, y: 0.52, w: 0.50, h: 0.48, label: 'Bottom Right' }
    ]
  },
  neon: {
    name: 'Neon Grid',
    panels: [
      { id: 0, x: 0, y: 0, w: 0.60, h: 0.62, label: 'Hero Block' },
      { id: 1, x: 0.60, y: 0, w: 0.40, h: 0.31, label: 'Top Stack 1' },
      { id: 2, x: 0.60, y: 0.31, w: 0.40, h: 0.31, label: 'Top Stack 2' },
      { id: 3, x: 0, y: 0.62, w: 0.35, h: 0.38, label: 'Bottom Left' },
      { id: 4, x: 0.35, y: 0.62, w: 0.65, h: 0.38, label: 'Bottom Wide' }
    ]
  },
  poster: {
    name: 'Poster Frame',
    panels: [
      { id: 0, x: 0, y: 0, w: 1.0, h: 1.0, label: 'Full Bleed Background' },
      { id: 1, x: 0.06, y: 0.42, w: 0.42, h: 0.50, label: 'Inset Card Left' },
      { id: 2, x: 0.52, y: 0.10, w: 0.42, h: 0.50, label: 'Inset Card Right' }
    ]
  }
};

/**
 * Returns panel index clicked on canvas
 */
export function getPanelAtPoint(canvas, clientX, clientY, layoutName = 'classic') {
  const rect = canvas.getBoundingClientRect();
  const nx = (clientX - rect.left) / rect.width;
  const ny = (clientY - rect.top) / rect.height;
  const layout = LAYOUTS[layoutName] || LAYOUTS.classic;

  // Search in reverse for inset cards in poster layout
  for (let i = layout.panels.length - 1; i >= 0; i--) {
    const p = layout.panels[i];
    if (nx >= p.x && nx <= p.x + p.w && ny >= p.y && ny <= p.y + p.h) {
      return i;
    }
  }
  return 0;
}

/**
 * Main draw cover function
 */
export function drawCover(canvas, options = {}) {
  const ctx = canvas.getContext('2d');
  const { width: w, height: h } = canvas;
  const {
    layout: layoutKey = 'classic',
    grade = 'sunset',
    panels = [],
    activePanelIndex = 0,
    showActiveHighlight = false,
    title = 'LEONIDA DREAMS',
    subtitle = 'THE LEONIDA CHRONICLES',
    letteringStyle = 'sunset',
    badgeStyle = 'vi',
    borderWidth = Math.max(8, Math.round(w * 0.009))
  } = options;

  const layout = LAYOUTS[layoutKey] || LAYOUTS.classic;

  // 1. Draw base canvas background
  ctx.fillStyle = '#07060c';
  ctx.fillRect(0, 0, w, h);

  // 2. Draw each panel
  layout.panels.forEach((p, index) => {
    const panelConfig = panels[index] || {};
    const img = panelConfig.image || options.defaultImage;
    const panX = panelConfig.panX || 0;
    const panY = panelConfig.panY || 0;
    const zoom = panelConfig.zoom || 1.0;

    const px = Math.round(p.x * w);
    const py = Math.round(p.y * h);
    const pw = Math.round(p.w * w);
    const ph = Math.round(p.h * h);

    ctx.save();
    // Inset panel slightly for comic border
    const halfBorder = borderWidth / 2;
    ctx.beginPath();
    ctx.rect(px + halfBorder, py + halfBorder, pw - borderWidth, ph - borderWidth);
    ctx.clip();

    // Fill panel background gradient if image is loading or absent
    const bgGrad = ctx.createLinearGradient(px, py, px, py + ph);
    bgGrad.addColorStop(0, '#1c102b');
    bgGrad.addColorStop(1, '#0b0716');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(px, py, pw, ph);

    if (img && img.naturalWidth) {
      // Calculate scaled image size covering the panel
      const imgAspect = img.naturalWidth / img.naturalHeight;
      const panelAspect = pw / ph;

      let drawW, drawH;
      if (imgAspect > panelAspect) {
        drawH = ph * zoom;
        drawW = drawH * imgAspect;
      } else {
        drawW = pw * zoom;
        drawH = drawW / imgAspect;
      }

      // Apply Pan offset
      const maxPanX = (drawW - pw) / 2;
      const maxPanY = (drawH - ph) / 2;
      const offsetX = px + (pw - drawW) / 2 + (panX * maxPanX);
      const offsetY = py + (ph - drawH) / 2 + (panY * maxPanY);

      ctx.drawImage(img, offsetX, offsetY, drawW, drawH);
    }

    // Panel comic contrast & vignette
    const vig = ctx.createRadialGradient(
      px + pw / 2, py + ph / 2, Math.min(pw, ph) * 0.2,
      px + pw / 2, py + ph / 2, Math.max(pw, ph) * 0.8
    );
    vig.addColorStop(0, 'rgba(0, 0, 0, 0)');
    vig.addColorStop(1, 'rgba(0, 0, 0, 0.45)');
    ctx.fillStyle = vig;
    ctx.fillRect(px, py, pw, ph);

    ctx.restore();
  });

  // 3. Draw Thick Comic Borders with Authentic Bevel
  ctx.save();
  ctx.lineWidth = borderWidth;
  ctx.strokeStyle = '#08070d';
  ctx.lineJoin = 'miter';

  // Outer canvas frame
  ctx.strokeRect(borderWidth / 2, borderWidth / 2, w - borderWidth, h - borderWidth);

  // Interior borders
  layout.panels.forEach((p, idx) => {
    const px = Math.round(p.x * w);
    const py = Math.round(p.y * h);
    const pw = Math.round(p.w * w);
    const ph = Math.round(p.h * h);

    // In poster layout, inset panels get a distinct elevated shadow card frame
    if (layoutKey === 'poster' && idx > 0) {
      ctx.save();
      ctx.shadowColor = 'rgba(0, 0, 0, 0.85)';
      ctx.shadowBlur = 18;
      ctx.shadowOffsetY = 8;
      ctx.lineWidth = borderWidth * 1.25;
      ctx.strokeStyle = '#07060b';
      ctx.strokeRect(px, py, pw, ph);
      ctx.restore();
    } else {
      ctx.strokeRect(px, py, pw, ph);
    }
  });
  ctx.restore();

  // 4. Color Grading Post-Processing Pass
  applyColorGrade(ctx, w, h, grade);

  // 5. Active Panel Highlight Indicator (for editor preview)
  if (showActiveHighlight && layout.panels[activePanelIndex]) {
    const ap = layout.panels[activePanelIndex];
    const apx = Math.round(ap.x * w);
    const apy = Math.round(ap.y * h);
    const apw = Math.round(ap.w * w);
    const aph = Math.round(ap.h * h);

    ctx.save();
    ctx.strokeStyle = '#00f0ff';
    ctx.lineWidth = Math.max(3, Math.round(borderWidth * 0.35));
    ctx.strokeRect(apx + borderWidth, apy + borderWidth, apw - borderWidth * 2, aph - borderWidth * 2);

    // Active corner tags
    ctx.fillStyle = '#00f0ff';
    const tagSize = Math.max(12, Math.round(w * 0.015));
    ctx.fillRect(apx + borderWidth, apy + borderWidth, tagSize, tagSize);
    ctx.restore();
  }

  // 6. Draw Badges & Stamps
  if (badgeStyle && badgeStyle !== 'none') {
    drawBadge(ctx, w, h, badgeStyle);
  }

  // 7. Draw Typography (Main Title & Subtitle)
  drawTypography(ctx, w, h, title, subtitle, letteringStyle);
}

/**
 * Color grading pass using canvas blend layers
 */
function applyColorGrade(ctx, w, h, grade) {
  ctx.save();
  if (grade === 'sunset') {
    // Sunset Boulevard: Golden warm highlights, hot magenta/purple midtones, indigo shadows
    const grad1 = ctx.createLinearGradient(0, 0, w, h);
    grad1.addColorStop(0, 'rgba(255, 120, 20, 0.28)');
    grad1.addColorStop(0.5, 'rgba(255, 30, 130, 0.25)');
    grad1.addColorStop(1, 'rgba(30, 0, 70, 0.40)');
    ctx.globalCompositeOperation = 'overlay';
    ctx.fillStyle = grad1;
    ctx.fillRect(0, 0, w, h);

    // Warm high-key punch
    const grad2 = ctx.createLinearGradient(0, h * 0.4, 0, h);
    grad2.addColorStop(0, 'rgba(255, 180, 0, 0)');
    grad2.addColorStop(1, 'rgba(255, 60, 100, 0.30)');
    ctx.globalCompositeOperation = 'screen';
    ctx.fillStyle = grad2;
    ctx.fillRect(0, 0, w, h);
  } else if (grade === 'neon') {
    // Neon Noir: Electric cyan & hot pink duo-tone punch
    const grad = ctx.createLinearGradient(0, 0, w, h);
    grad.addColorStop(0, 'rgba(0, 240, 255, 0.35)');
    grad.addColorStop(0.5, 'rgba(255, 0, 130, 0.30)');
    grad.addColorStop(1, 'rgba(10, 5, 35, 0.40)');
    ctx.globalCompositeOperation = 'screen';
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);

    // Deepen contrast with soft light
    ctx.globalCompositeOperation = 'overlay';
    const grad2 = ctx.createLinearGradient(0, h * 0.5, w, h);
    grad2.addColorStop(0, 'rgba(0, 240, 255, 0.2)');
    grad2.addColorStop(1, 'rgba(255, 0, 120, 0.35)');
    ctx.fillStyle = grad2;
    ctx.fillRect(0, 0, w, h);
  } else if (grade === 'golden') {
    // Golden Hour: Amber warmth, high dynamic range
    const grad = ctx.createLinearGradient(0, 0, 0, h);
    grad.addColorStop(0, 'rgba(255, 230, 120, 0.35)');
    grad.addColorStop(0.6, 'rgba(255, 140, 0, 0.30)');
    grad.addColorStop(1, 'rgba(80, 15, 0, 0.40)');
    ctx.globalCompositeOperation = 'overlay';
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);
  } else if (grade === 'vibrant') {
    // Vibrant Pop: High saturation & posterized vibrancy
    ctx.globalCompositeOperation = 'color-dodge';
    ctx.fillStyle = 'rgba(255, 60, 120, 0.15)';
    ctx.fillRect(0, 0, w, h);

    ctx.globalCompositeOperation = 'soft-light';
    const grad = ctx.createLinearGradient(0, 0, w, h);
    grad.addColorStop(0, '#ff0055');
    grad.addColorStop(1, '#00ffff');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);
  }
  ctx.restore();
}

/**
 * Original Vector Badges
 */
function drawBadge(ctx, w, h, style) {
  ctx.save();

  if (style === 'vi') {
    // Leonida "VI" Crest: Roman numeral VI shield emblem in top-left
    const badgeW = Math.round(w * 0.11);
    const badgeH = Math.round(badgeW * 1.15);
    const bx = Math.round(w * 0.04);
    const by = Math.round(h * 0.04);

    // Drop shadow
    ctx.shadowColor = 'rgba(0, 0, 0, 0.7)';
    ctx.shadowBlur = 12;
    ctx.shadowOffsetY = 6;

    // Shield shape
    ctx.beginPath();
    ctx.moveTo(bx, by);
    ctx.lineTo(bx + badgeW, by);
    ctx.lineTo(bx + badgeW, by + badgeH * 0.65);
    ctx.quadraticCurveTo(bx + badgeW * 0.5, by + badgeH * 1.05, bx, by + badgeH * 0.65);
    ctx.closePath();

    // Shield fill
    const shieldGrad = ctx.createLinearGradient(bx, by, bx, by + badgeH);
    shieldGrad.addColorStop(0, '#1c1538');
    shieldGrad.addColorStop(0.5, '#2e1240');
    shieldGrad.addColorStop(1, '#0f0a20');
    ctx.fillStyle = shieldGrad;
    ctx.fill();

    ctx.shadowColor = 'transparent';

    // Gold/Pink border
    ctx.lineWidth = Math.max(3, Math.round(badgeW * 0.035));
    const borderGrad = ctx.createLinearGradient(bx, by, bx + badgeW, by + badgeH);
    borderGrad.addColorStop(0, '#ffcc00');
    borderGrad.addColorStop(0.5, '#ff2a85');
    borderGrad.addColorStop(1, '#ff9900');
    ctx.strokeStyle = borderGrad;
    ctx.stroke();

    // Inner bevel line
    ctx.lineWidth = 1;
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
    ctx.stroke();

    // Roman numeral "VI"
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    // Decorative top stars
    const starY = by + badgeH * 0.18;
    ctx.fillStyle = '#ffcc00';
    [-badgeW * 0.22, 0, badgeW * 0.22].forEach((offset, sIdx) => {
      const starR = sIdx === 1 ? badgeW * 0.045 : badgeW * 0.035;
      ctx.beginPath();
      ctx.arc(bx + badgeW / 2 + offset, starY, starR, 0, Math.PI * 2);
      ctx.fill();
    });

    ctx.font = `bold ${Math.round(badgeH * 0.40)}px 'Oswald', sans-serif`;

    const viGrad = ctx.createLinearGradient(bx, by + badgeH * 0.2, bx, by + badgeH * 0.7);
    viGrad.addColorStop(0, '#ffffff');
    viGrad.addColorStop(0.45, '#ffcc00');
    viGrad.addColorStop(1, '#ff5500');

    ctx.fillStyle = viGrad;
    ctx.fillText('VI', bx + badgeW / 2, by + badgeH * 0.46);

    // Banner text: "LEONIDA"
    ctx.font = `bold ${Math.max(9, Math.round(badgeH * 0.12))}px 'Montserrat', sans-serif`;
    ctx.fillStyle = '#ffffff';
    ctx.letterSpacing = '1px';
    ctx.fillText('LEONIDA', bx + badgeW / 2, by + badgeH * 0.80);
  } else if (style === 'advisory') {
    // Parental Advisory: Leonida Explicit Content badge
    const badgeW = Math.round(w * 0.16);
    const badgeH = Math.round(badgeW * 0.62);
    const bx = Math.round(w * 0.04);
    const by = Math.round(h * 0.04);

    ctx.shadowColor = 'rgba(0, 0, 0, 0.7)';
    ctx.shadowBlur = 10;
    ctx.shadowOffsetY = 4;

    // White outer card
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(bx, by, badgeW, badgeH);
    ctx.shadowColor = 'transparent';

    // Black inner border
    const pad = Math.max(2, Math.round(badgeW * 0.02));
    ctx.fillStyle = '#08070d';
    ctx.fillRect(bx + pad, by + pad, badgeW - pad * 2, badgeH - pad * 2);

    // Header label
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = `700 ${Math.round(badgeH * 0.22)}px 'Oswald', sans-serif`;
    ctx.fillStyle = '#ffffff';
    ctx.fillText('PARENTAL', bx + badgeW / 2, by + badgeH * 0.26);

    ctx.font = `700 ${Math.round(badgeH * 0.28)}px 'Oswald', sans-serif`;
    ctx.fillText('ADVISORY', bx + badgeW / 2, by + badgeH * 0.54);

    // Footer subline
    ctx.font = `700 ${Math.max(7, Math.round(badgeH * 0.13))}px 'Montserrat', sans-serif`;
    ctx.fillStyle = '#ff2a85';
    ctx.fillText('LEONIDA EXPLICIT', bx + badgeW / 2, by + badgeH * 0.82);
  } else if (style === 'palm') {
    // Palm Coast Retro Sun Crest
    const radius = Math.round(w * 0.055);
    const cx = Math.round(w * 0.08);
    const cy = Math.round(h * 0.09);

    ctx.save();
    // Sun Disc
    const sunGrad = ctx.createLinearGradient(cx, cy - radius, cx, cy + radius);
    sunGrad.addColorStop(0, '#ffea00');
    sunGrad.addColorStop(0.5, '#ff2a85');
    sunGrad.addColorStop(1, '#7a0099');
    ctx.fillStyle = sunGrad;
    ctx.beginPath();
    ctx.arc(cx, cy, radius, 0, Math.PI * 2);
    ctx.fill();

    // Retro horizontal sun stripes
    ctx.fillStyle = '#08070d';
    const stripeCount = 4;
    for (let i = 0; i < stripeCount; i++) {
      const sy = cy + (i * radius * 0.22);
      const sh = Math.max(2, Math.round(radius * 0.06 * (i + 1)));
      ctx.fillRect(cx - radius, sy, radius * 2, sh);
    }

    // Outer ring
    ctx.lineWidth = 3;
    ctx.strokeStyle = '#00f0ff';
    ctx.beginPath();
    ctx.arc(cx, cy, radius, 0, Math.PI * 2);
    ctx.stroke();

    // Palm silhouette
    ctx.fillStyle = '#08070d';
    // Trunk
    ctx.beginPath();
    ctx.moveTo(cx - 3, cy + radius * 0.9);
    ctx.quadraticCurveTo(cx - 5, cy, cx - 1, cy - radius * 0.1);
    ctx.lineTo(cx + 3, cy - radius * 0.1);
    ctx.quadraticCurveTo(cx - 1, cy, cx + 3, cy + radius * 0.9);
    ctx.fill();

    // Fronds
    const drawFrond = (fx, fy, angle, length) => {
      ctx.save();
      ctx.translate(fx, fy);
      ctx.rotate(angle);
      ctx.beginPath();
      ctx.ellipse(0, 0, length, length * 0.25, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    };

    const fx = cx - 1;
    const fy = cy - radius * 0.1;
    const fl = radius * 0.55;
    drawFrond(fx, fy, -0.6, fl);
    drawFrond(fx, fy, -0.2, fl * 1.1);
    drawFrond(fx, fy, 0.4, fl);
    drawFrond(fx, fy, 0.8, fl * 0.9);
    drawFrond(fx, fy, -1.1, fl * 0.8);

    ctx.restore();
  }

  ctx.restore();
}

/**
 * Draws Bold Main Caption & Subtitle with Dynamic Spacing
 */
function drawTypography(ctx, w, h, titleText, subtitleText, styleKey) {
  const cleanTitle = (titleText || '').trim().toUpperCase();
  const cleanSub = (subtitleText || '').trim().toUpperCase();
  if (!cleanTitle && !cleanSub) return;

  ctx.save();

  // Dynamic font sizing
  let fontSize = Math.round(w * 0.092);
  ctx.font = `bold ${fontSize}px 'Oswald', sans-serif`;
  while (ctx.measureText(cleanTitle).width > w * 0.86 && fontSize > 20) {
    fontSize -= 2;
    ctx.font = `bold ${fontSize}px 'Oswald', sans-serif`;
  }

  const subSize = Math.max(12, Math.round(w * 0.023));
  const spacing = Math.round(fontSize * 0.58) + Math.round(subSize * 0.9);

  // Position nicely near bottom with bottom margin
  const subY = Math.round(h * 0.93);
  const titleY = cleanSub ? subY - spacing : Math.round(h * 0.90);

  if (cleanTitle) {
    ctx.font = `bold ${fontSize}px 'Oswald', sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    const strokeWidth = Math.max(8, Math.round(fontSize * 0.14));

    if (styleKey === 'sunset') {
      // Style 1: Vice Sunset Gradient fill with comic 3D extrusion
      // 3D Shadow Layers
      ctx.fillStyle = '#06040a';
      const shadowSteps = 6;
      for (let s = shadowSteps; s >= 1; s--) {
        ctx.fillText(cleanTitle, w / 2 + s * 2, titleY + s * 2);
      }

      // Outer dark comic stroke
      ctx.lineWidth = strokeWidth;
      ctx.strokeStyle = '#08070d';
      ctx.lineJoin = 'miter';
      ctx.miterLimit = 2;
      ctx.strokeText(cleanTitle, w / 2, titleY);

      // Sunset Gradient fill
      const textGrad = ctx.createLinearGradient(
        w / 2, titleY - fontSize * 0.5,
        w / 2, titleY + fontSize * 0.5
      );
      textGrad.addColorStop(0, '#ffffff');
      textGrad.addColorStop(0.3, '#ffea70');
      textGrad.addColorStop(0.65, '#ff2a85');
      textGrad.addColorStop(1, '#ff7a00');
      ctx.fillStyle = textGrad;
      ctx.fillText(cleanTitle, w / 2, titleY);

      // Fine inner top highlight stroke
      ctx.lineWidth = Math.max(1, Math.round(strokeWidth * 0.12));
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.7)';
      ctx.strokeText(cleanTitle, w / 2, titleY);

    } else if (styleKey === 'white') {
      // Style 2: Classic Bold White with thick comic stroke and black shadow
      ctx.fillStyle = '#08070d';
      for (let s = 8; s >= 1; s--) {
        ctx.fillText(cleanTitle, w / 2 + s * 2, titleY + s * 2);
      }

      ctx.lineWidth = strokeWidth * 1.1;
      ctx.strokeStyle = '#08070d';
      ctx.strokeText(cleanTitle, w / 2, titleY);

      ctx.fillStyle = '#ffffff';
      ctx.fillText(cleanTitle, w / 2, titleY);

    } else if (styleKey === 'neon') {
      // Style 3: Neon Cyan & Magenta with dual glow
      ctx.shadowColor = '#ff0077';
      ctx.shadowBlur = Math.round(fontSize * 0.35);
      ctx.lineWidth = strokeWidth;
      ctx.strokeStyle = '#ff0077';
      ctx.strokeText(cleanTitle, w / 2, titleY);

      ctx.shadowColor = '#00f0ff';
      ctx.shadowBlur = Math.round(fontSize * 0.2);
      ctx.fillStyle = '#ffffff';
      ctx.fillText(cleanTitle, w / 2, titleY);

      ctx.shadowColor = 'transparent';
    }
  }

  // Draw Subtitle / Tagline
  if (cleanSub) {
    ctx.font = `bold ${subSize}px 'Montserrat', sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    const subWidth = ctx.measureText(cleanSub).width;
    const padX = subSize * 1.25;
    const padY = subSize * 0.55;

    // Dark pill background for crisp readability
    ctx.fillStyle = 'rgba(8, 7, 13, 0.92)';
    ctx.fillRect(w / 2 - subWidth / 2 - padX, subY - padY, subWidth + padX * 2, padY * 2);

    // Pill border
    ctx.strokeStyle = '#ff2a85';
    ctx.lineWidth = 1.8;
    ctx.strokeRect(w / 2 - subWidth / 2 - padX, subY - padY, subWidth + padX * 2, padY * 2);

    // Subtitle text
    ctx.fillStyle = '#00f0ff';
    ctx.fillText(cleanSub, w / 2, subY);
  }

  ctx.restore();
}
