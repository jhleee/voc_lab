// =============================================================================
// Edge Validator
// =============================================================================
// 노드 간 연결의 유효성을 검증합니다.
// =============================================================================

import type { Edge, Connection, Node } from '@xyflow/react';
import type { FlowNodeType, FlowNodeData } from '@/types/flow-nodes';

// -----------------------------------------------------------------------------
// Types
// -----------------------------------------------------------------------------

export interface EdgeValidationResult {
  valid: boolean;
  reason?: string;
}

// -----------------------------------------------------------------------------
// Node Connection Rules
// -----------------------------------------------------------------------------

// 각 노드 타입별 연결 규칙
const NODE_CONNECTION_RULES: Record<
  FlowNodeType,
  {
    allowsInput: boolean;
    allowsOutput: boolean;
    maxInputs?: number;
    maxOutputs?: number;
  }
> = {
  start: { allowsInput: false, allowsOutput: true, maxInputs: 0, maxOutputs: 1 },
  end: { allowsInput: true, allowsOutput: false, maxOutputs: 0 },
  message: { allowsInput: true, allowsOutput: true },
  error_fallback: { allowsInput: true, allowsOutput: true },
  intent_classifier: { allowsInput: true, allowsOutput: true },
  rag_search: { allowsInput: true, allowsOutput: true, maxOutputs: 1 },
  condition: { allowsInput: true, allowsOutput: true },
  parallel: { allowsInput: true, allowsOutput: true },
  join: { allowsInput: true, allowsOutput: true, maxOutputs: 1 },
  api_connector: { allowsInput: true, allowsOutput: true },
  custom_code: { allowsInput: true, allowsOutput: true },
  escalation: { allowsInput: true, allowsOutput: false, maxOutputs: 0 },
  approval: { allowsInput: true, allowsOutput: true },
};

// -----------------------------------------------------------------------------
// Validation Functions
// -----------------------------------------------------------------------------

/**
 * 새로운 연결이 유효한지 검증합니다.
 */
export function validateConnection(
  connection: Connection,
  nodes: Node<FlowNodeData>[],
  edges: Edge[]
): EdgeValidationResult {
  const { source, target, sourceHandle, targetHandle } = connection;

  // 1. 자기 자신으로의 연결 금지
  if (source === target) {
    return { valid: false, reason: '자기 자신에게 연결할 수 없습니다.' };
  }

  // 2. source와 target 노드 찾기
  const sourceNode = nodes.find((n) => n.id === source);
  const targetNode = nodes.find((n) => n.id === target);

  if (!sourceNode || !targetNode) {
    return { valid: false, reason: '노드를 찾을 수 없습니다.' };
  }

  const sourceType = sourceNode.type as FlowNodeType;
  const targetType = targetNode.type as FlowNodeType;

  // 3. 연결 규칙 확인
  const sourceRules = NODE_CONNECTION_RULES[sourceType];
  const targetRules = NODE_CONNECTION_RULES[targetType];

  if (!sourceRules?.allowsOutput) {
    return {
      valid: false,
      reason: `${sourceType} 노드는 출력 연결을 허용하지 않습니다.`,
    };
  }

  if (!targetRules?.allowsInput) {
    return {
      valid: false,
      reason: `${targetType} 노드는 입력 연결을 허용하지 않습니다.`,
    };
  }

  // 4. 중복 연결 확인 (같은 source+target+handles)
  // null과 undefined를 동일하게 처리
  const normalizeHandle = (h: string | null | undefined) => h ?? null;
  const isDuplicate = edges.some(
    (edge) =>
      edge.source === source &&
      edge.target === target &&
      normalizeHandle(edge.sourceHandle) === normalizeHandle(sourceHandle) &&
      normalizeHandle(edge.targetHandle) === normalizeHandle(targetHandle)
  );

  if (isDuplicate) {
    return { valid: false, reason: '이미 연결되어 있습니다.' };
  }

  // 5. 최대 출력 수 확인
  if (sourceRules.maxOutputs !== undefined) {
    const currentOutputs = edges.filter(
      (edge) => edge.source === source
    ).length;
    if (currentOutputs >= sourceRules.maxOutputs) {
      return {
        valid: false,
        reason: `${sourceType} 노드는 최대 ${sourceRules.maxOutputs}개의 출력만 허용합니다.`,
      };
    }
  }

  // 6. 순환 참조 확인 (간단한 직접 역방향 연결만 확인)
  const hasReverseConnection = edges.some(
    (edge) => edge.source === target && edge.target === source
  );

  if (hasReverseConnection) {
    return { valid: false, reason: '양방향 연결은 허용되지 않습니다.' };
  }

  return { valid: true };
}

/**
 * 연결 가능 여부를 확인합니다 (ReactFlow의 isValidConnection용).
 */
export function isValidConnection(
  connection: Connection,
  nodes: Node<FlowNodeData>[],
  edges: Edge[]
): boolean {
  return validateConnection(connection, nodes, edges).valid;
}
