import { useApp } from '@/app/components/app/hooks';
import { Logo } from '@/app/components/ui';
import React, { useState } from 'react';
import { AuthMode, LoginFormData } from '../../../types/login';
import { GuestRole, createGuestAccount } from '../services/authService';
import { AuthFormButton } from './AuthFormButton';
import { AuthFormError } from './AuthFormError';
import { AuthSignupFields } from './AuthSignupFields';

interface AuthFormProps {
  authMode: AuthMode;
  formData: LoginFormData;
  updateField: (field: keyof LoginFormData, value: string) => void;
  toggleAuthMode: () => void;
  onSubmit: (e: React.FormEvent) => void;
  isLoading: boolean;
  error: string | null;
  onGuestLoginComplete: () => void;
  onGuestCredentials?: (credentials: { email: string; password: string }) => void;
}

export function AuthForm({
  authMode,
  formData,
  updateField,
  toggleAuthMode,
  onSubmit,
  isLoading,
  error,
  onGuestLoginComplete,
  onGuestCredentials,
}: AuthFormProps) {
  const { setCurrentUser } = useApp();
  const isSignupMode = authMode === AuthMode.SIGNUP;

  // Guest login state
  const [showGuestOptions, setShowGuestOptions] = useState(false);
  const [selectedRole, setSelectedRole] = useState<GuestRole>('dev'); // Developer selected by default
  const [guestLoginLoading, setGuestLoginLoading] = useState(false);
  const [guestError, setGuestError] = useState<string | null>(null);
  const [guestCredentials, setGuestCredentials] = useState<{
    email: string;
    password: string;
  } | null>(null);

  const roles: {
    id: GuestRole;
    label: string;
    color: string;
    icon: string;
    description: string;
  }[] = [
    {
      id: 'dev',
      label: 'Developer',
      color: 'bg-blue-100 border-blue-300 hover:bg-blue-200 ring-blue-400',
      icon: '💻',
      description: 'Technical role focused on code implementation and problem-solving',
    },
    {
      id: 'pm',
      label: 'Product Manager',
      color: 'bg-green-100 border-green-300 hover:bg-green-200 ring-green-400',
      icon: '📊',
      description: 'Prioritizes features and coordinates product development',
    },
    {
      id: 'designer',
      label: 'Designer',
      color: 'bg-purple-100 border-purple-300 hover:bg-purple-200 ring-purple-400',
      icon: '🎨',
      description: 'Creates visual and interactive experiences for users',
    },
    {
      id: 'ops',
      label: 'Operations',
      color: 'bg-amber-100 border-amber-300 hover:bg-amber-200 ring-amber-400',
      icon: '🔧',
      description: 'Maintains infrastructure and ensures system reliability',
    },
    {
      id: 'intern',
      label: 'Intern',
      color: 'bg-pink-100 border-pink-300 hover:bg-pink-200 ring-pink-400',
      icon: '🌱',
      description: 'Learning opportunities across different areas of the organization',
    },
    {
      id: 'leadership',
      label: 'Leadership',
      color: 'bg-indigo-100 border-indigo-300 hover:bg-indigo-200 ring-indigo-400',
      icon: '🚀',
      description: 'Strategic direction and oversight for team initiatives and projects',
    },
  ];

  const handleRoleSelect = (role: GuestRole) => {
    setSelectedRole(role);
    setGuestCredentials(null);
    setGuestError(null);
  };

  const toggleGuestOptions = () => {
    setShowGuestOptions(!showGuestOptions);
    setSelectedRole('dev'); // Reset to default developer role
    setGuestCredentials(null);
    setGuestError(null);
  };

  const handleGuestLogin = async () => {
    setGuestLoginLoading(true);
    setGuestError(null);

    try {
      const result = await createGuestAccount(selectedRole);

      if (result.success && result.userData) {
        // Store guest credentials in the global auth store
        const credentials = result.credentials || null;

        // Store credentials to the auth store so they can be accessed globally
        if (credentials) {
          // Import directly to avoid circular dependencies
          import('../../../store/authStore').then(({ useAuthStore }) => {
            useAuthStore.getState().setGuestCredentials(credentials);
          });

          // Immediately proceed to the dashboard
          onGuestLoginComplete();
        }

        // Set the current user
        setCurrentUser(result.userData);
      } else {
        setGuestError(result.error || 'Failed to create guest account');
      }
    } catch (error) {
      console.error('Guest login error:', error);
      setGuestError('An unexpected error occurred');
    } finally {
      setGuestLoginLoading(false);
    }
  };

  return (
    <div className='w-full rounded-2xl border border-slate-200/50 bg-white/70 p-8 shadow-xl backdrop-blur-lg backdrop-saturate-150'>
      <div className='mb-6 text-center'>
        <div className='mb-4 flex justify-center'>
          <Logo size='lg' theme='gray' iconStyle='gradient' className='transition-transform duration-300 hover:scale-105' />
        </div>
      </div>

      <AuthFormError message={error || guestError} />

      {showGuestOptions ? (
        <div className='mb-5 space-y-5'>
          <div className='mb-5 text-center'>
            <h3 className='text-base font-medium text-slate-700'>Select a role to continue as guest</h3>
            <p className='mt-1 text-sm text-slate-500'>Try the platform with a temporary role-based account</p>
          </div>

          <div className='grid grid-cols-3 gap-3'>
            {roles.map((role) => (
              <div key={role.id} className='flex flex-col items-center'>
                <button
                  onClick={() => handleRoleSelect(role.id)}
                  className={`group relative flex h-20 w-20 flex-col items-center justify-center rounded-xl border transition-all ${
                    selectedRole === role.id ? `${role.color} ring-2 ring-offset-1` : 'border-slate-200 bg-white/50 hover:bg-slate-50'
                  }`}
                  disabled={guestLoginLoading}
                >
                  <span className='text-2xl'>{role.icon}</span>
                  <div className='mt-1 text-xs font-medium text-slate-700'>{role.label}</div>
                  {selectedRole === role.id && (
                    <div className='absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-blue-500 text-white'>
                      <svg xmlns='http://www.w3.org/2000/svg' className='h-3 w-3' viewBox='0 0 20 20' fill='currentColor'>
                        <path
                          fillRule='evenodd'
                          d='M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z'
                          clipRule='evenodd'
                        />
                      </svg>
                    </div>
                  )}
                </button>
              </div>
            ))}
          </div>

          <div className='h-12'>
            {selectedRole && (
              <div className='rounded-lg border border-slate-200 bg-slate-50 p-2.5 text-center'>
                <p className='text-xs text-slate-600'>{roles.find((r) => r.id === selectedRole)?.description || ''}</p>
              </div>
            )}
          </div>

          <div className='space-y-3 pt-5'>
            <button
              onClick={handleGuestLogin}
              disabled={guestLoginLoading}
              className={`w-full rounded-xl py-3 text-center font-medium transition-colors ${
                guestLoginLoading
                  ? 'cursor-not-allowed bg-slate-200 text-slate-500'
                  : 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-sm hover:from-emerald-600 hover:to-teal-700 hover:shadow'
              }`}
            >
              {guestLoginLoading ? (
                <span className='flex items-center justify-center'>
                  <svg className='mr-2 -ml-1 h-4 w-4 animate-spin text-white' xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24'>
                    <circle className='opacity-25' cx='12' cy='12' r='10' stroke='currentColor' strokeWidth='4'></circle>
                    <path
                      className='opacity-75'
                      fill='currentColor'
                      d='M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z'
                    ></path>
                  </svg>
                  Creating Account...
                </span>
              ) : (
                `Continue as ${selectedRole ? roles.find((r) => r.id === selectedRole)?.label : 'Guest'}`
              )}
            </button>

            <button
              onClick={toggleGuestOptions}
              className='flex w-full items-center justify-center rounded-xl border border-slate-200 bg-white/80 py-3 text-sm font-medium text-slate-700 transition-all hover:bg-slate-50 disabled:opacity-50'
              disabled={guestLoginLoading}
            >
              <svg xmlns='http://www.w3.org/2000/svg' className='mr-1.5 h-4 w-4' viewBox='0 0 20 20' fill='currentColor'>
                <path
                  fillRule='evenodd'
                  d='M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z'
                  clipRule='evenodd'
                />
              </svg>
              Back to Sign In
            </button>
          </div>
        </div>
      ) : (
        <form onSubmit={onSubmit} className='space-y-5'>
          {isSignupMode && (
            <>
              <AuthSignupFields formData={formData} updateField={updateField} disabled={isLoading} />

              <div className='mb-2 flex justify-start'>
                <button
                  type='button'
                  onClick={toggleAuthMode}
                  className='flex items-center text-sm font-medium text-blue-600 transition-colors hover:text-blue-700'
                  disabled={isLoading}
                >
                  <svg xmlns='http://www.w3.org/2000/svg' className='mr-1 h-4 w-4' viewBox='0 0 20 20' fill='currentColor'>
                    <path
                      fillRule='evenodd'
                      d='M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z'
                      clipRule='evenodd'
                    />
                  </svg>
                  Back to Sign In
                </button>
              </div>
            </>
          )}

          <div className='space-y-2'>
            <label className='block text-sm font-medium text-slate-700' htmlFor='email'>
              Email
            </label>
            <div className='relative'>
              <div className='pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400'>
                <svg xmlns='http://www.w3.org/2000/svg' className='h-5 w-5' viewBox='0 0 20 20' fill='currentColor'>
                  <path d='M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z' />
                  <path d='M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z' />
                </svg>
              </div>
              <input
                id='email'
                type='email'
                value={formData.email}
                onChange={(e) => updateField('email', e.target.value)}
                className='w-full rounded-xl border border-slate-200 bg-white/80 py-3 pr-4 pl-11 shadow-sm transition-all duration-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-400/20 focus:outline-none disabled:opacity-50'
                disabled={isLoading}
                required
                placeholder='you@example.com'
                aria-required='true'
              />
            </div>
          </div>

          <div className='space-y-2'>
            <div className='flex items-center justify-between'>
              <label className='block text-sm font-medium text-slate-700' htmlFor='password'>
                Password
              </label>
              {!isSignupMode && (
                <a href='#' className='text-xs font-medium text-blue-500 transition-colors hover:text-blue-600'>
                  Forgot password?
                </a>
              )}
            </div>
            <div className='relative'>
              <div className='pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400'>
                <svg xmlns='http://www.w3.org/2000/svg' className='h-5 w-5' viewBox='0 0 20 20' fill='currentColor'>
                  <path
                    fillRule='evenodd'
                    d='M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z'
                    clipRule='evenodd'
                  />
                </svg>
              </div>
              <input
                id='password'
                type='password'
                value={formData.password}
                onChange={(e) => updateField('password', e.target.value)}
                className='w-full rounded-xl border border-slate-200 bg-white/80 py-3 pr-4 pl-11 shadow-sm transition-all duration-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-400/20 focus:outline-none disabled:opacity-50'
                disabled={isLoading}
                required
                placeholder='••••••••'
                aria-required='true'
                minLength={6}
              />
            </div>
          </div>

          <div className='pt-3'>
            <AuthFormButton authMode={authMode} isLoading={isLoading} />
          </div>

          {!isSignupMode && (
            <div className='flex flex-col space-y-2'>
              <div className='relative mt-5 mb-2 flex items-center justify-center'>
                <div className='absolute inset-0 flex items-center'>
                  <div className='w-full border-t border-slate-200'></div>
                </div>
                <div className='relative px-4 text-sm'>
                  <span className='px-2 text-slate-500'>Or</span>
                </div>
              </div>

              <button
                type='button'
                onClick={toggleGuestOptions}
                className='w-full rounded-xl border border-emerald-200 bg-gradient-to-r from-emerald-50 to-teal-50 py-3 text-sm font-medium text-emerald-700 shadow-sm transition-all hover:from-emerald-100 hover:to-teal-100'
                disabled={isLoading}
              >
                Try as Guest
              </button>
              <button
                type='button'
                onClick={toggleAuthMode}
                className='w-full rounded-xl border border-blue-200 py-2.5 text-sm font-medium text-blue-600 transition-all hover:bg-blue-50/50 disabled:opacity-50'
                disabled={isLoading}
              >
                Register Now
              </button>
            </div>
          )}
        </form>
      )}
    </div>
  );
}
