-- ============================================
-- VERKSAMHETSRAPPORT.SE - INITIAL SCHEMA
-- ============================================

-- ============================================
-- ANVÄNDARE OCH ORGANISATIONER
-- ============================================

-- Utökar Supabase auth.users med profil
CREATE TABLE public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT,
    email TEXT UNIQUE NOT NULL,
    avatar_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Organisationer (tenants)
CREATE TABLE public.organizations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL, -- URL-vänligt namn
    org_type TEXT NOT NULL DEFAULT 'association',
    -- Möjliga värden: 'association' (förening), 'foundation' (stiftelse),
    -- 'cooperative' (kooperativ), 'company' (företag), 'municipality' (kommun),
    -- 'faith' (trossamfund), 'union' (fackförbund), 'other'
    sector TEXT, -- 'culture', 'sports', 'social', 'education', 'healthcare', 'other'
    description TEXT,
    logo_url TEXT,

    -- Stilprofil (genererad från referensdokument + onboarding)
    style_profile JSONB DEFAULT '{}',
    -- Struktur: {
    --   "tonality": "formal" | "semi-formal" | "conversational",
    --   "formality_score": 0.0-1.0,
    --   "avg_sentence_length": number,
    --   "vocabulary_level": "simple" | "professional" | "academic",
    --   "active_voice_preference": boolean,
    --   "custom_instructions": "fritext från användaren",
    --   "extracted_patterns": { ... } // AI-extraherade mönster från referensdokument
    -- }

    -- Prenumeration
    stripe_customer_id TEXT,
    subscription_plan TEXT DEFAULT 'free', -- 'free', 'bas', 'pro', 'enterprise'
    subscription_status TEXT DEFAULT 'active',
    reports_used_this_year INT DEFAULT 0,

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Koppling användare <-> organisation (many-to-many)
CREATE TABLE public.org_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    org_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    role TEXT NOT NULL DEFAULT 'member', -- 'owner', 'admin', 'member'
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, org_id)
);

-- ============================================
-- RAPPORTMALLAR
-- ============================================

-- Mallar som definierar rapportstruktur
CREATE TABLE public.report_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
    -- org_id NULL = global mall (tillhandahållen av oss)

    name TEXT NOT NULL, -- "Halvårsrapport", "Årsberättelse", "Verksamhetsplan"
    description TEXT,
    template_type TEXT NOT NULL DEFAULT 'annual_report',
    -- 'annual_report', 'semi_annual', 'activity_plan', 'board_report', 'custom'

    -- Sektionsdefinitioner (ordnade)
    sections JSONB NOT NULL DEFAULT '[]',
    -- Struktur: [
    --   {
    --     "id": "uuid",
    --     "title": "Sammanfattning",
    --     "level": 1,
    --     "description": "Kort sammanfattning av verksamhetsåret",
    --     "placeholder": "Beskriv kort årets viktigaste händelser...",
    --     "required": true,
    --     "parent_id": null,
    --     "order": 0,
    --     "ai_instructions": "Skriv en koncis sammanfattning på max 300 ord..."
    --   },
    --   {
    --     "id": "uuid",
    --     "title": "Ekonomi",
    --     "level": 1,
    --     "description": "Ekonomisk redovisning",
    --     "subsections": [
    --       { "id": "uuid", "title": "Intäkter", "level": 2, ... },
    --       { "id": "uuid", "title": "Kostnader", "level": 2, ... }
    --     ]
    --   }
    -- ]

    is_default BOOLEAN DEFAULT FALSE, -- Standardmall för organisationstypen
    is_global BOOLEAN DEFAULT FALSE, -- Tillgänglig för alla organisationer

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- RAPPORTER
-- ============================================

