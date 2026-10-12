import { NextRequest, NextResponse } from 'next/server';
import { getSettings, updateSettings } from '@/lib/db';

export async function GET() {
  const settings = await getSettings();
  return NextResponse.json(settings);
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const updated = await updateSettings({
      killSwitchEnabled: body.killSwitchEnabled,
      dailyTrialCap: body.dailyTrialCap,
      allowedAdminEmails: body.allowedAdminEmails,
      maintenanceMessage: body.maintenanceMessage,
    });
    return NextResponse.json({ success: true, settings: updated });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || "Failed to update settings" }, { status: 500 });
  }
}
