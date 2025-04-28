'use client';

/**
 * Empty state when no events are found for the month
 */
export function CalendarMonthNoEvents({ setToday }: { setToday: () => void }) {
  return (
    <div className='my-10 flex flex-col items-center justify-center p-6'>
      <div className='mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-slate-100'>
        <svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='currentColor' className='h-8 w-8 text-slate-400'>
          <path
            fillRule='evenodd'
            d='M6.75 2.25A.75.75 0 017.5 3v1.5h9V3A.75.75 0 0117.25 2.25c.414 0 .75.336.75.75v1.5a1.5 1.5 0 01-1.5 1.5h-9a1.5 1.5 0 01-1.5-1.5V3a.75.75 0 01.75-.75zm-6 6.5a.75.75 0 01.75.75v10.5a1.5 1.5 0 001.5 1.5h16.5a1.5 1.5 0 001.5-1.5V9.5a.75.75 0 011.5 0v10.5a3 3 0 01-3 3H3a3 3 0 01-3-3V9.5a.75.75 0 01.75-.75z'
            clipRule='evenodd'
          />
          <path d='M9 7.5h6a.75.75 0 0 1 0 1.5H9a.75.75 0 0 1 0-1.5z' />
        </svg>
      </div>
      <h2 className='mb-2 text-xl font-semibold'>No events this month</h2>
      <p className='mb-6 max-w-md text-center text-slate-500'>
        There are no scheduled events for the current month. Switch to Schedule view or create a new event.
      </p>
      <button
        onClick={setToday}
        className='rounded-lg border border-slate-200 bg-white/80 px-4 py-2 text-sm font-medium text-slate-700 shadow-sm transition-colors hover:bg-slate-50 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:outline-none'
      >
        Switch to Schedule View
      </button>
    </div>
  );
}
