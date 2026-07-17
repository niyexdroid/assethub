export type InspectionStatus = 'draft' | 'pending_review' | 'signed' | 'disputed';
export type ItemCondition = 'good' | 'fair' | 'damaged' | 'missing';

export interface InspectionItem {
  id: string;
  report_id: string;
  item_name: string;
  description: string | null;
  condition: ItemCondition;
  photo_urls: string[];
  capture_source: string;
  captured_at: string | null;
  notes: string | null;
  sort_order: number;
  created_at: string;
}

export interface InspectionReport {
  id: string;
  tenancy_id: string;
  created_by: string;
  status: InspectionStatus;
  gps_lat: number | null;
  gps_lng: number | null;
  gps_captured_at: string | null;
  content_hash: string | null;
  tenant_signed_at: string | null;
  landlord_signed_at: string | null;
  disputed_at: string | null;
  disputed_by: string | null;
  dispute_reason: string | null;
  pdf_url: string | null;
  created_at: string;
  updated_at: string;
  items?: InspectionItem[];
  // Joined fields
  property_title?: string;
  tenant_name?: string;
  landlord_name?: string;
}
