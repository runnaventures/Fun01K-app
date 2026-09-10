import { useState } from 'react';
import { useAuth } from '@/app/providers/AuthProvider';
import { useOrganization } from '@/app/providers/OrganizationProvider';
import { useChallenges, useCreateChallenge, useUpdateChallenge, useDeleteChallenge } from '@/features/shared/challenges/queries/challengeQueries';
import { LoadingScreen } from '@/components/feedback/LoadingScreen';
import type { Challenge } from '@/features/shared/challenges/types/challenge.types';

type ChallengeStatus = 'draft' | 'published' | 'active' | 'completed' | 'cancelled';
type ChallengeType = 'individual' | 'team' | 'department' | 'company' | 'invite_only';

export default function ChallengesPage() {
    const { user } = useAuth();
    const { organizationMember } = useOrganization();
    const organizationId = organizationMember?.organization_id || '';

    const { data: challenges, isLoading, refetch } = useChallenges(organizationId);
    const { mutate: createChallenge, isPending: isCreating } = useCreateChallenge();
    const { mutate: updateChallenge } = useUpdateChallenge();
    const { mutate: deleteChallenge } = useDeleteChallenge();

    const [isCreatingChallenge, setIsCreatingChallenge] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        objective: '',
        type: 'individual' as ChallengeType,
        points_reward: 50,
        start_at: '',
        end_at: '',
        visibility: 'public' as 'public' | 'private',
        status: 'draft' as ChallengeStatus,
        eligibility: '',
    });

    const handleCreate = () => {
        setFormData({
            title: '',
            description: '',
            objective: '',
            type: 'individual',
            points_reward: 50,
            start_at: '',
            end_at: '',
            visibility: 'public',
            status: 'draft',
            eligibility: '',
        });
        setIsCreatingChallenge(true);
    };

    const handleEdit = (challenge: Challenge) => {
        setFormData({
            title: challenge.title,
            description: challenge.description,
            objective: challenge.objective,
            type: challenge.type,
            points_reward: challenge.points_reward,
            start_at: challenge.start_at?.slice(0, 16) || '',
            end_at: challenge.end_at?.slice(0, 16) || '',
            visibility: challenge.visibility,
            status: challenge.status,
            eligibility: challenge.eligibility || '',
        });
        setEditingId(challenge.id);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (!user?.id) return;

        const submitData = {
            organization_id: organizationId,
            title: formData.title,
            description: formData.description,
            objective: formData.objective,
            type: formData.type,
            points_reward: formData.points_reward,
            start_at: new Date(formData.start_at).toISOString(),
            end_at: new Date(formData.end_at).toISOString(),
            visibility: formData.visibility,
            status: formData.status,
            eligibility: formData.eligibility || undefined,
            created_by: user.id,
        };

        if (editingId) {
            updateChallenge({
                id: editingId,
                data: submitData,
            }, {
                onSuccess: () => {
                    setEditingId(null);
                    refetch();
                },
            });
        } else {
            createChallenge(submitData, {
                onSuccess: () => {
                    setIsCreatingChallenge(false);
                    refetch();
                },
            });
        }
    };

    const handleDelete = (id: string) => {
        if (window.confirm('Are you sure you want to delete this challenge?')) {
            deleteChallenge(id, {
                onSuccess: () => {
                    refetch();
                },
            });
        }
    };

    const handleCancel = () => {
        setIsCreatingChallenge(false);
        setEditingId(null);
    };

    if (isLoading) {
        return <LoadingScreen />;
    }

    const statusColors: Record<string, string> = {
        draft: 'bg-gray-500/10 text-gray-600',
        published: 'bg-blue-500/10 text-blue-600',
        active: 'bg-green-500/10 text-green-600',
        completed: 'bg-purple-500/10 text-purple-600',
        cancelled: 'bg-red-500/10 text-red-600',
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Challenges</h1>
                    <p className="text-muted-foreground">
                        Create and manage challenges for your employees
                    </p>
                </div>
                {!isCreatingChallenge && !editingId && (
                    <button
                        onClick={handleCreate}
                        className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
                    >
                        Create Challenge
                    </button>
                )}
            </div>

            {/* Create/Edit Form */}
            {(isCreatingChallenge || editingId) && (
                <div className="rounded-lg border bg-card p-6 shadow-sm">
                    <h2 className="text-xl font-semibold mb-4">
                        {editingId ? 'Edit Challenge' : 'Create Challenge'}
                    </h2>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="grid gap-4 md:grid-cols-2">
                            <div className="md:col-span-2">
                                <label className="block text-sm font-medium mb-1">Title *</label>
                                <input
                                    type="text"
                                    value={formData.title}
                                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                    required
                                    className="w-full px-3 py-2 border border-input rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-ring"
                                    placeholder="30-Day Fitness Challenge"
                                />
                            </div>
                            <div className="md:col-span-2">
                                <label className="block text-sm font-medium mb-1">Description *</label>
                                <textarea
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    required
                                    rows={3}
                                    className="w-full px-3 py-2 border border-input rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-ring"
                                    placeholder="Describe the challenge..."
                                />
                            </div>
                            <div className="md:col-span-2">
                                <label className="block text-sm font-medium mb-1">Objective *</label>
                                <textarea
                                    value={formData.objective}
                                    onChange={(e) => setFormData({ ...formData, objective: e.target.value })}
                                    required
                                    rows={2}
                                    className="w-full px-3 py-2 border border-input rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-ring"
                                    placeholder="Complete 30 fitness activities in 30 days..."
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">Type *</label>
                                <select
                                    value={formData.type}
                                    onChange={(e) => setFormData({ ...formData, type: e.target.value as ChallengeType })}
                                    className="w-full px-3 py-2 border border-input rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-ring"
                                >
                                    <option value="individual">Individual</option>
                                    <option value="team">Team</option>
                                    <option value="department">Department</option>
                                    <option value="company">Company</option>
                                    <option value="invite_only">Invite Only</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">Points Reward *</label>
                                <input
                                    type="number"
                                    value={formData.points_reward}
                                    onChange={(e) => setFormData({ ...formData, points_reward: parseInt(e.target.value) || 0 })}
                                    required
                                    min="0"
                                    className="w-full px-3 py-2 border border-input rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-ring"
                                    placeholder="50"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">Start Date *</label>
                                <input
                                    type="datetime-local"
                                    value={formData.start_at}
                                    onChange={(e) => setFormData({ ...formData, start_at: e.target.value })}
                                    required
                                    className="w-full px-3 py-2 border border-input rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-ring"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">End Date *</label>
                                <input
                                    type="datetime-local"
                                    value={formData.end_at}
                                    onChange={(e) => setFormData({ ...formData, end_at: e.target.value })}
                                    required
                                    className="w-full px-3 py-2 border border-input rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-ring"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">Status</label>
                                <select
                                    value={formData.status}
                                    onChange={(e) => setFormData({ ...formData, status: e.target.value as ChallengeStatus })}
                                    className="w-full px-3 py-2 border border-input rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-ring"
                                >
                                    <option value="draft">Draft</option>
                                    <option value="published">Published</option>
                                    <option value="active">Active</option>
                                    <option value="completed">Completed</option>
                                    <option value="cancelled">Cancelled</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">Visibility</label>
                                <select
                                    value={formData.visibility}
                                    onChange={(e) => setFormData({ ...formData, visibility: e.target.value as 'public' | 'private' })}
                                    className="w-full px-3 py-2 border border-input rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-ring"
                                >
                                    <option value="public">Public</option>
                                    <option value="private">Private</option>
                                </select>
                            </div>
                            <div className="md:col-span-2">
                                <label className="block text-sm font-medium mb-1">Eligibility (Optional)</label>
                                <input
                                    type="text"
                                    value={formData.eligibility}
                                    onChange={(e) => setFormData({ ...formData, eligibility: e.target.value })}
                                    className="w-full px-3 py-2 border border-input rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-ring"
                                    placeholder="Open to all employees"
                                />
                            </div>
                        </div>

                        <div className="flex gap-3">
                            <button
                                type="submit"
                                disabled={isCreating}
                                className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50"
                            >
                                {isCreating ? 'Saving...' : editingId ? 'Update' : 'Create'}
                            </button>
                            <button
                                type="button"
                                onClick={handleCancel}
                                className="rounded-md border border-input px-4 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground transition-colors"
                            >
                                Cancel
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* Challenges List */}
            <div className="rounded-lg border bg-card shadow-sm">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="border-b bg-muted/50">
                                <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Title</th>
                                <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Type</th>
                                <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Points</th>
                                <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Status</th>
                                <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Participants</th>
                                <th className="px-4 py-3 text-right text-sm font-medium text-muted-foreground">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {challenges?.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">
                                        No challenges found
                                    </td>
                                </tr>
                            ) : (
                                challenges?.map((challenge: Challenge) => (
                                    <tr key={challenge.id} className="border-b hover:bg-muted/50 transition-colors">
                                        <td className="px-4 py-3 text-sm font-medium">{challenge.title}</td>
                                        <td className="px-4 py-3 text-sm text-muted-foreground capitalize">{challenge.type}</td>
                                        <td className="px-4 py-3 text-sm font-semibold">{challenge.points_reward}</td>
                                        <td className="px-4 py-3">
                                            <span className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${statusColors[challenge.status]}`}>
                                                {challenge.status}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-sm text-muted-foreground">0</td>
                                        <td className="px-4 py-3 text-right space-x-2">
                                            <button
                                                onClick={() => handleEdit(challenge)}
                                                className="text-sm text-primary hover:underline"
                                            >
                                                Edit
                                            </button>
                                            <button
                                                onClick={() => handleDelete(challenge.id)}
                                                className="text-sm text-destructive hover:underline"
                                            >
                                                Delete
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}