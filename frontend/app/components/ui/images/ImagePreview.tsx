'use client';

import { useEffect, useRef, useState } from 'react';

interface ImagePreviewProps {
  src: string;
  alt: string;
  width?: string | number;
  height?: string | number;
  previewScale?: number;
  hoverDelay?: number;
  className?: string;
  clickToOpen?: boolean;
}

export function ImagePreview({ src, alt, width, height, previewScale = 2, hoverDelay = 700, clickToOpen = true, className = '' }: ImagePreviewProps) {
  const [showPreview, setShowPreview] = useState(false);
  const [isHovering, setIsHovering] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const hoverTimerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (isHovering && !clickToOpen) {
      const hintTimer = setTimeout(() => setShowHint(true), 200);
      hoverTimerRef.current = setTimeout(() => setShowPreview(true), hoverDelay);

      return () => {
        if (hoverTimerRef.current) clearTimeout(hoverTimerRef.current);
        clearTimeout(hintTimer);
      };
    }

    return () => {
      if (hoverTimerRef.current) clearTimeout(hoverTimerRef.current);
    };
  }, [isHovering, hoverDelay, clickToOpen]);

  const handleMouseEnter = () => {
    setIsHovering(true);
    if (clickToOpen) setShowHint(true);
  };

  const handleMouseLeave = () => {
    setIsHovering(false);
    setShowHint(false);
    if (!clickToOpen) setShowPreview(false);
  };

  const handleClick = () => {
    if (clickToOpen) setShowPreview(!showPreview);
  };

  const closePreview = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setShowPreview(false);
  };

  return (
    <div
      className={`group relative inline-block cursor-pointer ${className}`}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onClick={handleClick}
    >
      <div className='group relative overflow-hidden rounded-lg transition-all duration-300 hover:shadow-md hover:shadow-blue-100/30'>
        <img
          src={src}
          alt={alt}
          style={{
            width: width || 'auto',
            height: height || 'auto',
            maxHeight: height || 'none',
          }}
          className='h-auto w-auto rounded-lg object-contain transition-transform duration-300 group-hover:scale-[1.02]'
        />

        {/* Gradient overlay on hover */}
        <div className='absolute inset-0 bg-gradient-to-t from-black/5 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100'></div>

        {/* Interaction hint overlay */}
        {showHint && !showPreview && (
          <div className='absolute inset-0 flex items-center justify-center bg-black/15 backdrop-blur-[1px] transition-all duration-300'>
            <div className='rounded-full bg-white/90 px-3 py-1.5 text-xs font-medium text-blue-600 transition-all duration-200 hover:bg-white'>
              {clickToOpen ? 'Click to preview' : 'Hold to preview'}
            </div>
          </div>
        )}
      </div>

      {/* Preview modal */}
      {showPreview && (
        <div
          className='fixed top-1/2 left-1/2 z-[100] -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-xl shadow-2xl transition-all duration-300'
          style={{
            maxWidth: '90vw',
            maxHeight: '90vh',
          }}
        >
          {/* Backdrop with blur */}
          <div className='absolute inset-0 bg-black/60 backdrop-blur-sm' />

          {/* Content wrapper */}
          <div className='relative p-5'>
            <div className='overflow-hidden'>
              <img src={src} alt={alt} className='h-auto max-h-[80vh] w-auto max-w-[85vw] rounded-md object-contain' />
            </div>

            {/* Close button */}
            <button
              onClick={closePreview}
              className='absolute top-5 right-5 flex h-8 w-8 items-center justify-center rounded-full bg-black/20 text-white backdrop-blur-sm transition-all duration-200 hover:bg-blue-500'
              aria-label='Close preview'
            >
              ✕
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
