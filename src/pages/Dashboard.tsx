
import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useNavigate } from 'react-router-dom';
import { useToast } from "@/hooks/use-toast";
import InteractionForm from '@/components/InteractionForm';
import InteractionList from '@/components/InteractionList';
import DashboardStats from '@/components/DashboardStats';
import { LogOut, Plus } from 'lucide-react';

export interface Interaction {
  id: number;
  clientName: string;
  description: string;
  status: 'Closed' | 'Quoted' | 'Lost';
  reason?: 'Lack of product' | 'Delay' | 'Price';
  monetaryValue?: number;
  createdAt: string;
  salespersonId: number;
}

const Dashboard = () => {
  const [user, setUser] = useState<any>(null);
  const [showForm, setShowForm] = useState(false);
  const [interactions, setInteractions] = useState<Interaction[]>([]);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const storedUser = localStorage.getItem('crmUser');
    if (!storedUser) {
      navigate('/login');
      return;
    }
    setUser(JSON.parse(storedUser));
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

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Sales CRM</h1>
              <p className="text-gray-600">Welcome back, {user.username}!</p>
            </div>
            <div className="flex items-center space-x-4">
              <Button onClick={() => setShowForm(true)} className="flex items-center gap-2">
                <Plus className="h-4 w-4" />
                New Interaction
              </Button>
              <Button variant="outline" onClick={handleLogout} className="flex items-center gap-2">
                <LogOut className="h-4 w-4" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <DashboardStats interactions={interactions} />
        
        <div className="mt-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <InteractionList interactions={interactions} />
          </div>
          
          <div className="lg:col-span-1">
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
      </main>
    </div>
  );
};

export default Dashboard;
