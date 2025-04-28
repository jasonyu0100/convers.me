import logger from '@/app/lib/logger';
import { useRef, useState } from 'react';
import { PostQuoteProps } from './types';

export function PostQuote({ text, isAudio, sourceName, roomName, onClick, audioSource }: PostQuoteProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const handlePlayAudio = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isAudio || !audioRef.current) return;

    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play().catch((err) => logger.error('Error playing audio:', err));
    }
    setIsPlaying(!isPlaying);
  };

  const handleAudioEnded = () => {
    setIsPlaying(false);
  };

  return (
    <div className='relative mb-2 w-full max-w-[360px]'>
      {/* Room indicator removed - handled in PostItem */}

      <div className='w-full rounded-md border border-slate-200 bg-white/80 p-3'>
        <blockquote className='border-l-3 border-blue-400 pl-3 text-sm text-gray-600 italic'>"{text}"</blockquote>

        <div className='mt-2 flex items-center justify-between border-t border-slate-100 pt-2'>
          {sourceName && <span className='text-xs text-gray-500'>— {sourceName}</span>}

          {isAudio && (
            <button className='flex items-center text-xs text-blue-600' onClick={handlePlayAudio}>
              {isPlaying ? (
                <>
                  <svg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' strokeWidth={1.5} stroke='currentColor' className='mr-1 h-4 w-4'>
                    <path strokeLinecap='round' strokeLinejoin='round' d='M15.75 5.25v13.5m-7.5-13.5v13.5' />
                  </svg>
                  Pause
                </>
              ) : (
                <>
                  <svg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' strokeWidth={1.5} stroke='currentColor' className='mr-1 h-4 w-4'>
                    <path
                      strokeLinecap='round'
                      strokeLinejoin='round'
                      d='M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.347a1.125 1.125 0 0 1 0 1.972l-11.54 6.347a1.125 1.125 0 0 1-1.667-.986V5.653Z'
                    />
                  </svg>
                  Play
                </>
              )}
            </button>
          )}
        </div>

        {isAudio && (
          <audio ref={audioRef} src={audioSource || '/audio/stock-audio-1.mp3'} onEnded={handleAudioEnded} onPause={handleAudioEnded} className='hidden' />
        )}
      </div>
    </div>
  );
}
