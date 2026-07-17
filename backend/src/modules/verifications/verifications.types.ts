export type VerificationDocType = 'utility_bill' | 'land_registry' | 'property_title';
export type VerificationStatus = 'pending' | 'approved' | 'rejected';

export interface LandlordVerification {
  id: string;
  landlord_id: string;
  verification_type: VerificationDocType;
  document_url: string;
  status: VerificationStatus;
  reviewed_by: string | null;
  rejection_reason: string | null;
  verified_at: string | null;
  created_at: string;
}
