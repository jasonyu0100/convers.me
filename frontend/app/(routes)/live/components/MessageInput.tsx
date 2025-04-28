'use client';

import { MessageInputProps } from '@/app/types/live';
import { ArrowUpIcon, PaperClipIcon, MicrophoneIcon } from '@heroicons/react/24/solid';
import React, { FormEvent, KeyboardEvent, useEffect, useRef, useState } from 'react';

export function MessageInput({ onSendMessage, isDisabled = false, placeholder = 'Type a message...' }: MessageInputProps) {
  const [message, setMessage] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-focus the textarea when component mounts
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.focus();
    }
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (message.trim() && !isDisabled) {
      onSendMessage(message);
      setMessage('');

      // Re-focus the textarea after sending
      if (textareaRef.current) {
        textareaRef.current.focus();
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const buttonEnabled = message.trim() && !isDisabled;
  const buttonClasses = buttonEnabled
    ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-md hover:from-blue-600 hover:to-blue-700'
    : 'cursor-not-allowed bg-slate-200 text-slate-400';

  return (
    <form onSubmit={handleSubmit} className='flex w-full flex-col overflow-hidden rounded-xl border border-slate-200 bg-white/90 shadow-md transition-all'>
      <div className='flex w-full items-center'>
        <div className='flex flex-1 items-center'>
          <textarea
            ref={textareaRef}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            disabled={isDisabled}
            className='max-h-[120px] min-h-[56px] w-full resize-none border-none bg-transparent px-4 py-3.5 text-slate-700 placeholder-slate-400 outline-none focus:ring-0'
            rows={1}
          />
        </div>

        <div className='flex items-center px-2'>
          {/* Optional attachment button - for future implementation */}
          <button
            type='button'
            disabled={isDisabled}
            className='mr-2 flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-slate-500 transition-all hover:bg-slate-200'
            aria-label='Add attachment'
          >
            <PaperClipIcon className='h-4 w-4' />
          </button>

          {/* Send button */}
          <button
            type='submit'
            disabled={!buttonEnabled}
            className={`flex h-10 w-10 items-center justify-center rounded-full transition-all ${buttonClasses}`}
            aria-label='Send message'
          >
            <ArrowUpIcon className='h-5 w-5' />
          </button>
        </div>
      </div>
    </form>
  );
}
