import { LoadingSpinner } from '@/app/components/ui/loading/LoadingSpinner';
import { AuthMode } from '../../../types/login';

interface AuthFormButtonProps {
  authMode: AuthMode;
  isLoading: boolean;
  disabled?: boolean;
}

export function AuthFormButton({ authMode, isLoading, disabled = false }: AuthFormButtonProps) {
  const isSignupMode = authMode === AuthMode.SIGNUP;

  return (
    <button
      type='submit'
      className='group relative w-full overflow-hidden rounded-xl bg-gradient-to-r from-blue-500 to-blue-600 px-5 py-3 font-medium text-white shadow-md transition-all hover:from-blue-600 hover:to-blue-700 hover:shadow-lg focus:ring-4 focus:ring-blue-400/30 focus:outline-none disabled:opacity-80'
      disabled={isLoading || disabled}
    >
      {/* Background animation effect */}
      <div className='absolute inset-0 h-full w-full origin-left translate-x-0 scale-x-0 bg-gradient-to-r from-blue-600/40 via-blue-400/40 to-blue-600/40 transition-transform duration-1000'></div>

      <div className='relative z-10'>
        {isLoading ? (
          <div className='flex items-center justify-center space-x-3'>
            {/* Custom inline spinner that matches our new design */}
            <div className='relative h-5 w-5'>
              <div className='absolute inset-0 rounded-full bg-white/70 opacity-20 blur-sm'></div>
              <svg className='h-5 w-5 animate-spin text-white' xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24'>
                <circle className='opacity-25' cx='12' cy='12' r='10' stroke='currentColor' strokeWidth='4'></circle>
                <path
                  className='opacity-90'
                  fill='currentColor'
                  d='M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z'
                ></path>
              </svg>
            </div>
            <span className='font-medium tracking-wide'>{isSignupMode ? 'Creating Account...' : 'Signing In...'}</span>
          </div>
        ) : (
          <div className='flex items-center justify-center'>
            <span className='tracking-wide'>{isSignupMode ? 'Create Account' : 'Sign In'}</span>
            <svg
              xmlns='http://www.w3.org/2000/svg'
              className='ml-2 h-5 w-5 transition-transform group-hover:translate-x-0.5'
              viewBox='0 0 20 20'
              fill='currentColor'
            >
              <path
                fillRule='evenodd'
                d='M10.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L12.586 11H5a1 1 0 110-2h7.586l-2.293-2.293a1 1 0 010-1.414z'
                clipRule='evenodd'
              />
            </svg>
          </div>
        )}
      </div>
    </button>
  );
}
