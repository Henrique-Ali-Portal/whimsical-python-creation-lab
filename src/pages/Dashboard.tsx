
import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useNavigate } from 'react-router-dom';
import { useToast } from "@/hooks/use-toast";
import InteractionForm from '@/components/InteractionForm';
import InteractionList from '@/components/InteractionList';
import DashboardStats from '@/components/DashboardStats';
import ProductUpload, { Product } from '@/components/ProductUpload';
import UserManagement, { UserProfile, UserRole } from '@/components/UserManagement';
import { LogOut, Plus, Upload, Settings } from 'lucide-react';

export interface Interaction {
  id: number;
  clientName: string;
  description: string;
  status: 'Closed' | 'Quoted' | 'Lost';
  reason?: 'Lack of product' | 'Stock Error' | 'Delay' | 'Price' | 'Other';
  monetaryValue?: number;
  createdAt: string;
  salespersonId: number;
  relatedProducts?: (Product | { id: string; description: string; isCustom: true })[];
}

const Dashboard = () => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [showProductUpload, setShowProductUpload] = useState(false);
  const [showUserManagement, setShowUserManagement] = useState(false);
  const [interactions, setInteractions] = useState<Interaction[]>([]);
  const [activeTab, setActiveTab] = useState<'interactions' | 'products' | 'users'>('interactions');
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const storedUser = localStorage.getItem('crmUser');
    if (!storedUser) {
      navigate('/login');
      return;
    }
    
    // Enhanced user with role system
    const basicUser = JSON.parse(storedUser);
    const enhancedUser: UserProfile = {
      ...basicUser,
      role: 'SALESPERSON' as UserRole, // Default role, can be updated through user management
      fullName: basicUser.username,
      email: '',
      registeredAt: new Date().toISOString()
    };
    
    setUser(enhancedUser);
    loadInteractions();
  }, [navigate]);

  const loadInteractions = () => {
    const storedInteractions = JSON.parse(localStorage.getItem('crmInteractions') || '[]');
    setInteractions(storedInteractions);
  };

  const handleLogout = () => {
    localStorage.removeItem('crmUser');
    toast({
      title: "Logged Out",
      description: "You have been successfully logged out.",
    });
    navigate('/login');
  };

  const addInteraction = (interaction: Omit<Interaction, 'id' | 'createdAt' | 'salespersonId'>) => {
    if (!user) return;

    const newInteraction: Interaction = {
      ...interaction,
      id: Date.now(),
      createdAt: new Date().toISOString(),
      salespersonId: user.id
    };

    const updatedInteractions = [...interactions, newInteraction];
    setInteractions(updatedInteractions);
    localStorage.setItem('crmInteractions', JSON.stringify(updatedInteractions));
    
    toast({
      title: "Interaction Added",
      description: "Client interaction has been logged successfully.",
    });
    setShowForm(false);
  };

  const handleProductsUploaded = (products: Product[]) => {
    toast({
      title: "Products Updated",
      description: `${products.length} products are now available for selection.`,
    });
    setShowProductUpload(false);
  };

  if (!user) return null;

  const canManageUsers = user.role === 'ADMIN' || user.role === 'BOARD';

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Sales CRM</h1>
              <p className="text-gray-600">Welcome back, {user.username}! ({user.role})</p>
            </div>
            <div className="flex items-center space-x-4">
              <Button
                variant={activeTab === 'interactions' ? 'default' : 'outline'}
                onClick={() => setActiveTab('interactions')}
              >
                Interactions
              </Button>
              <Button
                variant={activeTab === 'products' ? 'default' : 'outline'}
                onClick={() => setActiveTab('products')}
              >
                <Upload className="h-4 w-4 mr-2" />
                Products
              </Button>
              {canManageUsers && (
                <Button
                  variant={activeTab === 'users' ? 'default' : 'outline'}
                  onClick={() => setActiveTab('users')}
                >
                  <Settings className="h-4 w-4 mr-2" />
                  Management
                </Button>
              )}
              <Button variant="outline" onClick={handleLogout} className="flex items-center gap-2">
                <LogOut className="h-4 w-4" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'interactions' && (
          <>
            <DashboardStats interactions={interactions} />
            
            <div className="mt-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2">
                <InteractionList interactions={interactions} />
              </div>
              
              <div className="lg:col-span-1">
                <Button onClick={() => setShowForm(true)} className="w-full mb-4">
                  <Plus className="h-4 w-4 mr-2" />
                  New Interaction
                </Button>
                
                {showForm && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Log New Interaction</CardTitle>
                      <CardDescription>
                        Record a new client interaction
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <InteractionForm 
                        onSubmit={addInteraction}
                        onCancel={() => setShowForm(false)}
                      />
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
          </>
        )}

        {activeTab === 'products' && (
          <ProductUpload onProductsUploaded={handleProductsUploaded} />
        )}

        {activeTab === 'users' && canManageUsers && (
          <UserManagement currentUser={user} />
        )}
      </main>
    </div>
  );
};

export default Dashboard;
