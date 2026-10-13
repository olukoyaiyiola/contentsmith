import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { getServerEnv } from './env';
import { 
  Trial, 
  TrialPost, 
  TrialAsset, 
  AppSettings, 
  Lead, 
  ExampleItem, 
  ExampleSubmission, 
  DesignerRequest, 
  UsageLog 
} from '@/types/database';
import fs from 'fs';
import path from 'path';

let supabaseClient: SupabaseClient | null = null;

function getSupabase(): SupabaseClient | null {
  if (supabaseClient) return supabaseClient;
  const env = getServerEnv();
  if (env.NEXT_PUBLIC_SUPABASE_URL && env.SUPABASE_SERVICE_ROLE_KEY) {
    supabaseClient = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);
    return supabaseClient;
  }
  return null;
}

// Local file-backed database storage for dev/preview resilience
interface LocalDbStore {
  settings: Record<string, any>;
  trials: Record<string, Trial>;
  posts: Record<string, TrialPost[]>;
  assets: Record<string, TrialAsset>;
  leads: Lead[];
  examples: ExampleItem[];
  exampleSubmissions: ExampleSubmission[];
  designerRequests: DesignerRequest[];
  usageLogs: UsageLog[];
  ipLimits: Record<string, { dailyCount: number; weeklyCount: number; lastReset: number }>;
}

const isVercel = Boolean(process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME);
const LOCAL_DB_PATH = isVercel
  ? path.join('/tmp', '.contentsmith_db.json')
  : path.join(process.cwd(), '.contentsmith_db.json');

let inMemoryStore: LocalDbStore | null = null;

const INITIAL_EXAMPLES: ExampleItem[] = [
  {
    id: "ex-1",
    title: "Sourdough Batch Announcement",
    industry: "Food & Bakery",
    platform: "Instagram 4:5",
    imageUrl: "https://images.unsplash.com/photo-1509440159596-0249088772ff?w=800&auto=format&fit=crop&q=80",
    caption: "Wednesday bake coming out of the hearth at 6 AM. Golden crust, crumb open and airy. Reserve loaves on WhatsApp before noon.",
    makerCredit: "Bakehouse Lagos",
    whyItWorks: "Strong typographic poster archetype with high-contrast ochre background and zero clutter.",
    consentFlag: true,
    isPublished: true,
    displayOrder: 1,
    createdAt: new Date().toISOString()
  },
  {
    id: "ex-2",
    title: "Linen Co-ord Weekend Restock",
    industry: "Fashion & Apparel",
    platform: "Instagram 4:5",
    imageUrl: "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=800&auto=format&fit=crop&q=80",
    caption: "The Sage set is back on the rack. Breathable handwoven linen cut for the humid afternoon heat. Order directly via catalog link.",
    makerCredit: "Kemi Studios Surulere",
    whyItWorks: "Product hero with geometric offset framing; authentic Lagos warmth without generic studio presets.",
    consentFlag: true,
    isPublished: true,
    displayOrder: 2,
    createdAt: new Date().toISOString()
  },
  {
    id: "ex-3",
    title: "Hand-poured Botanical Candle Note",
    industry: "Craft & Retail",
    platform: "WhatsApp Status 9:16",
    imageUrl: "https://images.unsplash.com/photo-1603006905003-be475563bc59?w=800&auto=format&fit=crop&q=80",
    caption: "Bergamot, lemongrass, and local beeswax. 45-hour clean burn. Drop by our pop-up at Lekki Phase 1 this Saturday.",
    makerCredit: "Terra Botanics",
    whyItWorks: "WhatsApp safe zones honored; top 14% and bottom 20% clear of text so status viewers tap smoothly.",
    consentFlag: true,
    isPublished: true,
    displayOrder: 3,
    createdAt: new Date().toISOString()
  }
];

function readLocalDb(): LocalDbStore {
  if (inMemoryStore) {
    return inMemoryStore;
  }
  try {
    if (fs.existsSync(LOCAL_DB_PATH)) {
      const data = fs.readFileSync(LOCAL_DB_PATH, 'utf-8');
      inMemoryStore = JSON.parse(data);
      if (inMemoryStore) return inMemoryStore;
    }
  } catch (err) {
    console.error("Error reading local db fallback:", err);
  }
  const defaultStore: LocalDbStore = {
    settings: {
      killSwitchEnabled: false,
      dailyTrialCap: 50,
      allowedAdminEmails: ["admin@contentsmith.ng", "owner@contentsmith.ng", "olukoya@contentsmith.ng"],
      maintenanceMessage: "ContentSmith generation is briefly paused for routine maintenance."
    },
    trials: {},
    posts: {},
    assets: {},
    leads: [],
    examples: INITIAL_EXAMPLES,
    exampleSubmissions: [],
    designerRequests: [],
    usageLogs: [],
    ipLimits: {}
  };
  inMemoryStore = defaultStore;
  writeLocalDb(defaultStore);
  return defaultStore;
}

