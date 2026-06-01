// Supabase database types. Use `type` aliases (NOT `interface`) — interfaces
// lack an implicit index signature and fail postgrest-js's GenericSchema
// constraint, which silently degrades every table to `never`.

export type Database = {
  public: {
    Tables: {
      households: {
        Row: Household
        Insert: {
          id?: string
          name: string
          invite_code?: string
          created_by?: string | null
          created_at?: string
        }
        Update: Partial<Household>
        Relationships: []
      }
      profiles: {
        Row: Profile
        Insert: {
          id: string
          display_name: string
          avatar_url?: string | null
          household_id?: string | null
          created_at?: string
        }
        Update: Partial<Profile>
        Relationships: [
          {
            foreignKeyName: 'profiles_household_id_fkey'
            columns: ['household_id']
            isOneToOne: false
            referencedRelation: 'households'
            referencedColumns: ['id']
          }
        ]
      }
      cats: {
        Row: Cat
        Insert: {
          id?: string
          household_id: string
          name: string
          breed?: string | null
          birth_date?: string | null
          avatar_url?: string | null
          created_at?: string
        }
        Update: Partial<Cat>
        Relationships: [
          {
            foreignKeyName: 'cats_household_id_fkey'
            columns: ['household_id']
            isOneToOne: false
            referencedRelation: 'households'
            referencedColumns: ['id']
          }
        ]
      }
      diet_plans: {
        Row: DietPlan
        Insert: {
          id?: string
          cat_id: string
          daily_quota_g: number
          food_brand?: string | null
          food_name?: string | null
          target_weight_kg?: number | null
          vet_name?: string | null
          next_checkup?: string | null
          notes?: string | null
          start_date?: string
          end_date?: string | null
          is_active?: boolean
          created_by?: string | null
          created_at?: string
        }
        Update: Partial<DietPlan>
        Relationships: [
          {
            foreignKeyName: 'diet_plans_cat_id_fkey'
            columns: ['cat_id']
            isOneToOne: false
            referencedRelation: 'cats'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'diet_plans_created_by_fkey'
            columns: ['created_by']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          }
        ]
      }
      feeding_logs: {
        Row: FeedingLog
        Insert: {
          id?: string
          cat_id: string
          amount_g: number
          fed_by: string
          fed_at?: string
          note?: string | null
          created_at?: string
        }
        Update: Partial<FeedingLog>
        Relationships: [
          {
            foreignKeyName: 'feeding_logs_cat_id_fkey'
            columns: ['cat_id']
            isOneToOne: false
            referencedRelation: 'cats'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'feeding_logs_fed_by_fkey'
            columns: ['fed_by']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          }
        ]
      }
      weight_logs: {
        Row: WeightLog
        Insert: {
          id?: string
          cat_id: string
          weight_kg: number
          recorded_by?: string | null
          recorded_at?: string
          note?: string | null
          created_at?: string
        }
        Update: Partial<WeightLog>
        Relationships: [
          {
            foreignKeyName: 'weight_logs_cat_id_fkey'
            columns: ['cat_id']
            isOneToOne: false
            referencedRelation: 'cats'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'weight_logs_recorded_by_fkey'
            columns: ['recorded_by']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          }
        ]
      }
    }
    Views: { [_ in never]: never }
    Functions: { [_ in never]: never }
    Enums: { [_ in never]: never }
    CompositeTypes: { [_ in never]: never }
  }
}

export type Household = {
  id: string
  name: string
  invite_code: string
  created_by: string | null
  created_at: string
}

export type Profile = {
  id: string
  display_name: string
  avatar_url: string | null
  household_id: string | null
  created_at: string
}

export type Cat = {
  id: string
  household_id: string
  name: string
  breed: string | null
  birth_date: string | null
  avatar_url: string | null
  created_at: string
}

export type DietPlan = {
  id: string
  cat_id: string
  daily_quota_g: number
  food_brand: string | null
  food_name: string | null
  target_weight_kg: number | null
  vet_name: string | null
  next_checkup: string | null
  notes: string | null
  start_date: string
  end_date: string | null
  is_active: boolean
  created_by: string | null
  created_at: string
}

export type FeedingLog = {
  id: string
  cat_id: string
  amount_g: number
  fed_by: string
  fed_at: string
  note: string | null
  created_at: string
}

export type WeightLog = {
  id: string
  cat_id: string
  weight_kg: number
  recorded_by: string | null
  recorded_at: string
  note: string | null
  created_at: string
}
