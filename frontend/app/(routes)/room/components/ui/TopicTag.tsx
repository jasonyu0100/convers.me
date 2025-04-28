import { Topic } from '../../../../types/room';

interface TopicTagProps {
  topic: Topic;
  onClick?: (topicId: string) => void;
}

export function TopicTag({ topic, onClick }: TopicTagProps) {
  const handleClick = () => {
    if (onClick) {
      onClick(topic.id);
    }
  };

  return (
    <div
      className='flex cursor-pointer flex-row items-center rounded-full border-1 border-slate-200 p-[0.5rem] transition-colors hover:bg-slate-50'
      onClick={handleClick}
    >
      <p className='text-xs'>{topic.name}</p>
    </div>
  );
}
