'use client';

// This file re-exports from useAppWithZustand to maintain compatibility
// but we should avoid importing from this file directly in new code
import { useApp } from './useAppWithZustand';
export { useApp };
