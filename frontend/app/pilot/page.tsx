'use client';

import { Logo } from '@/app/components/ui/logo';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';
import { useRouter } from 'next/navigation';

export default function PilotPage() {
  const router = useRouter();

  const features = [
    {
      title: 'Scheduled Browser Automation',
      description: 'Set up intelligent workflows that execute web tasks automatically, with dynamic decision making powered by AI.',
      capabilities: ['Zero-code browser automation', 'Dynamic decision making', 'Scheduled execution'],
      gradient: 'from-purple-600 to-indigo-400',
    },
    {
      title: 'Smart Process Engine',
      description: 'Turn complex SOPs into simple steps with our AI that learns your workflows and guides you through them.',
      capabilities: ['Instant SOP digitization', 'Smart workflow understanding', 'Tailored recommendations'],
      gradient: 'from-blue-600 to-cyan-400',
    },
    {
      title: 'Adaptive Execution',
      description: 'Handle unexpected scenarios with AI that can make real-time decisions based on your business rules and web content.',
      capabilities: ['Context-aware operations', 'Real-time decision support', 'Error recovery intelligence'],
      gradient: 'from-indigo-600 to-blue-500',
    },
  ];

  return (
    <div className='relative min-h-screen w-full'>
      {/* Enhanced gradient background */}
      <div className='fixed inset-0 bg-gradient-to-b from-white via-blue-100 to-blue-300'>
        {/* Subtle abstract shapes for visual depth */}
        <div className='absolute inset-0 opacity-30'>
          <div className='absolute right-0 top-0 h-[45vh] w-[45vw] rounded-full bg-blue-200 blur-[100px]'></div>
          <div className='absolute bottom-0 left-0 h-[40vh] w-[40vw] rounded-full bg-blue-200 blur-[100px]'></div>
          <div className='absolute bottom-1/3 right-1/4 h-[30vh] w-[30vw] rounded-full bg-indigo-200 opacity-40 blur-[80px]'></div>
          <div className='absolute left-1/4 top-1/3 h-[20vh] w-[20vw] rounded-full bg-purple-200 opacity-30 blur-[60px]'></div>
        </div>
      </div>

      {/* Minimalist header */}
      <header className='sticky top-4 z-20 flex items-center justify-between px-6 py-4 md:px-10'>
        <div className='flex items-center'>
          <Logo size='md' theme='blue' iconStyle='gradient' className='cursor-pointer' onClick={() => router.push('/')} />
        </div>

        <nav className='flex items-center space-x-4'>
          <button onClick={() => router.push('/')} className='flex items-center font-medium text-sm text-blue-600 hover:text-blue-700'>
            <ArrowLeftIcon className='mr-2 h-4 w-4' />
            Back to Home
          </button>
          <button
            onClick={() => window.open('https://calendly.com/jasonyu0100/15min', '_blank')}
            className='rounded-full bg-gradient-to-r from-blue-500 to-blue-700 px-4 py-1.5 font-medium text-sm text-white shadow-sm transition-all hover:from-blue-600 hover:to-blue-800'
          >
            Schedule Demo
          </button>
        </nav>
      </header>

      {/* Main content */}
      <main className='relative z-10 mx-auto max-w-6xl px-6 py-16 md:px-10 md:py-24'>
        <div className='relative mb-20 text-center'>
          <span className='mb-8 inline-block rounded-full bg-blue-500 px-4 py-1 text-sm font-semibold text-white shadow-md'>BETA ACCESS</span>
          <h1 className='mb-6 bg-gradient-to-r from-purple-600 to-indigo-500 bg-clip-text font-bold text-4xl tracking-tight text-transparent md:text-5xl lg:text-6xl'>
            Automation Meet Intelligence
          </h1>
          <p className='mx-auto max-w-2xl text-lg text-slate-700 md:text-xl'>
            Our newest feature: AI-powered browser automations that handle complex web tasks with human-like intelligence. Set it, schedule it, forget it.
          </p>
        </div>

        <div className='grid gap-12 md:grid-cols-3'>
          {features.map((feature, index) => (
            <div
              key={index}
              className='group relative overflow-hidden rounded-2xl bg-white/80 p-1 shadow-xl transition-all duration-300 hover:scale-[1.02] hover:shadow-2xl'
            >
              {/* Gradient border */}
              <div className={`absolute inset-0 rounded-2xl bg-gradient-to-br ${feature.gradient} opacity-80`}></div>

              {/* Content */}
              <div className='relative flex h-full flex-col rounded-xl bg-white p-6'>
                <h2 className={`mb-4 bg-gradient-to-r ${feature.gradient} bg-clip-text font-bold text-2xl text-transparent`}>{feature.title}</h2>
                <p className='mb-6 text-slate-700'>{feature.description}</p>
                <h3 className='mb-4 font-medium text-slate-800'>Key Capabilities:</h3>
                <ul className='space-y-3 text-slate-600'>
                  {feature.capabilities.map((capability, idx) => (
                    <li key={idx} className='flex items-start'>
                      <span className={`mr-2 font-bold text-lg text-blue-500`}>→</span>
                      {capability}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>

        {/* Browser Automation Showcase section */}
        <div className='mt-32'>
          <div className='rounded-2xl bg-white/80 p-1 shadow-xl'>
            <div className='overflow-hidden rounded-xl bg-gradient-to-r from-purple-50 to-indigo-50 p-8 md:p-10'>
              <div className='grid gap-10 md:grid-cols-2'>
                <div>
                  <h2 className='mb-6 bg-gradient-to-r from-purple-600 to-indigo-500 bg-clip-text font-bold text-3xl text-transparent'>
                    Powerful Browser Automation
                  </h2>
                  <p className='mb-6 text-slate-700'>
                    Our new automation engine lets operators execute complex web workflows with structured instructions that adapt in real-time.
                  </p>
                  <ul className='mb-8 space-y-4'>
                    <li className='flex items-start'>
                      <span className='mr-3 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-purple-100 font-bold text-sm text-purple-600'>
                        1
                      </span>
                      <div>
                        <p className='font-medium text-slate-700'>Structured Operations</p>
                        <p className='text-sm text-slate-600'>Define workflows once, execute perfectly every time</p>
                      </div>
                    </li>
                    <li className='flex items-start'>
                      <span className='mr-3 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-purple-100 font-bold text-sm text-purple-600'>
                        2
                      </span>
                      <div>
                        <p className='font-medium text-slate-700'>Dynamic Adaptability</p>
                        <p className='text-sm text-slate-600'>AI-powered decisions based on real-time browser content</p>
                      </div>
                    </li>
                    <li className='flex items-start'>
                      <span className='mr-3 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-purple-100 font-bold text-sm text-purple-600'>
                        3
                      </span>
                      <div>
                        <p className='font-medium text-slate-700'>Schedule & Monitor</p>
                        <p className='text-sm text-slate-600'>Set timing and get detailed logs of every operation</p>
                      </div>
                    </li>
                  </ul>
                </div>
                <div className='relative flex items-center justify-center'>
                  <div className='absolute inset-0 flex items-center justify-center'>
                    <div className='h-64 w-64 rounded-full bg-purple-300/20 blur-3xl'></div>
                  </div>
                  <div className='relative z-10 rounded-xl bg-white/80 p-6 shadow-lg backdrop-blur-sm'>
                    <div className='aspect-video w-full overflow-hidden rounded-lg bg-slate-100'>
                      <img src='/demo/browser.png' alt='Browser Automation Demo' className='h-full w-full object-cover' />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* How Browser Automation Works */}
        <div className='mt-32'>
          <h2 className='mb-12 bg-gradient-to-r from-purple-600 to-indigo-500 bg-clip-text text-center font-bold text-3xl text-transparent md:text-4xl'>
            Automate Any Workflow Now
          </h2>
          <div className='grid gap-8 md:grid-cols-4'>
            <div className='rounded-xl bg-white/80 p-6 shadow-lg'>
              <div className='mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-r from-purple-600 to-indigo-400'>
                <span className='font-bold text-xl text-white'>1</span>
              </div>
              <h3 className='mb-2 text-xl font-semibold text-slate-900'>Design Your Flow</h3>
              <p className='text-slate-700'>Map out your web operations with our intuitive visual workflow builder</p>
            </div>
            <div className='rounded-xl bg-white/80 p-6 shadow-lg'>
              <div className='mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-r from-indigo-500 to-blue-500'>
                <span className='font-bold text-xl text-white'>2</span>
              </div>
              <h3 className='mb-2 text-xl font-semibold text-slate-900'>Add Decision Points</h3>
              <p className='text-slate-700'>Set up conditional logic that responds dynamically to changing web content</p>
            </div>
            <div className='rounded-xl bg-white/80 p-6 shadow-lg'>
              <div className='mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-r from-blue-600 to-purple-500'>
                <span className='font-bold text-xl text-white'>3</span>
              </div>
              <h3 className='mb-2 text-xl font-semibold text-slate-900'>Schedule Execution</h3>
              <p className='text-slate-700'>Set when and how often your automation runs with flexible scheduling options</p>
            </div>
            <div className='rounded-xl bg-white/80 p-6 shadow-lg'>
              <div className='mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-r from-purple-500 to-purple-700'>
                <span className='font-bold text-xl text-white'>4</span>
              </div>
              <h3 className='mb-2 text-xl font-semibold text-slate-900'>Monitor & Refine</h3>
              <p className='text-slate-700'>Track execution details and improve your automation with AI-suggested optimizations</p>
            </div>
          </div>
        </div>

        <div className='mt-24 text-center'>
          <button
            onClick={() => router.push('/login')}
            className='group relative overflow-hidden rounded-lg bg-gradient-to-r from-purple-600 to-indigo-500 px-8 py-4 font-medium text-lg text-white shadow-lg transition-all duration-300 hover:shadow-xl'
          >
            <span className='relative z-10'>Join the Pilot Program</span>
            <span className='absolute inset-0 -translate-y-full bg-gradient-to-r from-purple-700 to-indigo-600 transition-transform duration-300 ease-in-out group-hover:translate-y-0'></span>
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
