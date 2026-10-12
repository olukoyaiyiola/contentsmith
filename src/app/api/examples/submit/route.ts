import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { saveExampleSubmission } from '@/lib/db';
import { ExampleSubmission } from '@/types/database';

const exampleSubmissionSchema = z.object({
  businessName: z.string().min(2, "Business name is required"),
  submitterName: z.string().min(2, "Your name is required"),
  contactInfo: z.string().min(3, "Contact info is required"),
  industry: z.string().min(2, "Industry is required"),
  platform: z.string().min(2, "Platform is required"),
  imageUrl: z.string().url("Valid image URL is required"),
  caption: z.string().optional(),
  notes: z.string().optional(),
  consentAgreed: z.literal(true, {
    message: "Consent is required to submit work for public showcase.",
  }),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const validated = exampleSubmissionSchema.parse(body);

    const submission: ExampleSubmission = {
      id: crypto.randomUUID(),
      businessName: validated.businessName,
      submitterName: validated.submitterName,
      contactInfo: validated.contactInfo,
      industry: validated.industry,
      platform: validated.platform,
      imageUrl: validated.imageUrl,
      caption: validated.caption,
      notes: validated.notes,
      consentAgreed: validated.consentAgreed,
      status: 'pending',
      createdAt: new Date().toISOString(),
    };

    await saveExampleSubmission(submission);

    return NextResponse.json({
      success: true,
      message: "Work submitted for review. It will appear on Examples once approved.",
      id: submission.id,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "Invalid submission" },
      { status: 400 }
    );
  }
}
