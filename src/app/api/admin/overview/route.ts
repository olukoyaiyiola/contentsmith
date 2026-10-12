import { NextResponse } from 'next/server';
import { 
  getSettings, 
  listLeads, 
  listAllTrials, 
  listAllExamples, 
  listExampleSubmissions, 
  listDesignerRequests, 
  listUsageLogs 
} from '@/lib/db';

export async function GET() {
  try {
    const [
      settings,
      leads,
      trials,
      examples,
      exampleSubmissions,
      designerRequests,
      usageLogs
    ] = await Promise.all([
      getSettings(),
      listLeads(),
      listAllTrials(),
      listAllExamples(),
      listExampleSubmissions(),
      listDesignerRequests(),
      listUsageLogs()
    ]);

    return NextResponse.json({
      settings,
      leads,
      trials,
      examples,
      exampleSubmissions,
      designerRequests,
      usageLogs
    });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || "Failed to load admin overview" }, { status: 500 });
  }
}
