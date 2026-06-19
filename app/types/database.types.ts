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
      customers: {
        Row: {
          bg_color: string; company_name: string | null; created_at: string; email: string | null
          google_url: string | null; id: string; package: string; phone: string | null
          postcode_city: string | null; slug: string; status: string; street: string | null
          text_color: string; user_id: string; website: string | null
        }
        Insert: {
          bg_color?: string; company_name?: string | null; created_at?: string; email?: string | null
          google_url?: string | null; id?: string; package?: string; phone?: string | null
          postcode_city?: string | null; slug: string; status?: string; street?: string | null
          text_color?: string; user_id: string; website?: string | null
        }
        Update: {
          bg_color?: string; company_name?: string | null; created_at?: string; email?: string | null
          google_url?: string | null; id?: string; package?: string; phone?: string | null
          postcode_city?: string | null; slug?: string; status?: string; street?: string | null
          text_color?: string; user_id?: string; website?: string | null
        }
        Relationships: []
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
    Functions: { is_admin: { Args: Record<string, never>; Returns: boolean } }
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
export type Lead = Tables<'leads'>
export type ContactMessage = Tables<'contact_messages'>
