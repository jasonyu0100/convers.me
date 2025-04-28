import React from 'react';

interface RoomNavigationProps {
  roomName: string;
  onClick: (e: React.MouseEvent) => void;
}

/**
 * Reusable component for room navigation buttons
 */
export function RoomNavigation({ roomName, onClick }: RoomNavigationProps) {
  return (
    <div
      className='absolute top-0 right-0 z-10 flex cursor-pointer items-center rounded-full bg-white/80 px-2 py-1 text-xs font-medium text-gray-600 hover:bg-white/80'
      onClick={onClick}
    >
      <span>{roomName}</span>
    </div>
  );
}
