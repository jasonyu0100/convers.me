import { UserAvatar } from '@/app/components/ui/avatars/UserAvatar';
import { Button } from '@/app/components/ui/buttons/Button';
import { UserSchema } from '@/app/types/schema';
import { ChangeEvent, useRef, useState } from 'react';

interface RoomFeedInputProps {
  currentUser: UserSchema | null;
  onFocus?: () => void;
  onSubmit?: (content: string) => Promise;
  onMediaUpload?: (file: File) => Promise;
}

export function RoomFeedInput({ currentUser, onFocus, onSubmit, onMediaUpload }: RoomFeedInputProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [content, setContent] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadedMedia, setUploadedMedia] = useState<{
    url: string;
    id: string;
  } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Reference to the file input element
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFocus = () => {
    setIsExpanded(true);
    if (onFocus) onFocus();
  };

  const handleSubmit = async () => {
    if (content.trim() && onSubmit && !isSubmitting) {
      try {
        setIsSubmitting(true);
        await onSubmit(content);
        setContent('');
        setUploadedMedia(null);
        setIsExpanded(false);
      } catch (error) {
        console.error('Error submitting post:', error);
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  const handleFileUpload = async (e: ChangeEvent) => {
    if (!e.target.files || e.target.files.length === 0) return;

    const file = e.target.files[0];

    // Check if file is an image, video, or audio
    if (!file.type.startsWith('image/') && !file.type.startsWith('video/') && !file.type.startsWith('audio/')) {
      alert('Please upload an image, video, or audio file');
      return;
    }

    // Check file size limit (10MB)
    if (file.size > 10 * 1024 * 1024) {
      alert('File is too large. Maximum size is 10MB');
      return;
    }

    try {
      setIsUploading(true);

      if (onMediaUpload) {
        const mediaUrl = await onMediaUpload(file);
        if (mediaUrl) {
          setUploadedMedia({ url: mediaUrl, id: Math.random().toString() });
        }
      }
    } catch (error) {
      console.error('Error uploading file:', error);
      alert('Failed to upload file. Please try again.');
    } finally {
      setIsUploading(false);
      // Clear the file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleOpenFilePicker = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleRemoveMedia = () => {
    setUploadedMedia(null);
  };

  if (!currentUser) {
    // Show a simplified version when user data isn't available yet
    return (
      <div className='flex w-full flex-col rounded-[1rem] border-1 border-slate-200 bg-white/80 p-6'>
        <div className='flex w-full flex-row items-start space-x-[1rem]'>
          <div className='h-10 w-10 animate-pulse rounded-full bg-slate-200'></div>
          <div className='flex-grow'>
            <div className='flex h-12 w-full items-center rounded-lg border border-slate-200 bg-slate-100 px-4'>
              <p className='text-lg font-medium text-slate-400'>Loading...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className='flex w-full flex-col rounded-[1rem] border-1 border-slate-200 bg-white/80 p-6'>
      <div className='flex w-full flex-row items-center space-x-4'>
        <UserAvatar
          user={{
            id: currentUser.id,
            name: currentUser.name,
            profileImage: currentUser.profileImage,
          }}
          size='md'
        />

        <div className='flex-grow'>
          {isExpanded ? (
            <textarea
              className='w-full rounded-lg border border-slate-200 bg-white/80 p-3 text-lg focus:border-blue-300 focus:outline-none'
              placeholder="What's on your mind?"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={3}
              autoFocus
            />
          ) : (
            <div className='flex h-10 w-full cursor-text items-center rounded-lg bg-white/80 px-4 hover:border-blue-200' onClick={handleFocus}>
              <p className='text-base text-slate-500'>What&apos;s on your mind?</p>
            </div>
          )}

          {uploadedMedia && (
            <div className='relative mt-4'>
              <div className='overflow-hidden rounded-lg border border-slate-200 bg-white/90 p-2 shadow-sm'>
                {uploadedMedia.url.includes('image') ? (
                  <img src={uploadedMedia.url} alt='Uploaded content' className='max-h-64 w-full rounded object-cover' />
                ) : uploadedMedia.url.includes('video') ? (
                  <video src={uploadedMedia.url} controls className='max-h-64 w-full rounded' />
                ) : uploadedMedia.url.includes('audio') ? (
                  <div className='rounded-lg bg-slate-50 p-3'>
                    <audio src={uploadedMedia.url} controls className='w-full' />
                  </div>
                ) : (
                  <div className='rounded-lg bg-blue-50 px-3 py-2 text-blue-700'>Attached media</div>
                )}
                <button
                  onClick={handleRemoveMedia}
                  className='absolute top-4 right-4 flex h-8 w-8 items-center justify-center rounded-full bg-black/60 text-white transition-all hover:bg-black/80'
                  aria-label='Remove media'
                >
                  <svg
                    xmlns='http://www.w3.org/2000/svg'
                    width='16'
                    height='16'
                    viewBox='0 0 24 24'
                    fill='none'
                    stroke='currentColor'
                    strokeWidth='2'
                    strokeLinecap='round'
                    strokeLinejoin='round'
                  >
                    <path d='M18 6 6 18'></path>
                    <path d='m6 6 12 12'></path>
                  </svg>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {isExpanded && (
        <>
          <div className='mt-4 flex items-center justify-between border-t border-slate-200 pt-4'>
            <div className='flex space-x-2'>
              <button
                className='flex items-center rounded-full px-3 py-1.5 text-sm font-medium text-slate-600 transition-all hover:bg-slate-100'
                onClick={handleOpenFilePicker}
                disabled={isUploading}
              >
                <svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='currentColor' className='mr-2 h-5 w-5 text-blue-500'>
                  <path d='M12 9a3.75 3.75 0 100 7.5A3.75 3.75 0 0012 9z' />
                  <path
                    fillRule='evenodd'
                    d='M9.344 3.071a49.52 49.52 0 015.312 0c.967.052 1.83.585 2.332 1.39l.821 1.317c.24.383.645.643 1.11.71.386.054.77.113 1.152.177 1.432.239 2.429 1.493 2.429 2.909V18a3 3 0 01-3 3h-15a3 3 0 01-3-3V9.574c0-1.416.997-2.67 2.429-2.909.382-.064.766-.123 1.151-.178a1.56 1.56 0 001.11-.71l.822-1.315a2.942 2.942 0 012.332-1.39zM6.75 12.75a5.25 5.25 0 1110.5 0 5.25 5.25 0 01-10.5 0zm12-1.5a.75.75 0 100-1.5.75.75 0 000 1.5z'
                    clipRule='evenodd'
                  />
                </svg>
                {isUploading ? (
                  <span className='flex items-center'>
                    <svg className='mr-2 -ml-1 h-4 w-4 animate-spin text-blue-500' xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24'>
                      <circle className='opacity-25' cx='12' cy='12' r='10' stroke='currentColor' strokeWidth='4'></circle>
                      <path
                        className='opacity-75'
                        fill='currentColor'
                        d='M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z'
                      ></path>
                    </svg>
                    Uploading...
                  </span>
                ) : (
                  'Add Photo/Video'
                )}
              </button>
              <input type='file' ref={fileInputRef} className='hidden' accept='image/*,video/*,audio/*' onChange={handleFileUpload} disabled={isUploading} />
            </div>

            <div className='flex space-x-2'>
              <Button
                variant='text'
                size='md'
                onClick={() => {
                  setIsExpanded(false);
                  setContent('');
                  setUploadedMedia(null);
                }}
                className='rounded-lg px-4 py-2 text-slate-600 hover:bg-slate-100'
              >
                Cancel
              </Button>
              <Button
                variant='primary'
                size='md'
                disabled={!content.trim() || isSubmitting}
                onClick={handleSubmit}
                isLoading={isSubmitting}
                className='rounded-lg px-5 py-2.5 shadow-sm hover:shadow'
              >
                {isSubmitting ? 'Posting...' : 'Post'}
              </Button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
