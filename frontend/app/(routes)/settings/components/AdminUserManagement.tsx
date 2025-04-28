'use client';

import { Dialog } from '@/app/components/ui/dialog/Dialog';
import AdminService, { CreateUserData, UpdateUserData, User } from '@/app/services/adminService';
import { ArrowPathIcon, CheckIcon, PencilIcon, PlusIcon, TrashIcon, XMarkIcon } from '@heroicons/react/24/outline';
import React, { useEffect, useState } from 'react';

export default function AdminUserManagement() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [showConfirmDelete, setShowConfirmDelete] = useState<string | null>(null);

  // Form data for creating/editing
  const [formData, setFormData] = useState<CreateUserData | UpdateUserData>({
    name: '',
    handle: '',
    email: '',
    password: '',
    isAdmin: false,
  });

  const loadUsers = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await AdminService.getUsers();
      if (response.error) {
        setError(response.error);
      } else {
        setUsers(response.data || []);
      }
    } catch (err) {
      setError('Failed to load users');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const handleCreateUser = async () => {
    if (!formData.name || !formData.handle || !formData.email || !(formData as CreateUserData).password) {
      setError('Please fill out all required fields');
      return;
    }

    setLoading(true);

    try {
      const result = await AdminService.createUser(formData as CreateUserData);
      if (result.error) {
        setError(result.error);
      } else {
        setUsers([...(users || []), result.data!]);
        setIsCreateModalOpen(false);
        resetForm();
      }
    } catch (err) {
      setError('Failed to create user');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateUser = async () => {
    if (!editingUser || !formData.name || !formData.handle || !formData.email) {
      setError('Please fill out all required fields');
      return;
    }

    setLoading(true);

    try {
      // Remove password if it's empty (for updates)
      const updateData = { ...formData };
      if ('password' in updateData && !updateData.password) {
        delete (updateData as any).password;
      }

      const result = await AdminService.updateUser(editingUser.id, updateData);
      if (result.error) {
        setError(result.error);
      } else {
        setUsers(users.map((user) => (user.id === editingUser.id ? result.data! : user)));
        setEditingUser(null);
        resetForm();
      }
    } catch (err) {
      setError('Failed to update user');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteUser = async (userId: string) => {
    setLoading(true);

    try {
      const result = await AdminService.deleteUser(userId);
      if (result.error) {
        setError(result.error);
      } else {
        setUsers(users.filter((user) => user.id !== userId));
        setShowConfirmDelete(null);
      }
    } catch (err) {
      setError('Failed to delete user');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const startEditUser = (user: User) => {
    setEditingUser(user);
    setFormData({
      name: user.name,
      handle: user.handle,
      email: user.email,
      profileImage: user.profileImage,
      bio: user.bio,
      isAdmin: user.isAdmin,
    });
  };

  const resetForm = () => {
    setFormData({
      name: '',
      handle: '',
      email: '',
      password: '',
      isAdmin: false,
    });
    setError(null);
  };

  const cancelEdit = () => {
    setEditingUser(null);
    resetForm();
  };

  const handleInputChange = (e: React.ChangeEvent) => {
    const { name, value, type } = e.target;
    if (type === 'checkbox') {
      setFormData({
        ...formData,
        [name]: (e.target as HTMLInputElement).checked,
      });
    } else {
      setFormData({
        ...formData,
        [name]: value,
      });
    }
  };

  return (
    <div className='h-full w-full max-w-full space-y-6 overflow-auto'>
      <div className='flex flex-wrap items-center justify-between gap-4'>
        <h1 className='text-2xl font-semibold'>User Management</h1>
        <div className='flex flex-wrap gap-2'>
          <button
            onClick={() => {
              setIsCreateModalOpen(true);
              resetForm();
            }}
            className='flex items-center rounded bg-blue-500 px-4 py-2 text-white hover:bg-blue-600'
          >
            <PlusIcon className='mr-2 h-5 w-5' />
            Add User
          </button>
          <button onClick={loadUsers} className='flex items-center rounded bg-gray-200 px-4 py-2 text-gray-700 hover:bg-gray-300' disabled={loading}>
            <ArrowPathIcon className={`mr-2 h-5 w-5 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      {error && (
        <div className='rounded border border-red-300 bg-red-50 p-3 break-words text-red-800'>
          <p>{error}</p>
        </div>
      )}

      {/* User List */}
      <div className='max-w-full overflow-x-auto overflow-y-auto rounded-lg border border-gray-200'>
        <table className='w-full table-fixed divide-y divide-gray-200 md:table-auto'>
          <thead className='bg-gray-50'>
            <tr>
              <th scope='col' className='px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase'>
                User
              </th>
              <th scope='col' className='px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase'>
                Email
              </th>
              <th scope='col' className='px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase'>
                Handle
              </th>
              <th scope='col' className='px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase'>
                Admin
              </th>
              <th scope='col' className='px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase'>
                Created
              </th>
              <th scope='col' className='px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase'>
                Actions
              </th>
            </tr>
          </thead>
          <tbody className='divide-y divide-gray-200 bg-white'>
            {loading && users.length === 0 ? (
              <tr>
                <td colSpan={6} className='px-6 py-4 text-center text-sm font-medium text-gray-500'>
                  Loading users...
                </td>
              </tr>
            ) : users.length === 0 ? (
              <tr>
                <td colSpan={6} className='px-6 py-4 text-center text-sm font-medium text-gray-500'>
                  No users found
                </td>
              </tr>
            ) : (
              users.map((user) => (
                <tr key={user.id} className='hover:bg-gray-50'>
                  <td className='px-6 py-4 whitespace-nowrap'>
                    <div className='flex items-center'>
                      {user.profileImage ? (
                        <img
                          className='mr-3 h-10 w-10 rounded-full object-cover'
                          src={user.profileImage}
                          alt={user.name}
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = '/profile/profile.jpg';
                          }}
                        />
                      ) : (
                        <div className='mr-3 flex h-10 w-10 items-center justify-center rounded-full bg-gray-200 font-medium text-gray-600'>
                          {user.name.charAt(0).toUpperCase()}
                        </div>
                      )}
                      <div>
                        <div className='text-sm font-medium text-gray-900'>{user.name}</div>
                        {user.bio && <div className='line-clamp-1 text-sm text-gray-500'>{user.bio}</div>}
                      </div>
                    </div>
                  </td>
                  <td className='px-6 py-4 text-sm whitespace-nowrap text-gray-500'>{user.email}</td>
                  <td className='px-6 py-4 text-sm whitespace-nowrap text-gray-500'>@{user.handle}</td>
                  <td className='px-6 py-4 text-sm whitespace-nowrap text-gray-500'>
                    {user.isAdmin ? (
                      <span className='rounded-full bg-green-100 px-2 py-1 text-xs font-medium text-green-800'>Yes</span>
                    ) : (
                      <span className='rounded-full bg-gray-100 px-2 py-1 text-xs font-medium text-gray-800'>No</span>
                    )}
                  </td>
                  <td className='px-6 py-4 text-sm whitespace-nowrap text-gray-500'>{new Date(user.createdAt).toLocaleDateString()}</td>
                  <td className='px-6 py-4 text-sm font-medium whitespace-nowrap'>
                    {showConfirmDelete === user.id ? (
                      <div className='flex items-center space-x-2'>
                        <button
                          onClick={() => handleDeleteUser(user.id)}
                          className='rounded bg-red-500 p-1.5 text-white hover:bg-red-600'
                          title='Confirm delete'
                        >
                          <CheckIcon className='h-4 w-4' />
                        </button>
                        <button onClick={() => setShowConfirmDelete(null)} className='rounded bg-gray-200 p-1.5 text-gray-700 hover:bg-gray-300' title='Cancel'>
                          <XMarkIcon className='h-4 w-4' />
                        </button>
                      </div>
                    ) : (
                      <div className='flex items-center space-x-2'>
                        <button onClick={() => startEditUser(user)} className='rounded bg-blue-100 p-1.5 text-blue-600 hover:bg-blue-200' title='Edit user'>
                          <PencilIcon className='h-4 w-4' />
                        </button>
                        <button
                          onClick={() => setShowConfirmDelete(user.id)}
                          className='rounded bg-red-100 p-1.5 text-red-600 hover:bg-red-200'
                          title='Delete user'
                        >
                          <TrashIcon className='h-4 w-4' />
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Create User Modal */}
      <Dialog isOpen={isCreateModalOpen} onClose={() => setIsCreateModalOpen(false)} title='Create New User' maxWidth='md'>
        <div className='max-h-[70vh] w-full space-y-4 overflow-y-auto pr-2'>
          <div>
            <label className='block text-sm font-medium text-gray-700'>Name</label>
            <input
              type='text'
              name='name'
              value={formData.name}
              onChange={handleInputChange}
              className='mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:ring-blue-500 focus:outline-none sm:text-sm'
              required
            />
          </div>

          <div>
            <label className='block text-sm font-medium text-gray-700'>Handle</label>
            <div className='mt-1 flex rounded-md shadow-sm'>
              <span className='inline-flex items-center rounded-l-md border border-r-0 border-gray-300 bg-gray-50 px-3 text-gray-500 sm:text-sm'>@</span>
              <input
                type='text'
                name='handle'
                value={formData.handle}
                onChange={handleInputChange}
                className='block w-full flex-1 rounded-none rounded-r-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:ring-blue-500 focus:outline-none sm:text-sm'
                required
              />
            </div>
          </div>

          <div>
            <label className='block text-sm font-medium text-gray-700'>Email</label>
            <input
              type='email'
              name='email'
              value={formData.email}
              onChange={handleInputChange}
              className='mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:ring-blue-500 focus:outline-none sm:text-sm'
              required
            />
          </div>

          <div>
            <label className='block text-sm font-medium text-gray-700'>Password</label>
            <input
              type='password'
              name='password'
              value={(formData as CreateUserData).password || ''}
              onChange={handleInputChange}
              className='mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:ring-blue-500 focus:outline-none sm:text-sm'
              required
            />
          </div>

          <div>
            <label className='block text-sm font-medium text-gray-700'>Profile Image URL (optional)</label>
            <input
              type='text'
              name='profileImage'
              value={formData.profileImage || ''}
              onChange={handleInputChange}
              className='mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:ring-blue-500 focus:outline-none sm:text-sm'
            />
          </div>

          <div>
            <label className='block text-sm font-medium text-gray-700'>Bio (optional)</label>
            <textarea
              name='bio'
              value={formData.bio || ''}
              onChange={handleInputChange}
              rows={3}
              className='mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:ring-blue-500 focus:outline-none sm:text-sm'
            />
          </div>

          <div className='flex items-center'>
            <input
              type='checkbox'
              name='isAdmin'
              checked={formData.isAdmin || false}
              onChange={(e) => handleInputChange(e)}
              className='h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500'
            />
            <label className='ml-2 block text-sm text-gray-700'>Admin User</label>
          </div>

          <div className='mt-6 flex justify-end space-x-3 border-t border-gray-200 pt-4'>
            <button
              onClick={() => setIsCreateModalOpen(false)}
              className='rounded-md border border-gray-300 bg-white/80 px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:outline-none'
            >
              Cancel
            </button>
            <button
              onClick={handleCreateUser}
              className='rounded-md border border-transparent bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:outline-none'
              disabled={loading}
            >
              {loading ? 'Creating...' : 'Create User'}
            </button>
          </div>
        </div>
      </Dialog>

      {/* Edit User Modal */}
      <Dialog isOpen={!!editingUser} onClose={cancelEdit} title='Edit User' maxWidth='md'>
        <div className='max-h-[70vh] w-full space-y-4 overflow-y-auto pr-2'>
          <div>
            <label className='block text-sm font-medium text-gray-700'>Name</label>
            <input
              type='text'
              name='name'
              value={formData.name}
              onChange={handleInputChange}
              className='mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:ring-blue-500 focus:outline-none sm:text-sm'
              required
            />
          </div>

          <div>
            <label className='block text-sm font-medium text-gray-700'>Handle</label>
            <div className='mt-1 flex rounded-md shadow-sm'>
              <span className='inline-flex items-center rounded-l-md border border-r-0 border-gray-300 bg-gray-50 px-3 text-gray-500 sm:text-sm'>@</span>
              <input
                type='text'
                name='handle'
                value={formData.handle}
                onChange={handleInputChange}
                className='block w-full flex-1 rounded-none rounded-r-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:ring-blue-500 focus:outline-none sm:text-sm'
                required
              />
            </div>
          </div>

          <div>
            <label className='block text-sm font-medium text-gray-700'>Email</label>
            <input
              type='email'
              name='email'
              value={formData.email}
              onChange={handleInputChange}
              className='mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:ring-blue-500 focus:outline-none sm:text-sm'
              required
            />
          </div>

          <div>
            <label className='block text-sm font-medium text-gray-700'>New Password (leave blank to keep current)</label>
            <input
              type='password'
              name='password'
              value={(formData as CreateUserData).password || ''}
              onChange={handleInputChange}
              className='mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:ring-blue-500 focus:outline-none sm:text-sm'
            />
          </div>

          <div>
            <label className='block text-sm font-medium text-gray-700'>Profile Image URL (optional)</label>
            <input
              type='text'
              name='profileImage'
              value={formData.profileImage || ''}
              onChange={handleInputChange}
              className='mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:ring-blue-500 focus:outline-none sm:text-sm'
            />
          </div>

          <div>
            <label className='block text-sm font-medium text-gray-700'>Bio (optional)</label>
            <textarea
              name='bio'
              value={formData.bio || ''}
              onChange={handleInputChange}
              rows={3}
              className='mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:ring-blue-500 focus:outline-none sm:text-sm'
            />
          </div>

          <div className='flex items-center'>
            <input
              type='checkbox'
              name='isAdmin'
              checked={formData.isAdmin || false}
              onChange={(e) => handleInputChange(e)}
              className='h-5 w-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500'
            />
            <label className='ml-2 block text-sm text-gray-700'>Admin User</label>
          </div>

          <div className='mt-6 flex justify-end space-x-3 border-t border-gray-200 pt-4'>
            <button
              onClick={cancelEdit}
              className='rounded-md border border-gray-300 bg-white/80 px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:outline-none'
            >
              Cancel
            </button>
            <button
              onClick={handleUpdateUser}
              className='rounded-md border border-transparent bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:outline-none'
              disabled={loading}
            >
              {loading ? 'Updating...' : 'Update User'}
            </button>
          </div>
        </div>
      </Dialog>
    </div>
  );
}
