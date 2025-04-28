'use client';

import { Logo } from '@/app/components/ui/logo';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';
import { useRouter } from 'next/navigation';

export default function FeaturesPage() {
  const router = useRouter();

  const features = [
    {
      title: 'Smart Process Engine',
      description: 'Turn complex SOPs into simple steps with our AI that learns your workflows and guides you through them.',
      capabilities: ['Instant SOP digitization', 'Smart workflow insights', 'Tailored recommendations'],
      gradient: 'from-blue-600 to-cyan-400',
    },
    {
      title: 'One-Prompt Planning',
      description: 'Type one sentence, get your perfect week. Our AI transforms your intentions into an optimized schedule in seconds.',
      capabilities: ['Effortless weekly planning', 'Auto-adapting schedules', 'Priority optimization'],
      gradient: 'from-blue-700 to-indigo-500',
    },
    {
      title: 'Guided Execution',
      description: 'Navigate tasks like using Google Maps, with step-by-step guidance and real-time tracking that eliminates guesswork.',
      capabilities: ['Live AI guidance', 'Progress tracking', 'Automatic documentation'],
      gradient: 'from-indigo-600 to-blue-500',
    },
  ];

  return (
    <div className='relative min-h-screen w-full'>
      {/* Enhanced gradient background */}
      <div className='fixed inset-0 bg-gradient-to-b from-white via-blue-100 to-blue-300'>
        {/* Subtle abstract shapes for visual depth */}
        <div className='absolute inset-0 opacity-30'>
          <div className='absolute top-0 right-0 h-[45vh] w-[45vw] rounded-full bg-blue-200 blur-[100px]'></div>
          <div className='absolute bottom-0 left-0 h-[40vh] w-[40vw] rounded-full bg-blue-200 blur-[100px]'></div>
          <div className='absolute right-1/4 bottom-1/3 h-[30vh] w-[30vw] rounded-full bg-indigo-200 opacity-40 blur-[80px]'></div>
          <div className='absolute top-1/3 left-1/4 h-[20vh] w-[20vw] rounded-full bg-purple-200 opacity-30 blur-[60px]'></div>
        </div>
      </div>

      {/* Minimalist header */}
      <header className='sticky top-4 z-20 flex items-center justify-between px-6 py-4 md:px-10'>
        <div className='flex items-center'>
          <Logo size='md' theme='blue' iconStyle='gradient' className='cursor-pointer' onClick={() => router.push('/')} />
        </div>

        <nav className='flex items-center space-x-4'>
          <button onClick={() => router.push('/')} className='flex items-center text-sm font-medium text-blue-600 hover:text-blue-700'>
            <ArrowLeftIcon className='mr-2 h-4 w-4' />
            Back to Home
          </button>
          <button
            onClick={() => window.open('https://calendly.com/jasonyu0100/15min', '_blank')}
            className='rounded-full bg-gradient-to-r from-blue-500 to-blue-700 px-4 py-1.5 text-sm font-medium text-white shadow-sm transition-all hover:from-blue-600 hover:to-blue-800'
          >
            Schedule Demo
          </button>
        </nav>
      </header>

      {/* Main content */}
      <main className='relative z-10 mx-auto max-w-6xl px-6 py-16 md:px-10 md:py-24'>
        <div className='mb-20 text-center'>
          <h1 className='mb-6 bg-gradient-to-r from-blue-600 to-indigo-500 bg-clip-text text-4xl font-bold tracking-tight text-transparent md:text-5xl lg:text-6xl'>
            10x Your Productivity
          </h1>
          <p className='mx-auto max-w-2xl text-lg text-slate-700 md:text-xl'>
            AI-powered planning & execution that transforms chaos into clarity. Get more done with less stress.
          </p>
        </div>

        <div className='grid gap-12 md:grid-cols-3'>
          {features.map((feature, index) => (
            <div
              key={index}
              className='group relative overflow-hidden rounded-2xl bg-white/90 p-1 shadow-xl transition-all duration-300 hover:scale-[1.02] hover:shadow-2xl'
            >
              {/* Gradient border */}
              <div className={`absolute inset-0 rounded-2xl bg-gradient-to-br ${feature.gradient} opacity-80`}></div>

              {/* Content */}
              <div className='relative flex h-full flex-col rounded-xl bg-white p-6'>
                <h2 className={`mb-4 bg-gradient-to-r ${feature.gradient} bg-clip-text text-2xl font-bold text-transparent`}>{feature.title}</h2>
                <p className='mb-6 text-slate-700'>{feature.description}</p>
                <h3 className='mb-4 font-medium text-slate-800'>Key Capabilities:</h3>
                <ul className='space-y-3 text-slate-600'>
                  {feature.capabilities.map((capability, idx) => (
                    <li key={idx} className='flex items-start'>
                      <span className={`mr-2 text-lg font-bold text-blue-500`}>→</span>
                      {capability}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>

        {/* Performance Insights section */}
        <div className='mt-32'>
          <div className='rounded-2xl bg-white/90 p-1 shadow-xl'>
            <div className='overflow-hidden rounded-xl bg-gradient-to-r from-blue-50 to-indigo-50 p-8 md:p-10'>
              <div className='grid gap-10 md:grid-cols-2'>
                <div>
                  <h2 className='mb-6 bg-gradient-to-r from-blue-600 to-indigo-500 bg-clip-text text-3xl font-bold text-transparent'>AI-Powered Analytics</h2>
                  <p className='mb-6 text-slate-700'>
                    See exactly what's working and what's not. Our AI spots bottlenecks and suggests improvements before problems arise.
                  </p>
                  <ul className='mb-8 space-y-4'>
                    <li className='flex items-start'>
                      <span className='mr-3 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-blue-100 text-sm font-bold text-blue-600'>
                        1
                      </span>
                      <div>
                        <p className='font-medium text-slate-700'>Real-time Process Metrics</p>
                        <p className='text-sm text-slate-600'>See how well your team is executing in real-time</p>
                      </div>
                    </li>
                    <li className='flex items-start'>
                      <span className='mr-3 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-blue-100 text-sm font-bold text-blue-600'>
                        2
                      </span>
                      <div>
                        <p className='font-medium text-slate-700'>Progress Dashboard</p>
                        <p className='text-sm text-slate-600'>Visualize exactly where you stand on every project</p>
                      </div>
                    </li>
                    <li className='flex items-start'>
                      <span className='mr-3 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-blue-100 text-sm font-bold text-blue-600'>
                        3
                      </span>
                      <div>
                        <p className='font-medium text-slate-700'>AI Optimization Coach</p>
                        <p className='text-sm text-slate-600'>Get personalized tips to improve performance instantly</p>
                      </div>
                    </li>
                  </ul>
                </div>
                <div className='relative flex items-center justify-center'>
                  <div className='absolute inset-0 flex items-center justify-center'>
                    <div className='h-64 w-64 rounded-full bg-blue-300/20 blur-3xl'></div>
                  </div>
                  <div className='relative z-10 rounded-xl bg-white/80 p-6 shadow-lg backdrop-blur-sm'>
                    <div className='aspect-video w-full overflow-hidden rounded-lg bg-slate-100'>
                      <img src='/demo/demo-3.png' alt='Performance Insights Demo' className='h-full w-full object-cover' />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* How It Works */}
        <div className='mt-32'>
          <h2 className='mb-12 bg-gradient-to-r from-blue-600 to-indigo-500 bg-clip-text text-center text-3xl font-bold text-transparent md:text-4xl'>
            From Chaos to Clarity in 4 Steps
          </h2>
          <div className='grid gap-8 md:grid-cols-4'>
            <div className='rounded-xl bg-white/90 p-6 shadow-lg'>
              <div className='mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-r from-blue-600 to-cyan-400'>
                <span className='text-xl font-bold text-white'>1</span>
              </div>
              <h3 className='mb-2 text-xl font-semibold text-slate-900'>Drop in Your SOPs</h3>
              <p className='text-slate-700'>Our AI transforms boring documents into smart, interactive guides</p>
            </div>
            <div className='rounded-xl bg-white/90 p-6 shadow-lg'>
              <div className='mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-r from-blue-700 to-indigo-500'>
                <span className='text-xl font-bold text-white'>2</span>
              </div>
              <h3 className='mb-2 text-xl font-semibold text-slate-900'>Plan in Seconds</h3>
              <p className='text-slate-700'>Tell our AI what you want to achieve and get a perfect schedule instantly</p>
            </div>
            <div className='rounded-xl bg-white/90 p-6 shadow-lg'>
              <div className='mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-r from-indigo-600 to-blue-500'>
                <span className='text-xl font-bold text-white'>3</span>
              </div>
              <h3 className='mb-2 text-xl font-semibold text-slate-900'>Execute Flawlessly</h3>
              <p className='text-slate-700'>Never miss a step with AI guidance that adapts to your workstyle</p>
            </div>
            <div className='rounded-xl bg-white/90 p-6 shadow-lg'>
              <div className='mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-r from-blue-500 to-purple-500'>
                <span className='text-xl font-bold text-white'>4</span>
              </div>
              <h3 className='mb-2 text-xl font-semibold text-slate-900'>Level Up Daily</h3>
              <p className='text-slate-700'>Get smarter each day as our AI learns what works for you and your team</p>
            </div>
          </div>
        </div>

        <div className='mt-24 text-center'>
          <h2 className='mb-8 bg-gradient-to-r from-blue-700 to-indigo-600 bg-clip-text text-2xl font-bold text-transparent md:text-3xl'>
            Stop wasting time. Start getting results.
          </h2>
          <button
            onClick={() => router.push('/login?mode=signup')}
            className='group relative overflow-hidden rounded-lg bg-gradient-to-r from-blue-600 to-indigo-500 px-8 py-4 text-lg font-medium text-white shadow-lg transition-all duration-300 hover:shadow-xl'
          >
            <span className='relative z-10'>Try Free for 14 Days</span>
            <span className='absolute inset-0 -translate-y-full bg-gradient-to-r from-blue-700 to-indigo-600 transition-transform duration-300 ease-in-out group-hover:translate-y-0'></span>
          </button>
        </div>
      </main>

      {/* Footer - dark glass effect */}
      <footer className='relative z-10 border-t border-slate-700/30 bg-slate-800/80 p-8 backdrop-blur-lg backdrop-saturate-150'>
        {/* Dark glass effect with subtle blue highlight */}
        <div className='pointer-events-none absolute inset-0 bg-[linear-gradient(135deg,rgba(59,130,246,0.2)_0%,rgba(59,130,246,0.05)_100%)] opacity-40'></div>

        <div className='mx-auto flex max-w-4xl flex-col items-center justify-between space-y-6 px-6 md:flex-row md:space-y-0'>
          <div className='flex items-center space-x-4'>
            <Logo size='sm' theme='white' iconStyle='gradient' />
            <p className='text-sm text-white/90'>© 2025 convers.me</p>
          </div>

          <div className='flex items-center space-x-6'>
            <a href='/' className='text-sm text-white/90 transition-colors hover:text-blue-400'>
              Home
            </a>
            <a href='#' className='text-sm text-white/90 transition-colors hover:text-blue-400'>
              Privacy
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
