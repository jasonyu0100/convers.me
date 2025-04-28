'use client';

import { useEffect, useRef, useState } from 'react';

export interface AudioWaveformProps {
  audioStream: MediaStream | null;
  isActive: boolean;
  color?: string;
  width?: number;
  height?: number;
  barCount?: number;
  barWidth?: number;
  barSpacing?: number;
}

export function AudioWaveform({
  audioStream,
  isActive,
  color = '#3b82f6', // Default to blue-500
  width = 180,
  height = 60,
  barCount = 30,
  barWidth = 3,
  barSpacing = 2,
}: AudioWaveformProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>(0);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const dataArrayRef = useRef<Uint8Array | null>(null);
  const [audioContext, setAudioContext] = useState<AudioContext | null>(null);

  // Initialize audio context and analyzer
  useEffect(() => {
    // Clean up any existing animation frame
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }

    // Clean up any existing audio context
    if (audioContext) {
      audioContext.close();
    }

    if (isActive && audioStream) {
      // Create new audio context
      const context = new (window.AudioContext || (window as any).webkitAudioContext)();
      setAudioContext(context);

      // Create analyzer node
      const analyser = context.createAnalyser();
      analyser.fftSize = 1024; // Higher FFT size for smoother waveform
      const bufferLength = analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);

      // Connect stream to analyzer
      const source = context.createMediaStreamSource(audioStream);
      source.connect(analyser);

      // Store references
      analyserRef.current = analyser;
      dataArrayRef.current = dataArray;

      // Start animation
      animateWaveform();
    }

    return () => {
      // Clean up animation and audio context when component unmounts or props change
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      if (audioContext) {
        audioContext.close();
      }
    };
  }, [isActive, audioStream]);

  // Draw horizontal waveform animation (continuous line with peaks and valleys)
  const animateWaveform = () => {
    if (!canvasRef.current || !analyserRef.current || !dataArrayRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas dimensions
    const canvasWidth = canvas.width;
    const canvasHeight = canvas.height;
    const centerY = canvasHeight / 2;

    // Clear the canvas
    ctx.clearRect(0, 0, canvasWidth, canvasHeight);

    // If not active, just draw a flat line
    if (!isActive) {
      ctx.beginPath();
      ctx.moveTo(0, centerY);
      ctx.lineTo(canvasWidth, centerY);
      ctx.strokeStyle = color;
      ctx.lineWidth = 1;
      ctx.stroke();
      return;
    }

    // Switch to time domain data for smoother waveform
    if (analyserRef.current) {
      // Create buffer for time domain data
      const bufferLength = analyserRef.current.fftSize;
      const timeData = new Uint8Array(bufferLength);

      // Get time domain data - this gives us amplitude over time
      analyserRef.current.getByteTimeDomainData(timeData);

      // Begin drawing the waveform
      ctx.beginPath();

      // Width between points
      const sliceWidth = canvasWidth / bufferLength;

      // Draw the waveform point by point
      for (let i = 0; i < bufferLength; i++) {
        // Time domain data ranges from 0-255, with 128 being silence
        // Scale it to canvas height
        const value = timeData[i] / 255.0;
        const y = centerY + (value - 0.5) * canvasHeight * 1.2; // Amplify the waveform a bit
        const x = i * sliceWidth;

        if (i === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      }

      // Finish the waveform path
      ctx.strokeStyle = color;
      ctx.lineWidth = 2;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.stroke();

      // Optional: Add a subtle fill beneath the line
      ctx.lineTo(canvasWidth, centerY);
      ctx.lineTo(0, centerY);
      ctx.fillStyle = `${color}20`; // 12% opacity
      ctx.fill();
    }

    // Continue animation
    animationRef.current = requestAnimationFrame(animateWaveform);
  };

  // If not active, draw a flat line
  useEffect(() => {
    if (!isActive && canvasRef.current) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      // Clear canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Draw flat line
      ctx.beginPath();
      ctx.moveTo(0, canvas.height / 2);
      ctx.lineTo(canvas.width, canvas.height / 2);
      ctx.strokeStyle = color;
      ctx.lineWidth = 1;
      ctx.stroke();
    }
  }, [isActive, color]);

  return <canvas ref={canvasRef} height={height} width={width} className='audio-waveform rounded bg-slate-100 shadow-inner' style={{ borderRadius: '8px' }} />;
}
