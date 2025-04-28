"""
AI service for live sessions using OpenAI API.
"""

import json
import logging
import os
from datetime import datetime
from typing import Any, Dict, List, Optional, Tuple

from openai import AsyncOpenAI, OpenAI

logger = logging.getLogger(__name__)


class LiveAIService:
    """Live AI service for handling AI interactions."""

    def __init__(self):
        """Initialize the AI service."""
        # Get API key and model from environment variables
        api_key = os.getenv("OPENAI_API_KEY")
        if not api_key:
            logger.warning("OPENAI_API_KEY not set in environment variables.")

        # Get model from environment or use default
        self.model = os.getenv("OPENAI_MODEL", "gpt-4-turbo")

        self.sync_client = OpenAI(api_key=api_key)
        self.async_client = AsyncOpenAI(api_key=api_key)

    def get_system_prompt(self, process_info: Optional[Dict[str, Any]] = None) -> str:
        """
        Generate a system prompt based on the process information.

        Args:
            process_info: Optional process information to include in the prompt

        Returns:
            System prompt string
        """
        base_prompt = (
            "You are AIDE, an Advanced Intelligent Digital Expert in a live operational context. "
            "Your personality is confident, technically precise, and focused on operational excellence. "
            "Address the user as an operator with high technical knowledge. "
            "Your primary mission is to help operators complete Standard Operating Procedures (SOPs) "
            "efficiently and accurately. Be direct and clear in your responses, using technical "
            "terminology appropriate for experienced professionals. "
            "The operator is sharing their progress, and you should proactively identify when they're ready "
            "to complete steps, suggest next actions, and highlight potential issues or shortcuts. "
            "Focus on helping complete the current process while maintaining quality standards."
        )

        if process_info:
            # Extract process details
            process_title = process_info.get("title", "")
            process_description = process_info.get("description", "")
            steps = process_info.get("steps", [])

            # Add process-specific context
            process_prompt = (
                f"\n\nACTIVE SOP: '{process_title}'\n"
                f"OBJECTIVE: {process_description}\n\n"
            )

            # Add steps information
            if steps:
                steps_prompt = "PROCEDURE STATUS:\n"

                # Count completed and total steps
                completed_steps = sum(1 for step in steps if step.get("completed"))
                total_steps = len(steps)
                completion_percentage = int((completed_steps / total_steps) * 100) if total_steps > 0 else 0

                steps_prompt += f"Overall Progress: {completed_steps}/{total_steps} steps complete ({completion_percentage}%)\n\n"

                for i, step in enumerate(steps, 1):
                    step_content = step.get("content", "")
                    step_status = "✓ COMPLETE" if step.get("completed") else "○ PENDING"
                    steps_prompt += f"{i}. {step_content} - {step_status}\n"

                    # Add substeps if any
                    substeps = step.get("subSteps", [])
                    if substeps:
                        # Count completed substeps
                        completed_substeps = sum(1 for substep in substeps if substep.get("completed"))
                        total_substeps = len(substeps)

                        if not step.get("completed") and total_substeps > 0:
                            substep_progress = f"({completed_substeps}/{total_substeps} substeps complete)"
                            steps_prompt += f"   {substep_progress}\n"

                        for j, substep in enumerate(substeps, 1):
                            substep_content = substep.get("content", "")
                            substep_status = "✓ Done" if substep.get("completed") else "○ Pending"
                            steps_prompt += f"   {i}.{j}. {substep_content} - {substep_status}\n"

                process_prompt += steps_prompt

                # Add specific guidance for this session
                process_prompt += (
                    "\nCONTEXT GUIDANCE:\n"
                    "1. Always acknowledge the current operation and its priority within the SOP\n"
                    "2. Reference specific step numbers when suggesting actions\n"
                    "3. When the operator indicates task completion, proactively suggest marking steps as complete\n"
                    "4. Recommend efficiency improvements where appropriate\n"
                    "5. For exceptional circumstances, note when deviation from SOP may be required and consequences\n"
                )

            return base_prompt + process_prompt

        return base_prompt

    def format_messages_for_openai(self, messages: List[Dict[str, Any]],
                                 process_info: Optional[Dict[str, Any]] = None) -> List[Dict[str, str]]:
        """
        Format messages for OpenAI chat API.

        Args:
            messages: List of message dictionaries with 'role', 'content', etc.
            process_info: Optional process information to include in the system prompt

        Returns:
            List of formatted messages for OpenAI API
        """
        openai_messages = []

        # Add system message if not present
        has_system = any(msg.get("role") == "system" for msg in messages)
        if not has_system:
            system_content = self.get_system_prompt(process_info)
            openai_messages.append({
                "role": "system",
                "content": system_content
            })

        # Add remaining messages, filtering for only the fields OpenAI expects
        for msg in messages:
            if msg.get("role") in ["system", "user", "assistant"]:
                openai_messages.append({
                    "role": msg["role"],
                    "content": msg["content"]
                })

        return openai_messages

    def _get_process_function_definition(self) -> Dict[str, Any]:
        """
        Get the function definition for process action suggestion.

        Returns:
            Dict with the function definition
        """
        return {
            "name": "suggest_process_actions",
            "description": "Analyze operator input and proactively suggest SOP actions to take based on context",
            "parameters": {
                "type": "object",
                "properties": {
                    "is_process_related": {
                        "type": "boolean",
                        "description": "Whether the operator message is related to the current SOP process. Default to true for most messages in this context."
                    },
                    "current_focus": {
                        "type": "object",
                        "properties": {
                            "step_index": {
                                "type": "integer",
                                "description": "The 1-based index of the step the operator is currently focusing on"
                            },
                            "substep_index": {
                                "type": "integer",
                                "description": "The 1-based index of the substep the operator is currently focusing on, if applicable"
                            },
                            "context_notes": {
                                "type": "string",
                                "description": "Brief notes about what the operator is currently doing (e.g., 'Completing configuration', 'Troubleshooting error')"
                            }
                        },
                        "description": "Information about which part of the SOP the operator is currently working on"
                    },
                    "suggested_operations": {
                        "type": "array",
                        "items": {
                            "type": "object",
                            "properties": {
                                "operation": {
                                    "type": "string",
                                    "enum": ["complete_step", "add_step", "add_substep", "update_step"],
                                    "description": "Type of operation to perform"
                                },
                                "priority": {
                                    "type": "string",
                                    "enum": ["high", "medium", "low"],
                                    "description": "Priority of this operation suggestion"
                                },
                                "description": {
                                    "type": "string",
                                    "description": "Technical, concise description of the operation for the operator"
                                },
                                "step_id": {
                                    "type": "string",
                                    "description": "ID of the step to modify (if applicable)"
                                },
                                "substep_id": {
                                    "type": "string",
                                    "description": "ID of the substep to modify (if applicable)"
                                },
                                "content": {
                                    "type": "string",
                                    "description": "Content to add or update (if applicable)"
                                },
                                "rationale": {
                                    "type": "string",
                                    "description": "Brief technical rationale for suggesting this operation"
                                }
                            },
                            "required": ["operation", "description", "priority"]
                        },
                        "description": "List of suggested operations based on the operator message and SOP progress"
                    }
                },
                "required": ["is_process_related", "suggested_operations"]
            }
        }

    def _format_operations(self, operations: List[Dict[str, Any]], process_info: Dict[str, Any]) -> List[Dict[str, Any]]:
        """
        Format operations to match backend field names.

        Args:
            operations: List of operations from OpenAI
            process_info: Process information containing ID

        Returns:
            Formatted operations list
        """
        formatted_ops = []

        for op in operations:
            formatted_op = {}

            # Copy the basic operation details
            formatted_op["operation"] = op.get("operation")
            formatted_op["description"] = op.get("description", "")

            # Include the priority if present
            if "priority" in op:
                formatted_op["priority"] = op.get("priority")

            # Include rationale if present (for UI display)
            if "rationale" in op:
                formatted_op["rationale"] = op.get("rationale")

            # Map step_id to stepId, etc.
            if "step_id" in op:
                formatted_op["stepId"] = op.get("step_id")
            if "substep_id" in op:
                formatted_op["subStepId"] = op.get("substep_id")

            # Add content if present
            if "content" in op:
                formatted_op["content"] = op.get("content")

            # Add processId
            if process_info.get("id"):
                formatted_op["processId"] = process_info["id"]

            # Include the operation in the results
            formatted_ops.append(formatted_op)

        return formatted_ops

    def _handle_api_error(self, e: Exception) -> Tuple[str, List[Dict[str, Any]]]:
        """
        Handle API errors consistently.

        Args:
            e: The exception that occurred

        Returns:
            Error response tuple
        """
        error_message = str(e)
        logger.error(f"Error calling OpenAI API: {error_message}")

        # Provide more specific information based on error type
        if "rate limit" in error_message.lower():
            return "I'm experiencing high demand right now. Please try again in a moment.", []
        elif "timeout" in error_message.lower() or "timed out" in error_message.lower():
            return "The request took too long to process. Please try a shorter message or try again later.", []
        elif "content filter" in error_message.lower() or "policy" in error_message.lower():
            return "I couldn't process that request due to content policy restrictions.", []
        elif "api key" in error_message.lower() or "authentication" in error_message.lower():
            return "There's an issue with the service configuration. Please contact support.", []
        elif "context length" in error_message.lower() or "token" in error_message.lower():
            return "The conversation is too long for me to process. Try starting a new session or summarizing the previous context.", []
        else:
            # Include part of the actual error for debugging but make it user-friendly
            return f"I ran into a technical issue: {error_message[:100]}... Please try again or contact support if this persists.", []

    async def process_message_async(self, message: str,
                               context_messages: List[Dict[str, Any]],
                               process_info: Optional[Dict[str, Any]] = None) -> Tuple[str, List[Dict[str, Any]]]:
        """
        Process a message and return an AI response using async API.

        Args:
            message: The user's message
            context_messages: Previous conversation messages
            process_info: Optional process information

        Returns:
            Tuple of (response_text, suggested_operations)
        """
        # Check if we should skip API call (development/testing)
        if not self.async_client.api_key or self.async_client.api_key == "":
            logger.warning("Skipping OpenAI API call - No API key provided")
            return "I'm sorry, but I can't process your request at this time.", []

        # Add the new user message
        context_messages.append({
            "role": "user",
            "content": message,
            "timestamp": datetime.utcnow().isoformat()
        })

        # Format messages for OpenAI
        openai_messages = self.format_messages_for_openai(context_messages, process_info)

        # Process with API
        try:
            # First determine if the message is related to the process
            if process_info:
                function_def = self._get_process_function_definition()

                # Call OpenAI with function calling
                completion = await self.async_client.chat.completions.create(
                    model=self.model,
                    messages=openai_messages,
                    functions=[function_def],
                    function_call="auto",
                    temperature=0.7,
                )

                response_message = completion.choices[0].message

                # Handle function calls
                suggested_operations = []
                if response_message.function_call and response_message.function_call.name == "suggest_process_actions":
                    try:
                        function_args = json.loads(response_message.function_call.arguments)
                        is_process_related = function_args.get("is_process_related", False)

                        if is_process_related and "suggested_operations" in function_args:
                            suggested_operations = function_args["suggested_operations"]
                            suggested_operations = self._format_operations(suggested_operations, process_info)
                    except json.JSONDecodeError:
                        logger.error("Failed to parse function call arguments")

                # Call OpenAI again for the actual response
                completion = await self.async_client.chat.completions.create(
                    model=self.model,
                    messages=openai_messages,
                    temperature=0.7,
                )

            else:
                # No process info, just get a response
                completion = await self.async_client.chat.completions.create(
                    model=self.model,
                    messages=openai_messages,
                    temperature=0.7,
                )
                suggested_operations = []

            # Extract the response text
            response_text = completion.choices[0].message.content

            return response_text, suggested_operations

        except Exception as e:
            return self._handle_api_error(e)

    def process_message_sync(self, message: str,
                       context_messages: List[Dict[str, Any]],
                       process_info: Optional[Dict[str, Any]] = None) -> Tuple[str, List[Dict[str, Any]]]:
        """
        Process a message and return an AI response using sync API.

        Args:
            message: The user's message
            context_messages: Previous conversation messages
            process_info: Optional process information

        Returns:
            Tuple of (response_text, suggested_operations)
        """
        # Check if we should skip API call (development/testing)
        if not self.sync_client.api_key or self.sync_client.api_key == "":
            logger.warning("Skipping OpenAI API call - No API key provided")
            return "I'm sorry, but I can't process your request at this time.", []

        # Add the new user message
        context_messages.append({
            "role": "user",
            "content": message,
            "timestamp": datetime.utcnow().isoformat()
        })

        # Format messages for OpenAI
        openai_messages = self.format_messages_for_openai(context_messages, process_info)

        # Process with API
        try:
            # First determine if the message is related to the process
            if process_info:
                function_def = self._get_process_function_definition()

                # Call OpenAI with function calling
                completion = self.sync_client.chat.completions.create(
                    model=self.model,
                    messages=openai_messages,
                    functions=[function_def],
                    function_call="auto",
                    temperature=0.7,
                )

                response_message = completion.choices[0].message

                # Handle function calls
                suggested_operations = []
                if hasattr(response_message, "function_call") and response_message.function_call and response_message.function_call.name == "suggest_process_actions":
                    try:
                        function_args = json.loads(response_message.function_call.arguments)
                        is_process_related = function_args.get("is_process_related", False)

                        if is_process_related and "suggested_operations" in function_args:
                            suggested_operations = function_args["suggested_operations"]
                            suggested_operations = self._format_operations(suggested_operations, process_info)
                    except json.JSONDecodeError:
                        logger.error("Failed to parse function call arguments")

                # Call OpenAI again for the actual response
                completion = self.sync_client.chat.completions.create(
                    model=self.model,
                    messages=openai_messages,
                    temperature=0.7,
                )

            else:
                # No process info, just get a response
                completion = self.sync_client.chat.completions.create(
                    model=self.model,
                    messages=openai_messages,
                    temperature=0.7,
                )
                suggested_operations = []

            # Extract the response text
            response_text = completion.choices[0].message.content

            return response_text, suggested_operations

        except Exception as e:
            return self._handle_api_error(e)


# Create a singleton instance
live_ai_service = LiveAIService()
