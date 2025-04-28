import { GradientBackground } from '@/app/components/ui/backgrounds';
import { Dialog } from '@/app/components/ui/dialog/Dialog';
import { ErrorDisplay } from '@/app/components/ui/errors';
import { PageLoading } from '@/app/components/ui/loading';
import { useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { AuthForm } from './components/AuthForm';
import { useAuthForm } from './hooks';
import { getDestinationUrl } from './utils/redirectHelper';

export function LoginView() {
  const searchParams = useSearchParams();
  const [redirectPath, setRedirectPath] = useState<string | null>(null);
  const [showCredentialsDialog, setShowCredentialsDialog] = useState(false);
  const [guestCredentials, setGuestCredentials] = useState<{ email: string; password: string } | null>(null);

  // Custom form hook with all the authentication logic
  const { authMode, formData, isSignupMode, isLoading: formLoading, error: formError, updateField, toggleAuthMode, handleSubmit } = useAuthForm();

  // Get redirect path from URL query parameters on component mount
  useEffect(() => {
    try {
      const redirectParam = searchParams.get('redirect');
      if (redirectParam) {
        // Store the redirect path to use after successful login
        setRedirectPath(redirectParam);
        console.log('Will redirect to:', getDestinationUrl(redirectParam));
      }
    } catch (err) {
      console.error('Error processing redirect parameter:', err);
    }
  }, [searchParams]);

  // Handle receiving guest credentials
  const handleGuestCredentials = (credentials: { email: string; password: string }) => {
    setGuestCredentials(credentials);
    setShowCredentialsDialog(true);
  };

  // Handle guest login completion - this now happens after the dialog is closed
  const handleGuestLoginComplete = () => {
    // Only redirect if the credentials dialog is not shown
    if (!showCredentialsDialog) {
      // Navigate to home or redirect path
      window.location.href = redirectPath ? getDestinationUrl(redirectPath) : '/';
    }
  };

  // Handle loading state
  if (formLoading) {
    return <PageLoading />;
  }

  // Handle error state (only for critical errors, not form validation errors)
  if (formError && formError.includes('server error')) {
    return <ErrorDisplay error={formError} title='Authentication Error' onRetry={() => window.location.reload()} />;
  }

  return (
    <div className='flex h-full w-full items-center justify-center overflow-hidden bg-white/80'>
      {/* Use the reusable Gradient Background component */}
      <div className='absolute inset-0'>
        <GradientBackground intensity='subtle' color='blue' shapes={true} texture={true} animated={true} />
      </div>

      <div className='relative w-full max-w-md px-5 py-10 sm:px-0' style={{ zIndex: 10 }}>
        <AuthForm
          authMode={authMode}
          formData={formData}
          updateField={updateField}
          toggleAuthMode={toggleAuthMode}
          onSubmit={handleSubmit}
          isLoading={formLoading}
          error={formError}
          onGuestLoginComplete={handleGuestLoginComplete}
          onGuestCredentials={handleGuestCredentials}
        />
      </div>

      {/* Credentials Dialog */}
      <Dialog
        isOpen={showCredentialsDialog && guestCredentials !== null}
        onClose={() => {
          setShowCredentialsDialog(false);
          handleGuestLoginComplete();
        }}
        title='Your Guest Account Information'
        maxWidth='sm'
      >
        <div className='space-y-5 p-2'>
          <div className='rounded-xl border border-green-200 bg-gradient-to-r from-green-50 to-emerald-50 p-5 shadow-sm'>
            <div className='flex items-center'>
              <div className='mr-3 flex h-12 w-12 items-center justify-center rounded-full bg-green-100 text-green-600 shadow-sm'>
                <svg xmlns='http://www.w3.org/2000/svg' className='h-7 w-7' viewBox='0 0 20 20' fill='currentColor'>
                  <path
                    fillRule='evenodd'
                    d='M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z'
                    clipRule='evenodd'
                  />
                </svg>
              </div>
              <h3 className='text-xl font-semibold text-green-800'>Guest Account Created!</h3>
            </div>

            <div className='mt-4 rounded-lg border border-green-200 bg-white/90 p-4 shadow-sm'>
              <p className='mb-3 font-medium text-slate-700'>Save these credentials to log back in later:</p>
              <div className='space-y-3'>
                <div className='flex items-center justify-between rounded-md bg-green-50 p-2'>
                  <span className='font-medium text-slate-700'>Email:</span>
                  <code className='rounded-md bg-green-100 px-3 py-1.5 font-mono text-sm font-bold text-green-800 select-all'>{guestCredentials?.email}</code>
                </div>
                <div className='flex items-center justify-between rounded-md bg-green-50 p-2'>
                  <span className='font-medium text-slate-700'>Password:</span>
                  <code className='rounded-md bg-green-100 px-3 py-1.5 font-mono text-sm font-bold text-green-800 select-all'>
                    {guestCredentials?.password}
                  </code>
                </div>
              </div>
            </div>

            <div className='mt-4 flex items-center rounded-lg bg-yellow-50 p-3 text-yellow-800'>
              <svg xmlns='http://www.w3.org/2000/svg' className='mr-2 h-5 w-5 text-yellow-600' viewBox='0 0 20 20' fill='currentColor'>
                <path
                  fillRule='evenodd'
                  d='M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z'
                  clipRule='evenodd'
                />
              </svg>
              <span className='text-sm font-medium'>Please save these credentials now! They will not be shown again.</span>
            </div>
          </div>

          <button
            onClick={() => {
              setShowCredentialsDialog(false);
              // Now continue to the dashboard
              window.location.href = redirectPath ? getDestinationUrl(redirectPath) : '/';
            }}
            className='w-full rounded-xl bg-gradient-to-r from-blue-500 to-indigo-600 px-4 py-3 text-white shadow-md transition-all hover:from-blue-600 hover:to-indigo-700 hover:shadow-lg'
          >
            <div className='flex items-center justify-center font-medium'>
              <span>Continue to Dashboard</span>
              <svg xmlns='http://www.w3.org/2000/svg' className='ml-2 h-5 w-5' viewBox='0 0 20 20' fill='currentColor'>
                <path
                  fillRule='evenodd'
                  d='M10.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L12.586 11H5a1 1 0 110-2h7.586l-2.293-2.293a1 1 0 010-1.414z'
                  clipRule='evenodd'
                />
              </svg>
            </div>
          </button>
        </div>
      </Dialog>
    </div>
  );
}
