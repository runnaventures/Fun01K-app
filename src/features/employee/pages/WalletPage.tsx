import { useState } from 'react';
import { useAuth } from '@/app/providers/AuthProvider';
import { usePointsAccount, usePointsTransactions, usePointsBalance } from '../queries/pointsQueries';
import { LoadingScreen } from '@/components/feedback/LoadingScreen';
import { formatPoints } from '@/lib/utils';
import type { PointsTransaction } from '../types/points.types';

type TransactionFilter = 'all' | 'earned' | 'redeemed' | 'adjusted' | 'reversed';

export default function WalletPage() {
  const { user } = useAuth();
  const [filter, setFilter] = useState<TransactionFilter>('all');
  const [limit, setLimit] = useState(20);

  const { data: account, isLoading: accountLoading } = usePointsAccount(user?.id || '');
  const { data: transactions, isLoading: transactionsLoading } = usePointsTransactions(user?.id || '', limit);
  const { data: balance, isLoading: balanceLoading } = usePointsBalance(user?.id || '');

  const isLoading = accountLoading || transactionsLoading || balanceLoading;

  // Filter transactions - fixed the type here
  const filteredTransactions = transactions?.filter((t: PointsTransaction) => {
    if (filter === 'all') return true;
    return t.type === filter;
  });

  // Summary stats
  const summary = {
    balance: account?.balance || 0,
    lifetimeEarned: account?.lifetime_earned || 0,
    lifetimeRedeemed: account?.lifetime_redeemed || 0,
    pending: account?.pending || 0,
  };

  if (isLoading) {
    return <LoadingScreen />;
  }

  const getTransactionIcon = (type: string): string => {
    switch (type) {
      case 'earned': return '⬆️';
      case 'redeemed': return '⬇️';
      case 'adjusted': return '📝';
      case 'reversed': return '↩️';
      default: return '💳';
    }
  };

  const getTransactionColor = (type: string): string => {
    switch (type) {
      case 'earned': return 'text-green-600';
      case 'redeemed': return 'text-red-600';
      case 'adjusted': return 'text-blue-600';
      case 'reversed': return 'text-yellow-600';
      default: return 'text-gray-600';
    }
  };

  const getTransactionLabel = (type: string): string => {
    switch (type) {
      case 'earned': return 'Earned';
      case 'redeemed': return 'Redeemed';
      case 'adjusted': return 'Adjusted';
      case 'reversed': return 'Reversed';
      default: return type;
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Points Wallet</h1>
        <p className="text-muted-foreground">
          View your points balance and transaction history
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <div className="rounded-lg border bg-card p-6 shadow-sm">
          <div className="flex flex-row items-center justify-between space-y-0 pb-2">
            <p className="text-sm font-medium text-muted-foreground">Available Balance</p>
            <span className="text-2xl">💰</span>
          </div>
          <div className="text-3xl font-bold text-primary">
            {formatPoints(summary.balance)}
          </div>
        </div>
        <div className="rounded-lg border bg-card p-6 shadow-sm">
          <div className="flex flex-row items-center justify-between space-y-0 pb-2">
            <p className="text-sm font-medium text-muted-foreground">Pending</p>
            <span className="text-2xl">⏳</span>
          </div>
          <div className="text-2xl font-bold text-yellow-600">
            {formatPoints(summary.pending)}
          </div>
        </div>
        <div className="rounded-lg border bg-card p-6 shadow-sm">
          <div className="flex flex-row items-center justify-between space-y-0 pb-2">
            <p className="text-sm font-medium text-muted-foreground">Lifetime Earned</p>
            <span className="text-2xl">⭐</span>
          </div>
          <div className="text-2xl font-bold text-green-600">
            {formatPoints(summary.lifetimeEarned)}
          </div>
        </div>
        <div className="rounded-lg border bg-card p-6 shadow-sm">
          <div className="flex flex-row items-center justify-between space-y-0 pb-2">
            <p className="text-sm font-medium text-muted-foreground">Lifetime Redeemed</p>
            <span className="text-2xl">🎁</span>
          </div>
          <div className="text-2xl font-bold text-purple-600">
            {formatPoints(summary.lifetimeRedeemed)}
          </div>
        </div>
      </div>

      {/* Transactions Section */}
      <div className="rounded-lg border bg-card shadow-sm">
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="font-semibold text-foreground">Transaction History</h3>
          <div className="flex items-center gap-2">
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value as TransactionFilter)}
              className="px-3 py-1.5 text-sm border border-input rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-ring"
            >
              <option value="all">All</option>
              <option value="earned">Earned</option>
              <option value="redeemed">Redeemed</option>
              <option value="adjusted">Adjusted</option>
              <option value="reversed">Reversed</option>
            </select>
          </div>
        </div>

        {filteredTransactions && filteredTransactions.length > 0 ? (
          <div className="divide-y">
            {filteredTransactions.map((transaction: PointsTransaction) => (
              <div key={transaction.id} className="flex items-center justify-between p-4 hover:bg-muted/50 transition-colors">
                <div className="flex items-center gap-4">
                  <div className="text-2xl">
                    {getTransactionIcon(transaction.type)}
                  </div>
                  <div>
                    <p className="font-medium text-foreground">
                      {transaction.description}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {getTransactionLabel(transaction.type)}
                      {transaction.source && ` • ${transaction.source}`}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className={`font-semibold ${getTransactionColor(transaction.type)}`}>
                    {transaction.amount > 0 ? '+' : ''}{formatPoints(transaction.amount)}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(transaction.created_at).toLocaleDateString()}
                  </p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="py-8 text-center text-muted-foreground">
            No transactions found
          </div>
        )}

        {filteredTransactions && filteredTransactions.length >= limit && (
          <div className="p-4 border-t">
            <button
              onClick={() => setLimit(limit + 20)}
              className="w-full text-sm text-primary hover:underline"
            >
              Load More
            </button>
          </div>
        )}
      </div>
    </div>
  );
}