// =============================================================================
// Session Module (Client Safe)
// =============================================================================
// NOTE: This file only exports client-safe modules.
// For server-side code that needs persistence or SessionManager,
// import directly from:
//   - '@/lib/session/persistence'
//   - '@/lib/session/session-manager'
// =============================================================================

export * from './types';
export * from './in-memory-store';
