import { api } from './api';
import type { Account, CreateAccountRequest, UpdateAccountRequest, UpdatePasswordRequest } from '../types/account';

export const accountApi = {
  // Get all accounts
  getAll: async (): Promise<Account[]> => {
    return api.get<Account[]>('/accounts');
  },

  // Get account by ID
  getById: async (id: number): Promise<Account> => {
    return api.get<Account>(`/accounts/${id}`);
  },

  // Create new account
  create: async (data: CreateAccountRequest): Promise<Account> => {
    return api.post<Account>('/accounts', data);
  },

  // Update account
  update: async (id: number, data: UpdateAccountRequest): Promise<Account> => {
    return api.put<Account>(`/accounts/${id}`, data);
  },

  // Update password
  updatePassword: async (id: number, data: UpdatePasswordRequest): Promise<{ message: string }> => {
    return api.put<{ message: string }>(`/accounts/${id}/password`, data);
  },

  // Delete account
  delete: async (id: number): Promise<{ message: string }> => {
    return api.delete<{ message: string }>(`/accounts/${id}`);
  },

  // Toggle account status
  toggleStatus: async (id: number): Promise<Account> => {
    return api.put<Account>(`/accounts/${id}/toggle-status`, {});
  }
};
