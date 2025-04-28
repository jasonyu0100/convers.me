import { GradientBackground } from './GradientBackground';

export function BackgroundExamples() {
  return (
    <div className='grid grid-cols-2 gap-4 p-4'>
      {/* Subtle Blue (Default) */}
      <div className='relative h-64 w-full overflow-hidden rounded-lg shadow-lg'>
        <GradientBackground intensity='subtle' color='blue' />
        <div className='absolute inset-0 flex items-center justify-center'>
          <div className='bg-white/80ty-80 rounded-md bg-white/80 p-4 shadow-sm'>
            <h3 className='font-medium'>Subtle Blue</h3>
          </div>
        </div>
      </div>

      {/* Medium Purple */}
      <div className='relative h-64 w-full overflow-hidden rounded-lg shadow-lg'>
        <GradientBackground intensity='medium' color='purple' />
        <div className='absolute inset-0 flex items-center justify-center'>
          <div className='bg-white/80ty-80 rounded-md bg-white/80 p-4 shadow-sm'>
            <h3 className='font-medium'>Medium Purple</h3>
          </div>
        </div>
      </div>

      {/* Vibrant Teal with no shapes */}
      <div className='relative h-64 w-full overflow-hidden rounded-lg shadow-lg'>
        <GradientBackground intensity='vibrant' color='teal' shapes={false} />
        <div className='absolute inset-0 flex items-center justify-center'>
          <div className='bg-white/80ty-80 rounded-md bg-white/80 p-4 shadow-sm'>
            <h3 className='font-medium'>Vibrant Teal (No Shapes)</h3>
          </div>
        </div>
      </div>

      {/* Medium Gray with no animation */}
      <div className='relative h-64 w-full overflow-hidden rounded-lg shadow-lg'>
        <GradientBackground intensity='medium' color='gray' animated={false} />
        <div className='absolute inset-0 flex items-center justify-center'>
          <div className='bg-white/80ty-80 rounded-md bg-white/80 p-4 shadow-sm'>
            <h3 className='font-medium'>Medium Gray (Static)</h3>
          </div>
        </div>
      </div>

      {/* Subtle Blue with no texture */}
      <div className='relative h-64 w-full overflow-hidden rounded-lg shadow-lg'>
        <GradientBackground intensity='subtle' color='blue' texture={false} />
        <div className='absolute inset-0 flex items-center justify-center'>
          <div className='bg-white/80ty-80 rounded-md bg-white/80 p-4 shadow-sm'>
            <h3 className='font-medium'>Subtle Blue (No Texture)</h3>
          </div>
        </div>
      </div>

      {/* Vibrant Purple with all features */}
      <div className='relative h-64 w-full overflow-hidden rounded-lg shadow-lg'>
        <GradientBackground intensity='vibrant' color='purple' />
        <div className='absolute inset-0 flex items-center justify-center'>
          <div className='bg-white/80ty-80 rounded-md bg-white/80 p-4 shadow-sm'>
            <h3 className='font-medium'>Vibrant Purple</h3>
          </div>
        </div>
      </div>
    </div>
  );
}
