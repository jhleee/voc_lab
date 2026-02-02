// =============================================================================
// Flow Node Type System
// =============================================================================
// 챗봇 빌더의 11가지 노드 타입 정의
// Discriminated Union 패턴으로 타입 안전성 보장
// =============================================================================

import type { Node } from '@xyflow/react';

// -----------------------------------------------------------------------------
// Execution Characteristics
// -----------------------------------------------------------------------------

export type NodeExecutionMode = 'blocking' | 'non-blocking';

export type NodeCategory = 'basic' | 'ai' | 'logic' | 'integration' | 'hitl';

// -----------------------------------------------------------------------------
// Node Type Enum
// -----------------------------------------------------------------------------

export type FlowNodeType =
  | 'start'
  | 'end'
  | 'message'
  | 'error_fallback'
  | 'intent_classifier'
  | 'rag_search'
  | 'condition'
  | 'parallel'
  | 'join'
  | 'api_connector'
  | 'custom_code'
  | 'escalation'
  | 'approval';

// -----------------------------------------------------------------------------
// Base Node Data
// -----------------------------------------------------------------------------

export interface BaseNodeData {
  label: string;
  description?: string;
  // Index signature for ReactFlow compatibility
  [key: string]: unknown;
}

// -----------------------------------------------------------------------------
// Basic Nodes
// -----------------------------------------------------------------------------

/** 시작 노드 - 플로우의 진입점 */
export interface StartNodeData extends BaseNodeData {
  type: 'start';
  triggerType: 'user_message' | 'chat_open' | 'api_call' | 'email_received';
}

/** 종료 노드 - 세션 정상 종료 */
export interface EndNodeData extends BaseNodeData {
  type: 'end';
  preserveSession: boolean;
}

/** 메시지 타입 */
export type MessageType = 'text' | 'image' | 'button' | 'card' | 'carousel' | 'link';

/** 버튼 정의 */
export interface ButtonDefinition {
  id: string;
  text: string;
  payload?: string;
}

/** 카드 정의 */
export interface CardDefinition {
  id: string;
  title: string;
  description?: string;
  imageUrl?: string;
  buttons?: ButtonDefinition[];
}

/** 메시지 아이템 */
export interface MessageItem {
  id: string;
  type: MessageType;
  content: string;
  imageUrl?: string;
  buttons?: ButtonDefinition[];
  cards?: CardDefinition[];
}

/** 메시지 출력 노드 */
export interface MessageNodeData extends BaseNodeData {
  type: 'message';
  messages: MessageItem[];
  waitForResponse: boolean;
  timeout?: number;
  timeoutHandlerId?: string;
}

/** 에러 폴백 노드 */
export interface ErrorFallbackNodeData extends BaseNodeData {
  type: 'error_fallback';
  fallbackMessage: string;
  restartOption: 'last_success' | 'failed_node';
}

// -----------------------------------------------------------------------------
// AI Nodes
// -----------------------------------------------------------------------------

/** 의도 정의 */
export interface IntentDefinition {
  id: string;
  name: string;
  description?: string;
  examples: string[];
}

/** 의도 분류 노드 */
export interface IntentClassifierNodeData extends BaseNodeData {
  type: 'intent_classifier';
  intents: IntentDefinition[];
  confidenceThreshold?: number;
}

/** RAG 검색 노드 */
export interface RAGSearchNodeData extends BaseNodeData {
  type: 'rag_search';
  documentSetId: string;
  documentSetVersion: 'latest' | string;
  topK: number;
  similarityThreshold: number;
  persona?: string;
}

// -----------------------------------------------------------------------------
// Logic Nodes
// -----------------------------------------------------------------------------

/** 조건 정의 */
export interface ConditionDefinition {
  id: string;
  label: string;
  expression: string; // e.g., "{{session.userGrade}} == 'VIP'"
}

/** 조건 분기 노드 */
export interface ConditionNodeData extends BaseNodeData {
  type: 'condition';
  conditions: ConditionDefinition[];
  defaultHandlerId?: string;
}

/** 병렬 분기 정의 */
export interface ParallelBranch {
  id: string;
  label: string;
}

/** Parallel 노드 */
export interface ParallelNodeData extends BaseNodeData {
  type: 'parallel';
  branches: ParallelBranch[];
}

/** Join 노드 */
export interface JoinNodeData extends BaseNodeData {
  type: 'join';
  expectedBranches: number;
}

// -----------------------------------------------------------------------------
// Integration Nodes
// -----------------------------------------------------------------------------

/** HTTP 메서드 */
export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';

/** 인증 방식 */
export type AuthType = 'none' | 'api_key' | 'bearer' | 'oauth2' | 'basic';

