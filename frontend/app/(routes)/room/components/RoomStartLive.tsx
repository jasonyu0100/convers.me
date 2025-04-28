import { SignalIcon } from '@heroicons/react/24/outline';
import { Button } from './ui/Button';

interface PrepareEnterButtonProps {
  onClick: () => void;
}

export function RoomStartLiveButton({ onClick }: PrepareEnterButtonProps) {
  return (
    <div className='absolute bottom-[3rem] left-0 flex w-full flex-col items-center'>
      <Button size='lg' onClick={onClick} className='w-[20rem]' icon={<SignalIcon className='h-8 w-8' />} iconPosition='left'>
        Converse Live
      </Button>
    </div>
  );
}
