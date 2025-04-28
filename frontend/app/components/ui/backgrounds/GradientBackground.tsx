import { cva, type VariantProps } from 'class-variance-authority';
import React from 'react';

const backgroundVariants = cva('absolute inset-0', {
  variants: {
    intensity: {
      subtle: '',
      medium: '',
      vibrant: '',
    },
    color: {
      blue: '',
      purple: '',
      teal: '',
      gray: '',
    },
  },
  defaultVariants: {
    intensity: 'subtle',
    color: 'blue',
  },
});

export interface GradientBackgroundProps extends VariantProps {
  className?: string;
  shapes?: boolean;
  texture?: boolean;
  animated?: boolean;
}

export function GradientBackground({
  intensity = 'subtle',
  color = 'blue',
  shapes = true,
  texture = true,
  animated = true,
  className = '',
}: GradientBackgroundProps) {
  // Gradient colors based on variant
  const gradientColors = {
    blue: {
      subtle: 'linear-gradient(135deg, #f5faff, #eaf6fe, #d3effe, #c1e7fc, #aee1fd, #9bd8fc)',
      medium: 'linear-gradient(135deg, #f0f9ff, #e1f5fe, #b3e5fc, #81d4fa, #4fc3f7, #29b6f6)',
      vibrant: 'linear-gradient(135deg, #e3f2fd, #bbdefb, #90caf9, #64b5f6, #42a5f5, #2196f3)',
    },
    purple: {
      subtle: 'linear-gradient(135deg, #f5f3ff, #ede9fe, #ddd6fe, #c4b5fd, #a78bfa, #8b5cf6)',
      medium: 'linear-gradient(135deg, #f3e8ff, #e9d5ff, #d8b4fe, #c084fc, #a855f7, #9333ea)',
      vibrant: 'linear-gradient(135deg, #ede9fe, #ddd6fe, #c4b5fd, #a78bfa, #8b5cf6, #7c3aed)',
    },
    teal: {
      subtle: 'linear-gradient(135deg, #f0fdfa, #ccfbf1, #99f6e4, #5eead4, #2dd4bf, #14b8a6)',
      medium: 'linear-gradient(135deg, #ecfdf5, #d1fae5, #a7f3d0, #6ee7b7, #34d399, #10b981)',
      vibrant: 'linear-gradient(135deg, #d1fae5, #a7f3d0, #6ee7b7, #34d399, #10b981, #059669)',
    },
    gray: {
      subtle: 'linear-gradient(135deg, #f9fafb, #f3f4f6, #e5e7eb, #d1d5db, #9ca3af, #6b7280)',
      medium: 'linear-gradient(135deg, #f3f4f6, #e5e7eb, #d1d5db, #9ca3af, #6b7280, #4b5563)',
      vibrant: 'linear-gradient(135deg, #e5e7eb, #d1d5db, #9ca3af, #6b7280, #4b5563, #374151)',
    },
  };

  // Shape colors based on variant
  const shapeColors = {
    blue: {
      shape1: { from: 'from-blue-100', to: 'to-blue-200/20' },
      shape2: { from: 'from-blue-200', to: 'to-blue-300/20' },
      shape3: { from: 'from-blue-300', to: 'to-blue-400/30' },
      shape4: { from: 'from-blue-400', to: 'to-blue-500/40' },
    },
    purple: {
      shape1: { from: 'from-purple-100', to: 'to-purple-200/20' },
      shape2: { from: 'from-purple-200', to: 'to-purple-300/20' },
      shape3: { from: 'from-purple-300', to: 'to-purple-400/30' },
      shape4: { from: 'from-purple-400', to: 'to-purple-500/40' },
    },
    teal: {
      shape1: { from: 'from-teal-100', to: 'to-teal-200/20' },
      shape2: { from: 'from-teal-200', to: 'to-teal-300/20' },
      shape3: { from: 'from-teal-300', to: 'to-teal-400/30' },
      shape4: { from: 'from-teal-400', to: 'to-teal-500/40' },
    },
    gray: {
      shape1: { from: 'from-gray-100', to: 'to-gray-200/20' },
      shape2: { from: 'from-gray-200', to: 'to-gray-300/20' },
      shape3: { from: 'from-gray-300', to: 'to-gray-400/30' },
      shape4: { from: 'from-gray-400', to: 'to-gray-500/40' },
    },
  };

  // Texture fill color based on variant
  const textureFill = {
    blue: '%236dd5ed',
    purple: '%23a78bfa',
    teal: '%235eead4',
    gray: '%239ca3af',
  };

  // Animation styles
  const animationStyles = `
    @keyframes gradientShift {
      0% {
        background-position: 0% 50%;
      }
      50% {
        background-position: 100% 50%;
      }
      100% {
        background-position: 0% 50%;
      }
    }

    @keyframes float {
      0% {
        transform: translateY(0px);
      }
      50% {
        transform: translateY(-10px);
      }
      100% {
        transform: translateY(0px);
      }
    }

    @keyframes fadeInOut {
      0% {
        opacity: 0.3;
      }
      50% {
        opacity: 0.5;
      }
      100% {
        opacity: 0.3;
      }
    }
  `;

  return (
    <div className='relative h-full w-full overflow-hidden'>
      {/* Inject animation styles */}
      {animated && <style dangerouslySetInnerHTML={{ __html: animationStyles }} />}

      {/* Gradient background */}
      <div
        className={backgroundVariants({ intensity, color, className })}
        style={{
          background: gradientColors[color][intensity],
          backgroundSize: '300% 300%',
          animation: animated ? 'gradientShift 25s ease infinite' : 'none',
          zIndex: 0,
        }}
      ></div>

      {/* Floating shapes */}
      {shapes && (
        <div className='absolute inset-0 overflow-hidden' style={{ zIndex: 1 }}>
          {/* Large shape */}
          <div
            className={`absolute rounded-full bg-gradient-to-br ${shapeColors[color].shape1.from} ${shapeColors[color].shape1.to}`}
            style={{
              width: '600px',
              height: '600px',
              bottom: '-200px',
              right: '-100px',
              animation: animated ? 'float 30s ease-in-out infinite' : 'none',
              filter: 'blur(100px)',
              opacity: 0.25,
            }}
          ></div>

          {/* Medium shape */}
          <div
            className={`absolute rounded-full bg-gradient-to-tr ${shapeColors[color].shape2.from} ${shapeColors[color].shape2.to}`}
            style={{
              width: '500px',
              height: '500px',
              top: '-150px',
              left: '-100px',
              animation: animated ? 'float 35s ease-in-out infinite reverse' : 'none',
              filter: 'blur(90px)',
              opacity: 0.2,
            }}
          ></div>

          {/* Small accent shape */}
          <div
            className={`absolute rounded-full bg-gradient-to-br ${shapeColors[color].shape3.from} ${shapeColors[color].shape3.to}`}
            style={{
              width: '300px',
              height: '300px',
              right: '10%',
              top: '20%',
              animation: animated ? 'float 28s ease-in-out infinite, fadeInOut 15s ease-in-out infinite' : 'none',
              filter: 'blur(80px)',
              opacity: 0.15,
            }}
          ></div>

          {/* Small deep accent */}
          <div
            className={`absolute rounded-full bg-gradient-to-bl ${shapeColors[color].shape4.from} ${shapeColors[color].shape4.to}`}
            style={{
              width: '250px',
              height: '250px',
              left: '10%',
              bottom: '10%',
              animation: animated ? 'float 32s ease-in-out infinite 2s reverse, fadeInOut 20s ease-in-out infinite' : 'none',
              filter: 'blur(70px)',
              opacity: 0.1,
            }}
          ></div>
        </div>
      )}

      {/* Texture overlay */}
      {texture && (
        <div
          className='absolute inset-0'
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 100 100'%3E%3Cpath fill='${textureFill[color]}' fill-opacity='0.01' d='M11 18c3.866 0 7-3.134 7-7s-3.134-7-7-7-7 3.134-7 7 3.134 7 7 7zm48 25c3.866 0 7-3.134 7-7s-3.134-7-7-7-7 3.134-7 7 3.134 7 7 7zm-43-7c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zm63 31c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zM34 90c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zm56-76c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zM12 86c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm28-65c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm23-11c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm-6 60c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm29 22c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zM32 63c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm57-13c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm-9-21c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM60 91c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM35 41c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM12 60c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2z'%3E%3C/path%3E%3C/svg%3E")`,
            zIndex: 2,
            mixBlendMode: 'soft-light',
            opacity: 0.15,
          }}
        ></div>
      )}
    </div>
  );
}
