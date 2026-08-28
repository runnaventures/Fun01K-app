import { useState } from 'react';
import { useAuth } from '@/app/providers/AuthProvider';
import { useOrganization } from '@/app/providers/OrganizationProvider';
import { useChallenges, useJoinChallenge, useUserChallenges } from '../queries/challengeQueries';
import { LoadingScreen } from '@/components/feedback/LoadingScreen';
import type { Challenge } from '../types/challenge.types';

export default function ChallengesPage() {
    const { user } = useAuth();
    const { organizationMember } = useOrganization();
    const organizationId = organizationMember?.organization_id || '';

    const [activeTab, setActiveTab] = useState<'available' | 'my'>('available');

    const { data: allChallenges, isLoading: challengesLoading } = useChallenges(organizationId, { status: 'active' });
    const { data: userChallenges, isLoading: userChallengesLoading } = useUserChallenges();
    const { mutate: joinChallenge, isPending: isJoining } = useJoinChallenge();

    const isLoading = challengesLoading || userChallengesLoading;

    // Get IDs of challenges the user has joined
    const joinedChallengeIds = userChallenges?.map((c: Challenge) => c.id) || [];

    // Available challenges = all active challenges minus joined ones
    const availableChallenges = allChallenges?.filter(
        (c: Challenge) => !joinedChallengeIds.includes(c.id)
    ) || [];

    if (isLoading) {
        return <LoadingScreen />;
    }

    const handleJoin = (challengeId: string) => {
        if (!user?.id) return;
        joinChallenge({ challengeId, profileId: user.id });
    };

    const getStatusBadge = (status: string) => {
        const colors: Record<string, string> = {
            draft: 'bg-gray-500/10 text-gray-600',
            published: 'bg-blue-500/10 text-blue-600',
            active: 'bg-green-500/10 text-green-600',
            completed: 'bg-purple-500/10 text-purple-600',
            cancelled: 'bg-red-500/10 text-red-600',
        };
        return colors[status] || 'bg-gray-500/10 text-gray-600';
    };

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Challenges</h1>
                <p className="text-muted-foreground">
                    Join challenges and earn bonus points!
                </p>
            </div>

            {/* Tabs */}
            <div className="border-b">
                <nav className="flex gap-6">
                    <button
                        onClick={() => setActiveTab('available')}
                        className={`pb-2 px-1 text-sm font-medium border-b-2 transition-colors ${
                            activeTab === 'available'
                                ? 'border-primary text-primary'
                                : 'border-transparent text-muted-foreground hover:text-foreground'
                        }`}
                    >
                        Available Challenges
                    </button>
                    <button
                        onClick={() => setActiveTab('my')}
                        className={`pb-2 px-1 text-sm font-medium border-b-2 transition-colors ${
                            activeTab === 'my'
                                ? 'border-primary text-primary'
                                : 'border-transparent text-muted-foreground hover:text-foreground'
                        }`}
                    >
                        My Challenges
                    </button>
                </nav>
            </div>

            {/* Available Challenges */}
            {activeTab === 'available' && (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {availableChallenges.length === 0 ? (
                        <div className="col-span-full text-center py-12 text-muted-foreground">
                            No active challenges available right now. Check back later!
                        </div>
                    ) : (
                        availableChallenges.map((challenge: Challenge) => (
                            <div key={challenge.id} className="rounded-lg border bg-card p-6 shadow-sm hover:shadow-md transition-shadow">
                                <div className="flex items-start justify-between mb-2">
                                    <h3 className="font-semibold text-foreground">{challenge.title}</h3>
                                    <span className={`text-xs px-2 py-1 rounded-full ${getStatusBadge(challenge.status)}`}>
                                        {challenge.status}
                                    </span>
                                </div>
                                <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                                    {challenge.description}
                                </p>
                                <div className="flex items-center justify-between text-sm mb-4">
                                    <span className="text-muted-foreground">🏆 {challenge.points_reward} pts</span>
                                    <span className="text-muted-foreground">{challenge.type}</span>
                                </div>
                                <button
                                    onClick={() => handleJoin(challenge.id)}
                                    disabled={isJoining}
                                    className="w-full rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50"
                                >
                                    {isJoining ? 'Joining...' : 'Join Challenge'}
                                </button>
                            </div>
                        ))
                    )}
                </div>
            )}

            {/* My Challenges */}
            {activeTab === 'my' && (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {userChallenges?.length === 0 ? (
                        <div className="col-span-full text-center py-12 text-muted-foreground">
                            You haven't joined any challenges yet. Browse available challenges above!
                        </div>
                    ) : (
                        userChallenges?.map((challenge: Challenge) => (
                            <div key={challenge.id} className="rounded-lg border bg-card p-6 shadow-sm hover:shadow-md transition-shadow">
                                <h3 className="font-semibold text-foreground mb-2">{challenge.title}</h3>
                                <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                                    {challenge.description}
                                </p>
                                <div className="flex items-center justify-between text-sm mb-3">
                                    <span className="text-muted-foreground">🏆 {challenge.points_reward} pts</span>
                                    <span className={`text-xs px-2 py-1 rounded-full ${getStatusBadge(challenge.status)}`}>
                                        {challenge.status}
                                    </span>
                                </div>
                                <div className="w-full bg-muted rounded-full h-2">
                                    <div
                                        className="bg-primary h-2 rounded-full transition-all"
                                        style={{ width: '0%' }}
                                    />
                                </div>
                                <p className="text-xs text-muted-foreground mt-1">0% complete</p>
                            </div>
                        ))
                    )}
                </div>
            )}
        </div>
    );
}