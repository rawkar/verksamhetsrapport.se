# Verksamhetsrapport.se – Komplett Projektplan

> **Syfte:** Transformera den befintliga TRS Rapport-generatorn från ett internt TRS-verktyg till en generell, multi-tenant SaaS-produkt där organisationer av alla typer kan skapa professionella verksamhetsberättelser och rapporter med AI-stöd.
>
> **Produktnamn:** Verksamhetsrapport.se
>
> **Domän:** verksamhetsrapport.se
> **Supabase-projekt:** `thhiewxmaskywgffizps`
> **Supabase URL:** `https://thhiewxmaskywgffizps.supabase.co`
> **Supabase Dashboard:** https://supabase.com/dashboard/project/thhiewxmaskywgffizps
> **Databas:** `postgresql://postgres:[YOUR-PASSWORD]@db.thhiewxmaskywgffizps.supabase.co:5432/postgres`
>
> **Denna fil är din kompletta instruktionsmanual för Claude Code.** Varje fas, uppgift och fil är beskriven med tillräcklig detalj för att kunna implementeras steg för steg.

---

## INNEHÅLLSFÖRTECKNING

1. [Projektöversikt](#1-projektöversikt)
2. [Nulägesanalys – befintlig kodbas](#2-nulägesanalys--befintlig-kodbas)
3. [Målarkitektur](#3-målarkitektur)
4. [Teknikval och motiveringar](#4-teknikval-och-motiveringar)
5. [Databasschema](#5-databasschema)
6. [Fas 1 – Grundombyggnad och multi-tenancy](#6-fas-1--grundombyggnad-och-multi-tenancy)
7. [Fas 2 – Stilanpassning och referensdokument](#7-fas-2--stilanpassning-och-referensdokument)
8. [Fas 3 – Betalning och användarhantering](#8-fas-3--betalning-och-användarhantering)
9. [Fas 4 – PDF-export och output](#9-fas-4--pdf-export-och-output)
10. [Fas 5 – Mallbibliotek och onboarding](#10-fas-5--mallbibliotek-och-onboarding)
11. [Fas 6 – Dashboard, historik och versioner](#11-fas-6--dashboard-historik-och-versioner)
12. [Fas 7 – Lansering, hosting och DevOps](#12-fas-7--lansering-hosting-och-devops)
13. [API-design](#13-api-design)
14. [Frontend-arkitektur](#14-frontend-arkitektur)
15. [AI-promptarkitektur](#15-ai-promptarkitektur)
16. [Säkerhet](#16-säkerhet)
17. [Testplan](#17-testplan)
18. [Migreringsplan från befintlig kodbas](#18-migreringsplan-från-befintlig-kodbas)
19. [Filstruktur – komplett målbild](#19-filstruktur--komplett-målbild)
20. [Implementeringsordning för Claude Code](#20-implementeringsordning-för-claude-code)

---

## 1. PROJEKTÖVERSIKT

### 1.1 Vision

En webbaserad SaaS-tjänst på **verksamhetsrapport.se** där svenska organisationer (föreningar, stiftelser, kooperativ, småföretag, kommunala bolag etc.) kan generera professionella verksamhetsberättelser och rapporter. Tjänsten lär sig varje organisations tonalitet, struktur och stil, och blir bättre för varje rapport som genereras.

### 1.2 Kärnvärde

- **Tid:** Minskar arbetstiden för en verksamhetsberättelse från veckor till timmar
- **Kvalitet:** Konsekvent, professionellt språk anpassat till organisationens röst
- **Tillgänglighet:** Ingen teknisk kompetens krävs – guidat formulär med AI-stöd
- **Inlåsning:** Ju längre en organisation använder tjänsten, desto bättre resultat (ackumulerad stildata)

### 1.3 Målgrupper (prioritetsordning)

1. **Ideella föreningar** – Största volymen, lägst betalningsvilja, behöver enklast möjliga UX
2. **Stiftelser** – Lagkrav på verksamhetsberättelse, högre betalningsvilja
3. **Arbetsgivarorganisationer/branschförbund** – Komplexa rapporter, hög betalningsvilja
4. **Små kommunala bolag** – Formella krav, medelhög betalningsvilja
5. **Småföretag med rapporteringsbehov** – Årsredovisningens narrativa delar

### 1.4 Affärsmodell

| Plan | Pris/mån | Rapporter/år | Funktioner |
|------|----------|-------------|------------|
| **Gratis** | 0 kr | 1 rapport | Grundmallar, ingen PDF-export, vattenstämpel |
| **Bas** | 299 kr | 5 rapporter | Anpassade mallar, PDF-export, referensuppladdning |
| **Pro** | 799 kr | Obegränsat | Allt i Bas + team (3 användare), versionshistorik, prioriterad support |
| **Enterprise** | 1 999 kr | Obegränsat | Allt i Pro + obegränsade team, API-åtkomst, custom branding |

Alternativ: **Per rapport-prissättning** för föreningar: 499 kr/rapport utan prenumeration.

---

## 2. NULÄGESANALYS – BEFINTLIG KODBAS

### 2.1 Vad som finns idag

```
TRS Rapport/
├── index.html          (360 rader) – Hårdkodad HTML med 13 TRS-sektioner
├── script.js           (1413 rader) – Vanilla JS, TRSReportGenerator-klass
├── styles.css          (1081 rader) – TRS-brandade stilar
├── server.js           (707 rader) – Express backend med OpenAI-integration
├── package.json        – express, cors, dotenv, tiktoken
├── Referens/           – TRS verksamhetsrapport som referensdokument
├── env.example
├── start-server.bat
└── start-server.sh
```

### 2.2 Befintliga klasser och deras status

#### Backend (server.js)
| Klass | Funktion | Återanvändbar? | Anpassning krävs |
|-------|----------|---------------|-------------------|
| `TokenCounter` | Räknar tokens med tiktoken | ✅ Ja, direkt | Ingen |
| `DocumentChunker` | Delar upp stora dokument i chunks | ✅ Ja, direkt | Minimal – parametrisera maxTokensPerChunk |
| `ServerPromptManager` | Hanterar system/user prompts | ⚠️ Delvis | Måste bli dynamisk per organisation istället för hårdkodad TRS-prompt |
| `OpenAIClient` | API-anrop med retry och backoff | ✅ Ja, direkt | Byt till Claude API (Anthropic) eller behåll OpenAI som valbart |

#### Frontend (script.js)
| Klass/funktion | Funktion | Återanvändbar? | Anpassning krävs |
|----------------|----------|---------------|-------------------|
| `TRSReportGenerator` | Huvudklass, allt i en | ⚠️ Delvis | Måste brytas upp i moduler |
| `PromptManager` | Klient-side prompt | ❌ Nej | Flytta helt till backend |
| `initializeSectionData()` | Hårdkodade TRS-sektioner | ❌ Nej | Ersätt med dynamisk data från API |
| Spara/lås-logik | `saveAndLockField()`, `unlockField()` | ✅ Ja | Koppla till databas istället för localStorage |
| Autosave | `handleAutosave()`, localStorage | ⚠️ Koncept | Byt från localStorage till databas med debounce |
| Drag & drop | SortableJS-integration | ✅ Ja | Behåll, spara ordning i databas |
| Progress tracking | `simulateProgress()` etc. | ✅ Ja | Behåll |
| `collectAllContent()` | Samlar textfält → objekt | ⚠️ Delvis | Anpassa för dynamiska sektioner |

### 2.3 Hårdkodade TRS-beroenden som måste abstraheras

1. **`initializeSectionData()`** (script.js rad 125-146) – 18 hårdkodade sektioner med TRS-specifika titlar
2. **`ServerPromptManager.systemPrompt`** (server.js rad 174-212) – TRS-specifik systemprompt
3. **`ServerPromptManager.userPromptTemplate`** (server.js rad 214-220) – TRS-specifik user prompt
4. **`setDefaultFieldOrder()`** (script.js rad 726-747) – Hårdkodad ordning
5. **`index.html`** (rad 55-314) – 13 hårdkodade sektionsblock
6. **`styles.css`** (rad 1-29) – TRS brand colors (behåll som default-tema men gör konfigurerbart)

---

## 3. MÅLARKITEKTUR

```
┌─────────────────────────────────────────────────────────┐
│                    FRONTEND (Next.js)                    │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌────────┐  │
│  │ Landing  │  │ Dashboard│  │ Report   │  │Settings│  │
│  │ Page     │  │          │  │ Editor   │  │        │  │
│  └──────────┘  └──────────┘  └──────────┘  └────────┘  │
└───────────────────────┬─────────────────────────────────┘
                        │ API calls
┌───────────────────────▼─────────────────────────────────┐
│                 BACKEND (Next.js API Routes)             │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌────────┐  │
│  │ Auth     │  │ Report   │  │ AI       │  │Payment │  │
│  │ Routes   │  │ Routes   │  │ Routes   │  │Routes  │  │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘  └───┬────┘  │
│       │              │             │             │       │
│  ┌────▼─────────────▼─────────────▼─────────────▼────┐  │
│  │              Service Layer                         │  │
│  │  ┌────────────┐ ┌────────────┐ ┌───────────────┐  │  │
│  │  │OrgService  │ │ReportSvc   │ │AIService      │  │  │
│  │  │            │ │            │ │ ┌───────────┐  │  │  │
│  │  │            │ │            │ │ │TokenCount │  │  │  │
│  │  │            │ │            │ │ │DocChunker │  │  │  │
│  │  │            │ │            │ │ │PromptBuild│  │  │  │
│  │  │            │ │            │ │ │LLMClient  │  │  │  │
│  │  │            │ │            │ │ └───────────┘  │  │  │
│  │  └────────────┘ └────────────┘ └───────────────┘  │  │
│  └───────────────────────┬───────────────────────────┘  │
└──────────────────────────┼──────────────────────────────┘
                           │
         ┌─────────────────┼─────────────────┐
         │                 │                 │
    ┌────▼────┐     ┌──────▼──────┐   ┌──────▼──────┐
    │Supabase │     │Anthropic API│   │  Stripe     │
    │(Postgres│     │(Claude)     │   │             │
    │+ Auth   │     │             │   │             │
    │+ Storage│     │+ OpenAI     │   │             │
    │)        │     │ (fallback)  │   │             │
    └─────────┘     └─────────────┘   └─────────────┘
```

---

## 4. TEKNIKVAL OCH MOTIVERINGAR

### 4.1 Frontend: Next.js 14 (App Router)

**Varför Next.js istället för att bygga vidare på vanilla JS:**
- SSR/SSG för landningssidan (SEO, prestanda)
- Inbyggda API routes (ingen separat Express-server behövs)
- React-ekosystem (komponentbibliotek, state management)
- Vercel-hosting med zero-config deploy
- TypeScript-stöd

**Varför inte bygga vidare på befintlig vanilla JS:**
- 1413 rader i en enda fil (script.js) utan modulstruktur
- localStorage-baserad state som inte skalar till multi-tenant
- Hårdkodad HTML som inte kan genereras dynamiskt
- Inget routing-system

### 4.2 Backend: Next.js API Routes + Supabase

**Supabase (PostgreSQL + Auth + Storage):**
- Gratis tier räcker för MVP (50 000 monthly active users, 500 MB databas)
- Inbyggd auth med magic link, Google, GitHub
- Row Level Security (RLS) för multi-tenancy
- Storage för referensdokument och genererade PDFs
- Realtime-subscriptions om vi vill ha samarbetsfunktioner senare

### 4.3 AI: Anthropic Claude API (primärt) + OpenAI (sekundärt)

**Varför byta från OpenAI till Claude som primärt:**
- 200K context window (vs 128K för GPT-4o)
- Starkare på svenska text och nyanser
- Bättre på att följa komplexa instruktioner (systempromptar)
- Lägre kostnad per token

**Behåll OpenAI som fallback:**
- Om Claude API är nere
- Om kunden föredrar det (Enterprise-plan)

### 4.4 UI-komponenter: shadcn/ui + Tailwind CSS

- shadcn/ui – Inte ett beroende utan kopierade komponenter, full kontroll
- Tailwind CSS – Utility-first, fungerar utmärkt med Next.js
- Behåll TRS-färgpalett som default-tema i CSS variables

### 4.5 PDF-generering: Puppeteer eller @react-pdf/renderer

- **Puppeteer** (headless Chrome) för pixel-perfekt PDF från HTML-mall
- Alternativt `@react-pdf/renderer` för enklare, snabbare PDFs
- Rekommendation: Börja med `@react-pdf/renderer` i MVP, byt till Puppeteer om kvaliteten inte räcker

### 4.6 Betalning: Stripe

- Standard för SaaS i Sverige
- Hanterar SEK, prenumerationer, engångsköp
- Stripe Checkout för snabb implementation
- Webhooks för att synka betalstatus med Supabase

---

## 5. DATABASSCHEMA

### 5.1 Tabeller

```sql
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

ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.org_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.report_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reference_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.report_versions ENABLE ROW LEVEL SECURITY;

-- Användare kan se organisationer de tillhör
CREATE POLICY "Users can view own orgs" ON public.organizations
    FOR SELECT USING (
        id IN (SELECT org_id FROM public.org_members WHERE user_id = auth.uid())
    );

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

-- Globala mallar kan ses av alla, organisationsmallar bara av medlemmar
CREATE POLICY "Users can view templates" ON public.report_templates
    FOR SELECT USING (
        is_global = TRUE OR
        org_id IN (SELECT org_id FROM public.org_members WHERE user_id = auth.uid())
    );
```

### 5.2 Supabase Storage Buckets

```
reference-documents/   – Uppladdade referensdokument (privat)
  └── {org_id}/{file_name}

generated-pdfs/        – Genererade PDF-rapporter (privat)
  └── {org_id}/{report_id}/{version}.pdf

org-logos/             – Organisationslogotyper (publikt)
  └── {org_id}/logo.{ext}
```

---

## 6. FAS 1 – GRUNDOMBYGGNAD OCH MULTI-TENANCY

> **Mål:** Skapa projektstrukturen, sätta upp Next.js, Supabase, auth, och bygga den dynamiska rapportredigeraren som ersätter den hårdkodade TRS-versionen.
>
> **Uppskattad tid:** 2-3 veckor
>
> **Beroenden:** Ingen (startfas)

### 6.1 Projektinitialisering

```bash
# Skapa Next.js-projektet
npx create-next-app@latest verksamhetsrapport --typescript --tailwind --eslint --app --src-dir

# Installera beroenden
cd verksamhetsrapport
npm install @supabase/supabase-js @supabase/ssr
npm install @anthropic-ai/sdk openai
npm install tiktoken
npm install sortablejs
npm install lucide-react
npm install zod
npm install -D @types/sortablejs
```

### 6.2 Uppgifter (i ordning)

#### 6.2.1 – Sätt upp Supabase-projekt

1. Skapa nytt Supabase-projekt på supabase.com
2. Kör SQL-schemat från [sektion 5.1](#51-tabeller) i Supabase SQL Editor
3. Skapa storage buckets: `reference-documents`, `generated-pdfs`, `org-logos`
4. Aktivera auth providers: Email (magic link), Google
5. Skapa `.env.local`:

```env
# ============================================
# SUPABASE
# ============================================
NEXT_PUBLIC_SUPABASE_URL=https://thhiewxmaskywgffizps.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_zQziHWoLZ3OIFQs4_uOmVA_-30EbI4-
SUPABASE_SERVICE_ROLE_KEY=<hämta från Supabase Dashboard → Settings → API → service_role>
DATABASE_URL=postgresql://postgres:[YOUR-PASSWORD]@db.thhiewxmaskywgffizps.supabase.co:5432/postgres

# ============================================
# AI
# ============================================
ANTHROPIC_API_KEY=<din Anthropic API-nyckel>
OPENAI_API_KEY=<din OpenAI API-nyckel>

# ============================================
# STRIPE (lägg till i Fas 3)
# ============================================
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...

# ============================================
# APP
# ============================================
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_APP_DOMAIN=verksamhetsrapport.se
```

> **SÄKERHET:** Lägg ALDRIG `.env.local` i Git. Se till att `.gitignore` innehåller `.env.local`.
> Service role-nyckeln hämtar du från: Supabase Dashboard → Settings → API → Under "Project API keys" → `service_role` (dold bakom "Reveal").

#### 6.2.2 – Supabase-klientkonfiguration

Skapa `src/lib/supabase/`:

**`src/lib/supabase/client.ts`** – Browserklient
```typescript
import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
```

**`src/lib/supabase/server.ts`** – Serverklient (för API routes och Server Components)

> **Supabase-projekt:** `thhiewxmaskywgffizps` (region: EU)
> **Dashboard:** https://supabase.com/dashboard/project/thhiewxmaskywgffizps

```typescript
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function createServerSupabaseClient() {
  const cookieStore = await cookies()
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll() },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options)
          })
        },
      },
    }
  )
}
```

**`src/lib/supabase/admin.ts`** – Admin-klient (service role, för server-side operationer)
```typescript
import { createClient } from '@supabase/supabase-js'

export const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)
```

#### 6.2.3 – Auth-flöde

**`src/app/login/page.tsx`** – Inloggningssida med magic link + Google

**`src/app/auth/callback/route.ts`** – Auth callback som:
1. Bekräftar auth-token
2. Skapar `profiles`-rad om den inte finns (trigger i Supabase eller i callback)
3. Redirectar till dashboard

**`src/middleware.ts`** – Skyddar routes som kräver inloggning:
- `/dashboard/*` → Kräver auth
- `/report/*` → Kräver auth
- `/settings/*` → Kräver auth
- `/` → Publik (landningssida)
- `/login` → Publik

#### 6.2.4 – Organisationsskapande (onboarding)

**`src/app/onboarding/page.tsx`** – Stegvis onboarding efter första inloggning:

**Steg 1: Organisationstyp**
- Visa visuella kort för varje organisationstyp (förening, stiftelse, kooperativ, företag etc.)
- Val av sektor (kultur, idrott, social omsorg, utbildning etc.)

**Steg 2: Grunduppgifter**
- Organisationens namn
- Kort beskrivning (valfritt)
- Logotyp (valfritt)

**Steg 3: Tonalitet**
- Visa 3-4 textexempel med olika tonalitet och be användaren ranka vilken som "låter mest som er"
- Exempel A: Formell stiftelseton ("Styrelsen konstaterar att verksamhetsåret...")
- Exempel B: Semi-formell ("Under 2025 har vi sett en positiv utveckling...")
- Exempel C: Samtalslik ("Vi har haft ett spännande år med massor av aktiviteter...")
- Spara som `style_profile.tonality` och `style_profile.formality_score`

**Steg 4: Referensdokument (valfritt)**
- "Har ni en tidigare verksamhetsberättelse? Ladda upp den så lär vi oss er stil."
- Acceptera PDF, DOCX
- Upload till Supabase Storage → starta stilanalys (Fas 2)

**Steg 5: Välj rapportmall**
- Visa föreslagna mallar baserat på organisationstyp
- Möjlighet att anpassa sektioner direkt

Vid slutförande:
1. Skapa `organizations`-rad
2. Skapa `org_members`-rad (role: 'owner')
3. Skapa `report_templates`-rad (anpassad eller från global mall)
4. Redirect till `/dashboard`

#### 6.2.5 – Dashboard

**`src/app/dashboard/page.tsx`**

- Lista organisationens rapporter (senaste först)
- "Skapa ny rapport"-knapp
- Snabbstatistik: antal rapporter, plan, rapporter kvar

#### 6.2.6 – Rapportredigeraren (KÄRNAN)

**`src/app/report/[id]/page.tsx`** – Huvudsidan för att redigera en rapport

Denna komponent ersätter hela `index.html` + `script.js` men återanvänder koncepten:

**Komponenter att bygga:**

```
src/components/report/
├── ReportEditor.tsx          – Huvudcontainer (ersätter TRSReportGenerator)
├── SectionField.tsx          – Enstaka sektion med textarea, spara/lås etc.
│                               (ersätter den upprepade HTML-strukturen)
├── SectionList.tsx           – Lista av sektioner med drag & drop (SortableJS)
├── SectionToolbar.tsx        – Spara/lås/rensa/radera-knappar per sektion
├── AddSectionButton.tsx      – Lägg till ny sektion
├── GenerateButton.tsx        – Generera rapport-knapp med progress
├── ProgressModal.tsx         – Progress-modal under generering
├── ReportOutput.tsx          – Visar genererad rapport
├── ReportMetadata.tsx        – Genereringsinfo (tokens, chunks etc.)
└── PromptSettings.tsx        – AI-promptinställningar (avancerat läge)
```

**Viktig designprincip:** Sektionerna ska renderas dynamiskt från `report_templates.sections` (JSONB), INTE hårdkodas i HTML. En rapport laddas med sin template och renderar rätt antal sektioner med rätt titlar.

**State management:**

```typescript
// src/hooks/useReportEditor.ts
interface ReportEditorState {
  report: Report
  template: ReportTemplate
  sections: SectionState[]  // Dynamiska sektioner från template
  lockedFields: Set<string>
  isDirty: boolean  // Har osparade ändringar
  isGenerating: boolean
  generationProgress: GenerationProgress
}

interface SectionState {
  id: string
  title: string
  level: number
  content: string
  isLocked: boolean
  lastEdited: string | null
  parentId: string | null
  order: number
}
```

**Autosave-strategi:**
- Debounce med 1500ms (inte 500ms som nuvarande – för aggressivt)
- Spara till Supabase `reports.sections_content` via API route
- Visa "Sparar..." / "Sparat" i header
- Fallback till sessionStorage om nätverket är nere

#### 6.2.7 – API Routes för rapporter

**`src/app/api/reports/route.ts`** – GET (lista), POST (skapa)
**`src/app/api/reports/[id]/route.ts`** – GET (hämta), PATCH (uppdatera), DELETE
**`src/app/api/reports/[id]/generate/route.ts`** – POST (generera med AI)
**`src/app/api/reports/[id]/autosave/route.ts`** – PATCH (autosave sektionsinnehåll)

---

## 7. FAS 2 – STILANPASSNING OCH REFERENSDOKUMENT

> **Mål:** Implementera systemet som gör att varje organisations rapporter får rätt tonalitet och stil.
>
> **Uppskattad tid:** 1-2 veckor
>
> **Beroenden:** Fas 1

### 7.1 Referensdokument-uppladdning och analys

#### 7.1.1 – Filuppladdning

**`src/app/api/references/upload/route.ts`**

1. Validera filtyp (PDF, DOCX, TXT) och storlek (max 20 MB)
2. Ladda upp till Supabase Storage: `reference-documents/{org_id}/{filename}`
3. Skapa `reference_documents`-rad
4. Starta stilanalys-jobb (synkront i MVP, asynkront senare)

#### 7.1.2 – Textextraktion

**`src/lib/document-parser.ts`**

```typescript
export async function extractText(fileBuffer: Buffer, fileType: string): Promise<string> {
  switch (fileType) {
    case 'pdf':
      // Använd pdf-parse
      return extractFromPDF(fileBuffer)
    case 'docx':
      // Använd mammoth
      return extractFromDOCX(fileBuffer)
    case 'txt':
      return fileBuffer.toString('utf-8')
    default:
      throw new Error(`Unsupported file type: ${fileType}`)
  }
}
```

Dependencies att installera: `npm install pdf-parse mammoth`

#### 7.1.3 – AI-driven stilanalys

**`src/lib/ai/style-analyzer.ts`**

Skicka extraherad text till Claude med följande prompt:

```
Du är expert på att analysera skrivstil i svenska texter. Analysera följande text 
och extrahera detaljerade stilmönster. Texten är en verksamhetsberättelse/rapport 
från en organisation.

ANALYSERA OCH RETURNERA JSON:

{
  "tonality": "formal" | "semi-formal" | "conversational",
  "formality_score": 0.0-1.0 (0 = mycket informell, 1 = mycket formell),
  "avg_sentence_length": <antal ord per mening i genomsnitt>,
  "vocabulary_level": "simple" | "professional" | "academic",
  "active_voice_ratio": 0.0-1.0 (andel aktiva satser),
  "common_phrases": [<lista med återkommande uttryck och fraser>],
  "section_transition_style": "beskrivning av hur man övergår mellan avsnitt",
  "number_presentation": "beskrivning av hur siffror och resultat presenteras",
  "person_reference": "vi" | "organisationen" | "styrelsen" | "blandat",
  "tense_preference": "preteritum" | "presens" | "blandat",
  "paragraph_style": "korta stycken" | "långa stycken" | "blandade",
  "use_of_subheadings": true | false,
  "analysis_summary": "<3-5 meningar som sammanfattar textens övergripande stil>"
}

TEXT ATT ANALYSERA:
{extracted_text}
```

Spara resultatet i `reference_documents.style_analysis` och uppdatera `organizations.style_profile` med en sammanvägd profil (om flera referensdokument finns).

### 7.2 Dynamisk promptbyggare

**`src/lib/ai/prompt-builder.ts`**

Denna modul ersätter `ServerPromptManager` och bygger dynamiska system-promptar per organisation.

```typescript
export class PromptBuilder {
  /**
   * Bygger en komplett systemprompt baserat på organisationens profil,
   * mall och stilpreferenser.
   */
  static buildSystemPrompt(params: {
    organization: Organization
    template: ReportTemplate
    styleProfile: StyleProfile
    referenceAnalysis?: StyleAnalysis
  }): string {
    const { organization, template, styleProfile, referenceAnalysis } = params

    let prompt = `Du är expert på att skriva professionella verksamhetsrapporter på svenska.

Din uppgift är att omformulera och förbättra språket i underlaget så att det blir 
enhetligt och professionellt. Du ska ALDRIG korta ner eller sammanfatta innehållet.

ORGANISATION: ${organization.name}
TYP: ${this.getOrgTypeDescription(organization.org_type)}
SEKTOR: ${organization.sector || 'Ej specificerad'}
`

    // Lägg till tonalitetsinstruktioner
    prompt += this.buildTonalityInstructions(styleProfile)

    // Lägg till stilmönster från referensdokument
    if (referenceAnalysis) {
      prompt += this.buildStyleInstructions(referenceAnalysis)
    }

    // Lägg till strukturinstruktioner från mallen
    prompt += this.buildStructureInstructions(template)

    // Generella kvalitetsregler (hämtade från befintlig ServerPromptManager)
    prompt += `

KRITISKA REGLER:
- BEHÅLL HELA TEXTLÄNGDEN – varje avsnitt ska bli lika långt eller längre
- BEVARA ALLA DETALJER, namn, datum, procentsatser och specifika händelser
- INGA PÅHITT – lägg aldrig till information som inte finns i underlaget
- KONSISTENS – enhetlig ton och stil genom hela rapporten
- Skriv i ${styleProfile.tense_preference || 'aktiv form med korta, klara meningar'}

OUTPUT-KRAV:
- Komplett rapport i textformat med FULL detaljnivå
- Alla rubriker och underrubriker ska finnas med
- Färdig för direkt kopiering till dokumentmall`

    return prompt
  }

  private static buildTonalityInstructions(style: StyleProfile): string {
    const tonalityMap = {
      'formal': 'Använd ett formellt, sakligt språk. Skriv i tredje person ("styrelsen", "organisationen"). Undvik talspråk.',
      'semi-formal': 'Använd ett professionellt men tillgängligt språk. "Vi"-form är acceptabelt. Tydligt och konkret utan att vara stelt.',
      'conversational': 'Använd ett varmt, engagerande språk. Skriv i vi-form. Korta meningar. Tillåt entusiasm men behåll professionalism.'
    }

    return `\nTONALITET: ${tonalityMap[style.tonality] || tonalityMap['semi-formal']}\n`
  }

  private static buildStyleInstructions(analysis: StyleAnalysis): string {
    let instructions = '\nSTILANPASSNING BASERAT PÅ REFERENSDOKUMENT:\n'
    
    if (analysis.common_phrases?.length > 0) {
      instructions += `- Återanvänd gärna dessa typiska uttryck: ${analysis.common_phrases.slice(0, 10).join(', ')}\n`
    }
    
    if (analysis.person_reference) {
      instructions += `- Referera till organisationen som: "${analysis.person_reference}"\n`
    }

    if (analysis.analysis_summary) {
      instructions += `- Övergripande stilbeskrivning: ${analysis.analysis_summary}\n`
    }

    return instructions
  }

  private static buildStructureInstructions(template: ReportTemplate): string {
    const sections = template.sections as TemplateSection[]
    let instructions = '\nRAPPORTSTRUKTUR:\n'
    
    sections.forEach((section, index) => {
      const prefix = section.level === 1 ? `${index + 1}.` : '  -'
      instructions += `${prefix} ${section.title}\n`
      if (section.ai_instructions) {
        instructions += `    [${section.ai_instructions}]\n`
      }
    })

    return instructions
  }
}
```

### 7.3 Feedbackloop per sektion

Efter generering, per avsnitt, visa knappar:
- 👍 "Bra" – positivt signalvärde (spara för framtida förbättring)
- ✏️ "Justera" – öppna redigeringsläge med möjlighet att ge AI feedback:
  - "För formellt" / "För informellt"
  - "Mer detaljer" / "Kortare"
  - Fritext: "Ändra X till Y"
- 🔄 "Regenerera avsnitt" – generera om enbart detta avsnitt med justeringar

**API route:** `src/app/api/reports/[id]/regenerate-section/route.ts`

---

## 8. FAS 3 – BETALNING OCH ANVÄNDARHANTERING

> **Mål:** Implementera Stripe-betalning, prenumerationshantering och användargränser.
>
> **Uppskattad tid:** 1-2 veckor
>
> **Beroenden:** Fas 1

### 8.1 Stripe-integration

#### 8.1.1 – Stripe-setup

1. Skapa Stripe-konto på stripe.com
2. Skapa produkter och priser i Stripe Dashboard:
   - Produkt: "Verksamhetsrapport Bas" → Pris: 299 SEK/mån
   - Produkt: "Verksamhetsrapport Pro" → Pris: 799 SEK/mån
   - Produkt: "Verksamhetsrapport Enterprise" → Pris: 1999 SEK/mån
   - Produkt: "Enstaka rapport" → Pris: 499 SEK (engångspris)

#### 8.1.2 – Checkout-flöde

**`src/app/api/stripe/checkout/route.ts`**
- Skapa Stripe Checkout Session
- Koppla till organisationens `stripe_customer_id`
- Redirect till Stripe-hosted checkout

**`src/app/api/stripe/webhook/route.ts`**
- Hantera `checkout.session.completed` → Uppdatera `organizations.subscription_plan`
- Hantera `customer.subscription.updated` → Synka status
- Hantera `customer.subscription.deleted` → Nedgradera till free
- Hantera `invoice.payment_failed` → Markera som `past_due`

#### 8.1.3 – Användargränser

**`src/lib/subscription-guard.ts`**

```typescript
export async function checkReportLimit(orgId: string): Promise<{
  allowed: boolean
  remaining: number
  plan: string
}> {
  const org = await getOrganization(orgId)
  const limits = {
    free: 1,
    bas: 5,
    pro: Infinity,
    enterprise: Infinity
  }
  
  const limit = limits[org.subscription_plan] || 1
  const remaining = limit - org.reports_used_this_year
  
  return {
    allowed: remaining > 0,
    remaining: Math.max(0, remaining),
    plan: org.subscription_plan
  }
}
```

Anropa denna guard i `POST /api/reports/[id]/generate` innan AI-generering startar.

### 8.2 Teaminbjudningar (Pro/Enterprise)

**`src/app/api/organizations/[id]/invite/route.ts`**
- Skicka inbjudningsmail via Supabase auth
- Skapa `org_members`-rad med role 'member' vid accept

**`src/app/settings/team/page.tsx`**
- Lista teammedlemmar
- Bjud in via email
- Ändra roller (owner, admin, member)
- Ta bort medlemmar

---

## 9. FAS 4 – PDF-EXPORT OCH OUTPUT

> **Mål:** Generera professionella PDF-rapporter med organisationens logotyp och branding.
>
> **Uppskattad tid:** 1-2 veckor
>
> **Beroenden:** Fas 1, Fas 2

### 9.1 PDF-generering

**`src/lib/pdf/report-pdf.tsx`** – Använd `@react-pdf/renderer`

```bash
npm install @react-pdf/renderer
```

PDF-mallen ska inkludera:
- **Framsida:** Organisationens logotyp, rapporttitel, period, datum
- **Innehållsförteckning:** Automatgenererad från sektioner
- **Sektioner:** Med korrekt numrering, rubriker, brödtext
- **Sidfot:** Sidnummer, organisationsnamn, "Skapad med verksamhetsrapport.se"
- **Typografi:** Serif-font för brödtext (liknande nuvarande Georgia-val)

### 9.2 Export-alternativ

- **PDF** – Primärt format
- **DOCX** – Sekundärt, via `docx`-biblioteket (`npm install docx`)
- **TXT** – Behåll nuvarande kopiera/ladda ner-funktion som enklaste alternativet
- **Kopiera till urklipp** – Behåll befintlig funktion

### 9.3 API Route

**`src/app/api/reports/[id]/export/route.ts`**

```typescript
// POST /api/reports/[id]/export
// Body: { format: 'pdf' | 'docx' | 'txt' }
// Returns: { url: string } (Supabase Storage URL) eller direkt fil-stream
```

---

## 10. FAS 5 – MALLBIBLIOTEK OCH ONBOARDING

> **Mål:** Bygga ett bibliotek med färdiga rapportmallar per organisationstyp.
>
> **Uppskattad tid:** 1 vecka
>
> **Beroenden:** Fas 1

### 10.1 Globala mallar (seed data)

Skapa dessa mallar som `is_global: true, is_default: true`:

#### Mall 1: Förening – Årsberättelse
```json
{
  "name": "Årsberättelse – Förening",
  "template_type": "annual_report",
  "sections": [
    { "title": "Ordförandes förord", "level": 1, "required": false, "placeholder": "Vad vill ordföranden lyfta fram från det gångna året?" },
    { "title": "Om föreningen", "level": 1, "required": true, "placeholder": "Föreningens ändamål, medlemsantal, styrelse..." },
    { "title": "Verksamheten under året", "level": 1, "required": true },
    { "title": "Aktiviteter och evenemang", "level": 2, "parent": "Verksamheten under året" },
    { "title": "Projekt och satsningar", "level": 2, "parent": "Verksamheten under året" },
    { "title": "Samarbeten och partnerskap", "level": 2, "parent": "Verksamheten under året" },
    { "title": "Ekonomi", "level": 1, "required": true, "placeholder": "Intäkter, kostnader, resultat..." },
    { "title": "Medlemmar och engagemang", "level": 1 },
    { "title": "Framtidsutsikter", "level": 1, "placeholder": "Planer och mål för kommande år" }
  ]
}
```

#### Mall 2: Stiftelse – Verksamhetsberättelse
```json
{
  "name": "Verksamhetsberättelse – Stiftelse",
  "template_type": "annual_report",
  "sections": [
    { "title": "Styrelsens berättelse", "level": 1, "required": true },
    { "title": "Ändamål och verksamhet", "level": 1, "required": true },
    { "title": "Beviljade medel och stöd", "level": 1 },
    { "title": "Förvaltning och ekonomi", "level": 1, "required": true },
    { "title": "Kapitalförvaltning", "level": 2, "parent": "Förvaltning och ekonomi" },
    { "title": "Resultat och ställning", "level": 2, "parent": "Förvaltning och ekonomi" },
    { "title": "Styrelse och organisation", "level": 1, "required": true },
    { "title": "Väsentliga händelser", "level": 1 },
    { "title": "Framtida utveckling", "level": 1 }
  ]
}
```

#### Mall 3: Halvårsrapport (generell)
```json
{
  "name": "Halvårsrapport",
  "template_type": "semi_annual",
  "sections": [
    { "title": "Sammanfattning", "level": 1, "required": true },
    { "title": "Verksamhetens utveckling", "level": 1, "required": true },
    { "title": "Ekonomisk översikt", "level": 1 },
    { "title": "Personal och organisation", "level": 1 },
    { "title": "Viktiga händelser och beslut", "level": 1 },
    { "title": "Framåtblick", "level": 1 }
  ]
}
```

#### Mall 4: TRS Halvårsrapport (migrerad från befintlig app)
```json
{
  "name": "TRS Halvårsrapport",
  "template_type": "semi_annual",
  "sections": [
    { "title": "Sammanfattning från vd", "level": 1 },
    { "title": "In- och utträden", "level": 1 },
    { "title": "Verksamhetens utveckling", "level": 1 },
    { "title": "Omställningsstöd", "level": 2, "parent": "Verksamhetens utveckling" },
    { "title": "Kompetensstöd individ/anställda", "level": 2, "parent": "Verksamhetens utveckling" },
    { "title": "Omställning på arbetsplatsen", "level": 2, "parent": "Verksamhetens utveckling" },
    { "title": "Förebyggande kompetensutveckling", "level": 2, "parent": "Verksamhetens utveckling" },
    { "title": "Kunskap om kompetens – stöd till arbetsplatser", "level": 2, "parent": "Verksamhetens utveckling" },
    { "title": "Webbinarier", "level": 2, "parent": "Verksamhetens utveckling" },
    { "title": "Digital utveckling och IT", "level": 1 },
    { "title": "Kommunikation och ökad kännedom", "level": 1 },
    { "title": "Ekonomi och kapitalförvaltning", "level": 1 },
    { "title": "HR, administration och organisation", "level": 1 },
    { "title": "Styrelsearbete", "level": 1 },
    { "title": "TRS partsråd", "level": 1 },
    { "title": "Viktiga beslut och händelser", "level": 1 },
    { "title": "Nätverkande, omvärldsbevakning och representation", "level": 1 },
    { "title": "Remisser", "level": 1 },
    { "title": "Övrigt", "level": 1 }
  ]
}
```

### 10.2 Mallredigerare

**`src/app/settings/templates/page.tsx`**

- Lista organisationens mallar
- Skapa ny mall (baserad på global eller from scratch)
- Redigera sektioner: lägg till, ta bort, ändra ordning (drag & drop), ändra nivå
- Förhandsvisa mallstruktur

---

## 11. FAS 6 – DASHBOARD, HISTORIK OCH VERSIONER

> **Mål:** Fullständig dashboard med rapporthistorik, versionshantering och statistik.
>
> **Uppskattad tid:** 1 vecka
>
> **Beroenden:** Fas 1, Fas 3

### 11.1 Dashboard-förbättringar

**`src/app/dashboard/page.tsx`** – Utöka med:

- **Rapportlista** med status-badges (Utkast, Under granskning, Slutgiltig)
- **Snabbåtgärder** per rapport: Redigera, Exportera PDF, Duplicera, Radera
- **Prenumerationsstatus** med upgrade-CTA om free
- **Aktivitetslogg** – senaste genereringar och redigeringar

### 11.2 Versionshantering

- Automatisk versionskapning vid varje generering
- **`src/app/report/[id]/versions/page.tsx`** – Lista versioner, jämför, återställ
- Diff-vy mellan versioner (text-diff)

### 11.3 Inställningar

**`src/app/settings/page.tsx`** med undersidor:

- `/settings/organization` – Namn, typ, logotyp, stilprofil
- `/settings/templates` – Mallhantering
- `/settings/team` – Teammedlemmar och roller
- `/settings/billing` – Prenumeration, fakturor (Stripe Customer Portal)
- `/settings/references` – Referensdokument, stilanalys

---

## 12. FAS 7 – LANSERING, HOSTING OCH DEVOPS

> **Mål:** Produktionssätta applikationen.
>
> **Uppskattad tid:** 1 vecka
>
> **Beroenden:** Alla tidigare faser

### 12.1 Hosting

**Vercel** (rekommenderat för Next.js):
- Gratis hobby-plan för start
- Pro-plan ($20/mån) vid behov av mer bandbredd
- Automatisk deploy vid push till `main`-branch
- Edge Functions för API routes
- Inbyggd analytics

### 12.2 Domän

- Registrera domän: **verksamhetsrapport.se** ✅ Ledig
- Konfigurera DNS i Vercel
- SSL sköts automatiskt

### 12.3 Miljöer

```
main       → verksamhetsrapport.se (produktion)
staging    → staging.verksamhetsrapport.se (test)
feature/*  → preview-deploy per PR (Vercel auto)
```

### 12.4 Monitoring

- **Vercel Analytics** – Sidladdningstider, Web Vitals
- **Sentry** (`npm install @sentry/nextjs`) – Felrapportering
- **Supabase Dashboard** – Databasanvändning, auth-statistik
- **Stripe Dashboard** – Intäkter, churns

### 12.5 Landningssida

**`src/app/page.tsx`** – Publik landningssida med:

- Hero med tydligt värdeerbjudande
- "Så fungerar det" – 3 steg
- Prisplan-jämförelse
- Testimonials (när tillgängligt)
- CTA: "Skapa din första verksamhetsrapport gratis"

---

## 13. API-DESIGN

### 13.1 Komplett API-översikt

```
AUTH
POST   /api/auth/callback              – Supabase auth callback

ORGANISATIONER
GET    /api/organizations               – Lista användarens organisationer
POST   /api/organizations               – Skapa ny organisation
GET    /api/organizations/[id]          – Hämta organisation
PATCH  /api/organizations/[id]          – Uppdatera organisation
POST   /api/organizations/[id]/invite   – Bjud in teammedlem

RAPPORTMALLAR
GET    /api/templates                   – Lista tillgängliga mallar (globala + org)
POST   /api/templates                   – Skapa ny mall
GET    /api/templates/[id]              – Hämta mall
PATCH  /api/templates/[id]              – Uppdatera mall
DELETE /api/templates/[id]              – Radera mall

RAPPORTER
GET    /api/reports                     – Lista rapporter (filtrerat per org)
POST   /api/reports                     – Skapa ny rapport
GET    /api/reports/[id]                – Hämta rapport med innehåll
PATCH  /api/reports/[id]                – Uppdatera rapport (metadata)
DELETE /api/reports/[id]                – Radera rapport
PATCH  /api/reports/[id]/autosave      – Autosave sektionsinnehåll
POST   /api/reports/[id]/generate      – Generera rapport med AI
POST   /api/reports/[id]/regenerate-section – Regenerera enstaka sektion
POST   /api/reports/[id]/export        – Exportera som PDF/DOCX/TXT
GET    /api/reports/[id]/versions      – Lista versioner
POST   /api/reports/[id]/versions/[v]/restore – Återställ version

REFERENSDOKUMENT
GET    /api/references                  – Lista referensdokument
POST   /api/references/upload           – Ladda upp och analysera
DELETE /api/references/[id]             – Radera referensdokument

BETALNING
POST   /api/stripe/checkout             – Skapa checkout session
POST   /api/stripe/webhook              – Stripe webhook
POST   /api/stripe/portal               – Skapa Stripe customer portal link

ADMIN/TEST
GET    /api/health                      – Hälsokontroll
```

### 13.2 Request/Response-format

Alla API routes använder JSON. Autentisering via Supabase session cookies.

Standardiserat felformat:
```json
{
  "error": {
    "code": "REPORT_LIMIT_EXCEEDED",
    "message": "Du har använt alla dina rapporter för denna period.",
    "details": { "plan": "free", "limit": 1, "used": 1 }
  }
}
```

---

## 14. FRONTEND-ARKITEKTUR

### 14.1 Routing (App Router)

```
src/app/
├── page.tsx                          – Landningssida (publik)
├── login/page.tsx                    – Inloggning
├── auth/callback/route.ts            – Auth callback
├── onboarding/page.tsx               – Organisationsonboarding
├── dashboard/page.tsx                – Dashboard (skyddad)
├── report/
│   ├── new/page.tsx                  – Skapa ny rapport (välj mall)
│   └── [id]/
│       ├── page.tsx                  – Rapportredigerare
│       └── versions/page.tsx         – Versionshistorik
├── settings/
│   ├── page.tsx                      – Organisationsinställningar
│   ├── templates/page.tsx            – Mallhantering
│   ├── team/page.tsx                 – Teamhantering
│   ├── billing/page.tsx              – Prenumeration
│   └── references/page.tsx           – Referensdokument
└── api/                              – API routes (se sektion 13)
```

### 14.2 Layoutstruktur

```
src/app/layout.tsx                    – Root layout (providers, fonts)
src/app/(public)/layout.tsx           – Publik layout (nav med "Logga in")
src/app/(protected)/layout.tsx        – Skyddad layout (sidebar, user menu)
```

### 14.3 Shared Components

```
src/components/
├── ui/                               – shadcn/ui-komponenter
│   ├── button.tsx
│   ├── input.tsx
│   ├── textarea.tsx
│   ├── card.tsx
│   ├── dialog.tsx
│   ├── dropdown-menu.tsx
│   ├── badge.tsx
│   ├── progress.tsx
│   ├── toast.tsx
│   └── ...
├── layout/
│   ├── Sidebar.tsx
│   ├── Header.tsx
│   ├── UserMenu.tsx
│   └── MobileNav.tsx
├── report/                           – Rapportrelaterade (se 6.2.6)
│   ├── ReportEditor.tsx
│   ├── SectionField.tsx
│   ├── SectionList.tsx
│   └── ...
├── onboarding/
│   ├── OrgTypeSelector.tsx
│   ├── TonalityPicker.tsx
│   ├── TemplateSelector.tsx
│   └── ReferenceUploader.tsx
└── shared/
    ├── FileUploader.tsx
    ├── LoadingSpinner.tsx
    ├── EmptyState.tsx
    └── UpgradeBanner.tsx
```

---

## 15. AI-PROMPTARKITEKTUR

### 15.1 Prompt-kedja vid rapportgenerering

```
1. Hämta organisation → organizations.style_profile
2. Hämta mall → report_templates.sections
3. Hämta referensanalys → reference_documents.style_analysis (senaste)
4. Bygg systemprompt → PromptBuilder.buildSystemPrompt()
5. Bygg user prompt → PromptBuilder.buildUserPrompt(sections_content)
6. Tokenräkning → TokenCounter.countTokens()
7. Chunking vid behov → DocumentChunker.chunkContent()
8. API-anrop → LLMClient.generate()
9. Koherensgranskning (vid >2 chunks) → Ytterligare API-anrop
10. Spara resultat → reports.generated_content
```

### 15.2 LLM-klient

**`src/lib/ai/llm-client.ts`**

Abstraktion som stödjer både Claude och OpenAI:

```typescript
export interface LLMClient {
  generate(messages: Message[], options: GenerateOptions): Promise<GenerateResult>
}

export class AnthropicClient implements LLMClient {
  // Använder @anthropic-ai/sdk
  // Model: claude-sonnet-4-5-20250929 (balans pris/kvalitet)
  // Fallback: claude-haiku-4-5-20251001 (för enklare uppgifter som stilanalys)
}

export class OpenAIClient implements LLMClient {
  // Migrerad från befintlig OpenAIClient i server.js
  // Model: gpt-4o
}
```

### 15.3 Migrera befintliga klasser

Dessa klasser från `server.js` ska migreras till TypeScript:

| Befintlig klass | Ny plats | Ändringar |
|----------------|----------|-----------|
| `TokenCounter` | `src/lib/ai/token-counter.ts` | Typa, ingen logikändring |
| `DocumentChunker` | `src/lib/ai/document-chunker.ts` | Typa, ingen logikändring |
| `ServerPromptManager` | `src/lib/ai/prompt-builder.ts` | Helt omskriven (dynamisk) |
| `OpenAIClient` | `src/lib/ai/clients/openai-client.ts` | Typa, behåll retry-logik |
| (ny) | `src/lib/ai/clients/anthropic-client.ts` | Ny klass |
| (ny) | `src/lib/ai/style-analyzer.ts` | Ny klass |

---

## 16. SÄKERHET

### 16.1 Kritiska säkerhetsåtgärder

1. **API-nycklar:** Aldrig i klientkod. Alla AI-anrop via server-side API routes.
2. **Row Level Security:** Aktiverat på alla tabeller (se schema). Testa att en användare INTE kan se en annan organisations data.
3. **Rate limiting:** Implementera per-user/per-org rate limits på genereringsendpoints. Använd `next-rate-limit` eller Vercel Edge Config.
4. **Input sanitering:** Validera all input med Zod-schemas innan databasoperationer.
5. **CSRF:** Hanteras av Supabase auth + SameSite cookies.
6. **File upload:** Validera filtyp, storlek (max 20 MB), scanna med ClamAV om möjligt.
7. **Stripe webhooks:** Verifiera signatur med `stripe.webhooks.constructEvent()`.

### 16.2 Zod-schemas

**`src/lib/validations/`**

```typescript
// report.ts
export const createReportSchema = z.object({
  title: z.string().min(1).max(200),
  template_id: z.string().uuid(),
  report_year: z.number().int().min(2000).max(2100).optional(),
  report_period: z.enum(['annual', 'h1', 'h2', 'q1', 'q2', 'q3', 'q4']).optional(),
})

export const autosaveSchema = z.object({
  sections_content: z.record(z.string(), z.object({
    raw_input: z.string().max(100000),
    is_locked: z.boolean().optional(),
  }))
})

// organization.ts
export const createOrgSchema = z.object({
  name: z.string().min(1).max(200),
  org_type: z.enum(['association', 'foundation', 'cooperative', 'company', 'municipality', 'faith', 'union', 'other']),
  sector: z.string().optional(),
  description: z.string().max(1000).optional(),
})
```

---

## 17. TESTPLAN

### 17.1 Kritiska tester att skriva

```
E2E (Playwright)
├── Registrering → Onboarding → Skapa rapport → Generera → Exportera PDF
├── Inloggning med magic link
├── Prenumerationsuppgradering via Stripe (testläge)
└── Multi-tenant isolation (användare A kan inte se användare B:s data)

Integration
├── API: CRUD rapporter
├── API: AI-generering med mock
├── API: Stripe webhook-hantering
├── Supabase RLS-policies
└── Referensdokument: upload → extraktion → analys

Unit
├── PromptBuilder: korrekt prompt per organisationstyp
├── TokenCounter: exakt tokenräkning
├── DocumentChunker: korrekt chunking med sektionsbevarning
├── Subscription guard: rätt gränser per plan
└── Zod-validering: alla schemas
```

---

## 18. MIGRERINGSPLAN FRÅN BEFINTLIG KODBAS

### 18.1 Filer att migrera (kopiera och typa om)

| Källa | Destination | Åtgärd |
|-------|------------|--------|
| `server.js: TokenCounter` | `src/lib/ai/token-counter.ts` | Konvertera till TypeScript, inga logikändringar |
| `server.js: DocumentChunker` | `src/lib/ai/document-chunker.ts` | Konvertera till TypeScript, parametrisera `maxTokensPerChunk` |
| `server.js: OpenAIClient` | `src/lib/ai/clients/openai-client.ts` | Konvertera till TypeScript, implementera `LLMClient`-interface |
| `styles.css: :root vars` | `src/app/globals.css` | Behåll som CSS variables, integrera med Tailwind |
| `script.js: progress tracking` | `src/components/report/ProgressModal.tsx` | Konvertera till React-komponent |
| `script.js: collectAllContent()` | `src/hooks/useReportEditor.ts` | Anpassa för dynamiska sektioner |
| `Referens/Verksamhetsrapport...docx` | Seed data | Använd som referensdokument för TRS-mallen |

### 18.2 Filer som INTE migreras (ersätts helt)

| Fil | Anledning |
|-----|-----------|
| `index.html` | Ersätts av Next.js-sidor och React-komponenter |
| `script.js: PromptManager` | Ersätts av `PromptBuilder` (server-side) |
| `script.js: initializeSectionData()` | Ersätts av dynamisk data från `report_templates` |
| `script.js: localStorage-logik` | Ersätts av Supabase-databas |
| `server.js: Express-app` | Ersätts av Next.js API routes |
| `server.js: ServerPromptManager` | Ersätts av `PromptBuilder` |

---

## 19. FILSTRUKTUR – KOMPLETT MÅLBILD

```
verksamhetsrapport/
├── .env.local                          # Miljövariabler (ALDRIG i git)
├── .env.example                        # Mall för miljövariabler
├── next.config.js
├── tailwind.config.ts
├── tsconfig.json
├── package.json
│
├── public/
│   ├── logo.svg
│   └── og-image.png                    # Open Graph-bild
│
├── src/
│   ├── app/
│   │   ├── layout.tsx                  # Root layout
│   │   ├── globals.css                 # Tailwind + CSS variables
│   │   ├── page.tsx                    # Landningssida
│   │   │
│   │   ├── login/
│   │   │   └── page.tsx
│   │   ├── auth/
│   │   │   └── callback/route.ts
│   │   ├── onboarding/
│   │   │   └── page.tsx
│   │   │
│   │   ├── (protected)/                # Layout med sidebar, kräver auth
│   │   │   ├── layout.tsx
│   │   │   ├── dashboard/
│   │   │   │   └── page.tsx
│   │   │   ├── report/
│   │   │   │   ├── new/page.tsx
│   │   │   │   └── [id]/
│   │   │   │       ├── page.tsx        # Rapportredigerare
│   │   │   │       └── versions/page.tsx
│   │   │   └── settings/
│   │   │       ├── page.tsx            # Organisation
│   │   │       ├── templates/page.tsx
│   │   │       ├── team/page.tsx
│   │   │       ├── billing/page.tsx
│   │   │       └── references/page.tsx
│   │   │
│   │   └── api/
│   │       ├── health/route.ts
│   │       ├── organizations/
│   │       │   ├── route.ts            # GET, POST
│   │       │   └── [id]/
│   │       │       ├── route.ts        # GET, PATCH
│   │       │       └── invite/route.ts
│   │       ├── templates/
│   │       │   ├── route.ts
│   │       │   └── [id]/route.ts
│   │       ├── reports/
│   │       │   ├── route.ts
│   │       │   └── [id]/
│   │       │       ├── route.ts
│   │       │       ├── autosave/route.ts
│   │       │       ├── generate/route.ts
│   │       │       ├── regenerate-section/route.ts
│   │       │       ├── export/route.ts
│   │       │       └── versions/
│   │       │           ├── route.ts
│   │       │           └── [version]/restore/route.ts
│   │       ├── references/
│   │       │   ├── route.ts
│   │       │   ├── upload/route.ts
│   │       │   └── [id]/route.ts
│   │       └── stripe/
│   │           ├── checkout/route.ts
│   │           ├── webhook/route.ts
│   │           └── portal/route.ts
│   │
│   ├── components/
│   │   ├── ui/                         # shadcn/ui-komponenter
│   │   │   ├── button.tsx
│   │   │   ├── input.tsx
│   │   │   ├── textarea.tsx
│   │   │   ├── card.tsx
│   │   │   ├── dialog.tsx
│   │   │   ├── dropdown-menu.tsx
│   │   │   ├── badge.tsx
│   │   │   ├── progress.tsx
│   │   │   ├── toast.tsx
│   │   │   ├── tabs.tsx
│   │   │   └── select.tsx
│   │   ├── layout/
│   │   │   ├── Sidebar.tsx
│   │   │   ├── Header.tsx
│   │   │   ├── UserMenu.tsx
│   │   │   └── MobileNav.tsx
│   │   ├── report/
│   │   │   ├── ReportEditor.tsx
│   │   │   ├── SectionField.tsx
│   │   │   ├── SectionList.tsx
│   │   │   ├── SectionToolbar.tsx
│   │   │   ├── AddSectionButton.tsx
│   │   │   ├── GenerateButton.tsx
│   │   │   ├── ProgressModal.tsx
│   │   │   ├── ReportOutput.tsx
│   │   │   ├── ReportMetadata.tsx
│   │   │   ├── SectionFeedback.tsx
│   │   │   └── PromptSettings.tsx
│   │   ├── onboarding/
│   │   │   ├── OrgTypeSelector.tsx
│   │   │   ├── TonalityPicker.tsx
│   │   │   ├── TemplateSelector.tsx
│   │   │   └── ReferenceUploader.tsx
│   │   ├── dashboard/
│   │   │   ├── ReportList.tsx
│   │   │   ├── ReportCard.tsx
│   │   │   ├── QuickStats.tsx
│   │   │   └── ActivityLog.tsx
│   │   ├── settings/
│   │   │   ├── TemplateEditor.tsx
│   │   │   ├── TeamManager.tsx
│   │   │   ├── BillingOverview.tsx
│   │   │   └── ReferenceList.tsx
│   │   └── shared/
│   │       ├── FileUploader.tsx
│   │       ├── LoadingSpinner.tsx
│   │       ├── EmptyState.tsx
│   │       ├── UpgradeBanner.tsx
│   │       └── ConfirmDialog.tsx
│   │
│   ├── hooks/
│   │   ├── useReportEditor.ts          # Huvudhook för rapportredigeraren
│   │   ├── useAutosave.ts              # Debounced autosave
│   │   ├── useOrganization.ts          # Hämta/uppdatera organisation
│   │   ├── useSubscription.ts          # Prenumerationsstatus
│   │   └── useSupabase.ts              # Supabase-klient i klienten
│   │
│   ├── lib/
│   │   ├── supabase/
│   │   │   ├── client.ts               # Browserklient
│   │   │   ├── server.ts               # Serverklient
│   │   │   ├── admin.ts                # Service role-klient
│   │   │   └── types.ts                # Databastyper (genererade)
│   │   ├── ai/
│   │   │   ├── token-counter.ts        # Migrerad från server.js
│   │   │   ├── document-chunker.ts     # Migrerad från server.js
│   │   │   ├── prompt-builder.ts       # NY – dynamisk promptbyggare
│   │   │   ├── style-analyzer.ts       # NY – analyserar referensdokument
│   │   │   ├── report-generator.ts     # NY – orkestrerar hela genereringsflödet
│   │   │   └── clients/
│   │   │       ├── types.ts            # LLMClient-interface
│   │   │       ├── anthropic-client.ts # NY – Claude API
│   │   │       └── openai-client.ts    # Migrerad från server.js
│   │   ├── pdf/
│   │   │   └── report-pdf.tsx          # PDF-generering med @react-pdf/renderer
│   │   ├── document-parser.ts          # Textextraktion från PDF/DOCX
│   │   ├── subscription-guard.ts       # Kontrollera rapportgränser
│   │   └── validations/
│   │       ├── report.ts               # Zod-schemas för rapporter
│   │       ├── organization.ts         # Zod-schemas för organisationer
│   │       └── template.ts             # Zod-schemas för mallar
│   │
│   ├── types/
│   │   ├── database.ts                 # Supabase-genererade typer
│   │   ├── report.ts                   # Rapport-relaterade typer
│   │   ├── organization.ts             # Organisation-relaterade typer
│   │   └── ai.ts                       # AI-relaterade typer
│   │
│   └── seed/
│       └── global-templates.ts         # Seed-script för globala mallar
│
├── supabase/
│   └── migrations/
│       └── 001_initial_schema.sql      # Databasschema
│
└── tests/
    ├── e2e/
    │   └── report-flow.spec.ts
    ├── integration/
    │   ├── api-reports.test.ts
    │   └── ai-generation.test.ts
    └── unit/
        ├── prompt-builder.test.ts
        ├── token-counter.test.ts
        └── document-chunker.test.ts
```

---

## 20. IMPLEMENTERINGSORDNING FÖR CLAUDE CODE

> **Instruktioner till Claude Code:** Följ denna ordning exakt. Varje steg bygger på det föregående. Testa varje steg innan du går vidare.

### SPRINT 1: Projektgrund (dag 1-3)

```
□ 1.  Skapa Next.js-projekt med TypeScript, Tailwind, App Router
□ 2.  Installera alla dependencies (se 6.1)
□ 3.  Skapa .env.example med alla variabler
□ 4.  Skapa Supabase-konfiguration (src/lib/supabase/client.ts, server.ts, admin.ts)
□ 5.  Skapa databasschema (supabase/migrations/001_initial_schema.sql)
□ 6.  Skapa TypeScript-typer för databastabellerna (src/types/database.ts)
□ 7.  Skapa Zod-validationsschemas (src/lib/validations/)
□ 8.  Sätt upp middleware.ts för route protection
□ 9.  Skapa root layout med Tailwind-konfiguration och CSS variables (migrera TRS-färger)
□ 10. Skapa auth-flöde: login-sida, callback route
```

### SPRINT 2: Kärnflöde (dag 4-7)

```
□ 11. Skapa onboarding-sida med alla steg (org type, namn, tonalitet, mall)
□ 12. Skapa API routes: organizations (CRUD)
□ 13. Skapa API routes: templates (CRUD) + seed globala mallar
□ 14. Skapa dashboard-sida med rapportlista
□ 15. Skapa "Ny rapport"-sida (välj mall, ange titel/period)
□ 16. Skapa API routes: reports (CRUD + autosave)
```

### SPRINT 3: Rapportredigeraren (dag 8-12)

```
□ 17. Migrera TokenCounter till TypeScript (src/lib/ai/token-counter.ts)
□ 18. Migrera DocumentChunker till TypeScript (src/lib/ai/document-chunker.ts)
□ 19. Skapa LLMClient-interface och AnthropicClient (src/lib/ai/clients/)
□ 20. Migrera OpenAIClient till TypeScript (src/lib/ai/clients/openai-client.ts)
□ 21. Skapa PromptBuilder med dynamisk promptgenerering (src/lib/ai/prompt-builder.ts)
□ 22. Skapa report-generator.ts som orkestrerar hela flödet
□ 23. Bygga ReportEditor-komponenten (huvudcontainer)
□ 24. Bygga SectionField-komponenten (enstaka sektion med textarea)
□ 25. Bygga SectionList med SortableJS drag & drop
□ 26. Bygga SectionToolbar (spara/lås/rensa/radera)
□ 27. Bygga AddSectionButton
□ 28. Implementera useReportEditor hook med autosave
□ 29. Implementera useAutosave hook med debounce till Supabase
□ 30. Bygga GenerateButton + ProgressModal (migrera progress-logik)
□ 31. Skapa API route: POST /api/reports/[id]/generate
□ 32. Bygga ReportOutput-komponent med metadata
□ 33. Testa komplett flöde: skapa rapport → fyll i → generera → visa resultat
```

### SPRINT 4: Stilanpassning (dag 13-16)

```
□ 34. Installera pdf-parse och mammoth
□ 35. Skapa document-parser.ts (textextraktion)
□ 36. Skapa style-analyzer.ts (AI-driven stilanalys)
□ 37. Skapa API route: POST /api/references/upload
□ 38. Bygga ReferenceUploader-komponent
□ 39. Integrera stilanalys i PromptBuilder
□ 40. Bygga SectionFeedback-komponent (👍/✏️/🔄 per sektion)
□ 41. Skapa API route: POST /api/reports/[id]/regenerate-section
□ 42. Testa: ladda upp referens → generera rapport → verifiera att stilen matchar
```

### SPRINT 5: Betalning och export (dag 17-20)

```
□ 43. Skapa Stripe-produkter och priser (manuellt i Stripe Dashboard)
□ 44. Skapa API routes: stripe/checkout, stripe/webhook, stripe/portal
□ 45. Skapa subscription-guard.ts
□ 46. Integrera guard i genereringsendpoint
□ 47. Bygga BillingOverview-komponent
□ 48. Bygga UpgradeBanner-komponent
□ 49. Installera @react-pdf/renderer
□ 50. Bygga report-pdf.tsx med framsida + innehållsförteckning + sektioner
□ 51. Skapa API route: POST /api/reports/[id]/export
□ 52. Integrera PDF-export och nedladdning i ReportOutput
```

### SPRINT 6: Polish och lansering (dag 21-25)

```
□ 53. Bygga landningssida (src/app/page.tsx)
□ 54. Bygga settings-sidor (organisation, mallar, team, references)
□ 55. Implementera versionshantering (report_versions tabell + UI)
□ 56. Implementera teaminbjudningar
□ 57. Installera och konfigurera Sentry för felhantering
□ 58. Skriv E2E-tester med Playwright
□ 59. Skriv unit-tester för PromptBuilder, TokenCounter, DocumentChunker
□ 60. Deploy till Vercel + konfigurera domän
□ 61. Konfigurera Stripe production-nycklar
□ 62. Slutgiltig testning av hela flödet i produktion
```

---

## BILAGA A: Kommandon för Claude Code

Använd dessa kommandon som referens under utvecklingen:

```bash
# Starta utvecklingsserver
npm run dev

# Generera Supabase-typer (efter schemaändringar)
npx supabase gen types typescript --project-id thhiewxmaskywgffizps > src/types/database.ts

# Lägg till shadcn/ui-komponenter
npx shadcn-ui@latest add button input textarea card dialog dropdown-menu badge progress toast tabs select

# Kör tester
npx playwright test
npm test

# Build för produktion
npm run build

# Deploy till Vercel
vercel --prod
```

## BILAGA B: Viktiga beslut att ta under utvecklingen

1. **Claude vs OpenAI som default?** Rekommendation: Claude (claude-sonnet-4-5-20250929) som default, OpenAI som fallback. Testa båda tidigt och jämför kvalitet på svenska verksamhetsberättelser.

2. **Prismodell: Prenumeration vs per rapport?** Rekommendation: Erbjud båda. Prenumeration för återkommande kunder, engångspris för de som bara behöver en rapport/år.

3. **PDF-kvalitet:** Om `@react-pdf/renderer` inte ger tillräcklig typografisk kvalitet, byt till Puppeteer (kräver servermiljö med headless Chrome, t.ex. en separat Cloud Function).

4. **Onboarding-längd:** 5 steg kan vara för mycket. Överväg att göra steg 3 (tonalitet) och steg 4 (referensdokument) valbara och tillgängliga senare i inställningar.

---

*Senast uppdaterad: 2025-02-05*
*Projekt: verksamhetsrapport.se*
*Författare: Claude (för Rawaz)*
