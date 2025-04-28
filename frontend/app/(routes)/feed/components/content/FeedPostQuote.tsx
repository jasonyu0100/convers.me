import { Post } from '../../../../types/feed';

interface FeedPostQuoteProps {
  post: Post;
  onClick?: () => void;
}

export function FeedPostQuote({ post, onClick }: FeedPostQuoteProps) {
  if (!post.quote) return null;

  return (
    <div className='flex cursor-pointer flex-row items-center space-x-[0.5rem]' onClick={onClick}>
      <blockquote className='border-l-4 border-slate-300 pl-4 text-sm text-gray-600 italic'>{post.quote.text}</blockquote>

      {post.quote.isAudio && (
        <svg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' strokeWidth={1.5} stroke='currentColor' className='size-6'>
          <path
            strokeLinecap='round'
            strokeLinejoin='round'
            d='M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.347a1.125 1.125 0 0 1 0 1.972l-11.54 6.347a1.125 1.125 0 0 1-1.667-.986V5.653Z'
          />
        </svg>
      )}
    </div>
  );
}
