'use client';

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from 'react';
import type { AuthUser, LoginResponse } from './types';

interface AuthContextType {
  user: AuthUser | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  isAdmin: boolean;
  login: (email: string, password: string) => Promise<LoginResponse>;
  verify2FA: (tempToken: string, code: string) => Promise<AuthUser>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

async function authFetch<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({
      error: 'Request failed',
      message: 'Request failed',
    }));
    throw new Error(err.message || err.error || `HTTP ${res.status}`);
  }
  return res.json();
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const isAuthenticated = !!user;
  const isAdmin = user?.role === 'ADMIN';

  // Check session on mount
  useEffect(() => {
    authFetch<{ data: AuthUser | null }>('/api/pmo-auth/session')
      .then((res) => {
        if (res.data) {
          setUser(res.data);
        }
      })
      .catch(() => {
        // Session check failed - not authenticated
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, []);

  const login = useCallback(async (email: string, password: string): Promise<LoginResponse> => {
    const res = await authFetch<{ data: LoginResponse }>('/api/pmo-auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });

    const data = res.data;
    if (data.user && data.token) {
      // Login successful without 2FA
      setUser(data.user);
    }
    // If requires2FA, the caller handles it
    return data;
  }, []);

  const verify2FA = useCallback(
    async (tempToken: string, code: string): Promise<AuthUser> => {
      const res = await authFetch<{ data: { user: AuthUser; token: string } }>(
        '/api/pmo-auth/verify-2fa',
        {
          method: 'POST',
          body: JSON.stringify({ tempToken, code }),
        }
      );
      setUser(res.data.user);
      return res.data.user;
    },
    []
  );

  const logout = useCallback(async () => {
    try {
      await authFetch<{ data: { success: boolean } }>('/api/pmo-auth/logout', {
        method: 'POST',
      });
    } catch {
      // Ignore logout errors
    }
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider
      value={{ user, isLoading, isAuthenticated, isAdmin, login, verify2FA, logout }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}