// =============================================================================
// Node Executor Framework
// =============================================================================
// 각 노드 타입별 실행 로직 정의
// =============================================================================

import { v4 as uuidv4 } from 'uuid';
import type {
  ExecutionContext,
  ExecutionResult,
  SessionMessage,
} from '@/types/session';
import type {
  FlowNodeType,
  FlowNodeData,
  StartNodeData,
  EndNodeData,
  MessageNodeData,
  ConditionNodeData,
  IntentClassifierNodeData,
  ErrorFallbackNodeData,
} from '@/types/flow-nodes';
import { interpolateVariables } from '@/lib/variable-resolver';

// -----------------------------------------------------------------------------
// Node Executor Interface
// -----------------------------------------------------------------------------

export interface NodeExecutor {
  /** 노드 타입 */
  type: FlowNodeType;
  /** Blocking 여부 */
  isBlocking: boolean | ((data: FlowNodeData) => boolean);
  /** 노드 실행 */
  execute(context: ExecutionContext): Promise<ExecutionResult>;
}

// -----------------------------------------------------------------------------
// Base Executor Helpers
// -----------------------------------------------------------------------------

function createMessage(
  direction: 'inbound' | 'outbound',
  content: string,
  contentType: SessionMessage['contentType'] = 'text'
): SessionMessage {
  return {
    id: uuidv4(),
    direction,
    content,
    contentType,
    createdAt: new Date().toISOString(),
  };
}

function interpolate(text: string, context: ExecutionContext): string {
  const result = interpolateVariables(text, context.session.variables);
  return result.result;
}

// -----------------------------------------------------------------------------
// Start Node Executor
// -----------------------------------------------------------------------------

export const startNodeExecutor: NodeExecutor = {
  type: 'start',
  isBlocking: false,

  async execute(context: ExecutionContext): Promise<ExecutionResult> {
    // Start 노드는 단순히 다음 노드로 전이
    return {
      type: 'continue',
      output: {
        triggeredAt: new Date().toISOString(),
        triggerType: context.trigger?.type || 'user_message',
      },
    };
  },
};

// -----------------------------------------------------------------------------
// End Node Executor
// -----------------------------------------------------------------------------

export const endNodeExecutor: NodeExecutor = {
  type: 'end',
  isBlocking: false,

  async execute(context: ExecutionContext): Promise<ExecutionResult> {
    const data = context.currentNode.data as EndNodeData;

    return {
      type: 'end',
      output: {
        reason: data.reason || 'completed',
        endedAt: new Date().toISOString(),
      },
    };
  },
};

// -----------------------------------------------------------------------------
// Message Node Executor
// -----------------------------------------------------------------------------

export const messageNodeExecutor: NodeExecutor = {
  type: 'message',
  isBlocking: (data: FlowNodeData) => {
    const msgData = data as MessageNodeData;
    return msgData.waitForResponse !== false; // 기본값 true (blocking)
  },

  async execute(context: ExecutionContext): Promise<ExecutionResult> {
    const data = context.currentNode.data as MessageNodeData;
    const messages: SessionMessage[] = [];

    // 메시지 목록 처리
    for (const msg of data.messages || []) {
      const content = interpolate(msg.content, context);
      messages.push(createMessage('outbound', content, msg.type));
    }

    const isBlocking = data.waitForResponse !== false;

    return {
      type: isBlocking ? 'wait' : 'continue',
      output: {
        messageCount: messages.length,
        waitForResponse: isBlocking,
      },
      messages,
    };
  },
};

// -----------------------------------------------------------------------------
// Error Fallback Node Executor
// -----------------------------------------------------------------------------

export const errorFallbackNodeExecutor: NodeExecutor = {
  type: 'error_fallback',
  isBlocking: false,

  async execute(context: ExecutionContext): Promise<ExecutionResult> {
    const data = context.currentNode.data as ErrorFallbackNodeData;
    const messages: SessionMessage[] = [];

    // 에러 메시지 출력
    if (data.fallbackMessage) {
      const content = interpolate(data.fallbackMessage, context);
      messages.push(createMessage('outbound', content, 'text'));
    }

    return {
      type: 'end', // Error fallback typically ends the flow or retries
      output: {
        restartOption: data.restartOption,
      },
      messages,
    };
  },
};

