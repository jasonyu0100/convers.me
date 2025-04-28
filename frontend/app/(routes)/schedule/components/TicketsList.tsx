'use client';

import { Ticket, TicketPriority, TicketSource } from '@/app/types/connect';
import { format, parseISO } from 'date-fns';
import { memo } from 'react';

interface TicketsListProps {
  tickets: Ticket[];
  selectedTickets: string[];
  onSelectTicket: (ticketId: string) => void;
  onCreateProcess: (ticket: Ticket) => void;
  renderSourceBadge: (source: TicketSource) => React.ReactNode;
  renderPriorityBadge: (priority: TicketPriority) => React.ReactNode;
}

/**
 * Component to display the list of available tickets
 */
export const TicketsList = memo(function TicketsList({
  tickets,
  selectedTickets,
  onSelectTicket,
  onCreateProcess,
  renderSourceBadge,
  renderPriorityBadge,
}: TicketsListProps) {
  if (tickets.length === 0) {
    return (
      <div className='flex h-full w-full flex-col items-center justify-center px-6 py-10'>
        <div className='max-w-md rounded-xl border border-gray-200 bg-gray-50 p-8 text-center'>
          <svg className='mx-auto h-12 w-12 text-gray-300' fill='none' viewBox='0 0 24 24' stroke='currentColor'>
            <path
              strokeLinecap='round'
              strokeLinejoin='round'
              strokeWidth={1}
              d='M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2'
            />
          </svg>
          <p className='mt-4 text-lg font-medium text-gray-500'>No tickets found</p>
          <p className='mt-1 text-sm text-gray-400'>Try adjusting your search criteria</p>
        </div>
      </div>
    );
  }

  return (
    <div className='h-full overflow-auto p-4'>
      <div className='mb-4 flex items-center justify-between'>
        <h2 className='text-lg font-semibold text-slate-700'>Available Tickets</h2>
        <span className='rounded-full bg-slate-100 px-3 py-1 text-sm text-slate-600'>{selectedTickets.length} selected</span>
      </div>

      <div className='grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3'>
        {tickets.map((ticket) => (
          <div
            key={ticket.id}
            className={`cursor-pointer rounded-xl border p-4 transition-all duration-200 ${
              selectedTickets.includes(ticket.id) ? 'border-blue-500 bg-blue-50 shadow-md' : 'border-gray-200 bg-white/80 hover:border-gray-300 hover:shadow-md'
            }`}
            onClick={() => onSelectTicket(ticket.id)}
          >
            <div className='mb-3 flex items-center justify-between'>
              <div className='flex items-center space-x-2'>
                {renderSourceBadge(ticket.source)}
                <span className='font-mono text-sm text-gray-500'>{ticket.sourceId}</span>
              </div>
              {renderPriorityBadge(ticket.priority)}
            </div>

            <h3 className='mb-2 line-clamp-2 text-lg font-semibold text-gray-800'>{ticket.title}</h3>

            {ticket.description && <p className='mb-3 line-clamp-2 text-sm text-gray-600'>{ticket.description}</p>}

            <div className='mt-4 flex items-center justify-between'>
              <div className='flex items-center space-x-2'>
                <svg className='h-4 w-4 text-gray-400' fill='none' viewBox='0 0 24 24' stroke='currentColor'>
                  <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z' />
                </svg>
                <span className='text-sm font-medium text-gray-600'>{ticket.estimatedHours ? `${ticket.estimatedHours} hours` : 'No estimate'}</span>
              </div>

              {ticket.dueDate && (
                <div className='flex items-center space-x-2'>
                  <svg className='h-4 w-4 text-gray-400' fill='none' viewBox='0 0 24 24' stroke='currentColor'>
                    <path
                      strokeLinecap='round'
                      strokeLinejoin='round'
                      strokeWidth={2}
                      d='M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z'
                    />
                  </svg>
                  <span className='text-sm font-medium text-gray-600'>Due: {format(parseISO(ticket.dueDate), 'MMM d, yyyy')}</span>
                </div>
              )}
            </div>

            {/* Labels */}
            {ticket.labels && ticket.labels.length > 0 && (
              <div className='mt-4 flex flex-wrap gap-1.5'>
                {ticket.labels.map((label) => (
                  <span key={label} className='rounded-full bg-gray-100 px-2.5 py-1 text-xs text-gray-600'>
                    {label}
                  </span>
                ))}
              </div>
            )}

            {/* Process button */}
            <div className='mt-4 flex justify-end'>
              <button
                onClick={(e) => {
                  e.stopPropagation(); // Prevent ticket selection
                  onCreateProcess(ticket);
                }}
                className='flex items-center space-x-1.5 rounded-full bg-blue-50 px-4 py-1.5 text-sm text-blue-600 shadow-sm transition-colors duration-200 hover:bg-blue-100'
              >
                <svg className='h-3.5 w-3.5' fill='none' viewBox='0 0 24 24' stroke='currentColor'>
                  <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M12 6v6m0 0v6m0-6h6m-6 0H6' />
                </svg>
                <span>Create Process</span>
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
});
