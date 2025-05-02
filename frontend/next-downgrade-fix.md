# Next.js Downgrade Notes

## Changes Made

- Downgraded Next.js from version 15.3.1 to 14.1.0
- Downgraded React from version 19.1.0 to 18.2.0
- Updated various dependency versions for compatibility
- Converted next.config.ts to next.config.js
- Removed incompatible experimental features

## Potential TypeScript Errors

If you encounter TypeScript errors after this downgrade, consider adding the following to any problematic files:

```tsx
// @ts-ignore - temporary workaround for Next.js 14 compatibility
```

## Turbopack Warning

You may see a warning about Webpack being configured while Turbopack is in use. This is expected and shouldn't cause functionality issues. To eliminate this warning, either:

1. Remove the `--turbo` flag from the dev script in package.json
2. Or configure Turbopack according to the Next.js documentation

## React 18 Compatibility

If you were using React 19 features, you'll need to adapt your code to work with React 18. Key differences include:

- Use `startTransition` instead of `useOptimistic`
- Use standard event handlers instead of React 19 event architecture
- Use traditional suspense patterns instead of React 19's enhanced suspense

## Reverting Changes

If you need to revert to the original version:

1. Restore the original package.json
2. Restore next.config.ts
3. Run `npm install`
