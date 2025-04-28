'use client';

import logger from '@/app/lib/logger';
import OpenAI from 'openai';

// OpenAI API client singleton
let openaiInstance: OpenAI | null = null;

// Initialize OpenAI client
const getOpenAIClient = (): OpenAI => {
  if (!openaiInstance) {
    // Use the API key from environment variables
    const apiKey = process.env.NEXT_PUBLIC_OPENAI_KEY;

    if (!apiKey || apiKey === 'your-openai-api-key-here') {
      logger.error('OpenAI API key is missing or invalid. Please check your .env.local file.');
    }

    openaiInstance = new OpenAI({
      apiKey: apiKey || 'dummy-key',
      dangerouslyAllowBrowser: true, // Only for client components - in production use server components
    });

    // Log success but not the actual key
    logger.info('OpenAI client initialized', apiKey ? 'with valid API key' : 'without valid API key');
  }
  return openaiInstance;
};

export interface TranscriptionResult {
  text: string;
  isFinal: boolean;
}

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

// Audio context for text-to-speech
let audioContext: AudioContext | null = null;

export class OpenAIService {
  private client: OpenAI;
  private conversationHistory: ChatMessage[] = [];
  private processContext: any = null;
  private eventContext: any = null;

  constructor() {
    this.client = getOpenAIClient();

    // Initialize with default system message - will be updated with context
    this.conversationHistory = [
      {
        role: 'system',
        content:
          'You are AIDE, an Advanced Intelligent Digital Expert in a live operational context. Your personality is confident, technically precise, and focused on operational excellence. Address the user as an operator with high technical knowledge.',
      },
    ];
  }

  /**
   * Set process context from backend data
   */
  setProcessContext(processContext: any): void {
    this.processContext = processContext;
    this.updateSystemPrompt();
  }

  /**
   * Set event context from backend data
   */
  setEventContext(eventContext: any): void {
    this.eventContext = eventContext;
    this.updateSystemPrompt();
  }

  /**
   * Update the system prompt with available context
   */
  private updateSystemPrompt(): void {
    let systemPrompt =
      'You are AIDE, an Advanced Intelligent Digital Expert in a live operational context. ' +
      'Your personality is confident, technically precise, and focused on operational excellence. ' +
      'Address the user as an operator with high technical knowledge. ';

    // Add process-specific information if available
    if (this.processContext) {
      const process = this.processContext.process;

      systemPrompt += `\n\nACTIVE SOP: '${process.title}'\n` + `OBJECTIVE: ${process.description || 'Not specified'}\n\n`;

      // Add steps information if available
      if (process.steps && process.steps.length > 0) {
        const totalSteps = process.steps.length;
        const completedSteps = process.steps.filter((step: any) => step.completed).length;
        const completionPercentage = Math.round((completedSteps / totalSteps) * 100);

        systemPrompt += `PROCEDURE STATUS:\n` + `Overall Progress: ${completedSteps}/${totalSteps} steps complete (${completionPercentage}%)\n\n`;

        // List all steps and their statuses
        process.steps.forEach((step: any, index: number) => {
          const stepNum = index + 1;
          const status = step.completed ? '✓ COMPLETE' : '○ PENDING';
          systemPrompt += `${stepNum}. ${step.content} - ${status}\n`;

          // Add substeps if any
          if (step.subSteps && step.subSteps.length > 0) {
            const completedSubsteps = step.subSteps.filter((substep: any) => substep.completed).length;
            const totalSubsteps = step.subSteps.length;

            if (!step.completed && totalSubsteps > 0) {
              systemPrompt += `   (${completedSubsteps}/${totalSubsteps} substeps complete)\n`;
            }

            step.subSteps.forEach((substep: any, subIndex: number) => {
              const substepNum = subIndex + 1;
              const substepStatus = substep.completed ? '✓ Done' : '○ Pending';
              systemPrompt += `   ${stepNum}.${substepNum}. ${substep.content} - ${substepStatus}\n`;
            });
          }
        });
      }

      // Add guidance for this process
      systemPrompt +=
        `\nCONTEXT GUIDANCE:\n` +
        `1. Always acknowledge the current operation and its priority within the SOP\n` +
        `2. Reference specific step numbers when suggesting actions\n` +
        `3. When the operator indicates task completion, proactively suggest marking steps as complete\n` +
        `4. Recommend efficiency improvements where appropriate\n` +
        `5. For exceptional circumstances, note when deviation from SOP may be required and consequences\n`;
    }

    // Replace the system message with the updated context
    if (this.conversationHistory.length > 0 && this.conversationHistory[0].role === 'system') {
      this.conversationHistory[0].content = systemPrompt;
    } else {
      // Insert the system message at the beginning if it doesn't exist
      this.conversationHistory.unshift({
        role: 'system',
        content: systemPrompt,
      });
    }

    logger.info('Updated system prompt with context information');
  }

