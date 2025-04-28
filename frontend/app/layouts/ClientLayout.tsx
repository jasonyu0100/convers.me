'use client';

import { QueryClientProvider } from '@tanstack/react-query';
import clsx, { ClassValue } from 'clsx';
import dynamic from 'next/dynamic';
import { ReactNode, useEffect, useState } from 'react';
import { twMerge } from 'tailwind-merge';
import { AppProvider } from '../components/app/hooks/useAppWithZustand';
import { Dialog } from '../components/ui/dialog/Dialog';
import { GuestCredentialsDialog } from '../components/ui/dialog/GuestCredentialsDialog';
import { ErrorBoundary } from '../components/ui/error/ErrorBoundary';
import { fontVariables } from '../font/main';
import { checkAndInitializeAuth } from '../lib/authInit';
import logger from '../lib/logger';
import { createQueryClient } from '../lib/reactQuery';

// Dynamically import SentryErrorBoundary to avoid SSR issues
const SentryErrorBoundary = dynamic(() => import('../components/ui/error/SentryErrorBoundary'), { ssr: false });

// Initialize auth store from localStorage if token exists
checkAndInitializeAuth();

/**
 * Client-side layout wrapper
 * Provides the AppContext, React Query, and Error Boundary to all pages
 */
export function ClientLayout({ children }: { children: ReactNode }) {
  // Create React Query client with our standard configuration
  const [queryClient] = useState(() => createQueryClient());

  // State for guest credentials dialog
  const [showGuestCredentialsDialog, setShowGuestCredentialsDialog] = useState(false);
  const [guestCredentials, setGuestCredentials] = useState<{ email: string; password: string } | null>(null);

  // Load user data once after initialization and check for guest credentials
  useEffect(() => {
    // Import directly here to avoid circular dependencies in module loading
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('auth_token');

      // Check for guest credentials in store
      import('../store/authStore').then(({ useAuthStore }) => {
        const state = useAuthStore.getState();
        if (state.guestCredentials) {
          setGuestCredentials(state.guestCredentials);
          setShowGuestCredentialsDialog(true);
          // Clear credentials after showing them once
          setTimeout(() => {
            useAuthStore.getState().setGuestCredentials(null);
          }, 1000);
        }
      });

      // Fetch user data if we have a token
      if (token) {
        import('../services/userService').then(({ UserService }) => {
          // Wait a short time to ensure all initialization is complete
          setTimeout(() => {
            UserService.getCurrentUser().catch((err) => logger.error('Error fetching initial user data:', err));
          }, 500);
        });
      }
    }
  }, []);

  function combineClasses(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
  }

  // Handle closing the guest credentials dialog
  const handleCloseGuestDialog = () => {
    setShowGuestCredentialsDialog(false);
  };

  // Function to detect if current device is mobile
  const isMobileDevice = () => {
    if (typeof window === 'undefined') return false;
    return window.innerWidth < 768 || /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  };

  // State to track if using mobile device
  const [isMobile, setIsMobile] = useState(false);

  // Check for mobile device on mount and determine if we should show the disclaimer
  useEffect(() => {
    const mobile = isMobileDevice();
    setIsMobile(mobile);

    // Update on resize
    const handleResize = () => {
      setIsMobile(isMobileDevice());
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <div className={combineClasses('h-screen', fontVariables)}>
      <SentryErrorBoundary>
        <ErrorBoundary
          onError={(error) => {
            logger.error('Root error boundary caught an error:', error);
          }}
        >
          <QueryClientProvider client={queryClient}>
            <AppProvider>{children}</AppProvider>

            {/* Mobile Access Restriction Modal */}
            {isMobile &&
              typeof window !== 'undefined' &&
              (() => {
                // Paths exempt from mobile restriction modal
                const currentPath = window.location.pathname;
                const isExemptPath = currentPath === '/' || currentPath === '/login' || currentPath.startsWith('/about');

                return !isExemptPath ? (
                  <Dialog isOpen={true} onClose={() => {}} title='Mobile Access' maxWidth='md' showCloseButton={false}>
                    <div className='p-4'>
                      <h3 className='mb-3 text-center text-lg font-semibold'>Mobile Access Limited</h3>
                      <p className='mb-4 text-sm text-gray-600'>
                        Full app functionality is currently only available on desktop devices. Mobile users can sign up or register as a guest.
                      </p>
                      <div className='flex justify-center space-x-3'>
                        <a href='/login' className='rounded-md bg-blue-600 px-4 py-2 text-sm text-white'>
                          Sign Up / Login
                        </a>
                      </div>
                    </div>
                  </Dialog>
                ) : null;
              })()}

            {/* Guest Credentials Dialog */}
            <GuestCredentialsDialog
              isOpen={showGuestCredentialsDialog && guestCredentials !== null}
              onClose={handleCloseGuestDialog}
              credentials={guestCredentials}
            />
          </QueryClientProvider>
        </ErrorBoundary>
      </SentryErrorBoundary>
    </div>
  );
}
