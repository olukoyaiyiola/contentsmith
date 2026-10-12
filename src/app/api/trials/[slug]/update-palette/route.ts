import { NextRequest, NextResponse } from 'next/server';
import { getTrialBySlug, saveTrial } from '@/lib/db';
import { z } from 'zod';

const paletteUpdateSchema = z.object({
  primary: z.string().regex(/^#[0-9A-Fa-f]{6}$/, "Must be a valid 6-char hex color"),
  secondary: z.string().regex(/^#[0-9A-Fa-f]{6}$/, "Must be a valid 6-char hex color"),
  accent: z.string().regex(/^#[0-9A-Fa-f]{6}$/, "Must be a valid 6-char hex color"),
});

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const body = await req.json();
    const validated = paletteUpdateSchema.parse(body);

    const trial = await getTrialBySlug(slug);
    if (!trial) {
      return NextResponse.json({ error: "Trial not found or has expired." }, { status: 404 });
    }

    if (trial.identityCard) {
      trial.identityCard.palette = {
        primary: validated.primary,
        secondary: validated.secondary,
        accent: validated.accent,
      };
      await saveTrial(trial);
    }

    return NextResponse.json({
      success: true,
      identityCard: trial.identityCard,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || "Invalid palette update" }, { status: 400 });
  }
}
