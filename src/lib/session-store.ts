// =============================================================================
// Session Store
// =============================================================================
// 세션 저장소 구현 (MVP: In-Memory)
// =============================================================================

import { v4 as uuidv4 } from 'uuid';
import type {
  Session,
  SessionStore,
  CreateSessionOptions,
} from '@/types/session';
import { DEFAULT_FLOW_VARIABLES } from '@/types/variables';

// -----------------------------------------------------------------------------
// In-Memory Session Store
// -----------------------------------------------------------------------------

class InMemorySessionStore implements SessionStore {
  private sessions: Map<string, Session> = new Map();

  async get(sessionId: string): Promise<Session | null> {
    return this.sessions.get(sessionId) || null;
  }

  async create(options: CreateSessionOptions): Promise<Session> {
    const now = new Date().toISOString();
    const sessionId = uuidv4();

    const session: Session = {
      id: sessionId,
      projectId: options.projectId,
      flowId: options.flowId,
      status: 'INIT',
      currentNodeId: options.startNodeId,
      variables: {
        ...DEFAULT_FLOW_VARIABLES,
        ...options.initialVariables,
        system: {
          ...DEFAULT_FLOW_VARIABLES.system,
          projectId: options.projectId,
          botId: options.flowId,
        },
        session: {
          ...DEFAULT_FLOW_VARIABLES.session,
          sessionId,
          startTime: now,
        },
      },
      checkpoint: null,
      executionHistory: [],
      messages: [],
      turnNodeCount: 0,
      nodeVisitCounts: {},
      createdAt: now,
      updatedAt: now,
    };

    this.sessions.set(sessionId, session);
    return session;
  }

  async update(sessionId: string, updates: Partial<Session>): Promise<Session> {
    const session = this.sessions.get(sessionId);
    if (!session) {
      throw new Error(`Session not found: ${sessionId}`);
    }

    const updatedSession: Session = {
      ...session,
      ...updates,
      updatedAt: new Date().toISOString(),
    };

    this.sessions.set(sessionId, updatedSession);
    return updatedSession;
  }

  async delete(sessionId: string): Promise<void> {
    this.sessions.delete(sessionId);
  }

  async listByProject(projectId: string): Promise<Session[]> {
    return Array.from(this.sessions.values()).filter(
      (s) => s.projectId === projectId
    );
  }

  // Debug: 전체 세션 수 조회
  getSessionCount(): number {
    return this.sessions.size;
  }

  // Debug: 활성 세션 조회
  getActiveSessions(): Session[] {
    return Array.from(this.sessions.values()).filter(
      (s) => s.status === 'ACTIVE' || s.status === 'WAITING_INPUT'
    );
  }

  // Clear all sessions (for testing)
  clear(): void {
    this.sessions.clear();
  }
}

// -----------------------------------------------------------------------------
// Singleton Instance
// -----------------------------------------------------------------------------

let sessionStoreInstance: InMemorySessionStore | null = null;

export function getSessionStore(): SessionStore {
  if (!sessionStoreInstance) {
    sessionStoreInstance = new InMemorySessionStore();
  }
  return sessionStoreInstance;
}

// For testing
export function createSessionStore(): InMemorySessionStore {
  return new InMemorySessionStore();
}
