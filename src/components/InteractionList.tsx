
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Interaction } from '@/pages/Dashboard';

interface InteractionListProps {
  interactions: Interaction[];
}

const InteractionList: React.FC<InteractionListProps> = ({ interactions }) => {
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

  const sortedInteractions = [...interactions].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

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
          {sortedInteractions.length === 0 ? (
            <p className="text-gray-500 text-center py-8">
              No interactions logged yet. Start by adding your first client interaction!
            </p>
          ) : (
            sortedInteractions.map((interaction) => (
              <div
                key={interaction.id}
                className="border rounded-lg p-4 hover:bg-gray-50 transition-colors"
              >
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h3 className="font-semibold text-lg">{interaction.clientName}</h3>
                    <p className="text-gray-600">{interaction.description}</p>
                  </div>
                  <Badge className={getStatusColor(interaction.status)}>
                    {interaction.status}
                  </Badge>
                </div>
                
                <div className="flex justify-between items-center text-sm text-gray-500">
                  <div className="flex items-center space-x-4">
                    {interaction.status === 'Lost' && interaction.reason && (
                      <span className="bg-gray-100 px-2 py-1 rounded">
                        Reason: {interaction.reason}
                      </span>
                    )}
                    {interaction.monetaryValue && (
                      <span className="bg-green-100 text-green-800 px-2 py-1 rounded font-medium">
                        {formatCurrency(interaction.monetaryValue)}
                      </span>
                    )}
                  </div>
                  <span>{formatDate(interaction.createdAt)}</span>
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default InteractionList;
