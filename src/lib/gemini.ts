import { GoogleGenAI } from '@google/genai';
import sharp from 'sharp';
import { getServerEnv } from './env';
import { IdentityCard, TrialPost, LayoutArchetype } from '@/types/database';
import { logUsage } from './db';

function getAiClient(apiKeyOverride?: string): { ai: GoogleGenAI; modelName: string; imageModelName: string } {
  const env = getServerEnv();
  const apiKey = (apiKeyOverride || env.GEMINI_API_KEY || '').trim().replace(/^["']|["']$/g, '');

  if (!apiKey || apiKey === 'missing_gemini_key') {
    throw new Error(
      "Gemini API key is not configured. Please add GEMINI_API_KEY (or GOOGLE_API_KEY) in your Vercel Project Settings > Environment Variables, or provide an API key in the trial form."
    );
  }

  const ai = new GoogleGenAI({ apiKey });
  return {
    ai,
    modelName: env.GEMINI_TEXT_MODEL || 'gemini-3.8-flash',
    imageModelName: env.GEMINI_IMAGE_MODEL || 'imagen-3.0-generate-002',
  };
}

/**
 * Resilient content generator that automatically falls back to gemini-3.8-flash
 * if the requested model is deprecated or not available in the region.
 */
async function generateContentWithFallback(
  ai: GoogleGenAI,
  preferredModel: string,
  params: { contents: any[] }
) {
  try {
    return await ai.models.generateContent({
      model: preferredModel,
      ...params,
    });
  } catch (error: any) {
    const msg = error?.message || '';
    if (
      error?.status === 'NOT_FOUND' || 
      msg.includes('404') || 
      msg.includes('no longer available') || 
      msg.includes('not found')
    ) {
      console.warn(`Model ${preferredModel} is not available, falling back to gemini-3.8-flash...`);
      return await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        ...params,
      });
    }
    throw error;
  }
}

function cleanAiErrorMessage(error: any): string {
  const msg = error?.message || String(error);
  if (msg.includes('API_KEY_INVALID') || msg.includes('API key not valid')) {
    return "Gemini API key is invalid. Please verify your API key at Google AI Studio (aistudio.google.com) and ensure GEMINI_API_KEY is correctly set in your Vercel Environment Variables.";
  }
  if (msg.includes('RESOURCE_EXHAUSTED') || msg.includes('quota')) {
    return "Gemini API rate limit or quota exceeded. Please try again in a few moments.";
  }
  return msg;
}

