import { NextRequest, NextResponse } from 'next/server';
import { getServerEnv } from '@/lib/env';
import { cleanupExpiredData } from '@/lib/db';

export async function POST(req: NextRequest) {
  try {
    const env = getServerEnv();
    const authHeader = req.headers.get('authorization') || '';
    const token = authHeader.replace(/^Bearer /i, '');

    // Validate cron authorization
    if (token !== env.CRON_SECRET && process.env.NODE_ENV === 'production') {
      return NextResponse.json({ error: "Unauthorized cron execution." }, { status: 401 });
    }

    const result = await cleanupExpiredData();

    return NextResponse.json({
      success: true,
      message: "48-hour data expiration cleanup complete.",
      deletedTrials: result.deletedTrials,
      deletedAssets: result.deletedAssets,
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "Failed to execute cleanup" },
      { status: 500 }
    );
  }
}
