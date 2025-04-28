/**
 * Example usage of PostItem components with different media types
 */
import { PostItem, PostMediaContent } from './index';

// Example user data
const user = {
  id: 'user-1',
  name: 'Jason Yu',
  handle: 'jasonyu',
  profileImage: '/profile/profile-picture-1.jpg',
  isOnline: true,
};

// Example post with image
export function PostWithImage() {
  const post = {
    id: 'post-1',
    author: user,
    content: "Check out this screenshot of the new UI we're working on!",
    timeAgo: '2 hours ago',
  };

  const mediaData: PostMediaContent = {
    type: 'image',
    aspectRatio: 'square',
    title: 'New Dashboard UI',
  };

  return (
    <PostItem
      post={post}
      media={mediaData}
      onClick={(id) => {
        /* Handle image post click */
      }}
      isInRoom={false}
      roomName='Example Room'
      roomId='example-room-1'
    />
  );
}

// Example post with video
export function PostWithVideo() {
  const post = {
    id: 'post-2',
    author: user,
    content: "Here's a demo of the new feature we implemented.",
    timeAgo: '3 hours ago',
  };

  const mediaData: PostMediaContent = {
    type: 'video',
    aspectRatio: 'video',
    title: 'Feature Demo',
    duration: '2:45',
    participants: [
      {
        id: 'user-1',
        name: 'Jason Yu',
        profileImage: '/profile/profile-picture-1.jpg',
      },
      {
        id: 'user-2',
        name: 'Dev Team',
        profileImage: '/profile/profile-picture-2.jpg',
      },
    ],
  };

  return (
    <PostItem
      post={post}
      media={mediaData}
      onClick={(id) => {
        /* Handle video post click */
      }}
      isInRoom={false}
      roomName='Example Room'
      roomId='example-room-2'
    />
  );
}

// Example post with audio
export function PostWithAudio() {
  const post = {
    id: 'post-3',
    author: user,
    content: 'Our team discussion about the architecture decisions.',
    timeAgo: '1 day ago',
  };

  const mediaData: PostMediaContent = {
    type: 'audio',
    title: 'Architecture Discussion',
    duration: '15:20',
  };

  return (
    <PostItem
      post={post}
      media={mediaData}
      onClick={(id) => {
        /* Handle audio post click */
      }}
      isInRoom={false}
      roomName='Example Room'
      roomId='example-room-3'
    />
  );
}

// Example post with quote
export function PostWithQuote() {
  const post = {
    id: 'post-4',
    author: user,
    content: 'Important point from our planning meeting:',
    timeAgo: '2 days ago',
  };

  const mediaData: PostMediaContent = {
    type: 'quote',
    source: 'We should focus on user experience first, then add more features based on feedback.',
  };

  return (
    <PostItem
      post={post}
      media={mediaData}
      onClick={(id) => {
        /* Handle quote post click */
      }}
      isInRoom={false}
      roomName='Example Room'
      roomId='example-room-4'
    />
  );
}

// Example post with event
export function PostWithEvent() {
  const post = {
    id: 'post-5',
    author: user,
    content: 'Our sprint planning session was really productive!',
    timeAgo: '3 days ago',
  };

  const mediaData: PostMediaContent = {
    type: 'event',
    eventId: 'event-123',
    title: 'Sprint Planning',
    participants: [
      {
        id: 'user-1',
        name: 'Jason Yu',
        profileImage: '/profile/profile-picture-1.jpg',
      },
      {
        id: 'user-2',
        name: 'Dev Team',
        profileImage: '/profile/profile-picture-2.jpg',
      },
      {
        id: 'user-3',
        name: 'Product Manager',
        profileImage: '/profile/profile-picture-3.jpg',
      },
    ],
  };

  return (
    <PostItem
      post={post}
      media={mediaData}
      onClick={(id) => {
        /* Handle event post click */
      }}
      isInRoom={false}
      roomName='Example Room'
      roomId='example-room-5'
    />
  );
}

// Example post with no media
export function PostWithNoMedia() {
  const post = {
    id: 'post-6',
    author: user,
    content: 'Just a simple text post with no media attachments.',
    timeAgo: '4 days ago',
  };

  return (
    <PostItem
      post={post}
      onClick={(id) => {
        /* Handle text post click */
      }}
      isInRoom={false}
      roomName='Example Room'
      roomId='example-room-6'
    />
  );
}
