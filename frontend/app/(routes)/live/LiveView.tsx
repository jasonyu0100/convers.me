import { useEffect, useRef, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useSearchParams } from 'next/navigation';

import { AppHeader } from '@/app/components/app/AppHeader';
import { AudioWaveform } from '@/app/components/side-panel/live/AudioWaveform';
import { ErrorDisplay } from '@/app/components/ui/errors';
import { PageLoading } from '@/app/components/ui/loading';
import { liveService } from '@/app/services';
import { EventService } from '@/app/services/eventService';
import { MediaControlState } from '@/app/types/live';

import { LiveMediaView } from './components/LiveMediaView';
import { LiveRoomDetails } from './components/LiveRoomDetails';
import { LiveSuggestedOperations } from './components/LiveSuggestedOperations';
import { LiveTranscript } from './components/LiveTranscript';
import { MessageInput } from './components/MessageInput';
import { useLive, useLiveHeader } from './hooks';
import openAIService from './services/openAIService';

export function LiveView() {
  const queryClient = useQueryClient();
  const searchParams = useSearchParams();

  // Get URL params

  const {
    videoRef,
    screenShareRef,
    showInterface,
    mediaControls,
    transcript,
    setTranscript,
    isRecording,
    stopRecording,
    aiConversation,
    elapsedTime,
    microphoneStream,
    // Added loading and error handling
    isLoading,
    error,
    // Live context data
    processId,
    processMessage,
  } = useLive();

  // Get processId from useLive hook

  // Fetch event data explicitly to ensure it's available
  const eventId = searchParams?.get('id');
  const { data: eventData } = useQuery({
    queryKey: ['event', eventId],
    queryFn: async () => {
      if (!eventId) return null;
      // Fetching event data
      const result = await EventService.getEventById(eventId);
      if (result.error) {
        console.error('Error fetching event:', result.error);
        throw new Error(result.error);
      }
      // Event data received
      return result.data;
    },
    enabled: !!eventId,
    staleTime: 30000, // Cache for 30 seconds
    onSuccess: (data) => {
      // Event data loaded
      // Check event process data
    },
  });

  // Get process ID either from URL or from event data
  const eventProcessId = eventData?.processId;
  const effectiveProcessId = processId || eventProcessId;

  // Track the source of process ID
  useEffect(() => {
    console.log('Process ID source:', {
      fromURL: processId,
      fromEvent: eventProcessId,
      effectiveId: effectiveProcessId,
    });
  }, [processId, eventProcessId, effectiveProcessId]);

  // Fetch process context with debugging
  const {
    data: processContext,
    isLoading: isLoadingProcessContext,
    error: processContextError,
  } = useQuery({
    queryKey: ['process-context', effectiveProcessId],
    queryFn: async () => {
      // Log the fetch attempt
      console.log('Fetching process context for ID:', effectiveProcessId);

      if (!effectiveProcessId) {
        console.log('No process ID available, skipping fetch');
        return null;
      }

      try {
        const result = await liveService.getProcessContext(effectiveProcessId);

        if (result.error) {
          console.error('Error fetching process context:', result.error);
          throw new Error(result.error);
        }

        console.log('Process context fetched successfully:', result.data);
        return result.data;
      } catch (error) {
        console.error('Process context fetch exception:', error);
        throw error;
      }
    },
    enabled: !!effectiveProcessId,
    staleTime: 30000, // Cache for 30 seconds
    onSuccess: (data) => {
      console.log('Process context query success:', data?.process?.title || 'No title', 'Steps:', data?.process?.steps?.length || 0);
    },
    onError: (error) => {
      console.error('Process context query error:', error);
    },
  });

  // Track suggested operations from AI or backend
  const [suggestedOperations, setSuggestedOperations] = useState([]);

  // Track whether welcome message has been sent
  const welcomeMessageSent = useRef(false);

  /**
   * Generate a contextual welcome message
   */
  const generateWelcomeMessage = () => {
    let welcomeText = "Welcome to Convers.me! I'm your AI assistant. I'm loading your session data...";
    welcomeText += ' How can I assist you today?';
    return welcomeText;
  };

  // Track whether we've sent context update messages
  const eventUpdateSent = useRef(false);
  const processUpdateSent = useRef(false);

  // Track context loading state
  const [contextState, setContextState] = useState({
    eventLoaded: false,
    processLoaded: false,
  });

  // Handle event data loading
  useEffect(() => {
    if (eventData && !eventUpdateSent.current && welcomeMessageSent.current) {
      console.log('Event data loaded, sending event update message');
      eventUpdateSent.current = true;

      // Set loading flag for UI updates
      setContextState((prev) => ({ ...prev, eventLoaded: true }));

      // Show event details with slight delay for natural conversation
      setTimeout(() => {
        let eventText = "I've loaded your event information.";

        if (eventData.title) {
          eventText += `\nEvent: "${eventData.title}"`;
        }

        if (eventData.description) {
          eventText += `\nDescription: ${eventData.description}`;
        }

        if (eventData.startTime) {
          const startDate = new Date(eventData.startTime);
          eventText += `\nScheduled for: ${startDate.toLocaleString()}`;
        }

        // Add event update message to transcript
        setTranscript((prev) => [
          ...prev,
          {
            id: `event-update-${Date.now()}`,
            time: new Date().toISOString(),
            speaker: 'AI Assistant',
            text: eventText,
            isAI: true,
          },
        ]);
      }, 800);
    }
  }, [eventData, welcomeMessageSent.current]);

  // Handle process data loading separately
  useEffect(() => {
    if (processContext?.process && !processUpdateSent.current && welcomeMessageSent.current) {
      console.log('Process data loaded, sending process update message');
      processUpdateSent.current = true;

      // Set loading flag for UI updates
      setContextState((prev) => ({ ...prev, processLoaded: true }));

      // Show process details with slight delay after event message
      setTimeout(() => {
        let processText = "I've loaded your process information.";

        const process = processContext.process;
        processText += `\nProcess: "${process.title || 'Untitled Process'}"`;

        if (process.description) {
          processText += `\nDescription: ${process.description}`;
        }

        // Include progress if there are steps
        const steps = process.steps || [];
        if (steps.length > 0) {
          const completedSteps = steps.filter((step) => step.completed).length;
          const percent = Math.round((completedSteps / steps.length) * 100);

          processText += `\nProgress: ${percent}% (${completedSteps}/${steps.length} steps complete)`;

          // Add next pending step
          const nextStep = steps.find((step) => !step.completed);
          if (nextStep) {
            processText += `\nNext step: "${nextStep.content}"`;
          }
        }

        processText += '\nHow would you like to proceed with this process?';

        // Add process update message to transcript
        setTranscript((prev) => [
          ...prev,
          {
            id: `process-update-${Date.now()}`,
            time: new Date().toISOString(),
            speaker: 'AI Assistant',
            text: processText,
            isAI: true,
          },
        ]);
      }, 1500);
    }
  }, [processContext, welcomeMessageSent.current]);

  // Handle case where there is no process associated with event
  useEffect(() => {
    if (eventData && !eventData.processId && !processUpdateSent.current && welcomeMessageSent.current) {
      console.log('Event has no process, marking process as loaded');
      processUpdateSent.current = true;

      // Set loading flag for UI updates
      setContextState((prev) => ({ ...prev, processLoaded: true }));
    }
  }, [eventData, welcomeMessageSent.current]);

  // Send welcome message on component mount
  useEffect(() => {
    // Skip if message already sent or transcript has entries
    if (welcomeMessageSent.current || transcript.length > 0) {
      return;
    }

    console.log('Component mounted, sending initial welcome message');

    // Set flag immediately to prevent multiple executions
    welcomeMessageSent.current = true;

    // Send welcome message with short delay
    const timer = setTimeout(() => {
      const welcomeText = generateWelcomeMessage();

      // Add AI welcome message to transcript
      setTranscript((prev) => [
        ...prev,
        {
          id: `welcome-${Date.now()}`,
          time: new Date().toISOString(),
          speaker: 'AI Assistant',
          text: welcomeText,
          isAI: true,
        },
      ]);
    }, 800);

    return () => clearTimeout(timer);
  }, []);

  /**
   * Initialize AI context with available event and process data
   * Following the correct architecture: event -> process -> steps
   */
  useEffect(() => {
    // Set event context
    if (eventData) {
      // Setting minimal event context with essential fields only
      // (We don't pass steps or process through event context)
      const minimalEventContext = {
        id: eventData.id,
        title: eventData.title,
        description: eventData.description,
        startTime: eventData.startTime,
        endTime: eventData.endTime,
        processId: eventData.processId,
        // Explicitly not including steps or complete process object
      };

      openAIService.setEventContext(minimalEventContext);
    }

    // Set process context - ONLY use processContext from backend
    if (processContext?.process) {
      // Use process context from backend API
      openAIService.setProcessContext(processContext);
    }
    // Only create minimal context if we have eventData with processId but no processContext
    else if (eventData?.processId) {
      // Create minimal process context with ID only - NO steps
      // Steps must be fetched through proper process endpoint
      const minimalProcessData = {
        process: {
          id: eventData.processId,
          title: eventData.title || 'Current Process',
          // No steps array - will be fetched properly through process endpoint
        },
        relatedEvents: [
          {
            id: eventData.id,
            title: eventData.title,
          },
        ],
        recentMessages: [],
      };

      openAIService.setProcessContext(minimalProcessData);
    }

    // Reset welcome message if context changed after initial load
    if (welcomeMessageSent.current && transcript.length > 0) {
      welcomeMessageSent.current = false;
    }
  }, [processContext, eventData]);

  // Track the last processed user transcript entry
  const lastProcessedEntryRef = useRef(null);

  // Process new voice transcription entries automatically
  useEffect(() => {
    // Find the last user message that hasn't been processed
    const userEntries = transcript.filter((entry) => entry.speaker !== 'AI Assistant' && entry.speaker !== 'System');

    if (userEntries.length === 0) return;

    const lastUserEntry = userEntries[userEntries.length - 1];

    // Skip if we've already processed this entry or if it's currently being processed
    if (lastProcessedEntryRef.current === lastUserEntry.id || transcript.some((entry) => entry.isAI && entry.isStreaming)) {
      return;
    }

    // Skip system messages
    if (lastUserEntry.text.includes('Recording started') || lastUserEntry.text.includes('Recording stopped')) {
      return;
    }

    // Only process if it came from voice transcription
    // (entries from MessageInput are handled directly by the sendMessage function)
    if (isRecording) {
      // Processing voice transcription
      sendMessage(lastUserEntry.text);
      lastProcessedEntryRef.current = lastUserEntry.id;
    }
  }, [transcript, isRecording]);

  // Watch for backend or OpenAI suggested operations
  useEffect(() => {
    const handleBackendResponse = (data) => {
      // Check if the response contains suggested operations
      if (data && data.suggestedOperations && data.suggestedOperations.length > 0) {
        // Received suggested operations from backend
        setSuggestedOperations(data.suggestedOperations);
      }
    };

    // Watch for changes in processMessage data
    if (processMessage && processMessage.data?.data) {
      handleBackendResponse(processMessage.data?.data);
    }
  }, [processMessage?.data?.data]);

  // Function to handle suggested operations from OpenAI
  const handleOpenAISuggestedOperations = (operations) => {
    // Received suggested operations from OpenAI
    setSuggestedOperations(operations);
  };

  /**
   * Process user message and generate AI response
   * @param message User's message text
   */
  const sendMessage = async (message) => {
    if (!message || message.trim() === '') return;

    try {
      // Add user message to transcript
      const userEntry = {
        id: `user-${Date.now()}`,
        time: new Date().toISOString(),
        speaker: 'You', // Generic name
        text: message,
      };
      setTranscript((prev) => [...prev, userEntry]);

      // Add to OpenAI conversation
      openAIService.addUserMessage(message);

      // Create placeholder for AI response
      const responseId = `ai-${Date.now()}`;
      const aiPlaceholder = {
        id: responseId,
        time: new Date().toISOString(),
        speaker: 'AI Assistant',
        text: '',
        isAI: true,
        isStreaming: true,
      };
      setTranscript((prev) => [...prev, aiPlaceholder]);

      // Generate and stream response
      await openAIService.generateStreamingResponse(
        // Update transcript with each chunk
        (chunk) => {
          setTranscript((prev) => prev.map((entry) => (entry.id === responseId ? { ...entry, text: entry.text + chunk } : entry)));
        },

        // Mark as complete when done
        (fullText) => {
          setTranscript((prev) => prev.map((entry) => (entry.id === responseId ? { ...entry, text: fullText, isStreaming: false } : entry)));
        },

        // Handle suggested operations
        handleOpenAISuggestedOperations,
      );

      // Log to backend in parallel (if process context exists)
      if (processId) {
        try {
          await processMessage({
            message,
            contextId: processMessage?.data?.data?.contextId,
          });
        } catch (backendError) {
          console.error('Error logging message to backend:', backendError);
          // No user-facing error for backend logging failures
        }
      }
    } catch (error) {
      console.error('Error processing message:', error);

      // Show error message in transcript
      const errorEntry = {
        id: `error-${Date.now()}`,
        time: new Date().toISOString(),
        speaker: 'System',
        text: `Error: ${error.message || 'Failed to process message'}`,
      };
      setTranscript((prev) => [...prev, errorEntry]);
    }
  };

  /**
   * Execute an operation suggested by the AI
   * @param operation The operation to execute
   */
  const handleExecuteOperation = async (operation) => {
    if (!operation) return;

    try {
      // Show operation in progress
      const progressEntry = {
        id: `op-${Date.now()}`,
        time: new Date().toISOString(),
        speaker: 'System',
        text: `Executing: ${operation.description}...`,
      };
      setTranscript((prev) => [...prev, progressEntry]);

      // Call the backend API
      const result = await liveService.performOperation(operation);
      if (result.error) {
        throw new Error(result.error);
      }

      // Show success message
      const successEntry = {
        id: `success-${Date.now()}`,
        time: new Date().toISOString(),
        speaker: 'System',
        text: `✅ Operation completed: ${operation.description}`,
      };
      setTranscript((prev) => [...prev, successEntry]);

      // Clear suggested operations after execution
      setSuggestedOperations([]);

      // Refresh relevant data
      if (processId) {
        // Invalidate both the process context and regular process queries
        queryClient.invalidateQueries({
          queryKey: ['process-context', processId],
        });

        // Also invalidate the process itself if available
        queryClient.invalidateQueries({
          queryKey: ['process', processId],
        });
      }
    } catch (error) {
      console.error('Operation execution failed:', error);

      // Show error message
      const errorEntry = {
        id: `error-${Date.now()}`,
        time: new Date().toISOString(),
        speaker: 'System',
        text: `❌ Error: ${error.message || 'Failed to execute operation'}`,
      };
      setTranscript((prev) => [...prev, errorEntry]);
    }
  };

  const headerProps = useLiveHeader();
  const showScreenShare = mediaControls.screen === MediaControlState.ON;
  const showCamera = mediaControls.camera === MediaControlState.ON;

  // Handle loading state
  if (isLoading) {
    return (
      <div className='flex h-full w-full flex-col'>
        <AppHeader title={headerProps.title} />
        <PageLoading />
      </div>
    );
  }

  // Handle error state
  if (error) {
    return (
      <div className='flex h-full w-full flex-col'>
        <AppHeader title={headerProps.title} />
        <ErrorDisplay error={error} title='Live Session Error' />
      </div>
    );
  }

  return (
    <>
      <AppHeader
        title={headerProps.title}
        searchPlaceholder={headerProps.searchPlaceholder}
        searchValue={headerProps.searchValue}
        onSearchChange={headerProps.onSearchChange}
        onSearchSubmit={headerProps.onSearchSubmit}
      />

      <div className='relative flex w-full flex-1 overflow-hidden' aria-label='Conversation view'>
        <div className='flex flex-1 flex-col'>
          <div className='relative flex flex-1 overflow-hidden'>
            {/* Media view container */}
            <div className={`${showCamera || showScreenShare ? 'w-1/2 border-r border-slate-200 bg-black' : 'w-0'} relative transition-all duration-300`}>
              <LiveMediaView videoRef={videoRef} screenShareRef={screenShareRef} showScreenShare={showScreenShare} showCamera={showCamera} />
            </div>

            {/* Transcript and message input container that scales with media view */}
            <div className={`flex flex-col ${showCamera || showScreenShare ? 'w-1/2' : 'w-full'} transition-all duration-300`}>
              {/* Transcript view - fills available space */}
              <div className='flex-1 overflow-hidden'>
                <LiveTranscript entries={transcript} isRecording={isRecording} />
              </div>

              {/* Suggested operations */}
              {suggestedOperations.length > 0 && (
                <div className='px-6 py-2'>
                  <LiveSuggestedOperations operations={suggestedOperations} onExecuteOperation={handleExecuteOperation} />
                </div>
              )}

              {/* Message input or Audio waveform based on microphone state */}
              <div className='border-t border-slate-200 bg-white p-4 shadow-md backdrop-blur-sm transition-all duration-300'>
                {microphoneStream ? (
                  <div className='flex items-center justify-center rounded-xl border border-slate-300/50 bg-slate-50 p-3 shadow-sm'>
                    <AudioWaveform audioStream={microphoneStream} isActive={true} width={500} height={60} color='#3B82F6' />
                  </div>
                ) : (
                  <>
                    <MessageInput onSendMessage={sendMessage} isDisabled={false} placeholder='Type your message to AI Assistant...' />
                    {transcript.some((entry) => entry.isAI && entry.isStreaming) && (
                      <div className='mt-2 flex items-center justify-center'>
                        <div className='flex items-center space-x-2 text-sm text-blue-500'>
                          <div className='h-2 w-2 animate-pulse rounded-full bg-blue-500'></div>
                          <div className='animation-delay-200 h-2 w-2 animate-pulse rounded-full bg-blue-500'></div>
                          <div className='animation-delay-400 h-2 w-2 animate-pulse rounded-full bg-blue-500'></div>
                          <span className='ml-2'>AI is thinking...</span>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Room details panel on the right */}
        <LiveRoomDetails />
      </div>
    </>
  );
}
