import { z } from "zod";

const serverEnvSchema = z.object({
  GEMINI_API_KEY: z.string().min(1, "GEMINI_API_KEY is required"),
  GEMINI_TEXT_MODEL: z.string().min(1).default("gemini-2.5-flash"),
  GEMINI_IMAGE_MODEL: z.string().min(1).default("imagen-3.0-generate-002"),
  NEXT_PUBLIC_SUPABASE_URL: z.string().url().optional(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().optional(),
  SUPABASE_SERVICE_ROLE_KEY: z.string().optional(),
  DAILY_TRIAL_CAP: z.coerce.number().int().positive().default(50),
  CRON_SECRET: z.string().default("contentsmith_cron_secret_default"),
  IP_HASH_SALT: z.string().default("contentsmith_salt_2026"),
  TURNSTILE_SECRET_KEY: z.string().optional(),
  NEXT_PUBLIC_TURNSTILE_SITE_KEY: z.string().optional(),
});

export type ServerEnv = z.infer<typeof serverEnvSchema>;

let cachedEnv: ServerEnv | null = null;

export function getServerEnv(): ServerEnv {
  if (cachedEnv) return cachedEnv;

  const result = serverEnvSchema.safeParse({
    GEMINI_API_KEY: process.env.GEMINI_API_KEY,
    GEMINI_TEXT_MODEL: process.env.GEMINI_TEXT_MODEL,
    GEMINI_IMAGE_MODEL: process.env.GEMINI_IMAGE_MODEL,
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
    DAILY_TRIAL_CAP: process.env.DAILY_TRIAL_CAP,
    CRON_SECRET: process.env.CRON_SECRET,
    IP_HASH_SALT: process.env.IP_HASH_SALT,
    TURNSTILE_SECRET_KEY: process.env.TURNSTILE_SECRET_KEY,
    NEXT_PUBLIC_TURNSTILE_SITE_KEY: process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY,
  });

  if (!result.success) {
    // In dev or test environments when keys are missing, provide readable error or dummy dev values
    console.warn("Server environment warning:", result.error.format());
    return {
      GEMINI_API_KEY: process.env.GEMINI_API_KEY || "missing_gemini_key",
      GEMINI_TEXT_MODEL: process.env.GEMINI_TEXT_MODEL || "gemini-2.5-flash",
      GEMINI_IMAGE_MODEL: process.env.GEMINI_IMAGE_MODEL || "imagen-3.0-generate-002",
      NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
      NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
      DAILY_TRIAL_CAP: Number(process.env.DAILY_TRIAL_CAP || "50"),
      CRON_SECRET: process.env.CRON_SECRET || "contentsmith_cron_secret_default",
      IP_HASH_SALT: process.env.IP_HASH_SALT || "contentsmith_salt_2026",
      TURNSTILE_SECRET_KEY: process.env.TURNSTILE_SECRET_KEY,
      NEXT_PUBLIC_TURNSTILE_SITE_KEY: process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY,
    };
  }

  cachedEnv = result.data;
  return cachedEnv;
}
