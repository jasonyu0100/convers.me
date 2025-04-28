import { Tag } from '@/app/components/ui/tags';
import { EventDetails } from '@/app/types/room';
import { useRoom } from '../../hooks';
import { SignalIcon } from '@heroicons/react/24/outline';
import { Button } from '../../components/ui/Button';

interface RoomCardProps {
  room?: EventDetails;
  onTopicClick?: (topicId: string) => void;
  onStartConversation?: () => void;
}

export function RoomCard({ room, onTopicClick, onStartConversation }: RoomCardProps) {
  const { eventDetails } = useRoom();

  // Use room prop if provided, otherwise fall back to eventDetails from context
  const roomData = room || eventDetails;

  // Early return if no room data is available
  if (!roomData) {
    return (
      <div className='w-full space-y-[1rem] rounded-2xl border-1 border-slate-200 bg-white/80 p-4'>
        <p className='text-center text-gray-500'>Room details not available</p>
      </div>
    );
  }

  // Function to display complexity as dots
  const renderComplexity = (level: number = 3) => {
    const dots = [];
    const maxDots = 5;

    for (let i = 1; i <= maxDots; i++) {
      dots.push(<div key={i} className={`bg-opacity-80 mx-0.5 h-2 w-2 rounded-full ${i <= level ? 'bg-blue-500' : 'bg-slate-200'}`} />);
    }

    return <div className='flex items-center'>{dots}</div>;
  };

  // Function to get status color based on status
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Pending':
        return 'bg-yellow-100 text-yellow-700';
      case 'Planning':
        return 'bg-blue-100 text-blue-700';
      case 'Execution':
        return 'bg-indigo-100 text-indigo-700';
      case 'Review':
        return 'bg-purple-100 text-purple-700';
      case 'Administrative':
        return 'bg-gray-100 text-gray-700';
      case 'Done':
        return 'bg-green-100 text-green-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  return (
    <div className='w-full space-y-[1rem] rounded-2xl border-1 border-slate-200 bg-white/80 p-4'>
      <div className='flex items-center justify-between'>
        <div className='flex-1 overflow-auto'>
          <p className='text-xl font-bold'>{roomData.title}</p>
        </div>
        <div className='bg-opacity-80 rounded-md px-3 py-1.5 text-sm font-medium'>
          <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 ${getStatusColor(roomData.status || 'Pending')}`}>
            {roomData.status || 'Pending'}
          </span>
        </div>
      </div>
      <div className='flex items-center space-x-2'>
        {roomData.duration && (
          <div className='flex items-center text-slate-500'>
            <svg className='mr-1 h-5 w-5' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
              <path strokeLinecap='round' strokeLinejoin='round' strokeWidth='2' d='M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z'></path>
            </svg>
            <span>{roomData.duration}</span>
          </div>
        )}
        {roomData.complexity !== undefined && (
          <>
            <div className='flex items-center text-slate-500'>
              <svg className='mr-1 h-5 w-5' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                <path strokeLinecap='round' strokeLinejoin='round' strokeWidth='2' d='M13 10V3L4 14h7v7l9-11h-7z' />
              </svg>
              <span className='mr-2 text-sm font-medium text-slate-500'>Complexity:</span>
            </div>
            {renderComplexity(roomData.complexity)}
          </>
        )}
      </div>

      {roomData.description && <p className='text-sm font-medium'>{roomData.description}</p>}

      {/* Tags */}
      {roomData.tags && roomData.tags.length > 0 && (
        <div className='flex flex-wrap justify-start gap-2'>
          {roomData.tags.map((tag, index) => (
            <Tag key={index} className='bg-slate-100 text-base text-slate-700 transition-colors hover:bg-slate-200'>
              {tag}
            </Tag>
          ))}
        </div>
      )}

      {/* Converse Live Button */}
      {onStartConversation && (
        <div className='mt-4 flex justify-center'>
          <button
            onClick={onStartConversation}
            className='flex h-auto w-full items-center justify-center rounded-full bg-gradient-to-r from-blue-500 to-blue-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:from-blue-600 hover:to-blue-700'
          >
            <SignalIcon className='mr-2 h-4 w-4' />
            Converse Live
          </button>
        </div>
      )}
    </div>
  );
}
