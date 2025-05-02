# Search Params Provider

This module provides a solution to the Next.js App Router requirement that `useSearchParams()` must be wrapped in a Suspense boundary.

## Components

### SearchParamsProvider

Wraps the Next.js `useSearchParams` hook with a proper Suspense boundary and provides the search params through a React context.

```tsx
<SearchParamsProvider>{/* Your components that need access to search params */}</SearchParamsProvider>
```

### AnalyticsWrapper

A wrapper component that uses the search params to track page views with PostHog.

```tsx
<AnalyticsWrapper>{/* Your page content */}</AnalyticsWrapper>
```

## Hooks and Utilities

### useSearchParams

A hook that safely retrieves the search params from the context.

```tsx
import { useSearchParams } from '@/app/components/search-params';

function MyComponent() {
  const searchParams = useSearchParams();
  const value = searchParams.get('key');
  // ...
}
```

### hasSearchParam

A utility function to check if a search param exists.

```tsx
import { hasSearchParam } from '@/app/components/search-params';

function MyComponent() {
  const hasFilter = hasSearchParam('filter');
  // ...
}
```

### getSearchParam

A utility function to get a search param value.

```tsx
import { getSearchParam } from '@/app/components/search-params';

function MyComponent() {
  const filter = getSearchParam('filter');
  // ...
}
```

## Why This Exists

In Next.js App Router, using `useSearchParams` directly without a Suspense boundary causes errors during static site generation. This module provides a centralized solution to properly handle search params in accordance with Next.js requirements.
