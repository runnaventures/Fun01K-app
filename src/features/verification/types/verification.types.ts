export interface VerificationRequest {
  activityId: string;
  profileId: string;
  method: 'gps' | 'qr' | 'host_approval' | 'manual';
  location?: {
    latitude: number;
    longitude: number;
    accuracy?: number;
  };
  qrCode?: string;
  hostId?: string;
  notes?: string;
}

export interface VerificationResult {
  success: boolean;
  message: string;
  data?: {
    verified: boolean;
    pointsEarned?: number;
    verificationId?: string;
    timestamp?: string;
  };
  error?: string;
}

export interface LocationVerification {
  id: string;
  activity_id: string;
  profile_id: string;
  latitude: number;
  longitude: number;
  accuracy: number;
  is_verified: boolean;
  verified_at?: string;
  created_at: string;
}

export interface QRVerification {
  id: string;
  activity_id: string;
  profile_id: string;
  qr_code: string;
  scanned_at: string;
  is_verified: boolean;
  verified_at?: string;
  created_at: string;
}

export interface HostApproval {
  id: string;
  activity_id: string;
  profile_id: string;
  host_id: string;
  status: 'pending' | 'approved' | 'rejected';
  notes?: string;
  approved_at?: string;
  created_at: string;
  updated_at: string;
}