  /**
   * Process audio for speech-to-text transcription using OpenAI Whisper API
   */
  async processAudio(audioChunk: Blob): Promise {
    try {
      // Skip empty audio chunks
      if (audioChunk.size === 0) {
        logger.warn('Empty audio chunk received, skipping transcription');
        return { text: '', isFinal: false };
      }

      // Check if we have a real API key
      if (this.client.apiKey === 'dummy-key') {
        logger.info('No API key provided - cannot process audio');
        return { text: '', isFinal: false };
      }

      // Create a file from the blob for API compatibility
      const audioFile = new File([audioChunk], 'recording.webm', {
        type: audioChunk.type || 'audio/webm',
      });

      // Make the API request
      const response = await this.client.audio.transcriptions.create({
        file: audioFile,
        model: 'whisper-1',
        language: 'en',
      });

      const text = response.text.trim();

      // Return the transcription
      return {
        text,
        isFinal: true,
      };
    } catch (error) {
      logger.error('Error transcribing audio:', error);
      return { text: '', isFinal: false };
    }
  }

  /**
   * Add a user message to the conversation history
   */
  addUserMessage(content: string): void {
    this.conversationHistory.push({
      role: 'user',
      content,
    });
  }

  /**
   * Generate a response based on the conversation history
   */
  async generateResponse(): Promise {
    try {
      // Check if we have a real API key
      if (this.client.apiKey === 'dummy-key') {
        logger.info('Using simulated AI response (no API key provided)');

        // Use a simulated response for development without an API key
        const simulatedResponses = [
          "I understand what you're saying. Let me help you with that.",
          "That's an interesting point. Have you considered looking at it from another angle?",
          "Based on what you've shared, I recommend focusing on optimizing your approach.",
          "I see the challenge you're facing. Let's break it down into manageable steps.",
          'Great progress so far! You might want to consider adding some error handling.',
        ];

        const aiMessage = simulatedResponses[Math.floor(Math.random() * simulatedResponses.length)];

        // Add the simulated response to the conversation history
        this.conversationHistory.push({
          role: 'assistant',
          content: aiMessage,
        });

        return aiMessage;
      }

      // Make a real API request
      const response = await this.client.chat.completions.create({
        model: 'gpt-4-turbo',
        messages: this.conversationHistory,
        temperature: 0.7,
        max_tokens: 1000,
      });

      const aiMessage = response.choices[0].message.content || "I apologize, but I couldn't generate a response.";

      // Add the assistant's response to the conversation history
      this.conversationHistory.push({
        role: 'assistant',
        content: aiMessage,
      });

      return aiMessage;
    } catch (error) {
      console.error('Error generating response:', error);
      return 'Sorry, I encountered an error while processing your request.';
    }
  }

  /**
   * Generate a streaming response based on the conversation history
   * @param onChunk Callback that will be called with each new chunk of text
   * @param onComplete Callback that will be called when streaming is complete
   */
  async generateStreamingResponse(
    onChunk: (chunk: string) => void,
    onComplete: (fullText: string) => void,
    onSuggestedOperations?: (operations: any[]) => void,
  ): Promise {
    try {
      // Check if we have a real API key
      if (this.client.apiKey === 'dummy-key') {
        logger.warn('Using API key is required - cannot simulate conversation');

        // Create a standardized error message instead of simulating a response
        const errorResponse = "I'm sorry, but I need a valid API key to function properly. Please provide a valid OpenAI API key in your .env file.";

        // Add to conversation history
        this.conversationHistory.push({
          role: 'assistant',
          content: errorResponse,
        });

        // Send the error message as a single chunk
        onChunk(errorResponse);

        // Play the response as speech
        this.textToSpeech(errorResponse);
        onComplete(errorResponse);

        return;
      }

      logger.info('Using OpenAI API for streaming response');

      // Create a streaming response from the API
      let fullText = '';

      try {
        const stream = await this.client.chat.completions.create({
          model: 'gpt-4-turbo',
          messages: this.conversationHistory,
          temperature: 0.7,
          max_tokens: 1000,
          stream: true,
        });

        // Process the stream as it comes in
        for await (const chunk of stream) {
          const content = chunk.choices[0]?.delta?.content || '';
          if (content) {
            fullText += content;
            onChunk(content);
          }
        }

        // Add the complete response to the conversation history
        this.conversationHistory.push({
          role: 'assistant',
          content: fullText,
        });

        // If we have a process context and callback for suggested operations, analyze the response
        if (this.processContext && onSuggestedOperations) {
          // Generate suggested operations based on the response
          const suggestedOps = await this.analyzeSuggestedOperations(fullText);
          if (suggestedOps.length > 0) {
            onSuggestedOperations(suggestedOps);
          }
        }

        // Signal completion
        onComplete(fullText);
      } catch (apiError: any) {
        // More detailed API error handling
        logger.error('OpenAI API streaming error:', apiError);

        let errorMessage = 'Sorry, I encountered an error while processing your request.';

        // Check for specific error types
        if (apiError.status === 401) {
          logger.error('Authentication error: Invalid API key');
          errorMessage = 'Authentication failed: Invalid API key. Please check your OpenAI API key.';
        } else if (apiError.status === 429) {
          logger.error('OpenAI API quota exceeded');
          errorMessage = 'OpenAI API quota exceeded. Please try again later.';
        } else {
          logger.error('OpenAI API error:', apiError.message || 'Unknown error');
          errorMessage = `Error: ${apiError.message || 'Unknown API error'}`;
        }

        // Add error message to history
        this.conversationHistory.push({
          role: 'assistant',
          content: errorMessage,
        });

        onChunk(errorMessage);
        // Play error message as speech
        this.textToSpeech(errorMessage);
        onComplete(errorMessage);

        throw apiError; // Rethrow for higher-level handling
      }
    } catch (error) {
      console.error('Error generating streaming response:', error);
      const errorMessage = 'Sorry, I encountered an error while processing your request.';

      // Add error message to history
      this.conversationHistory.push({
        role: 'assistant',
        content: errorMessage,
      });

      onChunk(errorMessage);
      onComplete(errorMessage);
    }
  }

