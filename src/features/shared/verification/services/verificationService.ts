import { supabase } from '@/lib/supabase';
import type { VerificationRequest, VerificationResult, LocationVerification, QRVerification, HostApproval } from '../types/verification.types';

// Helper to get a typed Supabase client with any
const db = supabase as any;

export const verificationService = {
  // GPS Verification
  async verifyLocation(activityId: string, profileId: string, latitude: number, longitude: number, accuracy?: number): Promise<VerificationResult> {
    try {
      // Get the activity with location
      const { data: activity, error: activityError } = await db
        .from('activities')
        .select('*, locations(*)')
        .eq('id', activityId)
        .single();

      if (activityError || !activity) {
        return { success: false, message: 'Activity not found', error: 'Activity not found' };
      }

      // Check if location verification is required
      if (!activity.requires_location) {
        return { success: false, message: 'This activity does not require location verification', error: 'Location not required' };
      }

      // Get the activity location
      const location = activity.locations;
      if (!location) {
        return { success: false, message: 'No location set for this activity', error: 'Location not set' };
      }

      // Calculate distance between user and activity location
      const distance = this.calculateDistance(
        latitude,
        longitude,
        location.latitude,
        location.longitude
      );

      // Check if user is within the radius
      const radius = location.radius || 100; // Default 100 meters
      if (distance > radius) {
        return {
          success: false,
          message: `You are ${Math.round(distance)} meters away. You need to be within ${radius} meters.`,
          error: 'Too far from activity location'
        };
      }

      // Record the verification
      const { data: verification, error: verificationError } = await db
        .from('activity_verifications')
        .insert({
          activity_id: activityId,
          profile_id: profileId,
          method: 'gps',
          latitude,
          longitude,
          accuracy: accuracy || null,
          is_verified: true,
          verified_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (verificationError) {
        console.error('Error recording verification:', verificationError);
        return { success: false, message: 'Failed to record verification', error: verificationError.message };
      }

      return {
        success: true,
        message: 'Location verified successfully!',
        data: {
          verified: true,
          verificationId: verification.id,
          timestamp: verification.verified_at,
        }
      };
    } catch (error) {
      console.error('Error verifying location:', error);
      return { success: false, message: 'An error occurred during verification', error: String(error) };
    }
  },

  // QR Code Verification
  async verifyQR(activityId: string, profileId: string, qrCode: string): Promise<VerificationResult> {
    try {
      // Check if QR code is valid and not expired
      const { data: qrData, error: qrError } = await db
        .from('qr_verifications')
        .select('*')
        .eq('qr_code', qrCode)
        .eq('activity_id', activityId)
        .single();

      if (qrError || !qrData) {
        return { success: false, message: 'Invalid QR code', error: 'Invalid QR code' };
      }

      // Check if QR code is expired
      if (new Date(qrData.expires_at) < new Date()) {
        return { success: false, message: 'QR code has expired', error: 'QR code expired' };
      }

      // Check if QR code has already been used
      if (qrData.used_at) {
        return { success: false, message: 'QR code has already been used', error: 'QR code already used' };
      }

      // Mark QR code as used
      const { error: updateError } = await db
        .from('qr_verifications')
        .update({
          used_at: new Date().toISOString(),
          used_by: profileId,
        })
        .eq('id', qrData.id);

      if (updateError) {
        console.error('Error updating QR code:', updateError);
        return { success: false, message: 'Failed to process QR code', error: updateError.message };
      }

      // Record the verification
      const { data: verification, error: verificationError } = await db
        .from('activity_verifications')
        .insert({
          activity_id: activityId,
          profile_id: profileId,
          method: 'qr',
          is_verified: true,
          verified_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (verificationError) {
        console.error('Error recording verification:', verificationError);
        return { success: false, message: 'Failed to record verification', error: verificationError.message };
      }

      return {
        success: true,
        message: 'QR code verified successfully!',
        data: {
          verified: true,
          verificationId: verification.id,
          timestamp: verification.verified_at,
        }
      };
    } catch (error) {
      console.error('Error verifying QR code:', error);
      return { success: false, message: 'An error occurred during verification', error: String(error) };
    }
  },

  // Host Approval
  async requestHostApproval(activityId: string, profileId: string, hostId: string, notes?: string): Promise<VerificationResult> {
    try {
      // Check if host exists and is authorized
      const { data: host, error: hostError } = await db
        .from('profiles')
        .select('*')
        .eq('id', hostId)
        .single();

      if (hostError || !host) {
        return { success: false, message: 'Host not found', error: 'Host not found' };
      }

      // Create approval request
      const { data: approval, error: approvalError } = await db
        .from('host_approvals')
        .insert({
          activity_id: activityId,
          profile_id: profileId,
          host_id: hostId,
          status: 'pending',
          notes: notes || null,
        })
        .select()
        .single();

      if (approvalError) {
        console.error('Error creating approval request:', approvalError);
        return { success: false, message: 'Failed to create approval request', error: approvalError.message };
      }

      return {
        success: true,
        message: 'Approval request sent to host',
        data: {
          verified: false,
          verificationId: approval.id,
        }
      };
    } catch (error) {
      console.error('Error requesting host approval:', error);
      return { success: false, message: 'An error occurred', error: String(error) };
    }
  },

  async approveHostRequest(approvalId: string, hostId: string): Promise<VerificationResult> {
    try {
      // Update approval status
      const { data: approval, error: approvalError } = await db
        .from('host_approvals')
        .update({
          status: 'approved',
          approved_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', approvalId)
        .eq('host_id', hostId)
        .select()
        .single();

      if (approvalError || !approval) {
        return { success: false, message: 'Failed to approve request', error: approvalError?.message || 'Approval not found' };
      }

      // Record the verification
      const { data: verification, error: verificationError } = await db
        .from('activity_verifications')
        .insert({
          activity_id: approval.activity_id,
          profile_id: approval.profile_id,
          method: 'host_approval',
          is_verified: true,
          verified_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (verificationError) {
        console.error('Error recording verification:', verificationError);
        return { success: false, message: 'Failed to record verification', error: verificationError.message };
      }

      return {
        success: true,
        message: 'Participation approved!',
        data: {
          verified: true,
          verificationId: verification.id,
          timestamp: verification.verified_at,
        }
      };
    } catch (error) {
      console.error('Error approving host request:', error);
      return { success: false, message: 'An error occurred', error: String(error) };
    }
  },

  async rejectHostRequest(approvalId: string, hostId: string, reason?: string): Promise<VerificationResult> {
    try {
      const { error: updateError } = await db
        .from('host_approvals')
        .update({
          status: 'rejected',
          notes: reason || null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', approvalId)
        .eq('host_id', hostId);

      if (updateError) {
        return { success: false, message: 'Failed to reject request', error: updateError.message };
      }

      return {
        success: true,
        message: 'Participation rejected',
      };
    } catch (error) {
      console.error('Error rejecting host request:', error);
      return { success: false, message: 'An error occurred', error: String(error) };
    }
  },

  // Helper Methods
  calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371e3; // Earth's radius in meters
    const φ1 = lat1 * Math.PI / 180;
    const φ2 = lat2 * Math.PI / 180;
    const Δφ = (lat2 - lat1) * Math.PI / 180;
    const Δλ = (lon2 - lon1) * Math.PI / 180;

    const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c;
  },

  // Get verifications for an activity
  async getVerifications(activityId: string): Promise<any[]> {
    const { data, error } = await db
      .from('activity_verifications')
      .select('*, profiles(first_name, last_name, email)')
      .eq('activity_id', activityId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching verifications:', error);
      return [];
    }

    return data;
  },

  // Get pending host approvals
  async getPendingApprovals(hostId: string): Promise<any[]> {
    const { data, error } = await db
      .from('host_approvals')
      .select('*, activities(title), profiles(first_name, last_name, email)')
      .eq('host_id', hostId)
      .eq('status', 'pending')
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error fetching pending approvals:', error);
      return [];
    }

    return data;
  },

  // Generate QR code
  async generateQRCode(activityId: string, expiresInMinutes: number = 60): Promise<string | null> {
    const qrCode = `ACT-${activityId}-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
    const expiresAt = new Date(Date.now() + expiresInMinutes * 60 * 1000);

    const { data, error } = await db
      .from('qr_verifications')
      .insert({
        activity_id: activityId,
        qr_code: qrCode,
        expires_at: expiresAt.toISOString(),
      })
      .select()
      .single();

    if (error) {
      console.error('Error generating QR code:', error);
      return null;
    }

    return qrCode;
  },

  // Award points after verification
  async awardPoints(activityId: string, profileId: string): Promise<boolean> {
    try {
      // Get activity points
      const { data: activity } = await db
        .from('activities')
        .select('points')
        .eq('id', activityId)
        .single();

      if (!activity) {
        return false;
      }

      // Award points via Edge Function
      const { data, error } = await supabase.functions.invoke('award-points', {
        body: {
          profileId,
          activityId,
          points: activity.points,
          reason: `Completed activity: ${activityId}`,
        },
      });

      if (error) {
        console.error('Error awarding points:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error in awardPoints:', error);
      return false;
    }
  },
};