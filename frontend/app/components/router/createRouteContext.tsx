/**
 * Factory function for creating standardized route contexts
 */
import { ReactNode, createContext, useContext } from 'react';

/**
 * Creates a typed context and provider for a route component
 *
 * @param displayName Name of the context for debugging
 * @param defaultValue Default context value
 * @returns Context object, Provider component, and hook for accessing context
 */
export function createRouteContext<T>(displayName: string, defaultValue: T) {
  const Context = createContext<T>(defaultValue);
  Context.displayName = displayName;

  /**
   * Provider component for the context
   */
  function Provider({ children, value }: { children: ReactNode; value: T }) {
    return <Context.Provider value={value}>{children}</Context.Provider>;
  }

  /**
   * Hook for accessing the context
   */
  function useRouteContext() {
    const context = useContext(Context);
    return context;
  }

  return { Context, Provider, useRouteContext };
}
