// =============================================================================
// Session Store (Legacy Compatibility - Client Safe)
// =============================================================================
// 클라이언트 컴포넌트에서 사용 가능한 세션 스토어
// NOTE: SessionManager는 Prisma를 사용하므로 서버에서만 import해야 함
// =============================================================================

import { InMemorySessionStore } from './session/in-memory-store';

export { InMemorySessionStore };
export type { SessionStore } from '@/types/session';

// Singleton session store for client-side use
let sessionStoreInstance: InMemorySessionStore | null = null;

export function getSessionStore(): InMemorySessionStore {
  if (!sessionStoreInstance) {
    sessionStoreInstance = new InMemorySessionStore();
  }
  return sessionStoreInstance;
}

// Legacy compatibility: create a fresh session store for testing
export function createSessionStore(): InMemorySessionStore {
  return new InMemorySessionStore();
}
