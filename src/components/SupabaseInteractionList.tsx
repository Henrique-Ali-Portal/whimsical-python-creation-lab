
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from '@/hooks/useAuth';
import { useInteractionsList } from '@/hooks/useInteractionsList';
import InteractionFilters from './InteractionFilters';
import InteractionItem from './InteractionItem';

const SupabaseInteractionList: React.FC = () => {
  const { profile } = useAuth();
  const {
    interactions,
    loading,
    currentFilters,
    handleFiltersChange,
    handleClearFilters,
  } = useInteractionsList();

  if (loading) {
    return (
      <>
        <InteractionFilters 
          onFiltersChange={handleFiltersChange}
          onClearFilters={handleClearFilters}
        />
        <Card>
          <CardHeader>
            <CardTitle>Interactions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8">Loading interactions...</div>
          </CardContent>
        </Card>
      </>
    );
  }

  return (
    <>
      <InteractionFilters 
        onFiltersChange={handleFiltersChange}
        onClearFilters={handleClearFilters}
      />
      
      <Card>
        <CardHeader>
          <CardTitle>Interactions</CardTitle>
          <CardDescription>
            {profile?.role === 'SALESPERSON' 
              ? 'Your client interactions' 
              : profile?.role === 'MANAGER'
              ? `Store interactions (${interactions.length} total)`
              : `All accessible interactions (${interactions.length} total)`
            }
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {interactions.length === 0 ? (
              <p className="text-gray-500 text-center py-8">
                {Object.keys(currentFilters).length > 0 
                  ? 'No interactions match the current filters.'
                  : profile?.role === 'SALESPERSON' 
                    ? 'No interactions logged yet. Start by adding your first client interaction!'
                    : 'No interactions found.'
                }
              </p>
            ) : (
              interactions.map((interaction) => (
                <InteractionItem key={interaction.id} interaction={interaction} />
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </>
  );
};

export default SupabaseInteractionList;
