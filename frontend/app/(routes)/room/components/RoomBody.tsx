import { RoomProcess } from './details/RoomProcess';
import { RoomFeed } from './feed/RoomFeed';

interface RoomBodyProps {
  onPostClick?: (postId: string) => void;
  onCreatePost?: (content: string) => void;
  onTopicClick?: (topicId: string) => void;
  onPlayQuote?: (agentId: string) => void;
  onStartConversation?: () => void;
}

export function RoomBody({ onPostClick, onCreatePost, onTopicClick, onPlayQuote, onStartConversation }: RoomBodyProps) {
  return (
    <div className='flex flex-1 flex-row overflow-auto'>
      <RoomFeed onPostClick={onPostClick} onCreatePost={onCreatePost} onTopicClick={onTopicClick} />
      {/* Room details section */}
      <div className='flex h-full w-[360px] flex-shrink-0 flex-col space-y-8 overflow-auto p-6'>
        <RoomProcess onStartConversation={onStartConversation} />
      </div>
    </div>
  );
}
