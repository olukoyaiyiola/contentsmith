function getCleanEnvKey(keyName: string): string | undefined {
  const val = process.env[keyName];
  if (!val) return undefined;
  const trimmed = val.trim().replace(/^["']|["']$/g, '');
  return trimmed.length > 0 ? trimmed : undefined;
}

export interface ServerEnv {
  GEMINI_API_KEY: string;
  isGeminiKeyConfigured: boolean;
  GEMINI_TEXT_MODEL: string;
  GEMINI_IMAGE_MODEL: string;
  OPENROUTER_API_KEY: string;
  isOpenRouterConfigured: boolean;
  OPENROUTER_IMAGE_MODEL: string;
  IMAGE_PROVIDER: 'gemini' | 'openrouter' | 'auto';
  NEXT_PUBLIC_SUPABASE_URL?: string;
  NEXT_PUBLIC_SUPABASE_ANON_KEY?: string;
  SUPABASE_SERVICE_ROLE_KEY?: string;
  DAILY_TRIAL_CAP: number;
  CRON_SECRET: string;
  IP_HASH_SALT: string;
  TURNSTILE_SECRET_KEY?: string;
  NEXT_PUBLIC_TURNSTILE_SITE_KEY?: string;
}

export function getServerEnv(): ServerEnv {
  // Check common environment variable aliases for Gemini / Google AI Studio API key
  const rawGeminiKey = 
    getCleanEnvKey("GEMINI_API_KEY") ||
    getCleanEnvKey("GOOGLE_API_KEY") ||
    getCleanEnvKey("GOOGLE_GENAI_API_KEY") ||
    getCleanEnvKey("GEMINI_KEY") ||
    "";

  // Check OpenRouter API key for Qwen image generation
  const rawOpenRouterKey =
    getCleanEnvKey("OPENROUTER_API_KEY") ||
    getCleanEnvKey("OPENROUTER_KEY") ||
    "";

  const isGeminiConfigured = rawGeminiKey.length > 0 && rawGeminiKey !== "missing_gemini_key";
  const isOpenRouterConfigured = rawOpenRouterKey.length > 0;

  const rawImageProvider = (getCleanEnvKey("IMAGE_PROVIDER") || "auto").toLowerCase();
  const imageProvider = (
    rawImageProvider === 'openrouter' || rawImageProvider === 'qwen'
      ? 'openrouter'
      : rawImageProvider === 'gemini'
      ? 'gemini'
      : 'auto'
  ) as 'gemini' | 'openrouter' | 'auto';

  return {
    GEMINI_API_KEY: isGeminiConfigured ? rawGeminiKey : "",
    isGeminiKeyConfigured: isGeminiConfigured,
    GEMINI_TEXT_MODEL: getCleanEnvKey("GEMINI_TEXT_MODEL") || "gemini-3.8-flash",
    GEMINI_IMAGE_MODEL: getCleanEnvKey("GEMINI_IMAGE_MODEL") || "imagen-3.0-generate-002",
    OPENROUTER_API_KEY: rawOpenRouterKey,
    isOpenRouterConfigured,
    OPENROUTER_IMAGE_MODEL: getCleanEnvKey("OPENROUTER_IMAGE_MODEL") || "qwen/qwen-image-3",
    IMAGE_PROVIDER: imageProvider,
    NEXT_PUBLIC_SUPABASE_URL: getCleanEnvKey("NEXT_PUBLIC_SUPABASE_URL"),
    NEXT_PUBLIC_SUPABASE_ANON_KEY: getCleanEnvKey("NEXT_PUBLIC_SUPABASE_ANON_KEY"),
    SUPABASE_SERVICE_ROLE_KEY: getCleanEnvKey("SUPABASE_SERVICE_ROLE_KEY"),
    DAILY_TRIAL_CAP: Number(getCleanEnvKey("DAILY_TRIAL_CAP") || "50"),
    CRON_SECRET: getCleanEnvKey("CRON_SECRET") || "contentsmith_cron_secret_default",
    IP_HASH_SALT: getCleanEnvKey("IP_HASH_SALT") || "contentsmith_salt_2026",
    TURNSTILE_SECRET_KEY: getCleanEnvKey("TURNSTILE_SECRET_KEY"),
    NEXT_PUBLIC_TURNSTILE_SITE_KEY: getCleanEnvKey("NEXT_PUBLIC_TURNSTILE_SITE_KEY"),
  };
}
