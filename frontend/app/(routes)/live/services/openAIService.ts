'use client';

import OpenAI from 'openai';

/**
 * Type definitions for OpenAI service
 */
export interface TranscriptionResult {
  text: string;
  isFinal: boolean;
}

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface SuggestedOperation {
  operation: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
  stepId?: string;
  subStepId?: string;
  content?: string;
  rationale?: string;
  processId?: string;
}

export interface ProcessContext {
  process: {
    id: string;
    title: string;
    description?: string;
    steps?: Array;
  };
  relatedEvents: any[];
  recentMessages: any[];
  userPreferences?: any;
}

export interface EventContext {
  id: string;
  title: string;
  description?: string;
  startTime?: string;
  endTime?: string;
  processId?: string;
  // Steps should only come from Process, never directly from Event
  // Remove steps from EventContext
  // steps?: Array<any>; - REMOVED
  // For information, we still might have a reference to the process
  // in the event context, but we should only use it for ID and title
  process?: {
    id: string;
    title?: string;
    templateId?: string;
    // Steps removed from here too - should be fetched through proper process endpoint
  };
  participants?: any[];
  tags?: string[];
}

// OpenAI API client singleton
let openaiInstance: OpenAI | null = null;

/**
 * Service for interacting with OpenAI's API
 */
class OpenAIService {
  private client: OpenAI;
  private conversationHistory: ChatMessage[] = [];
  private processContext: ProcessContext | null = null;
  private eventContext: EventContext | null = null;
  private systemMessageIndex = 0;

  constructor() {
    this.client = this.getOpenAIClient();
    this.conversationHistory = [
      {
        role: 'system',
        content: this.getDefaultSystemPrompt(),
      },
    ];
    this.systemMessageIndex = 0;
  }

  // Get or initialize OpenAI client
  private getOpenAIClient(): OpenAI {
    if (!openaiInstance) {
      const apiKey = process.env.NEXT_PUBLIC_OPENAI_KEY;
      openaiInstance = new OpenAI({
        apiKey: apiKey || 'dummy-key',
        dangerouslyAllowBrowser: true,
      });
    }
    return openaiInstance;
  }

  setProcessContext(processContext: ProcessContext): void {
    if (!processContext?.process) return;
    this.processContext = processContext;
    this.updateSystemPrompt();
  }

  setEventContext(eventContext: EventContext): void {
    if (!eventContext?.id) return;
    this.eventContext = eventContext;
    this.updateSystemPrompt();
  }

  private getDefaultSystemPrompt(): string {
    return (
      'You are AIDE, an Advanced Intelligent Digital Expert in a live operational context. ' +
      'Your personality is confident, technically precise, and focused on operational excellence. ' +
      'Address the user as an operator with high technical knowledge.'
    );
  }

  private updateSystemPrompt(): void {
    let systemPrompt = this.getDefaultSystemPrompt();

    // Add event information
    if (this.eventContext) {
      systemPrompt += `\n\nCURRENT SESSION: "${this.eventContext.title}"`;

      if (this.eventContext.description) {
        systemPrompt += `\nSESSION DETAILS: ${this.eventContext.description}`;
      }

      if (this.eventContext.startTime) {
        const startTimeStr = new Date(this.eventContext.startTime).toLocaleString();
        systemPrompt += `\nSTART TIME: ${startTimeStr}`;

        if (this.eventContext.endTime) {
          systemPrompt += ` | END TIME: ${new Date(this.eventContext.endTime).toLocaleString()}`;
        }
      }
    }

    // ONLY use process data from the processContext, never from event context
    // This follows the proper event->process->steps relationship
    const process = this.processContext?.process;

    // Add process information if available
    if (process) {
      systemPrompt += `\n\nACTIVE PROCESS: "${process.title || 'Current Process'}"`;

      if (process.description) {
        systemPrompt += `\nOBJECTIVE: ${process.description}`;
      }

      // Add steps information directly from process
      const steps = process.steps || [];
      if (steps.length > 0) {
        // Only count steps as completed if they have both completed=true AND completedAt timestamp
        const completedCount = steps.filter((step) => step.completed && step.completedAt).length;
        const percent = Math.round((completedCount / steps.length) * 100);

        systemPrompt += `\n\nPROCEDURE STATUS:\n`;
        systemPrompt += `Progress: ${completedCount}/${steps.length} steps (${percent}%)\n`;

        // List all steps
        steps.forEach((step, i) => {
          const num = i + 1;
          const status = step.completed && step.completedAt ? '✓' : '○';
          systemPrompt += `${num}. ${status} ${step.content}\n`;

          // Add substeps if any
          if (step.subSteps?.length > 0) {
            step.subSteps.forEach((substep, j) => {
              const subStatus = substep.completed && substep.completedAt ? '✓' : '○';
              systemPrompt += `   ${num}.${j + 1}. ${subStatus} ${substep.content}\n`;
            });
          }
        });

        systemPrompt += `\nWhen the user completes a step, suggest marking it as complete.`;
        systemPrompt += `\nReference step numbers when making suggestions about the process.`;
      }
    } else if (this.eventContext?.processId) {
      // If we have an event with processId but no process content, just acknowledge it
      systemPrompt += `\n\nThis session is linked to process ID: ${this.eventContext.processId}`;
      systemPrompt += `\nNo process details are currently available.`;
    }

    // Update system message
    if (this.systemMessageIndex === 0 && this.conversationHistory[0]?.role === 'system') {
      this.conversationHistory[0].content = systemPrompt;
    } else {
      this.conversationHistory.unshift({
        role: 'system',
        content: systemPrompt,
      });
      this.systemMessageIndex = 0;
    }
  }

