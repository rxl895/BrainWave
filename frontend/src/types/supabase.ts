export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          email: string
          full_name: string | null
          avatar_url: string | null
          created_at: string
          updated_at: string
          preferences: Json
        }
        Insert: {
          id: string
          email: string
          full_name?: string | null
          avatar_url?: string | null
          created_at?: string
          updated_at?: string
          preferences?: Json
        }
        Update: {
          id?: string
          email?: string
          full_name?: string | null
          avatar_url?: string | null
          created_at?: string
          updated_at?: string
          preferences?: Json
        }
      }
      study_groups: {
        Row: {
          id: string
          name: string
          description: string | null
          is_private: boolean
          created_by: string
          created_at: string
          updated_at: string
          settings: Json
          max_members: number
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
          is_private?: boolean
          created_by: string
          created_at?: string
          updated_at?: string
          settings?: Json
          max_members?: number
        }
        Update: {
          id?: string
          name?: string
          description?: string | null
          is_private?: boolean
          created_by?: string
          created_at?: string
          updated_at?: string
          settings?: Json
          max_members?: number
        }
      }
      group_members: {
        Row: {
          id: string
          group_id: string
          user_id: string
          role: string
          joined_at: string
        }
        Insert: {
          id?: string
          group_id: string
          user_id: string
          role?: string
          joined_at?: string
        }
        Update: {
          id?: string
          group_id?: string
          user_id?: string
          role?: string
          joined_at?: string
        }
      }
    }
  }
} 