/**
 * BookingLink component for direct booking functionality
 * Displays a user's availability status and booking URL
 * Clicking navigates to the booking page
 */
export function BookingLink({ onClick }: { onClick?: () => void }) {
  return (
    <div
      className='flex cursor-pointer flex-row items-center space-x-2 rounded-full px-2 py-1 hover:bg-slate-50'
      onClick={onClick}
      title='Click to book a conversation'
    >
      <div className='h-2 w-2 rounded-full bg-green-500'></div>
      <p className='text-sm font-medium text-slate-700'>convers.me/jason</p>
    </div>
  );
}
