'use client';

import { useApp } from '@/app/components/app/hooks';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { LoadingSpinner } from '../ui/loading/LoadingSpinner';
import { AuthService } from './AuthService';
import { AuthRedirectProps } from './types';

/**
 * Component that handles auth-based redirects
 * Used for root page or conditional redirection based on auth state
 */
export function AuthRedirect({ redirectAuthenticatedTo = '/feed', redirectUnauthenticatedTo = '/login' }: AuthRedirectProps) {
  const app = useApp();
  const router = useRouter();
  const [message, setMessage] = useState<string>('Checking authentication...');
  const isMounted = useRef(true);

  // Set up cleanup for component unmount
  useEffect(() => {
    return () => {
      // Mark component as unmounted for cleanup
      isMounted.current = false;
    };
  }, []);

  useEffect(() => {
    // First, check localStorage directly for the fastest possible response
    const isAuthenticated = AuthService.isAuthenticated();

    // Normal authentication flow
    if (isAuthenticated) {
      const userData = AuthService.getUser();

      // First synchronize state if needed
      if (!app.isAuthenticated && userData) {
        app.setCurrentUser(userData);
      }

      // Set message and schedule single redirect
      const userFirstName = userData?.fname || 'user';
      // Sanitize displayed name by trimming and limiting length
      const displayName = userFirstName.trim().substring(0, 20);
      setMessage(`Logged in as ${displayName}, redirecting...`);

      // Skip the timeout for faster login experience
      if (isMounted.current) {
        console.log('Redirecting authenticated user to:', redirectAuthenticatedTo);
        // Validate redirect path for security
        const safePath = redirectAuthenticatedTo.startsWith('/') ? redirectAuthenticatedTo : '/';

        // Force a hard navigation to break out of any potential state issues
        window.location.href = safePath;
      }

      // No timer to clean up in this case
      return () => {};
    } else {
      // Not authenticated case - only update context if needed
      if (app.isAuthenticated) {
        app.setIsAuthenticated(false);
      }

      // Set message and redirect
      setMessage('Not logged in, redirecting to login...');

      // Skip the timeout for faster login experience
      if (isMounted.current) {
        console.log('Redirecting unauthenticated user to:', redirectUnauthenticatedTo);
        // Validate redirect path for security
        const safePath = redirectUnauthenticatedTo.startsWith('/') ? redirectUnauthenticatedTo : '/login';

        // Force a hard navigation to break out of any potential state issues
        window.location.href = safePath;
      }

      // No timer to clean up in this case
      return () => {};
    }
  }, [app, redirectAuthenticatedTo, redirectUnauthenticatedTo, router]);

  return <LoadingSpinner size='lg' text={message} fullScreen />;
}