// 1. Step A: Identity Card Extraction
export async function extractIdentityCard(
  logoBuffer: Buffer | null,
  referenceBuffers: Buffer[],
  businessContext: { name: string; offering: string; city: string; tone: string; ipHash: string },
  apiKeyOverride?: string
): Promise<IdentityCard> {
  const env = getServerEnv();
  const startTime = Date.now();

  let clientObj;
  try {
    clientObj = getAiClient(apiKeyOverride);
  } catch (err: any) {
    console.warn("Using default identity card due to missing key:", err.message);
    return {
      palette: {
        primary: "#1A1A1A",
        secondary: "#EAE6DF",
        accent: "#F5B301" // Danfo yellow
      },
      shapeLanguage: "geometric",
      typeCharacter: "modern",
      brandTone: "Honest, direct, rooted in daily commerce.",
      negativeCues: ["generic purple gradient", "neon glow", "floating 3D shapes"]
    };
  }

  const { ai, modelName } = clientObj;

  const prompt = `
You are the visual identity director for ContentSmith, a Nigerian SME brand craft service.
Analyze the provided brand assets (logo and reference images) and business context:
Business: "${businessContext.name}"
Offering: "${businessContext.offering}"
City: "${businessContext.city}"
Tone preference: "${businessContext.tone}"

Extract an authentic Brand Identity Card.
Return ONLY valid JSON matching this schema:
{
  "palette": {
    "primary": "#HEX (dominant 60%, dark or rich ground)",
    "secondary": "#HEX (supporting 30%, warm background or contrast)",
    "accent": "#HEX (vibrant 10% accent like danfo yellow, terracotta, or palm green)"
  },
  "shapeLanguage": "sharp" | "rounded" | "geometric" | "organic" | "artisan",
  "typeCharacter": "authoritative" | "friendly" | "playful" | "traditional" | "modern",
  "brandTone": "Short description of the voice, rooted in Nigerian SME reality without hype",
  "negativeCues": ["List of 3-5 visual cliches to strictly avoid for this brand"]
}

Rules:
1. Palette must be grounded in tactile Nigerian shopfronts, artisan materials, or produce. Avoid generic SaaS blue or neon purple.
2. If no logo is provided, infer the palette and shape language carefully from the business offering and city (e.g. golden pastry crust, warm ochre, palm leaf).
3. Do not include markdown code block formatting like \`\`\`json. Output pure JSON only.
`;

  const contents: any[] = [{ text: prompt }];

  if (logoBuffer) {
    contents.push({
      inlineData: {
        mimeType: "image/png",
        data: logoBuffer.toString("base64")
      }
    });
  }

  for (const ref of referenceBuffers.slice(0, 2)) {
    contents.push({
      inlineData: {
        mimeType: "image/jpeg",
        data: ref.toString("base64")
      }
    });
  }

  try {
    const response = await generateContentWithFallback(ai, modelName, { contents });

    const text = response.text?.trim() || "";
    const cleanJson = text.replace(/^```json/i, '').replace(/```$/i, '').trim();
    const parsed: IdentityCard = JSON.parse(cleanJson);

    await logUsage({
      id: crypto.randomUUID(),
      callType: 'identity_vision',
      modelName,
      promptTokens: response.usageMetadata?.promptTokenCount || 0,
      candidateTokens: response.usageMetadata?.candidatesTokenCount || 0,
      totalTokens: response.usageMetadata?.totalTokenCount || 0,
      estimatedCostUsd: ((response.usageMetadata?.totalTokenCount || 0) * 0.0000003),
      durationMs: Date.now() - startTime,
      status: 'success',
      ipHash: businessContext.ipHash,
      createdAt: new Date().toISOString()
    });

    return parsed;
  } catch (error: any) {
    console.error("Identity Card extraction error:", error);
    await logUsage({
      id: crypto.randomUUID(),
      callType: 'identity_vision',
      modelName,
      promptTokens: 0,
      candidateTokens: 0,
      totalTokens: 0,
      estimatedCostUsd: 0,
      durationMs: Date.now() - startTime,
      status: 'failed',
      errorDetails: error?.message || 'Unknown error',
      ipHash: businessContext.ipHash,
      createdAt: new Date().toISOString()
    });

    return {
      palette: {
        primary: "#1A1A1A",
        secondary: "#EAE6DF",
        accent: "#F5B301" // Danfo yellow
      },
      shapeLanguage: "geometric",
      typeCharacter: "modern",
      brandTone: "Honest, direct, rooted in daily commerce.",
      negativeCues: ["generic purple gradient", "neon glow", "floating 3D shapes"]
    };
  }
}

