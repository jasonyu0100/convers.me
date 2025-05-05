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
          <div className='absolute right-0 top-0 h-[45vh] w-[45vw] rounded-full bg-blue-200 blur-[100px]'></div>
          <div className='absolute bottom-0 left-0 h-[40vh] w-[40vw] rounded-full bg-blue-200 blur-[100px]'></div>
          <div className='absolute bottom-1/3 right-1/4 h-[30vh] w-[30vw] rounded-full bg-indigo-200 opacity-40 blur-[80px]'></div>
          <div className='absolute left-1/4 top-1/3 h-[20vh] w-[20vw] rounded-full bg-purple-200 opacity-30 blur-[60px]'></div>
        </div>
      </div>

      {/* Minimalist header */}
      <header className='sticky top-4 z-20 flex items-center justify-between px-6 py-3 md:px-8'>
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

      {/* Blog Content - blog style with more text focus */}
      <main className='relative mx-auto max-w-4xl px-6 py-12 md:px-8 md:py-16'>
        <article className='prose prose-lg mx-auto rounded-lg border border-blue-200 bg-white/80 p-6 shadow-lg backdrop-blur-md md:p-8'>
          {/* Article Header */}
          <header className='mb-10 text-center'>
            <h1 className='mb-4 font-bold text-4xl leading-tight text-blue-700 md:text-5xl'>Automation with a Human Touch</h1>

            <div className='mb-5 flex flex-wrap items-center justify-center gap-3 text-blue-600/80'>
              <span className='text-sm'>May 2025</span>
              <span className='text-sm'>|</span>
              <span className='text-sm'>3 min read</span>
              <span className='rounded-full bg-purple-100 px-3 py-0.5 font-medium text-xs text-purple-700'>Just Launched: Scheduled Automations</span>
            </div>

            <p className='mx-auto max-w-3xl font-medium text-xl leading-relaxed text-blue-700'>
              My journey to create an AI assistant that makes work feel less like following a manual and more like having a brilliant colleague by your side.
            </p>
          </header>

          <img src='/demo/presentation.png' alt='convers.me Presentation' className='mb-10 w-full rounded-lg shadow-md' />

          {/* Introduction */}
          <div className='mb-10'>
            <p className='text-lg leading-relaxed text-slate-700'>
              While watching a colleague navigate through 27 different browser tabs to complete a client onboarding workflow, I had a realization: there has to
              be a better way. That's when <span className='font-semibold text-blue-700'>convers.me</span> was born — to bring intelligent automation to complex
              browser workflows, transforming tedious multi-step processes into streamlined operations that help people work smarter, not harder.
            </p>
          </div>

          {/* The Problem */}
          <section className='mb-10'>
            <h2 className='mb-4 font-bold text-3xl text-blue-700'>Challenges with Traditional Processes</h2>

            <p className='mb-4 text-lg leading-relaxed text-slate-700'>
              Browser-based workflows fail in three critical ways: people waste enormous time switching between systems (with our research showing professionals
              managing up to 35 browser tabs simultaneously); they're prone to human error during repetitive data entry tasks (with error rates as high as 12%);
              and they typically require constant human attention for tasks that could be automated, forcing skilled professionals to spend hours on mechanical
              tasks instead of value-added work.
            </p>
          </section>

          {/* The Solution */}
          <section className='mb-10'>
            <h2 className='mb-4 font-bold text-3xl text-blue-700'>Our Approach: Intelligent Process Assistance</h2>

            <p className='mb-5 text-lg leading-relaxed text-slate-700'>
              I wanted to create something that feels less like following a manual and more like having a really smart colleague guiding you through your day.
              Here's how convers.me works:
            </p>

            <h3 className='mb-2 text-xl font-semibold text-blue-700'>1. It Observes and Learns Browser Patterns</h3>
            <p className='mb-5 text-lg leading-relaxed text-slate-700'>
              Our AI doesn't just follow scripts - it actually understands web interfaces. It recognizes UI elements, form structures, data relationships, and
              learns the logical flow of multi-step browser workflows the way a human expert would.
            </p>

            <h3 className='mb-2 text-xl font-semibold text-blue-700'>2. Automated Form Filling and Data Transfer</h3>
            <p className='mb-5 text-lg leading-relaxed text-slate-700'>
              Imagine you need to update 75 customer records across your CRM, billing system, and project management tool. Instead of copying and pasting for
              hours, convers.me automates the entire workflow - extracting, transforming, and inserting data across systems with perfect accuracy.
            </p>

            <h3 className='mb-2 text-xl font-semibold text-blue-700'>3. Parallel Browser Workflows</h3>
            <p className='mb-5 text-lg leading-relaxed text-slate-700'>
              What if you could run multiple browser workflows simultaneously? Our system can operate across multiple tabs and windows at once, handling complex
              sequences like data extraction, validation, transformation, and submission across different platforms simultaneously.
            </p>

            <h3 className='mb-2 text-xl font-semibold text-blue-700'>4. Adaptive Browser Intelligence</h3>
            <p className='mb-5 text-lg leading-relaxed text-slate-700'>
              The system handles exceptions intelligently. When a website changes its layout, shows an unexpected error, or requires special handling, our AI
              adapts in real-time - trying alternative approaches or notifying you only when human intervention is truly needed.
            </p>

            <p className='text-lg leading-relaxed text-slate-700'>
              Our early users report an 85% reduction in time spent on repetitive browser tasks, with one finance team automating over 230 hours of monthly data
              entry work. But what they tell me they love most is being able to focus on creative problem-solving while our AI handles the repetitive browser
              operations in the background.
            </p>
          </section>

          {/* The Way Forward */}
          <section className='mb-10'>
            <h2 className='mb-4 font-bold text-3xl text-blue-700'>New Feature: Intelligent Browser Workflows</h2>

            <p className='mb-4 text-lg leading-relaxed text-slate-700'>
              I'm incredibly excited to announce our newest feature that transforms how teams handle web operations:{' '}
              <span className='font-semibold text-purple-700'>Intelligent Browser Workflows</span>. This advanced capability can now automate even the most
              complex multi-system processes that previously required hours of focused human attention.
            </p>

            <p className='mb-4 text-lg leading-relaxed text-slate-700'>
              Imagine automating customer onboarding flows that span your CRM, billing system, support ticketing platform, and internal documentation tools. Our
              AI can navigate through all these systems, intelligently handling conditional logic (if this value exists, perform these actions), exception
              handling, and even connecting related information across platforms.
            </p>

            <p className='mb-4 text-lg leading-relaxed text-slate-700'>
              For operations teams managing complex data workflows, HR departments processing employee onboarding, or finance teams handling multi-system
              reporting, this technology is transformative. One workflow can extract data from your analytics platform, enrich it with CRM information, and
              automatically generate and distribute reports - all without human intervention.
            </p>

            <p className='mb-4 text-lg leading-relaxed text-slate-700'>
              In our pilot program, a customer success team automated their entire client onboarding workflow across five different web applications, reducing
              the process from 3.5 hours to just 12 minutes of human oversight, while also eliminating data entry errors and ensuring nothing falls through the
              cracks.
            </p>

            <p className='text-lg leading-relaxed text-slate-700'>
              We're offering limited access to this powerful new feature through our Pilot program. I'd love to show you how it works.
            </p>
          </section>

          {/* Final CTA */}
          <section className='mb-5 rounded-lg border border-purple-200 bg-gradient-to-r from-purple-50 to-indigo-50 p-6 text-center'>
            <div className='mb-2 inline-block rounded-full bg-purple-100 px-3 py-1 text-sm font-semibold text-purple-700'>LIMITED BETA ACCESS</div>
            <p className='mb-4 font-medium text-lg text-indigo-700'>Be among the first to experience our breakthrough browser automation technology</p>

            <div className='flex flex-col items-center justify-center space-y-3 sm:flex-row sm:space-x-4 sm:space-y-0'>
              <button
                onClick={() => router.push('/pilot')}
                className='w-full rounded-full bg-gradient-to-r from-purple-600 to-indigo-600 px-6 py-2.5 font-bold text-base text-white shadow-md transition-all hover:from-purple-700 hover:to-indigo-700 sm:w-auto'
              >
                Join the Pilot Program
              </button>

              <button
                onClick={() => window.open('https://calendly.com/jasonyu0100/15min', '_blank')}
                className='w-full rounded-full border border-indigo-200 bg-white px-6 py-2.5 font-bold text-base text-indigo-700 shadow-sm transition-all hover:bg-indigo-50 sm:w-auto'
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
            <div className='ml-0 mt-4 sm:ml-5 sm:mt-0'>
              <p className='font-bold text-base text-blue-700'>Jason Yu</p>
              <p className='text-sm text-slate-600'>Founder & CEO, convers.me</p>
              <p className='mt-2 text-sm italic text-slate-600'>
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