  async processAudio(audioChunk: Blob): Promise {
    try {
      if (!audioChunk?.size || this.client.apiKey === 'dummy-key') {
        return { text: '', isFinal: false };
      }

      const audioFile = new File([audioChunk], 'recording.webm', {
        type: audioChunk.type || 'audio/webm',
      });

      const response = await this.client.audio.transcriptions.create({
        file: audioFile,
        model: 'whisper-1',
        language: 'en',
        response_format: 'json',
        temperature: 0.0,
      });

      return {
        text: (response.text || '').trim(),
        isFinal: true,
      };
    } catch (error) {
      console.error('Error transcribing audio:', error);
      return { text: '', isFinal: false };
    }
  }

  addUserMessage(content: string): void {
    this.conversationHistory.push({
      role: 'user',
      content,
    });
  }

  async generateResponse(): Promise {
    try {
      if (this.client.apiKey === 'dummy-key') {
        const simulatedResponses = [
          "I understand what you're saying. Let me help you with that.",
          "That's an interesting point. Have you considered looking at it from another angle?",
          "Based on what you've shared, I recommend focusing on optimizing your approach.",
          "I see the challenge you're facing. Let's break it down into manageable steps.",
          'Great progress so far! You might want to consider adding some error handling.',
        ];

        const aiMessage = simulatedResponses[Math.floor(Math.random() * simulatedResponses.length)];
        this.conversationHistory.push({
          role: 'assistant',
          content: aiMessage,
        });

        return aiMessage;
      }

      const response = await this.client.chat.completions.create({
        model: 'gpt-4-turbo',
        messages: this.conversationHistory,
        temperature: 0.7,
        max_tokens: 1000,
      });

      const aiMessage = response.choices[0].message.content || "I apologize, but I couldn't generate a response.";
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

  async generateStreamingResponse(
    onChunk: (chunk: string) => void,
    onComplete: (fullText: string) => void,
    onSuggestedOperations?: (operations: SuggestedOperation[]) => void,
  ): Promise {
    if (!onChunk || !onComplete) return;

    let fullText = '';

    try {
      if (this.client.apiKey === 'dummy-key') {
        const errorMessage = 'I need a valid API key to function properly. Please provide an OpenAI API key in your environment variables.';
        onChunk(errorMessage);
        onComplete(errorMessage);
        this.conversationHistory.push({
          role: 'assistant',
          content: errorMessage,
        });
        return;
      }

      const stream = await this.client.chat.completions.create({
        model: 'gpt-4-turbo',
        messages: this.conversationHistory,
        temperature: 0.7,
        max_tokens: 1000,
        stream: true,
        presence_penalty: 0.1,
        frequency_penalty: 0.1,
      });

      for await (const chunk of stream) {
        const content = chunk.choices[0]?.delta?.content || '';
        if (content) {
          fullText += content;
          onChunk(content);
        }
      }

      this.conversationHistory.push({
        role: 'assistant',
        content: fullText,
      });

      if (this.processContext && onSuggestedOperations) {
        this.analyzeSuggestedOperations(fullText)
          .then((ops) => {
            if (ops.length > 0) {
              onSuggestedOperations(ops);
            }
          })
          .catch((err) => console.error('Error analyzing operations:', err));
      }

      onComplete(fullText);
    } catch (error) {
      console.error('Error in generateStreamingResponse:', error);
      const errorMessage = 'Sorry, I encountered an error while processing your request.';
      onChunk(errorMessage);
      onComplete(errorMessage);
      this.conversationHistory.push({
        role: 'assistant',
        content: errorMessage,
      });
    }
  }

  private async analyzeSuggestedOperations(response: string): Promise {
    if (!this.processContext?.process || !response) {
      return [];
    }

    try {
      const process = this.processContext.process;

      const functionDef = {
        name: 'suggest_process_actions',
        description: 'Analyze conversation and suggest SOP actions based on context',
        parameters: {
          type: 'object',
          properties: {
            is_process_related: {
              type: 'boolean',
              description: 'Whether the conversation is related to the current SOP process.',
            },
            current_focus: {
              type: 'object',
              properties: {
                step_index: {
                  type: 'integer',
                  description: 'The 1-based index of the step being discussed (if applicable)',
                },
                substep_index: {
                  type: 'integer',
                  description: 'The 1-based index of the substep being discussed (if applicable)',
                },
                context_notes: {
                  type: 'string',
                  description: 'Brief notes about the current conversation context',
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
                    description: 'Type of operation to suggest',
                  },
                  priority: {
                    type: 'string',
                    enum: ['high', 'medium', 'low'],
                    description: 'Priority level of this suggestion',
                  },
                  description: {
                    type: 'string',
                    description: 'Clear, concise description of the suggested operation',
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
                    description: 'Content for new or updated steps/substeps (if applicable)',
                  },
                  rationale: {
                    type: 'string',
                    description: 'Brief reason for suggesting this operation',
                  },
                },
                required: ['operation', 'description', 'priority'],
              },
            },
          },
          required: ['is_process_related', 'suggested_operations'],
        },
      };

      const userMessages = this.conversationHistory.filter((msg) => msg.role === 'user');
      const lastUserMessage = userMessages.length > 0 ? userMessages[userMessages.length - 1].content : '';

      const analysisMessages = [
        {
          role: 'system',
          content: `You are an AI assistant analyzing conversation to suggest process operations.
You are working with the process: "${process.title}".
Analyze the conversation and suggest appropriate actions related to the process steps.`,
        },
        {
          role: 'user',
          content: `User message: "${lastUserMessage}"
AI response: "${response}"

Based on this conversation, suggest appropriate operations for the process.
Only suggest operations that are clearly relevant to the conversation.
If nothing in the conversation suggests a process operation, return an empty list.`,
        },
      ];

      const completion = await this.client.chat.completions.create({
        model: 'gpt-4-turbo',
        messages: analysisMessages,
        functions: [functionDef],
        function_call: { name: 'suggest_process_actions' },
        temperature: 0.2,
      });

      const functionCall = completion.choices[0]?.message?.function_call;
      if (functionCall?.name === 'suggest_process_actions' && functionCall.arguments) {
        try {
          const args = JSON.parse(functionCall.arguments);

          if (args.is_process_related && args.suggested_operations && Array.isArray(args.suggested_operations) && args.suggested_operations.length > 0) {
            return args.suggested_operations.map((op: any) => {
              // Find step ID from index if not provided directly
              let stepId = op.step_id;
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
                rationale: op.rationale || 'Suggested based on conversation context',
                stepId: stepId,
                subStepId: op.substep_id,
                content: op.content,
                processId: process.id,
              };
            });
          }
        } catch (error) {
          console.error('Error parsing operation suggestions:', error);
        }
      }

      return [];
    } catch (error) {
      console.error('Error analyzing for operation suggestions:', error);
      return [];
    }
  }

  getConversationHistory(): ChatMessage[] {
    return [...this.conversationHistory];
  }

  resetConversation(): void {
    this.conversationHistory = this.conversationHistory.slice(0, 1);
  }
}

export default new OpenAIService();