// -----------------------------------------------------------------------------
// Condition Node Executor
// -----------------------------------------------------------------------------

export const conditionNodeExecutor: NodeExecutor = {
  type: 'condition',
  isBlocking: false,

  async execute(context: ExecutionContext): Promise<ExecutionResult> {
    const data = context.currentNode.data as ConditionNodeData;
    const conditions = data.conditions || [];

    // 조건 평가 - 첫 번째 일치하는 조건 선택
    let selectedConditionId: string | null = null;

    for (const condition of conditions) {
      const expression = interpolate(condition.expression, context);
      try {
        // 간단한 조건 평가 (실제로는 더 안전한 평가기 필요)
        const result = evaluateCondition(expression);
        if (result) {
          selectedConditionId = condition.id;
          break;
        }
      } catch (error) {
        console.error('Condition evaluation error:', error);
      }
    }

    return {
      type: 'continue',
      output: {
        selectedConditionId,
        evaluatedConditions: conditions.length,
        isDefault: selectedConditionId === null,
      },
    };
  },
};

// 간단한 조건 평가 함수 (MVP용 - 보안 고려 필요)
function evaluateCondition(expression: string): boolean {
  // 기본적인 비교 연산만 지원
  const comparisons = [
    { op: '===', fn: (a: unknown, b: unknown) => a === b },
    { op: '!==', fn: (a: unknown, b: unknown) => a !== b },
    { op: '==', fn: (a: unknown, b: unknown) => a == b },
    { op: '!=', fn: (a: unknown, b: unknown) => a != b },
    { op: '>=', fn: (a: number, b: number) => a >= b },
    { op: '<=', fn: (a: number, b: number) => a <= b },
    { op: '>', fn: (a: number, b: number) => a > b },
    { op: '<', fn: (a: number, b: number) => a < b },
  ];

  for (const { op, fn } of comparisons) {
    if (expression.includes(op)) {
      const [left, right] = expression.split(op).map((s) => s.trim());
      const leftVal = parseValue(left);
      const rightVal = parseValue(right);
      return fn(leftVal as never, rightVal as never);
    }
  }

  // 단일 값 (truthy 체크)
  const val = parseValue(expression.trim());
  return Boolean(val);
}

function parseValue(str: string): unknown {
  // 문자열 리터럴
  if ((str.startsWith('"') && str.endsWith('"')) ||
      (str.startsWith("'") && str.endsWith("'"))) {
    return str.slice(1, -1);
  }
  // 숫자
  if (!isNaN(Number(str))) {
    return Number(str);
  }
  // 불리언
  if (str === 'true') return true;
  if (str === 'false') return false;
  if (str === 'null') return null;
  // 그 외는 문자열로
  return str;
}

// -----------------------------------------------------------------------------
// Intent Classifier Node Executor (Stub - LLM 연동 필요)
// -----------------------------------------------------------------------------

export const intentClassifierNodeExecutor: NodeExecutor = {
  type: 'intent_classifier',
  isBlocking: false,

  async execute(context: ExecutionContext): Promise<ExecutionResult> {
    const data = context.currentNode.data as IntentClassifierNodeData;
    const intents = data.intents || [];

    // MVP: 첫 번째 의도 반환 (실제로는 LLM 분류 필요)
    // TODO: LLM 연동
    const lastUserInput = context.session.variables.session.lastUserInput || '';

    // 간단한 키워드 매칭 (MVP)
    let matchedIntent = intents.find((intent) =>
      intent.examples?.some((ex) =>
        lastUserInput.toLowerCase().includes(ex.toLowerCase())
      )
    );

    if (!matchedIntent && intents.length > 0) {
      // 매칭 없으면 마지막 의도 (보통 '기타')
      matchedIntent = intents[intents.length - 1];
    }

    return {
      type: 'continue',
      output: {
        intent: matchedIntent?.name || 'unknown',
        intentId: matchedIntent?.id,
        confidence: matchedIntent ? 0.8 : 0.0, // MVP: 고정값
      },
    };
  },
};

