import type { UserRole } from './auth';

export interface Account {
  id: number;
  username: string;
  name: string;
  email: string;
  role: UserRole;
  branchId?: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  branch?: {
    id: number;
    name: string;
  };
}

export interface CreateAccountRequest {
  username: string;
  password: string;
  name: string;
  email: string;
  role: UserRole;
  branchId?: number;
}

export interface UpdateAccountRequest {
  username?: string;
  name?: string;
  email?: string;
  role?: UserRole;
  branchId?: number;
  isActive?: boolean;
}

export interface UpdatePasswordRequest {
  password: string;
}
