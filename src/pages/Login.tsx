
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from 'react-router-dom';
import { UserProfile } from '@/components/UserManagement';

const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  const createDefaultAdmin = () => {
    const defaultAdmin: UserProfile = {
      id: 1,
      username: 'admin',
      fullName: 'System Administrator',
      email: 'admin@crm.com',
      role: 'ADMIN',
      registeredAt: new Date().toISOString()
    };
    
    const users = [defaultAdmin];
    localStorage.setItem('crmUsers', JSON.stringify(users));
    
    // Also create admin password mapping
    const passwords = { 'admin': 'admin123' };
    localStorage.setItem('crmPasswords', JSON.stringify(passwords));
    
    return defaultAdmin;
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Get stored users and passwords
      const storedUsers = JSON.parse(localStorage.getItem('crmUsers') || '[]');
      const storedPasswords = JSON.parse(localStorage.getItem('crmPasswords') || '{}');

      // If no users exist, create default admin
      if (storedUsers.length === 0) {
        const defaultAdmin = createDefaultAdmin();
        if (username === 'admin' && password === 'admin123') {
          localStorage.setItem('crmUser', JSON.stringify(defaultAdmin));
          toast({
            title: "Login Successful",
            description: "Welcome to the CRM system! (Default admin account)",
          });
          navigate('/dashboard');
          return;
        }
      }

      // Find user by username
      const user = storedUsers.find((u: UserProfile) => u.username === username);
      const userPassword = storedPasswords[username];

      if (user && userPassword === password) {
        localStorage.setItem('crmUser', JSON.stringify(user));
        toast({
          title: "Login Successful",
          description: `Welcome back, ${user.fullName}!`,
        });
        navigate('/dashboard');
      } else {
        toast({
          title: "Login Failed",
          description: "Invalid username or password.",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Login Error",
        description: "An error occurred during login.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = () => {
    navigate('/register');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Sales CRM Login</CardTitle>
          <CardDescription>
            Enter your credentials to access the sales management system
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter your username"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                required
              />
            </div>
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? 'Logging in...' : 'Login'}
            </Button>
            <Button type="button" variant="outline" className="w-full" onClick={handleRegister}>
              Create New Account
            </Button>
          </form>
          
          <div className="mt-4 p-3 bg-blue-50 rounded-lg">
            <p className="text-sm text-blue-800">
              <strong>Default Admin Account:</strong><br />
              Username: admin<br />
              Password: admin123
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Login;
