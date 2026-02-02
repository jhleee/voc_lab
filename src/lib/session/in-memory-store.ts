// =============================================================================
// In-Memory Session Store
// =============================================================================
// MVP 용 메모리 기반 세션 저장소
// =============================================================================

import { v4 as uuidv4 } from 'uuid';
import type {
  Session,
  SessionMessage,
  NodeExecutionRecord,
} from '@/types/session';
import type { ExtendedSessionStore, CreateSessionOptions } from './types';
import { DEFAULT_FLOW_VARIABLES } from '@/types/variables';

// -----------------------------------------------------------------------------
// In-Memory Session Store
// -----------------------------------------------------------------------------

export class InMemorySessionStore implements ExtendedSessionStore {
  private sessions: Map<string, Session> = new Map();

  async get(sessionId: string): Promise<Session | null> {
    return this.sessions.get(sessionId) || null;
  }

  async create(options: CreateSessionOptions): Promise<Session> {
    console.log('[InMemorySessionStore] create called', options);
    const now = new Date().toISOString();
    const sessionId = uuidv4();
    console.log('[InMemorySessionStore] Generated sessionId:', sessionId);

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
    console.log('[InMemorySessionStore] Session created and stored');
    return session;
  }

  async update(sessionId: string, updates: Partial<Session>): Promise<Session> {
    console.log('[InMemorySessionStore] update called', { sessionId, updates: Object.keys(updates) });
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

  async addMessage(sessionId: string, message: SessionMessage): Promise<void> {
    const session = this.sessions.get(sessionId);
    if (!session) {
      throw new Error(`Session not found: ${sessionId}`);
    }

    session.messages.push(message);
    session.updatedAt = new Date().toISOString();
    this.sessions.set(sessionId, session);
  }

  async addExecution(
    sessionId: string,
    record: NodeExecutionRecord
  ): Promise<void> {
    const session = this.sessions.get(sessionId);
    if (!session) {
      throw new Error(`Session not found: ${sessionId}`);
    }

    session.executionHistory.push(record);
    session.updatedAt = new Date().toISOString();
    this.sessions.set(sessionId, session);
  }

  async endSession(sessionId: string, _summary?: string): Promise<void> {
    const session = this.sessions.get(sessionId);
    if (!session) {
      throw new Error(`Session not found: ${sessionId}`);
    }

    // In-memory store: 세션을 삭제하지 않고 상태만 COMPLETED로 유지
    // 삭제하면 클라이언트에서 세션이 null이 되어 무한 루프 발생
    // Actual persistence happens in SessionManager (server-side)
    session.status = 'COMPLETED';
    session.updatedAt = new Date().toISOString();
    this.sessions.set(sessionId, session);
  }

  // Debug helpers
  getSessionCount(): number {
    return this.sessions.size;
  }

  getActiveSessions(): Session[] {
    return Array.from(this.sessions.values()).filter(
      (s) => s.status === 'ACTIVE' || s.status === 'WAITING_INPUT'
    );
  }

  clear(): void {
    this.sessions.clear();
  }
}
