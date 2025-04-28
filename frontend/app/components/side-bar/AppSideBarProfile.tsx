'use client';

import { useApp } from '@/app/components/app/hooks';
import { AppRoute } from '@/app/components/router';
import { ArrowRightOnRectangleIcon } from '@heroicons/react/24/outline';
import { useRouter } from 'next/navigation';
import { SideBarButton } from './AppSideBar';
import { AppSideBarProfileProps } from './types';

/**
 * Profile section for the sidebar
 * Handles displaying the profile button and logout button for authenticated users
 * or login button for unauthenticated users
 */
export function AppSideBarProfile({ className = '' }: AppSideBarProfileProps) {
  const app = useApp();
  const router = useRouter();

  /**
   * Handles user logout action
   */
  const handleLogout = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();

    // Update app state and clear localStorage
    app.setMainView(AppRoute.LOGIN);
    app.setIsAuthenticated(false);

    // Redirect to login page
    router.replace('/login');
  };

  /**
   * Handles navigation to profile
   */
  const handleProfileClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();

    app.setMainView(AppRoute.PROFILE);
    router.push('/profile');
  };

  /**
   * Handles login action
   */
  const handleLogin = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();

    app.setMainView(AppRoute.LOGIN);
    router.push('/login');
  };

  // Show different buttons based on authentication state
  if (!app.isAuthenticated) {
    return (
      <div className={className}>
        <SideBarButton onClick={handleLogin} label='Login' title='Sign in to your account'>
          <ArrowRightOnRectangleIcon className='size-6' />
        </SideBarButton>
      </div>
    );
  }

  // Show authenticated user options
  return (
    <div className={`flex flex-col space-y-4 ${className}`}>
      <SideBarButton onClick={handleLogout} label='Logout' title='Sign out of your account'>
        <ArrowRightOnRectangleIcon className='size-6' />
      </SideBarButton>
    </div>
  );
}
