'use client';

import { Dialog as HeadlessDialog, Transition } from '@headlessui/react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { Fragment, ReactNode } from 'react';

export interface DialogProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  maxWidth?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl' | '5xl' | 'full';
  showCloseButton?: boolean;
  variant?: 'default' | 'borderless';
}

const maxWidthClasses = {
  xs: 'max-w-xs',
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-xl',
  '2xl': 'max-w-2xl',
  '3xl': 'max-w-3xl',
  '4xl': 'max-w-4xl',
  '5xl': 'max-w-5xl',
  full: 'max-w-full',
};

export function Dialog({ isOpen, onClose, title, children, maxWidth = 'md', showCloseButton = true, variant = 'default' }: DialogProps) {
  return (
    <Transition show={isOpen} as={Fragment}>
      <HeadlessDialog as='div' className='relative z-50' onClose={onClose}>
        {/* Backdrop */}
        <Transition.Child
          as={Fragment}
          enter='ease-out duration-300'
          enterFrom='opacity-0'
          enterTo='opacity-100'
          leave='ease-in duration-200'
          leaveFrom='opacity-100'
          leaveTo='opacity-0'
        >
          <div className='fixed inset-0 bg-black/20 backdrop-blur-sm' />
        </Transition.Child>

        {/* Dialog panel */}
        <div className='fixed inset-0 overflow-y-auto'>
          <div className='flex min-h-full items-center justify-center p-4 text-center'>
            <Transition.Child
              as={Fragment}
              enter='ease-out duration-300'
              enterFrom='opacity-0 scale-95'
              enterTo='opacity-100 scale-100'
              leave='ease-in duration-200'
              leaveFrom='opacity-100 scale-100'
              leaveTo='opacity-0 scale-95'
            >
              <HeadlessDialog.Panel
                className={`w-full transform overflow-hidden ${
                  variant === 'default' ? 'rounded-xl bg-white/80 shadow-2xl' : 'bg-transparent'
                } text-left align-middle transition-all ${maxWidthClasses[maxWidth]}`}
              >
                {/* Show title/close button section only if needed */}
                {(title || showCloseButton) && (
                  <div className='flex items-center justify-between px-6 pt-5 pb-0'>
                    {title && (
                      <HeadlessDialog.Title as='h3' className='text-lg font-semibold text-slate-800'>
                        {title}
                      </HeadlessDialog.Title>
                    )}

                    {showCloseButton && (
                      <button
                        type='button'
                        className='rounded-full p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 focus:outline-none'
                        onClick={onClose}
                      >
                        <span className='sr-only'>Close</span>
                        <XMarkIcon className='h-5 w-5' aria-hidden='true' />
                      </button>
                    )}
                  </div>
                )}

                <div className={variant === 'default' ? 'px-6 py-4' : ''}>{children}</div>
              </HeadlessDialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </HeadlessDialog>
    </Transition>
  );
}