-- Sparade rapporter
CREATE TABLE public.reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    template_id UUID REFERENCES public.report_templates(id) ON DELETE SET NULL,
    created_by UUID NOT NULL REFERENCES public.profiles(id),

    title TEXT NOT NULL, -- "Verksamhetsberättelse 2025"
    report_year INT, -- 2025
    report_period TEXT, -- 'annual', 'h1', 'h2', 'q1', 'q2', 'q3', 'q4'
    status TEXT DEFAULT 'draft', -- 'draft', 'generating', 'review', 'final'

    -- Sektionsinnehåll (användarens input)
    sections_content JSONB DEFAULT '{}',
    -- Struktur: {
    --   "section-uuid-1": {
    --     "raw_input": "Användarens text...",
    --     "is_locked": false,
    --     "last_edited": "2025-01-15T10:30:00Z"
    --   },
    --   "section-uuid-2": { ... }
    -- }

    -- Genererat resultat
    generated_content TEXT, -- Hela den AI-genererade rapporten
    generated_sections JSONB DEFAULT '{}', -- Genererat per sektion
    generation_metadata JSONB DEFAULT '{}',
    -- Struktur: {
    --   "model": "claude-sonnet-4-5-20250929",
    --   "tokens_used": 15000,
    --   "chunks": 1,
    --   "processing_method": "single_pass",
    --   "generated_at": "2025-01-15T10:35:00Z",
    --   "generation_time_ms": 12000
    -- }

    -- PDF
    pdf_url TEXT, -- Supabase storage URL
    pdf_generated_at TIMESTAMPTZ,

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Versionshistorik för rapporter
CREATE TABLE public.report_versions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    report_id UUID NOT NULL REFERENCES public.reports(id) ON DELETE CASCADE,
    version_number INT NOT NULL,

    sections_content JSONB NOT NULL,
    generated_content TEXT,

    created_by UUID REFERENCES public.profiles(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),

    UNIQUE(report_id, version_number)
);

-- ============================================
-- REFERENSDOKUMENT
-- ============================================

-- Uppladdade referensdokument för stilanalys
CREATE TABLE public.reference_documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    uploaded_by UUID NOT NULL REFERENCES public.profiles(id),

    file_name TEXT NOT NULL,
    file_url TEXT NOT NULL, -- Supabase storage URL
    file_type TEXT NOT NULL, -- 'pdf', 'docx', 'txt'
    file_size_bytes INT,

    -- AI-extraherad stilanalys
    style_analysis JSONB DEFAULT '{}',
    -- Struktur: {
    --   "tonality": "semi-formal",
    --   "formality_score": 0.65,
    --   "avg_sentence_length": 18.5,
    --   "common_phrases": ["under verksamhetsåret", "styrelsen beslutade"],
    --   "section_patterns": [...],
    --   "vocabulary_characteristics": "...",
    --   "analysis_summary": "Texten präglas av..."
    -- }

    is_analyzed BOOLEAN DEFAULT FALSE,
    analyzed_at TIMESTAMPTZ,

    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- AI-ANVÄNDNING OCH LOGGNING
-- ============================================

CREATE TABLE public.ai_usage_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID NOT NULL REFERENCES public.organizations(id),
    report_id UUID REFERENCES public.reports(id),
    user_id UUID NOT NULL REFERENCES public.profiles(id),

    action TEXT NOT NULL, -- 'generate_report', 'analyze_reference', 'regenerate_section'
    model TEXT NOT NULL,
    tokens_input INT,
    tokens_output INT,
    cost_usd DECIMAL(10, 6),
    duration_ms INT,

    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.org_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.report_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reference_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.report_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_usage_log ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view own profile" ON public.profiles
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.profiles
    FOR UPDATE USING (auth.uid() = id);

-- Användare kan se organisationer de tillhör
CREATE POLICY "Users can view own orgs" ON public.organizations
    FOR SELECT USING (
        id IN (SELECT org_id FROM public.org_members WHERE user_id = auth.uid())
    );

CREATE POLICY "Users can update own orgs" ON public.organizations
    FOR UPDATE USING (
        id IN (SELECT org_id FROM public.org_members WHERE user_id = auth.uid() AND role IN ('owner', 'admin'))
    );

CREATE POLICY "Users can create orgs" ON public.organizations
    FOR INSERT WITH CHECK (true);

-- Org members policies
CREATE POLICY "Users can view org members" ON public.org_members
    FOR SELECT USING (
        org_id IN (SELECT org_id FROM public.org_members WHERE user_id = auth.uid())
    );

CREATE POLICY "Owners can manage org members" ON public.org_members
    FOR ALL USING (
        org_id IN (SELECT org_id FROM public.org_members WHERE user_id = auth.uid() AND role = 'owner')
    );

CREATE POLICY "Users can join orgs" ON public.org_members
    FOR INSERT WITH CHECK (user_id = auth.uid());

-- Användare kan se rapporter i sina organisationer
CREATE POLICY "Users can view org reports" ON public.reports
    FOR SELECT USING (
        org_id IN (SELECT org_id FROM public.org_members WHERE user_id = auth.uid())
    );

