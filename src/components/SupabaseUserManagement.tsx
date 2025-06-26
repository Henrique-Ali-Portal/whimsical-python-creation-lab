
import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { User, Settings } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { canManageUsers, UserRole } from '@/utils/supabase-security';

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
  }[] | null;
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
    store_id: 'none'
  });
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const { toast } = useToast();
  const { profile } = useAuth();

  const canManage = profile ? canManageUsers(profile.role) : false;

  useEffect(() => {
    if (canManage) {
      loadData();
    } else {
      setLoading(false);
    }
  }, [canManage]);

  const loadData = async () => {
    setLoading(true);
    try {
      await Promise.all([loadUsers(), loadStores()]);
    } catch (error) {
      console.error('Error loading management data:', error);
    } finally {
      setLoading(false);
    }
  };

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

      if (error) {
        console.error('Error loading users:', error);
        return;
      }
      
      // Type cast and ensure proper structure
      const typedUsers: UserProfile[] = (data || []).map(user => ({
        ...user,
        role: user.role as UserRole,
        user_stores: user.user_stores || []
      }));
      
      setUsers(typedUsers);
    } catch (error) {
      console.error('Error loading users:', error);
      setUsers([]);
    }
  };

  const loadStores = async () => {
    try {
      const { data, error } = await supabase
        .from('stores')
        .select('*')
        .order('name');

      if (error) {
        console.error('Error loading stores:', error);
        return;
      }
      
      setStores(data || []);
    } catch (error) {
      console.error('Error loading stores:', error);
      setStores([]);
    }
  };

  const addStore = async () => {
    if (!newStore.name.trim() || !canManage || submitting) return;

    setSubmitting(true);
    try {
      const { error } = await supabase
        .from('stores')
        .insert({
          name: newStore.name.trim(),
          address: newStore.address.trim() || null
        });

      if (error) {
        console.error('Error adding store:', error);
        toast({
          title: "Error",
          description: "Failed to add store. Please try again.",
          variant: "destructive",
        });
        return;
      }

      setNewStore({ name: '', address: '' });
      await loadStores();

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
    } finally {
      setSubmitting(false);
    }
  };

  const addUser = async () => {
    if (!newUser.username.trim() || !newUser.full_name.trim() || !newUser.email.trim() || !newUser.password.trim() || !canManage || submitting) return;

    setSubmitting(true);
    try {
      const { data, error } = await supabase.auth.signUp({
        email: newUser.email.trim(),
        password: newUser.password,
        options: {
          data: {
            username: newUser.username.trim(),
            full_name: newUser.full_name.trim(),
            role: newUser.role,
          },
          emailRedirectTo: undefined, // Disable email confirmation
        },
      });

      if (error) {
        console.error('Error adding user:', error);
        toast({
          title: "Error",
          description: error.message || "Failed to add user.",
          variant: "destructive",
        });
        return;
      }

      // Assign to store if selected
      if (newUser.store_id && newUser.store_id !== 'none' && data.user) {
        const { error: storeError } = await supabase
          .from('user_stores')
          .insert({
            user_id: data.user.id,
            store_id: newUser.store_id
          });

        if (storeError) {
          console.error('Error assigning store:', storeError);
        }
      }

      setNewUser({
        username: '',
        full_name: '',
        email: '',
        password: '',
        role: 'SALESPERSON',
        store_id: 'none'
      });

      await loadUsers();

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
    } finally {
      setSubmitting(false);
    }
  };

  const updateUserStore = async (userId: string, storeId: string) => {
    if (!canManage || submitting) return;

    setSubmitting(true);
    try {
      // Remove existing store assignments
      await supabase
        .from('user_stores')
        .delete()
        .eq('user_id', userId);

      // Add new store assignment if storeId is provided and not 'none'
      if (storeId && storeId !== 'none') {
        const { error } = await supabase
          .from('user_stores')
          .insert({
            user_id: userId,
            store_id: storeId
          });

        if (error) {
          console.error('Error updating user store:', error);
          toast({
            title: "Error",
            description: "Failed to update user store assignment.",
            variant: "destructive",
          });
          return;
        }
      }

      await loadUsers();

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
    } finally {
      setSubmitting(false);
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
          <CardTitle>Loading Management Panel...</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            <div className="h-4 bg-gray-200 rounded w-2/3"></div>
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
                disabled={submitting}
              />
            </div>
            <div>
              <Label htmlFor="storeAddress">Address</Label>
              <Input
                id="storeAddress"
                value={newStore.address}
                onChange={(e) => setNewStore({ ...newStore, address: e.target.value })}
                placeholder="Enter store address"
                disabled={submitting}
              />
            </div>
          </div>
          <Button onClick={addStore} disabled={submitting || !newStore.name.trim()}>
            {submitting ? 'Adding...' : 'Add Store'}
          </Button>
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
                disabled={submitting}
              />
            </div>
            <div>
              <Label htmlFor="fullName">Full Name</Label>
              <Input
                id="fullName"
                value={newUser.full_name}
                onChange={(e) => setNewUser({ ...newUser, full_name: e.target.value })}
                placeholder="Enter full name"
                disabled={submitting}
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
                disabled={submitting}
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
                disabled={submitting}
              />
            </div>
            <div>
              <Label>Role</Label>
              <Select 
                value={newUser.role} 
                onValueChange={(role) => setNewUser({ ...newUser, role: role as UserRole })}
                disabled={submitting}
              >
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
              <Select 
                value={newUser.store_id} 
                onValueChange={(storeId) => setNewUser({ ...newUser, store_id: storeId })}
                disabled={submitting}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select store (optional)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No store</SelectItem>
                  {stores.map((store) => (
                    <SelectItem key={store.id} value={store.id}>
                      {store.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <Button onClick={addUser} disabled={submitting || !newUser.username.trim() || !newUser.full_name.trim() || !newUser.email.trim() || !newUser.password.trim()}>
            {submitting ? 'Adding...' : 'Add User'}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Current Users ({users.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {users.length === 0 ? (
            <p className="text-gray-500 text-center py-4">No users found.</p>
          ) : (
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
                      value={user.user_stores?.[0]?.stores?.id || 'none'}
                      onValueChange={(storeId) => updateUserStore(user.id, storeId)}
                      disabled={submitting}
                    >
                      <SelectTrigger className="w-48">
                        <SelectValue placeholder="Assign store" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">No store</SelectItem>
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
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default SupabaseUserManagement;
