import { useApp } from '@/app/components/app/hooks';
import { AppRoute } from '@/app/components/router';
import { PostItem, PostMediaContent } from '@/app/components/ui/posts';
import { useRouter } from 'next/navigation';
import { ProfileActivity } from '../../../../types/profile';
import { Post } from '../../../../types/shared';
import { ProfilePostProps } from '../../types';

/**
 * Component to display a single post in the profile activity feed
 * This component is flexible and can work with both ProfileActivity types
 * and the shared Post types.
 */
export function ProfilePost({ post }: ProfilePostProps) {
  const app = useApp();
  const router = useRouter();

  // Determine if we're dealing with a shared Post or a ProfileActivity
  const isSharedPost = 'author' in post;

  // If it's a ProfileActivity, convert to our shared Post format for UI components
  const profileActivity = !isSharedPost ? (post as ProfileActivity) : null;
  const postData = isSharedPost
    ? (post as Post)
    : {
        id: profileActivity!.id,
        author: {
          id: profileActivity!.userId || 'unknown-user',
          name: profileActivity!.userName || 'Unknown User', // Provide default name
          handle: profileActivity!.userName ? profileActivity!.userName.toLowerCase().replace(/\s+/g, '') : '@unknown',
          profileImage: profileActivity!.userImage || '/profile/profile-picture-1.jpg', // Default avatar
          isOnline: false,
        },
        content: profileActivity!.content || '',
        timeAgo: profileActivity!.timeAgo || 'recently',
      };

  // Generate media data if this post has media attachments
  let mediaData: PostMediaContent | undefined;

  if (profileActivity) {
    // Add appropriate media data based on the mediaType
    if (profileActivity.mediaType) {
      mediaData = {
        // Use the explicit media type from the activity
        type: profileActivity.mediaType,

        // For quotes, use mediaSource as the quote text
        source: profileActivity.mediaType === 'quote' ? profileActivity.mediaSource : undefined,

        // Use the explicit URL if provided
        url: profileActivity.mediaUrl,

        // For event type, include the eventId
        eventId: profileActivity.mediaType === 'event' ? profileActivity.eventId : undefined,

        // Add room information for navigation - this will make the redirect arrow appear
        roomId: profileActivity.eventId || 'room-1',
        roomName: profileActivity.title ? profileActivity.title.substring(0, 20) + (profileActivity.title.length > 20 ? '...' : '') : 'Room',

        // Other properties
        aspectRatio: profileActivity.aspectRatio,
        title: profileActivity.title,
        duration: profileActivity.duration,
        participants: profileActivity.participants?.map((p) => ({
          id: p.id,
          name: p.name,
          profileImage: p.image || '', // Ensure profileImage is set even if empty
        })),
      };
    }
  }

  const handlePostClick = (id: string) => {
    // Navigate to room for any post with media
    if (profileActivity && profileActivity.mediaType) {
      // Get the room ID to navigate to
      const roomId = profileActivity.eventId || 'room-1';
      app.setMainView(AppRoute.ROOM);
      router.push(`/room?id=${roomId}`);
    }
  };

  // Get room data for navigation
  const roomId = profileActivity?.eventId || mediaData?.roomId || 'room-1';
  const roomName = profileActivity?.title
    ? profileActivity.title.substring(0, 20) + (profileActivity.title.length > 20 ? '...' : '')
    : mediaData?.roomName || 'Room';

  return (
    <PostItem
      post={postData}
      media={mediaData}
      onClick={handlePostClick}
      roomName={roomName}
      roomId={roomId}
      isInRoom={false} // Explicitly set to false since we're in the profile view
    />
  );
}
