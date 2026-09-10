import { supabase } from '@/lib/supabase';
import type { Challenge, CreateChallengeData, UpdateChallengeData, ChallengeMember, ChallengeProgress } from '../types/challenge.types';

const db = supabase as any;

export const challengeService = {
    // Get all challenges for an organization
    async getChallenges(organizationId: string, filters?: { status?: string; type?: string }): Promise<Challenge[]> {
        let query = db
            .from('challenges')
            .select('*')
            .eq('organization_id', organizationId)
            .order('created_at', { ascending: false });

        if (filters?.status) {
            query = query.eq('status', filters.status);
        }
        if (filters?.type) {
            query = query.eq('type', filters.type);
        }

        const { data, error } = await query;

        if (error) {
            console.error('Error fetching challenges:', error);
            return [];
        }

        return data as Challenge[];
    },

    // Get a single challenge
    async getChallenge(id: string): Promise<Challenge | null> {
        const { data, error } = await db
            .from('challenges')
            .select('*')
            .eq('id', id)
            .single();

        if (error) {
            console.error('Error fetching challenge:', error);
            return null;
        }

        return data as Challenge;
    },

    // Create a challenge
    async createChallenge(data: CreateChallengeData): Promise<Challenge | null> {
        const { data: challenge, error } = await db
            .from('challenges')
            .insert({
                organization_id: data.organization_id,
                title: data.title,
                description: data.description,
                objective: data.objective,
                type: data.type,
                points_reward: data.points_reward,
                start_at: data.start_at,
                end_at: data.end_at,
                eligibility: data.eligibility || null,
                visibility: data.visibility || 'public',
                status: data.status || 'draft',
                requirements: data.requirements || {},
                created_by: data.created_by,
            })
            .select()
            .single();

        if (error) {
            console.error('Error creating challenge:', error);
            return null;
        }

        return challenge as Challenge;
    },

    // Update a challenge
    async updateChallenge(id: string, data: UpdateChallengeData): Promise<Challenge | null> {
        const updateData: Record<string, any> = {
            updated_at: new Date().toISOString(),
        };

        if (data.title !== undefined) updateData.title = data.title;
        if (data.description !== undefined) updateData.description = data.description;
        if (data.objective !== undefined) updateData.objective = data.objective;
        if (data.type !== undefined) updateData.type = data.type;
        if (data.points_reward !== undefined) updateData.points_reward = data.points_reward;
        if (data.start_at !== undefined) updateData.start_at = data.start_at;
        if (data.end_at !== undefined) updateData.end_at = data.end_at;
        if (data.eligibility !== undefined) updateData.eligibility = data.eligibility;
        if (data.visibility !== undefined) updateData.visibility = data.visibility;
        if (data.status !== undefined) updateData.status = data.status;
        if (data.requirements !== undefined) updateData.requirements = data.requirements;

        const { data: updated, error } = await db
            .from('challenges')
            .update(updateData)
            .eq('id', id)
            .select()
            .single();

        if (error) {
            console.error('Error updating challenge:', error);
            return null;
        }

        return updated as Challenge;
    },

    // Delete a challenge
    async deleteChallenge(id: string): Promise<boolean> {
        const { error } = await db
            .from('challenges')
            .delete()
            .eq('id', id);

        if (error) {
            console.error('Error deleting challenge:', error);
            return false;
        }

        return true;
    },

    // Join a challenge
    async joinChallenge(challengeId: string, profileId: string): Promise<ChallengeMember | null> {
        const { data, error } = await db
            .from('challenge_members')
            .insert({
                challenge_id: challengeId,
                profile_id: profileId,
                status: 'active',
            })
            .select()
            .single();

        if (error) {
            console.error('Error joining challenge:', error);
            return null;
        }

        return data as ChallengeMember;
    },

    // Get challenge members
    async getChallengeMembers(challengeId: string): Promise<ChallengeMember[]> {
        const { data, error } = await db
            .from('challenge_members')
            .select('*, profiles(first_name, last_name, email)')
            .eq('challenge_id', challengeId);

        if (error) {
            console.error('Error fetching challenge members:', error);
            return [];
        }

        return data as ChallengeMember[];
    },

    // Get user's challenges
    async getUserChallenges(profileId: string): Promise<Challenge[]> {
        const { data, error } = await db
            .from('challenge_members')
            .select('challenges(*)')
            .eq('profile_id', profileId)
            .eq('status', 'active');

        if (error) {
            console.error('Error fetching user challenges:', error);
            return [];
        }

        return data.map((item: any) => item.challenges) as Challenge[];
    },

    // Get challenge progress for a user
    async getChallengeProgress(challengeId: string, profileId: string): Promise<ChallengeProgress[]> {
        const { data, error } = await db
            .from('challenge_progress')
            .select('*')
            .eq('challenge_id', challengeId)
            .eq('profile_id', profileId);

        if (error) {
            console.error('Error fetching challenge progress:', error);
            return [];
        }

        return data as ChallengeProgress[];
    },

    // Update challenge progress (called when activity is verified)
    async updateProgress(challengeId: string, profileId: string, activityId: string): Promise<ChallengeProgress | null> {
        // Check if progress already exists
        const { data: existing } = await db
            .from('challenge_progress')
            .select('*')
            .eq('challenge_id', challengeId)
            .eq('profile_id', profileId)
            .eq('activity_id', activityId)
            .single();

        if (existing) {
            // Update existing progress
            const { data: updated, error } = await db
                .from('challenge_progress')
                .update({
                    progress_value: existing.progress_value + 1,
                    updated_at: new Date().toISOString(),
                })
                .eq('id', existing.id)
                .select()
                .single();

            if (error) {
                console.error('Error updating progress:', error);
                return null;
            }

            return updated as ChallengeProgress;
        }

        // Create new progress
        const { data: created, error } = await db
            .from('challenge_progress')
            .insert({
                challenge_id: challengeId,
                profile_id: profileId,
                activity_id: activityId,
                progress_value: 1,
                target_value: 1,
            })
            .select()
            .single();

        if (error) {
            console.error('Error creating progress:', error);
            return null;
        }

        return created as ChallengeProgress;
    },

    // Complete a challenge for a user
    async completeChallenge(challengeId: string, profileId: string): Promise<boolean> {
        // Update challenge member status
        const { error: memberError } = await db
            .from('challenge_members')
            .update({
                status: 'completed',
                completed_at: new Date().toISOString(),
            })
            .eq('challenge_id', challengeId)
            .eq('profile_id', profileId);

        if (memberError) {
            console.error('Error completing challenge:', memberError);
            return false;
        }

        // Award points via Edge Function
        const challenge = await this.getChallenge(challengeId);
        if (challenge) {
            const { error: pointsError } = await supabase.functions.invoke('award-points', {
                body: {
                    profileId,
                    amount: challenge.points_reward,
                    source: 'challenge',
                    sourceId: challengeId,
                    description: `Completed challenge: ${challenge.title}`,
                },
            });

            if (pointsError) {
                console.error('Error awarding points for challenge:', pointsError);
            }
        }

        return true;
    },
};