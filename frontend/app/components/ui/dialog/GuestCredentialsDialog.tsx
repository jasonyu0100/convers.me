'use client';

import { Dialog } from './Dialog';

interface GuestCredentialsDialogProps {
  isOpen: boolean;
  onClose: () => void;
  credentials: { email: string; password: string } | null;
}

export function GuestCredentialsDialog({ isOpen, onClose, credentials }: GuestCredentialsDialogProps) {
  if (!credentials) return null;

  return (
    <Dialog isOpen={isOpen} onClose={onClose} maxWidth='md' showCloseButton={false} variant='borderless'>
      <div className='overflow-hidden rounded-2xl bg-white/80 backdrop-blur-sm'>
        {/* Success banner at top */}
        <div className='bg-gradient-to-r from-emerald-500 to-teal-600 px-6 py-4 text-white'>
          <div className='flex items-center'>
            <div className='mr-3 flex h-10 w-10 items-center justify-center rounded-full bg-white/20 backdrop-blur-sm'>
              <svg
                xmlns='http://www.w3.org/2000/svg'
                className='h-6 w-6'
                viewBox='0 0 24 24'
                fill='none'
                stroke='currentColor'
                strokeWidth='2'
                strokeLinecap='round'
                strokeLinejoin='round'
              >
                <polyline points='20 6 9 17 4 12'></polyline>
              </svg>
            </div>
            <h3 className='text-xl font-bold'>Your Guest Account Is Ready</h3>
          </div>
        </div>

        {/* Main content area */}
        <div className='px-6 py-4'>
          <div className='mb-4'>
            <h4 className='text-base font-medium text-slate-700'>Please save these credentials</h4>
            <p className='text-sm text-slate-500'>You'll need this information to log back into your account later.</p>
          </div>

          {/* Credentials card */}
          <div className='mb-5 space-y-3'>
            {/* Email container */}
            <div>
              <div className='mb-1 flex items-center justify-between'>
                <span className='text-xs font-medium text-slate-500'>EMAIL</span>
                <span className='text-xs text-slate-400'>Click to copy</span>
              </div>
              <div
                className='cursor-pointer rounded-lg bg-slate-50 p-3 font-mono text-sm text-slate-800 transition-colors select-all hover:bg-slate-100'
                onClick={() => {
                  if (credentials?.email) {
                    navigator.clipboard.writeText(credentials.email);
                  }
                }}
              >
                {credentials.email}
              </div>
            </div>

            {/* Password container */}
            <div>
              <div className='mb-1 flex items-center justify-between'>
                <span className='text-xs font-medium text-slate-500'>PASSWORD</span>
                <span className='text-xs text-slate-400'>Click to copy</span>
              </div>
              <div
                className='cursor-pointer rounded-lg bg-slate-50 p-3 font-mono text-sm text-slate-800 transition-colors select-all hover:bg-slate-100'
                onClick={() => {
                  if (credentials?.password) {
                    navigator.clipboard.writeText(credentials.password);
                  }
                }}
              >
                {credentials.password}
              </div>
            </div>
          </div>

          {/* Warning note */}
          <div className='mb-5 flex items-center text-amber-700'>
            <svg
              xmlns='http://www.w3.org/2000/svg'
              className='mr-2 h-4 w-4 flex-shrink-0'
              viewBox='0 0 24 24'
              fill='none'
              stroke='currentColor'
              strokeWidth='2'
              strokeLinecap='round'
              strokeLinejoin='round'
            >
              <circle cx='12' cy='12' r='10'></circle>
              <line x1='12' y1='8' x2='12' y2='12'></line>
              <line x1='12' y1='16' x2='12.01' y2='16'></line>
            </svg>
            <span className='text-xs'>These credentials will only be shown once</span>
          </div>

          {/* Button row */}
          <div className='flex items-center justify-end'>
            <button onClick={onClose} className='rounded-md bg-emerald-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-emerald-700'>
              Continue to Dashboard
            </button>
          </div>
        </div>
      </div>
    </Dialog>
  );
}
