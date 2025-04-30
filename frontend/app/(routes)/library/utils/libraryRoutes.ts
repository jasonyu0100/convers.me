/**
 * Library utilities for API routes
 */

/**
 * Collection routes
 */
export const LIBRARY_ROUTES = {
  // Collections routes
  COLLECTIONS: '/library/collections',
  COLLECTION: (id: string) => `/library/collections/${id}`,
  SAVE_COLLECTION: (id: string) => `/library/collections/${id}/save`,

  // Directories routes
  DIRECTORIES: '/library/directories',

  // Processes routes
  PROCESSES: '/library/processes',
  PROCESS_BY_CATEGORY: (category: string) => `/library/processes?category=${category}`,

  // Library initialization (admin only)
  INITIALIZE: '/library/initialize',
};

/**
 * Library categories for filtering collections
 */
export const CATEGORIES = [
  { id: 'all', name: 'All Collections' },
  { id: 'project-management', name: 'Project Management' },
  { id: 'management', name: 'Team Leadership' },
  { id: 'research', name: 'Research' },
  { id: 'design', name: 'Design' },
  { id: 'engineering', name: 'Engineering' },
  { id: 'product', name: 'Product' },
  { id: 'marketing', name: 'Marketing' },
  { id: 'sales', name: 'Sales' },
  { id: 'client-management', name: 'Client Management' },
  { id: 'planning', name: 'Strategic Planning' },
];
