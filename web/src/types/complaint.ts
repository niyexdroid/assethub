export interface Complaint {
  id: string
  category: string
  title: string
  description: string
  priority: 'low' | 'medium' | 'high'
  status: 'open' | 'in_progress' | 'resolved' | 'escalated'
  tenancy_id?: string
  property_id?: string
  created_by: string
  created_at: string
  updated_at: string
  property?: { title: string }
  tenancy?: { id: string }
  creator?: { first_name: string; last_name: string; avatar_url?: string }
}

export interface ComplaintMessage {
  id: string
  complaint_id: string
  sender_id: string
  message: string
  created_at: string
  sender?: { first_name: string; last_name: string; avatar_url?: string }
}
