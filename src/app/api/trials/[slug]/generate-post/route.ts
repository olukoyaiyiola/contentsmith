import { NextRequest, NextResponse } from 'next/server';
import { getTrialBySlug, updateTrialPost, getSettings, saveAsset } from '@/lib/db';
import { generatePostBackground, runQualityGate } from '@/lib/gemini';
import { compositeTypography } from '@/lib/typography-overlay';
import { TrialAsset } from '@/types/database';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const { postId, apiKey, openRouterApiKey, imageProvider } = await req.json();

    if (!postId) {
      return NextResponse.json({ error: "Missing postId" }, { status: 400 });
    }

    // 1. Check Kill Switch
    const settings = await getSettings();
    if (settings.killSwitchEnabled) {
      return NextResponse.json({ error: settings.maintenanceMessage }, { status: 503 });
    }

    // 2. Fetch Trial
    const trial = await getTrialBySlug(slug);
    if (!trial) {
      return NextResponse.json({ error: "Trial not found or has expired." }, { status: 404 });
    }

    const post = trial.posts?.find(p => p.id === postId);
    if (!post) {
      return NextResponse.json({ error: "Post not found in trial." }, { status: 404 });
    }

    // Update status to generating
    await updateTrialPost(trial.id, postId, { generationStatus: 'generating', errorMessage: undefined });

    const identity = trial.identityCard || {
      palette: { primary: "#121316", secondary: "#EAE6DF", accent: "#F5B301" },
      shapeLanguage: "geometric",
      typeCharacter: "modern",
      brandTone: "Honest and direct.",
      negativeCues: []
    };

    // 3. Step C: Generate Image Background
    let bgBuffer: Buffer;
    try {
      bgBuffer = await generatePostBackground(
        post, 
        identity, 
        trial.businessName, 
        trial.logoUrl, 
        apiKey,
        openRouterApiKey,
        imageProvider,
        trial.offering
      );
    } catch (genErr: any) {
      console.error("Image generation failed:", genErr?.message);
      await updateTrialPost(trial.id, postId, {
        generationStatus: 'failed',
        errorMessage: genErr?.message || 'Image generation failed'
      });
      return NextResponse.json({
        error: genErr?.message || 'Image generation failed',
        post: { ...post, generationStatus: 'failed', errorMessage: genErr?.message || 'Image generation failed' }
      }, { status: 500 });
    }

    // 4. Quality Gate Check
    const qualityFindings = await runQualityGate(bgBuffer, identity, apiKey);

    // If quality gate fails, retry once
    if (!qualityFindings.passed && post.retryCount < 1) {
      console.log(`Quality gate failed for post ${postId}, retrying once...`);
      try {
        bgBuffer = await generatePostBackground(
          post, 
          identity, 
          trial.businessName, 
          trial.logoUrl,
          apiKey,
          openRouterApiKey,
          imageProvider,
          trial.offering
        );
      } catch (retryErr) {
        // keep prior buffer
      }
    }

    // 5. Composite True Typography (4:5 Feed and 9:16 WhatsApp Status)
    const feedBuffer = await compositeTypography(bgBuffer, {
      aspectRatio: '4:5',
      post,
      identity,
      businessName: trial.businessName,
      logoUrl: trial.logoUrl
    });

    const storyBuffer = await compositeTypography(bgBuffer, {
      aspectRatio: '9:16',
      post,
      identity,
      businessName: trial.businessName,
      logoUrl: trial.logoUrl
    });

    // 6. Save Asset Records
    const feedAssetId = crypto.randomUUID();
    const feedAsset: TrialAsset = {
      id: feedAssetId,
      trialId: trial.id,
      assetType: 'post_image_feed',
      storagePath: `outputs/${slug}/post_${postId}_feed.png`,
      fileSize: feedBuffer.length,
      mimeType: 'image/png',
      dataUrl: `data:image/png;base64,${feedBuffer.toString('base64')}`,
      createdAt: new Date().toISOString(),
      expiresAt: trial.expiresAt
    };
    await saveAsset(feedAsset);

    const storyAssetId = crypto.randomUUID();
    const storyAsset: TrialAsset = {
      id: storyAssetId,
      trialId: trial.id,
      assetType: 'post_image_story',
      storagePath: `outputs/${slug}/post_${postId}_story.png`,
      fileSize: storyBuffer.length,
      mimeType: 'image/png',
      dataUrl: `data:image/png;base64,${storyBuffer.toString('base64')}`,
      createdAt: new Date().toISOString(),
      expiresAt: trial.expiresAt
    };
    await saveAsset(storyAsset);

    // 7. Update Post to Ready
    const updatedPost = await updateTrialPost(trial.id, postId, {
      feedAssetId,
      storyAssetId,
      feedImageUrl: feedAsset.dataUrl,
      storyImageUrl: storyAsset.dataUrl,
      generationStatus: 'ready',
      qualityGateFindings: qualityFindings,
    });

    return NextResponse.json({
      success: true,
      post: updatedPost
    });
  } catch (error: any) {
    console.error("Post generation error:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to generate visual flyer" },
      { status: 500 }
    );
  }
}
