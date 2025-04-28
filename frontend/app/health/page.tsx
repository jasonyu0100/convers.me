'use client';

import { useEffect, useState } from 'react';
import { runHealthCheck } from '../health_check';

/**
 * Health Check Page
 *
 * This page runs a health check on the API and displays the results.
 * You can use this page to debug API connectivity issues.
 */
export default function HealthCheckPage() {
  const [results, setResults] = useState<string>('Running health check...');
  const [loading, setLoading] = useState<boolean>(true);
  const [apiBaseUrl, setApiBaseUrl] = useState<string>('');

  useEffect(() => {
    // Run the health check
    async function checkHealth() {
      setLoading(true);
      try {
        // Get the API base URL from the environment or api.ts module
        const apiModule = await import('../services/api');
        setApiBaseUrl(apiModule.ApiClient.baseUrl);

        // Run the health check
        const healthResults = await runHealthCheck();
        setResults(healthResults);
      } catch (error) {
        setResults(`Error: ${error instanceof Error ? error.message : String(error)}`);
      } finally {
        setLoading(false);
      }
    }

    checkHealth();
  }, []);

  return (
    <div className='min-h-screen bg-gray-50 p-8'>
      <div className='mx-auto max-w-4xl'>
        <h1 className='mb-6 text-3xl font-bold text-gray-900'>API Health Check</h1>

        <div className='mb-6 rounded-lg bg-white/80 p-6 shadow-md'>
          <h2 className='mb-2 text-xl font-semibold text-gray-800'>Configuration</h2>
          <p className='text-gray-600'>
            <span className='font-medium'>API URL:</span> {apiBaseUrl || 'Loading...'}
          </p>
        </div>

        <div className='rounded-lg bg-white/80 p-6 shadow-md'>
          <h2 className='mb-4 text-xl font-semibold text-gray-800'>Health Check Results</h2>

          {loading ? (
            <div className='flex items-center justify-center p-8'>
              <div className='h-8 w-8 animate-spin rounded-full border-t-2 border-b-2 border-blue-500'></div>
              <span className='ml-3 text-gray-600'>Running health check...</span>
            </div>
          ) : (
            <pre className='rounded-md bg-gray-800 p-4 text-sm text-white'>{results}</pre>
          )}

          <div className='mt-6 flex justify-end'>
            <button
              onClick={() => {
                setLoading(true);
                setResults('Running health check...');
                runHealthCheck()
                  .then(setResults)
                  .finally(() => setLoading(false));
              }}
              className='rounded-md bg-blue-600 px-4 py-2 text-white shadow-sm hover:bg-blue-700'
              disabled={loading}
            >
              {loading ? 'Running...' : 'Run Again'}
            </button>
          </div>
        </div>

        <div className='mt-8 text-center text-sm text-gray-500'>
          <p>This page helps diagnose API connectivity issues. If any checks fail, ensure the backend server is running and accessible.</p>
        </div>
      </div>
    </div>
  );
}
