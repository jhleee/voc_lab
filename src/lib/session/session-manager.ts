// =============================================================================
// Session Manager
// =============================================================================
// 세션 저장소와 영속화를 통합 관리
// =============================================================================

import type {
  Session,
  SessionStore,
  SessionMessage,
  NodeExecutionRecord,
} from '@/types/session';
import type {
  CreateSessionOptions,
  ExtendedSessionStore,
  SessionPersistenceAdapter,
  PersistedSession,
  SessionHistoryOptions,
} from './types';
import { InMemorySessionStore } from './in-memory-store';
import { getPersistenceAdapter } from './persistence';

// -----------------------------------------------------------------------------
// Session Manager
// -----------------------------------------------------------------------------

export class SessionManager implements ExtendedSessionStore {
  private store: InMemorySessionStore;
  private persistence: SessionPersistenceAdapter;

  constructor(
    store?: InMemorySessionStore,
    persistence?: SessionPersistenceAdapter
  ) {
    this.store = store || new InMemorySessionStore();
    this.persistence = persistence || getPersistenceAdapter();
  }

  // ---------------------------------------------------------------------------
  // SessionStore Interface
  // ---------------------------------------------------------------------------

  async get(sessionId: string): Promise<Session | null> {
    return this.store.get(sessionId);
  }

  async create(options: CreateSessionOptions): Promise<Session> {
    return this.store.create(options);
  }

  async update(sessionId: string, updates: Partial<Session>): Promise<Session> {
    return this.store.update(sessionId, updates);
  }

  async delete(sessionId: string): Promise<void> {
    return this.store.delete(sessionId);
  }

  async listByProject(projectId: string): Promise<Session[]> {
    return this.store.listByProject(projectId);
  }

  // ---------------------------------------------------------------------------
  // Extended Interface
  // ---------------------------------------------------------------------------

  async addMessage(sessionId: string, message: SessionMessage): Promise<void> {
    return this.store.addMessage(sessionId, message);
  }

  async addExecution(
    sessionId: string,
    record: NodeExecutionRecord
  ): Promise<void> {
    return this.store.addExecution(sessionId, record);
  }

  /**
   * 세션을 종료하고 PostgreSQL에 영속화합니다.
   */
  async endSession(sessionId: string, summary?: string): Promise<void> {
    const session = await this.store.get(sessionId);
    if (!session) {
      throw new Error(`Session not found: ${sessionId}`);
    }

    // 세션 상태 업데이트
    const finalSession = await this.store.update(sessionId, {
      status: 'COMPLETED',
    });

    // PostgreSQL에 저장
    try {
      await this.persistence.persistSession(finalSession);
    } catch (error) {
      console.error('Failed to persist session:', error);
      // 영속화 실패해도 세션 종료는 진행
    }

    // 메모리에서 제거
    await this.store.delete(sessionId);
  }

  // ---------------------------------------------------------------------------
  // History Methods
  // ---------------------------------------------------------------------------

  /**
   * 저장된 세션 이력을 조회합니다.
   */
  async getSessionHistory(
    projectId: string,
    options?: SessionHistoryOptions
  ): Promise<PersistedSession[]> {
    return this.persistence.getSessionHistory(projectId, options);
  }

  /**
   * 저장된 단일 세션을 조회합니다.
   */
  async getPersistedSession(sessionId: string): Promise<PersistedSession | null> {
    return this.persistence.getPersistedSession(sessionId);
  }

  // ---------------------------------------------------------------------------
  // Debug Methods
  // ---------------------------------------------------------------------------

  getActiveSessionCount(): number {
    return this.store.getSessionCount();
  }

  getActiveSessions(): Session[] {
    return this.store.getActiveSessions();
  }

  getActiveSessionsByProject(projectId: string): Session[] {
    return this.store.getActiveSessions().filter(s => s.projectId === projectId);
  }

  clearStore(): void {
    this.store.clear();
  }
}

// -----------------------------------------------------------------------------
// Singleton Instance
// -----------------------------------------------------------------------------

let sessionManagerInstance: SessionManager | null = null;

export function getSessionManager(): SessionManager {
  if (!sessionManagerInstance) {
    sessionManagerInstance = new SessionManager();
  }
  return sessionManagerInstance;
}

// Legacy compatibility
export function getSessionStore(): SessionStore {
  return getSessionManager();
}

// Singleton instance for direct import
export const sessionManager = getSessionManager();
