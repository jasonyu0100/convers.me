/**
 * Barrel file for side panel components
 */

// Export main components
export * from './AppSidePanel';

// Export types
export * from './types';

// Re-export common components
export * from './common';

// Re-export specialized panels
export * from './default/DefaultSidePanel';

// NOTE: Specialized panels (Calendar, Insight, etc.) should be imported directly
// when needed to avoid unnecessary imports
