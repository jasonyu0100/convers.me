'use client';
import { Analytics } from '@vercel/analytics/react';
import { Router } from 'next/router';
import posthog from 'posthog-js';
import { PostHogProvider } from 'posthog-js/react';
import { useEffect } from 'react';
import './globals.css';
import { ClientLayout } from './layouts/ClientLayout';
import { isDevelopment } from './lib/utils';
import { metadata as siteMetadata } from './metadata';

/**
 * Root layout for the entire application
 */
export default function RootLayout({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    posthog.init(process.env.NEXT_PUBLIC_POSTHOG_KEY || '', {
      api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST || 'https://us.i.posthog.com',
      ui_host: 'https://us.posthog.com',
      loaded: (client) => {
        if (process.env.NODE_ENV === 'development') client.debug();
      },
      debug: process.env.NODE_ENV === 'development',
    });

    const handleRouteChange = () => posthog?.capture('$pageview');
    Router.events.on('routeChangeComplete', handleRouteChange);

    return () => {
      Router.events.off('routeChangeComplete', handleRouteChange);
    };
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
          <ClientLayout>{children}</ClientLayout>
        </PostHogProvider>
      </body>
    </html>
  );
}
