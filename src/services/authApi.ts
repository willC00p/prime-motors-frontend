import type { User } from '../types/auth';
import { fetchApi } from './api';
import type { FetchOptions } from '../utils/api';

export interface LoginCredentials {
  username: string;
  password: string;
}

interface LoginResponse {
  user: User;
  token: string;
}

export const authApi = {
  login: async (credentials: LoginCredentials): Promise<LoginResponse> => {
    // Clear any existing token before login
    localStorage.removeItem('auth_token');
    
    const options: FetchOptions = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(credentials),
      skipAuth: true
    };

    const response = await fetchApi<LoginResponse>('/auth/login', options);
    console.log('Login API response:', response);
    return response;
  },

  logout: async (): Promise<void> => {
    return fetchApi('/auth/logout', {
      method: 'POST',
    });
  },

  getCurrentUser: async (options: FetchOptions = {}): Promise<User> => {
    const token = localStorage.getItem('auth_token');
    if (!token) {
      throw new Error('No auth token found');
    }
    return fetchApi('/auth/me', {
      ...options,
      headers: {
        ...options.headers,
        'Authorization': `Bearer ${token}`
      }
    });
  },
};
