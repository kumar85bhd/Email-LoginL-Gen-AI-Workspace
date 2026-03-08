/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useState, useEffect } from 'react';
import { api } from '../services/api';

interface User {
  id: string;
  username: string;
  email?: string;
  is_admin?: boolean;
  name?: string;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  logout: () => void;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

const SSO_URL = import.meta.env.VITE_SSO_URL;
const SSO_MOCK_MODE = import.meta.env.VITE_SSO_MOCK_MODE === 'true' || !SSO_URL;

/**
 * Context provider for authentication state and operations.
 */
export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    /**
     * Initializes authentication state by checking for an existing identity or SSO token.
     */
    const initAuth = async () => {
      const email = sessionStorage.getItem('email');
      const urlParams = new URLSearchParams(window.location.search);
      const token = urlParams.get('token');

      if (email) {
        // Validate existing session
        try {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s timeout

          const userRes = await fetch('/api/auth/session', {
            headers: {
              'X-User-Email': email
            },
            signal: controller.signal
          });
          clearTimeout(timeoutId);
          
          if (userRes.ok) {
            const userData = await userRes.json();
            setUser({
                id: userData.email,
                username: userData.name || userData.email.split('@')[0],
                email: userData.email,
                is_admin: userData.is_admin,
                name: userData.name
            });
          } else {
            handleLogout();
          }
        } catch (error) {
          console.error('Auth initialization failed', error);
          handleLogout();
        }
      } else if (token) {
        // Authenticate with SSO token
        try {
            const data = await api.authenticate(token);
            if (data && data.email) {
                sessionStorage.setItem('email', data.email);
                sessionStorage.setItem('isAdmin', String(data.isAdmin));
                if (data.name) sessionStorage.setItem('name', data.name);

                setUser({
                    id: data.email,
                    username: data.name || data.email.split('@')[0],
                    email: data.email,
                    is_admin: data.isAdmin,
                    name: data.name
                });

                // Remove token from URL
                const newUrl = window.location.pathname + window.location.hash;
                window.history.replaceState({}, document.title, newUrl);
            } else {
                throw new Error('Invalid response from authentication server.');
            }
        } catch (error) {
            console.error('SSO authentication failed:', error);
            setError('Authentication failed. Please login again.');
            handleLogout();
            setTimeout(() => {
                if (SSO_URL && !SSO_MOCK_MODE) window.location.href = SSO_URL;
            }, 2000);
            setLoading(false);
            return;
        }
      } else {
        if (SSO_MOCK_MODE) {
            // Do nothing, let the component render the mock login screen
            setLoading(false);
            return;
        }
        // No session and no token, redirect to SSO
        if (SSO_URL && !window.location.pathname.startsWith('/logged-out')) {
             window.location.href = `${SSO_URL}?redirect_url=${encodeURIComponent(window.location.href)}`;
             return; // Stop loading state update to prevent flash
        }
      }
      setLoading(false);
    };

    initAuth();
  }, []);

  /**
   * Logs out the current user.
   */
  const handleLogout = () => {
    sessionStorage.removeItem('email');
    sessionStorage.removeItem('isAdmin');
    sessionStorage.removeItem('name');
    setUser(null);
  };

  const logout = () => {
      handleLogout();
      // Redirect to logged out page or SSO login
      window.location.href = '/logged-out';
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center bg-background text-foreground">Loading...</div>;
  }

  if (error) {
      return (
          <div className="min-h-screen flex items-center justify-center bg-background text-foreground">
              <div className="p-6 bg-card rounded-lg shadow-lg text-center">
                  <h2 className="text-xl font-semibold mb-2 text-destructive">Authentication Error</h2>
                  <p>{error}</p>
                  <p className="text-sm text-muted-foreground mt-4">Redirecting to login...</p>
              </div>
          </div>
      );
  }

  if (!user && SSO_MOCK_MODE) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100 font-sans">
            <div className="p-8 bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-700 text-center space-y-6 max-w-md w-full">
                <div>
                    <h2 className="text-2xl font-bold mb-2">Mock Login Mode</h2>
                    <p className="text-slate-500 dark:text-slate-400 text-sm">Select a role to simulate login.</p>
                </div>
                
                <div className="flex flex-col gap-3">
                    <button 
                        onClick={() => window.location.href = '/?token=mock-admin-token'}
                        className="w-full px-4 py-3 bg-indigo-600 text-white font-medium rounded-xl hover:bg-indigo-700 transition-all active:scale-[0.98] shadow-sm hover:shadow-md flex items-center justify-center gap-2"
                    >
                        Login as Admin
                    </button>
                    <button 
                        onClick={() => window.location.href = '/?token=mock-user-token'}
                        className="w-full px-4 py-3 bg-emerald-600 text-white font-medium rounded-xl hover:bg-emerald-700 transition-all active:scale-[0.98] shadow-sm hover:shadow-md flex items-center justify-center gap-2"
                    >
                        Login as User
                    </button>
                </div>

                <div className="pt-4 border-t border-slate-200 dark:border-slate-700">
                    <p className="text-xs text-slate-400 dark:text-slate-500 font-mono">
                        SSO_MOCK_MODE=true
                    </p>
                </div>
            </div>
        </div>
      );
  }

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: !!user, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
