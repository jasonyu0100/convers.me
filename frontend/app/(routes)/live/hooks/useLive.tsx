'use client';

import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import { useRouter, useSearchParams } from 'next/navigation';

import {
  AIConversation,
  LiveContext,
  LiveMessage,
  LiveMode,
  LiveModeOption,
  LiveOperation,
  LiveProcessContext,
  LiveResponse,
  MediaControlState,
  MediaControls,
  StreamParticipant,
  TranscriptEntry,
} from '../../../types/live';
import { LiveProviderProps } from '../types';
import { useApp } from '@/app/components/app/hooks';
import { AppRoute } from '@/app/components/router';
import { EventService } from '@/app/services/eventService';
import { liveService } from '@/app/services';
import audioRecorder from '../services/audioRecorder';
import openAIService from '../services/openAIService';

// Define return type of the hook for better type inference
export interface LiveContextValue {
  videoRef: React.RefObject;
  screenShareRef: React.RefObject;
  showInterface: boolean;
  setShowInterface: React.Dispatch;
  toggleInterface: () => void;
  liveMode: LiveMode;
  setLiveMode: (mode: LiveMode) => void;
  getStatusColor: () => string;
  participants: StreamParticipant[];
  modeOptions: LiveModeOption[];
  mediaControls: MediaControls;
  transcript: TranscriptEntry[];
  isRecording: boolean;
  startRecording: () => Promise;
  stopRecording: () => void;
  aiConversation: AIConversation;
  elapsedTime: string;
  microphoneStream: MediaStream | null;
  // Added loading and error handling
  isLoading?: boolean;
  setIsLoading?: (loading: boolean) => void;
  error?: string | null;
  clearError?: () => void;
  eventId?: string | null;
  // Template handling
  templateId?: string | null;
  handleViewTemplate?: () => void;
  // Live context data
  processId?: string | null;
  liveContexts?: LiveContext[];
  createContext?: (data: { processId?: string; eventId?: string; templateId?: string; messages?: LiveMessage[]; metadata?: Record }) => void;
  processMessage?: (data: { message: string; contextId?: string }) => void;
  isCreatingContext?: boolean;
  isProcessingMessage?: boolean;
}

const defaultContextValue: LiveContextValue = {
  videoRef: { current: null },
  screenShareRef: { current: null },
  showInterface: false,
  setShowInterface: () => {},
  toggleInterface: () => {},
  liveMode: LiveMode.VOICE,
  setLiveMode: () => {},
  getStatusColor: () => 'bg-gray-500',
  participants: [],
  modeOptions: [],
  mediaControls: {
    camera: MediaControlState.OFF,
    microphone: MediaControlState.OFF,
    screen: MediaControlState.OFF,
    toggleCamera: async () => {},
    toggleMicrophone: async () => {},
    toggleScreenShare: async () => {},
  },
  transcript: [],
  isRecording: false,
  startRecording: async () => {},
  stopRecording: () => {},
  aiConversation: {
    messages: [],
    isProcessing: false,
    sendMessage: async () => {},
    clearConversation: () => {},
  },
  elapsedTime: '00:00',
  microphoneStream: null,
  // Added loading and error handling
  isLoading: false,
  setIsLoading: () => {},
  error: null,
  clearError: () => {},
  eventId: null,
  // Template handling
  templateId: null,
  handleViewTemplate: () => {},
  // Live context data
  processId: null,
  liveContexts: [],
  createContext: (data) => {},
  processMessage: (data) => {},
  isCreatingContext: false,
  isProcessingMessage: false,
};

// Create the context with undefined as initial value
export const LiveContext = createContext<LiveContextValue>(defaultContextValue);

/**
 * Custom hook that contains the live conversation state and logic
 */
