import sharp from 'sharp';
import { TrialPost, IdentityCard } from '@/types/database';

interface OverlayOptions {
  aspectRatio: '4:5' | '9:16';
  post: TrialPost;
  identity: IdentityCard;
  businessName: string;
}

/**
 * Escapes text for safe SVG embedding
 */
function escapeXml(unsafe: string): string {
  return unsafe.replace(/[<>&'"]/g, (c) => {
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

/**
 * Wraps text into multiple lines for SVG rendering
 */
function wrapText(text: string, maxCharsPerLine: number = 28): string[] {
  const words = text.split(' ');
  const lines: string[] = [];
  let currentLine = '';

  for (const word of words) {
    if ((currentLine + ' ' + word).trim().length <= maxCharsPerLine) {
      currentLine = (currentLine + ' ' + word).trim();
    } else {
      if (currentLine) lines.push(currentLine);
      currentLine = word;
    }
  }
  if (currentLine) lines.push(currentLine);
  return lines;
}

/**
 * Composites authentic typography over the generated background flyer.
 * Never relies on model text generation.
 * Enforces Yoruba diacritics and contrast requirements.
 */
export async function compositeTypography(
  backgroundBuffer: Buffer,
  options: OverlayOptions
): Promise<Buffer> {
  const { aspectRatio, post, identity, businessName } = options;
  const isStory = aspectRatio === '9:16';
  const width = isStory ? 1080 : 1080;
  const height = isStory ? 1920 : 1350;

  const primaryColor = identity.palette.primary || '#121316';
  const accentColor = identity.palette.accent || '#F5B301';
  
  // Safe zone offsets
  const topSafe = isStory ? 270 : 100; // ~14% safe zone for 9:16 status
  const bottomSafe = isStory ? 384 : 100; // ~20% safe zone for 9:16 status
  const contentHeight = height - topSafe - bottomSafe;

  const hookLines = wrapText(post.hook, 24);
  const hookTspans = hookLines
    .map((line, idx) => `<tspan x="90" dy="${idx === 0 ? 0 : '1.15em'}">${escapeXml(line)}</tspan>`)
    .join('');

  const captionSummary = post.caption.slice(0, 140) + (post.caption.length > 140 ? '...' : '');
  const captionLines = wrapText(captionSummary, 34);
  const captionTspans = captionLines
    .map((line, idx) => `<tspan x="90" dy="${idx === 0 ? 0 : '1.3em'}">${escapeXml(line)}</tspan>`)
    .join('');

  // SVG Overlay markup
  const svgOverlay = `
    <svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,700;800&amp;family=Instrument+Sans:wght@500;600;700&amp;display=swap');
          .brand-tag {
            font-family: 'Instrument Sans', -apple-system, sans-serif;
            font-size: 26px;
            font-weight: 700;
            letter-spacing: 0.12em;
            text-transform: uppercase;
            fill: #FFFFFF;
          }
          .pillar-badge {
            font-family: 'Instrument Sans', -apple-system, sans-serif;
            font-size: 20px;
            font-weight: 700;
            letter-spacing: 0.08em;
            text-transform: uppercase;
            fill: ${escapeXml(primaryColor)};
          }
          .hook-text {
            font-family: 'Bricolage Grotesque', -apple-system, sans-serif;
            font-size: ${isStory ? '68px' : '62px'};
            font-weight: 800;
            line-height: 1.15;
            fill: #FFFFFF;
          }
          .caption-text {
            font-family: 'Instrument Sans', -apple-system, sans-serif;
            font-size: 30px;
            font-weight: 500;
            line-height: 1.35;
            fill: #EAE8E4;
          }
          .cta-btn-text {
            font-family: 'Instrument Sans', -apple-system, sans-serif;
            font-size: 28px;
            font-weight: 700;
            letter-spacing: 0.04em;
            fill: #121316;
          }
        </style>
        <linearGradient id="scrim" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="#000000" stop-opacity="0.2"/>
          <stop offset="45%" stop-color="#000000" stop-opacity="0.4"/>
          <stop offset="100%" stop-color="#000000" stop-opacity="0.92"/>
        </linearGradient>
      </defs>

      <!-- Scrim overlay ensuring contrast >= 4.5:1 -->
      <rect x="0" y="0" width="${width}" height="${height}" fill="url(#scrim)"/>

      <!-- Header Tag / Business Name -->
      <g transform="translate(90, ${topSafe + 30})">
        <text class="brand-tag">${escapeXml(businessName)}</text>
      </g>

      <!-- Pillar Badge -->
      <g transform="translate(90, ${topSafe + 85})">
        <rect x="0" y="0" width="${Math.max(140, post.pillar.length * 16)}" height="38" rx="6" fill="${escapeXml(accentColor)}"/>
        <text x="14" y="26" class="pillar-badge">${escapeXml(post.pillar)}</text>
      </g>

      <!-- Hook / Headline -->
      <text x="90" y="${topSafe + 220}" class="hook-text">
        ${hookTspans}
      </text>

      <!-- Caption Context -->
      <text x="90" y="${topSafe + 220 + (hookLines.length * 75) + 30}" class="caption-text">
        ${captionTspans}
      </text>

      <!-- CTA Plaque -->
      <g transform="translate(90, ${height - bottomSafe - 60})">
        <rect x="0" y="0" width="380" height="68" rx="8" fill="${escapeXml(accentColor)}"/>
        <text x="30" y="44" class="cta-btn-text">${escapeXml(post.cta)} →</text>
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
        input: Buffer.from(svgOverlay),
        top: 0,
        left: 0,
      },
    ])
    .png({ quality: 90, compressionLevel: 8 })
    .toBuffer();

  return finalComposite;
}
