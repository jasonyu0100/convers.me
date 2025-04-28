'use client';

import { Dialog } from '@/app/components/ui/dialog/Dialog';
import { CreateDirectoryData, DirectoryService } from '@/app/services/directoryService';
import { useEffect, useState } from 'react';

interface CreateDirectoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (directoryId: string) => void;
  parentDirectoryId?: string;
}

const colorOptions = [
  { name: 'Blue', value: 'bg-blue-500' },
  { name: 'Purple', value: 'bg-purple-500' },
  { name: 'Green', value: 'bg-green-500' },
  { name: 'Red', value: 'bg-red-500' },
  { name: 'Yellow', value: 'bg-yellow-500' },
  { name: 'Pink', value: 'bg-pink-500' },
  { name: 'Indigo', value: 'bg-indigo-500' },
  { name: 'Teal', value: 'bg-teal-500' },
  { name: 'Orange', value: 'bg-orange-500' },
  { name: 'Gray', value: 'bg-gray-500' },
];

export function CreateDirectoryModal({ isOpen, onClose, onSuccess, parentDirectoryId }: CreateDirectoryModalProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [color, setColor] = useState('bg-blue-500');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Reset form when modal is opened
  useEffect(() => {
    if (isOpen) {
      setError(null);
    }
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      setError('Directory name is required');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const directoryData: CreateDirectoryData = {
        name: name.trim(),
        description: description.trim() || undefined,
        color,
        parent_id: parentDirectoryId,
      };

      const result = await DirectoryService.createDirectory(directoryData);

      if (result.error) {
        setError(result.error);
      } else if (result.data) {
        // Reset form
        setName('');
        setDescription('');
        setColor('bg-blue-500');

        // Close modal and notify parent
        onSuccess(result.data.id);
        onClose();
      }
    } catch (err) {
      setError('Failed to create directory. Please try again.');
      console.error('Error creating directory:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog isOpen={isOpen} onClose={onClose} title='Create Directory' maxWidth='md'>
      {error && <div className='mb-4 rounded-md bg-red-50 p-3 text-sm text-red-600'>{error}</div>}

      <form onSubmit={handleSubmit}>
        <div className='mb-4'>
          <label htmlFor='name' className='mb-1 block text-sm font-medium text-slate-700'>
            Directory Name*
          </label>
          <input
            id='name'
            type='text'
            value={name}
            onChange={(e) => setName(e.target.value)}
            className='w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none'
            placeholder='My Directory'
            required
          />
        </div>

        <div className='mb-4'>
          <label htmlFor='description' className='mb-1 block text-sm font-medium text-slate-700'>
            Description (Optional)
          </label>
          <textarea
            id='description'
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className='w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none'
            placeholder='What this directory contains'
            rows={2}
          />
        </div>

        <div className='mb-6'>
          <p className='mb-2 text-sm font-medium text-slate-700'>Color</p>
          <div className='flex flex-wrap gap-2'>
            {colorOptions.map((option) => (
              <button
                key={option.value}
                type='button'
                onClick={() => setColor(option.value)}
                className={`h-6 w-6 rounded-full ${option.value} ${color === option.value ? 'ring-2 ring-blue-500 ring-offset-2' : ''}`}
                title={option.name}
              />
            ))}
          </div>
        </div>

        <div className='flex justify-end gap-3'>
          <button
            type='button'
            onClick={onClose}
            className='rounded-lg border border-slate-300 bg-white/80 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50'
            disabled={isSubmitting}
          >
            Cancel
          </button>
          <button
            type='submit'
            className='rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-70'
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Creating...' : 'Create Directory'}
          </button>
        </div>
      </form>
    </Dialog>
  );
}
