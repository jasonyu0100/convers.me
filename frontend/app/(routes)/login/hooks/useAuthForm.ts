'use client';

import { useApp } from '@/app/components/app/hooks';
import { useRouteComponent } from '@/app/components/router/useRouteComponent';
import { loginUser, signupUser } from '@/app/services/authService';
import { useRouter } from 'next/navigation';
import { useCallback, useState } from 'react';
import { useMutation } from '@tanstack/react-query';

// Default auth messages since data directory was removed
const authMessages = {
  login: {
    error: {
      default: 'Invalid email or password',
      server: 'Unable to connect to the server',
    },
  },
  signup: {
    error: {
      default: 'Unable to create account',
      server: 'Unable to connect to the server',
    },
  },
};
import { AuthMode, LoginFormData } from '../../../types/login';

/**
 * Custom hook for authentication form handling with standardized error handling
 */
export function useAuthForm() {
  const router = useRouter();
  const { setCurrentUser } = useApp();
  const { handleError } = useRouteComponent();

  // Form state - check URL for signup mode
  const [authMode, setAuthMode] = useState<AuthMode>(() => {
    // Check if we're in the browser and if URL has signup mode
    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href);
      const mode = url.searchParams.get('mode');
      if (mode === 'signup') {
        return AuthMode.SIGNUP;
      }
    }
    return AuthMode.LOGIN;
  });
  const [formData, setFormData] = useState<LoginFormData>({
    email: '',
    password: '',
    firstName: '',
    lastName: '',
  });
  const [error, setError] = useState<string>('');

  // Login mutation
  const loginMutation = useMutation({
    mutationFn: async (data: LoginFormData) => {
      return loginUser(data);
    },
    onSuccess: (result) => {
      if (result.success && result.userData) {
        // Store email for mock auth fallback
        if (typeof window !== 'undefined') {
          localStorage.setItem('last_login_email', formData.email);
        }

        setCurrentUser(result.userData);
        // Use direct window location change for more reliable navigation
        window.location.href = '/';
      } else {
        setError(result.error || authMessages.login.error.default);
      }
    },
    onError: (err) => {
      console.error('Login error:', err);
      setError(authMessages.login.error.server);
      handleError(err);
    },
  });

  // Signup mutation
  const signupMutation = useMutation({
    mutationFn: async (data: LoginFormData) => {
      return signupUser(data);
    },
    onSuccess: (result) => {
      if (result.success && result.userData) {
        // Store email for mock auth fallback
        if (typeof window !== 'undefined') {
          localStorage.setItem('last_login_email', formData.email);
        }

        setCurrentUser(result.userData);
        // Use direct window location change for more reliable navigation
        window.location.href = '/';
      } else {
        setError(result.error || authMessages.signup.error.default);
      }
    },
    onError: (err) => {
      console.error('Signup error:', err);
      setError(authMessages.signup.error.server);
      handleError(err);
    },
  });

  // Form state helpers
  const isSignupMode = authMode === AuthMode.SIGNUP;
  const isLoading = loginMutation.isPending || signupMutation.isPending;

  // Update individual form fields with error handling
  const updateField = useCallback(
    (field: keyof LoginFormData, value: string) => {
      try {
        setFormData((prev) => ({
          ...prev,
          [field]: value,
        }));

        // Clear error when user begins typing
        if (error) setError('');
      } catch (err) {
        handleError(err);
      }
    },
    [error, handleError],
  );

  // Toggle between login and signup modes with error handling
  const toggleAuthMode = useCallback(() => {
    try {
      setAuthMode((prev) => (prev === AuthMode.LOGIN ? AuthMode.SIGNUP : AuthMode.LOGIN));
      setError('');
    } catch (err) {
      handleError(err);
    }
  }, [handleError]);

  // Reset form to initial state with error handling
  const resetForm = useCallback(() => {
    try {
      setFormData({
        email: '',
        password: '',
        firstName: '',
        lastName: '',
      });
      setError('');
    } catch (err) {
      handleError(err);
    }
  }, [handleError]);

  // Handle form submission with standardized error handling
  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      setError('');

      try {
        if (authMode === AuthMode.LOGIN) {
          loginMutation.mutate(formData);
        } else {
          signupMutation.mutate(formData);
        }
      } catch (err) {
        console.error('Auth form submission error:', err);
        handleError(err);
      }
    },
    [authMode, formData, loginMutation, signupMutation, handleError],
  );

  // Helper to check if form is valid
  const isValidForm = useCallback((): boolean => {
    const { email, password, firstName, lastName } = formData;

    if (authMode === AuthMode.LOGIN) {
      return Boolean(email && password);
    }

    return Boolean(email && password && firstName && lastName);
  }, [authMode, formData]);

  return {
    authMode,
    formData,
    isSignupMode,
    isLoading,
    error,
    isValidForm: isValidForm(),
    updateField,
    toggleAuthMode,
    resetForm,
    handleSubmit,
  };
}
