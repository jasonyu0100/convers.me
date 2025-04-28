'use client';

import { useApp } from '@/app/components/app/hooks';
import { AppRoute, createRouteContext, useRouteComponent } from '@/app/components/router';
import { useRouter } from 'next/navigation';
import { ReactNode, useCallback, useState, useEffect } from 'react';
import { SchedulableRoom, ScheduleFormData } from '../../../types/schedule';
import { Ticket, ProcessTemplate, TicketSource, TicketPriority, ScheduledTicket } from '../../../types/connect';
import { ConnectService } from '../../../services/connectService';
import { ProcessService } from '../../../services/processService';
import { useMutation } from '@tanstack/react-query';
import { dateUtils, SCHEDULE_CONFIG } from '../../calendar/utils/dateUtils';
import { format } from 'date-fns';

// Default empty data instead of importing mock data
const mockSchedulableRoom = {
  id: 'default-room',
  title: 'New Meeting',
  description: 'Schedule a new meeting',
  host: {
    id: 'host-1',
    name: 'Meeting Host',
    role: 'Organizer',
    avatarUrl: '/profile/profile.jpg',
  },
};

interface ScheduleContextValue {
  // Conversation data
  room: SchedulableRoom;

  // Form state
  formState: ScheduleFormData;
  errors: Partial;
  isSubmitting: boolean;
  isLoading?: boolean;
  error?: string | null;

  // Actions
  handleInputChange: (e: React.ChangeEvent) => void;
  handleNewProcess: () => void;
  handleScheduleRoom: () => void;
  clearError?: () => void;

  // Ticket functionality
  tickets: Ticket[];
  filteredTickets: Ticket[];
  selectedTickets: string[];
  processTemplates: ProcessTemplate[];
  selectedTemplate?: string;
  weekDays: string[];
  currentSchedule: ScheduledTicket[];
  searchQuery: string;
  toggleTicketSelection: (ticketId: string) => void;
  selectTemplate: (templateId: string) => void;
  scheduleTickets: (date: string, startTime: string, endTime: string) => Promise;
  setSearchQuery: (query: string) => void;
  getScheduleForDay: (day: string) => ScheduledTicket[];
  generateProcessFromTicket: (ticket: Ticket) => Promise;
}

// Create the context using the standardized factory function
const { Provider, useRouteContext } = createRouteContext<ScheduleContextValue>('Schedule', {
  // Default values that will never be used directly
  room: {} as SchedulableRoom,
  formState: {
    eventType: '',
  },
  errors: {},
  isSubmitting: false,
  isLoading: false,
  error: null,
  handleInputChange: () => {},
  handleNewProcess: () => {},
  handleScheduleRoom: () => {},
  clearError: () => {},
});

interface ScheduleProviderProps {
  children: ReactNode;
  initialRoom?: SchedulableRoom;
}

/**
 * Provider component for booking functionality
 */
