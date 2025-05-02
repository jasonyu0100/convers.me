'use client';
import { Analytics } from '@vercel/analytics/react';
import { usePathname } from 'next/navigation';
import posthog from 'posthog-js';
import { PostHogProvider } from 'posthog-js/react';
import { useEffect } from 'react';
import './globals.css';
import { ClientLayout } from './layouts/ClientLayout';
import { isDevelopment } from './lib/utils';
import { metadata as siteMetadata } from './metadata';
import { SearchParamsProvider, AnalyticsWrapper } from './components/search-params';

/**
 * Root layout for the entire application
 */
export default function RootLayout({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    posthog.init(process.env.NEXT_PUBLIC_POSTHOG_KEY || '', {
      api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST || 'https://us.i.posthog.com',
      ui_host: 'https://us.posthog.com',
      debug: false,
      session_recording: {
        maskAllInputs: true,
      },
      capture_pageview: false,
      loaded: (posthog) => {
        // Enable web vitals tracking once PostHog is loaded
        if (process.env.NODE_ENV === 'production') {
          posthog.startWebVitalsTracking({ reportWebVitalsToPostHog: true });
        }
      },
    });

    // Return early if posthog is not initialized yet
    if (!posthog) return;
  }, []);

  return (
    <html lang='en'>
      <head>
        <title>{typeof siteMetadata.title === 'string' ? siteMetadata.title : 'convers.me'}</title>
        <meta name='viewport' content='width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no' />
        {siteMetadata.icons && typeof siteMetadata.icons.icon === 'string' && <link rel='icon' href={siteMetadata.icons.icon} />}
        {siteMetadata.icons && typeof siteMetadata.icons.apple === 'string' && <link rel='apple-touch-icon' href={siteMetadata.icons.apple} />}
        {siteMetadata.icons && typeof siteMetadata.icons.shortcut === 'string' && <link rel='shortcut icon' href={siteMetadata.icons.shortcut} />}
        {siteMetadata.icons?.other?.map((icon: any, index: number) => (
          <link
            key={index}
            rel={typeof icon.rel === 'string' ? icon.rel : ''}
            type={typeof icon.type === 'string' ? icon.type : ''}
            sizes={typeof icon.sizes === 'string' ? icon.sizes : ''}
            href={typeof icon.url === 'string' ? icon.url : ''}
          />
        ))}
      </head>
      <body className='bg-white/80'>
        {/* Only enable Analytics in production */}
        {!isDevelopment() && <Analytics mode='production' debug={false} />}
        <PostHogProvider client={posthog}>
          <SearchParamsProvider>
            <ClientLayout>
              {/* Wrap children with analytics */}
              <AnalyticsWrapper>{children}</AnalyticsWrapper>
            </ClientLayout>
          </SearchParamsProvider>
        </PostHogProvider>
      </body>
    </html>
  );
}
