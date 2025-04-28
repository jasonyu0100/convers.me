'use client';

import { Button } from '@/app/components/ui/buttons';
import { LoadingSpinner } from '@/app/components/ui/loading';
import { SettingsService } from '@/app/services/settingsService';
import {
  BellIcon,
  CalendarIcon,
  ChatBubbleLeftEllipsisIcon,
  CheckCircleIcon,
  ComputerDesktopIcon,
  DevicePhoneMobileIcon,
  EnvelopeIcon,
  UserGroupIcon,
  XCircleIcon,
} from '@heroicons/react/24/outline';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

// Toggle switch component
interface ToggleSwitchProps {
  checked: boolean;
  onChange: () => void;
  id: string;
  disabled?: boolean;
}

const ToggleSwitch = ({ checked, onChange, id, disabled = false }: ToggleSwitchProps) => (
  <div className='relative inline-flex cursor-pointer items-center'>
    <input type='checkbox' className='peer sr-only' checked={checked} onChange={onChange} disabled={disabled} id={id} />
    <div
      className={`peer h-6 w-11 rounded-full transition-all duration-200 ${checked ? 'bg-blue-600' : 'bg-gray-200'} ${
        disabled ? 'opacity-60' : 'opacity-100'
      } after:absolute after:start-[2px] after:top-0.5 after:h-5 after:w-5 after:rounded-full after:border after:border-gray-300 after:bg-white/80 after:shadow-sm after:transition-all after:content-[''] peer-checked:after:translate-x-full peer-checked:after:border-white`}
    ></div>
  </div>
);

// Notification channel card component
interface NotificationChannelProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  checked: boolean;
  onChange: () => void;
  id: string;
  disabled?: boolean;
}

const NotificationChannel = ({ icon, title, description, checked, onChange, id, disabled }: NotificationChannelProps) => (
  <div className='flex items-start space-x-4 rounded-lg border border-gray-100 bg-white/80 p-4 shadow-sm transition-all hover:border-gray-200'>
    <div className='mt-1 rounded-full bg-blue-50 p-2.5 text-blue-600'>{icon}</div>
    <div className='flex-1'>
      <div className='flex items-center justify-between'>
        <div>
          <h3 className='text-base font-medium text-gray-800'>{title}</h3>
          <p className='mt-0.5 text-sm text-gray-500'>{description}</p>
        </div>
        <ToggleSwitch checked={checked} onChange={onChange} id={id} disabled={disabled} />
      </div>
    </div>
  </div>
);

// Notification type row component
interface NotificationTypeProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  checked: boolean;
  onChange: () => void;
  id: string;
}

const NotificationType = ({ icon, title, description, checked, onChange, id }: NotificationTypeProps) => (
  <div className='flex items-center justify-between rounded-lg border border-gray-100 bg-white/80 p-4 shadow-sm transition-all hover:border-gray-200'>
    <div className='flex items-start gap-3'>
      <div className='mt-0.5 rounded-full bg-blue-50 p-2 text-blue-600'>{icon}</div>
      <div>
        <h3 className='text-base font-medium text-gray-800'>{title}</h3>
        <p className='text-sm text-gray-500'>{description}</p>
      </div>
    </div>
    <ToggleSwitch checked={checked} onChange={onChange} id={id} />
  </div>
);

