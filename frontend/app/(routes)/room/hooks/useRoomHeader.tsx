'use client';

import { useAppHeader } from '@/app/components/app/hooks';
import { AppRoute } from '@/app/components/router';
import { useRouteComponent } from '@/app/components/router/useRouteComponent';
import { useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useRoom } from './useRoom';

/**
 * Custom hook for Room header with specialized functionality
 * The room header doesn't need search
 */
export function useRoomHeader() {
  const baseHeader = useAppHeader(AppRoute.ROOM);
  const router = useRouter();
  const { eventDetails, roomId } = useRoom();
  const { setLoading, handleError } = useRouteComponent();

  // Handle back button action with error handling
  const handleBackClick = useCallback(() => {
    try {
      setLoading(true);
      // Navigate back to library
      console.log('Navigating back from room to library');
      router.push('/library');
    } catch (error) {
      handleError(error);
    } finally {
      setLoading(false);
    }
  }, [router, setLoading, handleError]);

  // Determine the title based on room data
  const title = eventDetails?.title || (roomId ? `Room ${roomId}` : 'Room');

  return {
    ...baseHeader,
    title,
    isSearchVisible: false, // Hide search in player view
    handleBackClick,
  };
}
