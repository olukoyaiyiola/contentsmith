import sharp from 'sharp';
import { TrialPost, IdentityCard } from '@/types/database';

interface OverlayOptions {
  aspectRatio: '4:5' | '9:16';
  post: TrialPost;
  identity: IdentityCard;
  businessName: string;
}

function escapeXml(unsafe: string): string {
  return String(unsafe || '').replace(/[<>&'"]/g, (c) => {
    switch (c) {
      case '<': return '&lt;';
      case '>': return '&gt;';
      case '&': return '&amp;';
      case '\'': return '&apos;';
      case '"': return '&quot;';
      default: return c;
    }
  });
}

function wrapText(text: string, maxChars: number = 22): string[] {
  const words = (text || '').split(' ');
  const lines: string[] = [];
  let cur = '';
  for (const w of words) {
    if ((cur + ' ' + w).trim().length <= maxChars) {
      cur = (cur + ' ' + w).trim();
    } else {
      if (cur) lines.push(cur);
      cur = w;
    }
  }
  if (cur) lines.push(cur);
  return lines;
}

/**
 * Composites bold, highly legible social media typography over the flyer background.
 * Uses rock-solid absolute positioning and system fonts for 100% reliability in serverless environments.
 */
export async function compositeTypography(
  backgroundBuffer: Buffer,
  options: OverlayOptions
): Promise<Buffer> {
  const { aspectRatio, post, identity, businessName } = options;
  const isStory = aspectRatio === '9:16';
  const width = 1080;
  const height = isStory ? 1920 : 1350;

  const primaryColor = identity.palette?.primary || '#121316';
  const secondaryColor = identity.palette?.secondary || '#EAE6DF';
  const accentColor = identity.palette?.accent || '#F5B301';

  // Format texts
  const headlineLines = wrapText(post.hook, isStory ? 18 : 22);
  const captionSummary = (post.caption || '').slice(0, 150) + ((post.caption || '').length > 150 ? '...' : '');
  const subtextLines = wrapText(captionSummary, isStory ? 28 : 34);

  // Absolute line heights
  const headlineFontSize = isStory ? 70 : 64;
  const headlineLineHeight = isStory ? 84 : 76;
  const subtextFontSize = isStory ? 32 : 28;
  const subtextLineHeight = isStory ? 44 : 38;

  // Compute vertical positions
  const headerTop = isStory ? 160 : 80;
  const contentBottom = isStory ? (height - 340) : (height - 210);
  
  const subtextBlockHeight = subtextLines.length * subtextLineHeight;
  const headlineBlockHeight = headlineLines.length * headlineLineHeight;
  const totalTextBlockHeight = headlineBlockHeight + 30 + subtextBlockHeight;
  
  const headlineStartY = contentBottom - totalTextBlockHeight;

  // Build separate SVG text elements (no relative dy stacks that collapse in librsvg)
  const headlineSvgLines = headlineLines
    .map((line, idx) => `<text x="80" y="${headlineStartY + (idx * headlineLineHeight)}" font-family="Arial, Helvetica, sans-serif" font-size="${headlineFontSize}" font-weight="900" fill="#FFFFFF" filter="url(#textShadow)">${escapeXml(line)}</text>`)
    .join('\n');

  const subtextStartY = headlineStartY + headlineBlockHeight + 20;
  const subtextSvgLines = subtextLines
    .map((line, idx) => `<text x="80" y="${subtextStartY + (idx * subtextLineHeight)}" font-family="Arial, Helvetica, sans-serif" font-size="${subtextFontSize}" font-weight="500" fill="#EAE6DF" filter="url(#textShadow)">${escapeXml(line)}</text>`)
    .join('\n');

  const ctaBoxY = isStory ? (height - 260) : (height - 170);
  const ctaBoxHeight = 88;
  const ctaText = post.cta || 'Order on WhatsApp';

  const overlaySvg = `
    <svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="topScrim" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="#000000" stop-opacity="0.88" />
          <stop offset="45%" stop-color="#000000" stop-opacity="0.55" />
          <stop offset="100%" stop-color="#000000" stop-opacity="0" />
        </linearGradient>
        <linearGradient id="bottomScrim" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="#000000" stop-opacity="0" />
          <stop offset="30%" stop-color="#000000" stop-opacity="0.80" />
          <stop offset="100%" stop-color="#000000" stop-opacity="0.97" />
        </linearGradient>
        <filter id="textShadow" x="-10%" y="-10%" width="120%" height="120%">
          <feDropShadow dx="0" dy="4" stdDeviation="6" flood-color="#000000" flood-opacity="0.75" />
        </filter>
        <filter id="boxShadow" x="-10%" y="-10%" width="120%" height="120%">
          <feDropShadow dx="0" dy="6" stdDeviation="10" flood-color="#000000" flood-opacity="0.5" />
        </filter>
      </defs>

      <!-- Contrast Scrims -->
      <rect x="0" y="0" width="${width}" height="${isStory ? 480 : 360}" fill="url(#topScrim)" />
      <rect x="0" y="${isStory ? 600 : 420}" width="${width}" height="${height - (isStory ? 600 : 420)}" fill="url(#bottomScrim)" />

      <!-- Business Name Header Tag -->
      <g transform="translate(80, ${headerTop})">
        <rect x="0" y="0" width="${Math.max(200, (businessName || '').length * 18 + 44)}" height="52" rx="10" fill="#121316" fill-opacity="0.90" stroke="#FFFFFF" stroke-opacity="0.25" stroke-width="1.5" />
        <text x="22" y="34" font-family="Arial, Helvetica, sans-serif" font-size="22" font-weight="bold" fill="#FFFFFF" letter-spacing="1.5">${escapeXml((businessName || 'CONTENTSMITH').toUpperCase())}</text>
      </g>

      <!-- Day & Archetype Badge (Top Right) -->
      <g transform="translate(${width - 340}, ${headerTop})">
        <rect x="0" y="0" width="260" height="52" rx="10" fill="${escapeXml(accentColor)}" filter="url(#boxShadow)" />
        <text x="130" y="34" font-family="Arial, Helvetica, sans-serif" font-size="20" font-weight="900" fill="#121316" text-anchor="middle" letter-spacing="1">DAY ${post.dayIndex} • ${(post.dayName || 'POST').toUpperCase()}</text>
      </g>

      <!-- Pillar Chip -->
      <g transform="translate(80, ${headerTop + 76})">
        <rect x="0" y="0" width="${Math.max(160, (post.pillar || '').length * 15 + 34)}" height="40" rx="8" fill="${escapeXml(accentColor)}" />
        <text x="18" y="27" font-family="Arial, Helvetica, sans-serif" font-size="18" font-weight="900" fill="#121316" letter-spacing="1.2">${escapeXml((post.pillar || 'FEATURE').toUpperCase())}</text>
      </g>

      <!-- Accent Divider Line -->
      <line x1="80" y1="${headlineStartY - 30}" x2="220" y2="${headlineStartY - 30}" stroke="${escapeXml(accentColor)}" stroke-width="6" stroke-linecap="round" />

      <!-- Punchy Headline Lines -->
      ${headlineSvgLines}

      <!-- Context Subtext Lines -->
      ${subtextSvgLines}

      <!-- Prominent WhatsApp Action Bar -->
      <g transform="translate(80, ${ctaBoxY})">
        <rect x="0" y="0" width="${width - 160}" height="${ctaBoxHeight}" rx="16" fill="${escapeXml(accentColor)}" filter="url(#boxShadow)" />
        <circle cx="55" cy="${ctaBoxHeight / 2}" r="24" fill="#121316" />
        <text x="55" y="${ctaBoxHeight / 2 + 8}" font-family="Arial, Helvetica, sans-serif" font-size="24" font-weight="bold" fill="${escapeXml(accentColor)}" text-anchor="middle">💬</text>
        <text x="100" y="${ctaBoxHeight / 2 - 2}" font-family="Arial, Helvetica, sans-serif" font-size="25" font-weight="900" fill="#121316">${escapeXml(ctaText)}</text>
        <text x="100" y="${ctaBoxHeight / 2 + 22}" font-family="Arial, Helvetica, sans-serif" font-size="17" font-weight="bold" fill="#3D3A30">Fast response • Tap to chat on WhatsApp</text>
        <text x="${width - 215}" y="${ctaBoxHeight / 2 + 8}" font-family="Arial, Helvetica, sans-serif" font-size="34" font-weight="900" fill="#121316">→</text>
      </g>
    </svg>
  `;

  // Composite background with SVG typography overlay using Sharp
  const resizedBg = await sharp(backgroundBuffer)
    .resize(width, height, { fit: 'cover', position: 'center' })
    .toBuffer();

  const finalComposite = await sharp(resizedBg)
    .composite([
      {
        input: Buffer.from(overlaySvg),
        top: 0,
        left: 0,
      },
    ])
    .jpeg({ quality: 92 })
    .toBuffer();

  return finalComposite;
}
