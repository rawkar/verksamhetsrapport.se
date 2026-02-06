// ============================================
// DATABAS-TYPER FÖR VERKSAMHETSRAPPORT.SE
// ============================================

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

// ============================================
// ENUMS
// ============================================

export type OrgType =
  | 'association'
  | 'foundation'
  | 'cooperative'
  | 'company'
  | 'municipality'
  | 'faith'
  | 'union'
  | 'other'

export type Sector =
  | 'culture'
  | 'sports'
  | 'social'
  | 'education'
  | 'healthcare'
  | 'other'

export type SubscriptionPlan = 'free' | 'bas' | 'pro' | 'enterprise'

export type SubscriptionStatus = 'active' | 'past_due' | 'canceled' | 'trialing'

export type OrgMemberRole = 'owner' | 'admin' | 'member'

export type TemplateType =
  | 'annual_report'
  | 'semi_annual'
  | 'activity_plan'
  | 'board_report'
  | 'custom'

export type ReportPeriod = 'annual' | 'h1' | 'h2' | 'q1' | 'q2' | 'q3' | 'q4'

export type ReportStatus = 'draft' | 'generating' | 'review' | 'final'

export type Tonality = 'formal' | 'semi-formal' | 'conversational'

export type VocabularyLevel = 'simple' | 'professional' | 'academic'

export type AIAction = 'generate_report' | 'analyze_reference' | 'regenerate_section'

// ============================================
// STILPROFIL (JSONB)
// ============================================

export interface StyleProfile {
  tonality?: Tonality
  formality_score?: number
  avg_sentence_length?: number
  vocabulary_level?: VocabularyLevel
  active_voice_preference?: boolean
  custom_instructions?: string
  extracted_patterns?: Record<string, unknown>
}

// ============================================
// STILANALYS FÖR REFERENSDOKUMENT (JSONB)
// ============================================

export interface StyleAnalysis {
  tonality?: Tonality
  formality_score?: number
  avg_sentence_length?: number
  vocabulary_level?: VocabularyLevel
  common_phrases?: string[]
  section_patterns?: unknown[]
  vocabulary_characteristics?: string
  analysis_summary?: string
  person_reference?: string
  tense_preference?: string
  active_voice_ratio?: number
  paragraph_style?: string
  use_of_subheadings?: boolean
  number_presentation?: string
  section_transition_style?: string
}

// ============================================
// MALL-SEKTION (JSONB)
// ============================================

export interface TemplateSection {
  id: string
  title: string
  level: number
  description?: string
  placeholder?: string
  required?: boolean
  parent_id?: string | null
  order: number
  ai_instructions?: string
}

// ============================================
// SEKTIONSINNEHÅLL (JSONB)
// ============================================

export interface SectionContent {
  raw_input: string
  is_locked?: boolean
  last_edited?: string
}

export type SectionsContent = Record<string, SectionContent>

// ============================================
// GENERERAT INNEHÅLL (JSONB)
// ============================================

export interface GeneratedSection {
  content: string
  generated_at: string
}

export type GeneratedSections = Record<string, GeneratedSection>

export interface GenerationMetadata {
  model?: string
  tokens_used?: number
  chunks?: number
  processing_method?: 'single_pass' | 'chunked'
  generated_at?: string
  generation_time_ms?: number
}

// ============================================
// DATABASTABELLER
// ============================================

export interface Profile {
  id: string
  full_name: string | null
  email: string
  avatar_url: string | null
  created_at: string
  updated_at: string
}

export interface Organization {
  id: string
  name: string
  slug: string
  org_type: OrgType
  sector: Sector | null
  description: string | null
  logo_url: string | null
  style_profile: StyleProfile
  stripe_customer_id: string | null
  subscription_plan: SubscriptionPlan
  subscription_status: SubscriptionStatus
  reports_used_this_year: number
  created_at: string
  updated_at: string
}

export interface OrgMember {
  id: string
  user_id: string
  org_id: string
  role: OrgMemberRole
  created_at: string
}

export interface ReportTemplate {
  id: string
  org_id: string | null
  name: string
  description: string | null
  template_type: TemplateType
  sections: TemplateSection[]
  is_default: boolean
  is_global: boolean
  created_at: string
  updated_at: string
}

