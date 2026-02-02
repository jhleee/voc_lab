// =============================================================================
// Session Store (Legacy Compatibility)
// =============================================================================
// 새로운 세션 모듈로 리다이렉트
// =============================================================================

export { getSessionStore, getSessionManager, InMemorySessionStore } from './session';
export type { SessionStore } from '@/types/session';

// Legacy compatibility: create a fresh session store for testing
export function createSessionStore() {
  const { InMemorySessionStore } = require('./session');
  return new InMemorySessionStore();
}
