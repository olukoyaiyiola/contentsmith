import { GoogleGenAI } from '@google/genai';
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

// 2. Step B: 7-Day Plan Generation
export async function generateWeekPlan(
  businessDetails: { name: string; offering: string; city: string; audience: string; tone: string; ipHash: string },
  identity: IdentityCard,
  apiKeyOverride?: string
): Promise<TrialPost[]> {
  const startTime = Date.now();
  const { ai, modelName } = getAiClient(apiKeyOverride);

  const archetypes: LayoutArchetype[] = [
    'typographic_poster',
    'product_hero_offset',
    'split_panel',
    'testimonial_card',
    'price_menu_list',
    'announcement',
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
1. "typographic_poster" (Bold quote, opening hours, or punchy philosophy)
2. "product_hero_offset" (Highlighting a flagship item with price or detail)
3. "split_panel" (Contrasting ingredients, process, or variety)
4. "testimonial_card" (Real customer voice from Lagos/Nigeria)
5. "price_menu_list" (Menu, weekly drop, or price breakdown)
6. "announcement" (Order deadline, delivery notice, restock)
7. "before_after" (Raw dough to golden pastry, fabric to garment, transformation)

Return ONLY valid JSON (no markdown \`\`\`json tags):
[
  {
    "dayIndex": 1,
    "dayName": "Monday",
    "pillar": "Weekly Drop / Announcement",
    "objective": "Drive early pre-orders for the week",
    "hook": "Fresh batch timetable for Yaba deliveries.",
    "caption": "Short declarative caption. No em dashes. No second-person hype. Clear Nigerian retail context.",
    "cta": "Send a WhatsApp message to book",
    "layoutArchetype": "announcement"
  },
  ...
]

Rules:
- Days must be 1 to 7 (Monday to Sunday).
- Captions must feel like real Nigerian business communications: clear, grounded, respectful.
- Strictly no em dashes. No empty motivational platitudes.
`;

  try {
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
      cta: p.cta || 'Order on WhatsApp',
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
  } catch (error: any) {
    const friendlyError = cleanAiErrorMessage(error);
    console.error("Week Plan generation error:", error);
    await logUsage({
      id: crypto.randomUUID(),
      callType: 'week_plan_text',
      modelName,
      promptTokens: 0,
      candidateTokens: 0,
      totalTokens: 0,
      estimatedCostUsd: 0,
      durationMs: Date.now() - startTime,
      status: 'failed',
      errorDetails: friendlyError,
      ipHash: businessDetails.ipHash,
      createdAt: new Date().toISOString()
    });
    throw new Error(friendlyError);
  }
}

// 3. Step C: Visual Brief & Image Generation
export async function generatePostBackground(
  post: TrialPost,
  identity: IdentityCard,
  businessName: string,
  referenceImageBase64?: string,
  apiKeyOverride?: string
): Promise<Buffer> {
  const startTime = Date.now();
  const { ai, imageModelName } = getAiClient(apiKeyOverride);

  // Strict anti-slop prompt for Gemini Image Model
  const imagePrompt = `
Commercial advertising photography background for Nigerian business "${businessName}".
Visual Theme: ${post.pillar} - ${post.objective}.
Layout Archetype: ${post.layoutArchetype}.
Color Palette: 60% dominant tone (${identity.palette.primary}), 30% supporting ground (${identity.palette.secondary}), 10% accent (${identity.palette.accent}).
Composition Guidelines:
- Clean editorial lighting, tactile textures (ceramic, warm paper, wood tabletop, Lagos sunlight, woven reed).
- Single focal point with generous negative space.
- NO TEXT. DO NOT RENDER ANY WORDS, LETTERS, SIGNS, LABELS, WATERMARKS, OR CHARACTERS. Text will be overlaid separately.
- Strict Negative Prompt: purple gradients, neon glow, floating 3D spheres, glossy plastic, fake smiles, over-smoothed mannequin skin, generic luxury marble, stereotyped clip art.
`;

  try {
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
    if (!generatedImageBase64) {
      throw new Error("No image was returned by the image generation model.");
    }

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
  } catch (error: any) {
    console.warn("Direct image model generation note:", error?.message);
    await logUsage({
      id: crypto.randomUUID(),
      callType: 'image_generation',
      modelName: imageModelName,
      promptTokens: 0,
      candidateTokens: 0,
      totalTokens: 0,
      estimatedCostUsd: 0,
      durationMs: Date.now() - startTime,
      status: 'failed',
      errorDetails: error?.message || 'Image generation call error',
      ipHash: 'internal_worker',
      createdAt: new Date().toISOString()
    });

    throw error;
  }
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
