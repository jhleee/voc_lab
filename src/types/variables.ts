// =============================================================================
// Variable System Types
// =============================================================================
// 3계층 변수 스코프: System, Session, Nodes
// 변수 참조 형식: {{scope.path}}
// =============================================================================

// -----------------------------------------------------------------------------
// Variable Scope
// -----------------------------------------------------------------------------

export type VariableScope = 'system' | 'session' | 'nodes';

// -----------------------------------------------------------------------------
// Variable Value Types
// -----------------------------------------------------------------------------

export type VariablePrimitive = string | number | boolean | null;

export type VariableValue =
  | VariablePrimitive
  | undefined
  | VariableValue[]
  | { [key: string]: VariableValue };

// -----------------------------------------------------------------------------
// System Variables (읽기 전용)
// -----------------------------------------------------------------------------

export interface SystemVariables {
  /** API 기본 URL */
  apiUrl: string;
  /** 봇 이름 */
  botName: string;
  /** 봇 ID */
  botId: string;
  /** 프로젝트 ID */
  projectId: string;
  /** 언어 설정 */
  language: string;
  /** 타임존 */
  timezone: string;
  /** 봇 버전 */
  botVersion: string;
  /** 채널 타입 */
  channel: 'chat' | 'email' | 'api';
  /** 커스텀 시스템 변수 */
  [key: string]: VariableValue;
}

// -----------------------------------------------------------------------------
// Session Variables (읽기/쓰기)
// -----------------------------------------------------------------------------

export interface SessionVariables {
  /** 세션 ID */
  sessionId: string;
  /** 세션 시작 시간 */
  startTime: string;
  /** 사용자 ID */
  userId?: string;
  /** 사용자 이름 */
  userName?: string;
  /** 사용자 이메일 */
  userEmail?: string;
  /** 마지막 사용자 입력 */
  lastUserInput?: string;
  /** 현재 의도 */
  currentIntent?: string;
  /** 메타데이터 */
  metadata: Record<string, VariableValue>;
  /** 커스텀 세션 변수 */
  [key: string]: VariableValue;
}

// -----------------------------------------------------------------------------
// Node Variables (읽기 전용 - 노드 실행 결과)
// -----------------------------------------------------------------------------

export interface NodeExecutionResult {
  /** 노드 ID */
  nodeId: string;
  /** 노드 라벨 */
  nodeLabel: string;
  /** 노드 타입 */
  nodeType: string;
  /** 실행 결과 */
  output: VariableValue;
  /** 실행 시간 */
  executedAt: string;
  /** 성공 여부 */
  success: boolean;
  /** 에러 메시지 (실패 시) */
  error?: string;
}

export interface NodesVariables {
  [nodeId: string]: NodeExecutionResult;
}

// -----------------------------------------------------------------------------
// Combined Flow Variables
// -----------------------------------------------------------------------------

export interface FlowVariables {
  system: SystemVariables;
  session: SessionVariables;
  nodes: NodesVariables;
}

// -----------------------------------------------------------------------------
// Variable Reference
// -----------------------------------------------------------------------------

export interface VariableReference {
  /** 원본 문자열: "{{session.userName}}" */
  raw: string;
  /** 스코프: "session" */
  scope: VariableScope;
  /** 경로: "userName" 또는 "user.profile.name" */
  path: string;
  /** 전체 경로: "session.userName" */
  fullPath: string;
}

// -----------------------------------------------------------------------------
// Variable Validation
// -----------------------------------------------------------------------------

export type VariableValidationErrorType =
  | 'INVALID_SYNTAX'
  | 'INVALID_SCOPE'
  | 'PATH_NOT_FOUND'
  | 'CIRCULAR_REFERENCE'
  | 'TYPE_MISMATCH';

export interface VariableValidationError {
  /** 참조 문자열 */
  reference: string;
  /** 에러 타입 */
  errorType: VariableValidationErrorType;
  /** 에러 메시지 */
  message: string;
  /** 위치 (문자열 내) */
  position?: {
    start: number;
    end: number;
  };
}

// -----------------------------------------------------------------------------
// Variable Interpolation Result
// -----------------------------------------------------------------------------

export interface InterpolationResult {
  /** 보간된 결과 문자열 */
  result: string;
  /** 발견된 모든 변수 참조 */
  references: VariableReference[];
  /** 검증 에러 */
  errors: VariableValidationError[];
  /** 성공 여부 */
  success: boolean;
}

// -----------------------------------------------------------------------------
// Available Variable Item (Variable Picker용)
// -----------------------------------------------------------------------------

export interface AvailableVariable {
  /** 스코프 */
  scope: VariableScope;
  /** 경로 */
  path: string;
  /** 전체 라벨: "session.userName" */
  label: string;
  /** 현재 값 */
  value: VariableValue;
  /** 값 타입 */
  valueType: 'string' | 'number' | 'boolean' | 'object' | 'array' | 'null';
  /** 설명 (선택) */
  description?: string;
  /** 노드 라벨 (nodes 스코프인 경우) */
  nodeLabel?: string;
}

// -----------------------------------------------------------------------------
// Default Values
// -----------------------------------------------------------------------------

export const DEFAULT_SYSTEM_VARIABLES: SystemVariables = {
  apiUrl: '',
  botName: '',
  botId: '',
  projectId: '',
  language: 'ko',
  timezone: 'Asia/Seoul',
  botVersion: '1.0.0',
  channel: 'chat',
};

export const DEFAULT_SESSION_VARIABLES: SessionVariables = {
  sessionId: '',
  startTime: new Date().toISOString(),
  metadata: {},
};

export const DEFAULT_FLOW_VARIABLES: FlowVariables = {
  system: DEFAULT_SYSTEM_VARIABLES,
  session: DEFAULT_SESSION_VARIABLES,
  nodes: {},
};
