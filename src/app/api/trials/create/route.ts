import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import crypto from 'crypto';
import { getServerEnv } from '@/lib/env';
import { checkRateLimitAndCap, incrementIpCount, saveTrial, saveTrialPosts, saveAsset } from '@/lib/db';
import { extractIdentityCard, generateWeekPlan } from '@/lib/gemini';
import { Trial, TrialAsset } from '@/types/database';

const createTrialSchema = z.object({
  businessName: z.string().min(2, "Business name is required"),
  offering: z.string().min(3, "Offering is required"),
  city: z.string().min(2, "City is required"),
  audience: z.string().min(2, "Audience description is required"),
  tone: z.string().min(2, "Tone is required"),
  whatsappNumber: z.string().optional(),
});

function hashIp(ip: string, salt: string): string {
  return crypto.createHash('sha256').update(ip + salt).digest('hex');
}

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const env = getServerEnv();

    // Extract IP from headers
    const forwarded = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || '127.0.0.1';
    const clientIp = forwarded.split(',')[0].trim();
    const ipHash = hashIp(clientIp, env.IP_HASH_SALT);

    // 1. Abuse & Cost Controls: Check Kill Switch, Daily Cap, IP Limits
    const limitCheck = await checkRateLimitAndCap(ipHash);
    if (!limitCheck.allowed) {
      return NextResponse.json({ error: limitCheck.reason }, { status: 429 });
    }

    // 2. Form Data Validation
    const rawData = {
      businessName: formData.get('businessName')?.toString() || '',
      offering: formData.get('offering')?.toString() || '',
      city: formData.get('city')?.toString() || '',
      audience: formData.get('audience')?.toString() || '',
      tone: formData.get('tone')?.toString() || '',
      whatsappNumber: formData.get('whatsappNumber')?.toString() || '',
    };

    const validated = createTrialSchema.parse(rawData);

    // 3. Process File Uploads (Logo & Product Photos)
    const logoFile = formData.get('logo') as File | null;
    let logoBuffer: Buffer | null = null;
    let logoAsset: TrialAsset | null = null;

    if (logoFile && logoFile.size > 0) {
      if (logoFile.size > 5 * 1024 * 1024) {
        return NextResponse.json({ error: "Logo file exceeds 5MB limit." }, { status: 400 });
      }
      const arrayBuffer = await logoFile.arrayBuffer();
      logoBuffer = Buffer.from(arrayBuffer);
      const assetId = crypto.randomUUID();
      logoAsset = {
        id: assetId,
        trialId: '',
        assetType: 'logo',
        storagePath: `uploads/logo_${assetId}.png`,
        fileSize: logoFile.size,
        mimeType: logoFile.type || 'image/png',
        dataUrl: `data:${logoFile.type || 'image/png'};base64,${logoBuffer.toString('base64')}`,
        createdAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + 48 * 3600 * 1000).toISOString(),
      };
      await saveAsset(logoAsset);
    }

    // Process reference / product photos
    const referenceBuffers: Buffer[] = [];
    const productAssetIds: string[] = [];

    const productFiles = formData.getAll('productPhotos') as File[];
    for (const file of productFiles.slice(0, 3)) {
      if (file && file.size > 0 && file.size <= 5 * 1024 * 1024) {
        const ab = await file.arrayBuffer();
        const buf = Buffer.from(ab);
        referenceBuffers.push(buf);
        const pId = crypto.randomUUID();
        const pAsset: TrialAsset = {
          id: pId,
          trialId: '',
          assetType: 'product',
          storagePath: `uploads/product_${pId}.jpg`,
          fileSize: file.size,
          mimeType: file.type || 'image/jpeg',
          dataUrl: `data:${file.type || 'image/jpeg'};base64,${buf.toString('base64')}`,
          createdAt: new Date().toISOString(),
          expiresAt: new Date(Date.now() + 48 * 3600 * 1000).toISOString(),
        };
        await saveAsset(pAsset);
        productAssetIds.push(pId);
      }
    }

    const customApiKey = formData.get('apiKey')?.toString()?.trim() || req.headers.get('x-gemini-api-key')?.trim() || undefined;
    const customOpenRouterApiKey = formData.get('openRouterApiKey')?.toString()?.trim() || req.headers.get('x-openrouter-api-key')?.trim() || undefined;

    // 4. Generate unguessable 12-char slug
    const shortSlug = crypto.randomBytes(9).toString('base64url').slice(0, 12);
    const trialId = crypto.randomUUID();

    // 5. Step A: Identity Card Extraction (Gemini Vision / Inferred Palette)
    const identityCard = await extractIdentityCard(
      logoBuffer,
      referenceBuffers,
      {
        name: validated.businessName,
        offering: validated.offering,
        city: validated.city,
        tone: validated.tone,
        ipHash,
      },
      customApiKey
    );

    // 6. Step B: Week Plan Generation (Gemini Text / Qwen OpenRouter / Curated SME Engine)
    const posts = await generateWeekPlan(
      {
        name: validated.businessName,
        offering: validated.offering,
        city: validated.city,
        audience: validated.audience,
        tone: validated.tone,
        ipHash,
      },
      identityCard,
      customApiKey,
      customOpenRouterApiKey
    );

    // Attach trial ID to posts
    const finalizedPosts = posts.map(p => ({ ...p, trialId }));

    // 7. Save Trial & Posts
    const newTrial: Trial = {
      id: trialId,
      shortSlug,
      createdAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 48 * 3600 * 1000).toISOString(),
      ipHash,
      businessName: validated.businessName,
      offering: validated.offering,
      city: validated.city,
      audience: validated.audience,
      tone: validated.tone,
      whatsappNumber: validated.whatsappNumber || undefined,
      logoAssetId: logoAsset?.id,
      logoUrl: logoAsset?.dataUrl,
      productAssetIds,
      referenceAssetIds: [],
      identityCard,
      status: 'plan_ready',
    };

    await saveTrial(newTrial);
    await saveTrialPosts(trialId, finalizedPosts);
    await incrementIpCount(ipHash);

    return NextResponse.json({
      success: true,
      slug: shortSlug,
      trial: { ...newTrial, posts: finalizedPosts },
    });
  } catch (error: any) {
    console.error("Trial creation error:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to create trial" },
      { status: 500 }
    );
  }
}
