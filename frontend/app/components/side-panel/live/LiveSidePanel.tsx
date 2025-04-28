'use client';

import { useLive } from '@/app/(routes)/live/hooks';
import { useApp } from '@/app/components/app/hooks';
import { AppRoute } from '@/app/components/router';
import { Tag } from '@/app/components/ui/tags';
import { MediaControlState } from '@/app/types/live';
import { RoomStatus } from '@/app/types/room';
import { ArrowLeftIcon, StopIcon } from '@heroicons/react/24/outline';
import { useRouter } from 'next/navigation';
import { useRef, useState } from 'react';
import { SidePanelBase } from '../SidePanelBase';
import { AudioWaveform } from './AudioWaveform';
import { MediaControls } from './MediaControls';

/**
 * Main conversation side panel component
 * Provides controls for recording and ending the live session
 * and displays room information
 */
export function LiveSidePanel() {
  const app = useApp();
  const router = useRouter();
  const live = useLive();

  const handleBackClick = () => {
    // Navigate back to room if eventId exists
    if (live.eventId) {
      router.push(`/room?id=${live.eventId}`);
    } else {
      // Fallback to main view if no eventId
      router.push('/');
    }
  };

  const handleEndConversation = () => {
    // First stop recording if active
    if (live.isRecording) {
      live.stopRecording();
    }

    // Transcript and summaries are already shared through AppContext
    // No need to manually pass them between components

    // Navigate to summary view
    app.setMainView(AppRoute.SUMMARY);
    router.push('/summary');
  };

  // Define action buttons
  const actionButtons = [
    {
      label: 'Back to Room',
      icon: <ArrowLeftIcon className='size-6' />,
      onClick: handleBackClick,
      bgColor: 'bg-blue-500',
      hoverColor: 'hover:bg-blue-600',
      ringColor: 'ring-2 ring-slate-200',
    },
    {
      label: 'Complete Live',
      icon: <StopIcon className='size-6' />,
      onClick: handleEndConversation,
      route: '/room',
      appRoute: AppRoute.ROOM,
      bgColor: 'bg-slate-200',
      hoverColor: 'hover:bg-slate-300',
      textColor: 'text-slate-700',
      ringColor: 'ring-1 ring-slate-300',
    },
  ];

  return (
    <SidePanelBase
      actionButtons={actionButtons}
      sections={[
        {
          title: 'LIVE CONTROLS',
          content: live.mediaControls ? (
            <div className='mb-4'>
              <MediaControls mediaControls={live.mediaControls} elapsedTime={live.elapsedTime || '00:00'} microphoneStream={live.microphoneStream} />
              {live.mediaControls.microphone === MediaControlState.ON && live.microphoneStream && (
                <div className='mt-3 flex items-center justify-center'>
                  <AudioWaveform audioStream={live.microphoneStream} isActive={true} width={220} height={40} color='#3b82f6' />
                </div>
              )}
            </div>
          ) : null,
        },
        {
          title: 'ROOM DETAILS',
          content: <LiveRoomCard />,
        },
      ]}
    />
  );
}

/**
 * Room card component for the live side panel
 */
function LiveRoomCard() {
  const live = useLive();

  // Use live context data or fallback to defaults
  const roomData = {
    id: live.eventId || 'no-event',
    title: live.title || 'Live Session',
    description: live.description || 'Active live session for collaboration and discussion.',
    status: live.liveMode ? (live.liveMode as RoomStatus) : 'Active',
    duration: live.duration || '30 minutes',
    complexity: live.complexity || 3,
    tags: live.tags || ['Live', 'Session'],
  };

  // Function to display complexity as dots
  const renderComplexity = (level: number = 3) => {
    const dots = [];
    const maxDots = 5;

    for (let i = 1; i <= maxDots; i++) {
      dots.push(<div key={i} className={`mx-0.5 h-2 w-2 rounded-full ${i <= level ? 'bg-blue-500 shadow-sm' : 'border border-slate-300 bg-slate-200'}`} />);
    }

    return <div className='flex items-center'>{dots}</div>;
  };

  // Status handling is now managed at the room level

  return (
    <div className='w-full space-y-3'>
      <div className='flex items-center justify-between'>
        <div className='flex-1 overflow-auto'>
          <p className='text-base font-bold'>{roomData.title}</p>
        </div>
      </div>

      <div className='flex items-center space-x-2'>
        <div className='flex items-center text-slate-500'>
          <svg className='mr-1 h-4 w-4' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
            <path strokeLinecap='round' strokeLinejoin='round' strokeWidth='2' d='M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z'></path>
          </svg>
          <span className='text-xs'>{roomData.duration}</span>
        </div>
        <div className='flex items-center text-slate-500'>
          <svg className='mr-1 h-4 w-4' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
            <path strokeLinecap='round' strokeLinejoin='round' strokeWidth='2' d='M13 10V3L4 14h7v7l9-11h-7z' />
          </svg>
          <span className='mr-1 text-xs font-medium text-slate-500'>Complexity:</span>
        </div>
        {renderComplexity(roomData.complexity)}
      </div>

      <p className='text-xs font-medium text-slate-600'>{roomData.description}</p>

      <div className='flex flex-wrap justify-start gap-1.5'>
        {roomData.tags.map((tag, index) => (
          <Tag key={index} className='rounded-md border border-slate-300 bg-slate-200 text-sm text-slate-700 shadow-sm transition-colors hover:bg-slate-300'>
            {tag}
          </Tag>
        ))}
      </div>
    </div>
  );
}
