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
            <h1 className='mb-4 text-4xl leading-tight font-bold text-blue-700 md:text-5xl'>Automation with a Human Touch</h1>

            <div className='mb-5 flex flex-wrap items-center justify-center gap-3 text-blue-600/80'>
              <span className='text-sm'>May 2025</span>
              <span className='text-sm'>|</span>
              <span className='text-sm'>3 min read</span>
              <span className='rounded-full bg-purple-100 px-3 py-0.5 text-xs font-medium text-purple-700'>Just Launched: Scheduled Automations</span>
            </div>

            <p className='mx-auto max-w-3xl text-xl leading-relaxed font-medium text-blue-700'>
              My journey to create an AI assistant that makes work feel less like following a manual and more like having a brilliant colleague by your side.
            </p>
          </header>

          <img src='/demo/presentation.png' alt='convers.me Presentation' className='mb-10 w-full rounded-lg shadow-md' />

          {/* Introduction */}
          <div className='mb-10'>
            <p className='text-lg leading-relaxed text-slate-700'>
              While watching a colleague struggle through a 47-page SOP manual to onboard a client, I had a realization: there has to be a better way. That's
              when <span className='font-semibold text-blue-700'>convers.me</span> was born — to bring human-like intelligence to process execution,
              transforming rigid procedures into adaptive guides that help people work better, not just by the book.
            </p>
          </div>

          {/* The Problem */}
          <section className='mb-10'>
            <h2 className='mb-4 text-3xl font-bold text-blue-700'>Challenges with Traditional SOPs</h2>

            <p className='mb-4 text-lg leading-relaxed text-slate-700'>
              Traditional procedures fail in three critical ways: people rarely follow them exactly as written (causing compliance risks); they create mental
              overload with users spending up to 40% of their time just navigating documentation instead of doing actual work; and they simply can't adapt to
              changing conditions, forcing an impossible choice between following irrelevant steps or improvising without guidance.
            </p>
          </section>

          {/* The Solution */}
          <section className='mb-10'>
            <h2 className='mb-4 text-3xl font-bold text-blue-700'>Our Approach: Intelligent Process Assistance</h2>

            <p className='mb-5 text-lg leading-relaxed text-slate-700'>
              I wanted to create something that feels less like following a manual and more like having a really smart colleague guiding you through your day.
              Here's how convers.me works:
            </p>

            <h3 className='mb-2 text-xl font-semibold text-blue-700'>1. It Actually Understands Your Work</h3>
            <p className='mb-5 text-lg leading-relaxed text-slate-700'>
              Our AI doesn't just read your procedures - it actually understands them. It recognizes the intent behind each step, connects related processes,
              and builds a mental model of your workflows that mirrors how humans think about their work.
            </p>

            <h3 className='mb-2 text-xl font-semibold text-blue-700'>2. Just Tell It What You Need</h3>
            <p className='mb-5 text-lg leading-relaxed text-slate-700'>
              Imagine telling a colleague, "I need to onboard five clients this week while handling support requests," and they hand you a perfectly organized
              schedule. That's exactly what convers.me does - you describe your goals in plain language, and it builds your optimal week.
            </p>

            <h3 className='mb-2 text-xl font-semibold text-blue-700'>3. GPS for Your Workday</h3>
            <p className='mb-5 text-lg leading-relaxed text-slate-700'>
              Remember how GPS changed driving? You don't think about the route - you just follow the turn-by-turn directions and arrive at your destination.
              convers.me brings that same experience to your work, guiding you through complex processes step-by-step, with real-time updates if things change.
            </p>

            <h3 className='mb-2 text-xl font-semibold text-blue-700'>4. A Coach That Makes You Better</h3>
            <p className='mb-5 text-lg leading-relaxed text-slate-700'>
              The system continuously analyzes how you work and offers insights to help you improve. It's like having a coach who watches your performance and
              gives you actionable tips to get better every day.
            </p>

            <p className='text-lg leading-relaxed text-slate-700'>
              Our early users report 65% faster process completion, 4.5x higher SOP adherence, and reclaiming about 8 hours a week previously lost to procedure
              navigation. But what they tell me they love most is just feeling less stressed about their work.
            </p>
          </section>

          {/* The Way Forward */}
          <section className='mb-10'>
            <h2 className='mb-4 text-3xl font-bold text-blue-700'>New Feature: Browser Automation</h2>

            <p className='mb-4 text-lg leading-relaxed text-slate-700'>
              I'm incredibly excited to announce our newest feature that pushes the boundaries of what's possible:{' '}
              <span className='font-semibold text-purple-700'>Browser Automation</span>. This has been our most requested capability, and we've spent months
              making it a reality.
            </p>

            <p className='mb-4 text-lg leading-relaxed text-slate-700'>
              Imagine having an intelligent assistant that can perform complex web-based tasks for you - the kind that usually require careful attention and
              multiple steps. Our new browser automation tool does exactly that, with a twist: it doesn't just blindly follow scripts. It makes intelligent
              decisions based on what it sees on the page, much like a human operator would.
            </p>

            <p className='mb-4 text-lg leading-relaxed text-slate-700'>
              For teams managing customer onboarding, data entry, or any structured web operations, this is a game-changer. Set up the workflow once, and then
              let the system execute it perfectly every time - whether that's at 3 PM or 3 AM.
            </p>

            <p className='mb-4 text-lg leading-relaxed text-slate-700'>
              In our early testing, users were able to automate up to 70% of their routine browser-based tasks, freeing up incredible amounts of time for the
              creative, high-value work that actually requires human intelligence.
            </p>

            <p className='text-lg leading-relaxed text-slate-700'>
              We're offering limited access to this powerful new feature through our Pilot program. I'd love to show you how it works.
            </p>
          </section>

          {/* Final CTA */}
          <section className='mb-5 rounded-lg border border-purple-200 bg-gradient-to-r from-purple-50 to-indigo-50 p-6 text-center'>
            <div className='mb-2 inline-block rounded-full bg-purple-100 px-3 py-1 text-sm font-semibold text-purple-700'>LIMITED BETA ACCESS</div>
            <p className='mb-4 text-lg font-medium text-indigo-700'>Be among the first to experience our breakthrough browser automation technology</p>

            <div className='flex flex-col items-center justify-center space-y-3 sm:flex-row sm:space-y-0 sm:space-x-4'>
              <button
                onClick={() => router.push('/pilot')}
                className='w-full rounded-full bg-gradient-to-r from-purple-600 to-indigo-600 px-6 py-2.5 text-base font-bold text-white shadow-md transition-all hover:from-purple-700 hover:to-indigo-700 sm:w-auto'
              >
                Join the Pilot Program
              </button>

              <button
                onClick={() => window.open('https://calendly.com/jasonyu0100/15min', '_blank')}
                className='w-full rounded-full border border-indigo-200 bg-white px-6 py-2.5 text-base font-bold text-indigo-700 shadow-sm transition-all hover:bg-indigo-50 sm:w-auto'
              >
                Schedule a Demo
              </button>
            </div>
          </section>

          {/* Author bio */}
          <div className='flex flex-col items-start border-t border-blue-100 pt-5 sm:flex-row sm:items-center'>
            <div className='flex-shrink-0'>
              <img src='/blog/jason.png' alt='Jason Yu' className='h-16 w-16 rounded-full object-cover shadow-md' />
            </div>
            <div className='mt-4 ml-0 sm:mt-0 sm:ml-5'>
              <p className='text-base font-bold text-blue-700'>Jason Yu</p>
              <p className='text-sm text-slate-600'>Founder & CEO, convers.me</p>
              <p className='mt-2 text-sm text-slate-600 italic'>
                "I started convers.me because I believe the best tools don't replace human judgment - they enhance it. I'd love to hear your thoughts on how we
                can make work more intuitive."
              </p>
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
