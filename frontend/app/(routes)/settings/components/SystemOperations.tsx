'use client';

import AdminService from '@/app/services/adminService';
import { useState } from 'react';

export default function SystemOperations() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [operationDetails, setOperationDetails] = useState<any>(null);

  const handleInitializeDatabase = async () => {
    setLoading(true);
    setError(null);
    setSuccessMessage(null);
    setOperationDetails(null);

    try {
      const result = await AdminService.initializeDatabase();
      if (result.error) {
        setError(result.error);
      } else {
        setSuccessMessage('Database initialized successfully');
        setOperationDetails(result.data);
      }
    } catch (err) {
      setError('Failed to initialize database');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleResetDatabase = async () => {
    // Show confirmation dialog
    if (!window.confirm('Are you sure you want to reset the database? This action cannot be undone.')) {
      return;
    }

    setLoading(true);
    setError(null);
    setSuccessMessage(null);
    setOperationDetails(null);

    try {
      const result = await AdminService.resetDatabase();
      if (result.error) {
        setError(result.error);
      } else {
        setSuccessMessage('Database reset successfully');
        setOperationDetails(result.data);
      }
    } catch (err) {
      setError('Failed to reset database');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className='space-y-6'>
      <h1 className='text-2xl font-semibold'>System Operations</h1>

      {error && (
        <div className='rounded border border-red-300 bg-red-50 p-3 text-red-800'>
          <p>{error}</p>
        </div>
      )}

      {successMessage && (
        <div className='rounded border border-green-300 bg-green-50 p-3 text-green-800'>
          <p>{successMessage}</p>
        </div>
      )}

      <div className='grid grid-cols-1 gap-6 md:grid-cols-2'>
        <div className='rounded-lg border bg-white/80 p-6 shadow-sm'>
          <h2 className='text-xl font-medium'>Initialize Database</h2>
          <p className='mt-2 text-gray-600'>
            Initialize the database with sample data for development. This creates default users, topics, processes, events, and posts.
          </p>
          <div className='mt-4'>
            <button
              onClick={handleInitializeDatabase}
              disabled={loading}
              className='w-full rounded bg-blue-500 px-4 py-2 text-white hover:bg-blue-600 disabled:bg-blue-300'
            >
              {loading ? 'Initializing...' : 'Initialize Database'}
            </button>
          </div>
        </div>

        <div className='rounded-lg border bg-white/80 p-6 shadow-sm'>
          <h2 className='text-xl font-medium'>Reset Database</h2>
          <p className='mt-2 text-gray-600'>Reset the database to a clean state, removing all data except the admin user. This action cannot be undone.</p>
          <div className='mt-4'>
            <button
              onClick={handleResetDatabase}
              disabled={loading}
              className='w-full rounded bg-red-500 px-4 py-2 text-white hover:bg-red-600 disabled:bg-red-300'
            >
              {loading ? 'Resetting...' : 'Reset Database'}
            </button>
          </div>
        </div>
      </div>

      {operationDetails && (
        <div className='rounded-lg border bg-white/80 p-6 shadow-sm'>
          <h2 className='mb-4 text-xl font-medium'>Operation Details</h2>
          <pre className='max-h-96 overflow-auto rounded bg-gray-100 p-4 text-sm whitespace-pre-wrap'>{JSON.stringify(operationDetails, null, 2)}</pre>
        </div>
      )}
    </div>
  );
}
