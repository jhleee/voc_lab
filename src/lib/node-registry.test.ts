import { describe, it, expect } from 'vitest';
import {
  NODE_REGISTRY,
  CATEGORY_LABELS,
  getNodeMetadata,
  getNodesByCategory,
  generateNodeId,
  createDefaultNodeData,
} from './node-registry';
import type { FlowNodeType } from '@/types/flow-nodes';

describe('node-registry', () => {
  describe('NODE_REGISTRY', () => {
    it('should have all 13 node types', () => {
      const expectedTypes: FlowNodeType[] = [
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

      expect(Object.keys(NODE_REGISTRY)).toHaveLength(13);
      expectedTypes.forEach(type => {
        expect(NODE_REGISTRY[type]).toBeDefined();
      });
    });

    it('should have required properties for each node type', () => {
      Object.values(NODE_REGISTRY).forEach(metadata => {
        expect(metadata).toHaveProperty('type');
        expect(metadata).toHaveProperty('category');
        expect(metadata).toHaveProperty('displayName');
        expect(metadata).toHaveProperty('icon');
        expect(metadata).toHaveProperty('color');
        expect(metadata).toHaveProperty('executionMode');
        expect(metadata).toHaveProperty('defaultData');
        expect(metadata).toHaveProperty('getHandles');
      });
    });
  });

  describe('CATEGORY_LABELS', () => {
    it('should have all category labels', () => {
      expect(CATEGORY_LABELS.basic).toBe('기본');
      expect(CATEGORY_LABELS.ai).toBe('AI');
      expect(CATEGORY_LABELS.logic).toBe('로직');
      expect(CATEGORY_LABELS.integration).toBe('통합');
      expect(CATEGORY_LABELS.hitl).toBe('상담원 연계');
    });
  });

  describe('getNodeMetadata', () => {
    it('should return metadata for valid node type', () => {
      const metadata = getNodeMetadata('start');
      expect(metadata).toBeDefined();
      expect(metadata?.type).toBe('start');
      expect(metadata?.displayName).toBe('시작');
    });

    it('should return undefined for invalid node type', () => {
      const metadata = getNodeMetadata('invalid' as FlowNodeType);
      expect(metadata).toBeUndefined();
    });
  });

  describe('getNodesByCategory', () => {
    it('should group nodes by category', () => {
      const grouped = getNodesByCategory();

      expect(grouped.basic).toBeDefined();
      expect(grouped.ai).toBeDefined();
      expect(grouped.logic).toBeDefined();
      expect(grouped.integration).toBeDefined();
      expect(grouped.hitl).toBeDefined();
    });

    it('should include start node in basic category', () => {
      const grouped = getNodesByCategory();
      const startNode = grouped.basic.find(n => n.type === 'start');
      expect(startNode).toBeDefined();
    });

    it('should include intent_classifier in ai category', () => {
      const grouped = getNodesByCategory();
      const intentNode = grouped.ai.find(n => n.type === 'intent_classifier');
      expect(intentNode).toBeDefined();
    });
  });

  describe('generateNodeId', () => {
    it('should generate unique IDs', () => {
      const id1 = generateNodeId('message');
      const id2 = generateNodeId('message');

      expect(id1).not.toBe(id2);
    });

    it('should include node type in ID', () => {
      const id = generateNodeId('condition');
      expect(id).toContain('condition');
    });
  });

  describe('createDefaultNodeData', () => {
    it('should create start node data', () => {
      const data = createDefaultNodeData('start');
      expect(data.type).toBe('start');
      expect(data.label).toBe('시작');
      expect(data).toHaveProperty('triggerType');
    });

    it('should create message node data', () => {
      const data = createDefaultNodeData('message');
      expect(data.type).toBe('message');
      expect(data.label).toBe('메시지');
      expect(data).toHaveProperty('messages');
      expect(data).toHaveProperty('waitForResponse');
    });

    it('should create condition node data', () => {
      const data = createDefaultNodeData('condition');
      expect(data.type).toBe('condition');
      expect(data).toHaveProperty('conditions');
    });

    it('should create intent_classifier node data', () => {
      const data = createDefaultNodeData('intent_classifier');
      expect(data.type).toBe('intent_classifier');
      expect(data).toHaveProperty('intents');
    });

    it('should create api_connector node data', () => {
      const data = createDefaultNodeData('api_connector');
      expect(data.type).toBe('api_connector');
      expect(data).toHaveProperty('method');
      expect(data).toHaveProperty('url');
    });

    it('should create all node types without error', () => {
      const types: FlowNodeType[] = [
        'start', 'end', 'message', 'error_fallback',
        'intent_classifier', 'rag_search', 'condition',
        'parallel', 'join', 'api_connector', 'custom_code',
        'escalation', 'approval',
      ];

      types.forEach(type => {
        expect(() => createDefaultNodeData(type)).not.toThrow();
        const data = createDefaultNodeData(type);
        expect(data.type).toBe(type);
      });
    });
  });

  describe('NODE_REGISTRY.getHandles', () => {
    it('should return handles for start node', () => {
      const data = createDefaultNodeData('start');
      const handles = NODE_REGISTRY.start.getHandles(data);

      // Start node should have source handle only (no input)
      expect(handles.some(h => h.type === 'source')).toBe(true);
      expect(handles.every(h => h.type !== 'target')).toBe(true);
    });

    it('should return handles for condition node', () => {
      const data = createDefaultNodeData('condition');
      const handles = NODE_REGISTRY.condition.getHandles(data);

      // Condition node should have both source and target handles
      expect(handles.some(h => h.type === 'source')).toBe(true);
      expect(handles.some(h => h.type === 'target')).toBe(true);
    });

    it('should return handles for end node', () => {
      const data = createDefaultNodeData('end');
      const handles = NODE_REGISTRY.end.getHandles(data);

      // End node should have target handle only (no output)
      expect(handles.some(h => h.type === 'target')).toBe(true);
      expect(handles.every(h => h.type !== 'source')).toBe(true);
    });

    it('should return handles for all node types', () => {
      const types: FlowNodeType[] = [
        'start', 'end', 'message', 'error_fallback',
        'intent_classifier', 'rag_search', 'condition',
        'parallel', 'join', 'api_connector', 'custom_code',
        'escalation', 'approval',
      ];

      types.forEach(type => {
        const data = createDefaultNodeData(type);
        const metadata = NODE_REGISTRY[type];
        expect(() => metadata.getHandles(data)).not.toThrow();
        const handles = metadata.getHandles(data);
        expect(Array.isArray(handles)).toBe(true);
      });
    });
  });
});
