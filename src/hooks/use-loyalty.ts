import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

export interface LoyaltyReward {
  id: string;
  name: string;
  description: string;
  points_required: number;
  reward_type: 'discount_percentage' | 'discount_fixed' | 'free_item' | 'free_delivery' | 'custom';
  discount_percentage?: number;
  discount_amount?: number;
  free_item_id?: string;
  min_order_amount: number;
  max_uses_per_customer?: number;
  allowed_branches?: string[];
  pickup_only: boolean;
  delivery_only: boolean;
  is_active: boolean;
  valid_from: string;
  valid_until?: string;
}

export interface LoyaltyTransaction {
  id: string;
  customer_id: string;
  transaction_type: 'earned' | 'redeemed' | 'expired' | 'adjusted' | 'bonus';
  points: number;
  balance_after: number;
  order_id?: string;
  reward_id?: string;
  description?: string;
  created_at: string;
}

export function useLoyaltyRewards() {
  return useQuery({
    queryKey: ['loyalty-rewards'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('loyalty_rewards')
        .select('*')
        .eq('is_active', true)
        .or(`valid_until.is.null,valid_until.gte.${new Date().toISOString()}`)
        .order('points_required', { ascending: true });

      if (error) throw error;
      return data as LoyaltyReward[];
    },
  });
}

export function useLoyaltyTransactions(customerId: string) {
  return useQuery({
    queryKey: ['loyalty-transactions', customerId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('loyalty_transactions')
        .select('*')
        .eq('customer_id', customerId)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      return data as LoyaltyTransaction[];
    },
    enabled: !!customerId,
  });
}

export function useRedeemReward() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ customerId, rewardId, currentPoints }: {
      customerId: string;
      rewardId: string;
      currentPoints: number;
    }) => {
      // Get reward details
      const { data: reward, error: rewardError } = await supabase
        .from('loyalty_rewards')
        .select('*')
        .eq('id', rewardId)
        .single();

      if (rewardError) throw rewardError;

      // Check if customer has enough points
      if (currentPoints < reward.points_required) {
        throw new Error('Not enough points');
      }

      // Check usage limits
      if (reward.max_uses_per_customer) {
        const { count } = await supabase
          .from('loyalty_transactions')
          .select('*', { count: 'exact', head: true })
          .eq('customer_id', customerId)
          .eq('reward_id', rewardId)
          .eq('transaction_type', 'redeemed');

        if (count && count >= reward.max_uses_per_customer) {
          throw new Error('Maximum uses reached for this reward');
        }
      }

      // Create redemption transaction
      const { data: transaction, error: transactionError } = await supabase
        .from('loyalty_transactions')
        .insert({
          customer_id: customerId,
          transaction_type: 'redeemed',
          points: -reward.points_required,
          balance_after: currentPoints - reward.points_required,
          reward_id: rewardId,
          description: `Redeemed: ${reward.name}`,
        })
        .select()
        .single();

      if (transactionError) throw transactionError;

      return { transaction, reward };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['loyalty-transactions'] });
      queryClient.invalidateQueries({ queryKey: ['customer'] });
    },
  });
}

export function calculateLoyaltyPoints(orderAmount: number, orderType: 'pickup' | 'delivery' | 'dine_in' = 'delivery'): number {
  // Default: 1 point per euro
  const basePoints = Math.floor(orderAmount);

  // Apply multipliers based on order type (these could come from loyalty_rules table)
  const multipliers = {
    pickup: 1.5,  // 50% bonus for pickup
    delivery: 1.0,
    dine_in: 1.2,  // 20% bonus for dine-in
  };

  return Math.floor(basePoints * multipliers[orderType]);
}
