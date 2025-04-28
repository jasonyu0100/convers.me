'use client';

import { useEffect, useRef, useState } from 'react';

interface LiveMediaViewProps {
  videoRef: React.RefObject;
  screenShareRef: React.RefObject;
  showScreenShare: boolean;
  showCamera: boolean;
}

export function LiveMediaView({ videoRef, screenShareRef, showScreenShare, showCamera }: LiveMediaViewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [cameraActive, setCameraActive] = useState(false);
  const [screenActive, setScreenActive] = useState(false);

  // Update state when props change
  useEffect(() => {
    if (!showCamera) {
      setCameraActive(false);
    }
    if (!showScreenShare) {
      setScreenActive(false);
    }
  }, [showCamera, showScreenShare]);

  // Set up play event handlers
  useEffect(() => {
    const checkVideoStatus = () => {
      if (videoRef.current) {
        // If video has actual dimensions and a source, mark it as active
        if (videoRef.current.srcObject && videoRef.current.readyState >= 2) {
          setCameraActive(true);
        }
      }

      if (screenShareRef.current) {
        // If screen share has actual dimensions and a source, mark it as active
        if (screenShareRef.current.srcObject && screenShareRef.current.readyState >= 2) {
          setScreenActive(true);
        }
      }
    };

    // Check video status on mount and when props change
    checkVideoStatus();

    const handleCameraPlay = () => {
      setCameraActive(true);
    };

    const handleScreenPlay = () => {
      setScreenActive(true);
    };

    const handleLoadedMetadata = () => {
      checkVideoStatus();
    };

    const handleScreenLoadedMetadata = () => {
      checkVideoStatus();
    };

    // Set up more robust event listeners
    if (videoRef.current) {
      videoRef.current.addEventListener('play', handleCameraPlay);
      videoRef.current.addEventListener('loadedmetadata', handleLoadedMetadata);
      videoRef.current.addEventListener('loadeddata', handleLoadedMetadata);

      // Force video to be visible
      if (videoRef.current.style) {
        videoRef.current.style.display = '';
        videoRef.current.style.opacity = '1';
      }
    }

    if (screenShareRef.current) {
      screenShareRef.current.addEventListener('play', handleScreenPlay);
      screenShareRef.current.addEventListener('loadedmetadata', handleScreenLoadedMetadata);
      screenShareRef.current.addEventListener('loadeddata', handleScreenLoadedMetadata);

      // Force video to be visible
      if (screenShareRef.current.style) {
        screenShareRef.current.style.display = '';
        screenShareRef.current.style.opacity = '1';
      }
    }

    // Set up an interval to continuously check video status
    const interval = setInterval(checkVideoStatus, 1000);

    // Cleanup
    return () => {
      clearInterval(interval);

      if (videoRef.current) {
        videoRef.current.removeEventListener('play', handleCameraPlay);
        videoRef.current.removeEventListener('loadedmetadata', handleLoadedMetadata);
        videoRef.current.removeEventListener('loadeddata', handleLoadedMetadata);
      }

      if (screenShareRef.current) {
        screenShareRef.current.removeEventListener('play', handleScreenPlay);
        screenShareRef.current.removeEventListener('loadedmetadata', handleScreenLoadedMetadata);
        screenShareRef.current.removeEventListener('loadeddata', handleScreenLoadedMetadata);
      }
    };
  }, [showCamera, showScreenShare]);

  useEffect(() => {
    // Force the videos to become visible when they're active
    if (cameraActive && videoRef.current) {
      videoRef.current.style.opacity = '1';
      videoRef.current.style.visibility = 'visible';
    }

    if (screenActive && screenShareRef.current) {
      screenShareRef.current.style.opacity = '1';
      screenShareRef.current.style.visibility = 'visible';
    }

    // Create PiP video element using DOM manipulation to avoid React ref conflicts
    const updatePiP = () => {
      // Handle PiP mode
      if (showCamera && showScreenShare && screenActive && cameraActive && videoRef.current) {
        const pipContainer = document.getElementById('pip-container');
        if (!pipContainer) return;

        // Check if we already have a video element
        let pipVideo = pipContainer.querySelector('video');
        if (!pipVideo) {
          // Clear previous content
          while (pipContainer.firstChild) {
            pipContainer.removeChild(pipContainer.firstChild);
          }

          // Create a new video element
          pipVideo = document.createElement('video');
          pipVideo.autoplay = true;
          pipVideo.playsInline = true;
          pipVideo.muted = true;
          pipVideo.className = 'h-full w-full object-cover';

          // Add to container
          pipContainer.appendChild(pipVideo);
        }

        // Set the same stream source if it's different
        if (videoRef.current.srcObject && pipVideo.srcObject !== videoRef.current.srcObject) {
          pipVideo.srcObject = videoRef.current.srcObject;

          // Make sure it plays
          const playPromise = pipVideo.play();
          if (playPromise !== undefined) {
            playPromise.catch(() => {
              // Silently handle PiP video play errors
            });
          }
        }
      }
    };

    // Call immediately and also set up interval for stability
    updatePiP();
    const interval = setInterval(updatePiP, 1000);

    return () => clearInterval(interval);
  }, [cameraActive, screenActive, showCamera, showScreenShare]);

  return (
    <div ref={containerRef} className={`relative flex h-full flex-1 ${showCamera || showScreenShare ? 'bg-black' : 'bg-slate-950'} overflow-hidden`}>
      {/* Always render video elements to keep refs stable, but hide them when not in use */}
      <div className='absolute inset-0 flex h-full w-full flex-col items-center justify-center'>
        {/* Screen Sharing Video - Always present but hidden when not active */}
        <div className={`flex h-full w-full items-center justify-center ${!showScreenShare ? 'hidden' : ''}`}>
          <video ref={screenShareRef} autoPlay playsInline className={`max-h-full max-w-full object-contain ${screenActive ? 'opacity-100' : 'opacity-50'}`} />
        </div>

        {/* Camera Video - Always present but visibility changes */}
        <div className={`flex h-full w-full items-center justify-center ${!showCamera || (showScreenShare && screenActive) ? 'hidden' : ''}`}>
          <video ref={videoRef} autoPlay playsInline muted className={`max-h-full max-w-full object-contain ${cameraActive ? 'opacity-100' : 'opacity-50'}`} />
        </div>
      </div>

      {/* Picture-in-Picture Camera - Using a cloned node to avoid duplicate ref errors */}
      {showCamera && showScreenShare && screenActive && videoRef.current && (
        <div
          className='absolute top-6 left-1/2 z-10 flex h-36 w-64 -translate-x-1/2 transform overflow-hidden rounded-lg border-2 border-blue-400 shadow-xl'
          id='pip-container'
        >
          {/* Intentionally not using ref here to avoid React ref conflicts */}
          <div id='pip-placeholder' className='flex h-full w-full items-center justify-center bg-black text-xs text-white/50'>
            Camera view
          </div>
        </div>
      )}
      {/* Placeholder shown when no video is active or videos are still loading */}
      {(!showCamera && !showScreenShare) || (showCamera && !cameraActive && !showScreenShare) || (showScreenShare && !screenActive) ? (
        <div className='absolute inset-0 flex items-center justify-center transition-opacity duration-300'>
          <div className='rounded-full border border-slate-700 bg-slate-800/70 p-8 backdrop-blur-sm'>
            <svg xmlns='http://www.w3.org/2000/svg' className='h-16 w-16 text-slate-400' fill='none' viewBox='0 0 24 24' stroke='currentColor'>
              <path
                strokeLinecap='round'
                strokeLinejoin='round'
                strokeWidth={1.5}
                d='M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z'
              />
            </svg>
          </div>
        </div>
      ) : null}

      {/* Loading indicator for camera/screen */}
      {((showCamera && !cameraActive) || (showScreenShare && !screenActive)) && (
        <div className='absolute bottom-6 left-1/2 z-50 flex -translate-x-1/2 items-center space-x-2 rounded-full bg-black/60 px-3 py-1 text-sm text-white'>
          <svg className='h-4 w-4 animate-spin text-white' xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24'>
            <circle className='opacity-25' cx='12' cy='12' r='10' stroke='currentColor' strokeWidth='4'></circle>
            <path
              className='opacity-75'
              fill='currentColor'
              d='M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z'
            ></path>
          </svg>
          <span>Connecting media...</span>
        </div>
      )}
    </div>
  );
}
