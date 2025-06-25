import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { User, Settings, Key } from 'lucide-react';
import { canManageUsers, canChangePassword, hashPassword } from '@/utils/security';

export type UserRole = 'ADMIN' | 'BOARD' | 'MANAGER' | 'SALESPERSON';

export interface Store {
  id: string;
  name: string;
  address: string;
}

export interface UserProfile {
  id: number;
  username: string;
  fullName: string;
  email: string;
  role: UserRole;
  storeId?: string;
  registeredAt: string;
}

interface UserManagementProps {
  currentUser: UserProfile;
}

const UserManagement: React.FC<UserManagementProps> = ({ currentUser }) => {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [stores, setStores] = useState<Store[]>([]);
  const [newStore, setNewStore] = useState({ name: '', address: '' });
  const [newUser, setNewUser] = useState({
    username: '',
    fullName: '',
    email: '',
    password: '',
    role: 'SALESPERSON' as UserRole,
    storeId: ''
  });
  const [passwordChange, setPasswordChange] = useState({
    userId: 0,
    newPassword: '',
    showDialog: false
  });
  const { toast } = useToast();

  const canManage = canManageUsers(currentUser.role);

  useEffect(() => {
    loadUsers();
    loadStores();
  }, []);

  const loadUsers = () => {
    const storedUsers = JSON.parse(localStorage.getItem('crmUsers') || '[]');
    setUsers(storedUsers);
  };

  const loadStores = () => {
    const storedStores = JSON.parse(localStorage.getItem('crmStores') || '[]');
    setStores(storedStores);
  };

  const addStore = () => {
    if (!newStore.name || !canManage) return;

    const store: Store = {
      id: `store-${Date.now()}`,
      name: newStore.name,
      address: newStore.address
    };

    const updatedStores = [...stores, store];
    setStores(updatedStores);
    localStorage.setItem('crmStores', JSON.stringify(updatedStores));
    setNewStore({ name: '', address: '' });

    toast({
      title: "Store Added",
      description: `Store "${store.name}" has been created.`,
    });
  };

  const addUser = () => {
    if (!newUser.username || !newUser.fullName || !newUser.password || !canManage) return;

    // Check if username already exists
    const existingUsers = JSON.parse(localStorage.getItem('crmUsers') || '[]');
    if (existingUsers.some((user: UserProfile) => user.username === newUser.username)) {
      toast({
        title: "User Creation Failed",
        description: "Username already exists.",
        variant: "destructive",
      });
      return;
    }

    const user: UserProfile = {
      id: Date.now(),
      username: newUser.username,
      fullName: newUser.fullName,
      email: newUser.email,
      role: newUser.role,
      storeId: newUser.storeId || undefined,
      registeredAt: new Date().toISOString()
    };

    const updatedUsers = [...users, user];
    setUsers(updatedUsers);
    localStorage.setItem('crmUsers', JSON.stringify(updatedUsers));

    // Store hashed password
    const existingPasswords = JSON.parse(localStorage.getItem('crmPasswords') || '{}');
    existingPasswords[newUser.username] = hashPassword(newUser.password);
    localStorage.setItem('crmPasswords', JSON.stringify(existingPasswords));

    setNewUser({
      username: '',
      fullName: '',
      email: '',
      password: '',
      role: 'SALESPERSON',
      storeId: ''
    });

    toast({
      title: "User Added",
      description: `User "${user.fullName}" has been registered.`,
    });
  };

  const changeUserPassword = () => {
    const targetUser = users.find(u => u.id === passwordChange.userId);
    if (!targetUser || !passwordChange.newPassword) return;

    if (!canChangePassword(currentUser.role, targetUser.role)) {
      toast({
        title: "Access Denied",
        description: "You don't have permission to change this user's password.",
        variant: "destructive",
      });
      return;
    }

    const existingPasswords = JSON.parse(localStorage.getItem('crmPasswords') || '{}');
    existingPasswords[targetUser.username] = hashPassword(passwordChange.newPassword);
    localStorage.setItem('crmPasswords', JSON.stringify(existingPasswords));

    setPasswordChange({ userId: 0, newPassword: '', showDialog: false });

    toast({
      title: "Password Changed",
      description: `Password for ${targetUser.fullName} has been updated.`,
    });
  };

  const updateUserStore = (userId: number, storeId: string) => {
    if (!canManage) return;

    const updatedUsers = users.map(user =>
      user.id === userId ? { ...user, storeId } : user
    );
    setUsers(updatedUsers);
    localStorage.setItem('crmUsers', JSON.stringify(updatedUsers));

    toast({
      title: "User Updated",
      description: "User store assignment has been updated.",
    });
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
                value={newUser.fullName}
                onChange={(e) => setNewUser({ ...newUser, fullName: e.target.value })}
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
              <Select value={newUser.storeId} onValueChange={(storeId) => setNewUser({ ...newUser, storeId })}>
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
                  <div className="font-medium">{user.fullName}</div>
                  <div className="text-sm text-gray-500">
                    {user.username} • {user.role} • {stores.find(s => s.id === user.storeId)?.name || 'No store assigned'}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {canChangePassword(currentUser.role, user.role) && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setPasswordChange({ userId: user.id, newPassword: '', showDialog: true })}
                    >
                      <Key className="h-4 w-4" />
                    </Button>
                  )}
                  <Select
                    value={user.storeId || ''}
                    onValueChange={(storeId) => updateUserStore(user.id, storeId)}
                  >
                    <SelectTrigger className="w-48">
                      <SelectValue placeholder="Assign store" />
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
            ))}
          </div>
        </CardContent>
      </Card>

      {passwordChange.showDialog && (
        <Card className="border-2 border-orange-200">
          <CardHeader>
            <CardTitle>Change Password</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="newPassword">New Password</Label>
              <Input
                id="newPassword"
                type="password"
                value={passwordChange.newPassword}
                onChange={(e) => setPasswordChange({ ...passwordChange, newPassword: e.target.value })}
                placeholder="Enter new password"
              />
            </div>
            <div className="flex gap-2">
              <Button onClick={changeUserPassword}>Change Password</Button>
              <Button variant="outline" onClick={() => setPasswordChange({ userId: 0, newPassword: '', showDialog: false })}>
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default UserManagement;
