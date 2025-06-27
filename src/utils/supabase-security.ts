
import { supabase } from '@/integrations/supabase/client';

export type UserRole = 'ADMIN' | 'BOARD' | 'MANAGER' | 'SALESPERSON';

// Role hierarchy checking
export const canManageUsers = (userRole: UserRole): boolean => {
  return userRole === 'ADMIN' || userRole === 'BOARD';
};

export const canUploadProducts = (userRole: UserRole): boolean => {
  return userRole === 'ADMIN' || userRole === 'BOARD';
};

export const canDeleteUsers = (userRole: UserRole): boolean => {
  return userRole === 'ADMIN';
};

export const canChangePassword = (userRole: UserRole, targetRole: UserRole): boolean => {
  if (userRole === 'ADMIN') return true;
  if (userRole === 'BOARD') return targetRole === 'MANAGER' || targetRole === 'SALESPERSON';
  return false;
};

export const canUpdateRole = (userRole: UserRole, currentTargetRole: UserRole, newTargetRole: UserRole): boolean => {
  if (userRole === 'ADMIN') return true;
  if (userRole === 'BOARD') {
    // BOARD can only promote SALESPERSON to MANAGER
    return currentTargetRole === 'SALESPERSON' && newTargetRole === 'MANAGER';
  }
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
    console.log('Checking for existing admin users...');
    
    // Check if any admin users exist
    const { data: adminUsers, error } = await supabase
      .from('profiles')
      .select('id, username')
      .eq('role', 'ADMIN')
      .limit(1);

    if (error) {
      console.error('Error checking admin users:', error);
      throw error;
    }

    console.log('Admin users found:', adminUsers);

    if (!adminUsers || adminUsers.length === 0) {
      console.log('No admin users found. Creating default admin...');
      
      // Create default admin user without email confirmation
      const { data, error: signUpError } = await supabase.auth.signUp({
        email: 'admin@crm.com',
        password: 'Admin@123',
        options: {
          data: {
            username: 'Admin',
            full_name: 'Admin',
            role: 'ADMIN',
          },
          emailRedirectTo: undefined, // Disable email confirmation
        },
      });

      if (signUpError) {
        console.error('Error creating default admin:', signUpError);
        
        // If it's a rate limit error, check if the user might already exist
        if (signUpError.message.includes('rate limit') || signUpError.message.includes('36 seconds')) {
          console.log('Rate limit hit, checking if admin already exists in auth...');
          
          // Try to sign in with the default credentials to see if the user exists
          const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
            email: 'admin@crm.com',
            password: 'Admin@123',
          });
          
          if (signInData?.user && !signInError) {
            console.log('Default admin already exists and can sign in');
            await supabase.auth.signOut(); // Sign out after test
            return signInData.user;
          }
        }
        
        throw signUpError;
      }
      
      console.log('Default admin created successfully:', data);
      return data?.user;
    } else {
      console.log('Admin user already exists:', adminUsers[0]);
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
  console.log('Creating new user:', { username: userData.username, role: userData.role });
  
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
      emailRedirectTo: undefined, // Disable email confirmation
    },
  });

  if (error) {
    console.error('Error creating user:', error);
  } else {
    console.log('User created successfully:', data?.user?.id);
  }

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
