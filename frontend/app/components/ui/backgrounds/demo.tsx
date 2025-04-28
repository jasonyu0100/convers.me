import React from 'react';
import { BackgroundExamples } from './examples';

export default function BackgroundDemo() {
  return (
    <div className='container mx-auto py-8'>
      <div className='mb-8'>
        <h1 className='mb-2 text-3xl font-bold'>Gradient Background Components</h1>
        <p className='text-gray-600'>A collection of customizable gradient backgrounds with floating shapes and subtle textures.</p>
      </div>

      <BackgroundExamples />
    </div>
  );
}
