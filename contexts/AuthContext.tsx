'use client';

import { api } from '@/lib/api';
import { showErrorToast, showSuccessToast, toastMessages } from '@/lib/toast';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { createContext, ReactNode, useContext, useEffect, useState } from 'react';

export interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  notes: string;
  createdAt: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (userData: {
    firstName: string;
    lastName: string;
    email: string;
    phoneNumber: string;
    notes?: string;
    password: string;
  }) => Promise<void>;
  logout: () => Promise<void>;
  updateProfile: (profileData: {
    firstName?: string;
    lastName?: string;
    phoneNumber?: string;
    notes?: string;
  }) => Promise<void>;
  isAdmin: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const { data: session, status } = useSession();
  const [user, setUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const router = useRouter();

  // Sync NextAuth session with our user state
  useEffect(() => {
    if (session?.user) {
      // Fetch full user data from API
      api.getCurrentUser()
        .then(data => {
          setUser(data.user);
          // Check admin status by calling a server-side endpoint
          return fetch('/api/auth/check-admin');
        })
        .then(adminCheck => adminCheck.json())
        .then(adminData => {
          setIsAdmin(adminData.isAdmin);
        })
        .catch(() => {
          setUser(null);
          setIsAdmin(false);
        });
    } else {
      setUser(null);
      setIsAdmin(false);
    }
  }, [session]);

  const login = async (email: string, password: string) => {
    // This should not be called since we're using NextAuth's signIn
    // But keeping it for compatibility
    throw new Error('Use NextAuth signIn instead');
  };

  const signup = async (userData: {
    firstName: string;
    lastName: string;
    email: string;
    phoneNumber: string;
    notes?: string;
    password: string;
  }) => {
    try {
      const data = await api.signup(userData);
      setUser(data.user);
      showSuccessToast(toastMessages.auth.signupSuccess);
      router.push('/');
    } catch (error) {
      showErrorToast(error instanceof Error ? error.message : toastMessages.general.error);
      throw error;
    }
  };

  const logout = async () => {
    try {
      await api.logout();
      setUser(null);
      setIsAdmin(false);
      showSuccessToast(toastMessages.auth.logoutSuccess);
      router.push('/');
    } catch (error) {
      showErrorToast(error instanceof Error ? error.message : toastMessages.general.error);
      throw error;
    }
  };

  const updateProfile = async (profileData: {
    firstName?: string;
    lastName?: string;
    phoneNumber?: string;
    notes?: string;
  }) => {
    try {
      const data = await api.updateProfile(profileData);
      setUser(data.user);
      showSuccessToast(toastMessages.profile.updateSuccess);
    } catch (error) {
      showErrorToast(error instanceof Error ? error.message : toastMessages.general.error);
      throw error;
    }
  };

  const value = {
    user,
    loading: status === 'loading',
    login,
    signup,
    logout,
    updateProfile,
    isAdmin,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}