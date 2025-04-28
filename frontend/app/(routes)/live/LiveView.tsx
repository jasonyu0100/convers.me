import { AppHeader } from '@/app/components/app/AppHeader';
import { ErrorDisplay } from '@/app/components/ui/errors';
import { PageLoading } from '@/app/components/ui/loading';
import { AudioWaveform } from '@/app/components/side-panel/live/AudioWaveform';
import { MediaControlState } from '@/app/types/live';
import { LiveMediaView } from './components/LiveMediaView';
import { LiveRoomDetails } from './components/LiveRoomDetails';
import { LiveTranscript } from './components/LiveTranscript';
import { MessageInput } from './components/MessageInput';
import { LiveSuggestedOperations } from './components/LiveSuggestedOperations';
import { useLive, useLiveHeader } from './hooks';
import { useState, useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { liveService } from '@/app/services';
import openAIService from './services/openAIService';

export function LiveView() {
  const queryClient = useQueryClient();
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
    processContext,
    processMessage,
  } = useLive();

  // Track suggested operations separately
  const [suggestedOperations, setSuggestedOperations] = useState([]);
  // Use ref to track whether welcome message has been sent
  // Using a ref instead of state prevents re-renders and infinite loops
  const welcomeMessageSent = useRef(false);

  // Send welcome message when component mounts
  useEffect(() => {
    // Only check for sending welcome message when loading completes and message hasn't been sent yet
    if (!isLoading && !error && !welcomeMessageSent.current && transcript.length === 0) {
      // Set flag immediately to prevent multiple executions
      welcomeMessageSent.current = true;

      // Wait a bit to show welcome message for a more natural feel
      const timer = setTimeout(() => {
        // Add the welcome message directly without using sendMessage
        // This avoids adding a user message and only shows the AI message
        const welcomeMessageId = `welcome-${Date.now()}`;

        // Create a message that appears to be from the AI assistant
        const welcomeMessage = {
          id: welcomeMessageId,
          time: new Date().toISOString(),
          speaker: 'AI Assistant',
          text: "Welcome to Convers.me! I'm your AI assistant. I can help you with process tasks, schedule management, and more. How can I help you today?",
          isAI: true,
        };

        // Add to transcript directly
        setTranscript((prev) => [...prev, welcomeMessage]);
      }, 800);

      return () => clearTimeout(timer);
    }
  }, [isLoading, error, transcript.length]); // Remove aiConversation to avoid potential loops

  // Set up process context for OpenAI service when available
  useEffect(() => {
    if (processContext) {
      console.log('Setting process context for OpenAI service:', processContext);
      openAIService.setProcessContext(processContext);
    }
  }, [processContext]);

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
      console.log('Processing voice transcription:', lastUserEntry.text);
      sendMessage(lastUserEntry.text);
      lastProcessedEntryRef.current = lastUserEntry.id;
    }
  }, [transcript, isRecording]);

  // Watch for backend or OpenAI suggested operations
  useEffect(() => {
    const handleBackendResponse = (data) => {
      // Check if the response contains suggested operations
      if (data && data.suggestedOperations && data.suggestedOperations.length > 0) {
        console.log('Received suggested operations from backend:', data.suggestedOperations);
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
    console.log('Received suggested operations from OpenAI:', operations);
    setSuggestedOperations(operations);
  };

  // Process user input from MessageInput component or voice transcription
  const sendMessage = async (message) => {
    try {
      // Add the user message to transcript
      const userEntry = {
        id: `user-${Date.now()}`,
        time: new Date().toISOString(),
        speaker: 'Jason Yu',
        text: message,
      };

      setTranscript((prev) => [...prev, userEntry]);

      // Add message to OpenAI conversation history
      openAIService.addUserMessage(message);

      // Create an initial empty AI response in the transcript
      const responseId = `ai-${Date.now()}`;
      const initialAiEntry = {
        id: responseId,
        time: new Date().toISOString(),
        speaker: 'AI Assistant',
        text: '',
        isAI: true,
        isStreaming: true,
      };

      setTranscript((prev) => [...prev, initialAiEntry]);

      // Use OpenAI streaming response with chunks
      await openAIService.generateStreamingResponse(
        // Chunk handler - update the transcript with each chunk
        (chunk) => {
          setTranscript((prev) => {
            return prev.map((entry) => {
              if (entry.id === responseId) {
                return {
                  ...entry,
                  text: entry.text + chunk,
                };
              }
              return entry;
            });
          });
        },
        // Complete handler - mark as no longer streaming
        (fullText) => {
          setTranscript((prev) => {
            return prev.map((entry) => {
              if (entry.id === responseId) {
                return {
                  ...entry,
                  text: fullText,
                  isStreaming: false,
                };
              }
              return entry;
            });
          });
        },
        // Suggested operations handler
        handleOpenAISuggestedOperations,
      );

      // FALLBACK: If we want to also use the backend API (for logging/analytics)
      // We could call this in parallel, but not show the result to the user
      if (processId) {
        try {
          await processMessage({
            message,
            contextId: processMessage?.data?.data?.contextId,
          });
        } catch (backendError) {
          console.error('Backend message processing error (fallback mode):', backendError);
        }
      }
    } catch (error) {
      console.error('Error processing message with OpenAI:', error);

      // Add error message to transcript
      const errorEntry = {
        id: `error-${Date.now()}`,
        time: new Date().toISOString(),
        speaker: 'System',
        text: `Error processing message: ${error.message || 'Unknown error'}`,
      };

      setTranscript((prev) => [...prev, errorEntry]);
    }
  };

  const handleExecuteOperation = async (operation) => {
    try {
      console.log('Executing operation:', operation);

      // Add a system message to show operation in progress
      const newEntry = {
        id: Date.now().toString(),
        time: new Date().toISOString(),
        speaker: 'System',
        text: `Executing operation: ${operation.operation} for ${operation.description}...`,
      };

      // Update the transcript with the new entry
      setTranscript((prev) => [...prev, newEntry]);

      // Call the backend API to perform the operation
      const result = await liveService.performOperation(operation);

      if (result.error) {
        throw new Error(result.error);
      }

      // Add success message to transcript
      const successEntry = {
        id: `success-${Date.now()}`,
        time: new Date().toISOString(),
        speaker: 'System',
        text: `Operation completed successfully: ${operation.description}`,
      };

      setTranscript((prev) => [...prev, successEntry]);

      // Clear the suggested operations
      setSuggestedOperations([]);

      // Refresh process data if needed
      if (processId) {
        queryClient.invalidateQueries({ queryKey: ['process', processId] });
        queryClient.invalidateQueries({ queryKey: ['process-context', processId] });
      }
    } catch (error) {
      console.error('Error executing operation:', error);

      // Add error message to transcript
      const errorEntry = {
        id: `error-${Date.now()}`,
        time: new Date().toISOString(),
        speaker: 'System',
        text: `Error executing operation: ${error.message || 'Unknown error'}`,
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

      <div className='relative flex w-full flex-1 overflow-hidden bg-gradient-to-b from-white to-slate-50' aria-label='Conversation view'>
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
