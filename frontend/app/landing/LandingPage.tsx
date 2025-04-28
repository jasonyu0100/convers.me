'use client';

import { Logo } from '@/app/components/ui/logo';
import { ProcessProgress } from '@/app/components/ui/process';
import { PlayIcon } from '@heroicons/react/24/outline';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';

export function LandingPage() {
  const router = useRouter();
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [activeTab, setActiveTab] = useState('connect');
  const demoRef = useRef(null);
  const demoImages = ['/demo/demo-2.png', '/demo/demo-3.png', '/demo/demo-4.png'];

  // Auto-rotate images
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentImageIndex((prevIndex) => (prevIndex + 1) % demoImages.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  // Reference to the Process Planning section
  const processRoutingRef = useRef(null);

  // Scroll to Process Planning section
  const scrollToProcessRouting = () => {
    processRoutingRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  // Scroll to demo section
  const scrollToDemo = () => {
    demoRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const features = {
    connect: {
      title: 'Process Intelligence',
      description: "Transform your organization's standard operating procedures into an intelligent planning system that understands your unique workflows.",
      points: ['SOP digitization and indexing', 'AI-powered workflow understanding', 'Personalized process recommendations'],
    },
    schedule: {
      title: 'Prompt-Based Weekly Planning',
      description:
        'Generate your perfect week from a single prompt, with intelligent scheduling that simplifies complex workflows and turns your intentions into structured time blocks.',
      points: ['Single-prompt weekly planning', 'Dynamic workload adaptation', 'Intelligent priority management'],
    },
    journal: {
      title: 'Time-Boxed Execution',
      description: 'Navigate your week with a Google Maps-like experience, completing process steps and capturing insights within each time-boxed event.',
      points: ['In-event process guidance', 'Real-time completion tracking', 'Integrated journaling and documentation'],
    },
    track: {
      title: 'Performance Insights',
      description: 'Continuously improve your processes with AI-powered analytics that track adherence, identify bottlenecks, and surface actionable insights.',
      points: ['Process adherence metrics', 'Completion rate analytics', 'Continuous improvement suggestions'],
    },
  };

  return (
    <div className='relative min-h-screen w-full overflow-x-hidden pt-20'>
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

      {/* Centered sticky white rounded header - mobile friendly */}
      <div className='fixed top-2 right-0 left-0 z-50 flex w-full justify-center px-2 md:top-4 md:px-0'>
        <header className='flex w-[98%] max-w-4xl items-center justify-between rounded-full bg-white px-3 py-2 shadow-md md:w-[90%] md:px-6 md:py-3'>
          <div className='flex items-center'>
            <Logo size='sm' theme='blue' iconStyle='gradient' className='cursor-pointer' onClick={() => router.push('/')} />
          </div>

          <nav className='flex items-center space-x-2 md:space-x-6'>
            <button onClick={() => router.push('/about')} className='text-sm font-medium text-blue-700 hover:text-blue-800'>
              About
            </button>
            <button onClick={() => router.push('/features')} className='hidden text-sm font-medium text-blue-700 hover:text-blue-800 md:block'>
              Features
            </button>
            <button onClick={() => router.push('/login?mode=signup')} className='text-sm font-medium text-blue-700 hover:text-blue-800'>
              Sign Up
            </button>
            <button
              onClick={() => window.open('https://calendly.com/jasonyu0100/15min', '_blank')}
              className='rounded-full bg-gradient-to-r from-blue-500 to-blue-700 px-3 py-1 text-xs font-medium text-white shadow-sm transition-all hover:from-blue-600 hover:to-blue-800 md:px-4 md:px-5 md:py-1.5 md:py-2 md:text-sm'
            >
              Try Demo
            </button>
          </nav>
        </header>
      </div>

      {/* Enhanced Hero Section */}
      <section className='relative z-10 flex min-h-[90vh] flex-col items-center justify-center px-4 text-center'>
        {/* Floating light elements */}
        <div className='pointer-events-none absolute inset-0'>
          <div className='absolute top-1/4 left-1/4 h-2 w-2 animate-pulse rounded-full bg-blue-200 shadow-lg shadow-blue-200/50'></div>
          <div className='absolute top-1/3 right-1/3 h-3 w-3 animate-pulse rounded-full bg-purple-200 shadow-lg shadow-purple-200/50 delay-700'></div>
          <div className='absolute right-1/4 bottom-1/4 h-2 w-2 animate-pulse rounded-full bg-blue-200 shadow-lg shadow-blue-200/50 delay-1000'></div>
        </div>

        <div className='mx-auto max-w-3xl'>
          {/* Main Heading - More Expressive */}
          <h1 className='mb-8 text-5xl leading-tight font-extrabold tracking-tight text-blue-700 sm:text-6xl md:text-7xl lg:text-8xl'>
            <span className='bg-gradient-to-r from-blue-400 via-purple-600 to-blue-600 bg-clip-text text-transparent'>Intelligent</span>{' '}
            <span className='bg-gradient-to-br from-blue-500 to-blue-700 bg-clip-text text-transparent'>Process Planning</span>
          </h1>

          {/* Subheading - More Impactful */}
          <p className='mx-auto mb-12 max-w-3xl text-xl font-medium text-blue-600 md:text-2xl lg:text-3xl'>
            <span className='bg-gradient-to-r from-blue-500 to-purple-600 bg-clip-text font-bold text-transparent'>AI-driven</span> workflow management that
            turns complex SOPs into{' '}
            <span className='bg-gradient-to-r from-purple-500 to-blue-600 bg-clip-text font-bold text-transparent'>clear, adaptive tasks</span>.
          </p>

          {/* Hero CTA buttons */}
          <div className='mt-4 flex flex-col justify-center space-y-5 sm:flex-row sm:space-y-0 sm:space-x-8'>
            <button
              onClick={() => {
                scrollToProcessRouting();
              }}
              className='group rounded-full bg-gradient-to-r from-blue-500 to-blue-700 px-8 py-4 text-lg font-bold text-white shadow-lg transition-all hover:from-blue-600 hover:to-blue-800 hover:shadow-xl md:px-10 md:py-5'
            >
              Learn More
              <span className='ml-2'>→</span>
            </button>
            <button
              onClick={() => window.open('https://calendly.com/jasonyu0100/15min', '_blank')}
              className='group flex items-center justify-center rounded-full border border-blue-100 bg-white/90 px-8 py-4 text-lg font-bold text-blue-700 shadow-md transition-all hover:bg-white/80 hover:shadow-lg md:px-10 md:py-5'
            >
              <PlayIcon className='mr-3 h-5 w-5' />
              Book a Demo
            </button>
          </div>
        </div>

        {/* Floating Stats Cards */}
        <div className='mx-auto mt-16 grid max-w-4xl grid-cols-1 gap-4 sm:grid-cols-3'>
          <div className='flex flex-col items-center rounded-xl bg-white/60 p-5 shadow-md backdrop-blur-sm transition-all hover:bg-white/70 hover:shadow-lg'>
            <div className='mb-2 text-3xl font-bold text-blue-700'>65%</div>
            <p className='text-center text-sm font-medium text-blue-600'>Faster Process Completion</p>
          </div>
          <div className='flex flex-col items-center rounded-xl bg-white/60 p-5 shadow-md backdrop-blur-sm transition-all hover:bg-white/70 hover:shadow-lg'>
            <div className='mb-2 text-3xl font-bold text-blue-700'>4.5x</div>
            <p className='text-center text-sm font-medium text-blue-600'>Higher SOP Adherence</p>
          </div>
          <div className='flex flex-col items-center rounded-xl bg-white/60 p-5 shadow-md backdrop-blur-sm transition-all hover:bg-white/70 hover:shadow-lg'>
            <div className='mb-2 text-3xl font-bold text-blue-700'>92%</div>
            <p className='text-center text-sm font-medium text-blue-600'>Operator Time Optimization</p>
          </div>
        </div>
      </section>

      {/* Featured Image Section */}
      <section className='relative z-10 py-16 md:py-24'>
        <div className='mx-auto max-w-5xl px-4 md:px-8'>
          <div
            className='group relative cursor-pointer overflow-hidden rounded-xl shadow-lg transition-all hover:shadow-xl'
            onClick={() => router.push('/about')}
          >
            <img
              src='/demo/demo-2.png'
              alt='Process Intelligence Platform'
              className='w-full object-cover transition-transform duration-500 group-hover:scale-105'
            />
            <div className='absolute inset-0 flex items-end bg-gradient-to-t from-blue-600/60 to-white/20'>
              <div className='p-6 md:p-8'>
                <h3 className='mb-2 text-2xl font-bold text-white md:text-3xl'>The Future of Process Management</h3>
                <p className='mb-4 text-white/90'>How dynamic process planning can upgrade your flow.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section ref={processRoutingRef} className='relative z-10 py-24 md:py-32'>
        <div className='mx-auto max-w-6xl px-4 md:px-8'>
          <h2 className='mb-6 text-center text-3xl font-bold text-blue-700 md:text-4xl'>Weekly Planning, Perfected</h2>
          <p className='mx-auto mb-16 max-w-3xl text-center text-lg text-blue-600'>
            Turn intentions into <span className='bg-gradient-to-r from-blue-500 to-purple-600 bg-clip-text font-bold text-transparent'>executed SOPs</span>{' '}
            with <span className='bg-gradient-to-r from-purple-500 to-blue-600 bg-clip-text font-bold text-transparent'>real-time tracking</span> and{' '}
            <span className='bg-gradient-to-br from-blue-400 to-purple-500 bg-clip-text font-bold text-transparent'>automated compliance</span>
          </p>

          {/* Three-step workflow visualization - Horizontal with alternating layout */}
          <div className='space-y-20'>
            {/* Step 1: Prompt Input - Text Left, UI Right */}
            <div className='flex flex-col items-center gap-12 md:flex-row md:gap-16'>
              <div className='w-full md:w-1/2'>
                <div className='mb-4 flex items-center'>
                  <div className='mr-4 flex h-10 w-10 items-center justify-center rounded-full bg-blue-500 font-bold text-white'>1</div>
                  <h3 className='text-2xl font-bold text-blue-700'>Define Your Intention</h3>
                </div>
                <p className='mb-6 text-lg font-light text-blue-600'>
                  Just describe what you need to accomplish this week and the{' '}
                  <span className='bg-gradient-to-r from-blue-500 to-purple-600 bg-clip-text font-bold text-transparent'>system handles the rest</span>.
                </p>
                <ul className='space-y-3'>
                  <li className='flex'>
                    <div className='mr-3 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-emerald-500'>
                      <svg className='h-3 w-3 text-white' fill='currentColor' viewBox='0 0 20 20'>
                        <path
                          fillRule='evenodd'
                          d='M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z'
                          clipRule='evenodd'
                        />
                      </svg>
                    </div>
                    <span className='font-medium text-blue-800'>AI matches your goals to SOPs</span>
                  </li>
                  <li className='flex'>
                    <div className='mr-3 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-emerald-500'>
                      <svg className='h-3 w-3 text-white' fill='currentColor' viewBox='0 0 20 20'>
                        <path
                          fillRule='evenodd'
                          d='M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z'
                          clipRule='evenodd'
                        />
                      </svg>
                    </div>
                    <span className='font-medium text-blue-800'>Understands natural language</span>
                  </li>
                  <li className='flex'>
                    <div className='mr-3 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-emerald-500'>
                      <svg className='h-3 w-3 text-white' fill='currentColor' viewBox='0 0 20 20'>
                        <path
                          fillRule='evenodd'
                          d='M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z'
                          clipRule='evenodd'
                        />
                      </svg>
                    </div>
                    <span className='font-medium text-blue-800'>Learns from past executions</span>
                  </li>
                </ul>
              </div>

              <div className='w-full md:w-1/2'>
                {/* Prompt Input UI */}
                <div className='rounded-xl border border-white/20 bg-white/80 p-8 backdrop-blur-sm'>
                  <div className='mb-6 rounded-xl border border-blue-100/50 bg-gradient-to-r from-blue-50 to-indigo-50 p-5'>
                    <p className='text-md text-slate-700 italic'>
                      "I need to onboard five new enterprise clients this week, set up their accounts, conduct initial training sessions, and document their
                      requirements for our CS team. I also need to handle urgent support requests from existing clients."
                    </p>
                  </div>
                  <button className='w-full rounded-lg bg-blue-500 px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-blue-600'>
                    <span className='flex items-center justify-center'>
                      <svg xmlns='http://www.w3.org/2000/svg' className='mr-2 h-4 w-4' fill='none' viewBox='0 0 24 24' stroke='currentColor'>
                        <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M13 10V3L4 14h7v7l9-11h-7z' />
                      </svg>
                      Generate My Weekly Plan
                    </span>
                  </button>
                </div>
              </div>
            </div>

            {/* Step 2: Weekly Schedule - Text Left, UI Right */}
            <div className='flex flex-col items-center md:flex-row md:gap-16'>
              <div className='w-full md:w-1/2'>
                <div className='mb-4 flex items-center'>
                  <div className='mr-4 flex h-10 w-10 items-center justify-center rounded-full bg-blue-500 font-bold text-white'>2</div>
                  <h3 className='text-2xl font-bold text-blue-700'>AI-Generated Schedule</h3>
                </div>
                <p className='mb-6 text-lg font-light text-blue-600'>
                  Get a <span className='bg-gradient-to-r from-blue-500 to-purple-600 bg-clip-text font-bold text-transparent'>time-boxed plan</span> with
                  built-in adaptability that{' '}
                  <span className='bg-gradient-to-r from-purple-500 to-blue-600 bg-clip-text font-bold text-transparent'>
                    evolves with your changing priorities
                  </span>
                  .
                </p>
                <ul className='space-y-3'>
                  <li className='flex'>
                    <div className='mr-3 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-emerald-500'>
                      <svg className='h-3 w-3 text-white' fill='currentColor' viewBox='0 0 20 20'>
                        <path
                          fillRule='evenodd'
                          d='M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z'
                          clipRule='evenodd'
                        />
                      </svg>
                    </div>
                    <span className='font-medium text-blue-800'>Adapts to changing priorities</span>
                  </li>
                  <li className='flex'>
                    <div className='mr-3 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-emerald-500'>
                      <svg className='h-3 w-3 text-white' fill='currentColor' viewBox='0 0 20 20'>
                        <path
                          fillRule='evenodd'
                          d='M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z'
                          clipRule='evenodd'
                        />
                      </svg>
                    </div>
                    <span className='font-medium text-blue-800'>Respects your calendar</span>
                  </li>
                  <li className='flex'>
                    <div className='mr-3 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-emerald-500'>
                      <svg className='h-3 w-3 text-white' fill='currentColor' viewBox='0 0 20 20'>
                        <path
                          fillRule='evenodd'
                          d='M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z'
                          clipRule='evenodd'
                        />
                      </svg>
                    </div>
                    <span className='font-medium text-blue-800'>Adjusts to workload changes</span>
                  </li>
                </ul>
              </div>

              <div className='w-full md:w-1/2'>
                {/* Weekly Schedule UI - Google Maps-like */}
                <div className='rounded-xl border border-white/20 bg-white/80 p-8 backdrop-blur-sm'>
                  {/* Simple header */}
                  <div className='mb-6 flex items-center justify-between'>
                    <div className='text-lg font-semibold text-blue-700'>Weekly Route</div>
                    <span className='inline-flex items-center rounded-full bg-blue-500/90 px-2.5 py-1 text-xs text-white'>Apr 23-27</span>
                  </div>

                  {/* Weekly "Route" - Similar to Google Maps Route View */}
                  <div className='space-y-4'>
                    {/* Monday - Completed */}
                    <div className='flex'>
                      <div className='mr-4 flex flex-col items-center'>
                        <div className='flex h-8 w-8 items-center justify-center rounded-full bg-emerald-500 text-white'>
                          <span className='text-xs font-medium'>M</span>
                        </div>
                        <div className='h-12 w-0.5 bg-blue-200'></div>
                      </div>

                      <div className='flex-1'>
                        <div className='rounded-lg border border-slate-100 bg-white/80 p-4 shadow-sm transition-all hover:shadow-md'>
                          <div className='mb-2 flex items-center'>
                            <span className='text-sm font-medium text-slate-700'>Monday, April 23</span>
                            <span className='ml-auto rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-700'>Completed</span>
                          </div>
                          <div className='flex items-center rounded-md border-l-4 border-blue-400 bg-slate-50 p-2.5'>
                            <div className='flex-1'>
                              <div className='flex items-center justify-between'>
                                <span className='text-sm font-medium text-slate-700'>Client Onboarding - Acme Inc.</span>
                                <span className='text-xs text-slate-500'>9:00 - 11:00</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Tuesday - Completed */}
                    <div className='flex'>
                      <div className='mr-4 flex flex-col items-center'>
                        <div className='flex h-8 w-8 items-center justify-center rounded-full bg-emerald-500 text-white'>
                          <span className='text-xs font-medium'>T</span>
                        </div>
                        <div className='h-12 w-0.5 bg-blue-200'></div>
                      </div>

                      <div className='flex-1'>
                        <div className='rounded-lg border border-slate-100 bg-white/80 p-4 shadow-sm transition-all hover:shadow-md'>
                          <div className='mb-2 flex items-center'>
                            <span className='text-sm font-medium text-slate-700'>Tuesday, April 24</span>
                            <span className='ml-auto rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-700'>Completed</span>
                          </div>
                          <div className='flex items-center rounded-md border-l-4 border-blue-400 bg-slate-50 p-2.5'>
                            <div className='flex-1'>
                              <div className='flex items-center justify-between'>
                                <span className='text-sm font-medium text-slate-700'>Client Training - TechCorp</span>
                                <span className='text-xs text-slate-500'>10:00 - 12:00</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Wednesday - Active */}
                    <div className='flex'>
                      <div className='mr-4 flex flex-col items-center'>
                        <div className='flex h-8 w-8 items-center justify-center rounded-full bg-blue-500 text-white ring-4 ring-blue-100'>
                          <span className='text-xs font-medium'>W</span>
                        </div>
                        <div className='h-12 w-0.5 bg-slate-200'></div>
                      </div>

                      <div className='flex-1'>
                        <div className='rounded-lg border-2 border-blue-300 bg-white/80 p-4 shadow-md'>
                          <div className='mb-2 flex items-center'>
                            <span className='text-sm font-medium text-blue-700'>Wednesday, April 25</span>
                            <span className='ml-auto rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-medium text-amber-700'>
                              <span className='flex items-center'>
                                <span className='mr-1 flex h-2 w-2 rounded-full bg-amber-500'></span>
                                In Progress
                              </span>
                            </span>
                          </div>
                          <div className='space-y-2'>
                            <div className='flex items-center rounded-md border border-l-4 border-slate-100 border-l-emerald-400 bg-white/80 p-3'>
                              <div className='flex-1'>
                                <div className='flex items-center justify-between'>
                                  <span className='text-sm font-medium text-slate-700'>Support Ticket Resolution</span>
                                  <span className='text-xs text-slate-500'>9:00 - 12:00</span>
                                </div>
                                <div className='mt-1'>
                                  <span className='text-xs text-emerald-600'>Completed</span>
                                </div>
                              </div>
                            </div>
                            <div className='flex items-center rounded-md border border-l-4 border-blue-200 border-l-blue-500 bg-blue-50 p-3'>
                              <div className='mr-2 flex h-6 w-6 items-center justify-center rounded-full bg-blue-100 text-blue-600'>
                                <svg xmlns='http://www.w3.org/2000/svg' className='h-3 w-3' fill='none' viewBox='0 0 24 24' stroke='currentColor'>
                                  <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M9 5l7 7-7 7' />
                                </svg>
                              </div>
                              <div className='flex-1'>
                                <div className='flex items-center justify-between'>
                                  <span className='text-sm font-medium text-blue-700'>Client Onboarding - GlobalTech</span>
                                  <span className='text-xs text-blue-600'>2:00 - 5:00</span>
                                </div>
                                <div className='mt-1 flex items-center'>
                                  <div className='mr-2 h-1.5 w-24 rounded-full bg-blue-100'>
                                    <div className='h-full rounded-full bg-blue-500' style={{ width: '40%' }}></div>
                                  </div>
                                  <span className='text-xs text-blue-600'>Step 2 of 5</span>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Thursday & Friday - Upcoming */}
                    <div className='flex'>
                      <div className='mr-4 flex flex-col items-center'>
                        <div className='flex h-8 w-8 items-center justify-center rounded-full bg-slate-200 text-slate-700'>
                          <span className='text-xs font-medium'>T+</span>
                        </div>
                      </div>

                      <div className='flex-1'>
                        <div className='rounded-lg border border-slate-100 bg-white/80 p-4 opacity-80 shadow-sm'>
                          <div className='mb-2 flex items-center'>
                            <span className='text-sm font-medium text-slate-700'>Thu-Fri, Apr 26-27</span>
                            <span className='ml-auto rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-700'>Upcoming</span>
                          </div>
                          <div className='space-y-2'>
                            <div className='flex items-center rounded-md border-l-4 border-purple-400 bg-slate-50 p-2.5'>
                              <div className='flex-1'>
                                <div className='flex items-center justify-between'>
                                  <span className='text-sm font-medium text-slate-700'>Client Requirements Documentation</span>
                                  <span className='text-xs text-slate-500'>Thu 9:00 - 11:00</span>
                                </div>
                              </div>
                            </div>
                            <div className='flex items-center rounded-md border-l-4 border-blue-400 bg-slate-50 p-2.5'>
                              <div className='flex-1'>
                                <div className='flex items-center justify-between'>
                                  <span className='text-sm font-medium text-slate-700'>Customer Success Handoff Meeting</span>
                                  <span className='text-xs text-slate-500'>Fri 10:00 - 12:00</span>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            {/* Step 3: Execution - Text Left, UI Right */}
            <div className='flex flex-col items-center gap-12 md:flex-row md:gap-16'>
              <div className='w-full md:w-1/2'>
                <div className='mb-4 flex items-center'>
                  <div className='mr-4 flex h-10 w-10 items-center justify-center rounded-full bg-blue-500 font-bold text-white'>3</div>
                  <h3 className='text-2xl font-bold text-blue-700'>Step-by-Step Execution</h3>
                </div>
                <p className='mb-6 text-lg font-light text-blue-600'>
                  Follow <span className='bg-gradient-to-r from-blue-500 to-purple-600 bg-clip-text font-bold text-transparent'>guided execution</span> with
                  automatic documentation to ensure{' '}
                  <span className='bg-gradient-to-r from-purple-500 to-blue-600 bg-clip-text font-bold text-transparent'>SOP compliance</span> at every step.
                </p>
                <ul className='space-y-3'>
                  <li className='flex'>
                    <div className='mr-3 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-emerald-500'>
                      <svg className='h-3 w-3 text-white' fill='currentColor' viewBox='0 0 20 20'>
                        <path
                          fillRule='evenodd'
                          d='M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z'
                          clipRule='evenodd'
                        />
                      </svg>
                    </div>
                    <span className='font-medium text-blue-800'>AI guidance at each step</span>
                  </li>
                  <li className='flex'>
                    <div className='mr-3 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-emerald-500'>
                      <svg className='h-3 w-3 text-white' fill='currentColor' viewBox='0 0 20 20'>
                        <path
                          fillRule='evenodd'
                          d='M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z'
                          clipRule='evenodd'
                        />
                      </svg>
                    </div>
                    <span className='font-medium text-blue-800'>Automatic documentation</span>
                  </li>
                  <li className='flex'>
                    <div className='mr-3 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-emerald-500'>
                      <svg className='h-3 w-3 text-white' fill='currentColor' viewBox='0 0 20 20'>
                        <path
                          fillRule='evenodd'
                          d='M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z'
                          clipRule='evenodd'
                        />
                      </svg>
                    </div>
                    <span className='font-medium text-blue-800'>Clear progress tracking</span>
                  </li>
                </ul>
              </div>

              <div className='w-full md:w-1/2'>
                {/* Step-by-Step Execution UI using ProcessProgress component */}
                <div className='rounded-xl border border-white/20 bg-white/80 p-8 backdrop-blur-sm'>
                  <ProcessProgress
                    title='Client Onboarding Process'
                    steps={[
                      {
                        id: 'step1',
                        content: 'Initial Account Setup',
                        completed: true,
                        subSteps: [
                          { id: 'sub1', content: 'Create account in system', completed: true },
                          { id: 'sub2', content: 'Set up user permissions', completed: true },
                        ],
                      },
                      {
                        id: 'step2',
                        content: 'Product Configuration',
                        completed: false,
                        subSteps: [
                          { id: 'sub3', content: 'Configure basic settings', completed: true },
                          { id: 'sub4', content: 'Set up integration points', completed: false },
                        ],
                      },
                      {
                        id: 'step3',
                        content: 'Training & Handoff',
                        completed: false,
                        subSteps: [
                          { id: 'sub5', content: 'Conduct admin training', completed: false },
                          { id: 'sub6', content: 'Document customer requirements', completed: false },
                        ],
                      },
                    ]}
                    onStepChange={(stepId, completed) => {}}
                    onSubStepChange={(stepId, subStepId, completed) => {}}
                    status='In Progress'
                    onStatusChange={(status) => {}}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Weekly Planner - Sleek & Modern Horizontal Layout */}
      <section className='relative z-10 bg-gradient-to-b from-white to-blue-50 py-16 md:py-24'>
        <div className='mx-auto max-w-6xl px-4 md:px-8'>
          <h2 className='mb-4 text-center text-3xl font-bold text-blue-700 md:text-4xl'>Integrated Weekly Planning</h2>
          <p className='mx-auto mb-12 max-w-2xl text-center text-lg text-blue-600/80'>
            <span className='bg-gradient-to-r from-blue-500 to-purple-600 bg-clip-text font-bold text-transparent'>Clear schedules</span> with{' '}
            <span className='bg-gradient-to-r from-purple-500 to-blue-600 bg-clip-text font-bold text-transparent'>real-time tracking</span> of tasks and
            milestones
          </p>

          {/* Modern Monday-Friday Planner */}
          <div className='relative mb-12 overflow-hidden rounded-xl bg-white p-6 shadow-lg md:p-8'>
            {/* Decorative elements */}
            <div className='absolute top-0 right-0 h-32 w-32 translate-x-1/2 -translate-y-1/2 rounded-full bg-blue-50 opacity-50'></div>
            <div className='absolute bottom-0 left-0 h-24 w-24 -translate-x-1/2 translate-y-1/2 rounded-full bg-blue-50 opacity-50'></div>

            {/* Weekday Cards */}
            <div className='grid grid-cols-5 gap-3 md:gap-4'>
              {/* Monday */}
              <div className='flex flex-col overflow-hidden rounded-lg border border-slate-100 bg-gradient-to-br from-slate-50 to-white shadow-sm transition-all hover:shadow-md'>
                <div className='border-b border-slate-100 bg-slate-50/50 p-3'>
                  <div className='flex items-center justify-between'>
                    <h4 className='font-medium text-slate-700'>Monday</h4>
                    <span className='rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700'>80%</span>
                  </div>
                </div>
                <div className='p-3'>
                  <div className='space-y-2'>
                    <div className='flex items-center space-x-2'>
                      <div className='h-3 w-3 rounded-full bg-green-500'></div>
                      <span className='truncate text-xs text-slate-600'>Acme Inc. Onboarding</span>
                    </div>
                    <div className='flex items-center space-x-2'>
                      <div className='h-3 w-3 rounded-full bg-green-500'></div>
                      <span className='truncate text-xs text-slate-600'>Support Ticket #235</span>
                    </div>
                    <div className='flex items-center space-x-2'>
                      <div className='h-3 w-3 rounded-full bg-orange-500'></div>
                      <span className='truncate text-xs text-slate-600'>Enterprise Setup</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Tuesday */}
              <div className='flex flex-col overflow-hidden rounded-lg border border-slate-100 bg-gradient-to-br from-slate-50 to-white shadow-sm transition-all hover:shadow-md'>
                <div className='border-b border-slate-100 bg-slate-50/50 p-3'>
                  <div className='flex items-center justify-between'>
                    <h4 className='font-medium text-slate-700'>Tuesday</h4>
                    <span className='rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700'>90%</span>
                  </div>
                </div>
                <div className='p-3'>
                  <div className='space-y-2'>
                    <div className='flex items-center space-x-2'>
                      <div className='h-3 w-3 rounded-full bg-green-500'></div>
                      <span className='truncate text-xs text-slate-600'>TechCorp Training</span>
                    </div>
                    <div className='flex items-center space-x-2'>
                      <div className='h-3 w-3 rounded-full bg-green-500'></div>
                      <span className='truncate text-xs text-slate-600'>Support Call</span>
                    </div>
                    <div className='flex items-center space-x-2'>
                      <div className='h-3 w-3 rounded-full bg-green-500'></div>
                      <span className='truncate text-xs text-slate-600'>Account Setup</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Wednesday - Active Day */}
              <div className='flex transform flex-col overflow-hidden rounded-lg border border-blue-200 bg-gradient-to-br from-blue-50 to-white shadow-md transition-all hover:shadow-lg'>
                <div className='border-b border-blue-100 bg-blue-50 p-3'>
                  <div className='flex items-center justify-between'>
                    <h4 className='font-medium text-blue-700'>Wednesday</h4>
                    <span className='rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-700'>50%</span>
                  </div>
                </div>
                <div className='p-3'>
                  <div className='space-y-2'>
                    <div className='flex items-center space-x-2'>
                      <div className='h-3 w-3 rounded-full bg-green-500'></div>
                      <span className='truncate text-xs text-slate-600'>Support Tickets</span>
                    </div>
                    <div className='flex items-center space-x-2'>
                      <div className='h-3 w-3 rounded-full bg-orange-500'></div>
                      <span className='truncate text-xs text-slate-600'>GlobalTech Onboarding</span>
                    </div>
                    <div className='flex items-center space-x-2'>
                      <div className='h-3 w-3 rounded-full bg-slate-200'></div>
                      <span className='truncate text-xs text-slate-400'>CS Team Meeting</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Thursday */}
              <div className='flex flex-col overflow-hidden rounded-lg border border-slate-100 bg-gradient-to-br from-slate-50 to-white shadow-sm transition-all hover:shadow-md'>
                <div className='border-b border-slate-100 bg-slate-50/50 p-3'>
                  <div className='flex items-center justify-between'>
                    <h4 className='font-medium text-slate-700'>Thursday</h4>
                    <span className='rounded-full bg-orange-100 px-2 py-0.5 text-xs font-medium text-orange-700'>25%</span>
                  </div>
                </div>
                <div className='p-3'>
                  <div className='space-y-2'>
                    <div className='flex items-center space-x-2'>
                      <div className='h-3 w-3 rounded-full bg-green-500'></div>
                      <span className='truncate text-xs text-slate-600'>Client Documentation</span>
                    </div>
                    <div className='flex items-center space-x-2'>
                      <div className='h-3 w-3 rounded-full bg-orange-500'></div>
                      <span className='truncate text-xs text-slate-600'>NextWave Onboarding</span>
                    </div>
                    <div className='flex items-center space-x-2'>
                      <div className='h-3 w-3 rounded-full bg-slate-200'></div>
                      <span className='truncate text-xs text-slate-400'>Support Call</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Friday */}
              <div className='flex flex-col overflow-hidden rounded-lg border border-slate-100 bg-gradient-to-br from-slate-50 to-white shadow-sm transition-all hover:shadow-md'>
                <div className='border-b border-slate-100 bg-slate-50/50 p-3'>
                  <div className='flex items-center justify-between'>
                    <h4 className='font-medium text-slate-700'>Friday</h4>
                    <span className='rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-700'>10%</span>
                  </div>
                </div>
                <div className='p-3'>
                  <div className='space-y-2'>
                    <div className='flex items-center space-x-2'>
                      <div className='h-3 w-3 rounded-full bg-orange-500'></div>
                      <span className='truncate text-xs text-slate-600'>CS Handoff Meeting</span>
                    </div>
                    <div className='flex items-center space-x-2'>
                      <div className='h-3 w-3 rounded-full bg-slate-200'></div>
                      <span className='truncate text-xs text-slate-400'>Finalize Documentation</span>
                    </div>
                    <div className='flex items-center space-x-2'>
                      <div className='h-3 w-3 rounded-full bg-slate-200'></div>
                      <span className='truncate text-xs text-slate-400'>Client Review Call</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Weekly Progress Bar */}
            <div className='mt-8 px-1'>
              <div className='h-1 w-full overflow-hidden rounded-full bg-slate-100'>
                <div className='h-full rounded-full bg-gradient-to-r from-blue-400 to-blue-600' style={{ width: '51%' }}></div>
              </div>
              <div className='mt-4 flex justify-between text-xs text-slate-500'>
                <span>Monday</span>
                <span>Tuesday</span>
                <span>Wednesday</span>
                <span>Thursday</span>
                <span>Friday</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className='relative z-10 overflow-hidden bg-gradient-to-r from-blue-600 to-purple-700 py-20 text-white'>
        {/* Background decorative elements */}
        <div className='absolute inset-0 opacity-20'>
          <div className='absolute top-10 left-10 h-[30vh] w-[30vw] rounded-full bg-white/80 blur-3xl'></div>
          <div className='absolute right-10 bottom-0 h-[20vh] w-[20vh] rounded-full bg-white/80 blur-3xl'></div>
          <div className='absolute right-1/4 bottom-1/3 h-[25vh] w-[25vw] rounded-full bg-purple-300 opacity-40 blur-3xl'></div>
        </div>

        <div className='relative z-10 mx-auto max-w-4xl px-4 text-center md:px-8'>
          <h2 className='mb-5 text-3xl font-bold md:text-4xl lg:text-5xl'>
            <span className='bg-gradient-to-r from-blue-200 to-white bg-clip-text text-transparent'>Master Process Planning</span>
          </h2>
          <p className='mb-10 text-lg opacity-90 md:text-xl lg:text-2xl'>
            <span className='bg-gradient-to-r from-blue-200 via-purple-200 to-blue-200 bg-clip-text font-bold text-transparent'>Simplify workflows</span>,{' '}
            <span className='bg-gradient-to-r from-purple-200 to-white bg-clip-text font-bold text-transparent'>drive adherence</span>, and{' '}
            <span className='bg-gradient-to-br from-white to-blue-200 bg-clip-text font-bold text-transparent'>track progress</span>
          </p>

          <button
            onClick={() => window.open('https://calendly.com/jasonyu0100/15min', '_blank')}
            className='rounded-full bg-white/80 px-10 py-5 text-xl font-bold text-blue-700 shadow-lg transition-all hover:bg-blue-50'
          >
            Book a Demo
            <span className='ml-2'>→</span>
          </button>
          <p className='mt-4 text-sm font-medium opacity-90'>Complete SOP implementation in as little as 14 days.</p>
        </div>
      </section>

      {/* Footer */}
      <footer className='relative z-10 border-t border-slate-700/20 bg-slate-800/90 p-6 md:p-8'>
        <div className='mx-auto max-w-4xl'>
          <div className='mb-6 flex flex-col items-center justify-between gap-6 md:flex-row'>
            <div className='flex flex-col items-center md:items-start'>
              <Logo size='sm' theme='white' iconStyle='gradient' className='mb-2' />
              <p className='text-center text-xs text-white/80 md:text-left'>AI-powered process planning that turns SOPs into actionable workflows</p>
            </div>
          </div>

          <div className='flex flex-col items-center justify-between border-t border-white/10 pt-4 md:flex-row'>
            <p className='mb-3 text-xs text-white/60 md:mb-0'>© 2025 convers.me. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
