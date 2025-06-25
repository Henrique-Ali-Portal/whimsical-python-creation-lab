
import { supabase } from '@/integrations/supabase/client';

export type UserRole = 'ADMIN' | 'BOARD' | 'MANAGER' | 'SALESPERSON';

// Role hierarchy checking
export const canManageUsers = (userRole: UserRole): boolean => {
  return userRole === 'ADMIN' || userRole === 'BOARD';
};

export const canUploadProducts = (userRole: UserRole): boolean => {
  return userRole === 'ADMIN' || userRole === 'BOARD';
};

export const canChangePassword = (userRole: UserRole, targetRole: UserRole): boolean => {
  if (userRole === 'ADMIN') return true;
  if (userRole === 'BOARD') return targetRole === 'MANAGER' || targetRole === 'SALESPERSON';
  return false;
};

// Role hierarchy levels for comparison
const roleHierarchy: Record<UserRole, number> = {
  'ADMIN': 4,
  'BOARD': 3,
  'MANAGER': 2,
  'SALESPERSON': 1
};

export const hasHigherOrEqualRole = (userRole: UserRole, targetRole: UserRole): boolean => {
  return roleHierarchy[userRole] >= roleHierarchy[targetRole];
};

// Initialize default admin user if none exists
export const initializeDefaultAdmin = async () => {
  try {
    // Check if any admin users exist
    const { data: adminUsers, error } = await supabase
      .from('profiles')
      .select('id')
      .eq('role', 'ADMIN')
      .limit(1);

    if (error) throw error;

    if (!adminUsers || adminUsers.length === 0) {
      // Create default admin user
      const { data, error: signUpError } = await supabase.auth.signUp({
        email: 'admin@crm.com',
        password: 'admin123',
        options: {
          data: {
            username: 'admin',
            full_name: 'System Administrator',
          },
        },
      });

      if (signUpError) throw signUpError;
      
      return data.user;
    }
    
    return null;
  } catch (error) {
    console.error('Error initializing default admin:', error);
    return null;
  }
};

// Create new user (only for ADMIN/BOARD roles)
export const createUser = async (userData: {
  email: string;
  password: string;
  username: string;
  full_name: string;
  role: UserRole;
  store_id?: string;
}) => {
  const { data, error } = await supabase.auth.signUp({
    email: userData.email,
    password: userData.password,
    options: {
      data: {
        username: userData.username,
        full_name: userData.full_name,
        role: userData.role,
        store_id: userData.store_id,
      },
    },
  });

  return { data, error };
};

// Update user role (only for ADMIN/BOARD)
export const updateUserRole = async (userId: string, role: UserRole) => {
  const { data, error } = await supabase
    .from('profiles')
    .update({ role, updated_at: new Date().toISOString() })
    .eq('id', userId);

  return { data, error };
};

// Change user password (requires proper permissions)
export const changeUserPassword = async (userId: string, newPassword: string) => {
  // This would require admin privileges on Supabase
  // For now, we'll handle this through the admin API in an edge function
  const { data, error } = await supabase.functions.invoke('change-user-password', {
    body: { userId, newPassword },
  });

  return { data, error };
};
