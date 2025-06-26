
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Filter, X } from 'lucide-react';

interface FilterOptions {
  status?: string;
  startDate?: string;
  endDate?: string;
  storeId?: string;
  userId?: string;
  reason?: string;
}

interface Store {
  id: string;
  name: string;
}

interface User {
  id: string;
  full_name: string;
  username: string;
}

interface InteractionFiltersProps {
  onFiltersChange: (filters: FilterOptions) => void;
  onClearFilters: () => void;
}

const InteractionFilters: React.FC<InteractionFiltersProps> = ({ onFiltersChange, onClearFilters }) => {
  const [filters, setFilters] = useState<FilterOptions>({});
  const [stores, setStores] = useState<Store[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [showFilters, setShowFilters] = useState(false);
  const { profile } = useAuth();

  useEffect(() => {
    if (profile && (profile.role === 'ADMIN' || profile.role === 'BOARD' || profile.role === 'MANAGER')) {
      loadStores();
      loadUsers();
    }
  }, [profile]);

  const loadStores = async () => {
    if (!profile) return;

    try {
      const { data, error } = await supabase
        .from('stores')
        .select('id, name');

      if (error) throw error;
      
      setStores(data || []);
    } catch (error) {
      console.error('Error loading stores:', error);
    }
  };

  const loadUsers = async () => {
    if (!profile) return;

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name, username')
        .eq('role', 'SALESPERSON');

      if (error) throw error;
      
      setUsers(data || []);
    } catch (error) {
      console.error('Error loading users:', error);
    }
  };

  const handleFilterChange = (key: keyof FilterOptions, value: string) => {
    const newFilters = { ...filters, [key]: value || undefined };
    setFilters(newFilters);
    onFiltersChange(newFilters);
  };

  const handleClearFilters = () => {
    setFilters({});
    onClearFilters();
  };

  const canViewStoreFilter = profile?.role === 'ADMIN' || profile?.role === 'BOARD' || profile?.role === 'MANAGER';
  const canViewUserFilter = profile?.role === 'ADMIN' || profile?.role === 'BOARD' || profile?.role === 'MANAGER';

  return (
    <Card className="mb-6">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filters
          </CardTitle>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowFilters(!showFilters)}
            >
              {showFilters ? 'Hide' : 'Show'} Filters
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleClearFilters}
            >
              <X className="h-4 w-4 mr-1" />
              Clear All
            </Button>
          </div>
        </div>
      </CardHeader>
      
      {showFilters && (
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Status Filter */}
            <div className="space-y-2">
              <Label htmlFor="status-filter">Status</Label>
              <Select
                value={filters.status || ""}
                onValueChange={(value) => handleFilterChange('status', value)}
              >
                <SelectTrigger id="status-filter">
                  <SelectValue placeholder="All statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All statuses</SelectItem>
                  <SelectItem value="Closed">Closed</SelectItem>
                  <SelectItem value="Quoted">Quoted</SelectItem>
                  <SelectItem value="Lost">Lost</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Date Range Filters */}
            <div className="space-y-2">
              <Label htmlFor="start-date">Start Date</Label>
              <Input
                id="start-date"
                type="date"
                value={filters.startDate || ''}
                onChange={(e) => handleFilterChange('startDate', e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="end-date">End Date</Label>
              <Input
                id="end-date"
                type="date"
                value={filters.endDate || ''}
                onChange={(e) => handleFilterChange('endDate', e.target.value)}
              />
            </div>

            {/* Store Filter - Only for ADMIN, BOARD, MANAGER */}
            {canViewStoreFilter && (
              <div className="space-y-2">
                <Label htmlFor="store-filter">Store</Label>
                <Select
                  value={filters.storeId || ""}
                  onValueChange={(value) => handleFilterChange('storeId', value)}
                >
                  <SelectTrigger id="store-filter">
                    <SelectValue placeholder="All stores" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All stores</SelectItem>
                    {stores.map((store) => (
                      <SelectItem key={store.id} value={store.id}>
                        {store.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* User Filter - Only for ADMIN, BOARD, MANAGER */}
            {canViewUserFilter && (
              <div className="space-y-2">
                <Label htmlFor="user-filter">Salesperson</Label>
                <Select
                  value={filters.userId || ""}
                  onValueChange={(value) => handleFilterChange('userId', value)}
                >
                  <SelectTrigger id="user-filter">
                    <SelectValue placeholder="All salespeople" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All salespeople</SelectItem>
                    {users.map((user) => (
                      <SelectItem key={user.id} value={user.id}>
                        {user.full_name} ({user.username})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Reason Filter */}
            <div className="space-y-2">
              <Label htmlFor="reason-filter">Loss Reason</Label>
              <Select
                value={filters.reason || ""}
                onValueChange={(value) => handleFilterChange('reason', value)}
              >
                <SelectTrigger id="reason-filter">
                  <SelectValue placeholder="All reasons" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All reasons</SelectItem>
                  <SelectItem value="Lack of product">Lack of product</SelectItem>
                  <SelectItem value="Stock Error">Stock Error</SelectItem>
                  <SelectItem value="Delay">Delay</SelectItem>
                  <SelectItem value="Price">Price</SelectItem>
                  <SelectItem value="Other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      )}
    </Card>
  );
};

export default InteractionFilters;
