'use client';

import { useRouter } from 'next/navigation';
import { useCallback } from 'react';
import { useApp } from '@/app/components/app/hooks';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { SettingsService, UserProfileSettings, UserPreferences, PasswordChangeRequest } from '@/app/services/settingsService';

export function useSettings() {
  const router = useRouter();
  const app = useApp();
  const queryClient = useQueryClient();

  // Query for user settings
  const { data: settings, isLoading: isLoadingSettings } = useQuery({
    queryKey: ['userSettings'],
    queryFn: async () => {
      const result = await SettingsService.getAllSettings();
      if (result.error) {
        throw new Error(result.error);
      }
      return result.data;
    },
    enabled: !!app.isAuthenticated,
  });

  // Query for user preferences
  const { data: preferences, isLoading: isLoadingPreferences } = useQuery({
    queryKey: ['userPreferences'],
    queryFn: async () => {
      const result = await SettingsService.getPreferences();
      if (result.error) {
        throw new Error(result.error);
      }
      return result.data;
    },
    enabled: !!app.isAuthenticated,
  });

  // Update profile mutation
  const updateProfileMutation = useMutation({
    mutationFn: async (profileData: Partial) => {
      const result = await SettingsService.updateProfileSettings(profileData);
      if (result.error) {
        throw new Error(result.error);
      }
      return result.data;
    },
    onSuccess: () => {
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: ['userSettings'] });
      queryClient.invalidateQueries({ queryKey: ['currentUser'] });
    },
  });

  // Update preferences mutation
  const updatePreferencesMutation = useMutation({
    mutationFn: async (preferencesData: Partial) => {
      const result = await SettingsService.updatePreferences(preferencesData);
      if (result.error) {
        throw new Error(result.error);
      }
      return result.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['userPreferences'] });
      queryClient.invalidateQueries({ queryKey: ['userSettings'] });
    },
  });

  // Change password mutation
  const changePasswordMutation = useMutation({
    mutationFn: async (passwordData: PasswordChangeRequest) => {
      const result = await SettingsService.changePassword(passwordData);
      if (result.error) {
        throw new Error(result.error);
      }
      return result.data;
    },
  });

  // Upload profile picture mutation
  const uploadProfilePictureMutation = useMutation({
    mutationFn: async (file: File) => {
      const result = await SettingsService.uploadProfilePicture(file);
      if (result.error) {
        throw new Error(result.error);
      }
      return result.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['userSettings'] });
      queryClient.invalidateQueries({ queryKey: ['currentUser'] });
    },
  });

  const navigateToSettings = useCallback(() => {
    router.push('/settings');
  }, [router]);

  const getUserProfile = useCallback(() => {
    // First try to get profile from settings query
    if (settings?.profile) {
      return settings.profile;
    }

    // Fall back to app context
    return (
      app.currentUser || {
        id: '',
        name: 'User',
        email: '',
        handle: '',
        profileImage: '/profile/profile-picture-1.jpg',
      }
    );
  }, [app.currentUser, settings]);

  return {
    settings,
    preferences,
    isLoadingSettings,
    isLoadingPreferences,
    navigateToSettings,
    getUserProfile,
    updateProfile: updateProfileMutation.mutate,
    isUpdatingProfile: updateProfileMutation.isPending,
    updatePreferences: updatePreferencesMutation.mutate,
    isUpdatingPreferences: updatePreferencesMutation.isPending,
    changePassword: changePasswordMutation.mutate,
    isChangingPassword: changePasswordMutation.isPending,
    uploadProfilePicture: uploadProfilePictureMutation.mutate,
    isUploadingProfilePicture: uploadProfilePictureMutation.isPending,
  };
}
