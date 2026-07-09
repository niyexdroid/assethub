export interface PaymentScheduleItem {
  id: string
  tenancy_id: string
  due_date: string
  amount: number
  status: 'pending' | 'paid' | 'overdue'
  paid_at?: string
}

export interface PaymentTransaction {
  id: string
  tenancy_id: string
  amount: number
  reference: string
  status: 'pending' | 'success' | 'failed'
  channel: string
  paid_at?: string
  created_at: string
  property?: { title: string }
  tenant?: { first_name: string; last_name: string }
}
