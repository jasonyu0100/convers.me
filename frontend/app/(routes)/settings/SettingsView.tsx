'use client';

import { AppHeader } from '@/app/components/app/AppHeader';
import { useApp } from '@/app/components/app/hooks';
import { AppRoute } from '@/app/components/router';
import { BellIcon, ChevronRightIcon, Cog6ToothIcon, ShieldCheckIcon, UserCircleIcon, UsersIcon } from '@heroicons/react/24/outline';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { AdminPage } from './components/AdminPage';
import { ChangePasswordPage } from './components/ChangePasswordPage';
import { NotificationsPage } from './components/NotificationsPage';
import { ProfilePage } from './components/ProfilePage';
import { SecurityPage } from './components/SecurityPage';
import { SettingsPage } from './components/SettingsPage';
import { useSettingsHeader } from './hooks/useSettingsHeader';

interface NavItemProps {
  href: string;
  icon: React.ReactNode;
  title: string;
  active: boolean;
  onClick: () => void;
  description?: string;
}

const NavItem = ({ href, icon, title, active, onClick, description }: NavItemProps) => (
  <Link
    href={href}
    className={`group flex items-center justify-between rounded-xl px-4 py-3.5 transition-all duration-200 ${
      active ? 'bg-blue-50/80 text-blue-700 shadow-sm' : 'text-gray-700 hover:bg-gray-50/80 hover:shadow-sm'
    }`}
    onClick={onClick}
  >
    <div className='flex items-center'>
      <div className={`mr-3.5 rounded-full ${active ? 'bg-blue-100 p-2 text-blue-600' : 'p-2 text-gray-500 group-hover:bg-gray-100'}`}>{icon}</div>
      <div>
        <span className='font-medium'>{title}</span>
        {description && <p className='mt-0.5 text-xs text-gray-500'>{description}</p>}
      </div>
    </div>
    <ChevronRightIcon className={`h-4 w-4 transition-opacity ${active ? 'opacity-100' : 'opacity-0 group-hover:opacity-70'}`} />
  </Link>
);

export function SettingsView() {
  const router = useRouter();
  const pathname = usePathname();
  const [selectedCategory, setSelectedCategory] = useState('/settings');
  const headerProps = useSettingsHeader();
  const { currentUser } = useApp();

  useEffect(() => {
    if (pathname) {
      setSelectedCategory(pathname);
    }
  }, [pathname]);

  const handleNavigation = (path: string) => {
    setSelectedCategory(path);
  };

  // Determine the content to display based on the pathname
  const renderContent = () => {
    switch (pathname) {
      case '/settings':
        return <SettingsPage />;
      case '/settings/profile':
        return <ProfilePage />;
      case '/settings/notifications':
        return <NotificationsPage />;
      case '/settings/security':
        return <SecurityPage />;
      case '/settings/change-password':
        return <ChangePasswordPage />;
      case '/settings/admin':
        if (currentUser?.isAdmin) {
          return <AdminPage />;
        } else {
          return null;
        }
      default:
        return <SettingsPage />;
    }
  };

  return (
    <div className='flex h-full w-full flex-col'>
      <AppHeader
        route={AppRoute.SETTINGS}
        title={headerProps.title}
        searchPlaceholder={headerProps.searchPlaceholder}
        searchValue={headerProps.searchValue}
        isSearchVisible={headerProps.isSearchVisible}
        onSearchChange={headerProps.onSearchChange}
        onSearchSubmit={headerProps.onSearchSubmit}
      />
      <div className='flex flex-1 overflow-auto bg-gray-50/50'>
        <div className='mx-auto flex w-full max-w-7xl flex-col p-4 md:flex-row md:gap-8 lg:gap-10'>
          {/* Sidebar */}
          <div className='mb-6 w-full md:mb-0 md:w-72 lg:w-80'>
            <div className='sticky top-4 rounded-xl border border-slate-200/80 bg-white/80 shadow-sm backdrop-blur-sm'>
              <div className='border-b border-gray-100 px-4 py-4'>
                <h2 className='text-lg font-medium text-gray-800'>Settings</h2>
                <p className='text-sm text-gray-500'>Manage your account preferences</p>
              </div>
              <nav className='flex flex-col space-y-2 p-3'>
                <NavItem
                  href='/settings'
                  icon={<Cog6ToothIcon className='h-5 w-5' />}
                  title='General'
                  description='App appearance & preferences'
                  active={pathname === '/settings'}
                  onClick={() => handleNavigation('/settings')}
                />
                <NavItem
                  href='/settings/profile'
                  icon={<UserCircleIcon className='h-5 w-5' />}
                  title='Profile'
                  description='Manage your personal information'
                  active={pathname === '/settings/profile'}
                  onClick={() => handleNavigation('/settings/profile')}
                />
                <NavItem
                  href='/settings/notifications'
                  icon={<BellIcon className='h-5 w-5' />}
                  title='Notifications'
                  description='Configure how you receive alerts'
                  active={pathname === '/settings/notifications'}
                  onClick={() => handleNavigation('/settings/notifications')}
                />
                <NavItem
                  href='/settings/security'
                  icon={<ShieldCheckIcon className='h-5 w-5' />}
                  title='Security & Privacy'
                  description='Password & account protection'
                  active={pathname === '/settings/security' || pathname === '/settings/change-password'}
                  onClick={() => handleNavigation('/settings/security')}
                />

                {currentUser?.isAdmin && (
                  <NavItem
                    href='/settings/admin'
                    icon={<UsersIcon className='h-5 w-5' />}
                    title='Administration'
                    description='Manage users & system operations'
                    active={pathname === '/settings/admin'}
                    onClick={() => handleNavigation('/settings/admin')}
                  />
                )}
              </nav>
            </div>
          </div>

          {/* Main content */}
          <div className='flex-1 overflow-hidden'>
            <div className='rounded-xl border border-slate-200/80 bg-white/80 p-6 shadow-sm backdrop-blur-sm'>{renderContent()}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
