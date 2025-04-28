'use client';

import { Button } from '@/app/components/ui/buttons';
import { LoadingSpinner } from '@/app/components/ui/loading';
import { ApiClient } from '@/app/services/api';
import { SettingsService } from '@/app/services/settingsService';
import { DeviceTabletIcon, ExclamationTriangleIcon, KeyIcon, LockClosedIcon, ShieldCheckIcon } from '@heroicons/react/24/outline';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export function SecurityPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [securitySettings, setSecuritySettings] = useState({
    twoFactorEnabled: false,
    privacyMode: true,
    sessionTimeout: 'medium', // 'low', 'medium', 'high'
    additionalSettings: {}, // To store all additional settings from API
    browserSessions: [
      {
        id: '1',
        device: 'Chrome on MacBook Pro',
        lastActive: '2 hours ago',
        current: true,
      },
      {
        id: '2',
        device: 'Safari on iPhone',
        lastActive: '1 day ago',
        current: false,
      },
    ],
  });

  // Fetch security settings
  useEffect(() => {
    const fetchSecuritySettings = async () => {
      setIsLoading(true);

      try {
        // Use preferences endpoint to get security-related settings
        const result = await SettingsService.getPreferences();

        if (result.data) {
          // Extract security settings from preferences
          const additionalSettings = result.data.additionalSettings || {};

          setSecuritySettings({
            ...securitySettings,
            twoFactorEnabled: additionalSettings.twoFactorEnabled || false,
            privacyMode: additionalSettings.privacyMode !== false,
            sessionTimeout: additionalSettings.sessionTimeout || 'medium',
            additionalSettings: additionalSettings,
          });
        }
      } catch (error) {
        console.error('Failed to fetch security settings', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchSecuritySettings();
  }, []);

  const [saveMessage, setSaveMessage] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);

  const toggleSetting = async (setting: string) => {
    const newValue = !securitySettings[setting as keyof typeof securitySettings];

    // Update local state immediately for responsive UI
    setSecuritySettings({
      ...securitySettings,
      [setting]: newValue,
    });

    setSaveMessage(null);

    try {
      // Save to backend by updating preferences
      // Make sure we use snake_case for the backend API
      const updateData = {
        additional_settings: {
          ...(securitySettings.additionalSettings || {}),
          [setting]: newValue,
        },
      };

      const result = await SettingsService.updatePreferences(updateData);

      if (result.error) {
        throw new Error(result.error);
      }

      setSaveMessage({
        type: 'success',
        text: 'Security setting updated successfully',
      });

      // Auto-hide the message after 3 seconds
      setTimeout(() => setSaveMessage(null), 3000);
    } catch (error) {
      console.error(`Failed to update ${setting}:`, error);
      setSaveMessage({
        type: 'error',
        text: `Failed to update security setting. Please try again.`,
      });
    }
  };

  const updateSessionTimeout = async (value: string) => {
    setSecuritySettings({
      ...securitySettings,
      sessionTimeout: value,
    });

    setSaveMessage(null);

    try {
      // Save to backend by updating preferences using snake_case
      const updateData = {
        additional_settings: {
          ...(securitySettings.additionalSettings || {}),
          sessionTimeout: value,
        },
      };

      const result = await SettingsService.updatePreferences(updateData);

      if (result.error) {
        throw new Error(result.error);
      }

      setSaveMessage({
        type: 'success',
        text: 'Session timeout updated successfully',
      });

      // Auto-hide the message after 3 seconds
      setTimeout(() => setSaveMessage(null), 3000);
    } catch (error) {
      console.error('Failed to update session timeout:', error);
      setSaveMessage({
        type: 'error',
        text: 'Failed to update session timeout. Please try again.',
      });
    }
  };

  const revokeSession = async (sessionId: string) => {
    setSaveMessage(null);

    try {
      // In a real implementation, we would call a dedicated API endpoint
      // For now, we'll mock an API call
      const result = await ApiClient.post('/settings/sessions/revoke', {
        sessionId,
      });

      if (result.error) {
        throw new Error(result.error);
      }

      // Filter out the revoked session
      const updatedSessions = securitySettings.browserSessions.filter((session) => session.id !== sessionId);

      setSecuritySettings({
        ...securitySettings,
        browserSessions: updatedSessions,
      });

      setSaveMessage({
        type: 'success',
        text: 'Session revoked successfully',
      });

      // Auto-hide the message after 3 seconds
      setTimeout(() => setSaveMessage(null), 3000);
    } catch (error) {
      console.error('Failed to revoke session:', error);
      setSaveMessage({
        type: 'error',
        text: 'Failed to revoke session. Please try again.',
      });
    }
  };

  if (isLoading) {
    return (
      <div className='flex h-64 items-center justify-center'>
        <LoadingSpinner size='lg' />
      </div>
    );
  }

  return (
    <div className='space-y-6'>
      <div className='mb-4 flex items-center justify-between'>
        <div className='flex items-center'>
          <ShieldCheckIcon className='mr-2 h-6 w-6 text-gray-500' />
          <h1 className='text-xl font-semibold'>Security & Privacy</h1>
        </div>
      </div>

      {saveMessage && (
        <div
          className={`mb-6 rounded-md p-3 ${
            saveMessage.type === 'success' ? 'border border-green-200 bg-green-50 text-green-800' : 'border border-red-200 bg-red-50 text-red-800'
          }`}
        >
          {saveMessage.type === 'success' ? (
            <div className='flex items-center'>
              <svg className='mr-2 h-5 w-5 text-green-500' fill='none' viewBox='0 0 24 24' stroke='currentColor'>
                <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M5 13l4 4L19 7' />
              </svg>
              <span>{saveMessage.text}</span>
            </div>
          ) : (
            <div className='flex items-center'>
              <svg className='mr-2 h-5 w-5 text-red-500' fill='none' viewBox='0 0 24 24' stroke='currentColor'>
                <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M6 18L18 6M6 6l12 12' />
              </svg>
              <span>{saveMessage.text}</span>
            </div>
          )}
        </div>
      )}

      <div className='mb-8 rounded-lg border border-slate-200 bg-white/80 p-6 backdrop-blur-sm'>
        <section className='mb-8'>
          <div className='mb-4 flex items-center'>
            <KeyIcon className='mr-2 h-5 w-5 text-gray-500' />
            <h2 className='text-lg font-medium'>Password Management</h2>
          </div>

          <div className='rounded-md border border-gray-200 p-4'>
            <p className='mb-4 text-sm text-gray-600'>It's a good idea to use a strong password that you don't use elsewhere and to change it periodically.</p>
            <div className='flex items-center justify-between'>
              <div>
                <p className='text-sm text-gray-500'>Last changed: 2 months ago</p>
                <p className='text-xs text-gray-400'>We recommend changing your password every 90 days</p>
              </div>
              <Button variant='primary' onClick={() => router.push('/settings/change-password')}>
                Change Password
              </Button>
            </div>
          </div>
        </section>

        <section className='mb-8'>
          <div className='mb-4 flex items-center'>
            <LockClosedIcon className='mr-2 h-5 w-5 text-gray-500' />
            <h2 className='text-lg font-medium'>Security Settings</h2>
          </div>

          <div className='space-y-4'>
            <div className='flex items-center justify-between rounded-md border border-gray-200 p-4'>
              <div>
                <h3 className='text-sm font-medium'>Two-Factor Authentication</h3>
                <p className='text-xs text-gray-500'>Add an extra layer of security to your account</p>
              </div>
              <div className='relative inline-flex cursor-pointer items-center'>
                <input
                  type='checkbox'
                  className='peer sr-only'
                  checked={securitySettings.twoFactorEnabled}
                  onChange={() => toggleSetting('twoFactorEnabled')}
                  id='2fa-toggle'
                />
                <div className="peer h-6 w-11 rounded-full bg-gray-200 peer-checked:bg-blue-600 after:absolute after:start-[2px] after:top-0.5 after:h-5 after:w-5 after:rounded-full after:border after:border-gray-300 after:bg-white/80 after:transition-all after:content-[''] peer-checked:after:translate-x-full peer-checked:after:border-white"></div>
              </div>
            </div>

            <div className='flex items-center justify-between rounded-md border border-gray-200 p-4'>
              <div>
                <h3 className='text-sm font-medium'>Privacy Mode</h3>
                <p className='text-xs text-gray-500'>Hide sensitive information when others might see your screen</p>
              </div>
              <div className='relative inline-flex cursor-pointer items-center'>
                <input
                  type='checkbox'
                  className='peer sr-only'
                  checked={securitySettings.privacyMode}
                  onChange={() => toggleSetting('privacyMode')}
                  id='privacy-toggle'
                />
                <div className="peer h-6 w-11 rounded-full bg-gray-200 peer-checked:bg-blue-600 after:absolute after:start-[2px] after:top-0.5 after:h-5 after:w-5 after:rounded-full after:border after:border-gray-300 after:bg-white/80 after:transition-all after:content-[''] peer-checked:after:translate-x-full peer-checked:after:border-white"></div>
              </div>
            </div>

            <div className='rounded-md border border-gray-200 p-4'>
              <div className='mb-2'>
                <h3 className='text-sm font-medium'>Session Timeout</h3>
                <p className='text-xs text-gray-500'>Control how long before you're automatically logged out</p>
              </div>
              <div className='flex space-x-4'>
                <button
                  onClick={() => updateSessionTimeout('low')}
                  className={`rounded-full px-3 py-1 text-xs ${
                    securitySettings.sessionTimeout === 'low' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700'
                  }`}
                >
                  Extended (7 days)
                </button>
                <button
                  onClick={() => updateSessionTimeout('medium')}
                  className={`rounded-full px-3 py-1 text-xs ${
                    securitySettings.sessionTimeout === 'medium' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700'
                  }`}
                >
                  Standard (24 hours)
                </button>
                <button
                  onClick={() => updateSessionTimeout('high')}
                  className={`rounded-full px-3 py-1 text-xs ${
                    securitySettings.sessionTimeout === 'high' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700'
                  }`}
                >
                  Strict (1 hour)
                </button>
              </div>
            </div>
          </div>
        </section>

        <section className='mb-8'>
          <div className='mb-4 flex items-center'>
            <DeviceTabletIcon className='mr-2 h-5 w-5 text-gray-500' />
            <h2 className='text-lg font-medium'>Active Sessions</h2>
          </div>

          <div className='overflow-hidden rounded-md border border-gray-200'>
            <table className='min-w-full divide-y divide-gray-200'>
              <thead className='bg-gray-50'>
                <tr>
                  <th scope='col' className='px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase'>
                    Device
                  </th>
                  <th scope='col' className='px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase'>
                    Last Active
                  </th>
                  <th scope='col' className='px-6 py-3 text-right text-xs font-medium tracking-wider text-gray-500 uppercase'>
                    Action
                  </th>
                </tr>
              </thead>
              <tbody className='divide-y divide-gray-200 bg-white'>
                {securitySettings.browserSessions.map((session) => (
                  <tr key={session.id}>
                    <td className='px-6 py-4 text-sm whitespace-nowrap'>
                      <div className='flex items-center'>
                        {session.device}
                        {session.current && (
                          <span className='ml-2 inline-flex rounded-full bg-green-100 px-2 text-xs leading-5 font-semibold text-green-800'>Current</span>
                        )}
                      </div>
                    </td>
                    <td className='px-6 py-4 text-sm whitespace-nowrap text-gray-500'>{session.lastActive}</td>
                    <td className='px-6 py-4 text-right text-sm font-medium whitespace-nowrap'>
                      {!session.current && (
                        <button onClick={() => revokeSession(session.id)} className='text-red-600 hover:text-red-900'>
                          Revoke
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>

      <div className='rounded-lg border border-red-200 bg-red-50 p-6'>
        <div className='mb-4 flex items-center'>
          <ExclamationTriangleIcon className='mr-2 h-5 w-5 text-red-500' />
          <h2 className='text-lg font-medium text-red-700'>Danger Zone</h2>
        </div>

        <div className='p-4'>
          <h3 className='text-sm font-medium text-red-800'>Delete Account</h3>
          <p className='mt-1 mb-4 text-sm text-red-600'>
            Once you delete your account, there is no going back. All of your data will be permanently removed. Please be certain.
          </p>
          <Button
            variant='outline'
            className='border-red-300 bg-white/80 text-red-600 hover:bg-red-50'
            onClick={() => {
              if (window.confirm('Are you sure you want to delete your account? This action cannot be undone.')) {
                // In a real implementation, we would call a dedicated API endpoint
                ApiClient.delete('/settings/account')
                  .then((result) => {
                    if (result.error) {
                      throw new Error(result.error);
                    }
                    // On success, log the user out and redirect to login page
                    localStorage.removeItem('auth_token');
                    router.push('/login');
                  })
                  .catch((error) => {
                    console.error('Failed to delete account:', error);
                    setSaveMessage({
                      type: 'error',
                      text: 'Failed to delete account. Please try again.',
                    });
                  });
              }
            }}
          >
            Delete Account
          </Button>
        </div>
      </div>
    </div>
  );
}
