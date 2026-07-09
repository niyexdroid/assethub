export interface AppNotification {
  id: string
  type: string
  title: string
  body: string
  data?: Record<string, any>
  is_read: boolean
  created_at: string
}
