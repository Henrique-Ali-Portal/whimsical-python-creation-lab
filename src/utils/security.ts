
import CryptoJS from 'crypto-js';

export type UserRole = 'ADMIN' | 'BOARD' | 'MANAGER' | 'SALESPERSON';

// Password hashing utility
export const hashPassword = (password: string): string => {
  return CryptoJS.SHA256(password).toString();
};

export const verifyPassword = (password: string, hashedPassword: string): boolean => {
  return hashPassword(password) === hashedPassword;
};

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

// Initialize default admin user
export const initializeDefaultAdmin = () => {
  const existingUsers = JSON.parse(localStorage.getItem('crmUsers') || '[]');
  const existingPasswords = JSON.parse(localStorage.getItem('crmPasswords') || '{}');
  
  if (existingUsers.length === 0) {
    const defaultAdmin = {
      id: 1,
      username: 'admin',
      fullName: 'System Administrator',
      email: 'admin@crm.com',
      role: 'ADMIN' as UserRole,
      registeredAt: new Date().toISOString()
    };
    
    const hashedPassword = hashPassword('admin123');
    
    localStorage.setItem('crmUsers', JSON.stringify([defaultAdmin]));
    localStorage.setItem('crmPasswords', JSON.stringify({ 'admin': hashedPassword }));
    
    return defaultAdmin;
  }
  
  return null;
};
