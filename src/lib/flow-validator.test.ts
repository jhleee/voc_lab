import { describe, it, expect } from 'vitest';
import {
  validateFlow,
  getErrorIssues,
  getWarningIssues,
  getIssuesForNode,
} from './flow-validator';
import type { Node, Edge } from '@xyflow/react';
import type { FlowNodeData } from '@/types/flow-nodes';

// -----------------------------------------------------------------------------
// Test Helpers
// -----------------------------------------------------------------------------

function createNode(
  id: string,
  type: string,
  data?: Partial<FlowNodeData>
): Node<FlowNodeData> {
  return {
    id,
    type,
    position: { x: 0, y: 0 },
    data: {
      type,
      label: data?.label || `Node ${id}`,
      ...data,
    } as FlowNodeData,
  };
}

function createEdge(source: string, target: string): Edge {
  return {
    id: `${source}-${target}`,
    source,
    target,
  };
}

// -----------------------------------------------------------------------------
// Tests
// -----------------------------------------------------------------------------

describe('flow-validator', () => {
  describe('validateFlow', () => {
    describe('start node validation', () => {
      it('should report error when no start node exists', () => {
        const nodes = [
          createNode('msg1', 'message', {
            messages: [{ id: '1', type: 'text', content: 'test' }]
          } as any),
          createNode('end1', 'end'),
        ];
        const edges = [createEdge('msg1', 'end1')];

        const result = validateFlow(nodes, edges);

        expect(result.valid).toBe(false);
        expect(result.stats.hasStartNode).toBe(false);
        const startNodeErrors = getErrorIssues(result).filter((i) =>
          i.message.includes('시작 노드가 없습니다')
        );
        expect(startNodeErrors).toHaveLength(1);
      });

      it('should report warning when multiple start nodes exist', () => {
        const nodes = [
          createNode('start1', 'start'),
          createNode('start2', 'start'),
          createNode('end1', 'end'),
        ];
        const edges = [
          createEdge('start1', 'end1'),
          createEdge('start2', 'end1'),
        ];

        const result = validateFlow(nodes, edges);

        expect(result.stats.hasStartNode).toBe(true);
        expect(getWarningIssues(result).some((i) => i.message.includes('시작 노드가 2개'))).toBe(true);
      });
    });

    describe('end node validation', () => {
      it('should report warning when no end node exists', () => {
        const nodes = [
          createNode('start1', 'start'),
          createNode('msg1', 'message'),
        ];
        const edges = [createEdge('start1', 'msg1')];

        const result = validateFlow(nodes, edges);

        expect(result.stats.hasEndNode).toBe(false);
        expect(getWarningIssues(result).some((i) => i.message.includes('종료 노드'))).toBe(true);
      });

      it('should accept escalation as valid end node', () => {
        const nodes = [
          createNode('start1', 'start'),
          createNode('esc1', 'escalation'),
        ];
        const edges = [createEdge('start1', 'esc1')];

        const result = validateFlow(nodes, edges);

        expect(result.stats.hasEndNode).toBe(true);
      });
    });

    describe('reachability analysis', () => {
      it('should detect orphaned nodes', () => {
        const nodes = [
          createNode('start1', 'start'),
          createNode('msg1', 'message'),
          createNode('orphan', 'message', { label: '고립된 노드' }),
          createNode('end1', 'end'),
        ];
        const edges = [
          createEdge('start1', 'msg1'),
          createEdge('msg1', 'end1'),
        ];

        const result = validateFlow(nodes, edges);

        expect(result.stats.orphanedNodeCount).toBe(1);
        expect(getWarningIssues(result).some((i) => i.message.includes('도달할 수 없습니다'))).toBe(true);
      });

      it('should count all reachable nodes', () => {
        const nodes = [
          createNode('start1', 'start'),
          createNode('msg1', 'message'),
          createNode('msg2', 'message'),
          createNode('end1', 'end'),
        ];
        const edges = [
          createEdge('start1', 'msg1'),
          createEdge('msg1', 'msg2'),
          createEdge('msg2', 'end1'),
        ];

        const result = validateFlow(nodes, edges);

        expect(result.stats.reachableNodeCount).toBe(4);
        expect(result.stats.orphanedNodeCount).toBe(0);
      });
    });

    describe('path to end validation', () => {
      it('should report error when path to end is blocked', () => {
        const nodes = [
          createNode('start1', 'start'),
          createNode('msg1', 'message'),
          createNode('end1', 'end'),
        ];
        // msg1 has no outgoing edge - dead end
        const edges = [createEdge('start1', 'msg1')];

        const result = validateFlow(nodes, edges);

        expect(result.valid).toBe(false);
        expect(getErrorIssues(result).some((i) => i.message.includes('종료 노드로 도달할 수 없는'))).toBe(true);
      });

      it('should pass when all paths reach end', () => {
        const nodes = [
          createNode('start1', 'start'),
          createNode('cond1', 'condition'),
          createNode('msg1', 'message'),
          createNode('msg2', 'message'),
          createNode('end1', 'end'),
        ];
        const edges = [
          createEdge('start1', 'cond1'),
          createEdge('cond1', 'msg1'),
          createEdge('cond1', 'msg2'),
          createEdge('msg1', 'end1'),
          createEdge('msg2', 'end1'),
        ];

        const result = validateFlow(nodes, edges);

        expect(getErrorIssues(result).filter((i) => i.message.includes('종료 노드로 도달'))).toHaveLength(0);
      });
    });

    describe('dead end detection', () => {
      it('should warn about nodes with no outgoing edges', () => {
        const nodes = [
          createNode('start1', 'start'),
          createNode('msg1', 'message'),
          createNode('end1', 'end'),
        ];
        // msg1 has no outgoing connection
        const edges = [
          createEdge('start1', 'msg1'),
          createEdge('start1', 'end1'),
        ];

        const result = validateFlow(nodes, edges);

        expect(getWarningIssues(result).some((i) =>
          i.message.includes('나가는 연결이 없습니다') && i.nodeId === 'msg1'
        )).toBe(true);
      });
    });

    describe('required field validation', () => {
      it('should warn about empty node labels', () => {
        const nodes = [
          createNode('start1', 'start', { label: '' }),
          createNode('end1', 'end'),
        ];
        const edges = [createEdge('start1', 'end1')];

        const result = validateFlow(nodes, edges);

        expect(getWarningIssues(result).some((i) => i.message.includes('이름이 없습니다'))).toBe(true);
      });

      it('should error when message node has no messages', () => {
        const nodes = [
          createNode('start1', 'start'),
          createNode('msg1', 'message', { messages: [] } as any),
          createNode('end1', 'end'),
        ];
        const edges = [
          createEdge('start1', 'msg1'),
          createEdge('msg1', 'end1'),
        ];

        const result = validateFlow(nodes, edges);

        expect(getErrorIssues(result).some((i) =>
          i.message.includes('메시지가 없습니다') && i.nodeId === 'msg1'
        )).toBe(true);
      });

      it('should error when API connector has no URL', () => {
        const nodes = [
          createNode('start1', 'start'),
          createNode('api1', 'api_connector', { url: '' } as any),
          createNode('end1', 'end'),
        ];
        const edges = [
          createEdge('start1', 'api1'),
          createEdge('api1', 'end1'),
        ];

        const result = validateFlow(nodes, edges);

        expect(getErrorIssues(result).some((i) =>
          i.message.includes('URL이 없습니다') && i.nodeId === 'api1'
        )).toBe(true);
      });

      it('should warn when condition node has no conditions', () => {
        const nodes = [
          createNode('start1', 'start'),
          createNode('cond1', 'condition', { conditions: [] } as any),
          createNode('end1', 'end'),
        ];
        const edges = [
          createEdge('start1', 'cond1'),
          createEdge('cond1', 'end1'),
        ];

        const result = validateFlow(nodes, edges);

        expect(getWarningIssues(result).some((i) =>
          i.message.includes('조건이 정의되지 않았습니다')
        )).toBe(true);
      });
    });

    describe('valid flow', () => {
      it('should return valid for a well-formed flow', () => {
        const nodes = [
          createNode('start1', 'start', { label: '시작' }),
          createNode('msg1', 'message', {
            label: '인사',
            messages: [{ id: '1', type: 'text', content: '안녕하세요' }]
          } as any),
          createNode('end1', 'end', { label: '종료' }),
        ];
        const edges = [
          createEdge('start1', 'msg1'),
          createEdge('msg1', 'end1'),
        ];

        const result = validateFlow(nodes, edges);

        expect(result.valid).toBe(true);
        expect(result.stats.nodeCount).toBe(3);
        expect(result.stats.edgeCount).toBe(2);
        expect(result.stats.hasStartNode).toBe(true);
        expect(result.stats.hasEndNode).toBe(true);
        expect(result.stats.orphanedNodeCount).toBe(0);
      });
    });
  });

  describe('helper functions', () => {
    it('getIssuesForNode should filter by nodeId', () => {
      const nodes = [
        createNode('start1', 'start'),
        createNode('msg1', 'message', { messages: [] } as any),
        createNode('api1', 'api_connector', { url: '' } as any),
        createNode('end1', 'end'),
      ];
      const edges = [
        createEdge('start1', 'msg1'),
        createEdge('msg1', 'api1'),
        createEdge('api1', 'end1'),
      ];

      const result = validateFlow(nodes, edges);
      const msg1Issues = getIssuesForNode(result, 'msg1');
      const api1Issues = getIssuesForNode(result, 'api1');

      expect(msg1Issues.every((i) => i.nodeId === 'msg1')).toBe(true);
      expect(api1Issues.every((i) => i.nodeId === 'api1')).toBe(true);
    });
  });
});