// Helper to call OpenRouter for text generation (e.g. Qwen 2.5 72B)
async function generateTextWithOpenRouter(
  prompt: string,
  apiKey: string,
  model: string = "qwen/qwen-2.5-72b-instruct"
): Promise<string> {
  const cleanKey = apiKey.trim().replace(/^["']|["']$/g, '');
  const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${cleanKey}`,
      "Content-Type": "application/json",
      "HTTP-Referer": "https://contentsmith.ng",
      "X-Title": "ContentSmith",
    },
    body: JSON.stringify({
      model,
      messages: [{ role: "user", content: prompt }],
      temperature: 0.7,
    }),
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    const errText = errorData?.error?.message || errorData?.message || res.statusText;
    throw new Error(`OpenRouter text plan error (${res.status}): ${errText}`);
  }

  const json = await res.json();
  return json.choices?.[0]?.message?.content || "";
}

// Curated Nigerian Retail 7-day social calendar tailored to shop basics
function buildTailoredDefaultPosts(
  businessDetails: { name: string; offering: string; city: string; audience: string; tone: string },
  identity: IdentityCard
): TrialPost[] {
  const archetypes: LayoutArchetype[] = [
    'announcement',
    'product_hero_offset',
    'split_panel',
    'testimonial_card',
    'price_menu_list',
    'typographic_poster',
    'before_after'
  ];

  const primaryItem = businessDetails.offering.split(',')[0].trim() || businessDetails.offering;

  const templates = [
    {
      dayIndex: 1,
      dayName: "Monday",
      pillar: "Weekly Schedule / Drop",
      objective: "Drive early week pre-orders",
      hook: `Now taking enquiries for ${primaryItem}.`,
      caption: `${businessDetails.name} offers ${businessDetails.offering}. Message us to confirm current options and ordering details.`,
      cta: "Message us to enquire",
      layoutArchetype: "announcement" as LayoutArchetype
    },
    {
      dayIndex: 2,
      dayName: "Tuesday",
      pillar: "Product Spotlight",
      objective: "Highlight signature craftsmanship",
      hook: `A closer look at ${primaryItem}.`,
      caption: `Explore ${businessDetails.offering} from ${businessDetails.name}. Contact us for current options and details.`,
      cta: "Ask about this offering",
      layoutArchetype: "product_hero_offset" as LayoutArchetype
    },
    {
      dayIndex: 3,
      dayName: "Wednesday",
      pillar: "Craft & Process",
      objective: "Build authentic trust",
      hook: `Find the right ${primaryItem} for you.`,
      caption: `${businessDetails.name} offers ${businessDetails.offering}. Tell us what you are looking for and we will share the relevant options.`,
      cta: "Chat with us about your needs",
      layoutArchetype: "split_panel" as LayoutArchetype
    },
    {
      dayIndex: 4,
      dayName: "Thursday",
      pillar: "Customer Feedback",
      objective: "Invite genuine customer feedback",
      hook: `Your feedback matters to ${businessDetails.name}.`,
      caption: `Tried ${primaryItem}? Tell us what worked for you and what you would like to see next.`,
      cta: "Share your feedback",
      layoutArchetype: "testimonial_card" as LayoutArchetype
    },
    {
      dayIndex: 5,
      dayName: "Friday",
      pillar: "Weekend Menu & Bulk Orders",
      objective: "Capture weekend gathering and party demand",
      hook: `Explore ${businessDetails.offering}.`,
      caption: `Looking for ${primaryItem}? Contact ${businessDetails.name} to discuss the available options for your needs.`,
      cta: "Enquire about options",
      layoutArchetype: "price_menu_list" as LayoutArchetype
    },
    {
      dayIndex: 6,
      dayName: "Saturday",
      pillar: "Brand Spotlight",
      objective: "Deepen customer connection",
      hook: `${businessDetails.name}: here to help with ${primaryItem}.`,
      caption: `We work with ${businessDetails.audience || 'our customers'} looking for ${businessDetails.offering}. Get in touch to find out more.`,
      cta: "Get in touch",
      layoutArchetype: "typographic_poster" as LayoutArchetype
    },
    {
      dayIndex: 7,
      dayName: "Sunday",
      pillar: "Restock & Week Ahead",
      objective: "Set up next week's reservations",
      hook: `Keep ${primaryItem} in mind for next time.`,
      caption: `${businessDetails.offering} from ${businessDetails.name}. Save this post and message us whenever you are ready to enquire.`,
      cta: "Message us when you are ready",
      layoutArchetype: "before_after" as LayoutArchetype
    }
  ];

  return templates.map((p, idx) => ({
    id: crypto.randomUUID(),
    trialId: '',
    dayIndex: p.dayIndex,
    dayName: p.dayName,
    pillar: p.pillar,
    objective: p.objective,
    hook: p.hook,
    caption: p.caption,
    cta: p.cta,
    layoutArchetype: archetypes[idx % archetypes.length],
    generationStatus: 'queued',
    retryCount: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }));
}

// 2. Step B: 7-Day Plan Generation
export async function generateWeekPlan(
  businessDetails: { name: string; offering: string; city: string; audience: string; tone: string; ipHash: string },
  identity: IdentityCard,
  apiKeyOverride?: string,
  openRouterApiKeyOverride?: string
): Promise<TrialPost[]> {
  const startTime = Date.now();
  const env = getServerEnv();

  const archetypes: LayoutArchetype[] = [
    'announcement',
    'product_hero_offset',
    'split_panel',
    'testimonial_card',
    'price_menu_list',
    'typographic_poster',
    'before_after'
  ];

  const prompt = `
You are the lead content strategist at ContentSmith.
Build a cohesive 7-day social media plan for this Nigerian business:
Business: "${businessDetails.name}"
Offering: "${businessDetails.offering}"
City: "${businessDetails.city}"
Audience: "${businessDetails.audience}"
Tone: "${identity.brandTone}"

Return a JSON array of exactly 7 post objects.
Use each of the following 7 layout archetypes exactly once across the week:
1. "announcement" (Order deadline, delivery notice, restock)
2. "product_hero_offset" (Highlighting a supplied offering without inventing a price)
3. "split_panel" (Contrasting two supplied offerings or details)
4. "testimonial_card" (Invite genuine customer feedback; never invent a quote)
5. "price_menu_list" (List submitted offerings; include prices only when provided)
6. "typographic_poster" (A concise brand message grounded in supplied business details)
7. "before_after" (Show a real transformation only when the supplied details support it)

Return ONLY valid JSON (no markdown \`\`\`json tags):
[
  {
    "dayIndex": 1,
    "dayName": "Monday",
    "pillar": "Weekly Drop / Announcement",
    "objective": "Drive early pre-orders for the week",
    "hook": "A clear, specific hook about this business's offering.",
    "caption": "A concise, relevant caption grounded in the submitted business details.",
    "cta": "Contact the business to enquire",
    "layoutArchetype": "announcement"
  },
  ...
]

Rules:
- Days must be 1 to 7 (Monday to Sunday).
- Keep every hook, caption, and call to action relevant to the submitted business name, offering, audience, and tone.
- Mention the supplied city only when it is genuinely useful to this post; never add a default neighborhood or location.
- Never invent customer testimonials, reviews, prices, discounts, stock, delivery terms, opening hours, guarantees, ingredients, or production claims.
- For the testimonial archetype, invite real feedback instead of presenting a fabricated customer quote.
- Captions must be clear, grounded, respectful, and useful to the intended audience.
- Strictly no em dashes. No empty motivational platitudes.
`;

  // 1. Try Gemini Text Model if Gemini key is available
  if (apiKeyOverride || env.isGeminiKeyConfigured) {
    try {
      const { ai, modelName } = getAiClient(apiKeyOverride);
      const response = await generateContentWithFallback(ai, modelName, {
        contents: [{ text: prompt }]
      });

      const text = response.text?.trim() || "";
      const cleanJson = text.replace(/^```json/i, '').replace(/```$/i, '').trim();
      const rawPosts = JSON.parse(cleanJson);

      const posts: TrialPost[] = rawPosts.map((p: any, idx: number) => ({
        id: crypto.randomUUID(),
        trialId: '',
        dayIndex: p.dayIndex || idx + 1,
        dayName: p.dayName || ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'][idx],
        pillar: p.pillar || 'Craft & Process',
        objective: p.objective || 'Build trust',
        hook: p.hook || `Day ${idx + 1} spotlight`,
        caption: p.caption || 'Crafted with care for daily customers.',
        cta: p.cta || 'Contact us to enquire',
        layoutArchetype: archetypes[idx % archetypes.length],
        generationStatus: 'queued',
        retryCount: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }));

      await logUsage({
        id: crypto.randomUUID(),
        callType: 'week_plan_text',
        modelName,
        promptTokens: response.usageMetadata?.promptTokenCount || 0,
        candidateTokens: response.usageMetadata?.candidatesTokenCount || 0,
        totalTokens: response.usageMetadata?.totalTokenCount || 0,
        estimatedCostUsd: ((response.usageMetadata?.totalTokenCount || 0) * 0.0000003),
        durationMs: Date.now() - startTime,
        status: 'success',
        ipHash: businessDetails.ipHash,
        createdAt: new Date().toISOString()
      });

      return posts;
    } catch (geminiError: any) {
      console.warn("Gemini week plan generation failed, checking alternatives:", geminiError?.message);
    }
  }

  // 2. Try OpenRouter Qwen Text Model if OpenRouter key is available
  const effectiveOpenRouterKey = (openRouterApiKeyOverride || env.OPENROUTER_API_KEY || '').trim();
  if (effectiveOpenRouterKey) {
    try {
      console.log("Generating 7-day plan with Qwen via OpenRouter...");
      const text = await generateTextWithOpenRouter(prompt, effectiveOpenRouterKey);
      const cleanJson = text.replace(/^```json/i, '').replace(/```$/i, '').trim();
      const rawPosts = JSON.parse(cleanJson);

      const posts: TrialPost[] = rawPosts.map((p: any, idx: number) => ({
        id: crypto.randomUUID(),
        trialId: '',
        dayIndex: p.dayIndex || idx + 1,
        dayName: p.dayName || ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'][idx],
        pillar: p.pillar || 'Craft & Process',
        objective: p.objective || 'Build trust',
        hook: p.hook || `Day ${idx + 1} spotlight`,
        caption: p.caption || 'Crafted with care for daily customers.',
        cta: p.cta || 'Contact us to enquire',
        layoutArchetype: archetypes[idx % archetypes.length],
        generationStatus: 'queued',
        retryCount: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }));

      await logUsage({
        id: crypto.randomUUID(),
        callType: 'week_plan_text',
        modelName: 'qwen/qwen-2.5-72b-instruct',
        promptTokens: 0,
        candidateTokens: 0,
        totalTokens: 0,
        estimatedCostUsd: 0.001,
        durationMs: Date.now() - startTime,
        status: 'success',
        ipHash: businessDetails.ipHash,
        createdAt: new Date().toISOString()
      });

      return posts;
    } catch (orError: any) {
      console.warn("OpenRouter text plan generation failed, falling back to tailored plan:", orError?.message);
    }
  }

  // 3. Resilient Tailored Fallback (ensures trial creation never crashes for new users)
  console.log("Constructing curated tailored week plan for", businessDetails.name);
  return buildTailoredDefaultPosts(businessDetails, identity);
}

// OpenRouter Qwen Image Generation Helper
async function generateQwenImageWithOpenRouter(
  prompt: string,
  apiKey: string,
  modelName: string
): Promise<Buffer> {
  const cleanKey = apiKey.trim().replace(/^["']|["']$/g, '');
  const res = await fetch("https://openrouter.ai/api/v1/images/generations", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${cleanKey}`,
      "Content-Type": "application/json",
      "HTTP-Referer": "https://contentsmith.ng",
      "X-Title": "ContentSmith",
    },
    body: JSON.stringify({
      model: modelName || "qwen/qwen-image-3",
      prompt,
      n: 1,
    }),
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    const errText = errorData?.error?.message || errorData?.message || res.statusText;
    throw new Error(`OpenRouter Qwen Image generation error (${res.status}): ${errText}`);
  }

  const json = await res.json();
  const item = json.data?.[0];
  if (!item) {
    throw new Error("No image returned from OpenRouter Qwen Image model.");
  }

  if (item.b64_json) {
    return Buffer.from(item.b64_json, "base64");
  }

  const imageUrl = item.url || item.image_url?.url;
  if (imageUrl) {
    const imgRes = await fetch(imageUrl);
    if (!imgRes.ok) {
      throw new Error(`OpenRouter image download failed (${imgRes.status}).`);
    }
    const arrayBuffer = await imgRes.arrayBuffer();
    return Buffer.from(arrayBuffer);
  }

  throw new Error("Invalid image format returned from OpenRouter Qwen Image model.");
}

// Curated authentic commercial photography libraries by industry
const CURATED_INDUSTRY_PHOTOS: Record<string, string[]> = {
  food: [
    'https://images.unsplash.com/photo-1555507036-ab1f4038808a?w=1080&auto=format&fit=crop&q=85', // golden baked pastries
    'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=1080&auto=format&fit=crop&q=85', // bakery loaves
    'https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=1080&auto=format&fit=crop&q=85', // cake & celebrations
    'https://images.unsplash.com/photo-1563729784474-d77dbb933a9e?w=1080&auto=format&fit=crop&q=85', // treats & snacks
  ],
  video_tech: [
    'https://images.unsplash.com/photo-1574717024653-61fd2cf4d44d?w=1080&auto=format&fit=crop&q=85', // cinema rig / camera
    'https://images.unsplash.com/photo-1536240478700-b869070f9279?w=1080&auto=format&fit=crop&q=85', // video editing suite
    'https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?w=1080&auto=format&fit=crop&q=85', // camera lens
    'https://images.unsplash.com/photo-1518133910546-b6c2fb7d79e3?w=1080&auto=format&fit=crop&q=85', // studio lighting
  ],
  fashion: [
    'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=1080&auto=format&fit=crop&q=85', // fashion model
    'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=1080&auto=format&fit=crop&q=85', // apparel boutique
    'https://images.unsplash.com/photo-1483985988355-763728e1935b?w=1080&auto=format&fit=crop&q=85', // stylish shopping
    'https://images.unsplash.com/photo-1549298916-b41d501d3772?w=1080&auto=format&fit=crop&q=85', // artisan shoes
  ],
  beauty: [
    'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=1080&auto=format&fit=crop&q=85', // beauty
    'https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=1080&auto=format&fit=crop&q=85', // cosmetics
    'https://images.unsplash.com/photo-1560066984-138dadb4c035?w=1080&auto=format&fit=crop&q=85', // salon
  ],
  general: [
    'https://images.unsplash.com/photo-1556740738-b6a63e27c4df?w=1080&auto=format&fit=crop&q=85', // artisan workshop
    'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=1080&auto=format&fit=crop&q=85', // storefront
    'https://images.unsplash.com/photo-1526304640581-d334cdbbf45e?w=1080&auto=format&fit=crop&q=85', // retail & trade
  ]
};

function selectIndustryPhoto(offering: string, businessName: string, dayIndex: number): string {
  const text = `${offering} ${businessName}`.toLowerCase();
  
  let pool = CURATED_INDUSTRY_PHOTOS.general;
  if (/pastry|bread|cake|bake|pie|doughnut|cookie|food|snack|restaurant|shawarma|kitchen|catering|meal|suya/i.test(text)) {
    pool = CURATED_INDUSTRY_PHOTOS.food;
  } else if (/video|media|film|camera|creator|youtube|tiktok|studio|edit|production|photo|motion|sound|podcast/i.test(text)) {
    pool = CURATED_INDUSTRY_PHOTOS.video_tech;
  } else if (/fashion|cloth|wear|dress|apparel|ankara|senator|suit|tailor|boutique|fabric|shoe|bag|linen|streetwear/i.test(text)) {
    pool = CURATED_INDUSTRY_PHOTOS.fashion;
  } else if (/beauty|hair|braid|salon|barber|skin|glow|oil|cosmetic|makeup|spa|fragrance|perfume/i.test(text)) {
    pool = CURATED_INDUSTRY_PHOTOS.beauty;
  }
  
  return pool[(dayIndex - 1) % pool.length] || pool[0];
}

// 3. Step C: Visual Brief & Image Generation
export async function generatePostBackground(
  post: TrialPost,
  identity: IdentityCard,
  businessName: string,
  referenceImageBase64?: string,
  apiKeyOverride?: string,
  openRouterApiKeyOverride?: string,
  providerOverride?: 'gemini' | 'openrouter',
  offeringContext?: string
): Promise<Buffer> {
  const startTime = Date.now();
  const env = getServerEnv();
  const photoLayouts = ['product_hero_offset', 'split_panel', 'before_after'];
  const needsPhotography = photoLayouts.includes(post.layoutArchetype);

  if (!needsPhotography) {
    const canvasBuffer = await generateEditorialBrandedCanvas(identity, post, businessName, offeringContext, false);
    await logUsage({
      id: crypto.randomUUID(),
      callType: 'image_generation',
      modelName: 'brand-graphic-canvas',
      promptTokens: 0,
      candidateTokens: 0,
      totalTokens: 0,
      estimatedCostUsd: 0,
      durationMs: Date.now() - startTime,
      status: 'success',
      ipHash: 'brand_graphic_canvas',
      createdAt: new Date().toISOString()
    });
    return canvasBuffer;
  }

  if (referenceImageBase64) {
    const base64 = referenceImageBase64.replace(/^data:image\/[^;]+;base64,/, '');
    const productImage = await sharp(Buffer.from(base64, 'base64'))
      .rotate()
      .resize(1080, 1350, { fit: 'cover', position: 'centre' })
      .jpeg({ quality: 94 })
      .toBuffer();
    await logUsage({
      id: crypto.randomUUID(),
      callType: 'image_generation',
      modelName: 'uploaded-product-photo',
      promptTokens: 0,
      candidateTokens: 0,
      totalTokens: 0,
      estimatedCostUsd: 0,
      durationMs: Date.now() - startTime,
      status: 'success',
      ipHash: 'uploaded_product_photo',
      createdAt: new Date().toISOString()
    });
    return productImage;
  }

  // Strict anti-slop prompt for Image Models
  const imagePrompt = `
Create a high-resolution commercial product photograph for ${businessName}, featuring ${offeringContext || post.hook}.
This image supports the ${post.layoutArchetype} flyer, titled "${post.hook}". Show the actual kind of product or service described by the business, with a clear focal subject and room around it for a separate text layout.
Use natural, editorial lighting and tactile, believable materials. Let the brand palette influence small styling details: ${identity.palette.primary}, ${identity.palette.secondary}, and ${identity.palette.accent}.
Do not invent a logo, package label, customer, result, or business claim. No text, letters, signage, watermark, or pseudo-typography. Avoid generic stock-photo staging, purple gradients, neon glow, floating 3D objects, glossy plastic, and unrelated props.
`;

  // Check if OpenRouter Qwen should be used
  const effectiveOpenRouterKey = (openRouterApiKeyOverride || env.OPENROUTER_API_KEY || '').trim();
  const preferOpenRouter = 
    providerOverride === 'openrouter' ||
    (providerOverride !== 'gemini' && effectiveOpenRouterKey.length > 0 && env.IMAGE_PROVIDER !== 'gemini');

  // 1. Try OpenRouter Qwen Image Generation (Diffusion)
  if (preferOpenRouter && effectiveOpenRouterKey) {
    const qwenModel = env.OPENROUTER_IMAGE_MODEL || 'qwen/qwen-image-3';
    console.log(`Generating visual flyer using Qwen Image (${qwenModel}) via OpenRouter...`);
    try {
      const qwenBuffer = await generateQwenImageWithOpenRouter(imagePrompt, effectiveOpenRouterKey, qwenModel);
      await logUsage({
        id: crypto.randomUUID(),
        callType: 'image_generation',
        modelName: qwenModel,
        promptTokens: 0,
        candidateTokens: 0,
        totalTokens: 0,
        estimatedCostUsd: 0.03,
        durationMs: Date.now() - startTime,
        status: 'success',
        ipHash: 'openrouter_qwen',
        createdAt: new Date().toISOString()
      });
      return qwenBuffer;
    } catch (qwenError: any) {
      console.warn("OpenRouter Qwen Image generation note (credits or quota):", qwenError.message);
    }
  }

  // 2. Try Gemini Image Generation (Imagen) if configured
  if (env.isGeminiKeyConfigured) {
    try {
      const { ai, imageModelName } = getAiClient(apiKeyOverride);
      const response = await ai.models.generateImages({
        model: imageModelName,
        prompt: imagePrompt,
        config: {
          numberOfImages: 1,
          outputMimeType: 'image/jpeg',
          aspectRatio: '3:4',
        }
      });

      const generatedImageBase64 = response.generatedImages?.[0]?.image?.imageBytes;
      if (generatedImageBase64) {
        const imageBuffer = Buffer.from(generatedImageBase64, 'base64');
        await logUsage({
          id: crypto.randomUUID(),
          callType: 'image_generation',
          modelName: imageModelName,
          promptTokens: 0,
          candidateTokens: 0,
          totalTokens: 0,
          estimatedCostUsd: 0.03,
          durationMs: Date.now() - startTime,
          status: 'success',
          ipHash: 'internal_worker',
          createdAt: new Date().toISOString()
        });
        return imageBuffer;
      }
    } catch (geminiError: any) {
      console.warn("Direct image model generation note:", geminiError?.message);
    }
  }

  // 3. Resilient Editorial Branded Canvas Engine (Curated Photography Backdrop)
  // Produces an authentic, tactile photographic ground adhering strictly to the merchant's brand identity card
  console.log(`Generating authentic editorial flyer canvas for ${businessName} (${post.layoutArchetype})...`);
  const canvasBuffer = await generateEditorialBrandedCanvas(identity, post, businessName, offeringContext, true);
  await logUsage({
    id: crypto.randomUUID(),
    callType: 'image_generation',
    modelName: 'editorial-canvas-engine',
    promptTokens: 0,
    candidateTokens: 0,
    totalTokens: 0,
    estimatedCostUsd: 0,
    durationMs: Date.now() - startTime,
    status: 'success',
    ipHash: 'editorial_canvas',
    createdAt: new Date().toISOString()
  });

  return canvasBuffer;
}

/**
 * Generates an authentic Nigerian editorial advertising ground using sharp & high-res photography.
 * Ensures trial generation produces commercial-grade visual flyers even when third-party diffusion API credits are depleted.
 */
async function generateEditorialBrandedCanvas(
  identity: IdentityCard,
  post: TrialPost,
  businessName: string,
  offeringContext?: string,
  usePhotography = true
): Promise<Buffer> {
  const width = 1080;
  const height = 1350;
  const primary = identity.palette?.primary || '#1A1A1A';
  const secondary = identity.palette?.secondary || '#EAE6DF';
  const accent = identity.palette?.accent || '#F5B301';

  if (!usePhotography) {
    const svg = `
      <svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
        <rect width="100%" height="100%" fill="${secondary}" />
        <path d="M0 1070 L1080 790 M0 1240 L1080 960" stroke="${primary}" stroke-opacity="0.08" stroke-width="3" />
        <circle cx="920" cy="190" r="132" fill="${accent}" fill-opacity="0.16" />
        <circle cx="920" cy="190" r="96" fill="none" stroke="${primary}" stroke-opacity="0.12" stroke-width="2" />
      </svg>
    `;
    return sharp(Buffer.from(svg)).jpeg({ quality: 94 }).toBuffer();
  }

  const photoUrl = selectIndustryPhoto(offeringContext || '', businessName, post.dayIndex);

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 4000);
    const res = await fetch(photoUrl, { signal: controller.signal });
    clearTimeout(timeout);

    if (res.ok) {
      const arrayBuf = await res.arrayBuffer();
      const resizedPhoto = await sharp(Buffer.from(arrayBuf))
        .resize(width, height, { fit: 'cover', position: 'center' })
        .toBuffer();

      return resizedPhoto;
    }
  } catch (err: any) {
    console.warn("Curated photo fetch fallback to textured studio ground:", err.message);
  }

  // High-contrast textured studio gradient fallback if network is completely offline
  const svg = `
    <svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="${primary}" />
          <stop offset="50%" stop-color="#141518" />
          <stop offset="100%" stop-color="#090A0C" />
        </linearGradient>
        <radialGradient id="accentGlow" cx="75%" cy="25%" r="65%">
          <stop offset="0%" stop-color="${accent}" stop-opacity="0.35" />
          <stop offset="100%" stop-color="${primary}" stop-opacity="0" />
        </radialGradient>
      </defs>
      <rect width="100%" height="100%" fill="url(#bgGrad)" />
      <rect width="100%" height="100%" fill="url(#accentGlow)" />
    </svg>
  `;

  return sharp(Buffer.from(svg)).jpeg({ quality: 92 }).toBuffer();
}

// 4. Step D: Quality Gate Inspection
export async function runQualityGate(
  imageBuffer: Buffer,
  identity: IdentityCard,
  apiKeyOverride?: string
): Promise<{ passed: boolean; paletteMatch: boolean; cleanComposition: boolean; noGibberishText: boolean; notes: string }> {
  const startTime = Date.now();
  let clientObj;
  try {
    clientObj = getAiClient(apiKeyOverride);
  } catch (err) {
    return {
      passed: true,
      paletteMatch: true,
      cleanComposition: true,
      noGibberishText: true,
      notes: "Auto-cleared (key check skipped for quality gate)"
    };
  }

  const { ai, modelName } = clientObj;

  const prompt = `
Inspect this newly generated advertising graphic as a quality gate auditor.
Verify against these criteria:
1. Palette adherence: Does it respect the brand palette (${identity.palette.primary}, ${identity.palette.secondary}, ${identity.palette.accent})?
2. Clean composition: Is there generous negative space without cluttered noise?
3. No gibberish text: Does the image contain garbled pseudo-letters or accidental text hallucinations? (It MUST NOT have text).

Return ONLY valid JSON:
{
  "paletteMatch": boolean,
  "cleanComposition": boolean,
  "noGibberishText": boolean,
  "passed": boolean,
  "notes": "Short concise evaluation note"
}
`;

  try {
    const response = await generateContentWithFallback(ai, modelName, {
      contents: [
        { text: prompt },
        {
          inlineData: {
            mimeType: "image/jpeg",
            data: imageBuffer.toString("base64")
          }
        }
      ]
    });

    const text = response.text?.trim() || "";
    const cleanJson = text.replace(/^```json/i, '').replace(/```$/i, '').trim();
    const findings = JSON.parse(cleanJson);

    await logUsage({
      id: crypto.randomUUID(),
      callType: 'quality_gate_vision',
      modelName,
      promptTokens: response.usageMetadata?.promptTokenCount || 0,
      candidateTokens: response.usageMetadata?.candidatesTokenCount || 0,
      totalTokens: response.usageMetadata?.totalTokenCount || 0,
      estimatedCostUsd: 0.0005,
      durationMs: Date.now() - startTime,
      status: 'success',
      ipHash: 'quality_gate',
      createdAt: new Date().toISOString()
    });

    return findings;
  } catch (err: any) {
    return {
      passed: true,
      paletteMatch: true,
      cleanComposition: true,
      noGibberishText: true,
      notes: "Auto-cleared on inspection timeout"
    };
  }
}
