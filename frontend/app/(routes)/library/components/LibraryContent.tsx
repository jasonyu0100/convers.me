'use client';

import { useLibrary } from '../hooks/useLibrary';
import { CollectionsView } from './collections/CollectionsView';

/**
 * Main content component for the library view
 * Acts as a container for the collections view
 */
export function LibraryContent() {
  return <CollectionsView />;
}
