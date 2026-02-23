export type UserRole = 
  | 'gm' 
  | 'ceo' 
  | 'nsm' 
  | 'purchasing' 
  | 'accounting' 
  | 'finance' 
  | 'audit' 
  | 'branch';

export interface User {
  id: number;
  username: string;
  role: UserRole;
  name: string;
  branchId?: number; // For branch users
  email: string;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
}

export const hasFullAccess = (role: UserRole): boolean => {
  return ['gm', 'ceo', 'nsm', 'purchasing', 'accounting', 'finance', 'audit'].includes(role);
}

export const hasInventoryAccess = (role: UserRole, userBranchId?: number, itemBranchId?: number): boolean => {
  if (hasFullAccess(role)) return true;
  if (role === 'branch') {
    return userBranchId === itemBranchId;
  }
  return false;
}

export const hasSalesAccess = (role: UserRole, userBranchId?: number, saleBranchId?: number): boolean => {
  if (hasFullAccess(role)) return true;
  if (role === 'branch') {
    return userBranchId === saleBranchId;
  }
  return false;
}
