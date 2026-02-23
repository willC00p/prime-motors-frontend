import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import type { User } from '../types/auth';
import { authApi } from '../services/authApi';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  error: string | null;
  login: (username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const initAuth = async () => {
      try {
        const token = localStorage.getItem('auth_token');
        const storedUser = localStorage.getItem('user');
        console.log('Initial auth check:', { token: token ? 'Present' : 'Missing', storedUser: !!storedUser });
        
        if (!token) {
          console.log('No token found, skipping user fetch');
          setLoading(false);
          setUser(null);
          return;
        }

        // First set the stored user if available
        if (storedUser) {
          setUser(JSON.parse(storedUser));
        }

        // Then verify and update with fresh data
        console.log('Verifying token and fetching current user');
        const currentUser = await authApi.getCurrentUser();
        console.log('Current user verified:', currentUser);
        setUser(currentUser);
        localStorage.setItem('user', JSON.stringify(currentUser));
      } catch (err) {
        console.error('Failed to fetch current user:', err);
        // Clear invalid token
        localStorage.removeItem('auth_token');
      } finally {
        setLoading(false);
      }
    };

    initAuth();
    // Cross-tab/session logout/login sync
    const onStorage = (e: StorageEvent) => {
      if (e.key === 'auth_token') {
        const token = localStorage.getItem('auth_token');
        if (!token) {
          // Token removed elsewhere -> force local logout
          setUser(null);
          localStorage.removeItem('user');
        }
      }
      if (e.key === 'user' && e.newValue) {
        try {
          const parsed = JSON.parse(e.newValue);
          setUser(parsed);
        } catch {}
      }
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  const login = useCallback(async (username: string, password: string) => {
    try {
      setLoading(true);
      setError(null);
      
      // Clear any existing auth data
      localStorage.removeItem('auth_token');
      localStorage.removeItem('user');
      
      const response = await authApi.login({ username, password });
      console.log('Login response:', response);
      
      if (response.token && response.user) {
        // Store both token and user data
        localStorage.setItem('auth_token', response.token);
        localStorage.setItem('user', JSON.stringify(response.user));
        setUser(response.user);
        
        console.log('Auth data stored:', {
          token: 'Present',
          user: response.user.username
        });
        
        // Verify the token works
        try {
          const verifiedUser = await authApi.getCurrentUser();
          console.log('Token verification successful:', verifiedUser);
          
          // Update stored user data with verified data
          localStorage.setItem('user', JSON.stringify(verifiedUser));
          setUser(verifiedUser);
        } catch (verifyErr) {
          console.error('Token verification failed:', verifyErr);
          localStorage.removeItem('auth_token');
          localStorage.removeItem('user');
          setUser(null);
          throw new Error('Failed to verify login token');
        }
      } else {
        throw new Error('Invalid login response format');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to login');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      setLoading(true);
      await authApi.logout();
      
      // Clear all auth data
      localStorage.removeItem('auth_token');
      localStorage.removeItem('user');
      setUser(null);
      
      console.log('Logout successful - cleared all auth data');
      // Hard redirect to login to ensure all state is reset
      if (typeof window !== 'undefined') {
        window.location.href = '/login';
      }
    } catch (err) {
      console.error('Logout failed:', err);
      // Still clear local data even if logout API fails
      localStorage.removeItem('auth_token');
      localStorage.removeItem('user');
      setUser(null);
      if (typeof window !== 'undefined') {
        window.location.href = '/login';
      }
    } finally {
      setLoading(false);
    }
  }, []);

  const value = {
    user,
    loading,
    error,
    login,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
