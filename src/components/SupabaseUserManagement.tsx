
import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { User, Settings, Key } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { canManageUsers, canChangePassword, UserRole } from '@/utils/supabase-security';

interface Store {
  id: string;
  name: string;
  address: string;
}

interface UserProfile {
  id: string;
  username: string;
  full_name: string;
  email: string;
  role: UserRole;
  created_at: string;
  user_stores: {
    stores: Store;
  }[];
}

const SupabaseUserManagement: React.FC = () => {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [stores, setStores] = useState<Store[]>([]);
  const [newStore, setNewStore] = useState({ name: '', address: '' });
  const [newUser, setNewUser] = useState({
    username: '',
    full_name: '',
    email: '',
    password: '',
    role: 'SALESPERSON' as UserRole,
    store_id: ''
  });
  const [passwordChange, setPasswordChange] = useState({
    userId: '',
    newPassword: '',
    showDialog: false
  });
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const { profile } = useAuth();

  const canManage = profile ? canManageUsers(profile.role) : false;

  useEffect(() => {
    if (canManage) {
      loadUsers();
      loadStores();
    }
  }, [canManage]);

  const loadUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select(`
          *,
          user_stores(
            stores(id, name, address)
          )
        `)
        .order('created_at');

      if (error) throw error;
      setUsers(data || []);
    } catch (error) {
      console.error('Error loading users:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadStores = async () => {
    try {
      const { data, error } = await supabase
        .from('stores')
        .select('*')
        .order('name');

      if (error) throw error;
      setStores(data || []);
    } catch (error) {
      console.error('Error loading stores:', error);
    }
  };

  const addStore = async () => {
    if (!newStore.name || !canManage) return;

    try {
      const { error } = await supabase
        .from('stores')
        .insert({
          name: newStore.name,
          address: newStore.address
        });

      if (error) throw error;

      setNewStore({ name: '', address: '' });
      loadStores();

      toast({
        title: "Store Added",
        description: `Store "${newStore.name}" has been created.`,
      });
    } catch (error) {
      console.error('Error adding store:', error);
      toast({
        title: "Error",
        description: "Failed to add store.",
        variant: "destructive",
      });
    }
  };

  const addUser = async () => {
    if (!newUser.username || !newUser.full_name || !newUser.password || !canManage) return;

    try {
      const { data, error } = await supabase.auth.signUp({
        email: newUser.email,
        password: newUser.password,
        options: {
          data: {
            username: newUser.username,
            full_name: newUser.full_name,
            role: newUser.role,
          },
        },
      });

      if (error) throw error;

      // Assign to store if selected
      if (newUser.store_id && data.user) {
        const { error: storeError } = await supabase
          .from('user_stores')
          .insert({
            user_id: data.user.id,
            store_id: newUser.store_id
          });

        if (storeError) console.error('Error assigning store:', storeError);
      }

      setNewUser({
        username: '',
        full_name: '',
        email: '',
        password: '',
        role: 'SALESPERSON',
        store_id: ''
      });

      loadUsers();

      toast({
        title: "User Added",
        description: `User "${newUser.full_name}" has been registered.`,
      });
    } catch (error: any) {
      console.error('Error adding user:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to add user.",
        variant: "destructive",
      });
    }
  };

  const updateUserStore = async (userId: string, storeId: string) => {
    if (!canManage) return;

    try {
      // Remove existing store assignments
      await supabase
        .from('user_stores')
        .delete()
        .eq('user_id', userId);

      // Add new store assignment if storeId is provided
      if (storeId) {
        const { error } = await supabase
          .from('user_stores')
          .insert({
            user_id: userId,
            store_id: storeId
          });

        if (error) throw error;
      }

      loadUsers();

      toast({
        title: "User Updated",
        description: "User store assignment has been updated.",
      });
    } catch (error) {
      console.error('Error updating user store:', error);
      toast({
        title: "Error",
        description: "Failed to update user store assignment.",
        variant: "destructive",
      });
    }
  };

  if (!canManage) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Access Restricted
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-600">You don't have permission to manage users and stores.</p>
        </CardContent>
      </Card>
    );
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Loading...</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Store Management
          </CardTitle>
          <CardDescription>Create and manage store locations</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="storeName">Store Name</Label>
              <Input
                id="storeName"
                value={newStore.name}
                onChange={(e) => setNewStore({ ...newStore, name: e.target.value })}
                placeholder="Enter store name"
              />
            </div>
            <div>
              <Label htmlFor="storeAddress">Address</Label>
              <Input
                id="storeAddress"
                value={newStore.address}
                onChange={(e) => setNewStore({ ...newStore, address: e.target.value })}
                placeholder="Enter store address"
              />
            </div>
          </div>
          <Button onClick={addStore}>Add Store</Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            User Management
          </CardTitle>
          <CardDescription>Register new users and manage store assignments</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                value={newUser.username}
                onChange={(e) => setNewUser({ ...newUser, username: e.target.value })}
                placeholder="Enter username"
              />
            </div>
            <div>
              <Label htmlFor="fullName">Full Name</Label>
              <Input
                id="fullName"
                value={newUser.full_name}
                onChange={(e) => setNewUser({ ...newUser, full_name: e.target.value })}
                placeholder="Enter full name"
              />
            </div>
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={newUser.email}
                onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                placeholder="Enter email"
              />
            </div>
            <div>
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={newUser.password}
                onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                placeholder="Set password"
              />
            </div>
            <div>
              <Label>Role</Label>
              <Select value={newUser.role} onValueChange={(role) => setNewUser({ ...newUser, role: role as UserRole })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="SALESPERSON">Salesperson</SelectItem>
                  <SelectItem value="MANAGER">Manager</SelectItem>
                  <SelectItem value="BOARD">Board</SelectItem>
                  <SelectItem value="ADMIN">Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Assign to Store</Label>
              <Select value={newUser.store_id} onValueChange={(storeId) => setNewUser({ ...newUser, store_id: storeId })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select store (optional)" />
                </SelectTrigger>
                <SelectContent>
                  {stores.map((store) => (
                    <SelectItem key={store.id} value={store.id}>
                      {store.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <Button onClick={addUser}>Add User</Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Current Users</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {users.map((user) => (
              <div key={user.id} className="flex items-center justify-between p-3 border rounded-lg">
                <div>
                  <div className="font-medium">{user.full_name}</div>
                  <div className="text-sm text-gray-500">
                    {user.username} • {user.role} • {user.user_stores?.[0]?.stores?.name || 'No store assigned'}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Select
                    value={user.user_stores?.[0]?.stores?.id || ''}
                    onValueChange={(storeId) => updateUserStore(user.id, storeId)}
                  >
                    <SelectTrigger className="w-48">
                      <SelectValue placeholder="Assign store" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">No store</SelectItem>
                      {stores.map((store) => (
                        <SelectItem key={store.id} value={store.id}>
                          {store.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SupabaseUserManagement;
