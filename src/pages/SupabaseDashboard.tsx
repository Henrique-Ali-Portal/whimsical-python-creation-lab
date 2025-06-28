
import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useNavigate } from 'react-router-dom';
import { useToast } from "@/hooks/use-toast";
import { useAuth } from '@/hooks/useAuth';
import SupabaseInteractionForm from '@/components/SupabaseInteractionForm';
import SupabaseInteractionList from '@/components/SupabaseInteractionList';
import SupabaseDashboardStats from '@/components/SupabaseDashboardStats';
import SupabaseProductUpload from '@/components/SupabaseProductUpload';
import SupabaseUserManagement from '@/components/SupabaseUserManagement';
import { LogOut, Plus, Upload, Settings } from 'lucide-react';
import { canManageUsers, canUploadProducts } from '@/utils/supabase-security';

const SupabaseDashboard = () => {
  const [showForm, setShowForm] = useState(false);
  const [activeTab, setActiveTab] = useState<'interactions' | 'products' | 'users'>('interactions');
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, profile, signOut, loading } = useAuth();

  useEffect(() => {
    if (!loading && !user) {
      console.log('No user found, redirecting to login');
      navigate('/supabase-login');
    }
  }, [user, loading, navigate]);

  const handleLogout = async () => {
    console.log('Logout button clicked');
    
    const { error } = await signOut();
    
    if (error) {
      console.error('Logout failed:', error);
      toast({
        title: "Logout Error",
        description: error.message,
        variant: "destructive",
      });
    } else {
      console.log('Logout successful, showing toast and redirecting');
      toast({
        title: "Logged Out",
        description: "You have been successfully logged out.",
      });
      
      // Small delay to show the toast before redirect
      setTimeout(() => {
        navigate('/supabase-login');
      }, 500);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user || !profile) {
    return null;
  }

  const canManage = canManageUsers(profile.role);
  const canUpload = canUploadProducts(profile.role);
  const canCreateInteractions = profile.role === 'SALESPERSON';

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Sales CRM</h1>
              <p className="text-gray-600">Welcome back, {profile.full_name}! ({profile.role})</p>
            </div>
            <div className="flex items-center space-x-4">
              <Button
                variant={activeTab === 'interactions' ? 'default' : 'outline'}
                onClick={() => setActiveTab('interactions')}
              >
                Interactions
              </Button>
              {canUpload && (
                <Button
                  variant={activeTab === 'products' ? 'default' : 'outline'}
                  onClick={() => setActiveTab('products')}
                >
                  <Upload className="h-4 w-4 mr-2" />
                  Products
                </Button>
              )}
              {canManage && (
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
            <SupabaseDashboardStats />
            
            <div className="mt-8">
              {canCreateInteractions && (
                <div className="mb-6">
                  <Button onClick={() => setShowForm(true)} className="mb-4">
                    <Plus className="h-4 w-4 mr-2" />
                    New Interaction
                  </Button>
                  
                  {showForm && (
                    <Card className="mb-6">
                      <CardHeader>
                        <CardTitle>Log New Interaction</CardTitle>
                        <CardDescription>
                          Record a new client interaction
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <SupabaseInteractionForm 
                          onCancel={() => setShowForm(false)}
                          onSuccess={() => setShowForm(false)}
                        />
                      </CardContent>
                    </Card>
                  )}
                </div>
              )}
              
              <SupabaseInteractionList />
            </div>
          </>
        )}

        {activeTab === 'products' && canUpload && (
          <SupabaseProductUpload />
        )}

        {activeTab === 'users' && canManage && (
          <SupabaseUserManagement />
        )}
      </main>
    </div>
  );
};

export default SupabaseDashboard;
