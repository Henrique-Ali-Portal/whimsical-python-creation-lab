
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface Stats {
  totalInteractions: number;
  closedDeals: number;
  totalRevenue: number;
  averageDealValue: number;
  closingRate: number;
}

const SupabaseDashboardStats: React.FC = () => {
  const [stats, setStats] = useState<Stats>({
    totalInteractions: 0,
    closedDeals: 0,
    totalRevenue: 0,
    averageDealValue: 0,
    closingRate: 0,
  });
  const [loading, setLoading] = useState(true);
  const { profile } = useAuth();

  useEffect(() => {
    loadStats();
  }, [profile]);

  const loadStats = async () => {
    if (!profile) return;

    try {
      // Get all interactions for the current user (or all if admin/board)
      let query = supabase.from('interactions').select('*');
      
      if (profile.role !== 'ADMIN' && profile.role !== 'BOARD') {
        query = query.eq('user_id', profile.id);
      }

      const { data: interactions, error } = await query;

      if (error) throw error;

      const totalInteractions = interactions?.length || 0;
      const closedDeals = interactions?.filter(i => i.status === 'Closed').length || 0;
      const totalRevenue = interactions
        ?.filter(i => i.status === 'Closed' && i.monetary_value)
        .reduce((sum, i) => sum + (i.monetary_value || 0), 0) || 0;
      
      const averageDealValue = closedDeals > 0 ? totalRevenue / closedDeals : 0;
      const closingRate = totalInteractions > 0 ? (closedDeals / totalInteractions) * 100 : 0;

      setStats({
        totalInteractions,
        closedDeals,
        totalRevenue,
        averageDealValue,
        closingRate,
      });
    } catch (error) {
      console.error('Error loading stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
        {[...Array(5)].map((_, i) => (
          <Card key={i}>
            <CardContent className="p-6">
              <div className="animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-8 bg-gray-200 rounded w-1/2"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Interactions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.totalInteractions}</div>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Closed Deals</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.closedDeals}</div>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{formatCurrency(stats.totalRevenue)}</div>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Avg Deal Value</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{formatCurrency(stats.averageDealValue)}</div>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Closing Rate</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.closingRate.toFixed(1)}%</div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SupabaseDashboardStats;
