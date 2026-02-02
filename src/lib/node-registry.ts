// =============================================================================
// Node Registry
// =============================================================================
// 모든 노드 타입의 메타데이터 및 핸들 구성 중앙 관리
// =============================================================================

import type {
  FlowNodeType,
  NodeTypeMetadata,
  FlowNodeData,
  NodeHandleConfig,
  NodeCategory,
  StartNodeData,
  EndNodeData,
  MessageNodeData,
  ErrorFallbackNodeData,
  IntentClassifierNodeData,
  RAGSearchNodeData,
  ConditionNodeData,
  ParallelNodeData,
  JoinNodeData,
  APIConnectorNodeData,
  CustomCodeNodeData,
  EscalationNodeData,
  ApprovalNodeData,
} from '@/types/flow-nodes';

// -----------------------------------------------------------------------------
// Node Registry
// -----------------------------------------------------------------------------

export const NODE_REGISTRY: Record<FlowNodeType, NodeTypeMetadata> = {
  // -------------------------------------------------------------------------
  // Basic Nodes
  // -------------------------------------------------------------------------
  start: {
    type: 'start',
    category: 'basic',
    displayName: '시작',
    icon: 'Play',
    executionMode: 'non-blocking',
    color: 'green',
    defaultData: {
      type: 'start',
      label: '시작',
      triggerType: 'user_message',
    } as StartNodeData,
    maxInputs: 0,
    maxOutputs: 1,
    getHandles: (): NodeHandleConfig[] => [
      { id: 'out', type: 'source', position: 'bottom' },
    ],
  },

  end: {
    type: 'end',
    category: 'basic',
    displayName: '종료',
    icon: 'Square',
    executionMode: 'non-blocking',
    color: 'red',
    defaultData: {
      type: 'end',
      label: '종료',
      preserveSession: true,
    } as EndNodeData,
    maxInputs: 'unlimited',
    maxOutputs: 0,
    getHandles: (): NodeHandleConfig[] => [
      { id: 'in', type: 'target', position: 'top' },
    ],
  },

  message: {
    type: 'message',
    category: 'basic',
    displayName: '메시지',
    icon: 'MessageSquare',
    executionMode: 'configurable',
    color: 'blue',
    defaultData: {
      type: 'message',
      label: '메시지',
      messages: [{ id: '1', type: 'text', content: '' }],
      waitForResponse: true,
    } as MessageNodeData,
    maxInputs: 'unlimited',
    maxOutputs: 1,
    getHandles: (data: FlowNodeData): NodeHandleConfig[] => {
      const handles: NodeHandleConfig[] = [
        { id: 'in', type: 'target', position: 'top' },
        { id: 'out', type: 'source', position: 'bottom' },
      ];
      // 타임아웃 핸들러가 설정된 경우 추가 핸들
      if (data.type === 'message' && data.timeoutHandlerId) {
        handles.push({
          id: 'timeout',
          type: 'source',
          position: 'right',
          label: '타임아웃',
        });
      }
      return handles;
    },
  },

  error_fallback: {
    type: 'error_fallback',
    category: 'basic',
    displayName: '에러 폴백',
    icon: 'AlertTriangle',
    executionMode: 'non-blocking',
    color: 'orange',
    defaultData: {
      type: 'error_fallback',
      label: '에러 폴백',
      fallbackMessage: '죄송합니다. 오류가 발생했습니다.',
      restartOption: 'last_success',
    } as ErrorFallbackNodeData,
    maxInputs: 'unlimited',
    maxOutputs: 2,
    getHandles: (): NodeHandleConfig[] => [
      { id: 'in', type: 'target', position: 'top' },
      { id: 'retry', type: 'source', position: 'bottom', label: '재시도', offsetPercent: 30 },
      { id: 'exit', type: 'source', position: 'bottom', label: '종료', offsetPercent: 70 },
    ],
  },

  // -------------------------------------------------------------------------
  // AI Nodes
  // -------------------------------------------------------------------------
  intent_classifier: {
    type: 'intent_classifier',
    category: 'ai',
    displayName: '의도 분류',
    icon: 'Brain',
    executionMode: 'non-blocking',
    color: 'purple',
    defaultData: {
      type: 'intent_classifier',
      label: '의도 분류',
      intents: [],
      confidenceThreshold: 0.7,
    } as IntentClassifierNodeData,
    maxInputs: 1,
    maxOutputs: 'unlimited',
    getHandles: (data: FlowNodeData): NodeHandleConfig[] => {
      const handles: NodeHandleConfig[] = [
        { id: 'in', type: 'target', position: 'top' },
      ];

      if (data.type === 'intent_classifier') {
        const intents = data.intents || [];
        const total = intents.length + 1; // +1 for 'unknown'

        intents.forEach((intent, idx) => {
          handles.push({
            id: intent.id,
            type: 'source',
            position: 'bottom',
            label: intent.name,
            offsetPercent: ((idx + 1) / (total + 1)) * 100,
          });
        });

        handles.push({
          id: 'unknown',
          type: 'source',
          position: 'bottom',
          label: '기타',
          offsetPercent: (total / (total + 1)) * 100,
        });
      }

      return handles;
    },
  },

  rag_search: {
    type: 'rag_search',
    category: 'ai',
    displayName: 'RAG 검색',
    icon: 'Search',
    executionMode: 'non-blocking',
    color: 'purple',
    defaultData: {
      type: 'rag_search',
      label: 'RAG 검색',
      documentSetId: '',
      documentSetVersion: 'latest',
      topK: 5,
      similarityThreshold: 0.7,
    } as RAGSearchNodeData,
    maxInputs: 1,
    maxOutputs: 1,
    getHandles: (): NodeHandleConfig[] => [
      { id: 'in', type: 'target', position: 'top' },
      { id: 'out', type: 'source', position: 'bottom' },
    ],
  },

  // -------------------------------------------------------------------------
  // Logic Nodes
  // -------------------------------------------------------------------------
  condition: {
    type: 'condition',
    category: 'logic',
    displayName: '조건 분기',
    icon: 'GitBranch',
    executionMode: 'non-blocking',
    color: 'cyan',
    defaultData: {
      type: 'condition',
      label: '조건 분기',
      conditions: [],
    } as ConditionNodeData,
    maxInputs: 1,
    maxOutputs: 'unlimited',
    getHandles: (data: FlowNodeData): NodeHandleConfig[] => {
      const handles: NodeHandleConfig[] = [
        { id: 'in', type: 'target', position: 'top' },
      ];

      if (data.type === 'condition') {
        const conditions = data.conditions || [];
        const total = conditions.length + 1; // +1 for default

        conditions.forEach((cond, idx) => {
          handles.push({
            id: cond.id,
            type: 'source',
            position: 'bottom',
            label: cond.label,
            offsetPercent: ((idx + 1) / (total + 1)) * 100,
          });
        });

        handles.push({
          id: 'default',
          type: 'source',
          position: 'bottom',
          label: '기본',
          offsetPercent: (total / (total + 1)) * 100,
        });
      }

      return handles;
    },
  },

  parallel: {
    type: 'parallel',
    category: 'logic',
    displayName: '병렬',
    icon: 'GitFork',
    executionMode: 'non-blocking',
    color: 'cyan',
    defaultData: {
      type: 'parallel',
      label: '병렬',
      branches: [
        { id: '1', label: '분기 1' },
        { id: '2', label: '분기 2' },
      ],
    } as ParallelNodeData,
    maxInputs: 1,
    maxOutputs: 'unlimited',
    getHandles: (data: FlowNodeData): NodeHandleConfig[] => {
      const handles: NodeHandleConfig[] = [
        { id: 'in', type: 'target', position: 'top' },
      ];

      if (data.type === 'parallel') {
        const branches = data.branches || [];
        const total = branches.length;

        branches.forEach((branch, idx) => {
          handles.push({
            id: branch.id,
            type: 'source',
            position: 'bottom',
            label: branch.label,
            offsetPercent: total > 1 ? ((idx + 1) / (total + 1)) * 100 : 50,
          });
        });
      }

      return handles;
    },
  },

  join: {
    type: 'join',
    category: 'logic',
    displayName: '병합',
    icon: 'GitMerge',
    executionMode: 'non-blocking',
    color: 'cyan',
    defaultData: {
      type: 'join',
      label: '병합',
      expectedBranches: 2,
    } as JoinNodeData,
    maxInputs: 'unlimited',
    maxOutputs: 1,
    getHandles: (): NodeHandleConfig[] => [
      { id: 'in', type: 'target', position: 'top' },
      { id: 'out', type: 'source', position: 'bottom' },
    ],
  },

  // -------------------------------------------------------------------------
  // Integration Nodes
  // -------------------------------------------------------------------------
  api_connector: {
    type: 'api_connector',
    category: 'integration',
    displayName: 'API 호출',
    icon: 'Globe',
    executionMode: 'non-blocking',
    color: 'amber',
    defaultData: {
      type: 'api_connector',
      label: 'API 호출',
      url: '',
      method: 'GET',
      headers: {},
      auth: { type: 'none' },
      retryPolicy: { maxRetries: 3, retryDelay: 1000 },
    } as APIConnectorNodeData,
    maxInputs: 1,
    maxOutputs: 2,
    getHandles: (): NodeHandleConfig[] => [
      { id: 'in', type: 'target', position: 'top' },
      { id: 'success', type: 'source', position: 'bottom', label: '성공', offsetPercent: 30 },
      { id: 'error', type: 'source', position: 'bottom', label: '실패', offsetPercent: 70 },
    ],
  },

  custom_code: {
    type: 'custom_code',
    category: 'integration',
    displayName: '커스텀 코드',
    icon: 'Code',
    executionMode: 'non-blocking',
    color: 'amber',
    defaultData: {
      type: 'custom_code',
      label: '커스텀 코드',
      code: '// 사용 가능: input.system, input.session, input.nodes\n// setVariable("session.key", value);\nreturn { success: true };',
      timeout: 10000,
    } as CustomCodeNodeData,
    maxInputs: 1,
    maxOutputs: 2,
    getHandles: (): NodeHandleConfig[] => [
      { id: 'in', type: 'target', position: 'top' },
      { id: 'success', type: 'source', position: 'bottom', label: '성공', offsetPercent: 30 },
      { id: 'error', type: 'source', position: 'bottom', label: '에러', offsetPercent: 70 },
    ],
  },

  // -------------------------------------------------------------------------
  // HITL Nodes
  // -------------------------------------------------------------------------
  escalation: {
    type: 'escalation',
    category: 'hitl',
    displayName: '상담원 연결',
    icon: 'UserPlus',
    executionMode: 'blocking',
    color: 'pink',
    defaultData: {
      type: 'escalation',
      label: '상담원 연결',
    } as EscalationNodeData,
    maxInputs: 1,
    maxOutputs: 0, // 세션 종료
    getHandles: (): NodeHandleConfig[] => [
      { id: 'in', type: 'target', position: 'top' },
    ],
  },

  approval: {
    type: 'approval',
    category: 'hitl',
    displayName: '승인 요청',
    icon: 'CheckCircle',
    executionMode: 'blocking',
    color: 'pink',
    defaultData: {
      type: 'approval',
      label: '승인 요청',
      approvalRequestInfo: '',
      waitingMessage: '처리 중입니다. 잠시만 기다려주세요.',
    } as ApprovalNodeData,
    maxInputs: 1,
    maxOutputs: 2,
    getHandles: (): NodeHandleConfig[] => [
      { id: 'in', type: 'target', position: 'top' },
      { id: 'approved', type: 'source', position: 'bottom', label: '승인', offsetPercent: 30 },
      { id: 'rejected', type: 'source', position: 'bottom', label: '거절', offsetPercent: 70 },
    ],
  },
};