export interface Report {
  id: string
  org_id: string
  template_id: string | null
  created_by: string
  title: string
  report_year: number | null
  report_period: ReportPeriod | null
  status: ReportStatus
  sections_content: SectionsContent
  generated_content: string | null
  generated_sections: GeneratedSections
  generation_metadata: GenerationMetadata
  pdf_url: string | null
  pdf_generated_at: string | null
  created_at: string
  updated_at: string
}

export interface ReportVersion {
  id: string
  report_id: string
  version_number: number
  sections_content: SectionsContent
  generated_content: string | null
  created_by: string | null
  created_at: string
}

export interface ReferenceDocument {
  id: string
  org_id: string
  uploaded_by: string
  file_name: string
  file_url: string
  file_type: 'pdf' | 'docx' | 'txt'
  file_size_bytes: number | null
  style_analysis: StyleAnalysis
  is_analyzed: boolean
  analyzed_at: string | null
  created_at: string
}

export interface AIUsageLog {
  id: string
  org_id: string
  report_id: string | null
  user_id: string
  action: AIAction
  model: string
  tokens_input: number | null
  tokens_output: number | null
  cost_usd: number | null
  duration_ms: number | null
  created_at: string
}

// ============================================
// DATABAS-SCHEMA TYPER FÖR SUPABASE
// ============================================

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: Profile
        Insert: Omit<Profile, 'created_at' | 'updated_at'> & {
          created_at?: string
          updated_at?: string
        }
        Update: Partial<Omit<Profile, 'id'>>
      }
      organizations: {
        Row: Organization
        Insert: Omit<Organization, 'id' | 'created_at' | 'updated_at' | 'style_profile' | 'subscription_plan' | 'subscription_status' | 'reports_used_this_year'> & {
          id?: string
          created_at?: string
          updated_at?: string
          style_profile?: StyleProfile
          subscription_plan?: SubscriptionPlan
          subscription_status?: SubscriptionStatus
          reports_used_this_year?: number
        }
        Update: Partial<Omit<Organization, 'id'>>
      }
      org_members: {
        Row: OrgMember
        Insert: Omit<OrgMember, 'id' | 'created_at'> & {
          id?: string
          created_at?: string
        }
        Update: Partial<Omit<OrgMember, 'id'>>
      }
      report_templates: {
        Row: ReportTemplate
        Insert: Omit<ReportTemplate, 'id' | 'created_at' | 'updated_at' | 'is_default' | 'is_global'> & {
          id?: string
          created_at?: string
          updated_at?: string
          is_default?: boolean
          is_global?: boolean
        }
        Update: Partial<Omit<ReportTemplate, 'id'>>
      }
      reports: {
        Row: Report
        Insert: Omit<Report, 'id' | 'created_at' | 'updated_at' | 'status' | 'sections_content' | 'generated_sections' | 'generation_metadata'> & {
          id?: string
          created_at?: string
          updated_at?: string
          status?: ReportStatus
          sections_content?: SectionsContent
          generated_sections?: GeneratedSections
          generation_metadata?: GenerationMetadata
        }
        Update: Partial<Omit<Report, 'id'>>
      }
      report_versions: {
        Row: ReportVersion
        Insert: Omit<ReportVersion, 'id' | 'created_at'> & {
          id?: string
          created_at?: string
        }
        Update: Partial<Omit<ReportVersion, 'id'>>
      }
      reference_documents: {
        Row: ReferenceDocument
        Insert: Omit<ReferenceDocument, 'id' | 'created_at' | 'style_analysis' | 'is_analyzed'> & {
          id?: string
          created_at?: string
          style_analysis?: StyleAnalysis
          is_analyzed?: boolean
        }
        Update: Partial<Omit<ReferenceDocument, 'id'>>
      }
      ai_usage_log: {
        Row: AIUsageLog
        Insert: Omit<AIUsageLog, 'id' | 'created_at'> & {
          id?: string
          created_at?: string
        }
        Update: Partial<Omit<AIUsageLog, 'id'>>
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
}
