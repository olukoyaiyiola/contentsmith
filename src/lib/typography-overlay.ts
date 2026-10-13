import { ImageResponse } from 'next/og';
import React from 'react';
import { TrialPost, IdentityCard } from '@/types/database';

interface OverlayOptions {
  aspectRatio: '4:5' | '9:16';
  post: TrialPost;
  identity: IdentityCard;
  businessName: string;
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
  const { aspectRatio, post, identity, businessName, logoUrl } = options;
  const isStory = aspectRatio === '9:16';
  const width = 1080;
  const height = isStory ? 1920 : 1350;

  const accentColor = identity.palette?.accent || '#F5B301';
  const primaryColor = identity.palette?.primary || '#121316';
  const brandName = (businessName || 'CONTENTSMITH').toUpperCase();
  const pillarText = (post.pillar || 'FEATURED').toUpperCase();
  const headline = post.hook || '';
  const caption = (post.caption || '').slice(0, 160) + ((post.caption || '').length > 160 ? '...' : '');
  const ctaText = post.cta || 'Order on WhatsApp';

  const photoBase64 = `data:image/jpeg;base64,${backgroundBuffer.toString('base64')}`;

  const element = React.createElement('div', {
    style: {
      display: 'flex',
      flexDirection: 'column',
      width: '100%',
      height: '100%',
      position: 'relative',
      backgroundColor: primaryColor,
      color: '#FFFFFF',
      fontFamily: 'sans-serif',
      padding: isStory ? '96px 72px' : '72px',
      justifyContent: 'space-between',
    }
  }, [
    // Background photo
    React.createElement('img', {
      key: 'bg-img',
      src: photoBase64,
      style: {
        position: 'absolute',
        top: 0,
        left: 0,
        width: `${width}px`,
        height: `${height}px`,
        objectFit: 'cover',
      }
    }),
    // High-contrast dual gradient scrim
    React.createElement('div', {
      key: 'bg-overlay',
      style: {
        position: 'absolute',
        top: 0,
        left: 0,
        width: `${width}px`,
        height: `${height}px`,
        background: isStory
          ? 'linear-gradient(180deg, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.2) 35%, rgba(0,0,0,0.88) 72%, rgba(0,0,0,0.98) 100%)'
          : 'linear-gradient(180deg, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.2) 35%, rgba(0,0,0,0.88) 75%, rgba(0,0,0,0.98) 100%)',
      }
    }),
    // Header row
    React.createElement('div', {
      key: 'header',
      style: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        width: '100%',
      }
    }, [
      React.createElement('div', {
        key: 'brand-pill',
        style: {
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          backgroundColor: 'rgba(18,19,22,0.85)',
          padding: logoUrl ? '10px 24px 10px 16px' : '14px 28px',
          borderRadius: '40px',
          border: '1.5px solid rgba(255,255,255,0.25)',
          fontSize: isStory ? '24px' : '22px',
          fontWeight: 700,
          letterSpacing: '1px',
          color: accentColor,
        }
      }, [
        logoUrl ? React.createElement('img', {
          key: 'brand-logo',
          src: logoUrl,
          style: {
            width: isStory ? '36px' : '32px',
            height: isStory ? '36px' : '32px',
            objectFit: 'contain',
            borderRadius: '50%',
            backgroundColor: '#FFFFFF',
            padding: '2px',
          }
        }) : null,
        React.createElement('span', { key: 'brand-name' }, brandName)
      ]),
      React.createElement('div', {
        key: 'pillar-badge',
        style: {
          display: 'flex',
          backgroundColor: accentColor,
          color: primaryColor,
          padding: '14px 28px',
          borderRadius: '12px',
          fontSize: isStory ? '22px' : '20px',
          fontWeight: 800,
          letterSpacing: '1.5px',
        }
      }, pillarText),
    ]),
    // Bottom Content block
    React.createElement('div', {
      key: 'bottom-content',
      style: {
        display: 'flex',
        flexDirection: 'column',
        gap: isStory ? '28px' : '20px',
        marginBottom: isStory ? '40px' : '0px',
      }
    }, [
      // Accent color dash
      React.createElement('div', {
        key: 'accent-bar',
        style: {
          width: '90px',
          height: '6px',
          backgroundColor: accentColor,
          borderRadius: '3px',
        }
      }),
      // Bold headline
      React.createElement('div', {
        key: 'headline',
        style: {
          fontSize: isStory ? '66px' : '58px',
          fontWeight: 800,
          lineHeight: 1.15,
          color: '#FFFFFF',
          textShadow: '0 4px 16px rgba(0,0,0,0.8)',
        }
      }, headline),
      // Explanatory caption / hook context
      caption ? React.createElement('div', {
        key: 'caption',
        style: {
          fontSize: isStory ? '28px' : '25px',
          lineHeight: 1.45,
          color: '#E0E0E0',
          maxWidth: '850px',
        }
      }, caption) : null,
      // Prominent Call-To-Action badge
      React.createElement('div', {
        key: 'cta-box',
        style: {
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          backgroundColor: accentColor,
          color: primaryColor,
          padding: '24px 36px',
          borderRadius: '20px',
          marginTop: '12px',
          boxShadow: '0 8px 30px rgba(0,0,0,0.5)',
        }
      }, [
        React.createElement('div', {
          key: 'cta-text-wrapper',
          style: {
            display: 'flex',
            flexDirection: 'column',
          }
        }, [
          React.createElement('span', {
            key: 'cta-action',
            style: { fontSize: '26px', fontWeight: 800 }
          }, ctaText),
          React.createElement('span', {
            key: 'cta-brand',
            style: { fontSize: '20px', fontWeight: 600, opacity: 0.85 }
          }, brandName)
        ]),
        React.createElement('div', {
          key: 'cta-arrow',
          style: {
            fontSize: '36px',
            fontWeight: 800,
          }
        }, '→')
      ])
    ])
  ]);

  const res = new ImageResponse(element, { width, height });
  const arrayBuf = await res.arrayBuffer();
  return Buffer.from(arrayBuf);
}
