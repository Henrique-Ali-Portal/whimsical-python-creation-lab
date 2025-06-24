
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
              <CardTitle>Status Management</CardTitle>
              <CardDescription>
                Categorize interactions as Closed, Quoted, or Lost with detailed reasons
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm text-gray-600">
                <li>• Clear status categories</li>
                <li>• Loss reason tracking</li>
                <li>• Monetary value recording</li>
              </ul>
            </CardContent>
          </Card>
        </div>

        <div className="text-center space-y-4">
          <div className="space-x-4">
            <Button size="lg" onClick={() => navigate('/login')}>
              Login to CRM
            </Button>
            <Button size="lg" variant="outline" onClick={() => navigate('/register')}>
              Create Account
            </Button>
          </div>
          <p className="text-sm text-gray-500">
            New to our system? Create an account to get started with your sales tracking.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Index;
