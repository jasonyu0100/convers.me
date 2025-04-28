'use client';

import { UserAvatar } from '@/app/components/ui/avatars/UserAvatar';
import { Button } from '@/app/components/ui/buttons';
import { TextField } from '@/app/components/ui/inputs';
import { LoadingSpinner } from '@/app/components/ui/loading';
import { SettingsService, UserProfileSettings } from '@/app/services/settingsService';
import {
  ArrowUpTrayIcon,
  AtSymbolIcon,
  CameraIcon,
  CheckCircleIcon,
  DocumentTextIcon,
  EnvelopeIcon,
  InformationCircleIcon,
  MapPinIcon,
  UserCircleIcon,
  XCircleIcon,
} from '@heroicons/react/24/outline';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';

export function ProfilePage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [profileData, setProfileData] = useState<UserProfileSettings>({
    name: '',
    email: '',
    handle: '',
    bio: '',
    profileImage: '',
    location: '',
  });

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Fetch profile data from API
  useEffect(() => {
    const fetchProfile = async () => {
      setIsLoading(true);
      setErrorMessage(null);

      try {
        const result = await SettingsService.getProfileSettings();

        if (result.error) {
          throw new Error(result.error);
        }

        if (result.data) {
          setProfileData({
            id: result.data.id,
            name: result.data.name,
            email: result.data.email,
            handle: result.data.handle,
            bio: result.data.bio || '',
            profileImage: result.data.profileImage || '',
            // Get location from metadata (support both user_metadata and metadata)
            location: result.data.metadata?.location || result.data.user_metadata?.location || '',
          });
        }
      } catch (error) {
        console.error('Failed to fetch profile:', error);
        setErrorMessage('Could not load profile data. Please try again later.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchProfile();
  }, []);

  const handleInputChange = (e: React.ChangeEvent) => {
    const { name, value } = e.target;
    setProfileData({
      ...profileData,
      [name]: value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      // Create update payload based on UserUpdateData interface
      const updateData = {
        name: profileData.name,
        handle: profileData.handle,
        bio: profileData.bio,
        // Include user_metadata with location
        user_metadata: {
          ...(profileData.id ? { id: profileData.id } : {}),
          location: profileData.location,
        },
      };

      // We don't update email directly for security reasons - that would be handled separately

      const result = await SettingsService.updateProfileSettings(updateData);

      if (result.error) {
        throw new Error(result.error);
      }

      setSuccessMessage('Profile updated successfully!');

      // Clear success message after 3 seconds
      setTimeout(() => {
        setSuccessMessage(null);
      }, 3000);
    } catch (error) {
      console.error('Failed to update profile:', error);
      setErrorMessage(error instanceof Error ? error.message : 'Failed to update profile. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleFileClick = () => {
    // Trigger file input click
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleFileChange = async (e: React.ChangeEvent) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsLoading(true);
    setErrorMessage(null);

    try {
      const result = await SettingsService.uploadProfilePicture(file);

      if (result.error) {
        throw new Error(result.error);
      }

      if (result.data?.profileImage) {
        setProfileData({
          ...profileData,
          profileImage: result.data.profileImage,
        });
        setSuccessMessage('Profile picture updated successfully!');
      }
    } catch (error) {
      console.error('Failed to upload profile picture:', error);
      setErrorMessage('Could not upload profile picture. Please try again.');
    } finally {
      setIsLoading(false);

      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
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
        <h1 className='text-2xl font-semibold text-gray-800'>Profile Settings</h1>
        <p className='text-gray-500'>Manage your personal information</p>
      </div>

      {errorMessage && (
        <div className='mb-4 flex items-start gap-3 rounded-lg bg-red-50 p-4 text-sm text-red-700'>
          <XCircleIcon className='mt-0.5 h-5 w-5 flex-shrink-0 text-red-500' />
          <p>{errorMessage}</p>
        </div>
      )}

      {successMessage && (
        <div className='mb-4 flex items-start gap-3 rounded-lg bg-green-50 p-4 text-sm text-green-700'>
          <CheckCircleIcon className='mt-0.5 h-5 w-5 flex-shrink-0 text-green-500' />
          <p>{successMessage}</p>
        </div>
      )}

      <div className='mb-8 overflow-hidden rounded-xl border border-slate-200/80 bg-white/80 shadow-sm'>
        <div className='border-b border-gray-100 bg-gradient-to-r from-blue-50 to-indigo-50/30 p-6'>
          <div className='flex flex-col items-center gap-6 sm:flex-row sm:gap-8'>
            <div className='group relative'>
              <UserAvatar
                user={{
                  id: profileData.id,
                  name: profileData.name,
                  profileImage: profileData.profileImage,
                }}
                size='xl'
                className='h-24 w-24 border-4 border-white shadow-md'
              />
              <div
                className='absolute inset-0 flex cursor-pointer items-center justify-center rounded-full bg-black/40 opacity-0 backdrop-blur-sm transition-opacity duration-200 group-hover:opacity-100'
                onClick={handleFileClick}
              >
                <CameraIcon className='h-8 w-8 text-white' />
              </div>
              <input type='file' ref={fileInputRef} className='hidden' accept='image/*' onChange={handleFileChange} />
            </div>

            <div className='text-center sm:text-left'>
              <h2 className='text-xl font-medium text-gray-800'>{profileData.name}</h2>
              <p className='mb-4 text-gray-500'>@{profileData.handle}</p>
              <Button
                variant='outline'
                size='sm'
                className='flex items-center gap-2 rounded-full border-slate-200 px-4 py-2 font-medium text-gray-700 transition-colors hover:bg-slate-50'
                onClick={handleFileClick}
              >
                <ArrowUpTrayIcon className='h-4 w-4' />
                Upload Photo
              </Button>
            </div>
          </div>
        </div>

        <div className='p-6'>
          <form onSubmit={handleSubmit} className='space-y-8'>
            <div className='grid grid-cols-1 gap-x-8 gap-y-6 md:grid-cols-2'>
              <div className='space-y-2'>
                <label htmlFor='name' className='flex items-center gap-2 text-sm font-medium text-gray-700'>
                  <UserCircleIcon className='h-4 w-4 text-gray-500' />
                  Name
                </label>
                <TextField id='name' name='name' value={profileData.name} onChange={handleInputChange} required fullWidth />
                <p className='text-xs text-gray-500'>Your full name as shown on your profile</p>
              </div>

              <div className='space-y-2'>
                <label htmlFor='email' className='flex items-center gap-2 text-sm font-medium text-gray-700'>
                  <EnvelopeIcon className='h-4 w-4 text-gray-500' />
                  Email
                </label>
                <TextField
                  id='email'
                  name='email'
                  type='email'
                  value={profileData.email}
                  onChange={handleInputChange}
                  disabled // Email changes should go through a verification process
                  fullWidth
                />
                <div className='flex items-center gap-1.5 text-xs text-gray-500'>
                  <InformationCircleIcon className='h-3.5 w-3.5 text-gray-400' />
                  Contact support to change your email address
                </div>
              </div>

              <div className='space-y-2'>
                <label htmlFor='handle' className='flex items-center gap-2 text-sm font-medium text-gray-700'>
                  <AtSymbolIcon className='h-4 w-4 text-gray-500' />
                  Username
                </label>
                <TextField id='handle' name='handle' value={profileData.handle} onChange={handleInputChange} required fullWidth />
                <p className='text-xs text-gray-500'>Your unique @username on the platform</p>
              </div>

              <div className='space-y-2'>
                <label htmlFor='location' className='flex items-center gap-2 text-sm font-medium text-gray-700'>
                  <MapPinIcon className='h-4 w-4 text-gray-500' />
                  Location
                </label>
                <TextField id='location' name='location' value={profileData.location} onChange={handleInputChange} fullWidth placeholder='City, Country' />
                <p className='text-xs text-gray-500'>Where you're based (optional)</p>
              </div>

              <div className='space-y-2 md:col-span-2'>
                <label htmlFor='bio' className='flex items-center gap-2 text-sm font-medium text-gray-700'>
                  <DocumentTextIcon className='h-4 w-4 text-gray-500' />
                  Bio
                </label>
                <textarea
                  id='bio'
                  name='bio'
                  rows={4}
                  value={profileData.bio || ''}
                  onChange={handleInputChange}
                  className='block w-full rounded-lg border border-slate-200 bg-white/80 p-3 shadow-sm focus:border-blue-400 focus:ring-1 focus:ring-blue-400 focus:outline-none'
                  placeholder='Tell us about yourself...'
                />
                <p className='text-xs text-gray-500'>A brief description of yourself shown on your profile</p>
              </div>
            </div>

            <div className='flex items-center border-t border-gray-100 pt-6'>
              <div className='mr-auto'>
                <div className='flex items-center gap-1.5 text-sm text-gray-500'>
                  <InformationCircleIcon className='h-4 w-4 text-blue-500' />
                  All changes will be saved to your public profile
                </div>
              </div>
              <div className='flex justify-end space-x-3'>
                <Button
                  variant='secondary'
                  type='button'
                  onClick={() => router.push('/settings')}
                  className='rounded-lg border-gray-200 bg-white/80 px-4 py-2 font-medium text-gray-700 shadow-sm hover:bg-gray-50'
                >
                  Cancel
                </Button>
                <Button type='submit' disabled={isSaving} className='rounded-lg bg-blue-600 px-4 py-2 font-medium text-white shadow-sm hover:bg-blue-700'>
                  {isSaving ? 'Saving...' : 'Save Changes'}
                </Button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
