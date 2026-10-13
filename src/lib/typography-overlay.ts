import { ImageResponse } from 'next/og';
import React from 'react';
import sharp from 'sharp';
import { TrialPost, IdentityCard } from '@/types/database';

interface OverlayOptions {
  aspectRatio: '4:5' | '9:16';
  post: TrialPost;
  identity: IdentityCard;
  businessName: string;
  offering: string;
  logoUrl?: string;
}

/**
 * Composites bold, high-contrast editorial typography and brand elements over the generated background.
 * Uses Next.js native ImageResponse (WASM layout & font engine) for 100% reliable, cross-platform
 * font rendering without host OS font dependency issues on Vercel serverless containers.
 */
export async function compositeTypography(
  backgroundBuffer: Buffer,
  options: OverlayOptions
): Promise<Buffer> {
  const { aspectRatio, post, identity, businessName, offering, logoUrl } = options;
  const isStory = aspectRatio === '9:16';
  const width = 1080;
  const height = isStory ? 1920 : 1350;
  const accentColor = identity.palette?.accent || '#F5B301';
  const primaryColor = identity.palette?.primary || '#121316';
  const secondaryColor = identity.palette?.secondary || '#EAE6DF';
  const brandName = (businessName || 'CONTENTSMITH').toUpperCase();
  const pillarText = (post.pillar || 'FEATURED').toUpperCase();
  const headline = post.hook || offering;
  const caption = (post.caption || '').length > 170
    ? `${post.caption.slice(0, 167).trimEnd()}...`
    : post.caption || '';
  const ctaText = post.cta || 'Contact us to enquire';
  const photoBase64 = `data:image/jpeg;base64,${(await sharp(backgroundBuffer).jpeg({ quality: 94 }).toBuffer()).toString('base64')}`;
  const padding = isStory ? '82px 72px' : '68px';
  const headlineSize = headline.length > 54 ? (isStory ? 60 : 52) : headline.length > 32 ? (isStory ? 72 : 62) : (isStory ? 88 : 76);
  const photoLayout = ['product_hero_offset', 'split_panel', 'before_after'].includes(post.layoutArchetype);
  const image = (key: string, style: React.CSSProperties) => React.createElement('img', { key, src: photoBase64, style });
  const text = (key: string, value: string, style: React.CSSProperties) => React.createElement('div', { key, style }, value);
  const brandHeader = (color = primaryColor) => React.createElement('div', {
    key: 'brand-header',
    style: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '20px', color, width: '100%' }
  }, [
    React.createElement('div', {
      key: 'brand',
      style: { display: 'flex', alignItems: 'center', gap: '16px', fontSize: isStory ? '27px' : '24px', fontWeight: 800 }
    }, [
      logoUrl ? React.createElement('img', {
        key: 'logo', src: logoUrl,
        style: { width: '58px', height: '58px', objectFit: 'contain', backgroundColor: '#FFFFFF', padding: '4px', borderRadius: '8px' }
      }) : null,
      React.createElement('span', { key: 'name' }, brandName)
    ]),
    text('pillar', pillarText, {
      fontSize: isStory ? '20px' : '18px', fontWeight: 800, color: primaryColor,
      backgroundColor: accentColor, padding: '12px 18px', borderRadius: '4px'
    })
  ]);
  const ctaPanel = (dark = false) => React.createElement('div', {
    key: 'cta-panel',
    style: {
      display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '20px',
      backgroundColor: accentColor, color: primaryColor, padding: isStory ? '26px 30px' : '22px 28px',
      borderRadius: '4px', borderLeft: `10px solid ${dark ? secondaryColor : primaryColor}`
    }
  }, [
    text('cta', ctaText, { fontSize: isStory ? '28px' : '24px', fontWeight: 800, flex: 1 }),
    text('brand-cta', brandName, { fontSize: isStory ? '18px' : '16px', fontWeight: 700 })
  ]);
  const baseStyle: React.CSSProperties = {
    display: 'flex', flexDirection: 'column', width: '100%', height: '100%',
    padding, justifyContent: 'space-between', gap: isStory ? '42px' : '30px',
    fontFamily: 'sans-serif', color: primaryColor, backgroundColor: secondaryColor
  };
  let children: React.ReactNode[];

  if (post.layoutArchetype === 'product_hero_offset') {
    children = [
      image('photo', { position: 'absolute', top: 0, right: 0, bottom: 0, left: 0, width: '100%', height: '100%', objectFit: 'cover' }),
      React.createElement('div', { key: 'shade', style: { position: 'absolute', top: 0, right: 0, bottom: 0, left: 0, background: 'linear-gradient(180deg, rgba(0,0,0,0.2) 0%, rgba(0,0,0,0.05) 38%, rgba(0,0,0,0.8) 100%)' } }),
      brandHeader('#FFFFFF'),
      React.createElement('div', { key: 'copy', style: { display: 'flex', flexDirection: 'column', gap: '22px', marginTop: 'auto', color: '#FFFFFF' } }, [
        text('headline', headline, { fontSize: headlineSize, fontWeight: 900, lineHeight: 1.05, maxWidth: '900px' }),
        caption ? text('caption', caption, { fontSize: isStory ? '27px' : '24px', lineHeight: 1.35, maxWidth: '850px' }) : null,
        ctaPanel(true)
      ])
    ];
    baseStyle.position = 'relative';
    baseStyle.backgroundColor = primaryColor;
  } else if (post.layoutArchetype === 'split_panel') {
    children = [
      brandHeader(),
      image('photo', { width: '100%', height: `${Math.round(height * 0.49)}px`, objectFit: 'cover', borderRadius: '4px' }),
      React.createElement('div', { key: 'copy', style: { display: 'flex', flexDirection: 'column', gap: '20px' } }, [
        text('headline', headline, { fontSize: headlineSize, fontWeight: 900, lineHeight: 1.08 }),
        caption ? text('caption', caption, { fontSize: isStory ? '26px' : '23px', lineHeight: 1.4 }) : null,
        ctaPanel()
      ])
    ];
  } else if (post.layoutArchetype === 'before_after') {
    children = [
      brandHeader(),
      image('photo', { width: '100%', height: `${Math.round(height * 0.47)}px`, objectFit: 'cover', border: `8px solid ${primaryColor}` }),
      text('headline', headline, { fontSize: headlineSize, fontWeight: 900, lineHeight: 1.08 }),
      React.createElement('div', { key: 'bottom', style: { display: 'flex', flexDirection: 'column', gap: '20px' } }, [
        caption ? text('caption', caption, { fontSize: isStory ? '25px' : '22px', lineHeight: 1.4 }) : null,
        ctaPanel()
      ])
    ];
  } else if (post.layoutArchetype === 'price_menu_list') {
    const offeringItems = offering.split(/,|;|\band\b/i).map(item => item.trim()).filter(Boolean).slice(0, 5);
    children = [
      brandHeader(),
      React.createElement('div', { key: 'menu-heading', style: { display: 'flex', flexDirection: 'column', gap: '14px' } }, [
        text('eyebrow', 'WHAT WE OFFER', { fontSize: '19px', fontWeight: 800, color: primaryColor, backgroundColor: accentColor, padding: '10px 16px', alignSelf: 'flex-start' }),
        text('headline', headline, { fontSize: headlineSize, fontWeight: 900, lineHeight: 1.06 })
      ]),
      React.createElement('div', { key: 'offerings', style: { display: 'flex', flexDirection: 'column', gap: '14px' } }, offeringItems.map((item, index) =>
        React.createElement('div', { key: `offering-${index}`, style: { display: 'flex', alignItems: 'center', gap: '18px', borderBottom: `2px solid ${primaryColor}30`, padding: '12px 0', fontSize: isStory ? '27px' : '23px', fontWeight: 700 } }, [
          text('index', String(index + 1).padStart(2, '0'), { color: accentColor, fontSize: isStory ? '25px' : '22px', fontWeight: 900 }),
          text('item', item, { flex: 1 })
        ])
      )),
      caption ? text('caption', caption, { fontSize: isStory ? '24px' : '21px', lineHeight: 1.35 }) : null,
      ctaPanel()
    ];
  } else if (post.layoutArchetype === 'testimonial_card') {
    baseStyle.backgroundColor = primaryColor;
    baseStyle.color = secondaryColor;
    children = [
      brandHeader(secondaryColor),
      text('eyebrow', 'A NOTE TO OUR CUSTOMERS', { fontSize: '19px', fontWeight: 800, color: primaryColor, backgroundColor: accentColor, padding: '12px 16px', alignSelf: 'flex-start' }),
      React.createElement('div', { key: 'feedback', style: { display: 'flex', flexDirection: 'column', gap: '24px', borderLeft: `8px solid ${accentColor}`, paddingLeft: '32px' } }, [
        text('headline', headline, { fontSize: headlineSize, fontWeight: 900, lineHeight: 1.08, color: '#FFFFFF' }),
        caption ? text('caption', caption, { fontSize: isStory ? '27px' : '24px', lineHeight: 1.4, color: secondaryColor }) : null
      ]),
      ctaPanel(true)
    ];
  } else if (post.layoutArchetype === 'typographic_poster') {
    baseStyle.backgroundColor = primaryColor;
    baseStyle.color = '#FFFFFF';
    children = [
      brandHeader('#FFFFFF'),
      text('eyebrow', pillarText, { fontSize: isStory ? '23px' : '20px', fontWeight: 800, color: accentColor }),
      text('headline', headline, { fontSize: headlineSize + 8, fontWeight: 900, lineHeight: 1.02, color: '#FFFFFF', maxWidth: '900px' }),
      caption ? text('caption', caption, { fontSize: isStory ? '27px' : '24px', lineHeight: 1.4, color: secondaryColor }) : null,
      ctaPanel(true)
    ];
  } else if (post.layoutArchetype === 'announcement') {
    children = [
      brandHeader(),
      text('eyebrow', 'BUSINESS UPDATE', { fontSize: '19px', fontWeight: 800, color: primaryColor, backgroundColor: accentColor, padding: '10px 16px', alignSelf: 'flex-start' }),
      text('headline', headline, { fontSize: headlineSize, fontWeight: 900, lineHeight: 1.06, maxWidth: '900px' }),
      caption ? text('caption', caption, { fontSize: isStory ? '27px' : '24px', lineHeight: 1.4 }) : null,
      ctaPanel()
    ];
  } else {
    children = [
      brandHeader(),
      text('eyebrow', 'FOR YOU', { fontSize: '19px', fontWeight: 800, color: primaryColor, backgroundColor: accentColor, padding: '10px 16px', alignSelf: 'flex-start' }),
      text('headline', headline, { fontSize: headlineSize, fontWeight: 900, lineHeight: 1.06 }),
      caption ? text('caption', caption, { fontSize: isStory ? '27px' : '24px', lineHeight: 1.4 }) : null,
      ctaPanel()
    ];
  }

  if (photoLayout) baseStyle.position = 'relative';
  const element = React.createElement('div', { style: baseStyle }, children);
  const res = new ImageResponse(element, { width, height });
  const arrayBuf = await res.arrayBuffer();
  return Buffer.from(arrayBuf);
}