function writeLocalDb(store: LocalDbStore): void {
  inMemoryStore = store;
  try {
    fs.writeFileSync(LOCAL_DB_PATH, JSON.stringify(store, null, 2), 'utf-8');
  } catch (err) {
    // In serverless environments where disk write might be restricted, inMemoryStore maintains state
  }
}

// 1. Settings & Kill Switch
export async function getSettings(): Promise<AppSettings> {
  const sb = getSupabase();
  if (sb) {
    const { data } = await sb.from('settings').select('*');
    if (data) {
      const mapped: any = {};
      data.forEach(item => {
        if (item.key === 'kill_switch_enabled') mapped.killSwitchEnabled = item.value;
        if (item.key === 'daily_trial_cap') mapped.dailyTrialCap = item.value;
        if (item.key === 'allowed_admin_emails') mapped.allowedAdminEmails = item.value;
        if (item.key === 'maintenance_message') mapped.maintenanceMessage = item.value;
      });
      return {
        killSwitchEnabled: !!mapped.killSwitchEnabled,
        dailyTrialCap: mapped.dailyTrialCap || 50,
        allowedAdminEmails: mapped.allowedAdminEmails || ["admin@contentsmith.ng"],
        maintenanceMessage: mapped.maintenanceMessage || "Maintenance in progress."
      };
    }
  }
  const store = readLocalDb();
  return store.settings as AppSettings;
}

export async function updateSettings(partial: Partial<AppSettings>): Promise<AppSettings> {
  const sb = getSupabase();
  if (sb) {
    if (partial.killSwitchEnabled !== undefined) {
      await sb.from('settings').upsert({ key: 'kill_switch_enabled', value: partial.killSwitchEnabled });
    }
    if (partial.dailyTrialCap !== undefined) {
      await sb.from('settings').upsert({ key: 'daily_trial_cap', value: partial.dailyTrialCap });
    }
    if (partial.allowedAdminEmails !== undefined) {
      await sb.from('settings').upsert({ key: 'allowed_admin_emails', value: partial.allowedAdminEmails });
    }
  }
  const store = readLocalDb();
  store.settings = { ...store.settings, ...partial };
  writeLocalDb(store);
  return store.settings as AppSettings;
}

// 2. IP Rate Limits & Daily Cap
export async function checkRateLimitAndCap(ipHash: string): Promise<{ allowed: boolean; reason?: string }> {
  const settings = await getSettings();
  if (settings.killSwitchEnabled) {
    return { allowed: false, reason: settings.maintenanceMessage };
  }

  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();

  const store = readLocalDb();
  
  // Daily Global Cap Check
  let trialsCreatedToday = 0;
  Object.values(store.trials).forEach(t => {
    if (new Date(t.createdAt).getTime() >= todayStart) {
      trialsCreatedToday++;
    }
  });

  if (trialsCreatedToday >= settings.dailyTrialCap) {
    return { 
      allowed: false, 
      reason: "Today's community generation quota has been reached. It resets at midnight WAT." 
    };
  }

  // Per-IP Checks: 1 per day, 3 per week
  const userLimits = store.ipLimits[ipHash] || { dailyCount: 0, weeklyCount: 0, lastReset: Date.now() };
  const oneDayMs = 24 * 60 * 60 * 1000;
  const oneWeekMs = 7 * oneDayMs;

  if (Date.now() - userLimits.lastReset > oneDayMs) {
    userLimits.dailyCount = 0;
  }
  if (Date.now() - userLimits.lastReset > oneWeekMs) {
    userLimits.weeklyCount = 0;
    userLimits.lastReset = Date.now();
  }

  if (userLimits.dailyCount >= 1) {
    return { 
      allowed: false, 
      reason: "Limit reached: 1 free trial per IP per 24 hours. Connect with us on WhatsApp for additional capacity." 
    };
  }
  if (userLimits.weeklyCount >= 3) {
    return { 
      allowed: false, 
      reason: "Weekly limit reached: 3 trials per week." 
    };
  }

  return { allowed: true };
}

export async function incrementIpCount(ipHash: string): Promise<void> {
  const store = readLocalDb();
  const userLimits = store.ipLimits[ipHash] || { dailyCount: 0, weeklyCount: 0, lastReset: Date.now() };
  userLimits.dailyCount += 1;
  userLimits.weeklyCount += 1;
  store.ipLimits[ipHash] = userLimits;
  writeLocalDb(store);
}

// 3. Trials
export async function saveTrial(trial: Trial): Promise<Trial> {
  const store = readLocalDb();
  store.trials[trial.shortSlug] = trial;
  writeLocalDb(store);
  return trial;
}

