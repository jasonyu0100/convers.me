'use client';

import { Button } from '@/app/components/ui/buttons';
import { TextField } from '@/app/components/ui/inputs';
import { LoadingSpinner } from '@/app/components/ui/loading';
import { PasswordChangeRequest, SettingsService } from '@/app/services/settingsService';
import { CheckCircleIcon, ExclamationTriangleIcon, KeyIcon, ShieldCheckIcon } from '@heroicons/react/24/outline';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

export function ChangePasswordPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [passwordStrength, setPasswordStrength] = useState({
    score: 0,
    feedback: '',
  });

  const handleInputChange = (e: React.ChangeEvent) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
    setError('');

    // Simple password strength checker
    if (name === 'newPassword' && value) {
      let score = 0;
      let feedback = '';

      if (value.length >= 8) score++;
      if (/[A-Z]/.test(value)) score++;
      if (/[a-z]/.test(value)) score++;
      if (/[0-9]/.test(value)) score++;
      if (/[^A-Za-z0-9]/.test(value)) score++;

      if (score < 2) feedback = 'Weak password';
      else if (score < 4) feedback = 'Moderate password';
      else feedback = 'Strong password';

      setPasswordStrength({ score, feedback });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    // Validate passwords match
    if (formData.newPassword !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    // Validate password length
    if (formData.newPassword.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }

    setIsLoading(true);

    try {
      // Create password change data using the exact field names expected by backend
      const changePasswordData: PasswordChangeRequest = {
        current_password: formData.currentPassword,
        new_password: formData.newPassword,
      };

      const result = await SettingsService.changePassword(changePasswordData);

      if (result.error) {
        throw new Error(result.error);
      }

      setSuccess('Password changed successfully! You will be redirected shortly.');

      // Reset form
      setFormData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });

      // Redirect back to settings after 2 seconds
      setTimeout(() => {
        router.push('/settings');
      }, 2000);
    } catch (error: any) {
      console.error('Failed to change password:', error);
      setError(error.message || 'Failed to change password. Please check your current password and try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const getStrengthColor = () => {
    const { score } = passwordStrength;
    if (score <= 2) return 'bg-red-500';
    if (score <= 3) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  return (
    <div className='space-y-6'>
      <div className='mb-6 flex items-center'>
        <KeyIcon className='mr-2 h-6 w-6 text-gray-500' />
        <h1 className='text-xl font-semibold'>Change Password</h1>
      </div>

      <div className='rounded-lg border border-slate-200 bg-white/80 p-6 backdrop-blur-sm'>
        {error && (
          <div className='mb-6 rounded border-l-4 border-red-400 bg-red-50 p-4'>
            <div className='flex'>
              <ExclamationTriangleIcon className='mr-2 h-5 w-5 text-red-400' />
              <p className='text-sm text-red-700'>{error}</p>
            </div>
          </div>
        )}

        {success && (
          <div className='mb-6 rounded border-l-4 border-green-400 bg-green-50 p-4'>
            <div className='flex'>
              <CheckCircleIcon className='mr-2 h-5 w-5 text-green-500' />
              <p className='text-sm text-green-700'>{success}</p>
            </div>
          </div>
        )}

        <div className='mb-6 rounded border-l-4 border-blue-400 bg-blue-50 p-4'>
          <div className='flex'>
            <ShieldCheckIcon className='mr-2 h-5 w-5 flex-shrink-0 text-blue-500' />
            <div>
              <p className='text-sm font-medium text-blue-700'>Password Security Tips</p>
              <ul className='mt-1 list-inside list-disc text-xs text-blue-600'>
                <li>Use at least 8 characters</li>
                <li>Include uppercase and lowercase letters</li>
                <li>Include numbers and special characters</li>
                <li>Don't reuse passwords from other sites</li>
              </ul>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className='space-y-6'>
          <div>
            <label htmlFor='currentPassword' className='mb-1 block text-sm font-medium text-gray-700'>
              Current Password
            </label>
            <TextField
              id='currentPassword'
              name='currentPassword'
              type='password'
              value={formData.currentPassword}
              onChange={handleInputChange}
              required
              fullWidth
              placeholder='Enter your current password'
            />
          </div>

          <div>
            <label htmlFor='newPassword' className='mb-1 block text-sm font-medium text-gray-700'>
              New Password
            </label>
            <TextField
              id='newPassword'
              name='newPassword'
              type='password'
              value={formData.newPassword}
              onChange={handleInputChange}
              required
              fullWidth
              placeholder='Enter new password'
            />

            {formData.newPassword && (
              <div className='mt-2'>
                <div className='mb-1 flex items-center justify-between'>
                  <span className='text-xs font-medium'>Password Strength</span>
                  <span className='text-xs'>{passwordStrength.feedback}</span>
                </div>
                <div className='h-1.5 w-full rounded-full bg-gray-200'>
                  <div className={`h-1.5 rounded-full ${getStrengthColor()}`} style={{ width: `${(passwordStrength.score / 5) * 100}%` }}></div>
                </div>
              </div>
            )}
          </div>

          <div>
            <label htmlFor='confirmPassword' className='mb-1 block text-sm font-medium text-gray-700'>
              Confirm New Password
            </label>
            <TextField
              id='confirmPassword'
              name='confirmPassword'
              type='password'
              value={formData.confirmPassword}
              onChange={handleInputChange}
              required
              fullWidth
              placeholder='Confirm new password'
            />

            {formData.newPassword && formData.confirmPassword && formData.newPassword !== formData.confirmPassword && (
              <p className='mt-1 text-xs text-red-600'>Passwords do not match</p>
            )}
          </div>

          <div className='mt-6 flex justify-end space-x-3 pt-6'>
            <Button variant='secondary' type='button' onClick={() => router.push('/settings')}>
              Cancel
            </Button>
            <Button
              type='submit'
              disabled={isLoading || !formData.currentPassword || !formData.newPassword || formData.newPassword !== formData.confirmPassword}
            >
              {isLoading ? (
                <span className='flex items-center'>
                  <LoadingSpinner size='sm' className='mr-2' />
                  Updating...
                </span>
              ) : (
                'Update Password'
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