-- Användare kan skapa rapporter i sina organisationer
CREATE POLICY "Users can create org reports" ON public.reports
    FOR INSERT WITH CHECK (
        org_id IN (SELECT org_id FROM public.org_members WHERE user_id = auth.uid())
    );

-- Användare kan uppdatera rapporter i sina organisationer
CREATE POLICY "Users can update org reports" ON public.reports
    FOR UPDATE USING (
        org_id IN (SELECT org_id FROM public.org_members WHERE user_id = auth.uid())
    );

-- Användare kan radera rapporter i sina organisationer (owner/admin)
CREATE POLICY "Users can delete org reports" ON public.reports
    FOR DELETE USING (
        org_id IN (SELECT org_id FROM public.org_members WHERE user_id = auth.uid() AND role IN ('owner', 'admin'))
    );

-- Globala mallar kan ses av alla, organisationsmallar bara av medlemmar
CREATE POLICY "Users can view templates" ON public.report_templates
    FOR SELECT USING (
        is_global = TRUE OR
        org_id IN (SELECT org_id FROM public.org_members WHERE user_id = auth.uid())
    );

CREATE POLICY "Users can manage org templates" ON public.report_templates
    FOR ALL USING (
        org_id IN (SELECT org_id FROM public.org_members WHERE user_id = auth.uid() AND role IN ('owner', 'admin'))
    );

-- Reference documents policies
CREATE POLICY "Users can view org references" ON public.reference_documents
    FOR SELECT USING (
        org_id IN (SELECT org_id FROM public.org_members WHERE user_id = auth.uid())
    );

CREATE POLICY "Users can upload references" ON public.reference_documents
    FOR INSERT WITH CHECK (
        org_id IN (SELECT org_id FROM public.org_members WHERE user_id = auth.uid())
    );

CREATE POLICY "Users can delete org references" ON public.reference_documents
    FOR DELETE USING (
        org_id IN (SELECT org_id FROM public.org_members WHERE user_id = auth.uid() AND role IN ('owner', 'admin'))
    );

-- Report versions policies
CREATE POLICY "Users can view report versions" ON public.report_versions
    FOR SELECT USING (
        report_id IN (
            SELECT id FROM public.reports
            WHERE org_id IN (SELECT org_id FROM public.org_members WHERE user_id = auth.uid())
        )
    );

CREATE POLICY "Users can create report versions" ON public.report_versions
    FOR INSERT WITH CHECK (
        report_id IN (
            SELECT id FROM public.reports
            WHERE org_id IN (SELECT org_id FROM public.org_members WHERE user_id = auth.uid())
        )
    );

-- AI usage log policies
CREATE POLICY "Users can view org ai usage" ON public.ai_usage_log
    FOR SELECT USING (
        org_id IN (SELECT org_id FROM public.org_members WHERE user_id = auth.uid() AND role IN ('owner', 'admin'))
    );

CREATE POLICY "System can insert ai usage" ON public.ai_usage_log
    FOR INSERT WITH CHECK (true);

-- ============================================
-- TRIGGERS
-- ============================================

-- Uppdatera updated_at automatiskt
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_organizations_updated_at
    BEFORE UPDATE ON public.organizations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_reports_updated_at
    BEFORE UPDATE ON public.reports
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_report_templates_updated_at
    BEFORE UPDATE ON public.report_templates
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- INDEXES
-- ============================================

CREATE INDEX idx_org_members_user_id ON public.org_members(user_id);
CREATE INDEX idx_org_members_org_id ON public.org_members(org_id);
CREATE INDEX idx_reports_org_id ON public.reports(org_id);
CREATE INDEX idx_reports_created_by ON public.reports(created_by);
CREATE INDEX idx_reports_status ON public.reports(status);
CREATE INDEX idx_report_templates_org_id ON public.report_templates(org_id);
CREATE INDEX idx_report_templates_is_global ON public.report_templates(is_global);
CREATE INDEX idx_reference_documents_org_id ON public.reference_documents(org_id);
CREATE INDEX idx_report_versions_report_id ON public.report_versions(report_id);
CREATE INDEX idx_ai_usage_log_org_id ON public.ai_usage_log(org_id);

-- ============================================
-- FUNCTION: Skapa profil vid ny användare
-- ============================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, email, full_name)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', '')
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger som körs när ny användare registreras
CREATE OR REPLACE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