export async function getTrialBySlug(slug: string): Promise<Trial | null> {
  const store = readLocalDb();
  const trial = store.trials[slug];
  if (!trial) return null;

  // Check 48h expiration
  if (new Date(trial.expiresAt).getTime() < Date.now()) {
    return null;
  }

  // Attach posts
  trial.posts = store.posts[trial.id] || [];
  return trial;
}

export async function listAllTrials(): Promise<Trial[]> {
  const store = readLocalDb();
  return Object.values(store.trials);
}

// 4. Trial Posts
export async function saveTrialPosts(trialId: string, posts: TrialPost[]): Promise<TrialPost[]> {
  const store = readLocalDb();
  store.posts[trialId] = posts;
  writeLocalDb(store);
  return posts;
}

export async function updateTrialPost(trialId: string, postId: string, updates: Partial<TrialPost>): Promise<TrialPost | null> {
  const store = readLocalDb();
  const posts = store.posts[trialId] || [];
  const index = posts.findIndex(p => p.id === postId);
  if (index === -1) return null;

  posts[index] = { ...posts[index], ...updates, updatedAt: new Date().toISOString() };
  store.posts[trialId] = posts;
  writeLocalDb(store);
  return posts[index];
}

// 5. Assets
export async function saveAsset(asset: TrialAsset): Promise<TrialAsset> {
  const store = readLocalDb();
  store.assets[asset.id] = asset;
  writeLocalDb(store);
  return asset;
}

export async function getAsset(assetId: string): Promise<TrialAsset | null> {
  const store = readLocalDb();
  return store.assets[assetId] || null;
}

// 6. Leads
export async function saveLead(lead: Lead): Promise<Lead> {
  const store = readLocalDb();
  store.leads.unshift(lead);
  writeLocalDb(store);
  return lead;
}

export async function listLeads(): Promise<Lead[]> {
  const store = readLocalDb();
  return store.leads;
}

// 7. Examples & Submissions
export async function listPublishedExamples(): Promise<ExampleItem[]> {
  const store = readLocalDb();
  return store.examples.filter(e => e.isPublished).sort((a, b) => a.displayOrder - b.displayOrder);
}

export async function listAllExamples(): Promise<ExampleItem[]> {
  const store = readLocalDb();
  return store.examples;
}

export async function saveExample(example: ExampleItem): Promise<ExampleItem> {
  const store = readLocalDb();
  const idx = store.examples.findIndex(e => e.id === example.id);
  if (idx >= 0) {
    store.examples[idx] = example;
  } else {
    store.examples.push(example);
  }
  writeLocalDb(store);
  return example;
}

export async function saveExampleSubmission(sub: ExampleSubmission): Promise<ExampleSubmission> {
  const store = readLocalDb();
  store.exampleSubmissions.unshift(sub);
  writeLocalDb(store);
  return sub;
}

export async function listExampleSubmissions(): Promise<ExampleSubmission[]> {
  const store = readLocalDb();
  return store.exampleSubmissions;
}

// 8. Designer Requests
export async function saveDesignerRequest(req: DesignerRequest): Promise<DesignerRequest> {
  const store = readLocalDb();
  const idx = store.designerRequests.findIndex(r => r.id === req.id);
  if (idx >= 0) {
    store.designerRequests[idx] = req;
  } else {
    store.designerRequests.unshift(req);
  }
  writeLocalDb(store);
  return req;
}

export async function listDesignerRequests(): Promise<DesignerRequest[]> {
  const store = readLocalDb();
  return store.designerRequests;
}

// 9. Usage Log
export async function logUsage(log: UsageLog): Promise<void> {
  const store = readLocalDb();
  store.usageLogs.unshift(log);
  writeLocalDb(store);
}

export async function listUsageLogs(): Promise<UsageLog[]> {
  const store = readLocalDb();
  return store.usageLogs;
}

// 10. 48-Hour Cleanup Routine
export async function cleanupExpiredData(): Promise<{ deletedTrials: number; deletedAssets: number }> {
  const store = readLocalDb();
  const now = Date.now();
  let deletedTrials = 0;
  let deletedAssets = 0;

  for (const slug in store.trials) {
    if (new Date(store.trials[slug].expiresAt).getTime() < now) {
      const trialId = store.trials[slug].id;
      delete store.trials[slug];
      delete store.posts[trialId];
      deletedTrials++;
    }
  }

  for (const assetId in store.assets) {
    if (new Date(store.assets[assetId].expiresAt).getTime() < now) {
      delete store.assets[assetId];
      deletedAssets++;
    }
  }

  writeLocalDb(store);
  return { deletedTrials, deletedAssets };
}
