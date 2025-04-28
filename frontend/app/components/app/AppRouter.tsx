'use client';

import { useApp } from '@/app/components/app/hooks';
import { AppRoute, AppRouterProps, RouteUtils } from '@/app/components/router';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { AuthService } from '../auth/AuthService';
import { AppSideBarView } from '../side-bar';
import { AppSidePanelView } from '../side-panel';
import { LoadingSpinner } from '../ui/loading/LoadingSpinner';
import { PageTransition } from '../ui/transitions/PageTransition';
import { AppContainer } from './AppContainer';
import { AppWindow } from './AppWindow';

/**
 * Main application router that handles authentication and layout
 */
export function AppRouter({ children, routeType }: AppRouterProps) {
  const app = useApp();
  const router = useRouter();

  // Auth and redirect state
  const [isChecking, setIsChecking] = useState(true);
  const [isRedirecting, setIsRedirecting] = useState(false);
  const [redirectMessage, setRedirectMessage] = useState<string | null>(null);

  // Handle route changes and authentication checks
  useEffect(() => {
    // Set the current view in app context
    app.setMainView(routeType);

    try {
      // Fast check for authentication first using AuthService directly
      const isAuthenticatedNow = AuthService.isAuthenticated();
      const isPublic = RouteUtils.isPublicRoute(routeType);

      // Check if we need to redirect based on route and auth
      if (!isPublic && !isAuthenticatedNow) {
        // Protected route but user is not authenticated
        setIsRedirecting(true);
        setRedirectMessage('Redirecting to login...');

        // Store the intended destination for redirect back after login
        const redirectUrl = `/login?redirect=${encodeURIComponent(window.location.pathname)}`;

        const timer = setTimeout(() => {
          router.replace(redirectUrl);
        }, 800);

        return () => clearTimeout(timer);
      } else if (routeType === AppRoute.LOGIN && isAuthenticatedNow) {
        // Login route but user is already authenticated
        setIsRedirecting(true);
        setRedirectMessage('Redirecting to home...');

        const timer = setTimeout(() => {
          router.replace('/feed');
        }, 800);

        return () => clearTimeout(timer);
      } else {
        // No redirect needed, ensure app context is in sync with localStorage
        if (isAuthenticatedNow && !app.isAuthenticated) {
          // Update app context if localStorage indicates we're logged in
          const userData = AuthService.getUser();
          if (userData) {
            app.setCurrentUser(userData);
          }
        }

        // Show content
        setIsChecking(false);
      }
    } catch (error) {
      // Handle any errors that might occur during authentication checks
      console.error('Authentication check error:', error);

      // Fallback to showing the content if we can't determine auth status
      setIsChecking(false);
    }
  }, [app, router, routeType]);

  // Show loading indicator while checking auth or redirecting
  if (isChecking || isRedirecting) {
    return <LoadingSpinner size='lg' text={redirectMessage || 'Loading...'} fullScreen />;
  }

  // Determine if sidebar should be displayed
  const showSidebar = RouteUtils.shouldShowSidebar(routeType);

  // Function to detect if current device is mobile
  const isMobileDevice = () => {
    if (typeof window === 'undefined') return false;
    return window.innerWidth < 768 || /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  };

  // Check if route is exempt from mobile restrictions
  const isMobile = isMobileDevice();
  const isLoginPage = routeType === AppRoute.LOGIN;
  const isRootPage = window.location.pathname === '/';
  const isBlogPage = window.location.pathname.startsWith('/about');
  const isCustomersPage = window.location.pathname.startsWith('/customers');

  // Allow access if not mobile or an exempt route
  const allowAccess = !isMobile || isLoginPage || isRootPage || isBlogPage || isCustomersPage || RouteUtils.isPublicRoute(routeType);

  return (
    <AppContainer>
      {showSidebar && allowAccess && <AppSideBarView />}
      {showSidebar && app.toggleSidePanel && allowAccess && <AppSidePanelView />}
      <AppWindow>
        <PageTransition key={routeType} duration={300}>
          {allowAccess ? (
            children
          ) : (
            <div className='flex h-full items-center justify-center'>
              <div className='max-w-md p-6 text-center'>
                <h2 className='mb-4 text-2xl font-bold'>Mobile Access Limited</h2>
                <p className='mb-6'>Full app functionality is available only on desktop devices. Please use a desktop browser or visit our login page.</p>
                <a href='/login' className='inline-block rounded-md bg-blue-600 px-6 py-3 text-white'>
                  Go to Login
                </a>
              </div>
            </div>
          )}
        </PageTransition>
      </AppWindow>
    </AppContainer>
  );
}
