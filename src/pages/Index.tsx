
import React from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useNavigate } from 'react-router-dom';

const Index = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Retail Sales CRM System
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Streamline your sales process with our comprehensive CRM designed specifically for retail sales teams.
            Track interactions, manage leads, and boost your sales performance.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
          <Card>
            <CardHeader>
              <CardTitle>Easy Client Tracking</CardTitle>
              <CardDescription>
                Log and manage all your client interactions in one place
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm text-gray-600">
                <li>• Record client conversations</li>
                <li>• Track interaction outcomes</li>
                <li>• Monitor sales pipeline</li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Sales Analytics</CardTitle>
              <CardDescription>
                Get insights into your sales performance and revenue
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm text-gray-600">
                <li>• Revenue tracking</li>
                <li>• Closing rate analysis</li>
                <li>• Pipeline value monitoring</li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Role-Based Access</CardTitle>
              <CardDescription>
                Secure authentication with role-based permissions for different user types
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm text-gray-600">
                <li>• Salesperson access</li>
                <li>• Manager oversight</li>
                <li>• Admin control</li>
              </ul>
            </CardContent>
          </Card>
        </div>

        <div className="text-center space-y-4">
          <Button size="lg" onClick={() => navigate('/supabase-login')}>
            Login to Sales CRM
          </Button>
          <p className="text-sm text-gray-500">
            Secure authentication powered by Supabase
          </p>
        </div>
      </div>
    </div>
  );
};

export default Index;