function useLiveState(): LiveContextValue {
  const searchParams = useSearchParams();
  const router = useRouter();
  const app = useApp();
  const queryClient = useQueryClient();

  const videoRef = useRef<HTMLVideoElement>(null);
  const screenShareRef = useRef<HTMLVideoElement>(null);
  const [showInterface, setShowInterface] = useState(false);
  const [liveMode, setLiveMode] = useState<LiveMode>(LiveMode.VOICE);
  const [transcript, setTranscript] = useState<TranscriptEntry[]>([]);
  const [isRecording, setIsRecording] = useState(false);
  const [cameraState, setCameraState] = useState<MediaControlState>(MediaControlState.OFF);
  const [microphoneState, setMicrophoneState] = useState<MediaControlState>(MediaControlState.OFF);
  const [screenShareState, setScreenShareState] = useState<MediaControlState>(MediaControlState.OFF);
  const [aiMessages, setAiMessages] = useState<TranscriptEntry[]>([]);
  const [isProcessingAI, setIsProcessingAI] = useState(false);
  const [startTime, setStartTime] = useState<Date | null>(null);
  const [elapsedTime, setElapsedTime] = useState('00:00');
  const [error, setError] = useState<string | null>(null);

  // Get the room ID from URL params
  const eventId = searchParams?.get('id');
  const processId = searchParams?.get('processId');

  // Store media streams for cleanup
  const streamRef = useRef<MediaStream | null>(null);
  const screenStreamRef = useRef<MediaStream | null>(null);
  const micStreamRef = useRef<MediaStream | null>(null);

  // Fetch existing live contexts for the current process or event
  const { data: liveContexts, isLoading: isLoadingContexts } = useQuery<LiveContext[]>({
    queryKey: ['live-contexts', { processId, eventId }],
    queryFn: async () => {
      // Only fetch if we have a process ID or event ID
      if (!processId && !eventId) return [];

      const params: {
        processId?: string;
        eventId?: string;
        limit?: number;
      } = {};

      if (processId) params.processId = processId;
      if (eventId) params.eventId = eventId;
      params.limit = 5; // Get the most recent contexts

      const result = await liveService.getContexts(params);
      if (result.error) {
        console.error('Error fetching live contexts:', result.error);
        return [];
      }

      return result.data || [];
    },
    enabled: !!processId || !!eventId,
  });

  // Function to clear error
  const clearError = () => {
    setError(null);
  };

  // Fetch event details with React Query
  const { data: eventData, isLoading: isLoadingEvent } = useQuery({
    queryKey: ['event', eventId],
    queryFn: async () => {
      if (!eventId) return null;

      const eventResult = await EventService.getEventById(eventId);
      if (eventResult.error) {
        throw new Error(eventResult.error);
      }

      return eventResult.data;
    },
    enabled: !!eventId,
    onSuccess: (data) => {
      if (data?.process?.templateId) {
        // Found template ID
      }
    },
    onError: (error) => {
      console.error('Error loading event details:', error);
      setError('Failed to load event details');
    },
  });

  // Extract template ID from event data
  const templateId = eventData?.process?.templateId || null;

  // Extract process ID from event data if not in URL
  // Direct processId from the event object (not nested under process)
  const eventProcessId = eventData?.processId;
  const effectiveProcessId = processId || eventProcessId;

  // Debug the process ID source
  useEffect(() => {
    if (processId) {
      // Process ID from URL params
    } else if (eventProcessId) {
      // Process ID from event data
    }
  }, [processId, eventProcessId]);

  // Fetch process context with React Query to get process details
  // Using the standard process endpoint
  const { data: processContext } = useQuery<LiveProcessContext>({
    queryKey: ['process-context', effectiveProcessId],
    queryFn: async () => {
      if (!effectiveProcessId) {
        // No process ID available for fetching context
        return null;
      }

      // Fetching process context
      const result = await liveService.getProcessContext(effectiveProcessId);

      if (result.error) {
        console.error('Error fetching process context:', result.error);
        throw new Error(result.error);
      }

      // Process context fetched successfully

      return result.data;
    },
    enabled: !!effectiveProcessId,
    staleTime: 30000, // Cache for 30 seconds for better performance
    onError: (error) => {
      console.error('Process context query error:', error);
    },
  });

  // Fetch participants with React Query
  const { data: participantsData = [] } = useQuery({
    queryKey: ['participants', eventId],
    queryFn: async () => {
      if (!eventId) return [];

      const result = await EventService.getParticipants(eventId);
      if (result.error) {
        throw new Error(result.error);
      }

      // Map API participants to StreamParticipant format
      const eventParticipants = (result.data || []).map((p) => ({
        id: p.userId,
        name: p.user?.name || 'Participant',
        isLocal: false,
        role: p.role,
      }));

      // Add AI assistant to participants
      return [...eventParticipants, { id: 'ai-assistant', name: 'AI Assistant', isAI: true }];
    },
    enabled: !!eventId,
    onError: (error) => {
      console.error('Error loading participants:', error);
    },
    // Default participants if query fails or is disabled
    placeholderData: [
      { id: '1', name: 'You', isLocal: true },
      { id: '2', name: 'AI Assistant', isAI: true },
    ],
  });

  // Initialize participants state with data from query
  const participants = participantsData;

  // Start timer when recording begins
  useEffect(() => {
    if (isRecording && !startTime) {
      setStartTime(new Date());
    } else if (!isRecording) {
      setStartTime(null);
    }
  }, [isRecording, startTime]);

  // Update timer
  useEffect(() => {
    if (!startTime) return;

    const interval = setInterval(() => {
      const now = new Date();
      const diff = Math.floor((now.getTime() - startTime.getTime()) / 1000);
      const minutes = Math.floor(diff / 60)
        .toString()
        .padStart(2, '0');
      const seconds = (diff % 60).toString().padStart(2, '0');
      setElapsedTime(`${minutes}:${seconds}`);
    }, 1000);

    return () => clearInterval(interval);
  }, [startTime]);

  // Cleanup function for media streams
  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
      if (screenStreamRef.current) {
        screenStreamRef.current.getTracks().forEach((track) => track.stop());
      }
      if (micStreamRef.current) {
        micStreamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  const getStatusColor = () => {
    if (liveMode === LiveMode.OFF) return 'bg-red-500';
    if (!showInterface) return 'bg-orange-500';
    return 'bg-green-500';
  };

  const toggleInterface = () => {
    setShowInterface(!showInterface);
  };

  const setMode = (mode: LiveMode) => {
    setLiveMode(mode);
    setShowInterface(true);
  };

  // Media control functions
  const toggleCamera = async (): Promise => {
    try {
      // Prevent multiple toggles
      if (cameraState === MediaControlState.LOADING) {
        return;
      }

      setCameraState(MediaControlState.LOADING);

      if (cameraState === MediaControlState.OFF) {
        // Turn camera on
        try {
          // Very simple constraints to ensure compatibility
          const stream = await navigator.mediaDevices.getUserMedia({
            video: true,
          });

          streamRef.current = stream;

          // Make sure we're accessing the current reference
          if (videoRef.current) {
            // Set the source before anything else
            videoRef.current.srcObject = stream;

            // Force play the video
            const playPromise = videoRef.current.play();
            if (playPromise !== undefined) {
              playPromise.catch((e) => console.error('Error playing camera video:', e));
            }
          } else {
            console.error('videoRef.current is null');
          }

          setCameraState(MediaControlState.ON);
        } catch (mediaError) {
          console.error('Error accessing camera:', mediaError);
          setCameraState(MediaControlState.OFF);
          throw mediaError;
        }
      } else {
        // Turn camera off
        if (streamRef.current) {
          streamRef.current.getTracks().forEach((track) => {
            track.stop();
          });
        }
        if (videoRef.current) {
          videoRef.current.srcObject = null;
        }
        streamRef.current = null;
        setCameraState(MediaControlState.OFF);
      }
    } catch (error) {
      console.error('Error toggling camera:', error);
      setCameraState(MediaControlState.OFF);
    }
  };

  const toggleMicrophone = async (): Promise => {
    try {
      // Prevent multiple toggles
      if (microphoneState === MediaControlState.LOADING) {
        return;
      }

      setMicrophoneState(MediaControlState.LOADING);

      if (microphoneState === MediaControlState.OFF) {
        // Turn microphone on
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: {
            channelCount: 1,
            sampleRate: 16000, // 16kHz is good for speech recognition
            echoCancellation: true,
            noiseSuppression: true,
          },
        });
        micStreamRef.current = stream;
        setMicrophoneState(MediaControlState.ON);

        // Automatically start recording when microphone is turned on
        if (!isRecording) {
          // Use state update callback to ensure we're checking the latest state
          setIsRecording(true);

          // Add initial transcript entry
          const newEntry: TranscriptEntry = {
            id: uuidv4(),
            time: new Date().toISOString(),
            speaker: 'System',
            text: 'Recording started',
          };

          setTranscript((prev) => [...prev, newEntry]);

          // Start real-time transcription with OpenAI
          startRealTranscription();
        }
      } else {
        // Turn microphone off
        if (micStreamRef.current) {
          micStreamRef.current.getTracks().forEach((track) => track.stop());
        }

        // Stop audio recorder if running
        if (audioRecorder.isRecordingActive()) {
          audioRecorder.stopRecording();
        }

        micStreamRef.current = null;
        setMicrophoneState(MediaControlState.OFF);

        // Automatically stop recording when microphone is turned off
        if (isRecording) {
          setIsRecording(false);

          // Add final transcript entry
          const newEntry: TranscriptEntry = {
            id: uuidv4(),
            time: new Date().toISOString(),
            speaker: 'System',
            text: 'Recording stopped',
          };

          setTranscript((prev) => [...prev, newEntry]);
        }
      }
    } catch (error) {
      console.error('Error toggling microphone:', error);
      setMicrophoneState(MediaControlState.OFF);
    }
  };

  const toggleScreenShare = async (): Promise => {
    try {
      // Prevent multiple toggles
      if (screenShareState === MediaControlState.LOADING) {
        return;
      }

      setScreenShareState(MediaControlState.LOADING);

      if (screenShareState === MediaControlState.OFF) {
        // Start screen sharing
        try {
          // Simple constraints
          const stream = await navigator.mediaDevices.getDisplayMedia({
            video: true,
            audio: false,
          });

          screenStreamRef.current = stream;

          if (screenShareRef.current) {
            // Set the source before anything else
            screenShareRef.current.srcObject = stream;

            // Force play the video
            const playPromise = screenShareRef.current.play();
            if (playPromise !== undefined) {
              playPromise.catch((e) => console.error('Error playing screen share:', e));
            }
          } else {
            console.error('screenShareRef.current is null');
          }

          // Listen for when user ends the screen share from browser UI
          stream.getVideoTracks()[0].addEventListener('ended', () => {
            if (screenShareRef.current) {
              screenShareRef.current.srcObject = null;
            }
            screenStreamRef.current = null;
            setScreenShareState(MediaControlState.OFF);
          });

          setScreenShareState(MediaControlState.ON);
        } catch (mediaError) {
          console.error('Error accessing screen share:', mediaError);
          setScreenShareState(MediaControlState.OFF);
          // User might have cancelled the screen share prompt
          return;
        }
      } else {
        // Stop screen sharing
        if (screenStreamRef.current) {
          screenStreamRef.current.getTracks().forEach((track) => {
            track.stop();
          });
        }
        if (screenShareRef.current) {
          screenShareRef.current.srcObject = null;
        }
        screenStreamRef.current = null;
        setScreenShareState(MediaControlState.OFF);
      }
    } catch (error) {
      console.error('Error toggling screen share:', error);
      setScreenShareState(MediaControlState.OFF);
    }
  };

  // Start recording manually (only for use by external components, not by toggleMicrophone)
  const startRecording = async (): Promise => {
    try {
      // Check if already recording
      if (isRecording) return;

      // If microphone is off, we need to turn it on
      if (microphoneState === MediaControlState.OFF) {
        await toggleMicrophone(); // This will handle starting the recording
        return; // toggleMicrophone will handle everything else
      }

      // If we're here, it means the mic is on but recording isn't
      setIsRecording(true);

      // Add initial transcript entry
      const newEntry: TranscriptEntry = {
        id: uuidv4(),
        time: new Date().toISOString(),
        speaker: 'System',
        text: 'Recording started',
      };

      setTranscript((prev) => [...prev, newEntry]);
      // Start real-time transcription with OpenAI
      startRealTranscription();
    } catch (error) {
      console.error('Error starting recording:', error);
      setIsRecording(false);
    }
  };

  // Stop recording manually (only for use by external components, not by toggleMicrophone)
  const stopRecording = (): void => {
    // Check if already stopped
    if (!isRecording) return;

    // Stop the audio recorder if it's active
    if (audioRecorder.isRecordingActive()) {
      audioRecorder.stopRecording();
    }

    setIsRecording(false);

    // Add final transcript entry
    const newEntry: TranscriptEntry = {
      id: uuidv4(),
      time: new Date().toISOString(),
      speaker: 'System',
      text: 'Recording stopped',
    };

    setTranscript((prev) => [...prev, newEntry]);
  };

  // Start real-time transcription with the audio recorder
  const startRealTranscription = async () => {
    try {
      // Make sure audio recorder isn't already running
      if (audioRecorder.isRecordingActive()) {
        // Audio recorder is already active
        audioRecorder.stopRecording();
      }

      // Starting audio recorder

      // Start audio recording with a callback when audio data is available
      await audioRecorder.startRecording(async (audioBlob) => {
        // Update isRecording state to match the actual recorder state
        if (!isRecording && audioRecorder.isRecordingActive()) {
          // Updating recording state
          setIsRecording(true);
        }

        // Skip processing if recording has been explicitly stopped by user
        if (!audioRecorder.isRecordingActive()) {
          // Audio recorder is inactive
          return;
        }

        // Audio chunk received, sending for transcription

        try {
          // Send audio to OpenAI for transcription
          const result = await openAIService.processAudio(audioBlob);

          // If transcription has content, add it to the transcript
          if (result.text && result.text.trim() !== '') {
            const text = result.text.trim();
            // Transcription received

            // Create a new entry object
            const newEntry: TranscriptEntry = {
              id: uuidv4(),
              time: new Date().toISOString(),
              speaker: 'Jason Yu',
              text,
            };

            // Add to transcript - we'll let sendMessage in LiveView handle the rest
            setTranscript((prev) => [...prev, newEntry]);

            // We won't call sendMessage directly here anymore
            // The LiveView component will detect new transcript entries from microphone
            // and process them appropriately
          } else {
            // Empty transcription received
          }
        } catch (error) {
          console.error('Error processing audio transcription:', error);

          // Add an error message to the transcript
          const errorEntry: TranscriptEntry = {
            id: uuidv4(),
            time: new Date().toISOString(),
            speaker: 'System',
            text: 'Error processing audio. Please check your API key and try again.',
          };

          setTranscript((prev) => [...prev, errorEntry]);
        }
      });

      // Real-time transcription started
    } catch (error) {
      console.error('Failed to start real-time transcription:', error);

      // Add an error message to the transcript
      const errorEntry: TranscriptEntry = {
        id: uuidv4(),
        time: new Date().toISOString(),
        speaker: 'System',
        text: 'Failed to start transcription. Falling back to simulation.',
      };

      setTranscript((prev) => [...prev, errorEntry]);

      // Fall back to simulation if real transcription fails
      simulateTranscriptionFallback();
    }
  };

  // Fallback to simulated transcription if real transcription fails
  const simulateTranscriptionFallback = () => {
    // Simulation disabled

    // Do not auto-generate any messages
    const errorEntry: TranscriptEntry = {
      id: uuidv4(),
      time: new Date().toISOString(),
      speaker: 'System',
      text: 'Speech recognition not available. Please type your messages instead.',
    };

    setTranscript((prev) => [...prev, errorEntry]);

    // We no longer simulate transcription to avoid false messages
    return () => {};
  };

  // Setup mutation for creating new contexts
  const createContextMutation = useMutation<
    APIResponse,
    Error,
    {
      processId?: string;
      eventId?: string;
      templateId?: string;
      messages?: LiveMessage[];
      metadata?: Record;
    }
  >({
    mutationFn: (data) => {
      return liveService.createContext(data);
    },
    onSuccess: (response) => {
      // Invalidate the contexts query
      queryClient.invalidateQueries({
        queryKey: ['live-contexts', { processId, eventId }],
      });
    },
  });

  // Setup mutation for processing messages with the backend
  const processMessageMutation = useMutation<
    {
      data: LiveResponse | null;
      error: string | null;
    },
    Error,
    {
      message: string;
      contextId?: string;
    }
  >({
    mutationFn: (data) => {
      return liveService.processMessage({
        message: data.message,
        contextId: data.contextId,
        processId: processId || undefined,
        eventId: eventId || undefined,
      });
    },
    onSuccess: (response) => {
      // Invalidate related queries
      if (processId) {
        queryClient.invalidateQueries({ queryKey: ['process', processId] });
      }
      if (eventId) {
        queryClient.invalidateQueries({ queryKey: ['event', eventId] });
      }
      queryClient.invalidateQueries({
        queryKey: ['live-contexts', { processId, eventId }],
      });
    },
  });

  const sendMessage = async (text: string): Promise => {
    // This function is now a stub that just logs the request
    // Actual processing is handled in LiveView component
    // Message received in hook

    try {
      // Get the latest context ID
      let contextId: string | undefined = undefined;
      if (liveContexts && liveContexts.length > 0) {
        // Use the most recently created context
        contextId = liveContexts[0]?.id;
      }

      // Call backend to log the message, but we don't use the response
      await processMessageMutation.mutateAsync({
        message: text,
        contextId,
      });
    } catch (error) {
      console.error('Error logging message with backend:', error);
    } finally {
      // Always set processing to false when done
      setIsProcessingAI(false);
    }

    // Return the input message to satisfy the Promise return type
    return text;
  };

  const clearConversation = () => {
    setAiMessages([]);
    setTranscript([]);
    // Reset conversation context by invalidating the query
    queryClient.invalidateQueries({
      queryKey: ['live-contexts', { processId, eventId }],
    });
  };

  // AI conversation interface
  const aiConversation: AIConversation = {
    messages: aiMessages,
    isProcessing: isProcessingAI,
    sendMessage,
    clearConversation,
  };

  // Media controls interface
  const mediaControls: MediaControls = {
    camera: cameraState,
    microphone: microphoneState,
    screen: screenShareState,
    toggleCamera,
    toggleMicrophone,
    toggleScreenShare,
  };

  // Conversation mode options for UI
  // Reference for debouncing input processing
  const userInputRef = useRef<{
    lastInputTime: number;
    pendingInput: string;
    processingInput: boolean;
  }>({ lastInputTime: 0, pendingInput: '', processingInput: false });

  const modeOptions = [
    {
      mode: LiveMode.VOICE,
      label: 'Voice',
      ariaLabel: 'Switch to voice mode',
    },
    {
      mode: LiveMode.IN,
      label: 'Input',
      ariaLabel: 'Switch to input mode',
    },
    {
      mode: LiveMode.OUT,
      label: 'Output',
      ariaLabel: 'Switch to output mode',
    },
  ];

  // Function to navigate to template process or create new template
  const handleViewTemplate = () => {
    if (templateId) {
      try {
        // Navigating to template process

        // Update the app state to show we're in the PROCESS view
        app.setMainView(AppRoute.PROCESS);

        // Navigate to the process with the template ID
        router.push(`/process?id=${templateId}`);
      } catch (error) {
        console.error('Error navigating to template:', error);
        setError('Failed to navigate to template process');
      }
    } else {
      // If no template exists, navigate to create a new template
      // with current session data as prefill values
      try {
        // Creating new template

        // Update the app state
        app.setMainView(AppRoute.PROCESS);

        // Prepare prefill data from current session
        const prefillData = {
          title: eventData?.title || '',
          description: eventData?.description || '',
          steps: eventData?.process?.steps || [],
        };

        // Navigate to process route with create=true and prefill data
        router.push(`/process?create=true&prefill=${encodeURIComponent(JSON.stringify(prefillData))}`);
      } catch (error) {
        console.error('Error creating template:', error);
        setError('Failed to create template process');
      }
    }
  };

  return {
    videoRef,
    screenShareRef,
    showInterface,
    setShowInterface,
    toggleInterface,
    liveMode,
    setLiveMode: setMode,
    getStatusColor,
    participants,
    modeOptions,
    mediaControls,
    transcript,
    setTranscript, // Expose setTranscript for the LiveView component
    isRecording,
    startRecording,
    stopRecording,
    aiConversation,
    elapsedTime,
    microphoneStream: micStreamRef.current,
    // Added loading and error handling
    isLoading: isLoadingEvent || isLoadingContexts,
    setIsLoading: (loading: boolean) => {
      // This is a no-op since we're using React Query now
    },
    error,
    clearError,
    eventId,
    // Template handling
    templateId,
    handleViewTemplate,
    // Live context data
    processId,
    processContext,
    liveContexts,
    createContext: createContextMutation.mutate,
    processMessage: processMessageMutation,
    isCreatingContext: createContextMutation.isPending,
    isProcessingMessage: processMessageMutation.isPending,
  };
}

/**
 * Provider component that wraps your app and makes conversation context available to any
 * child component that calls useConversation().
 */
export function LiveProvider({ children }: LiveProviderProps) {
  const liveState = useLiveState();

  return <LiveContext.Provider value={liveState}>{children}</LiveContext.Provider>;
}

/**
 * Custom hook to use the conversation context
 */
export function useLive() {
  const context = useContext(LiveContext);
  return context;
}
