'use client';

import { useAuthStore } from '@/app/store/authStore';
import { AppRoute } from '../../router';
import { useRouter } from 'next/navigation';
import { createContext, ReactNode, useContext, useEffect, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { QueryKeys } from '@/app/lib/reactQuery';
import { UserService } from '@/app/services/userService';
import logger from '@/app/lib/logger';
import { UserProfile } from '@/app/types/user';

/**
 * Application context type definition
 */
interface AppContextType {
  // UI state
  toggleSidePanel: boolean;
  setToggleSidePanel: (toggleSidePanel: boolean) => void;

  // Navigation
  mainView: AppRoute;
  setMainView: (mainView: AppRoute) => void;

  // Authentication
  isAuthenticated: boolean;
  setIsAuthenticated: (isAuthenticated: boolean) => void;
  currentUser: UserProfile | null;
  setCurrentUser: (currentUser: UserProfile | null) => void;

  // Actions
  logout: () => void;
  refreshUserProfile: () => Promise;

  // Route helpers
  shouldShowSidebar: (route: AppRoute) => boolean;
  isPublicRoute: (route: AppRoute) => boolean;
}

/**
 * Application context
 */
const AppContext = createContext<AppContextType | undefined>(undefined);

/**
 * Routes that should NOT display the sidebar
 */
const routesWithoutSidebar = [AppRoute.LOGIN];

/**
 * Routes that do not require authentication
 */
const publicRoutes = [AppRoute.LOGIN, AppRoute.SCHEDULE];

/**
 * Provider component for the app context
 */
interface AppProviderProps {
  children: ReactNode;
}

export function AppProvider({ children }: AppProviderProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [toggleSidePanel, setToggleSidePanel] = useState(true);
  const [mainView, setMainView] = useState<AppRoute>(AppRoute.LOGIN);

  // Get auth state from Zustand store
  const { isAuthenticated: authStoreAuthenticated, currentUser: authStoreUser, logout: authStoreLogout } = useAuthStore();

  // Local state that mirrors Zustand store
  const [isAuthenticated, setIsAuthenticatedState] = useState<boolean>(authStoreAuthenticated);
  const [currentUser, setCurrentUserState] = useState<UserProfile | null>(authStoreUser as UserProfile | null);

  // Sync local state with Zustand store
  useEffect(() => {
    setIsAuthenticatedState(authStoreAuthenticated);
    setCurrentUserState(authStoreUser as UserProfile | null);
  }, [authStoreAuthenticated, authStoreUser]);

  // Logout function
  const logout = () => {
    // Call Zustand store logout
    authStoreLogout();

    // Clear query cache
    queryClient.clear();

    // Navigate to login
    router.push('/login');
  };

  // Set authentication state
  const setIsAuthenticated = (value: boolean) => {
    if (!value) {
      // If setting to false, logout
      logout();
    }
  };

  // Set current user
  const setCurrentUser = (user: UserProfile | null) => {
    if (user) {
      // Update Zustand store
      useAuthStore.setState({ currentUser: user, isAuthenticated: true });
    } else {
      // If clearing user, logout
      logout();
    }
  };

  // Refresh user profile from API
  const refreshUserProfile = async (): Promise => {
    try {
      if (!isAuthenticated) return;

      // Use UserService which will update the Zustand store
      const result = await UserService.getCurrentUser();

      // If error, check if we need to logout
      if (result.error) {
        if (result.status === 401) {
          logout();
        }
      }
    } catch (error) {
      logger.error('Error refreshing user profile:', error);
    }
  };

  // Utility functions
  const shouldShowSidebar = (route: AppRoute): boolean => {
    return !routesWithoutSidebar.includes(route);
  };

  const isPublicRoute = (route: AppRoute): boolean => {
    return publicRoutes.includes(route);
  };

  // Context value
  const value = {
    toggleSidePanel,
    setToggleSidePanel,
    mainView,
    setMainView,
    isAuthenticated,
    setIsAuthenticated,
    currentUser,
    setCurrentUser,
    logout,
    refreshUserProfile,
    shouldShowSidebar,
    isPublicRoute,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

/**
 * Custom hook to access the app context
 */
export function useApp() {
  const context = useContext(AppContext);

  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider');
  }

  return context;
}
