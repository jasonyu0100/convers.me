import React, { useCallback, useMemo } from 'react';
import { useApp } from '@/app/components/app/hooks';
import { AppRoute } from '@/app/components/router';
import { PostItem } from '@/app/components/ui/posts';
import type { PostMediaContent } from '@/app/components/ui/posts/types';
import { EnhancedPostResponse } from '@/app/services/postService';
import { useRouter } from 'next/navigation';

interface FeedPostItemProps {
  post: EnhancedPostResponse;
}

// Helper function to format time ago - moved outside component to avoid recreation
function formatTimeAgo(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) return `${diffInSeconds}s ago`;

  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) return `${diffInMinutes}m ago`;

  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) return `${diffInHours}h ago`;

  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 7) return `${diffInDays}d ago`;

  return date.toLocaleDateString();
}

const FeedPostItem = React.memo(({ post }: FeedPostItemProps) => {
  const app = useApp();
  const router = useRouter();

  const handlePostClick = useCallback(() => {
    if (post.eventId) {
      // If there's an associated event, navigate to that event
      app.setMainView(AppRoute.ROOM);

      // Create a complete URL with query parameter
      const roomUrl = `/room?id=${encodeURIComponent(post.eventId)}`;

      // Navigate to the room page with the event ID
      router.push(roomUrl);
    }
  }, [app, router, post.eventId]);

  // Convert schema media to PostMediaContent format - memoized to prevent recreation on render
  const mediaData = useMemo<PostMediaContent | undefined>(() => {
    // Check if post has media data
    if (post.media) {
      const media = post.media;

      return {
        type: media.type,
        url: media.url,
        title: media.title,
        aspectRatio: media.aspectRatio,
        duration: media.duration,

        // Add any room/event information if available
        eventId: post.eventId,
        roomId: post.eventId || `post-${post.id}`,
        roomName: 'Post Discussion',
      };
    }
    return undefined;
  }, [post.media, post.eventId, post.id]);

  // Memoize the post data to prevent object recreation on each render
  const postData = useMemo(
    () => ({
      id: post.id,
      author: {
        id: post.author?.id || post.authorId || 'unknown-user',
        name: post.author?.name || post.authorName || 'Unknown User',
        handle: post.author?.handle || post.authorHandle || '@unknown',
        profileImage: post.author?.profileImage || post.authorImage || '/profile/profile-picture-1.jpg', // Default avatar
        email: post.author?.email || post.authorEmail,
        bio: post.author?.bio || post.authorBio,
        isOnline: false,
      },
      content: post.content,
      timeAgo: formatTimeAgo(post.createdAt || ''),
      timestamp: post.createdAt || '',
    }),
    [post.id, post.author, post.authorId, post.authorName, post.authorHandle, post.authorImage, post.authorEmail, post.authorBio, post.content, post.createdAt],
  );

  const roomId = post.eventId || `post-${post.id}`;

  return <PostItem post={postData} media={mediaData} onClick={handlePostClick} roomName='Post Discussion' roomId={roomId} isInRoom={false} />;
});

FeedPostItem.displayName = 'FeedPostItem';

export { FeedPostItem };
