
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
  profiles: {
    full_name: string;
  };
  interaction_products: {
    products: {
      description: string;
    } | null;
    is_custom: boolean;
    custom_description?: string;
  }[];
}

const SupabaseInteractionList: React.FC = () => {
  const [interactions, setInteractions] = useState<Interaction[]>([]);
  const [loading, setLoading] = useState(true);
  const { profile } = useAuth();

  useEffect(() => {
    loadInteractions();
  }, [profile]);

  const loadInteractions = async () => {
    if (!profile) return;

    try {
      const { data, error } = await supabase
        .from('interactions')
        .select(`
          *,
          profiles!interactions_user_id_fkey(full_name),
          interaction_products(
            products(description),
            is_custom,
            custom_description
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      // Type cast the data to ensure status matches our interface
      const typedInteractions: Interaction[] = (data || []).map(item => ({
        ...item,
        status: item.status as 'Closed' | 'Quoted' | 'Lost'
      }));
      
      setInteractions(typedInteractions);
    } catch (error) {
      console.error('Error loading interactions:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Closed':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'Quoted':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'Lost':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Recent Interactions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">Loading interactions...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Interactions</CardTitle>
        <CardDescription>
          Your latest client interactions and their status
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {interactions.length === 0 ? (
            <p className="text-gray-500 text-center py-8">
              No interactions logged yet. Start by adding your first client interaction!
            </p>
          ) : (
            interactions.map((interaction) => (
              <div
                key={interaction.id}
                className="border rounded-lg p-4 hover:bg-gray-50 transition-colors"
              >
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h3 className="font-semibold text-lg">{interaction.client_name}</h3>
                    <p className="text-gray-600">{interaction.description}</p>
                    <p className="text-sm text-gray-500">by {interaction.profiles.full_name}</p>
                  </div>
                  <Badge className={getStatusColor(interaction.status)}>
                    {interaction.status}
                  </Badge>
                </div>
                
                <div className="space-y-2">
                  <div className="flex justify-between items-center text-sm text-gray-500">
                    <div className="flex items-center space-x-4">
                      {interaction.status === 'Lost' && interaction.reason && (
                        <span className="bg-gray-100 px-2 py-1 rounded">
                          Reason: {interaction.reason}
                        </span>
                      )}
                      {interaction.monetary_value && (
                        <span className="bg-green-100 text-green-800 px-2 py-1 rounded font-medium">
                          {formatCurrency(interaction.monetary_value)}
                        </span>
                      )}
                    </div>
                    <span>{formatDate(interaction.created_at)}</span>
                  </div>
                  
                  {interaction.interaction_products && interaction.interaction_products.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      <span className="text-xs text-gray-500 mr-2">Products:</span>
                      {interaction.interaction_products.map((ip, index) => (
                        <Badge key={index} variant="outline" className="text-xs">
                          {ip.is_custom ? ip.custom_description : ip.products?.description}
                          {ip.is_custom && ' (Custom)'}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default SupabaseInteractionList;
