import { describe, it, expect } from 'vitest';
import {
  isStartNode,
  isEndNode,
  isMessageNode,
  isConditionNode,
  isIntentClassifierNode,
  isRAGSearchNode,
  isAPIConnectorNode,
  isCustomCodeNode,
  isParallelNode,
  isJoinNode,
  isErrorFallbackNode,
  isEscalationNode,
  isApprovalNode,
} from './flow-nodes';
import type { FlowNodeData, FlowNodeType } from './flow-nodes';

// All expected flow node types
const FLOW_NODE_TYPES: FlowNodeType[] = [
  'start',
  'end',
  'message',
  'error_fallback',
  'intent_classifier',
  'rag_search',
  'condition',
  'parallel',
  'join',
  'api_connector',
  'custom_code',
  'escalation',
  'approval',
];

describe('flow-nodes type guards', () => {
  describe('FlowNodeType', () => {
    it('should cover all 13 node types', () => {
      expect(FLOW_NODE_TYPES).toHaveLength(13);
    });
  });

  describe('isStartNode', () => {
    it('should return true for start node', () => {
      const data: FlowNodeData = {
        type: 'start',
        label: '시작',
        triggerType: 'user_message',
      };
      expect(isStartNode(data)).toBe(true);
    });

    it('should return false for other node types', () => {
      const data: FlowNodeData = {
        type: 'end',
        label: '종료',
        showSummary: false,
      };
      expect(isStartNode(data)).toBe(false);
    });
  });

  describe('isEndNode', () => {
    it('should return true for end node', () => {
      const data: FlowNodeData = {
        type: 'end',
        label: '종료',
        showSummary: true,
      };
      expect(isEndNode(data)).toBe(true);
    });
  });

  describe('isMessageNode', () => {
    it('should return true for message node', () => {
      const data: FlowNodeData = {
        type: 'message',
        label: '메시지',
        messages: [{ type: 'text', content: '안녕하세요' }],
        waitForResponse: true,
      };
      expect(isMessageNode(data)).toBe(true);
    });
  });

  describe('isConditionNode', () => {
    it('should return true for condition node', () => {
      const data: FlowNodeData = {
        type: 'condition',
        label: '조건',
        conditions: [],
      };
      expect(isConditionNode(data)).toBe(true);
    });
  });

  describe('isIntentClassifierNode', () => {
    it('should return true for intent classifier node', () => {
      const data: FlowNodeData = {
        type: 'intent_classifier',
        label: '의도 분류',
        intents: [],
        fallbackIntent: '기타',
      };
      expect(isIntentClassifierNode(data)).toBe(true);
    });
  });

  describe('isRAGSearchNode', () => {
    it('should return true for RAG search node', () => {
      const data: FlowNodeData = {
        type: 'rag_search',
        label: 'RAG 검색',
        documentSetId: 'doc-1',
        topK: 5,
        similarityThreshold: 0.7,
      };
      expect(isRAGSearchNode(data)).toBe(true);
    });
  });

  describe('isAPIConnectorNode', () => {
    it('should return true for API connector node', () => {
      const data: FlowNodeData = {
        type: 'api_connector',
        label: 'API',
        method: 'GET',
        url: 'https://api.example.com',
        timeout: 5000,
      };
      expect(isAPIConnectorNode(data)).toBe(true);
    });
  });

  describe('isCustomCodeNode', () => {
    it('should return true for custom code node', () => {
      const data: FlowNodeData = {
        type: 'custom_code',
        label: '코드',
        code: 'return { success: true };',
        timeout: 5000,
      };
      expect(isCustomCodeNode(data)).toBe(true);
    });
  });

  describe('isParallelNode', () => {
    it('should return true for parallel node', () => {
      const data: FlowNodeData = {
        type: 'parallel',
        label: '병렬',
        branchCount: 2,
      };
      expect(isParallelNode(data)).toBe(true);
    });
  });

  describe('isJoinNode', () => {
    it('should return true for join node', () => {
      const data: FlowNodeData = {
        type: 'join',
        label: '병합',
        expectedBranches: 2,
      };
      expect(isJoinNode(data)).toBe(true);
    });
  });

  describe('isErrorFallbackNode', () => {
    it('should return true for error fallback node', () => {
      const data: FlowNodeData = {
        type: 'error_fallback',
        label: '에러 폴백',
        fallbackMessage: '오류가 발생했습니다.',
        restartOption: 'last_success',
      };
      expect(isErrorFallbackNode(data)).toBe(true);
    });
  });

  describe('isEscalationNode', () => {
    it('should return true for escalation node', () => {
      const data: FlowNodeData = {
        type: 'escalation',
        label: '상담원 연결',
      };
      expect(isEscalationNode(data)).toBe(true);
    });
  });

  describe('isApprovalNode', () => {
    it('should return true for approval node', () => {
      const data: FlowNodeData = {
        type: 'approval',
        label: '승인',
        approvalRequestInfo: '승인 요청',
        waitingMessage: '대기 중...',
      };
      expect(isApprovalNode(data)).toBe(true);
    });
  });

  describe('type guard mutual exclusivity', () => {
    it('should only match one type guard per data', () => {
      const testCases: FlowNodeData[] = [
        { type: 'start', label: '시작', triggerType: 'user_message' },
        { type: 'end', label: '종료', showSummary: false },
        { type: 'message', label: '메시지', messages: [], waitForResponse: true },
      ];

      const typeGuards = [
        isStartNode,
        isEndNode,
        isMessageNode,
        isConditionNode,
        isIntentClassifierNode,
        isRAGSearchNode,
        isAPIConnectorNode,
        isCustomCodeNode,
        isParallelNode,
        isJoinNode,
        isErrorFallbackNode,
        isEscalationNode,
        isApprovalNode,
      ];

      testCases.forEach(data => {
        const matches = typeGuards.filter(guard => guard(data));
        expect(matches).toHaveLength(1);
      });
    });
  });
});