// -----------------------------------------------------------------------------
// Helper Functions
// -----------------------------------------------------------------------------

/**
 * 노드 타입의 메타데이터 조회
 */
export function getNodeMetadata(type: FlowNodeType): NodeTypeMetadata {
  return NODE_REGISTRY[type];
}

/**
 * 카테고리별 노드 목록
 */
export function getNodesByCategory(): Record<NodeCategory, NodeTypeMetadata[]> {
  const categories: Record<NodeCategory, NodeTypeMetadata[]> = {
    basic: [],
    ai: [],
    logic: [],
    integration: [],
    hitl: [],
  };

  Object.values(NODE_REGISTRY).forEach((metadata) => {
    categories[metadata.category].push(metadata);
  });

  return categories;
}

/**
 * 카테고리 표시 이름
 */
export const CATEGORY_LABELS: Record<NodeCategory, string> = {
  basic: '기본',
  ai: 'AI',
  logic: '로직',
  integration: '통합',
  hitl: '상담원 연계',
};

/**
 * 카테고리 색상
 */
export const CATEGORY_COLORS: Record<NodeCategory, { bg: string; border: string; text: string }> = {
  basic: {
    bg: 'bg-green-50 dark:bg-green-950',
    border: 'border-green-500',
    text: 'text-green-600 dark:text-green-400',
  },
  ai: {
    bg: 'bg-purple-50 dark:bg-purple-950',
    border: 'border-purple-500',
    text: 'text-purple-600 dark:text-purple-400',
  },
  logic: {
    bg: 'bg-cyan-50 dark:bg-cyan-950',
    border: 'border-cyan-500',
    text: 'text-cyan-600 dark:text-cyan-400',
  },
  integration: {
    bg: 'bg-amber-50 dark:bg-amber-950',
    border: 'border-amber-500',
    text: 'text-amber-600 dark:text-amber-400',
  },
  hitl: {
    bg: 'bg-pink-50 dark:bg-pink-950',
    border: 'border-pink-500',
    text: 'text-pink-600 dark:text-pink-400',
  },
};

/**
 * 새 노드 ID 생성
 */
export function generateNodeId(type: FlowNodeType): string {
  return `${type}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * 노드의 기본 데이터 복사본 생성
 */
export function createDefaultNodeData(type: FlowNodeType): FlowNodeData {
  const metadata = NODE_REGISTRY[type];
  return JSON.parse(JSON.stringify(metadata.defaultData));
}
