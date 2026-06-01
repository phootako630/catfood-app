export interface Database {
  public: {
    Tables: {
      households: {
        Row: Household
        Insert: Omit<Household, 'id' | 'created_at'>
        Update: Partial<Omit<Household, 'id'>>
      }
      profiles: {
        Row: Profile
        Insert: Omit<Profile, 'created_at'>
        Update: Partial<Omit<Profile, 'id'>>
      }
      cats: {
        Row: Cat
        Insert: Omit<Cat, 'id' | 'created_at'>
        Update: Partial<Omit<Cat, 'id'>>
      }
      diet_plans: {
        Row: DietPlan
        Insert: Omit<DietPlan, 'id' | 'created_at'>
        Update: Partial<Omit<DietPlan, 'id'>>
      }
      feeding_logs: {
        Row: FeedingLog
        Insert: Omit<FeedingLog, 'id' | 'created_at'>
        Update: Partial<Omit<FeedingLog, 'id'>>
      }
      weight_logs: {
        Row: WeightLog
        Insert: Omit<WeightLog, 'id' | 'created_at'>
        Update: Partial<Omit<WeightLog, 'id'>>
      }
    }
  }
}

export interface Household {
  id: string
  name: string
  invite_code: string
  created_by: string | null
  created_at: string
}

export interface Profile {
  id: string
  display_name: string
  avatar_url: string | null
  household_id: string | null
  created_at: string
}

export interface Cat {
  id: string
  household_id: string
  name: string
  breed: string | null
  birth_date: string | null
  avatar_url: string | null
  created_at: string
}

export interface DietPlan {
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

export interface FeedingLog {
  id: string
  cat_id: string
  amount_g: number
  fed_by: string
  fed_at: string
  note: string | null
  created_at: string
}

export interface WeightLog {
  id: string
  cat_id: string
  weight_kg: number
  recorded_by: string | null
  recorded_at: string
  note: string | null
  created_at: string
}
