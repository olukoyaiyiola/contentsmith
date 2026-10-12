import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { saveDesignerRequest, saveLead } from '@/lib/db';
import { DesignerRequest } from '@/types/database';

const designerRequestSchema = z.object({
  businessName: z.string().min(2, "Business name is required"),
  preferredDirection: z.string().min(5, "Preferred direction details are required"),
  rejectedDirections: z.string().min(3, "Rejected directions / what to avoid is required"),
  deadline: z.string().min(2, "Deadline is required"),
  whatsappNumber: z.string().min(8, "Valid WhatsApp number is required"),
  trialId: z.string().optional(),
  referenceAssetUrls: z.array(z.string().url()).optional(),
  notes: z.string().optional(),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const validated = designerRequestSchema.parse(body);

    const request: DesignerRequest = {
      id: crypto.randomUUID(),
      businessName: validated.businessName,
      preferredDirection: validated.preferredDirection,
      rejectedDirections: validated.rejectedDirections,
      deadline: validated.deadline,
      whatsappNumber: validated.whatsappNumber,
      trialId: validated.trialId,
      referenceAssetUrls: validated.referenceAssetUrls || [],
      status: 'submitted',
      notes: validated.notes,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await saveDesignerRequest(request);

    // Save lead record as well
    await saveLead({
      id: crypto.randomUUID(),
      trialId: validated.trialId,
      businessName: validated.businessName,
      whatsappNumber: validated.whatsappNumber,
      source: 'designer_request',
      notes: `Preferred: ${validated.preferredDirection}. Deadline: ${validated.deadline}`,
      createdAt: new Date().toISOString(),
    });

    return NextResponse.json({
      success: true,
      message: "Designer request submitted. A member of the craft team will reach out via WhatsApp.",
      requestId: request.id,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "Invalid designer request" },
      { status: 400 }
    );
  }
}
