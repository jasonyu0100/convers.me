'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { AuthService } from './components/auth/AuthService';
import { PageLoading } from './components/ui';
import { LandingPage } from './landing/LandingPage';

/**
 * Root index route that shows landing page to unauthenticated users
 * and redirects authenticated users to the feed
 */
export default function RootIndexPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    // Check authentication status
    const authStatus = AuthService.isAuthenticated();
    setIsAuthenticated(authStatus);

    // If authenticated, redirect to feed
    if (authStatus) {
      router.replace('/feed');
    }

    setIsLoading(false);
  }, [router]);

  // Show loading state
  if (isLoading) {
    return <PageLoading />;
  }

  // Show landing page for unauthenticated users
  return !isAuthenticated ? <LandingPage /> : null;
}
