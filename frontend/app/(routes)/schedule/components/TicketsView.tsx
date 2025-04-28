'use client';

import { ErrorDisplay } from '@/app/components/ui/errors/ErrorDisplay';
import { PageLoading } from '@/app/components/ui/loading/PageLoading';
import { Tag } from '@/app/components/ui/tags/Tag';
import { Ticket, TicketPriority, TicketSource } from '@/app/types/connect';
import { format, parseISO } from 'date-fns';
import { useCallback, useState } from 'react';
import { useSchedule } from '../hooks';
import { ScheduleTicketForm } from './ScheduleTicketForm';
import { TicketsList } from './TicketsList';

interface TicketsViewProps {
  onBackClick: () => void;
}

/**
 * Tickets view component that combines ConnectView functionality
 */
export function TicketsView({ onBackClick }: TicketsViewProps) {
  const {
    filteredTickets,
    selectedTickets,
    processTemplates,
    selectedTemplate,
    toggleTicketSelection,
    selectTemplate,
    scheduleTickets,
    setSearchQuery,
    weekDays,
    getScheduleForDay,
    isLoading,
    error,
    clearError,
    generateProcessFromTicket,
  } = useSchedule();

  const [view, setView] = useState<'grid' | 'schedule'>('grid');
  const [selectedDay, setSelectedDay] = useState(weekDays[0] || '');
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [selectedCalendarDate, setSelectedCalendarDate] = useState<Date | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [generateProcess, setGenerateProcess] = useState(true);
  const [scheduleTimes, setScheduleTimes] = useState({
    startTime: '09:00',
    endTime: '10:00',
  });

  // Handle search input
  const handleSearch = useCallback(
    (e: React.ChangeEvent) => {
      setSearchQuery(e.target.value);
    },
    [setSearchQuery],
  );

  // Calculate end time (1 hour after start time)
  const calculateEndTime = (time: string) => {
    const [hour, minute] = time.split(':').map(Number);
    const endHour = (hour + 1) % 24;
    return `${endHour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
  };

  // Handle time selection
  const handleTimeSelect = useCallback((time: string) => {
    setSelectedTime(time);
    setScheduleTimes({
      startTime: time,
      endTime: calculateEndTime(time),
    });
  }, []);

  // Handle ticket selection
  const handleTicketSelect = useCallback(
    (ticketId: string) => {
      const ticket = filteredTickets.find((t) => t.id === ticketId);
      if (ticket) {
        setSelectedTicket(ticket);
        setView('schedule');
        toggleTicketSelection(ticketId);
      }
    },
    [filteredTickets, toggleTicketSelection],
  );

  // Schedule ticket
  const handleScheduleSubmit = useCallback(async () => {
    if (!selectedTicket || !selectedTime) return;

    // Schedule the ticket
    const updatedTickets = await scheduleTickets(selectedDay, scheduleTimes.startTime, scheduleTimes.endTime);

    // Generate process if enabled
    if (generateProcess && updatedTickets && updatedTickets.length > 0) {
      const ticket = updatedTickets[0];
      await generateProcessFromTicket(ticket);
    } else {
      // Go back to grid view
      setView('grid');
      setSelectedTicket(null);
    }
  }, [selectedTicket, selectedTime, selectedDay, scheduleTimes, scheduleTickets, generateProcess, generateProcessFromTicket]);

  // Cancel scheduling and return to grid
  const handleCancel = useCallback(() => {
    setView('grid');
    setSelectedTicket(null);
    // Deselect the ticket
    if (selectedTicket) {
      toggleTicketSelection(selectedTicket.id);
    }
  }, [selectedTicket, toggleTicketSelection]);

  // Render source badge
  const renderSourceBadge = (source: TicketSource) => {
    const colors = {
      [TicketSource.GITHUB]: 'bg-gray-800 text-white',
      [TicketSource.JIRA]: 'bg-blue-600 text-white',
      [TicketSource.ASANA]: 'bg-orange-500 text-white',
      [TicketSource.MONDAY]: 'bg-green-600 text-white',
      [TicketSource.LINEAR]: 'bg-indigo-600 text-white',
      [TicketSource.INTERNAL]: 'bg-slate-300 text-slate-800',
    };

    return <span className={`rounded px-2 py-0.5 text-xs font-medium ${colors[source]}`}>{source}</span>;
  };

  // Render priority indicator
  const renderPriorityBadge = (priority: TicketPriority) => {
    const colors = {
      [TicketPriority.LOW]: 'bg-gray-200 text-gray-800',
      [TicketPriority.MEDIUM]: 'bg-blue-200 text-blue-800',
      [TicketPriority.HIGH]: 'bg-orange-200 text-orange-800',
      [TicketPriority.URGENT]: 'bg-red-200 text-red-800',
    };

    return <span className={`rounded px-2 py-0.5 text-xs font-medium ${colors[priority]}`}>{priority}</span>;
  };

  // Format date functions
  const formatDate = (date: string) => {
    try {
      return format(parseISO(date), 'EEEE, MMMM d, yyyy');
    } catch (error) {
      return date;
    }
  };

  const formatShortDate = (date: string) => {
    try {
      return format(parseISO(date), 'EEE, MMM d');
    } catch (error) {
      return date;
    }
  };

  // Handle loading state
  if (isLoading) {
    return <PageLoading />;
  }

  // Handle error state
  if (error) {
    return <ErrorDisplay error={error} title='Tickets Error' onRetry={clearError} />;
  }

  // Main grid view with ticket list
  if (view === 'grid') {
    return (
      <div className='flex h-full w-full flex-col'>
        <TicketsList
          tickets={filteredTickets}
          selectedTickets={selectedTickets}
          onSelectTicket={handleTicketSelect}
          onCreateProcess={generateProcessFromTicket}
          renderSourceBadge={renderSourceBadge}
          renderPriorityBadge={renderPriorityBadge}
        />
      </div>
    );
  }

  // Schedule view with details and form
  return (
    <div className='flex h-full flex-1 flex-row overflow-auto'>
      <div className='h-full w-1/2 border-r border-slate-200'>
        {selectedTicket && (
          <div className='flex h-full w-full flex-col items-center justify-center p-6'>
            <div className='w-full max-w-xl space-y-6'>
              <div className='flex items-center justify-between border-b border-slate-100 pb-3'>
                <button
                  onClick={handleCancel}
                  className='flex items-center rounded-lg py-1 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-100'
                >
                  <svg className='mr-2 h-4 w-4' fill='none' viewBox='0 0 24 24' stroke='currentColor'>
                    <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M15 19l-7-7 7-7' />
                  </svg>
                  Back to tickets
                </button>
              </div>

              <div className='space-y-4'>
                <div className='mb-2 flex items-center justify-between'>
                  {renderSourceBadge(selectedTicket.source)}
                  <span className='font-mono text-xs text-slate-500'>{selectedTicket.sourceId}</span>
                </div>

                <h2 className='mb-2 text-3xl font-bold text-slate-800'>{selectedTicket.title}</h2>

                <div className='flex items-center space-x-5 text-base text-slate-500'>
                  <div className='flex items-center'>
                    <svg className='mr-1 h-5 w-5' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                      <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z' />
                    </svg>
                    <span>{selectedTicket.estimatedHours ? `${selectedTicket.estimatedHours} hours` : 'No estimate'}</span>
                  </div>

                  <div className='flex items-center'>
                    <svg className='mr-1 h-5 w-5' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                      <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M13 10V3L4 14h7v7l9-11h-7z' />
                    </svg>
                    <div className='flex items-center'>{renderPriorityBadge(selectedTicket.priority)}</div>
                  </div>
                </div>

                {selectedTicket.description && <p className='mt-4 text-left text-lg text-slate-600'>{selectedTicket.description}</p>}

                {/* Labels */}
                {selectedTicket.labels && selectedTicket.labels.length > 0 && (
                  <div className='flex flex-wrap gap-2'>
                    {selectedTicket.labels.map((label, index) => (
                      <Tag key={index} className='bg-slate-100 text-base text-slate-700'>
                        {label}
                      </Tag>
                    ))}
                  </div>
                )}

                {/* User info */}
                {selectedTicket.assigneeName && (
                  <div className='mt-6 flex items-center space-x-3 rounded-lg border border-slate-100 p-4'>
                    <div className='h-10 w-10 overflow-hidden rounded-full bg-slate-200'>
                      {selectedTicket.assigneeAvatar ? (
                        <img src={selectedTicket.assigneeAvatar} alt={selectedTicket.assigneeName} className='h-full w-full object-cover' />
                      ) : (
                        <div className='flex h-full w-full items-center justify-center bg-blue-100 text-blue-600'>{selectedTicket.assigneeName.charAt(0)}</div>
                      )}
                    </div>
                    <div>
                      <p className='font-medium text-slate-800'>{selectedTicket.assigneeName}</p>
                      <p className='text-sm text-slate-500'>Ticket Owner</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      <div className='h-full w-1/2'>
        <div className='flex h-full w-full flex-col items-center justify-center p-6'>
          <div className='w-full max-w-xl space-y-6'>
            <div className='space-y-4'>
              <ScheduleTicketForm
                weekDays={weekDays}
                selectedDay={selectedDay}
                onDayChange={setSelectedDay}
                scheduleTimes={scheduleTimes}
                onScheduleTimesChange={setScheduleTimes}
                processTemplates={processTemplates}
                selectedTemplate={selectedTemplate}
                onTemplateChange={selectTemplate}
                autoCreateProcess={generateProcess}
                onAutoCreateProcessChange={setGenerateProcess}
                onSubmit={handleScheduleSubmit}
                isSubmitDisabled={!selectedTicket}
                getScheduleForDay={getScheduleForDay}
                formatDate={formatDate}
                formatShortDate={formatShortDate}
                onCreateProcess={generateProcessFromTicket}
                selectedCalendarDate={selectedCalendarDate}
                selectedTime={selectedTime}
                onDateSelect={setSelectedCalendarDate}
                onTimeSelect={handleTimeSelect}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
