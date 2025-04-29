'use client';

import { UserAvatar } from '@/app/components/ui/avatars/UserAvatar';
import { Tag } from '@/app/components/ui/tags/Tag';
import { useSchedule } from '../hooks/useSchedule';
// Default empty data instead of importing mock data
const mockDirectories = [{ id: 'client-onboarding', name: 'Client Onboarding', color: 'bg-blue-500' }];
const mockEventTypes = [
  {
    id: 'client-onboarding-process',
    title: 'Client Onboarding',
    directoryId: 'client-onboarding',
    estimatedTime: '30 min',
    complexity: 3,
    description: 'Initial client onboarding process',
    tags: ['Client', 'Onboarding'],
  },
];

export function ScheduleDetails() {
  const { room: conversation, formState } = useSchedule();

  // Find the currently selected event type and directory
  const selectedEventType = mockEventTypes.find((type) => type.id === formState.eventType);
  const selectedDirectory = mockDirectories.find((dir) => dir.id === formState.directoryId);

  return (
    <div className='flex h-full w-full flex-col items-center justify-center p-6'>
      {selectedEventType && (
        <div className='w-full max-w-xl space-y-6'>
          {/* Preview header */}
          <div className='border-b border-slate-100'>
            <h3 className='text-left text-base font-medium text-slate-500'>Event Preview</h3>
          </div>

          {/* Header section */}
          <div>
            {selectedDirectory && (
              <div className='mb-2 flex items-center'>
                <span className={`inline-block h-3 w-3 rounded-full ${selectedDirectory.color} mr-2`}></span>
                <span className='text-base font-medium text-slate-500'>{selectedDirectory.name}</span>
              </div>
            )}

            <h2 className='mb-2 text-3xl font-bold text-slate-800'>{selectedEventType.title}</h2>

            <div className='flex items-center space-x-5 text-base text-slate-500'>
              <div className='flex items-center'>
                <svg className='mr-1 h-5 w-5' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                  <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z' />
                </svg>
                <span>{selectedEventType?.estimatedTime || conversation.duration}</span>
              </div>

              {selectedEventType?.complexity && (
                <div className='flex items-center'>
                  <svg className='mr-1 h-5 w-5' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                    <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M13 10V3L4 14h7v7l9-11h-7z' />
                  </svg>
                  <div className='flex items-center'>
                    {[...Array(5)].map((_, index) => (
                      <div
                        key={index}
                        className={`mx-0.5 h-2 w-2 rounded-full ${
                          index < selectedEventType.complexity ? `${selectedDirectory?.color.replace('bg-', 'bg-opacity-80 bg-')}` : 'bg-slate-200'
                        }`}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Description */}
          <p className='text-left text-lg text-slate-600'>{selectedEventType?.description || conversation.description}</p>

          {/* Tags */}
          {selectedEventType?.tags && selectedEventType.tags.length > 0 && (
            <div className='flex flex-wrap justify-start gap-2'>
              {selectedEventType.tags.map((tag, index) => (
                <Tag key={index} className='bg-slate-100 text-base text-slate-700 transition-colors hover:bg-slate-200'>
                  {tag}
                </Tag>
              ))}
            </div>
          )}

          {/* Host info */}
          <div className='mt-auto border-t border-slate-100 pt-5'>
            <div className='flex items-center justify-start space-x-3'>
              <UserAvatar
                user={{
                  name: conversation.host.name,
                  profileImage: conversation.host.avatarUrl,
                }}
                size='md'
              />
              <div>
                <p className='text-base font-medium text-slate-700'>{conversation.host.name}</p>
                <p className='text-sm text-slate-500'>{conversation.host.role}</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
