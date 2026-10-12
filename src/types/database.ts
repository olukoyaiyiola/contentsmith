export type AssetType = 
  | 'logo' 
  | 'product' 
  | 'reference' 
  | 'post_image_feed' 
  | 'post_image_story' 
  | 'post_composite';

export type TrialStatus = 
  | 'draft' 
  | 'identity_ready' 
  | 'plan_ready' 
  | 'generating' 
  | 'completed' 
  | 'failed' 
  | 'expired';

export type LayoutArchetype = 
  | 'typographic_poster' 
  | 'product_hero_offset' 
  | 'split_panel' 
  | 'testimonial_card' 
  | 'price_menu_list' 
  | 'announcement' 
  | 'before_after';

export type PostGenerationStatus = 
  | 'queued' 
  | 'generating' 
  | 'ready' 
  | 'failed';

export interface IdentityCard {
  palette: {
    primary: string;    // ~60% dominant
    secondary: string;  // ~30% supporting
    accent: string;     // ~10% focal accent
  };
  shapeLanguage: 'sharp' | 'rounded' | 'geometric' | 'organic' | 'artisan';
  typeCharacter: 'authoritative' | 'friendly' | 'playful' | 'traditional' | 'modern';
  brandTone: string;
  negativeCues: string[];
}

export interface TrialAsset {
  id: string;
  trialId: string;
  assetType: AssetType;
  storagePath: string;
  fileSize: number;
  mimeType: string;
  dataUrl?: string; // For ephemeral preview/mock
  createdAt: string;
  expiresAt: string;
}

export interface TrialPost {
  id: string;
  trialId: string;
  dayIndex: number; // 1 to 7
  dayName: string; // e.g. "Monday"
  pillar: string;
  objective: string;
  hook: string;
  caption: string;
  cta: string;
  layoutArchetype: LayoutArchetype;
  feedAssetId?: string;
  storyAssetId?: string;
  feedImageUrl?: string;
  storyImageUrl?: string;
  generationStatus: PostGenerationStatus;
  retryCount: number;
  qualityGateFindings?: {
    paletteMatch: boolean;
    cleanComposition: boolean;
    noGibberishText: boolean;
    notes?: string;
  };
  errorMessage?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Trial {
  id: string;
  shortSlug: string;
  createdAt: string;
  expiresAt: string;
  ipHash: string;
  businessName: string;
  offering: string;
  city: string;
  audience: string;
  tone: string;
  whatsappNumber?: string;
  logoAssetId?: string;
  logoUrl?: string;
  productAssetIds: string[];
  referenceAssetIds: string[];
  identityCard?: IdentityCard;
  status: TrialStatus;
  failureReason?: string;
  posts?: TrialPost[];
}

export interface Lead {
  id: string;
  trialId?: string;
  businessName: string;
  whatsappNumber: string;
  source: string;
  notes?: string;
  createdAt: string;
}

export interface ExampleItem {
  id: string;
  title: string;
  industry: 'Food & Bakery' | 'Fashion & Apparel' | 'Craft & Retail' | 'Professional Services' | 'Beauty & Wellness';
  platform: 'Instagram 4:5' | 'WhatsApp Status 9:16';
  imageUrl: string;
  caption: string;
  makerCredit: string;
  whyItWorks: string;
  consentFlag: boolean;
  isPublished: boolean;
  displayOrder: number;
  createdAt: string;
}

export interface ExampleSubmission {
  id: string;
  businessName: string;
  submitterName: string;
  contactInfo: string;
  industry: string;
  platform: string;
  imageUrl: string;
  caption?: string;
  notes?: string;
  consentAgreed: boolean;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
  reviewedAt?: string;
  reviewedBy?: string;
}

export interface DesignerRequest {
  id: string;
  businessName: string;
  preferredDirection: string;
  rejectedDirections: string;
  deadline: string;
  whatsappNumber: string;
  trialId?: string;
  referenceAssetUrls: string[];
  status: 'submitted' | 'reviewing' | 'in_progress' | 'delivered';
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface UsageLog {
  id: string;
  trialId?: string;
  callType: 'identity_vision' | 'week_plan_text' | 'image_generation' | 'quality_gate_vision';
  modelName: string;
  promptTokens: number;
  candidateTokens: number;
  totalTokens: number;
  estimatedCostUsd: number;
  durationMs: number;
  status: 'success' | 'failed';
  errorDetails?: string;
  ipHash: string;
  createdAt: string;
}

export interface AppSettings {
  killSwitchEnabled: boolean;
  dailyTrialCap: number;
  allowedAdminEmails: string[];
  maintenanceMessage: string;
}