/** 인증 설정 */
export interface AuthConfig {
  type: AuthType;
  headerName?: string;
  apiKey?: string;
  token?: string;
  username?: string;
  password?: string;
  oauth2Config?: {
    clientId: string;
    clientSecret: string;
    tokenUrl: string;
    scopes?: string[];
  };
}

/** 재시도 정책 */
export interface RetryPolicy {
  maxRetries: number;
  retryDelay: number;
  backoffMultiplier?: number;
}

/** API 커넥터 노드 */
export interface APIConnectorNodeData extends BaseNodeData {
  type: 'api_connector';
  url: string;
  method: HttpMethod;
  headers: Record<string, string>;
  body?: string;
  auth: AuthConfig;
  retryPolicy: RetryPolicy;
  responseMapping?: string; // JSONPath
}

/** 커스텀 코드 노드 */
export interface CustomCodeNodeData extends BaseNodeData {
  type: 'custom_code';
  code: string;
  timeout: number; // ms, max 10000
}

// -----------------------------------------------------------------------------
// HITL Nodes
// -----------------------------------------------------------------------------

/** 에스컬레이션 노드 - 상담원 이관 */
export interface EscalationNodeData extends BaseNodeData {
  type: 'escalation';
  summaryTemplate?: string;
}

/** HITL 승인 노드 */
export interface ApprovalNodeData extends BaseNodeData {
  type: 'approval';
  approvalRequestInfo: string;
  additionalMessage?: string;
  waitingMessage: string;
  timeout?: number;
}

// -----------------------------------------------------------------------------
// Discriminated Union
// -----------------------------------------------------------------------------

export type FlowNodeData =
  | StartNodeData
  | EndNodeData
  | MessageNodeData
  | ErrorFallbackNodeData
  | IntentClassifierNodeData
  | RAGSearchNodeData
  | ConditionNodeData
  | ParallelNodeData
  | JoinNodeData
  | APIConnectorNodeData
  | CustomCodeNodeData
  | EscalationNodeData
  | ApprovalNodeData;

// -----------------------------------------------------------------------------
// Handle Configuration
// -----------------------------------------------------------------------------

export type HandlePosition = 'top' | 'bottom' | 'left' | 'right';

export interface NodeHandleConfig {
  id: string;
  type: 'source' | 'target';
  position: HandlePosition;
  label?: string;
  offsetPercent?: number; // 0-100, for multiple handles on same side
}

// -----------------------------------------------------------------------------
// Node Metadata
// -----------------------------------------------------------------------------

export interface NodeTypeMetadata {
  type: FlowNodeType;
  category: NodeCategory;
  displayName: string;
  icon: string; // Lucide icon name
  executionMode: NodeExecutionMode | 'configurable';
  color: string; // Tailwind color class
  defaultData: FlowNodeData;
  maxInputs: number | 'unlimited';
  maxOutputs: number | 'unlimited';
  getHandles: (data: FlowNodeData) => NodeHandleConfig[];
}

// -----------------------------------------------------------------------------
// ReactFlow Node Type
// -----------------------------------------------------------------------------

export type FlowNode = Node<FlowNodeData, FlowNodeType>;

// -----------------------------------------------------------------------------
// Type Guards
// -----------------------------------------------------------------------------

export function isStartNode(data: FlowNodeData): data is StartNodeData {
  return data.type === 'start';
}

export function isEndNode(data: FlowNodeData): data is EndNodeData {
  return data.type === 'end';
}

export function isMessageNode(data: FlowNodeData): data is MessageNodeData {
  return data.type === 'message';
}

export function isErrorFallbackNode(data: FlowNodeData): data is ErrorFallbackNodeData {
  return data.type === 'error_fallback';
}

export function isIntentClassifierNode(data: FlowNodeData): data is IntentClassifierNodeData {
  return data.type === 'intent_classifier';
}

export function isRAGSearchNode(data: FlowNodeData): data is RAGSearchNodeData {
  return data.type === 'rag_search';
}

export function isConditionNode(data: FlowNodeData): data is ConditionNodeData {
  return data.type === 'condition';
}

export function isParallelNode(data: FlowNodeData): data is ParallelNodeData {
  return data.type === 'parallel';
}

export function isJoinNode(data: FlowNodeData): data is JoinNodeData {
  return data.type === 'join';
}

export function isAPIConnectorNode(data: FlowNodeData): data is APIConnectorNodeData {
  return data.type === 'api_connector';
}

export function isCustomCodeNode(data: FlowNodeData): data is CustomCodeNodeData {
  return data.type === 'custom_code';
}

export function isEscalationNode(data: FlowNodeData): data is EscalationNodeData {
  return data.type === 'escalation';
}

export function isApprovalNode(data: FlowNodeData): data is ApprovalNodeData {
  return data.type === 'approval';
}