export function ScheduleProvider({ children, initialRoom = mockSchedulableRoom }: ScheduleProviderProps) {
  const app = useApp();
  const router = useRouter();
  const { isLoading: routeLoading, error: routeError, handleError, clearError } = useRouteComponent();

  const [room] = useState<SchedulableRoom>(initialRoom);
  const [formState, setFormState] = useState<ScheduleFormData>({
    directoryId: 'client-onboarding', // Default directory
    eventType: 'client-onboarding-process', // Default event type
  });
  const [errors, setErrors] = useState<Partial>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Ticket state
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [filteredTickets, setFilteredTickets] = useState<Ticket[]>([]);
  const [selectedTickets, setSelectedTickets] = useState<string[]>([]);
  const [processTemplates, setProcessTemplates] = useState<ProcessTemplate[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<string>();
  const [weekDays, setWeekDays] = useState<string[]>([]);
  const [currentSchedule, setCurrentSchedule] = useState<ScheduledTicket[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isTicketsLoading, setIsTicketsLoading] = useState(true);
  const [ticketsError, setTicketsError] = useState<Error | null>(null);

  const handleInputChange = useCallback(
    (e: React.ChangeEvent) => {
      try {
        const { name, value } = e.target;

        // Update form state
        setFormState((prev) => ({
          ...prev,
          [name]: value,
        }));

        // Clear error when field is updated
        if (errors[name as keyof ScheduleFormData]) {
          setErrors((prev) => ({ ...prev, [name]: undefined }));
        }
      } catch (error) {
        handleError(error);
      }
    },
    [errors, handleError],
  );

  const validateForm = useCallback((): boolean => {
    try {
      const newErrors: Partial = {};

      // Check event type
      if (!formState.eventType) {
        newErrors.eventType = 'Event type is required';
      }

      // Check for datetime selection - check both new and legacy fields
      if (!formState.startTime && !formState.datetime) {
        newErrors.datetime = 'Please select a date and time';
      }

      setErrors(newErrors);
      return Object.keys(newErrors).length === 0;
    } catch (error) {
      handleError(error);
      return false;
    }
  }, [formState, handleError]);

  // Start immediate conversation mutation
  const newProcessMutation = useMutation({
    mutationFn: async () => {
      // This is a navigation action, not an API call
      return true;
    },
    onSuccess: () => {
      app.setMainView(AppRoute.PROCESS);
      router.push('/process');
    },
    onError: (error) => {
      handleError(error);
    },
  });

  /**
   * Start immediate conversation
   */
  const handleNewProcess = useCallback(() => {
    newProcessMutation.mutate();
  }, [newProcessMutation]);

  // Schedule room mutation
  const scheduleRoomMutation = useMutation({
    mutationFn: async () => {
      if (!validateForm()) {
        console.log('Form validation failed with errors:', errors);
        return false;
      }

      // This would typically be an API call to save the booking
      console.log('Booking data:', formState, 'for room:', room.id);

      // Simulate API delay
      return new Promise<boolean>((resolve) => {
        setTimeout(() => {
          resolve(true);
        }, 1000);
      });
    },
    onSuccess: () => {
      // Redirect to prepare page
      app.setMainView(AppRoute.ROOM);
      router.push('/room');
    },
    onError: (error) => {
      handleError(error);
    },
    onSettled: () => {
      setIsSubmitting(false);
    },
  });

  /**
   * Book conversation for later
   */
  const handleScheduleRoom = useCallback(() => {
    setIsSubmitting(true);
    scheduleRoomMutation.mutate();
  }, [scheduleRoomMutation]);

  // Generate week days starting from today
  useEffect(() => {
    // Use shared utility to generate week days with standard configuration
    const days = dateUtils.generateWeekDays(new Date(), SCHEDULE_CONFIG.DAYS_TO_SHOW);
    setWeekDays(days);
  }, []);

  // Load tickets and process templates
  useEffect(() => {
    const loadData = async () => {
      setIsTicketsLoading(true);
      try {
        const [ticketsData, templatesData] = await Promise.all([ConnectService.getTickets(), ConnectService.getProcessTemplates()]);

        setTickets(ticketsData);
        setFilteredTickets(ticketsData);
        setProcessTemplates(templatesData);
        setIsTicketsLoading(false);
      } catch (error) {
        console.error('Error loading connect data:', error);
        setTicketsError(error instanceof Error ? error : new Error('Unknown error loading tickets'));
        setIsTicketsLoading(false);
      }
    };

    loadData();
  }, []);

  // Filter tickets based on search query
  useEffect(() => {
    let filtered = [...tickets];

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (ticket) =>
          ticket.title.toLowerCase().includes(query) || ticket.description?.toLowerCase().includes(query) || ticket.sourceId.toLowerCase().includes(query),
      );
    }

    setFilteredTickets(filtered);
  }, [tickets, searchQuery]);

  // Toggle ticket selection
  const toggleTicketSelection = useCallback((ticketId: string) => {
    setSelectedTickets((prev) => {
      const isSelected = prev.includes(ticketId);
      return isSelected ? prev.filter((id) => id !== ticketId) : [...prev, ticketId];
    });
  }, []);

  // Select template for scheduling
  const selectTemplate = useCallback((templateId: string) => {
    setSelectedTemplate(templateId);
  }, []);

  // Schedule selected tickets
  const scheduleTickets = useCallback(
    async (date: string, startTime: string, endTime: string) => {
      if (selectedTickets.length === 0) return [];

      setIsSubmitting(true);

      try {
        // Schedule each selected ticket
        const scheduledTicketsPromises = selectedTickets.map((ticketId) => ConnectService.scheduleTicket(ticketId, date, startTime, endTime, selectedTemplate));

        const scheduledTickets = (await Promise.all(scheduledTicketsPromises)) as ScheduledTicket[];

        // Update tickets with scheduled info
        const updatedTickets = tickets.map((ticket) => {
          const scheduled = scheduledTickets.find((st) => st.id === ticket.id);
          return scheduled || ticket;
        });

        // Add to current schedule
        setTickets(updatedTickets);
        setCurrentSchedule((prev) => [...prev, ...scheduledTickets]);
        setSelectedTickets([]); // Clear selection after scheduling
        setIsSubmitting(false);

        return scheduledTickets;
      } catch (error) {
        console.error('Error scheduling tickets:', error);
        handleError(error);
        setIsSubmitting(false);
        return [];
      }
    },
    [selectedTickets, selectedTemplate, tickets, handleError],
  );

  // Get scheduled tickets for a specific day
  const getScheduleForDay = useCallback(
    (date: string) => {
      return currentSchedule.filter((ticket) => ticket.scheduledDate === date);
    },
    [currentSchedule],
  );

  // Generate a process from a ticket
  const generateProcessFromTicket = useCallback(
    async (ticket: Ticket) => {
      try {
        // Create a descriptive name for the process
        const processName = `${ticket.source}-${ticket.sourceId}: ${ticket.title}`;

        // Create steps based on ticket type and priority
        let steps = [];

        // Default steps for all tickets
        steps = [
          { content: 'Review ticket requirements', completed: false, order: 1 },
          { content: 'Plan implementation approach', completed: false, order: 2 },
          { content: 'Implement solution', completed: false, order: 3 },
          { content: 'Test changes', completed: false, order: 4 },
          { content: 'Document work completed', completed: false, order: 5 },
        ];

        // Add bug-specific steps for issues/bugs
        if (ticket.labels?.includes('bug')) {
          steps = [
            { content: 'Reproduce the issue', completed: false, order: 1 },
            { content: 'Identify root cause', completed: false, order: 2 },
            { content: 'Implement fix', completed: false, order: 3 },
            { content: 'Write regression test', completed: false, order: 4 },
            { content: 'Verify in test environment', completed: false, order: 5 },
          ];
        }

        // Add feature-specific steps
        if (ticket.labels?.includes('feature')) {
          steps = [
            { content: 'Review requirements', completed: false, order: 1 },
            { content: 'Create design document', completed: false, order: 2 },
            { content: 'Implement core functionality', completed: false, order: 3 },
            { content: 'Add UI components', completed: false, order: 4 },
            { content: 'Write tests', completed: false, order: 5 },
            { content: 'Update documentation', completed: false, order: 6 },
          ];
        }

        // Create the process
        const processData = {
          title: processName,
          description: ticket.description,
          color: ticket.priority === TicketPriority.HIGH || ticket.priority === TicketPriority.URGENT ? 'red' : 'blue',
          steps: steps,
          isTemplate: false,
          metadata: {
            sourceTicket: {
              id: ticket.id,
              source: ticket.source,
              sourceId: ticket.sourceId,
              url: ticket.url,
            },
          },
        };

        // Use the template if one is selected
        if (selectedTemplate) {
          // This would ideally clone the template with the API
          const selectedTemplateObj = processTemplates.find((t) => t.id === selectedTemplate);
          if (selectedTemplateObj) {
            processData.steps = selectedTemplateObj.steps.map((step) => ({
              content: step.content,
              completed: false,
              order: step.order,
            }));
          }
        }

        const result = await ProcessService.createLiveProcess(processData);

        if (result?.data) {
          // Redirect to the new process
          router.push(`/process?id=${result.data.id}`);
        }
      } catch (error) {
        console.error('Error generating process:', error);
        handleError(error);
      }
    },
    [processTemplates, selectedTemplate, router, handleError],
  );

  // Context value
  const contextValue: ScheduleContextValue = {
    // Data
    room,

    // State
    formState,
    errors,
    isSubmitting: isSubmitting || scheduleRoomMutation.isPending || newProcessMutation.isPending,
    isLoading: routeLoading || isTicketsLoading,
    error: routeError || ticketsError,

    // Actions
    handleInputChange,
    handleNewProcess,
    handleScheduleRoom,
    clearError,

    // Ticket functionality
    tickets,
    filteredTickets,
    selectedTickets,
    processTemplates,
    selectedTemplate,
    weekDays,
    currentSchedule,
    searchQuery,
    toggleTicketSelection,
    selectTemplate,
    scheduleTickets,
    setSearchQuery,
    getScheduleForDay,
    generateProcessFromTicket,
  };

  return <Provider value={contextValue}>{children}</Provider>;
}

// Export the hook with the standard name
export const useSchedule = useRouteContext;
