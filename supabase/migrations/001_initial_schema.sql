-- ContentSmith Initial Database Schema & RLS Policies
-- Target: Supabase Postgres

-- 1. SETTINGS & KILL SWITCH
CREATE TABLE IF NOT EXISTS public.settings (
    key TEXT PRIMARY KEY,
    value JSONB NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    updated_by TEXT
);

-- Default settings seed
INSERT INTO public.settings (key, value) VALUES
('kill_switch_enabled', 'false'::jsonb),
('daily_trial_cap', '50'::jsonb),
('allowed_admin_emails', '["admin@contentsmith.ng", "owner@contentsmith.ng", "olukoya@contentsmith.ng"]'::jsonb),
('maintenance_message', '"ContentSmith generation is briefly paused for routine system maintenance. Please check back shortly."'::jsonb)
ON CONFLICT (key) DO NOTHING;

-- 2. IP RATE LIMITS
CREATE TABLE IF NOT EXISTS public.ip_rate_limits (
    ip_hash TEXT NOT NULL,
    window_type TEXT NOT NULL, -- 'daily' or 'weekly'
    window_start TIMESTAMPTZ NOT NULL,
    request_count INT DEFAULT 1,
    PRIMARY KEY (ip_hash, window_type, window_start)
);
CREATE INDEX IF NOT EXISTS idx_ip_limits_hash ON public.ip_rate_limits(ip_hash);

-- 3. ASSETS (Storage references)
CREATE TABLE IF NOT EXISTS public.trial_assets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    trial_id UUID,
    asset_type TEXT NOT NULL CHECK (asset_type IN ('logo', 'product', 'reference', 'post_image_feed', 'post_image_story', 'post_composite')),
    storage_path TEXT NOT NULL,
    file_size INT NOT NULL,
    mime_type TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '48 hours')
);
CREATE INDEX IF NOT EXISTS idx_trial_assets_trial ON public.trial_assets(trial_id);
CREATE INDEX IF NOT EXISTS idx_trial_assets_expires ON public.trial_assets(expires_at);

-- 4. TRIALS
CREATE TABLE IF NOT EXISTS public.trials (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    short_slug TEXT UNIQUE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '48 hours'),
    ip_hash TEXT NOT NULL,
    business_name TEXT NOT NULL,
    offering TEXT NOT NULL,
    city TEXT NOT NULL,
    audience TEXT NOT NULL,
    tone TEXT NOT NULL,
    whatsapp_number TEXT,
    logo_asset_id UUID REFERENCES public.trial_assets(id) ON DELETE SET NULL,
    product_asset_ids UUID[] DEFAULT '{}',
    reference_asset_ids UUID[] DEFAULT '{}',
    identity_card JSONB,
    status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'identity_ready', 'plan_ready', 'generating', 'completed', 'failed', 'expired')),
    failure_reason TEXT
);
CREATE INDEX IF NOT EXISTS idx_trials_slug ON public.trials(short_slug);
CREATE INDEX IF NOT EXISTS idx_trials_expires ON public.trials(expires_at);

-- 5. TRIAL POSTS (7 Posts per trial)
CREATE TABLE IF NOT EXISTS public.trial_posts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    trial_id UUID NOT NULL REFERENCES public.trials(id) ON DELETE CASCADE,
    day_index INT NOT NULL CHECK (day_index BETWEEN 1 AND 7),
    day_name TEXT NOT NULL DEFAULT 'Monday',
    pillar TEXT NOT NULL,
    objective TEXT NOT NULL,
    hook TEXT NOT NULL,
    caption TEXT NOT NULL,
    cta TEXT NOT NULL,
    layout_archetype TEXT NOT NULL CHECK (layout_archetype IN (
        'typographic_poster',
        'product_hero_offset',
        'split_panel',
        'testimonial_card',
        'price_menu_list',
        'announcement',
        'before_after'
    )),
    feed_asset_id UUID REFERENCES public.trial_assets(id) ON DELETE SET NULL,
    story_asset_id UUID REFERENCES public.trial_assets(id) ON DELETE SET NULL,
    generation_status TEXT NOT NULL DEFAULT 'queued' CHECK (generation_status IN ('queued', 'generating', 'ready', 'failed')),
    retry_count INT DEFAULT 0,
    quality_gate_findings JSONB,
    error_message TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(trial_id, day_index)
);
CREATE INDEX IF NOT EXISTS idx_trial_posts_trial ON public.trial_posts(trial_id);

