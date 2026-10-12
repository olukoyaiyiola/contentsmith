import { NextRequest, NextResponse } from 'next/server';
import { getTrialBySlug } from '@/lib/db';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const trial = await getTrialBySlug(slug);

    if (!trial) {
      return NextResponse.json(
        { error: "Trial not found or has expired after 48 hours." },
        { status: 404 }
      );
    }

    return NextResponse.json({ trial });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "Error fetching trial" },
      { status: 500 }
    );
  }
}
