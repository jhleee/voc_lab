import { describe, it, expect } from 'vitest';
import { validateConnection, isValidConnection } from './edge-validator';
import type { Node, Edge, Connection } from '@xyflow/react';
import type { FlowNodeData } from '@/types/flow-nodes';

// -----------------------------------------------------------------------------
// Test Helpers
// -----------------------------------------------------------------------------

function createNode(id: string, type: string): Node<FlowNodeData> {
  return {
    id,
    type,
    position: { x: 0, y: 0 },
    data: { type, label: `Node ${id}` } as FlowNodeData,
  };
}

function createEdge(source: string, target: string): Edge {
  return {
    id: `${source}-${target}`,
    source,
    target,
  };
}

function createConnection(source: string, target: string): Connection {
  return {
    source,
    target,
    sourceHandle: null,
    targetHandle: null,
  };
}

// -----------------------------------------------------------------------------
// Tests
// -----------------------------------------------------------------------------

describe('edge-validator', () => {
  describe('validateConnection', () => {
    describe('self-connection', () => {
      it('should reject connection to self', () => {
        const nodes = [createNode('node1', 'message')];
        const edges: Edge[] = [];
        const connection = createConnection('node1', 'node1');

        const result = validateConnection(connection, nodes, edges);

        expect(result.valid).toBe(false);
        expect(result.reason).toContain('자기 자신');
      });
    });

    describe('node existence', () => {
      it('should reject connection when source node not found', () => {
        const nodes = [createNode('node2', 'message')];
        const edges: Edge[] = [];
        const connection = createConnection('node1', 'node2');

        const result = validateConnection(connection, nodes, edges);

        expect(result.valid).toBe(false);
        expect(result.reason).toContain('찾을 수 없습니다');
      });

      it('should reject connection when target node not found', () => {
        const nodes = [createNode('node1', 'message')];
        const edges: Edge[] = [];
        const connection = createConnection('node1', 'node2');

        const result = validateConnection(connection, nodes, edges);

        expect(result.valid).toBe(false);
        expect(result.reason).toContain('찾을 수 없습니다');
      });
    });

    describe('node type rules', () => {
      it('should reject output from start node when already connected', () => {
        const nodes = [
          createNode('start1', 'start'),
          createNode('msg1', 'message'),
          createNode('msg2', 'message'),
        ];
        const edges = [createEdge('start1', 'msg1')];
        const connection = createConnection('start1', 'msg2');

        const result = validateConnection(connection, nodes, edges);

        expect(result.valid).toBe(false);
        expect(result.reason).toContain('최대');
      });

      it('should reject input to start node', () => {
        const nodes = [
          createNode('msg1', 'message'),
          createNode('start1', 'start'),
        ];
        const edges: Edge[] = [];
        const connection = createConnection('msg1', 'start1');

        const result = validateConnection(connection, nodes, edges);

        expect(result.valid).toBe(false);
        expect(result.reason).toContain('입력 연결을 허용하지 않습니다');
      });

      it('should reject output from end node', () => {
        const nodes = [
          createNode('end1', 'end'),
          createNode('msg1', 'message'),
        ];
        const edges: Edge[] = [];
        const connection = createConnection('end1', 'msg1');

        const result = validateConnection(connection, nodes, edges);

        expect(result.valid).toBe(false);
        expect(result.reason).toContain('출력 연결을 허용하지 않습니다');
      });

      it('should reject output from escalation node', () => {
        const nodes = [
          createNode('esc1', 'escalation'),
          createNode('msg1', 'message'),
        ];
        const edges: Edge[] = [];
        const connection = createConnection('esc1', 'msg1');

        const result = validateConnection(connection, nodes, edges);

        expect(result.valid).toBe(false);
        expect(result.reason).toContain('출력 연결을 허용하지 않습니다');
      });
    });

    describe('duplicate connections', () => {
      it('should reject duplicate connection', () => {
        const nodes = [
          createNode('node1', 'message'),
          createNode('node2', 'message'),
        ];
        const edges = [createEdge('node1', 'node2')];
        const connection = createConnection('node1', 'node2');

        const result = validateConnection(connection, nodes, edges);

        expect(result.valid).toBe(false);
        expect(result.reason).toContain('이미 연결');
      });
    });

    describe('bidirectional connections', () => {
      it('should reject reverse connection', () => {
        const nodes = [
          createNode('node1', 'message'),
          createNode('node2', 'message'),
        ];
        const edges = [createEdge('node1', 'node2')];
        const connection = createConnection('node2', 'node1');

        const result = validateConnection(connection, nodes, edges);

        expect(result.valid).toBe(false);
        expect(result.reason).toContain('양방향');
      });
    });

    describe('valid connections', () => {
      it('should allow valid connection between message nodes', () => {
        const nodes = [
          createNode('node1', 'message'),
          createNode('node2', 'message'),
        ];
        const edges: Edge[] = [];
        const connection = createConnection('node1', 'node2');

        const result = validateConnection(connection, nodes, edges);

        expect(result.valid).toBe(true);
        expect(result.reason).toBeUndefined();
      });

      it('should allow valid connection from start to message', () => {
        const nodes = [
          createNode('start1', 'start'),
          createNode('msg1', 'message'),
        ];
        const edges: Edge[] = [];
        const connection = createConnection('start1', 'msg1');

        const result = validateConnection(connection, nodes, edges);

        expect(result.valid).toBe(true);
      });

      it('should allow valid connection from message to end', () => {
        const nodes = [
          createNode('msg1', 'message'),
          createNode('end1', 'end'),
        ];
        const edges: Edge[] = [];
        const connection = createConnection('msg1', 'end1');

        const result = validateConnection(connection, nodes, edges);

        expect(result.valid).toBe(true);
      });

      it('should allow multiple outputs from condition node', () => {
        const nodes = [
          createNode('cond1', 'condition'),
          createNode('msg1', 'message'),
          createNode('msg2', 'message'),
          createNode('msg3', 'message'),
        ];
        const edges = [
          createEdge('cond1', 'msg1'),
          createEdge('cond1', 'msg2'),
        ];
        const connection = createConnection('cond1', 'msg3');

        const result = validateConnection(connection, nodes, edges);

        expect(result.valid).toBe(true);
      });
    });
  });

  describe('isValidConnection', () => {
    it('should return true for valid connection', () => {
      const nodes = [
        createNode('node1', 'message'),
        createNode('node2', 'message'),
      ];
      const edges: Edge[] = [];
      const connection = createConnection('node1', 'node2');

      expect(isValidConnection(connection, nodes, edges)).toBe(true);
    });

    it('should return false for invalid connection', () => {
      const nodes = [createNode('node1', 'message')];
      const edges: Edge[] = [];
      const connection = createConnection('node1', 'node1');

      expect(isValidConnection(connection, nodes, edges)).toBe(false);
    });
  });
});
