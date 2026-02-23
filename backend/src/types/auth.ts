export type UserRole = 'gm' | 'ceo' | 'nsm' | 'purchasing' | 'accounting' | 'finance' | 'audit' | 'branch';

export interface User {
  id: number;
  username: string;
  password?: string; // Optional as we don't want to send this to the frontend
  role: UserRole;
  branchId: number | null; // Only required for branch users
  name: string;
  email: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface LoginCredentials {
  username: string;
  password: string;
}

export interface LoginResponse {
  user: Omit<User, 'password'>;
  token: string;
}
