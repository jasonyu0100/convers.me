import * as Sentry from '@sentry/nextjs';

/**
 * Report an error to Sentry with additional context
 * @param error The error to report
 * @param context Additional context to include with the error
 * @returns The Sentry event ID
 */
export function reportError(error: unknown, context?: Record): string {
  // Ensure we have a proper error object
  const errorObject = error instanceof Error ? error : new Error(String(error));

  // Add additional context to the error
  if (context) {
    const scope = Sentry.getCurrentScope();
    for (const [key, value] of Object.entries(context)) {
      scope.setExtra(key, value);
    }
  }

  // Capture the error and return the event ID
  return Sentry.captureException(errorObject);
}

/**
 * Report user feedback to Sentry
 * @param name User's name
 * @param email User's email
 * @param comments User's comments
 * @param eventId The Sentry event ID to associate with this feedback
 */
export function reportUserFeedback(name: string, email: string, comments: string, eventId: string): void {
  Sentry.captureEvent({
    event_id: eventId,
    message: comments,
    user: {
      name,
      email,
    },
    level: 'info',
    extra: {
      feedback: true,
      comments,
    },
  });
}

/**
 * Set user information for Sentry
 * @param userId User ID
 * @param email User email
 * @param username Username
 */
export function setUserContext(userId: string, email?: string, username?: string): void {
  Sentry.setUser({
    id: userId,
    email,
    username,
  });
}

/**
 * Clear user information from Sentry
 */
export function clearUserContext(): void {
  Sentry.setUser(null);
}

/**
 * Start a Sentry transaction for performance monitoring
 * @param name Transaction name
 * @param op Operation type
 * @returns The transaction object
 */
export function startTransaction(name: string, op: string): any {
  return Sentry.startSpan({ name, op });
}