// -----------------------------------------------------------------------------
// Stub Executors (TODO: 구현 필요)
// -----------------------------------------------------------------------------

export const ragSearchNodeExecutor: NodeExecutor = {
  type: 'rag_search',
  isBlocking: false,
  async execute(): Promise<ExecutionResult> {
    // TODO: RAG 검색 구현
    return {
      type: 'continue',
      output: {
        answer: 'RAG 검색 기능은 아직 구현되지 않았습니다.',
        confidence: 0,
        sources: [],
      },
    };
  },
};

export const parallelNodeExecutor: NodeExecutor = {
  type: 'parallel',
  isBlocking: false,
  async execute(): Promise<ExecutionResult> {
    // TODO: 병렬 실행 구현
    return { type: 'continue', output: {} };
  },
};

export const joinNodeExecutor: NodeExecutor = {
  type: 'join',
  isBlocking: false,
  async execute(): Promise<ExecutionResult> {
    return { type: 'continue', output: {} };
  },
};

export const apiConnectorNodeExecutor: NodeExecutor = {
  type: 'api_connector',
  isBlocking: false,
  async execute(): Promise<ExecutionResult> {
    // TODO: API 호출 구현
    return {
      type: 'continue',
      output: {
        response: null,
        statusCode: 0,
        error: 'API 커넥터는 아직 구현되지 않았습니다.',
      },
    };
  },
};

export const customCodeNodeExecutor: NodeExecutor = {
  type: 'custom_code',
  isBlocking: false,
  async execute(): Promise<ExecutionResult> {
    // TODO: 샌드박스 코드 실행 구현
    return {
      type: 'continue',
      output: {
        result: null,
        error: '커스텀 코드 실행은 아직 구현되지 않았습니다.',
      },
    };
  },
};

export const escalationNodeExecutor: NodeExecutor = {
  type: 'escalation',
  isBlocking: true,
  async execute(context: ExecutionContext): Promise<ExecutionResult> {
    return {
      type: 'end', // Escalation은 플로우 종료
      output: {
        escalatedAt: new Date().toISOString(),
        reason: 'human_handoff',
      },
      messages: [
        createMessage('outbound', '상담원에게 연결 중입니다. 잠시만 기다려주세요.'),
      ],
    };
  },
};

export const approvalNodeExecutor: NodeExecutor = {
  type: 'approval',
  isBlocking: true,
  async execute(): Promise<ExecutionResult> {
    return {
      type: 'wait',
      output: {
        waitingFor: 'approval',
        requestedAt: new Date().toISOString(),
      },
      messages: [
        createMessage('outbound', '처리 중입니다. 잠시만 기다려주세요.'),
      ],
    };
  },
};

// -----------------------------------------------------------------------------
// Executor Registry
// -----------------------------------------------------------------------------

const executors: Record<FlowNodeType, NodeExecutor> = {
  start: startNodeExecutor,
  end: endNodeExecutor,
  message: messageNodeExecutor,
  error_fallback: errorFallbackNodeExecutor,
  intent_classifier: intentClassifierNodeExecutor,
  rag_search: ragSearchNodeExecutor,
  condition: conditionNodeExecutor,
  parallel: parallelNodeExecutor,
  join: joinNodeExecutor,
  api_connector: apiConnectorNodeExecutor,
  custom_code: customCodeNodeExecutor,
  escalation: escalationNodeExecutor,
  approval: approvalNodeExecutor,
};

export function getNodeExecutor(type: FlowNodeType): NodeExecutor {
  const executor = executors[type];
  if (!executor) {
    throw new Error(`Unknown node type: ${type}`);
  }
  return executor;
}

export function isNodeBlocking(type: FlowNodeType, data: FlowNodeData): boolean {
  const executor = getNodeExecutor(type);
  if (typeof executor.isBlocking === 'function') {
    return executor.isBlocking(data);
  }
  return executor.isBlocking;
}