export function NotificationsPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [settings, setSettings] = useState({
    inApp: true,
    email: true,
    push: false,
    event_reminders: true,
    mention_alerts: true,
    team_updates: true,
  });

  // Fetch notification settings from API
  useEffect(() => {
    const fetchSettings = async () => {
      setIsLoading(true);
      setErrorMessage(null);

      try {
        const result = await SettingsService.getPreferences();

        if (result.error) {
          throw new Error(result.error);
        }

        if (result.data) {
          setSettings({
            inApp: true, // In-app is always true
            email: result.data.emailNotifications,
            push: result.data.additionalSettings?.pushNotifications || false,
            event_reminders: result.data.additionalSettings?.notification_settings?.event_reminders !== false,
            mention_alerts: result.data.additionalSettings?.notification_settings?.mention_alerts !== false,
            team_updates: result.data.additionalSettings?.notification_settings?.team_updates !== false,
          });
        }
      } catch (error) {
        console.error('Failed to fetch notification settings:', error);
        setErrorMessage('Could not load notification settings. Please try again later.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchSettings();
  }, []);

  const toggleSetting = (setting: keyof typeof settings) => {
    setSettings((prev) => ({
      ...prev,
      [setting]: !prev[setting],
    }));
  };

  const handleSubmit = async () => {
    setIsSaving(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      // Prepare data for API using the backend field names
      const updateData = {
        email_notifications: settings.email,
        additional_settings: {
          pushNotifications: settings.push,
          notification_settings: {
            event_reminders: settings.event_reminders,
            mention_alerts: settings.mention_alerts,
            team_updates: settings.team_updates,
          },
        },
      };

      const result = await SettingsService.updatePreferences(updateData);

      if (result.error) {
        throw new Error(result.error);
      }

      setSuccessMessage('Notification settings updated successfully!');

      // Clear success message after 3 seconds
      setTimeout(() => {
        setSuccessMessage(null);
      }, 3000);
    } catch (error) {
      console.error('Failed to update notification settings:', error);
      setErrorMessage(error instanceof Error ? error.message : 'Failed to update settings. Please try again.');
    } finally {
      setIsSaving(false);
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
      <div className='mb-6'>
        <h1 className='text-2xl font-semibold text-gray-800'>Notification Settings</h1>
        <p className='text-gray-500'>Control how you receive alerts and updates</p>
      </div>

      {errorMessage && (
        <div className='mb-4 flex items-start gap-3 rounded-lg bg-red-50 p-4 text-sm text-red-700 shadow-sm'>
          <XCircleIcon className='mt-0.5 h-5 w-5 flex-shrink-0 text-red-500' />
          <p>{errorMessage}</p>
        </div>
      )}

      {successMessage && (
        <div className='mb-4 flex items-start gap-3 rounded-lg bg-green-50 p-4 text-sm text-green-700 shadow-sm'>
          <CheckCircleIcon className='mt-0.5 h-5 w-5 flex-shrink-0 text-green-500' />
          <p>{successMessage}</p>
        </div>
      )}

      <div className='mb-8 overflow-hidden rounded-xl border border-slate-200/80 bg-white/80 shadow-sm'>
        <div className='border-b border-gray-100 bg-gradient-to-r from-blue-50 to-indigo-50/30 p-5'>
          <div className='flex items-center gap-3'>
            <BellIcon className='h-6 w-6 text-blue-600' />
            <h2 className='text-lg font-medium text-gray-800'>Notification Channels</h2>
          </div>
          <p className='mt-1 text-sm text-gray-600'>Choose how you want to be notified about activity</p>
        </div>

        <div className='p-5'>
          <div className='grid gap-4 md:grid-cols-1 lg:grid-cols-3'>
            <NotificationChannel
              icon={<ComputerDesktopIcon className='h-5 w-5' />}
              title='In-app notifications'
              description='Receive alerts within the application'
              checked={settings.inApp}
              onChange={() => toggleSetting('inApp')}
              id='inapp-toggle'
              disabled={true} // In-app notifications are always enabled
            />

            <NotificationChannel
              icon={<EnvelopeIcon className='h-5 w-5' />}
              title='Email notifications'
              description='Receive updates via email'
              checked={settings.email}
              onChange={() => toggleSetting('email')}
              id='email-toggle'
            />

            <NotificationChannel
              icon={<DevicePhoneMobileIcon className='h-5 w-5' />}
              title='Push notifications'
              description='Receive alerts on your device'
              checked={settings.push}
              onChange={() => toggleSetting('push')}
              id='push-toggle'
            />
          </div>
        </div>
      </div>

      <div className='mb-8 overflow-hidden rounded-xl border border-slate-200/80 bg-white/80 shadow-sm'>
        <div className='border-b border-gray-100 bg-gradient-to-r from-blue-50 to-indigo-50/30 p-5'>
          <div className='flex items-center gap-3'>
            <BellIcon className='h-6 w-6 text-blue-600' />
            <h2 className='text-lg font-medium text-gray-800'>Notification Types</h2>
          </div>
          <p className='mt-1 text-sm text-gray-600'>Select the types of notifications you want to receive</p>
        </div>

        <div className='space-y-4 p-5'>
          <NotificationType
            icon={<CalendarIcon className='h-5 w-5' />}
            title='Event Reminders'
            description='Get reminders for upcoming meetings and events'
            checked={settings.event_reminders}
            onChange={() => toggleSetting('event_reminders')}
            id='events-toggle'
          />

          <NotificationType
            icon={<ChatBubbleLeftEllipsisIcon className='h-5 w-5' />}
            title='Mentions & Comments'
            description='Get notified when someone mentions or comments on your content'
            checked={settings.mention_alerts}
            onChange={() => toggleSetting('mention_alerts')}
            id='mentions-toggle'
          />

          <NotificationType
            icon={<UserGroupIcon className='h-5 w-5' />}
            title='Team Updates'
            description='Get notified about team activity and announcements'
            checked={settings.team_updates}
            onChange={() => toggleSetting('team_updates')}
            id='team-toggle'
          />
        </div>
      </div>

      <div className='flex items-center border-t border-slate-100 pt-6'>
        <div className='mr-auto'>
          <div className='flex items-center gap-1.5 text-sm text-gray-500'>
            <BellIcon className='h-4 w-4 text-blue-500' />
            Your notification preferences will be applied to all channels
          </div>
        </div>
        <div className='flex space-x-3'>
          <Button
            variant='secondary'
            onClick={() => router.push('/settings')}
            className='rounded-lg border-gray-200 bg-white/80 px-4 py-2 font-medium text-gray-700 shadow-sm hover:bg-gray-50'
          >
            Cancel
          </Button>
          <Button
            variant='primary'
            onClick={handleSubmit}
            disabled={isSaving}
            className='rounded-lg bg-blue-600 px-4 py-2 font-medium text-white shadow-sm hover:bg-blue-700'
          >
            {isSaving ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </div>
    </div>
  );
}
