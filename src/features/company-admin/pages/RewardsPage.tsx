import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/app/providers/AuthProvider';
import { useOrganization } from '@/app/providers/OrganizationProvider';
import { useRewards } from '@/features/company-admin/queries/rewardQueries';
import { usePointsBalance } from '@/features/employee/queries/pointsQueries';
import { LoadingScreen } from '@/components/feedback/LoadingScreen';
import { formatPoints } from '@/lib/utils';
import type { Reward } from '@/features/company-admin/types/reward.types';

export default function RewardsPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { organizationMember } = useOrganization();
  const organizationId = organizationMember?.organization_id || '';

  const { data: rewards, isLoading } = useRewards(organizationId, { status: 'active' });
  const { data: balance } = usePointsBalance(user?.id || '');

  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const categories = ['all', 'gift_card', 'merchandise', 'experience', 'training', 'pto', 'company_benefit', 'charitable'];

  const categoryLabels: Record<string, string> = {
    all: 'All Rewards',
    gift_card: 'Gift Cards',
    merchandise: 'Merchandise',
    experience: 'Experiences',
    training: 'Training',
    pto: 'PTO',
    company_benefit: 'Company Benefits',
    charitable: 'Charitable',
  };

  const filteredRewards = selectedCategory === 'all' 
    ? rewards 
    : rewards?.filter((r: Reward) => r.category === selectedCategory);

  const handleRedeem = (reward: Reward) => {
    if (!user?.id) return;
    
    // Check if user has enough points
    if (balance && balance < reward.points_required) {
      alert(`You need ${reward.points_required} points to redeem this reward. You have ${balance} points.`);
      return;
    }

    // Navigate to redemption confirmation
    navigate(`/app/rewards/${reward.id}/redeem`);
  };

  if (isLoading) {
    return <LoadingScreen />;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Rewards</h1>
        <p className="text-muted-foreground">
          Redeem your points for rewards
        </p>
      </div>

      {/* Points Balance */}
      <div className="rounded-lg border bg-card p-6 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">Your Points Balance</p>
            <p className="text-3xl font-bold text-primary">{formatPoints(balance || 0)}</p>
          </div>
          <div className="text-sm text-muted-foreground">
            <p>Available to redeem</p>
          </div>
        </div>
      </div>

      {/* Category Filter */}
      <div className="flex flex-wrap gap-2">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
              selectedCategory === cat
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted text-muted-foreground hover:bg-muted/80'
            }`}
          >
            {categoryLabels[cat] || cat}
          </button>
        ))}
      </div>

      {/* Rewards Grid */}
      {filteredRewards?.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          No rewards available at the moment. Check back later!
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredRewards?.map((reward: Reward) => {
            const canAfford = (balance || 0) >= reward.points_required;
            const isOutOfStock = reward.stock === 0;

            return (
              <div
                key={reward.id}
                className={`rounded-lg border bg-card overflow-hidden shadow-sm transition-all hover:shadow-md ${
                  canAfford && !isOutOfStock ? 'hover:-translate-y-1' : 'opacity-75'
                }`}
              >
                {reward.image_url ? (
                  <img
                    src={reward.image_url}
                    alt={reward.title}
                    className="w-full h-48 object-cover"
                  />
                ) : (
                  <div className="w-full h-48 bg-muted flex items-center justify-center text-muted-foreground">
                    No image
                  </div>
                )}
                <div className="p-5 space-y-3">
                  <div className="flex items-start justify-between">
                    <h3 className="font-semibold text-lg">{reward.title}</h3>
                    <span className="text-sm font-medium text-primary">
                      {formatPoints(reward.points_required)} pts
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {reward.description}
                  </p>
                  <div className="flex items-center justify-between pt-2">
                    <span className="text-xs text-muted-foreground">
                      {isOutOfStock ? 'Out of Stock' : 
                       reward.stock !== null ? `${reward.stock} left` : 'Unlimited'}
                    </span>
                    <button
                      onClick={() => handleRedeem(reward)}
                      disabled={!canAfford || isOutOfStock}
                      className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                        canAfford && !isOutOfStock
                          ? 'bg-primary text-primary-foreground hover:bg-primary/90'
                          : 'bg-muted text-muted-foreground cursor-not-allowed'
                      }`}
                    >
                      {isOutOfStock ? 'Out of Stock' : 
                       canAfford ? 'Redeem' : `Need ${formatPoints(reward.points_required - (balance || 0))} more`}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}