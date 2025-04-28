'use client';

import { TranscriptEntry } from '@/app/types/live';
import { BoltIcon } from '@heroicons/react/24/solid';
import { formatDistanceToNow } from 'date-fns';
import { useEffect, useRef } from 'react';

interface LiveTranscriptProps {
  entries: TranscriptEntry[];
  isRecording: boolean;
}

export function LiveTranscript({ entries, isRecording }: LiveTranscriptProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to the bottom when new entries are added
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [entries]);

  if (entries.length === 0) {
    return (
      <div className='flex h-full w-full items-center justify-center p-8'>
        <div className='flex flex-col items-center text-center'>
          <div className='rounded-full bg-slate-100 p-4'>
            <svg xmlns='http://www.w3.org/2000/svg' className='h-12 w-12 text-slate-400' fill='none' viewBox='0 0 24 24' stroke='currentColor'>
              <path
                strokeLinecap='round'
                strokeLinejoin='round'
                strokeWidth={1.5}
                d='M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z'
              />
            </svg>
          </div>
          <h3 className='mt-4 text-lg font-semibold text-slate-700'>No transcript yet</h3>
          <p className='mt-1 text-sm text-slate-500'>
            {isRecording ? 'Recording in progress. Start speaking to see transcription.' : "Click 'Start Recording' to begin capturing your conversation."}
          </p>
        </div>
      </div>
    );
  }

  // Calculate the time relative to the previous message
  const getMessageTime = (entry: TranscriptEntry, index: number) => {
    try {
      const date = new Date(entry.time);

      if (index === 0 || entries[index - 1].speaker !== entry.speaker) {
        return formatDistanceToNow(date, { addSuffix: true });
      }

      return null;
    } catch (error) {
      return null; // Handle invalid dates gracefully
    }
  };

  // Group consecutive messages from the same speaker
  const getMessageClass = (entry: TranscriptEntry, index: number) => {
    const isFirst = index === 0 || entries[index - 1].speaker !== entry.speaker;
    const isLast = index === entries.length - 1 || entries[index + 1].speaker !== entry.speaker;

    let className = 'py-2 px-5 ';

    if (entry.isAI) {
      className += 'bg-gradient-to-r from-blue-50 to-blue-100 text-slate-800 border-l-2 border-blue-400 ';
    } else if (entry.speaker === 'System' && entry.text.includes('AIDE SOP OPERATIONS:')) {
      className += 'bg-gradient-to-r from-slate-100 to-slate-200 text-slate-800 border-l-2 border-blue-400 ';
    } else if (entry.speaker === 'System') {
      className += 'bg-gradient-to-r from-slate-50 to-slate-100 text-slate-500 italic text-sm border-l-2 border-slate-300 ';
    } else {
      className += 'bg-white/90 text-slate-800 border-l-2 border-slate-400 shadow-sm ';
    }

    if (isFirst && isLast) {
      className += 'rounded-xl my-2';
    } else if (isFirst) {
      className += 'rounded-t-xl mt-2 mb-0.5';
    } else if (isLast) {
      className += 'rounded-b-xl mb-2 mt-0.5';
    } else {
      className += 'my-0.5';
    }

    return className;
  };

  return (
    <div ref={scrollRef} className='h-full overflow-x-hidden overflow-y-auto bg-gradient-to-b from-white to-slate-50 p-4'>
      <div className='mx-auto w-full max-w-3xl'>
        {entries.map((entry, index) => {
          const timeLabel = getMessageTime(entry, index);
          const messageClass = getMessageClass(entry, index);
          const showSpeakerName = index === 0 || entries[index - 1].speaker !== entry.speaker;

          return (
            <div key={entry.id} className='mb-1'>
              {showSpeakerName && (
                <div className='mt-4 mb-1 flex items-center'>
                  {entry.isAI ? (
                    <div className='flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-r from-blue-500 to-blue-600 shadow-sm'>
                      <BoltIcon className='h-4 w-4 text-white' />
                    </div>
                  ) : entry.speaker === 'System' && entry.text.includes('AIDE SOP OPERATIONS:') ? (
                    <div className='flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-r from-blue-500 to-blue-600 shadow-sm'>
                      <svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='currentColor' className='h-4.5 w-4.5 text-white'>
                        <path d='M11.7 2.805a.75.75 0 0 1 .6 0A60.65 60.65 0 0 1 22.83 8.72a.75.75 0 0 1-.231 1.337 49.948 49.948 0 0 0-9.902 3.912l-.003.002c-.114.06-.227.119-.34.18a.75.75 0 0 1-.707 0A50.88 50.88 0 0 0 7.5 12.173v-.224c0-.131.067-.248.172-.311a54.03 54.03 0 0 1 4.653-2.52.75.75 0 0 0-.65-1.352 56.123 56.123 0 0 0-4.78 2.589 1.858 1.858 0 0 0-.859 1.228 49.921 49.921 0 0 0-4.634-1.527.75.75 0 0 1-.231-1.337A60.653 60.653 0 0 1 11.7 2.805Z' />
                        <path d='M13.06 15.473a48.45 48.45 0 0 1 7.666-3.282c.134 1.414.22 2.843.255 4.284a.75.75 0 0 1-.46.71 47.87 47.87 0 0 0-8.105 4.342.75.75 0 0 1-.832 0 47.87 47.87 0 0 0-8.104-4.342.75.75 0 0 1-.461-.71c.035-1.442.121-2.87.255-4.286.921.304 1.83.634 2.726.99v1.27a1.5 1.5 0 0 0-.14 2.508c-.09.38-.222.753-.397 1.11.452.213.901.434 1.346.661a6.727 6.727 0 0 0 .551-1.608 1.5 1.5 0 0 0 .14-2.67v-.645a48.549 48.549 0 0 1 3.44 1.667 2.25 2.25 0 0 0 2.12 0Z' />
                        <path d='M4.462 19.462c.42-.419.753-.89 1-1.395.453.214.902.435 1.347.662a6.742 6.742 0 0 1-1.286 1.794.75.75 0 0 1-1.06-1.06Z' />
                      </svg>
                    </div>
                  ) : entry.speaker === 'System' ? (
                    <div className='flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-r from-slate-300 to-slate-400 shadow-sm'>
                      <svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='currentColor' className='h-4.5 w-4.5 text-white'>
                        <path
                          fillRule='evenodd'
                          d='M11.078 2.25c-.917 0-1.699.663-1.85 1.567L9.05 4.889c-.02.12-.115.26-.297.348a7.493 7.493 0 0 0-.986.57c-.166.115-.334.126-.45.083L6.3 5.508a1.875 1.875 0 0 0-2.282.819l-.922 1.597a1.875 1.875 0 0 0 .432 2.385l.84.692c.095.078.17.229.154.43a7.598 7.598 0 0 0 0 1.139c.015.2-.059.352-.153.43l-.841.692a1.875 1.875 0 0 0-.432 2.385l.922 1.597a1.875 1.875 0 0 0 2.282.818l1.019-.382c.115-.043.283-.031.45.082.312.214.641.405.986.57.182.088.277.228.297.35l.178 1.071c.151.904.933 1.567 1.85 1.567h1.844c.916 0 1.699-.663 1.85-1.567l.178-1.072c.02-.12.114-.26.297-.349.344-.165.673-.356.985-.57.167-.114.335-.125.45-.082l1.02.382a1.875 1.875 0 0 0 2.28-.819l.923-1.597a1.875 1.875 0 0 0-.432-2.385l-.84-.692c-.095-.078-.17-.229-.154-.43a7.614 7.614 0 0 0 0-1.139c-.016-.2.059-.352.153-.43l.84-.692c.708-.582.891-1.59.433-2.385l-.922-1.597a1.875 1.875 0 0 0-2.282-.818l-1.02.382c-.114.043-.282.031-.449-.083a7.49 7.49 0 0 0-.985-.57c-.183-.087-.277-.227-.297-.348l-.179-1.072a1.875 1.875 0 0 0-1.85-1.567h-1.843ZM12 15.75a3.75 3.75 0 1 0 0-7.5 3.75 3.75 0 0 0 0 7.5Z'
                          clipRule='evenodd'
                        />
                      </svg>
                    </div>
                  ) : (
                    <div className='h-8 w-8 flex-shrink-0 overflow-hidden rounded-full border border-slate-200 shadow-sm'>
                      <img src='/profile/profile-picture-1.jpg' alt='User' className='h-full w-full object-cover' />
                    </div>
                  )}
                  <span className='ml-2 font-medium text-slate-700'>{entry.speaker}</span>
                  {timeLabel && <span className='ml-2 text-xs text-slate-400'>{timeLabel}</span>}
                </div>
              )}
              <div className={messageClass}>
                <div className='text-base leading-relaxed'>
                  {entry.speaker === 'System' && entry.text.includes('AIDE SOP OPERATIONS:') ? (
                    <pre className='font-mono text-xs whitespace-pre-wrap text-slate-700'>{entry.text}</pre>
                  ) : (
                    entry.text
                  )}
                  {entry.isStreaming && (
                    <span className='ml-1 inline-block h-4 w-2 align-middle'>
                      <span className='inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-blue-500'></span>
                    </span>
                  )}
                </div>
              </div>
            </div>
          );
        })}

        {isRecording && (
          <div className='mt-4 flex items-center space-x-2 text-slate-500'>
            <div className='h-2.5 w-2.5 animate-pulse rounded-full bg-red-500 shadow-sm'></div>
            <p className='text-sm font-medium'>Recording in progress...</p>
          </div>
        )}

        {/* Add extra space at the bottom to improve scrolling UX and ensure messages aren't hidden behind the input */}
        <div className='h-32'></div>
      </div>
    </div>
  );
}