-- 6. LEADS
CREATE TABLE IF NOT EXISTS public.leads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    trial_id UUID REFERENCES public.trials(id) ON DELETE SET NULL,
    business_name TEXT NOT NULL,
    whatsapp_number TEXT NOT NULL,
    source TEXT NOT NULL DEFAULT 'try_result_cta',
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. EXAMPLES
CREATE TABLE IF NOT EXISTS public.examples (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    industry TEXT NOT NULL,
    platform TEXT NOT NULL,
    image_url TEXT NOT NULL,
    caption TEXT NOT NULL,
    maker_credit TEXT NOT NULL,
    why_it_works TEXT NOT NULL,
    consent_flag BOOLEAN NOT NULL DEFAULT true,
    is_published BOOLEAN NOT NULL DEFAULT false,
    display_order INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_examples_published ON public.examples(is_published, display_order);

-- 8. EXAMPLE SUBMISSIONS
CREATE TABLE IF NOT EXISTS public.example_submissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_name TEXT NOT NULL,
    submitter_name TEXT NOT NULL,
    contact_info TEXT NOT NULL,
    industry TEXT NOT NULL,
    platform TEXT NOT NULL,
    image_url TEXT NOT NULL,
    caption TEXT,
    notes TEXT,
    consent_agreed BOOLEAN NOT NULL CHECK (consent_agreed = true),
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    reviewed_at TIMESTAMPTZ,
    reviewed_by TEXT
);

-- 9. DESIGNER REQUESTS
CREATE TABLE IF NOT EXISTS public.designer_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_name TEXT NOT NULL,
    preferred_direction TEXT NOT NULL,
    rejected_directions TEXT NOT NULL,
    deadline TEXT NOT NULL,
    whatsapp_number TEXT NOT NULL,
    trial_id UUID REFERENCES public.trials(id) ON DELETE SET NULL,
    reference_asset_urls TEXT[] DEFAULT '{}',
    status TEXT NOT NULL DEFAULT 'submitted' CHECK (status IN ('submitted', 'reviewing', 'in_progress', 'delivered')),
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 10. USAGE LOG
CREATE TABLE IF NOT EXISTS public.usage_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    trial_id UUID REFERENCES public.trials(id) ON DELETE SET NULL,
    call_type TEXT NOT NULL CHECK (call_type IN ('identity_vision', 'week_plan_text', 'image_generation', 'quality_gate_vision')),
    model_name TEXT NOT NULL,
    prompt_tokens INT DEFAULT 0,
    candidate_tokens INT DEFAULT 0,
    total_tokens INT DEFAULT 0,
    estimated_cost_usd NUMERIC(8, 5) DEFAULT 0,
    duration_ms INT NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('success', 'failed')),
    error_details TEXT,
    ip_hash TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_usage_log_created ON public.usage_log(created_at);

-- ROW LEVEL SECURITY (RLS)
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ip_rate_limits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trial_assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trials ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trial_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.examples ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.example_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.designer_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.usage_log ENABLE ROW LEVEL SECURITY;

-- Helper function: is current user an allowed admin?
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
DECLARE
    allowed_list JSONB;
BEGIN
    IF auth.role() <> 'authenticated' THEN
        RETURN FALSE;
    END IF;
    SELECT value INTO allowed_list FROM public.settings WHERE key = 'allowed_admin_emails';
    IF allowed_list IS NULL THEN
        RETURN FALSE;
    END IF;
    RETURN allowed_list ? auth.jwt() ->> 'email';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- RLS Policies
CREATE POLICY "Public read unexpired trial" ON public.trials FOR SELECT USING (expires_at > NOW());
CREATE POLICY "Admin manage trials" ON public.trials FOR ALL USING (public.is_admin());

CREATE POLICY "Public read unexpired trial posts" ON public.trial_posts FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.trials t WHERE t.id = trial_posts.trial_id AND t.expires_at > NOW())
);
CREATE POLICY "Admin manage trial posts" ON public.trial_posts FOR ALL USING (public.is_admin());

CREATE POLICY "Public read unexpired assets" ON public.trial_assets FOR SELECT USING (expires_at > NOW());
CREATE POLICY "Admin manage assets" ON public.trial_assets FOR ALL USING (public.is_admin());

CREATE POLICY "Public view published examples" ON public.examples FOR SELECT USING (is_published = true);
CREATE POLICY "Admin manage all examples" ON public.examples FOR ALL USING (public.is_admin());

CREATE POLICY "Public submit examples" ON public.example_submissions FOR INSERT WITH CHECK (consent_agreed = true);
CREATE POLICY "Admin manage submissions" ON public.example_submissions FOR ALL USING (public.is_admin());

CREATE POLICY "Public submit designer request" ON public.designer_requests FOR INSERT WITH CHECK (true);
CREATE POLICY "Admin manage designer requests" ON public.designer_requests FOR ALL USING (public.is_admin());

CREATE POLICY "Admin manage leads" ON public.leads FOR ALL USING (public.is_admin());
CREATE POLICY "Admin manage usage_log" ON public.usage_log FOR ALL USING (public.is_admin());
CREATE POLICY "Admin manage settings" ON public.settings FOR ALL USING (public.is_admin());
CREATE POLICY "Admin manage ip limits" ON public.ip_rate_limits FOR ALL USING (public.is_admin());
