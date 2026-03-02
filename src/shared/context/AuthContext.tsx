/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useState, useEffect } from 'react';
import { api } from '../services/api';

interface User {
  id: string;
  username: string;
  email?: string;
  is_admin?: boolean;
}



interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  identify: (email: string) => Promise<void>;
  logout: () => void;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

/**
 * Context provider for authentication state and operations.
 */
export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    /**
     * Initializes authentication state by checking for an existing identity.
     */
    const initAuth = async () => {
      const email = sessionStorage.getItem('email');
      if (email) {
        try {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s timeout

          const userRes = await fetch('/api/auth/me', {
            headers: {
              'X-User-Email': email
            },
            signal: controller.signal
          });
          clearTimeout(timeoutId);
          
          if (userRes.ok) {
            const userData = await userRes.json();
            setUser(userData);
          } else {
            sessionStorage.removeItem('email');
            sessionStorage.removeItem('isAdmin');
          }
        } catch (error) {
          console.error('Auth initialization failed', error);
          sessionStorage.removeItem('email');
          sessionStorage.removeItem('isAdmin');
        }
      }
      setLoading(false);
    };

    initAuth();
  }, []);

  /**
   * Identifies a user by email.
   * @param email - The user's email address.
   */
  const identify = async (email: string) => {
    try {
      const data = await api.identify(email);
      if (data && data.email) {
        sessionStorage.setItem('email', data.email);
        sessionStorage.setItem('isAdmin', String(data.isAdmin));
        
        setUser({
          id: data.email,
          username: data.email.split('@')[0],
          email: data.email,
          is_admin: data.isAdmin
        });
      } else {
        throw new Error('Invalid response from identity server.');
      }
    } catch (error: any) {
      console.error('Identification process failed:', error);
      throw error;
    }
  };

  /**
   * Logs out the current user.
   */
  const logout = () => {
    sessionStorage.removeItem('email');
    sessionStorage.removeItem('isAdmin');
    setUser(null);
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center bg-background text-foreground">Loading...</div>;
  }

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: !!user, identify, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
