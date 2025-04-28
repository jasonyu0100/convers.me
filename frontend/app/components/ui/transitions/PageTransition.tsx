'use client';

import { ReactNode, useEffect, useState } from 'react';

interface PageTransitionProps {
  children: ReactNode;
  duration?: number;
  appear?: boolean; // Controls whether to animate on initial mount
}

/**
 * Seamless page transition with optimized fade effect
 */
export function PageTransition({ children, duration = 300, appear = true }: PageTransitionProps) {
  const [isVisible, setIsVisible] = useState(!appear);

  useEffect(() => {
    if (!appear) return;

    // Use requestAnimationFrame for smoother transitions
    // This delays the animation until the browser's next repaint cycle
    let frameId: number;

    // First frame sets up the initial state
    frameId = requestAnimationFrame(() => {
      // Second frame triggers the transition after a brief delay
      frameId = requestAnimationFrame(() => {
        setIsVisible(true);
      });
    });

    return () => {
      if (frameId) cancelAnimationFrame(frameId);
    };
  }, [appear]);

  // Convert duration to string for CSS
  const durationMs = `${duration}ms`;

  // Optimized transition style - only animate opacity with hardware acceleration hint
  const transitionStyle = {
    opacity: isVisible ? 1 : 0,
    transition: `opacity ${durationMs} ease-out`,
    willChange: 'opacity',
    backfaceVisibility: 'hidden' as 'hidden', // Hint for hardware acceleration
    WebkitBackfaceVisibility: 'hidden' as 'hidden',
  };

  return (
    <div className='flex h-full w-full flex-col' style={transitionStyle}>
      {children}
    </div>
  );
}
