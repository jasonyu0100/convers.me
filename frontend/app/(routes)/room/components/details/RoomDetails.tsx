import { RoomProcess } from './RoomProcess';

export function RoomDetails() {
  return (
    <div className='flex h-full w-[360px] flex-shrink-0 flex-col space-y-8 overflow-auto p-6'>
      <RoomProcess />
    </div>
  );
}
