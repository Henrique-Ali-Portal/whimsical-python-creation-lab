
import React from 'react';
import { Badge } from "@/components/ui/badge";

interface InteractionItemProps {
  interaction: {
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
  };
}

const InteractionItem: React.FC<InteractionItemProps> = ({ interaction }) => {
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

  return (
    <div className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
      <div className="flex justify-between items-start mb-2">
        <div>
          <h3 className="font-semibold text-lg">{interaction.client_name}</h3>
          <p className="text-gray-600">{interaction.description}</p>
          <div className="flex items-center gap-2 text-sm text-gray-500 mt-1">
            <span>by {interaction.profiles.full_name} ({interaction.profiles.username})</span>
            {interaction.stores && (
              <>
                <span>•</span>
                <span>{interaction.stores.name}</span>
              </>
            )}
          </div>
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
  );
};

export default InteractionItem;
