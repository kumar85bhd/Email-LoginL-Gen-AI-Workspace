import { AppData, AppMetric, CategoryData } from '../types';

const getAuthHeaders = () => {
  const email = sessionStorage.getItem('email');
  if (!email) {
      throw new Error("No active session: Missing user email");
  }
  return {
    'Content-Type': 'application/json',
    'X-User-Email': email
  };
};

/**
 * API service for handling backend interactions.
 */
export const api = {
  /**
   * Authenticates a user via SSO token.
   * @param token - The SSO token.
   * @returns A promise resolving to the user data.
   */
  authenticate: async (token: string): Promise<{email: string, isAdmin: boolean, name: string}> => {
    try {
      const res = await fetch(`/api/authenticate?token=${encodeURIComponent(token)}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (res.ok) {
        return res.json();
      } else {
        const errorData = await res.json().catch(() => ({ detail: 'Unknown error' }));
        throw new Error(errorData.detail || `Authentication failed with status ${res.status}`);
      }
    } catch (error: any) {
      console.error('Authentication error:', error);
      throw error;
    }
  },

  /**
   * Retrieves the application configuration.
   * @returns A promise resolving to the configuration object.
   */
  getConfig: async (): Promise<{ cardsPerRow: number }> => {
    return { cardsPerRow: 4 };
  },

  /**
   * Retrieves all workspace applications.
   * @returns A promise resolving to the list of apps and their live status.
   */
  getApps: async (): Promise<{ data: AppData[], isLive: boolean }> => {
    try {
      const res = await fetch('/api/workspace/apps', {
        headers: getAuthHeaders()
      });
      if (res.ok) {
        const data = await res.json();
        return { data, isLive: true };
      }
      return { data: [], isLive: false };
    } catch (error) {
      console.error('Failed to fetch apps', error);
      return { data: [], isLive: false };
    }
  },

  /**
   * Retrieves all workspace categories.
   * @returns A promise resolving to the list of categories.
   */
  getCategories: async (): Promise<CategoryData[]> => {
    try {
      const res = await fetch('/api/workspace/categories', {
        headers: getAuthHeaders()
      });
      if (res.ok) {
        return await res.json();
      }
      return [];
    } catch (error) {
      console.error('Failed to fetch categories', error);
      return [];
    }
  },

  /**
   * Retrieves metrics for a specific application.
   * @param id - The ID of the application.
   * @returns A promise resolving to the application metrics.
   */
  getMetrics: async (_id: number | string): Promise<{ data: AppMetric }> => {
    // Mock metrics for now
    return {
      data: {
        name: 'Efficiency Score',
        value: '94/100',
        trend: 'up'
      }
    };
  },

  /**
   * Retrieves user preferences from local storage.
   * @returns A promise resolving to the user preferences.
   */
  getPreferences: async (): Promise<{ theme: string, favorites: number[] } | null> => {
    const theme = localStorage.getItem('theme') || 'dark';
    const favorites = JSON.parse(localStorage.getItem('favorites') || '[]');
    return { theme, favorites };
  },

  /**
   * Updates the user's theme preference.
   * @param theme - The theme to set (e.g., 'light' or 'dark').
   */
  updateTheme: async (theme: string): Promise<void> => {
    localStorage.setItem('theme', theme);
  },

  /**
   * Updates the user's favorite applications.
   * @param favorites - The list of favorite application IDs.
   */
  updateFavorites: async (favorites: number[]): Promise<void> => {
    localStorage.setItem('favorites', JSON.stringify(favorites));
  },

  /**
   * Increments the launch count for a specific application.
   * @param id - The ID of the application.
   */
  launchApp: async (id: number): Promise<void> => {
    try {
      await fetch(`/api/workspace/apps/${id}/launch`, {
        method: 'POST',
        headers: getAuthHeaders()
      });
    } catch (error) {
      console.error('Failed to record app launch', error);
    }
  },
};