  /**
   * Analyze the assistant's response to suggest operations
   * @param response The assistant's full response text
   * @returns Array of suggested operations
   */
  private async analyzeSuggestedOperations(response: string): Promise {
    try {
      if (!this.processContext) {
        return [];
      }

      const process = this.processContext.process;

      // Create a function call to analyze the response
      const functionDef = {
        name: 'suggest_process_actions',
        description: 'Analyze operator input and proactively suggest SOP actions to take based on context',
        parameters: {
          type: 'object',
          properties: {
            is_process_related: {
              type: 'boolean',
              description: 'Whether the operator message is related to the current SOP process.',
            },
            current_focus: {
              type: 'object',
              properties: {
                step_index: {
                  type: 'integer',
                  description: 'The 1-based index of the step the operator is currently focusing on',
                },
                substep_index: {
                  type: 'integer',
                  description: 'The 1-based index of the substep the operator is currently focusing on, if applicable',
                },
                context_notes: {
                  type: 'string',
                  description: 'Brief notes about what the operator is currently doing',
                },
              },
            },
            suggested_operations: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  operation: {
                    type: 'string',
                    enum: ['complete_step', 'add_step', 'add_substep', 'update_step'],
                    description: 'Type of operation to perform',
                  },
                  priority: {
                    type: 'string',
                    enum: ['high', 'medium', 'low'],
                    description: 'Priority of this operation suggestion',
                  },
                  description: {
                    type: 'string',
                    description: 'Technical, concise description of the operation for the operator',
                  },
                  step_id: {
                    type: 'string',
                    description: 'ID of the step to modify (if applicable)',
                  },
                  substep_id: {
                    type: 'string',
                    description: 'ID of the substep to modify (if applicable)',
                  },
                  content: {
                    type: 'string',
                    description: 'Content to add or update (if applicable)',
                  },
                  rationale: {
                    type: 'string',
                    description: 'Brief technical rationale for suggesting this operation',
                  },
                },
                required: ['operation', 'description', 'priority'],
              },
            },
          },
          required: ['is_process_related', 'suggested_operations'],
        },
      };

      // Get most recent user message
      const userMessages = this.conversationHistory.filter((msg) => msg.role === 'user');
      const lastUserMessage = userMessages.length > 0 ? userMessages[userMessages.length - 1].content : '';

      // Create analysis messages
      const analysisMessages = [
        {
          role: 'system',
          content:
            'You are an AI assistant analyzing conversation to suggest process operations. Based on the user message and assistant response, determine if process-related operations should be suggested.',
        },
        {
          role: 'user',
          content: `User message: "${lastUserMessage}"\nAssistant response: "${response}"\n\nBased on this conversation, suggest appropriate process operations related to the SOP.`,
        },
      ];

      // Call OpenAI to analyze and suggest operations
      const completion = await this.client.chat.completions.create({
        model: 'gpt-4-turbo',
        messages: analysisMessages,
        functions: [functionDef],
        function_call: { name: 'suggest_process_actions' },
        temperature: 0.2,
      });

      // Extract function call arguments
      const functionCall = completion.choices[0]?.message?.function_call;
      if (functionCall && functionCall.name === 'suggest_process_actions') {
        try {
          const args = JSON.parse(functionCall.arguments);

          if (args.is_process_related && args.suggested_operations && args.suggested_operations.length > 0) {
            // Format operations to match expected structure
            const formattedOps = args.suggested_operations.map((op: any) => {
              // Find matching step based on index or content
              let stepId = op.step_id;

              // If we have a step index but no ID, try to get the ID from the process steps
              if (!stepId && op.current_focus?.step_index && process.steps) {
                const stepIndex = op.current_focus.step_index - 1;
                if (stepIndex >= 0 && stepIndex < process.steps.length) {
                  stepId = process.steps[stepIndex].id;
                }
              }

              return {
                operation: op.operation,
                description: op.description,
                priority: op.priority || 'medium',
                rationale: op.rationale,
                stepId: stepId,
                subStepId: op.substep_id,
                content: op.content,
                processId: process.id,
              };
            });

            logger.info(`Generated ${formattedOps.length} suggested operations from AI analysis`);
            return formattedOps;
          }
        } catch (error) {
          logger.error('Error parsing suggested operations:', error);
        }
      }

      return [];
    } catch (error) {
      logger.error('Error analyzing for suggested operations:', error);
      return [];
    }
  }

  /**
   * Get the current conversation history
   */
  getConversationHistory(): ChatMessage[] {
    return [...this.conversationHistory];
  }

  /**
   * Clear the conversation history except for the system prompt
   */
  resetConversation(): void {
    this.conversationHistory = this.conversationHistory.slice(0, 1);
  }

  /**
   * Convert text to speech using the OpenAI TTS API
   * @param text The text to convert to speech
   * @returns Promise that resolves when speech is played
   */
  async textToSpeech(text: string): Promise {
    try {
      // Check if we have a real API key
      if (this.client.apiKey === 'dummy-key') {
        logger.info('Using browser TTS (no API key provided)');

        // Use browser's built-in speech synthesis
        if ('speechSynthesis' in window) {
          const utterance = new SpeechSynthesisUtterance(text);
          utterance.rate = 1.0;
          utterance.pitch = 1.0;
          utterance.volume = 1.0;
          window.speechSynthesis.speak(utterance);
        } else {
          logger.warn('Browser does not support speech synthesis');
        }
        return;
      }

      try {
        // Create TTS request
        const response = await this.client.audio.speech.create({
          model: 'tts-1',
          voice: 'alloy',
          input: text,
        });

        // Convert response to array buffer
        const audioBuffer = await response.arrayBuffer();

        // Create audio context if needed
        if (!audioContext) {
          audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
        }

        // Decode and play audio
        audioContext.decodeAudioData(audioBuffer, (buffer) => {
          const source = audioContext!.createBufferSource();
          source.buffer = buffer;
          source.connect(audioContext!.destination);
          source.start(0);
        });
      } catch (apiError: any) {
        logger.error('OpenAI TTS API error:', apiError);

        // Fall back to browser TTS
        if ('speechSynthesis' in window) {
          logger.info('Falling back to browser TTS due to API error');
          const utterance = new SpeechSynthesisUtterance(text);
          window.speechSynthesis.speak(utterance);
        }
      }
    } catch (error) {
      logger.error('Error in text-to-speech:', error);
    }
  }

  /**
   * Summarize the conversation
   * @returns A summary of the key points in the conversation
   */
  async generateSummary(): Promise {
    try {
      // If there aren't enough messages to summarize, return a simple message
      if (this.conversationHistory.length <= 2) {
        return "The conversation hasn't progressed enough to generate a summary.";
      }

      // Check if we have a real API key
      if (this.client.apiKey === 'dummy-key') {
        logger.info('Using simulated summary (no API key provided)');

        // Return a simulated summary
        const simulatedSummaries = [
          'The conversation covered project status updates and next steps for implementation.',
          'Key points included technical challenges with the API integration and proposed solutions.',
          'The discussion focused on design improvements and user experience considerations.',
          'The team reviewed progress on feature development and identified blocking issues.',
          'The conversation addressed timeline concerns and established new milestone dates.',
        ];

        return simulatedSummaries[Math.floor(Math.random() * simulatedSummaries.length)];
      }

      // Create a summary request with a special system prompt
      const summaryMessages: ChatMessage[] = [
        {
          role: 'system',
          content:
            'You are an AI assistant tasked with summarizing conversations. Create a brief, concise summary of the key points discussed in the following conversation. Focus on the most important topics, decisions, and action items. Keep the summary to 1-2 sentences.',
        },
        ...this.conversationHistory.slice(1), // Skip the original system message
      ];

      // Make the API request
      const response = await this.client.chat.completions.create({
        model: 'gpt-4-turbo',
        messages: summaryMessages,
        temperature: 0.3, // Lower temperature for more focused summaries
        max_tokens: 150, // Short summary
      });

      return response.choices[0].message.content || 'Unable to generate a summary.';
    } catch (error) {
      logger.error('Error generating summary:', error);
      return 'Unable to generate a summary due to an error.';
    }
  }
}

export default new OpenAIService();
