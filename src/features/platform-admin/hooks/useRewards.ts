// src/features/platform-admin/hooks/useRewards.ts

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import type { Reward, RewardsIntegrationConfig } from '../types/platform.types';

const defaultConfig: RewardsIntegrationConfig = {
  activeProvider: 'Digital Vouchers',
  apiKey: '',
  environment: 'sandbox',
  webhookUrl: '',
  autoFulfillDigitalCards: true,
  prepaidAccountBalance: 0,
  connectedAt: new Date().toISOString(),
};

export function useRewards() {
  const [rewards, setRewards] = useState<Reward[]>([]);
  const [config, setConfig] = useState<RewardsIntegrationConfig>(() => {
    const saved = localStorage.getItem('rewardsConfig');
    return saved ? JSON.parse(saved) : defaultConfig;
  });

  const fetchRewards = async () => {
    try {
      const { data, error } = await supabase
        .from('rewards')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      // Map the data to match the Reward type
      const mappedRewards: Reward[] = (data || []).map((item: any) => ({
        id: item.id,
        title: item.title,
        description: item.description || '',
        pointsCost: item.points_cost,
        category: item.category,
        stock: item.stock,
        icon: item.icon || 'Gift',
        photo: item.photo || '',
        provider: item.provider || 'Digital Voucher',
        deliveryMethod: item.delivery_method || 'instant_digital',
        organization_id: item.organization_id,
        externalProductId: item.external_product_id || undefined,
        createdAt: item.created_at,
        updatedAt: item.updated_at,
      }));
      
      setRewards(mappedRewards);
    } catch (error) {
      console.error('Error fetching rewards:', error);
    }
  };

  useEffect(() => {
    fetchRewards();
  }, []);

  const addReward = (reward: Omit<Reward, 'id'>) => {
    const newReward = { ...reward, id: `rew-${Date.now()}` };
    setRewards((prev) => {
      const updated = [...prev, newReward];
      localStorage.setItem('rewards', JSON.stringify(updated));
      return updated;
    });
  };

  const deleteReward = (id: string) => {
    setRewards((prev) => {
      const updated = prev.filter((r) => r.id !== id);
      localStorage.setItem('rewards', JSON.stringify(updated));
      return updated;
    });
  };

  const replenishStock = (id: string, amount: number = 10) => {
    setRewards((prev) => {
      const updated = prev.map((r) =>
        r.id === id ? { ...r, stock: r.stock + amount } : r
      );
      localStorage.setItem('rewards', JSON.stringify(updated));
      return updated;
    });
  };

  const updateConfig = (newConfig: Partial<RewardsIntegrationConfig>) => {
    setConfig((prev) => {
      const updated = { ...prev, ...newConfig };
      localStorage.setItem('rewardsConfig', JSON.stringify(updated));
      return updated;
    });
  };

  const fundPool = (amount: number) => {
    setConfig((prev) => {
      const updated = { ...prev, prepaidAccountBalance: prev.prepaidAccountBalance + amount };
      localStorage.setItem('rewardsConfig', JSON.stringify(updated));
      return updated;
    });
  };

  return {
    rewards,
    config,
    addReward,
    deleteReward,
    replenishStock,
    updateConfig,
    fundPool,
    refreshRewards: fetchRewards,
  };
}