'use client';

import { usePathname } from 'next/navigation';
import { useEffect } from 'react';
import posthog from 'posthog-js';
import { useSearchParams } from './SearchParamsProvider';

export function AnalyticsWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    // Track page views
    if (pathname && typeof window !== 'undefined' && posthog) {
      let url = window.origin + pathname;
      const paramsString = searchParams?.toString();
      if (paramsString && paramsString.length > 0) {
        url = `${url}?${paramsString}`;
      }
      posthog.capture('$pageview', {
        $current_url: url,
      });
    }
  }, [pathname, searchParams]);

  return <>{children}</>;
}
