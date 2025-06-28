
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface Interaction {
  id: string;
  client_name: string;
  description: string;
  status: 'Closed' | 'Quoted' | 'Lost';
  reason?: string;
  monetary_value?: number;
  created_at: string;
  user_id: string;
  store_id?: string;
  profiles: {
    full_name: string;
    username: string;
  };
  stores?: {
    name: string;
  };
  interaction_products: {
    products: {
      description: string;
    } | null;
    is_custom: boolean;
    custom_description?: string;
  }[];
}

interface FilterOptions {
  status?: string;
  startDate?: string;
  endDate?: string;
  storeId?: string;
  userId?: string;
  reason?: string;
}

export const useInteractionsList = () => {
  const [interactions, setInteractions] = useState<Interaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentFilters, setCurrentFilters] = useState<FilterOptions>({});
  const { profile } = useAuth();

  useEffect(() => {
    loadInteractions();
  }, [profile, currentFilters]);

  // Set up real-time subscription for interactions
  useEffect(() => {
    if (!profile) return;

    console.log('Setting up real-time subscription for interactions');
    
    const channel = supabase
      .channel('interactions-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'interactions'
        },
        (payload) => {
          console.log('Real-time interaction change:', payload);
          loadInteractions();
        }
      )
      .subscribe();

    return () => {
      console.log('Cleaning up real-time subscription');
      supabase.removeChannel(channel);
    };
  }, [profile]);

  const loadInteractions = async () => {
    if (!profile) return;

    try {
      setLoading(true);
      console.log('Loading interactions with filters:', currentFilters);

      let query = supabase
        .from('interactions')
        .select(`
          *,
          profiles!interactions_user_id_fkey(full_name, username),
          stores(name),
          interaction_products(
            products(description),
            is_custom,
            custom_description
          )
        `)
        .order('created_at', { ascending: false });

      // Apply filters
      if (currentFilters.status) {
        query = query.eq('status', currentFilters.status);
      }

      if (currentFilters.startDate) {
        query = query.gte('created_at', `${currentFilters.startDate}T00:00:00.000Z`);
      }

      if (currentFilters.endDate) {
        query = query.lte('created_at', `${currentFilters.endDate}T23:59:59.999Z`);
      }

      if (currentFilters.storeId) {
        query = query.eq('store_id', currentFilters.storeId);
      }

      if (currentFilters.userId) {
        query = query.eq('user_id', currentFilters.userId);
      }

      if (currentFilters.reason) {
        query = query.eq('reason', currentFilters.reason);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error loading interactions:', error);
        throw error;
      }
      
      console.log('Loaded interactions:', data?.length || 0);
      
      const typedInteractions: Interaction[] = (data || []).map(item => ({
        ...item,
        status: item.status as 'Closed' | 'Quoted' | 'Lost'
      }));
      
      setInteractions(typedInteractions);
    } catch (error) {
      console.error('Error loading interactions:', error);
      setInteractions([]);
    } finally {
      setLoading(false);
    }
  };

  const handleFiltersChange = (filters: FilterOptions) => {
    console.log('Filters changed:', filters);
    setCurrentFilters(filters);
  };

  const handleClearFilters = () => {
    console.log('Clearing filters');
    setCurrentFilters({});
  };

  return {
    interactions,
    loading,
    currentFilters,
    handleFiltersChange,
    handleClearFilters,
  };
};
