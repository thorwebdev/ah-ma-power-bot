export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json }
  | Json[]

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          age: number | null
          created_at: string | null
          experience: string | null
          id: number
          name: string
          photo_url: string | null
          resume_html: string | null
          resume_markdown: string | null
          step: number
        }
        Insert: {
          age?: number | null
          created_at?: string | null
          experience?: string | null
          id: number
          name: string
          photo_url?: string | null
          resume_html?: string | null
          resume_markdown?: string | null
          step?: number
        }
        Update: {
          age?: number | null
          created_at?: string | null
          experience?: string | null
          id?: number
          name?: string
          photo_url?: string | null
          resume_html?: string | null
          resume_markdown?: string | null
          step?: number
        }
        Relationships: []
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
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

