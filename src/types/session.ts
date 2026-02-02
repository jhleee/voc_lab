// =============================================================================
// Session Types
// =============================================================================
// 플로우 실행 세션의 상태 및 데이터 타입 정의
// =============================================================================

import type { FlowVariables } from './variables';

// -----------------------------------------------------------------------------
// Session Status
// -----------------------------------------------------------------------------

export type SessionStatus =
  | 'INIT'           // 초기화됨
  | 'ACTIVE'         // 실행 중
  | 'WAITING_INPUT'  // 사용자 입력 대기 (Blocking 노드)
  | 'WAITING_HUMAN'  // 상담원 대기 (HITL)
  | 'COMPLETED'      // 정상 종료
  | 'TIMEOUT'        // 타임아웃
  | 'ERROR';         // 에러 발생

// -----------------------------------------------------------------------------
// Session Checkpoint
// -----------------------------------------------------------------------------

export interface SessionCheckpoint {
  nodeId: string;
  timestamp: string;
  variablesSnapshot: FlowVariables;
}

// -----------------------------------------------------------------------------
// Node Execution Record
// -----------------------------------------------------------------------------

export interface NodeExecutionRecord {
  nodeId: string;
  nodeType: string;
  startedAt: string;
  endedAt?: string;
  status: 'running' | 'success' | 'error';
  input?: unknown;
  output?: unknown;
  error?: string;
}

// -----------------------------------------------------------------------------
// Session Message
// -----------------------------------------------------------------------------

export type MessageDirection = 'inbound' | 'outbound';
export type MessageContentType = 'text' | 'image' | 'button' | 'card' | 'carousel' | 'link';

export interface SessionMessage {
  id: string;
  direction: MessageDirection;
  content: string;
  contentType: MessageContentType;
  metadata?: Record<string, unknown>;
  createdAt: string;
}

// -----------------------------------------------------------------------------
// Session
// -----------------------------------------------------------------------------

export interface Session {
  /** 세션 ID */
  id: string;
  /** 프로젝트 ID */
  projectId: string;
  /** 플로우 ID */
  flowId: string;
  /** 세션 상태 */
  status: SessionStatus;
  /** 현재 노드 ID */
  currentNodeId: string | null;
  /** 변수 컨텍스트 */
  variables: FlowVariables;
  /** 마지막 체크포인트 */
  checkpoint: SessionCheckpoint | null;
  /** 노드 실행 이력 */
  executionHistory: NodeExecutionRecord[];
  /** 메시지 이력 */
  messages: SessionMessage[];
  /** 현재 턴에서 노드 실행 횟수 (루프 방지) */
  turnNodeCount: number;
  /** 현재 턴에서 동일 노드 실행 횟수 맵 */
  nodeVisitCounts: Record<string, number>;
  /** 생성 시간 */
  createdAt: string;
  /** 마지막 활동 시간 */
  updatedAt: string;
}

// -----------------------------------------------------------------------------
// Session Creation Options
// -----------------------------------------------------------------------------

export interface CreateSessionOptions {
  projectId: string;
  flowId: string;
  startNodeId: string;
  initialVariables?: Partial<FlowVariables>;
}

// -----------------------------------------------------------------------------
// Session Store Interface
// -----------------------------------------------------------------------------

export interface SessionStore {
  /** 세션 조회 */
  get(sessionId: string): Promise<Session | null>;
  /** 세션 생성 */
  create(options: CreateSessionOptions): Promise<Session>;
  /** 세션 업데이트 */
  update(sessionId: string, updates: Partial<Session>): Promise<Session>;
  /** 세션 삭제 */
  delete(sessionId: string): Promise<void>;
  /** 프로젝트의 활성 세션 목록 */
  listByProject(projectId: string): Promise<Session[]>;
}

// -----------------------------------------------------------------------------
// Execution Context
// -----------------------------------------------------------------------------

export interface ExecutionContext {
  session: Session;
  currentNode: {
    id: string;
    type: string;
    data: unknown;
  };
  trigger?: {
    type: 'user_message' | 'api_call' | 'timeout' | 'approval';
    payload?: unknown;
  };
}

// -----------------------------------------------------------------------------
// Execution Result
// -----------------------------------------------------------------------------

export type ExecutionResultType =
  | 'continue'      // 다음 노드로 계속
  | 'wait'          // Blocking - 외부 입력 대기
  | 'end'           // 플로우 종료
  | 'error';        // 에러 발생

export interface ExecutionResult {
  type: ExecutionResultType;
  /** 다음 노드 ID (continue일 때) */
  nextNodeId?: string;
  /** 출력 데이터 */
  output?: unknown;
  /** 출력 메시지들 */
  messages?: SessionMessage[];
  /** 변수 업데이트 */
  variableUpdates?: Partial<FlowVariables>;
  /** 에러 정보 */
  error?: {
    message: string;
    code?: string;
  };
}

// -----------------------------------------------------------------------------
// Loop Prevention Constants
// -----------------------------------------------------------------------------

export const MAX_NODE_VISITS_PER_TURN = 5;
export const MAX_TOTAL_NODES_PER_TURN = 50;
