// Generated from Supabase schema (project outddpbiubsqnqxzufcm).
// Regenerate with the Supabase MCP `generate_typescript_types` after schema changes.
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  __InternalSupabase: { PostgrestVersion: '14.5' }
  public: {
    Tables: {
      contact_messages: {
        Row: { created_at: string; email: string | null; id: string; message: string | null; name: string | null }
        Insert: { created_at?: string; email?: string | null; id?: string; message?: string | null; name?: string | null }
        Update: { created_at?: string; email?: string | null; id?: string; message?: string | null; name?: string | null }
        Relationships: []
      }
      coupons: {
        Row: { code: string; free_months: number; active: boolean; redeemed_count: number; created_at: string }
        Insert: { code: string; free_months?: number; active?: boolean; redeemed_count?: number; created_at?: string }
        Update: { code?: string; free_months?: number; active?: boolean; redeemed_count?: number; created_at?: string }
        Relationships: []
      }
      customers: {
        Row: {
          bg_color: string; company_name: string | null; created_at: string; email: string | null
          google_url: string | null; id: string; package: string; phone: string | null
          postcode: string | null; city: string | null; slug: string; status: string; street: string | null
          text_color: string; user_id: string; website: string | null
          feedback_prompt: string; review_platform: string; google_place_id: string | null; widget_texts: Json
          coupon: string | null; trial_until: string | null; free_until: string | null
          monthly_price_cents: number | null; billing_status: string; invite_texts: Json; logo_url: string | null
          invite_inbox: string
        }
        Insert: {
          bg_color?: string; company_name?: string | null; created_at?: string; email?: string | null
          google_url?: string | null; id?: string; package?: string; phone?: string | null
          postcode?: string | null; city?: string | null; slug: string; status?: string; street?: string | null
          text_color?: string; user_id: string; website?: string | null
          feedback_prompt?: string; review_platform?: string; google_place_id?: string | null; widget_texts?: Json
          coupon?: string | null; trial_until?: string | null; free_until?: string | null
          monthly_price_cents?: number | null; billing_status?: string; invite_texts?: Json; logo_url?: string | null
          invite_inbox?: string
        }
        Update: {
          bg_color?: string; company_name?: string | null; created_at?: string; email?: string | null
          google_url?: string | null; id?: string; package?: string; phone?: string | null
          postcode?: string | null; city?: string | null; slug?: string; status?: string; street?: string | null
          text_color?: string; user_id?: string; website?: string | null
          feedback_prompt?: string; review_platform?: string; google_place_id?: string | null; widget_texts?: Json
          coupon?: string | null; trial_until?: string | null; free_until?: string | null
          monthly_price_cents?: number | null; billing_status?: string; invite_texts?: Json; logo_url?: string | null
          invite_inbox?: string
        }
        Relationships: []
      }
      google_review_snapshots: {
        Row: {
          id: string; customer_id: string; rating: number | null; review_count: number | null
          source: string; captured_at: string
        }
        Insert: {
          id?: string; customer_id: string; rating?: number | null; review_count?: number | null
          source?: string; captured_at?: string
        }
        Update: {
          id?: string; customer_id?: string; rating?: number | null; review_count?: number | null
          source?: string; captured_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'google_review_snapshots_customer_id_fkey'
            columns: ['customer_id']
            isOneToOne: false
            referencedRelation: 'customers'
            referencedColumns: ['id']
          },
        ]
      }
      invites: {
        Row: {
          id: string; customer_id: string; email: string; source: string; status: string
          message: string | null; sent_at: string | null; opened_at: string | null
          completed_at: string | null; feedback_id: string | null; created_at: string
        }
        Insert: {
          id?: string; customer_id: string; email: string; source?: string; status?: string
          message?: string | null; sent_at?: string | null; opened_at?: string | null
          completed_at?: string | null; feedback_id?: string | null; created_at?: string
        }
        Update: {
          id?: string; customer_id?: string; email?: string; source?: string; status?: string
          message?: string | null; sent_at?: string | null; opened_at?: string | null
          completed_at?: string | null; feedback_id?: string | null; created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'invites_customer_id_fkey'
            columns: ['customer_id']
            isOneToOne: false
            referencedRelation: 'customers'
            referencedColumns: ['id']
          },
        ]
      }
      feedback: {
        Row: { created_at: string; customer_id: string; id: string; message: string | null; rating: number }
        Insert: { created_at?: string; customer_id: string; id?: string; message?: string | null; rating: number }
        Update: { created_at?: string; customer_id?: string; id?: string; message?: string | null; rating?: number }
        Relationships: [
          {
            foreignKeyName: 'feedback_customer_id_fkey'
            columns: ['customer_id']
            isOneToOne: false
            referencedRelation: 'customers'
            referencedColumns: ['id']
          },
        ]
      }
      leads: {
        Row: { created_at: string; email: string; id: string; source: string | null }
        Insert: { created_at?: string; email: string; id?: string; source?: string | null }
        Update: { created_at?: string; email?: string; id?: string; source?: string | null }
        Relationships: []
      }
    }
    Views: Record<never, never>
    Functions: {
      is_admin: { Args: Record<string, never>; Returns: boolean }
      admin_user_logins: { Args: Record<string, never>; Returns: { user_id: string; last_sign_in_at: string | null }[] }
      validate_coupon: {
        Args: { p_code: string }
        Returns: { code: string; free_months: number }[]
      }
      mark_invite_sent: { Args: { p_invite: string; p_ok: boolean }; Returns: undefined }
      record_google_snapshot: {
        Args: { p_customer: string; p_rating: number | null; p_count: number | null; p_source?: string }
        Returns: undefined
      }
      mark_invite_opened: { Args: { p_invite: string }; Returns: undefined }
      mark_invite_completed: { Args: { p_invite: string; p_feedback: string }; Returns: undefined }
      get_widget: {
        Args: { p_slug: string }
        Returns: {
          customer_id: string; slug: string; company_name: string | null
          bg_color: string; text_color: string; google_url: string | null
          feedback_prompt: string; review_platform: string; google_place_id: string | null; widget_texts: Json
        }[]
      }
    }
    Enums: Record<never, never>
    CompositeTypes: Record<never, never>
  }
}

type PublicSchema = Database['public']
export type Tables<T extends keyof PublicSchema['Tables']> = PublicSchema['Tables'][T]['Row']
export type TablesInsert<T extends keyof PublicSchema['Tables']> = PublicSchema['Tables'][T]['Insert']
export type TablesUpdate<T extends keyof PublicSchema['Tables']> = PublicSchema['Tables'][T]['Update']

export type Customer = Tables<'customers'>
export type Feedback = Tables<'feedback'>
export type Invite = Tables<'invites'>
export type WidgetPublic = Database['public']['Functions']['get_widget']['Returns'][number]
export type Lead = Tables<'leads'>
export type ContactMessage = Tables<'contact_messages'>
