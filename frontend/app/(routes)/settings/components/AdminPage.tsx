'use client';

import { useApp } from '@/app/components/app/hooks';
import { ServerIcon, UsersIcon } from '@heroicons/react/24/outline';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import AdminUserManagement from './AdminUserManagement';
import SystemOperations from './SystemOperations';

export function AdminPage() {
  const router = useRouter();
  const { currentUser } = useApp();
  const [selectedTab, setSelectedTab] = useState(0);

  // Redirect non-admin users
  useEffect(() => {
    if (currentUser && !currentUser.isAdmin) {
      router.push('/settings');
    }
  }, [currentUser, router]);

  // If user is not admin, don't render anything
  if (!currentUser?.isAdmin) {
    return null;
  }

  return (
    <div className='max-w-full space-y-6 overflow-hidden'>
      <h1 className='mb-6 text-2xl font-semibold'>Admin Dashboard</h1>

      <div className='border-b border-gray-200'>
        <div className='flex space-x-8 overflow-x-auto'>
          <button
            onClick={() => setSelectedTab(0)}
            className={`flex shrink-0 items-center border-b-2 px-1 py-4 text-sm font-medium ${
              selectedTab === 0 ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
            }`}
          >
            <UsersIcon className='mr-2 h-5 w-5' />
            User Management
          </button>
          <button
            onClick={() => setSelectedTab(1)}
            className={`flex shrink-0 items-center border-b-2 px-1 py-4 text-sm font-medium ${
              selectedTab === 1 ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
            }`}
          >
            <ServerIcon className='mr-2 h-5 w-5' />
            System Operations
          </button>
        </div>
      </div>

      <div className='mt-4 max-w-full overflow-hidden'>{selectedTab === 0 ? <AdminUserManagement /> : <SystemOperations />}</div>
    </div>
  );
}
