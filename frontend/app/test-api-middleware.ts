/**
 * API Middleware Debugger
 *
 * This file helps troubleshoot issues with the API middleware,
 * particularly for analyzing frequent /users/me requests.
 */

import { ApiClient, axiosInstance } from './services/api';
import axios from 'axios';

// Add a local storage mock for testing in Node.js
if (typeof window === 'undefined') {
  // @ts-ignore
  global.localStorage = {
    getItem: (key: string) => {
      if (key === 'auth_token') {
        return 'test_token';
      }
      return null;
    },
    setItem: () => {},
    removeItem: () => {},
  };

  // @ts-ignore
  global.atob = (str: string) => Buffer.from(str, 'base64').toString('binary');
}

// Add request/response interceptors to detect /users/me calls
if (typeof window !== 'undefined') {
  // Track the time of API requests to detect rapid calls and patterns
  const endpointTracker = {
    '/users/me': {
      lastCallTime: 0,
      callCount: 0,
      totalCalls: 0,
      recentCalls: [] as Array,
      consecutiveCalls: 0,
    },
    '/auth/refresh': {
      lastCallTime: 0,
      callCount: 0,
      totalCalls: 0,
      recentCalls: [] as Array,
      consecutiveCalls: 0,
    },
  };

  // Create a debug interceptor for the axios instance
  const requestInterceptor = axiosInstance.interceptors.request.use((config) => {
    const url = config.url || '';
    const now = Date.now();

    // Track /users/me requests
    if (url.includes('/users/me')) {
      const tracker = endpointTracker['/users/me'];
      const timeSinceLastCall = now - tracker.lastCallTime;

      tracker.callCount++;
      tracker.totalCalls++;
      tracker.recentCalls.push({ time: now, url });

      // Keep only the last 10 calls
      if (tracker.recentCalls.length > 10) {
        tracker.recentCalls.shift();
      }

      // Check for excessive frequency (more than 3 in 3 seconds)
      if (timeSinceLastCall < 3000) {
        tracker.consecutiveCalls++;

        if (tracker.consecutiveCalls >= 3) {
          console.error(`🚨 POSSIBLE API LOOP DETECTED: ${tracker.consecutiveCalls} consecutive /users/me calls`);
          console.error(`Total /users/me calls: ${tracker.totalCalls}, Last interval: ${timeSinceLastCall}ms`);

          // Create an error to capture stack trace in a better way
          const stackTrace = new Error().stack;
          console.warn('DETAILED STACK:', stackTrace);

          // Check for likely causes
          if (stackTrace?.includes('react-query')) {
            console.error('LIKELY CAUSE: React Query refresh/refetch cycle');
          }

          if (stackTrace?.includes('token') || stackTrace?.includes('auth')) {
            console.error('LIKELY CAUSE: Auth token refresh cycle');
          }

          // Suggest possible fixes
          console.warn('SUGGESTED FIXES:');
          console.warn('1. Check React Query caching settings');
          console.warn('2. Verify token refresh logic is not creating circular dependencies');
          console.warn('3. Make sure components are not remounting frequently');
        }
      } else {
        // Reset consecutive call counter if enough time passed
        tracker.consecutiveCalls = 1;
      }

      tracker.lastCallTime = now;
    }

    // Also track /auth/refresh requests for correlation
    if (url.includes('/auth/refresh')) {
      const tracker = endpointTracker['/auth/refresh'];
      tracker.callCount++;
      tracker.totalCalls++;
      tracker.lastCallTime = now;

      // Check if this is correlated with a recent /users/me call
      const usersMeTracker = endpointTracker['/users/me'];
      const recentUserMeCalls = usersMeTracker.recentCalls.filter((call) => now - call.time < 1000);

      if (recentUserMeCalls.length > 0) {
        console.warn('⚠️ Auth refresh occurred within 1 second of /users/me call - possible circular dependency');
      }
    }

    return config;
  });

  // Log when the middleware is activated
  console.log('🔍 API Middleware Debug Interceptors Installed');
  console.log('Monitoring for frequent /users/me calls...');
}

// Test function to verify middleware with manual API calls
async function runTest() {
  console.log('Testing API client with UUID and MetaData middleware...');

  try {
    // Test a GET request to /health to ensure our middleware is working
    const result = await ApiClient.get('/health');
    console.log('Health check result:', result.status);

    // Try to get the current user - will fail if not properly authenticated
    try {
      const userResult = await ApiClient.get('/users/me');
      console.log('User result status:', userResult.status);
    } catch (error) {
      console.log('User endpoint failed as expected (no valid token)');
    }
  } catch (error) {
    console.error('API test failed:', error);
  }
}

// Run the test if not in production
if (process.env.NODE_ENV !== 'production') {
  runTest().then(() => console.log('Test completed'));
}
