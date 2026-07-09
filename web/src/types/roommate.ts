export interface RoommateProfile {
  id: string
  user_id: string
  budget_min?: number
  budget_max?: number
  preferred_lgas?: string[]
  lifestyle_tags?: string[]
  gender_preference?: 'male' | 'female' | 'any'
  bio?: string
  user?: { first_name: string; last_name: string; avatar_url?: string }
}

export interface RoommateMatch {
  id: string
  score: number
  profile: RoommateProfile
}

export interface RoommateRequest {
  id: string
  status: 'pending' | 'accepted' | 'declined'
  sender_id: string
  receiver_id: string
  created_at: string
  sender?: { first_name: string; last_name: string; avatar_url?: string }
  receiver?: { first_name: string; last_name: string; avatar_url?: string }
}
