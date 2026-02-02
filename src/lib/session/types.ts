// =============================================================================
// Session Store Types
// =============================================================================

import type {
  Session,
  SessionStore,
  CreateSessionOptions,
  SessionMessage,
  NodeExecutionRecord,
} from '@/types/session';

// Re-export base types
export type { Session, SessionStore, CreateSessionOptions };

// -----------------------------------------------------------------------------
// Extended Session Store Interface
// -----------------------------------------------------------------------------

export interface ExtendedSessionStore extends SessionStore {
  /** 메시지 추가 */
  addMessage(sessionId: string, message: SessionMessage): Promise<void>;
  /** 노드 실행 기록 추가 */
  addExecution(sessionId: string, record: NodeExecutionRecord): Promise<void>;
  /** 세션 종료 처리 (영속화) */
  endSession(sessionId: string, summary?: string): Promise<void>;
}

// -----------------------------------------------------------------------------
// Persistence Adapter Interface
// -----------------------------------------------------------------------------

export interface SessionPersistenceAdapter {
  /** 종료된 세션을 PostgreSQL에 저장 */
  persistSession(session: Session): Promise<void>;
  /** 저장된 세션 조회 */
  getPersistedSession(sessionId: string): Promise<PersistedSession | null>;
  /** 프로젝트의 세션 이력 조회 */
  getSessionHistory(
    projectId: string,
    options?: SessionHistoryOptions
  ): Promise<PersistedSession[]>;
}

// -----------------------------------------------------------------------------
// Persisted Session (DB에 저장된 세션)
// -----------------------------------------------------------------------------

export interface PersistedSession {
  id: string;
  projectId: string;
  flowId: string;
  channel: string;
  status: string;
  summary?: string;
  variables?: Record<string, unknown>;
  startedAt: Date;
  endedAt?: Date;
  messages: PersistedMessage[];
  nodeExecutions: PersistedNodeExecution[];
}

export interface PersistedMessage {
  id: string;
  direction: 'inbound' | 'outbound';
  content: string;
  contentType: string;
  metadata?: Record<string, unknown>;
  createdAt: Date;
}

export interface PersistedNodeExecution {
  id: string;
  nodeId: string;
  nodeType: string;
  turnNumber: number;
  inputSnapshot?: Record<string, unknown>;
  outputSnapshot?: Record<string, unknown>;
  status: 'RUNNING' | 'SUCCESS' | 'ERROR';
  errorDetail?: string;
  startedAt: Date;
  endedAt?: Date;
}

export interface SessionHistoryOptions {
  limit?: number;
  offset?: number;
  status?: string;
  startDate?: Date;
  endDate?: Date;
}
