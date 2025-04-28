'use client';

import { MediaControlState, MediaControls as MediaControlsType } from '@/app/types/live';
import { ComputerDesktopIcon, MicrophoneIcon, VideoCameraIcon } from '@heroicons/react/24/outline';

interface MediaControlsProps {
  mediaControls: MediaControlsType;
  elapsedTime: string;
  microphoneStream?: MediaStream | null;
}

export function MediaControls({ mediaControls, elapsedTime, microphoneStream = null }: MediaControlsProps) {
  // Helper function to determine button styling based on state with modern styling
  const getButtonClass = (state: MediaControlState) => {
    if (state === MediaControlState.LOADING) {
      return 'animate-pulse bg-slate-300 text-slate-600';
    }
    return state === MediaControlState.ON
      ? 'bg-blue-500 text-white shadow-md ring-2 ring-blue-200'
      : 'bg-slate-200 text-slate-700 hover:bg-slate-300 hover:text-slate-800 shadow-sm';
  };

  return (
    <div className='relative flex flex-row items-center justify-between'>
      <div className='flex space-x-3'>
        <button
          className={`flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-full transition-all ${getButtonClass(mediaControls.microphone)}`}
          onClick={() => mediaControls.toggleMicrophone()}
          disabled={mediaControls.microphone === MediaControlState.LOADING}
          title='Toggle microphone'
        >
          <MicrophoneIcon className='size-5' />
        </button>

        <button
          className={`flex h-11 w-11 items-center justify-center rounded-full transition-all ${getButtonClass(mediaControls.camera)}`}
          onClick={() => mediaControls.toggleCamera()}
          disabled={mediaControls.camera === MediaControlState.LOADING}
          title='Toggle camera'
        >
          <VideoCameraIcon className='size-5' />
        </button>

        <button
          className={`flex h-11 w-11 items-center justify-center rounded-full transition-all ${getButtonClass(mediaControls.screen)}`}
          onClick={() => mediaControls.toggleScreenShare()}
          disabled={mediaControls.screen === MediaControlState.LOADING}
          title='Toggle screen sharing'
        >
          <ComputerDesktopIcon className='size-5' />
        </button>
      </div>

      <div className='flex h-8 items-center justify-center rounded-full border border-slate-300 bg-slate-200 px-4 shadow-sm'>
        <p className='text-sm font-medium text-slate-700'>{elapsedTime}</p>
      </div>
    </div>
  );
}
