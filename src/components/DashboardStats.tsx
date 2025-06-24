
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Interaction } from '@/pages/Dashboard';

interface DashboardStatsProps {
  interactions: Interaction[];
}

const DashboardStats: React.FC<DashboardStatsProps> = ({ interactions }) => {
  const totalInteractions = interactions.length;
  const closedCount = interactions.filter(i => i.status === 'Closed').length;
  const quotedCount = interactions.filter(i => i.status === 'Quoted').length;
  const lostCount = interactions.filter(i => i.status === 'Lost').length;

  const totalRevenue = interactions
    .filter(i => i.status === 'Closed' && i.monetaryValue)
    .reduce((sum, i) => sum + (i.monetaryValue || 0), 0);

  const quotedRevenue = interactions
    .filter(i => i.status === 'Quoted' && i.monetaryValue)
    .reduce((sum, i) => sum + (i.monetaryValue || 0), 0);

  const closingRate = totalInteractions > 0 ? ((closedCount / totalInteractions) * 100).toFixed(1) : '0';

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Interactions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{totalInteractions}</div>
          <p className="text-xs text-muted-foreground">
            All client interactions
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Closed Sales</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-green-600">{closedCount}</div>
          <p className="text-xs text-muted-foreground">
            {closingRate}% closing rate
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Revenue Generated</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-green-600">
            {formatCurrency(totalRevenue)}
          </div>
          <p className="text-xs text-muted-foreground">
            From closed sales
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Pipeline Value</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-blue-600">
            {formatCurrency(quotedRevenue)}
          </div>
          <p className="text-xs text-muted-foreground">
            {quotedCount} quoted opportunities
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default DashboardStats;
