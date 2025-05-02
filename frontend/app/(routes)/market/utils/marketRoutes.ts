/**
 * Market utilities for API routes
 */

/**
 * Collection routes
 */
export const MARKET_ROUTES = {
  // Collections routes
  COLLECTIONS: '/market/collections',
  COLLECTION: (id: string) => `/market/collections/${id}`,
  SAVE_COLLECTION: (id: string) => `/market/collections/${id}/save`,

  // Directories routes
  DIRECTORIES: '/market/directories',

  // Processes routes
  PROCESSES: '/market/processes',
  PROCESS_BY_CATEGORY: (category: string) => `/market/processes?category=${category}`,

  // Market initialization (admin only)
  INITIALIZE: '/market/initialize',
};

/**
 * Market categories for filtering collections
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
