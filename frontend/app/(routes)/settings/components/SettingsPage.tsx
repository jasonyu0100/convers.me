'use client';

import { useApp } from '@/app/components/app/hooks';
import { Button } from '@/app/components/ui/buttons';
import { ArrowRightIcon, BellIcon, ChevronRightIcon, ShieldCheckIcon, UserGroupIcon } from '@heroicons/react/24/outline';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

interface SettingsSectionProps {
  title: string;
  icon: React.ReactNode;
  description?: string;
  actionText?: string;
  actionPath?: string;
  children?: React.ReactNode;
}

const SettingsSection = ({ title, icon, description, actionText, actionPath, children }: SettingsSectionProps) => {
  const router = useRouter();

  return (
    <div className='mb-8 overflow-hidden rounded-xl border border-slate-200/80 bg-white/80 shadow-sm'>
      <div className='border-b border-slate-100 bg-white/80 p-5'>
        <div className='flex items-center justify-between'>
          <div className='flex items-center'>
            <div className='mr-4 rounded-full bg-blue-50/80 p-2.5 text-blue-600'>{icon}</div>
            <div>
              <h2 className='text-lg font-medium text-gray-800'>{title}</h2>
              {description && <p className='mt-0.5 text-sm text-gray-500'>{description}</p>}
            </div>
          </div>
          {actionText && actionPath && (
            <Button
              variant='secondary'
              size='sm'
              onClick={() => router.push(`/settings/${actionPath}`)}
              className='flex items-center gap-1.5 rounded-full border-slate-200 px-4 py-1.5 text-sm font-medium text-gray-700 transition-colors hover:bg-slate-50'
            >
              {actionText}
              <ArrowRightIcon className='h-3.5 w-3.5' />
            </Button>
          )}
        </div>
      </div>
      {children && <div className='p-5'>{children}</div>}
    </div>
  );
};

export function SettingsPage() {
  const router = useRouter();
  const { currentUser } = useApp();

  const [settings, setSettings] = useState({
    profile: {
      name: 'Test User',
      email: 'test@convers.me',
      handle: 'testuser',
      profileImage: '/profile/profile-picture-1.jpg',
    },
    notifications: {
      email: true,
      inApp: true,
    },
  });

  // Status indicator component
  const StatusIndicator = ({ enabled }: { enabled: boolean }) => (
    <div className='flex items-center'>
      <span className={`mr-2 h-2.5 w-2.5 rounded-full ${enabled ? 'bg-green-500' : 'bg-gray-300'}`} />
      <span className={`text-sm ${enabled ? 'text-green-700' : 'text-gray-500'}`}>{enabled ? 'Enabled' : 'Disabled'}</span>
    </div>
  );

  return (
    <div className='space-y-8'>
      <div className='mb-6'>
        <h1 className='text-2xl font-semibold text-gray-800'>General Settings</h1>
        <p className='text-gray-500'>Customize your application experience</p>
      </div>

      <SettingsSection
        title='Notifications'
        icon={<BellIcon className='h-5 w-5' />}
        description='Control how you receive notifications'
        actionText='Manage'
        actionPath='notifications'
      >
        <div className='space-y-4'>
          <div className='flex items-center justify-between rounded-lg border border-gray-100 bg-gray-50/70 p-4'>
            <div>
              <h3 className='font-medium text-gray-800'>Email notifications</h3>
              <p className='text-sm text-gray-500'>Receive updates via email</p>
            </div>
            <StatusIndicator enabled={settings.notifications.email} />
          </div>

          <div className='flex items-center justify-between rounded-lg border border-gray-100 bg-gray-50/70 p-4'>
            <div>
              <h3 className='font-medium text-gray-800'>In-app notifications</h3>
              <p className='text-sm text-gray-500'>Receive updates while using the app</p>
            </div>
            <StatusIndicator enabled={settings.notifications.inApp} />
          </div>
        </div>
      </SettingsSection>

      <SettingsSection
        title='Security'
        icon={<ShieldCheckIcon className='h-5 w-5' />}
        description='Manage your password and account settings'
        actionText='All Security Options'
        actionPath='security'
      >
        <div className='space-y-4'>
          <div
            onClick={() => router.push('/settings/change-password')}
            className='flex cursor-pointer items-center justify-between rounded-lg border border-gray-100 bg-gray-50/70 p-4 transition-all hover:border-gray-200 hover:bg-gray-100/70'
          >
            <div>
              <h3 className='font-medium text-gray-800'>Password</h3>
              <p className='text-sm text-gray-500'>Change your password</p>
            </div>
            <ChevronRightIcon className='h-5 w-5 text-gray-400' />
          </div>

          <Button
            variant='secondary'
            onClick={() => router.push('/settings/security')}
            className='mt-2 flex w-full items-center justify-center gap-2 rounded-lg border-slate-200 py-2.5 font-medium transition-colors hover:bg-slate-50'
          >
            Security Settings
            <ArrowRightIcon className='h-3.5 w-3.5' />
          </Button>
        </div>
      </SettingsSection>

      {currentUser?.isAdmin && (
        <SettingsSection
          title='Administration'
          icon={<UserGroupIcon className='h-5 w-5' />}
          description='Manage users and system operations'
          actionText='Admin Dashboard'
          actionPath='admin'
        >
          <div className='space-y-4'>
            <div className='rounded-lg border border-blue-100 bg-blue-50/50 p-4'>
              <div className='flex items-center gap-2'>
                <div className='rounded-full bg-blue-100 p-1.5'>
                  <svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='currentColor' className='h-4 w-4 text-blue-600'>
                    <path
                      fillRule='evenodd'
                      d='M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12zm8.706-1.442c1.146-.573 2.437.463 2.126 1.706l-.709 2.836.042-.02a.75.75 0 01.67 1.34l-.04.022c-1.147.573-2.438-.463-2.127-1.706l.71-2.836-.042.02a.75.75 0 11-.671-1.34l.041-.022zM12 9a.75.75 0 100-1.5.75.75 0 000 1.5z'
                      clipRule='evenodd'
                    />
                  </svg>
                </div>
                <p className='text-sm font-medium text-blue-700'>You have administrator privileges</p>
              </div>
            </div>

            <Button
              variant='primary'
              onClick={() => router.push('/settings/admin')}
              className='mt-2 flex w-full items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-blue-600 to-blue-500 py-2.5 font-medium text-white transition-all hover:from-blue-700 hover:to-blue-600'
            >
              Access Admin Panel
            </Button>
          </div>
        </SettingsSection>
      )}
    </div>
  );
}
