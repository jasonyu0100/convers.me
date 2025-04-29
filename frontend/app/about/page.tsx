'use client';

import { Logo } from '@/app/components/ui/logo';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';
import { useRouter } from 'next/navigation';

export default function AboutPage() {
  const router = useRouter();

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
      <header className='sticky top-4 z-20 flex items-center justify-between px-6 py-3 md:px-8'>
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

      {/* Blog Content - blog style with more text focus */}
      <main className='relative mx-auto max-w-4xl px-6 py-12 md:px-8 md:py-16'>
        <article className='prose prose-lg mx-auto rounded-lg border border-blue-200 bg-white/80 p-6 shadow-lg backdrop-blur-md md:p-8'>
          {/* Article Header */}
          <header className='mb-10 text-center'>
            <h1 className='mb-4 text-4xl leading-tight font-bold text-blue-700 md:text-5xl'>Introducing Convers.me: Intelligent Process Planning</h1>

            <div className='mb-5 flex flex-wrap items-center justify-center gap-3 text-blue-600/80'>
              <span className='text-sm'>April 2025</span>
              <span className='text-sm'>|</span>
              <span className='text-sm'>5 min read</span>
            </div>

            <p className='mx-auto max-w-3xl text-xl leading-relaxed font-medium text-blue-700'>
              How I'm transforming standard operating procedures into an AI-powered planning system that improves adherence and accelerates process completion.
            </p>
          </header>

          {/* Introduction */}
          <div className='mb-10'>
            <p className='text-lg leading-relaxed text-slate-700'>
              Organizations struggle with a common problem: standard operating procedures (SOPs) often fail in execution. These static documents become
              disconnected from operational realities, leading to compliance risks, inefficiencies, and inconsistent outcomes.
            </p>

            <p className='text-lg leading-relaxed text-slate-700'>
              <span className='font-semibold text-blue-700'>Convers.me</span> brings artificial intelligence to SOP execution, transforming static procedures
              into dynamic planning systems that adapt to changing conditions while maintaining compliance.
            </p>
          </div>

          {/* The Problem */}
          <section className='mb-10'>
            <h2 className='mb-4 text-3xl font-bold text-blue-700'>The Problem with Traditional SOPs</h2>

            <p className='mb-4 text-lg leading-relaxed text-slate-700'>Traditional SOPs fail in three critical ways:</p>

            <h3 className='mb-2 text-xl font-semibold text-blue-700'>Lack of Adherence</h3>
            <p className='mb-5 text-lg leading-relaxed text-slate-700'>
              Operators deviate from SOPs due to workflow complexity or changing conditions, creating compliance risks and inconsistent outcomes. In regulated
              industries, this can lead to penalties and safety issues.
            </p>

            <h3 className='mb-2 text-xl font-semibold text-blue-700'>Execution Inefficiency</h3>
            <p className='mb-5 text-lg leading-relaxed text-slate-700'>
              Complex processes cause cognitive overload, with operators spending time navigating procedures rather than executing work. This leads to
              productivity loss and increased errors.
            </p>

            <h3 className='mb-2 text-xl font-semibold text-blue-700'>Lack of Adaptability</h3>
            <p className='mb-5 text-lg leading-relaxed text-slate-700'>
              Static SOPs can't adapt to changing conditions. Organizations must choose between standardization and flexibility, forcing operators to either
              follow irrelevant procedures or improvise without guidance.
            </p>
          </section>

          {/* The Solution */}
          <section className='mb-10'>
            <h2 className='mb-4 text-3xl font-bold text-blue-700'>A New Approach: Intelligent Process Planning</h2>

            <p className='mb-5 text-lg leading-relaxed text-slate-700'>
              Convers.me bridges the gap between rigid documentation and operational reality through a four-part integrated approach:
            </p>

            <h3 className='mb-2 text-xl font-semibold text-blue-700'>1. Process Intelligence</h3>
            <p className='mb-5 text-lg leading-relaxed text-slate-700'>
              Using NLP, Convers.me creates a semantic understanding of your processes, recognizing intent behind steps and connecting related processes.
            </p>

            <h3 className='mb-2 text-xl font-semibold text-blue-700'>2. Prompt-Based Planning</h3>
            <p className='mb-5 text-lg leading-relaxed text-slate-700'>
              Describe what you need to accomplish, and the system generates an optimized schedule with time-boxed activities that align with SOPs while
              adapting to context.
            </p>

            <h3 className='mb-2 text-xl font-semibold text-blue-700'>3. Time-Boxed Execution</h3>
            <p className='mb-5 text-lg leading-relaxed text-slate-700'>
              Navigate your work week with real-time guidance and completion tracking, reducing friction between planning and execution.
            </p>

            <h3 className='mb-2 text-xl font-semibold text-blue-700'>4. Performance Insights</h3>
            <p className='mb-5 text-lg leading-relaxed text-slate-700'>
              Continuous data analysis identifies patterns and generates actionable insights, enabling refinement of processes and execution methods.
            </p>

            <p className='text-lg leading-relaxed text-slate-700'>
              The result: improved adherence, faster completion times, and better resource utilization while balancing structure and flexibility.
            </p>
          </section>

          {/* The Way Forward */}
          <section className='mb-10'>
            <h2 className='mb-4 text-3xl font-bold text-blue-700'>The Way Forward</h2>

            <p className='mb-4 text-lg leading-relaxed text-slate-700'>
              Organizations shouldn't have to choose between standardization and adaptability. By bringing AI to process execution, we create systems that
              provide structure while embracing operational complexity.
            </p>

            <p className='mb-4 text-lg leading-relaxed text-slate-700'>
              Convers.me creates intelligence at the execution point where operators make the countless small decisions that determine organizational
              performance.
            </p>

            <p className='text-lg leading-relaxed text-slate-700'>Ready to transform your operations through intelligent process planning? Let's connect.</p>
          </section>

          {/* Final CTA */}
          <section className='mb-5 rounded-lg border border-blue-200 bg-blue-50 p-5 text-center'>
            <p className='mb-4 text-lg font-medium text-blue-700'>Interested in seeing how intelligent process planning could work for your organization?</p>

            <button
              onClick={() => window.open('https://calendly.com/jasonyu0100/15min', '_blank')}
              className='rounded-full bg-gradient-to-r from-blue-500 to-blue-700 px-6 py-2 text-base font-bold text-white shadow-md transition-all hover:from-blue-600 hover:to-blue-800'
            >
              Schedule a Demo
            </button>
          </section>

          {/* Author bio */}
          <div className='flex items-center border-t border-blue-100 pt-5'>
            <div className='flex-shrink-0'>
              <img src='/blog/jason.png' alt='Jason Yu' className='h-12 w-12 rounded-full object-cover' />
            </div>
            <div className='ml-4'>
              <p className='text-sm font-medium text-blue-700'>Jason Yu</p>
              <p className='text-sm text-slate-600'>Convers.me Founder</p>
            </div>
          </div>
        </article>
      </main>

      {/* Footer - simplified */}
      <footer className='relative z-10 border-t border-slate-700/30 bg-slate-800/80 p-6 backdrop-blur-lg backdrop-saturate-150'>
        <div className='pointer-events-none absolute inset-0 bg-[linear-gradient(135deg,rgba(59,130,246,0.2)_0%,rgba(59,130,246,0.05)_100%)] opacity-40'></div>

        <div className='mx-auto flex max-w-4xl flex-col items-center justify-between space-y-4 px-4 md:flex-row md:space-y-0'>
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
