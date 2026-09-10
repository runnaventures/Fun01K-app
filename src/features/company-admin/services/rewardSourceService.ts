import type { ExternalReward, TremendousReward, TangoCardReward } from '../types/reward.types';

// Tremendous API Service
export const tremendousService = {
  async searchRewards(query?: string): Promise<ExternalReward[]> {
    try {
      const apiKey = import.meta.env.VITE_TREMENDOUS_API_KEY;
      
      if (!apiKey) {
        console.warn('Tremendous API key not configured');
        return this.getMockRewards();
      }

      const response = await fetch('https://api.tremendous.com/api/v1/catalogs', {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Tremendous API error: ${response.status}`);
      }

      const data = await response.json();
      
      let rewards = data.catalogs?.map((item: any) => ({
        id: `tremendous-${item.id}`,
        title: item.name,
        description: item.description || `Gift card from ${item.brand}`,
        source: 'tremendous' as const,
        sourceId: item.id,
        category: 'gift_card' as const,
        image_url: item.image_url || item.logo_url,
        retail_price: item.price,
        currency: item.currency,
        metadata: {
          brand: item.brand,
          denominations: item.denominations,
          country: item.country,
        },
      })) || [];

      if (query) {
        const q = query.toLowerCase();
        rewards = rewards.filter(
          (r: any) => r.title.toLowerCase().includes(q) || 
                     r.metadata?.brand?.toLowerCase().includes(q)
        );
      }

      return rewards;
    } catch (error) {
      console.error('Tremendous search error:', error);
      return this.getMockRewards();
    }
  },

  getMockRewards(): ExternalReward[] {
    return [
      {
        id: 'mock-trem-1',
        title: 'Amazon Gift Card',
        description: 'eGift card for Amazon',
        source: 'tremendous' as const,
        sourceId: 'mock-1',
        category: 'gift_card' as const,
        image_url: 'https://images.unsplash.com/photo-1523474253046-8cd2748b5fd2?w=400',
        retail_price: 25,
        currency: 'USD',
        metadata: { brand: 'Amazon' },
      },
      {
        id: 'mock-trem-2',
        title: 'Starbucks Gift Card',
        description: 'eGift card for Starbucks',
        source: 'tremendous' as const,
        sourceId: 'mock-2',
        category: 'gift_card' as const,
        image_url: 'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=400',
        retail_price: 20,
        currency: 'USD',
        metadata: { brand: 'Starbucks' },
      },
      {
        id: 'mock-trem-3',
        title: 'Uber Gift Card',
        description: 'eGift card for Uber rides',
        source: 'tremendous' as const,
        sourceId: 'mock-3',
        category: 'gift_card' as const,
        image_url: 'https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?w=400',
        retail_price: 30,
        currency: 'USD',
        metadata: { brand: 'Uber' },
      },
    ];
  },

  async createOrder(rewardId: string, recipientEmail: string, amount: number): Promise<any> {
    try {
      const apiKey = import.meta.env.VITE_TREMENDOUS_API_KEY;
      
      const response = await fetch('https://api.tremendous.com/api/v1/orders', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          order: {
            reward: rewardId,
            amount: amount,
            currency: 'USD',
            recipient: {
              email: recipientEmail,
            },
          },
        }),
      });

      if (!response.ok) {
        throw new Error(`Tremendous order error: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Tremendous order error:', error);
      throw error;
    }
  },
};

// Tango Card API Service
export const tangoCardService = {
  async searchRewards(query?: string): Promise<ExternalReward[]> {
    try {
      const apiKey = import.meta.env.VITE_TANGOCARD_API_KEY;
      
      if (!apiKey) {
        console.warn('Tango Card API key not configured');
        return this.getMockRewards();
      }

      const response = await fetch('https://api.tangocard.com/v1/catalogs', {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Tango Card API error: ${response.status}`);
      }

      const data = await response.json();
      
      let rewards = data.items?.map((item: any) => ({
        id: `tangocard-${item.id}`,
        title: item.name,
        description: item.description || `Gift card from ${item.brand}`,
        source: 'tangocard' as const,
        sourceId: item.id,
        category: 'gift_card' as const,
        image_url: item.image_url,
        retail_price: item.price,
        currency: item.currency,
        metadata: { brand: item.brand },
      })) || [];

      if (query) {
        const q = query.toLowerCase();
        rewards = rewards.filter(
          (r: any) => r.title.toLowerCase().includes(q) || 
                     r.metadata?.brand?.toLowerCase().includes(q)
        );
      }

      return rewards;
    } catch (error) {
      console.error('Tango Card search error:', error);
      return this.getMockRewards();
    }
  },

  getMockRewards(): ExternalReward[] {
    return [
      {
        id: 'mock-tango-1',
        title: 'Target Gift Card',
        description: 'eGift card for Target',
        source: 'tangocard' as const,
        sourceId: 'mock-1',
        category: 'gift_card' as const,
        image_url: 'https://images.unsplash.com/photo-1534452203293-494d7ddbf7e0?w=400',
        retail_price: 25,
        currency: 'USD',
        metadata: { brand: 'Target' },
      },
      {
        id: 'mock-tango-2',
        title: 'Netflix Gift Card',
        description: 'eGift card for Netflix',
        source: 'tangocard' as const,
        sourceId: 'mock-2',
        category: 'gift_card' as const,
        image_url: 'https://images.unsplash.com/photo-1574375927938-d5a98e8ffe85?w=400',
        retail_price: 15,
        currency: 'USD',
        metadata: { brand: 'Netflix' },
      },
    ];
  },
};

// Giftbit API Service
export const giftbitService = {
  async searchRewards(query?: string): Promise<ExternalReward[]> {
    // Similar implementation for Giftbit
    return [];
  },
};

// BlackHawk API Service
export const blackhawkService = {
  async searchRewards(query?: string): Promise<ExternalReward[]> {
    // Similar implementation for BlackHawk
    return [];
  },
};

// Main Reward Source Service
export const rewardSourceService = {
  async searchAllSources(
    query: string, 
    source: 'tremendous' | 'tangocard' | 'giftbit' | 'blackhawk'
  ): Promise<ExternalReward[]> {
    switch (source) {
      case 'tremendous':
        return tremendousService.searchRewards(query);
      case 'tangocard':
        return tangoCardService.searchRewards(query);
      case 'giftbit':
        return giftbitService.searchRewards(query);
      case 'blackhawk':
        return blackhawkService.searchRewards(query);
      default:
        return [];
    }
  },

  async createOrder(
    source: 'tremendous' | 'tangocard' | 'giftbit' | 'blackhawk',
    rewardId: string,
    recipientEmail: string,
    amount: number
  ): Promise<any> {
    switch (source) {
      case 'tremendous':
        return tremendousService.createOrder(rewardId, recipientEmail, amount);
      default:
        throw new Error(`Source ${source} not supported yet`);
    }
  },
};