import { describe, it, expect } from 'vitest';
import {
  parseVariableReference,
  extractVariableReferences,
  resolveVariableValue,
  validateVariableReferences,
  interpolateVariables,
  getAvailableVariables,
} from './variable-resolver';
import type { FlowVariables } from '@/types/variables';

describe('variable-resolver', () => {
  const mockVariables: FlowVariables = {
    system: {
      apiUrl: 'https://api.example.com',
      botName: '테스트봇',
      botId: 'bot-123',
      projectId: 'proj-456',
      language: 'ko',
      timezone: 'Asia/Seoul',
      botVersion: '1.0.0',
      channel: 'chat',
    },
    session: {
      sessionId: 'sess-789',
      startTime: '2024-01-01T00:00:00Z',
      userId: 'user-001',
      userName: '홍길동',
      lastUserInput: '안녕하세요',
      metadata: {
        customField: 'customValue',
      },
    },
    nodes: {
      'node-1': {
        nodeId: 'node-1',
        nodeLabel: '의도 분류',
        nodeType: 'intent_classifier',
        output: { intent: 'greeting', confidence: 0.95 },
        executedAt: '2024-01-01T00:01:00Z',
        success: true,
      },
    },
  };

  describe('parseVariableReference', () => {
    it('should parse valid system variable reference', () => {
      const result = parseVariableReference('{{system.botName}}');
      expect(result).not.toBeNull();
      expect(result?.scope).toBe('system');
      expect(result?.path).toBe('botName');
      expect(result?.fullPath).toBe('system.botName');
    });

    it('should parse valid session variable reference', () => {
      const result = parseVariableReference('{{session.userName}}');
      expect(result).not.toBeNull();
      expect(result?.scope).toBe('session');
      expect(result?.path).toBe('userName');
    });

    it('should parse valid nodes variable reference', () => {
      const result = parseVariableReference('{{nodes.node-1.output}}');
      expect(result).not.toBeNull();
      expect(result?.scope).toBe('nodes');
      expect(result?.path).toBe('node-1.output');
    });

    it('should return null for invalid reference', () => {
      expect(parseVariableReference('invalid')).toBeNull();
      expect(parseVariableReference('{{invalid}}')).toBeNull();
      expect(parseVariableReference('{system.botName}')).toBeNull();
    });

    it('should handle nested paths', () => {
      const result = parseVariableReference('{{session.metadata.customField}}');
      expect(result?.scope).toBe('session');
      expect(result?.path).toBe('metadata.customField');
    });
  });

  describe('extractVariableReferences', () => {
    it('should extract single reference', () => {
      const refs = extractVariableReferences('Hello {{session.userName}}!');
      expect(refs).toHaveLength(1);
      expect(refs[0].scope).toBe('session');
      expect(refs[0].path).toBe('userName');
    });

    it('should extract multiple references', () => {
      const text = '{{system.botName}}: {{session.userName}}님 안녕하세요!';
      const refs = extractVariableReferences(text);
      expect(refs).toHaveLength(2);
    });

    it('should return empty array for no references', () => {
      const refs = extractVariableReferences('No variables here');
      expect(refs).toHaveLength(0);
    });

    it('should handle duplicate references', () => {
      const text = '{{session.userName}} {{session.userName}}';
      const refs = extractVariableReferences(text);
      expect(refs).toHaveLength(2);
    });
  });

  describe('resolveVariableValue', () => {
    it('should resolve system variable', () => {
      const ref = parseVariableReference('{{system.botName}}')!;
      const value = resolveVariableValue(mockVariables, ref);
      expect(value).toBe('테스트봇');
    });

    it('should resolve session variable', () => {
      const ref = parseVariableReference('{{session.userName}}')!;
      const value = resolveVariableValue(mockVariables, ref);
      expect(value).toBe('홍길동');
    });

    it('should resolve nested session variable', () => {
      const ref = parseVariableReference('{{session.metadata.customField}}')!;
      const value = resolveVariableValue(mockVariables, ref);
      expect(value).toBe('customValue');
    });

    it('should resolve nodes variable', () => {
      const ref = parseVariableReference('{{nodes.node-1.nodeLabel}}')!;
      const value = resolveVariableValue(mockVariables, ref);
      expect(value).toBe('의도 분류');
    });

    it('should return undefined for non-existent path', () => {
      const ref = parseVariableReference('{{session.nonExistent}}')!;
      const value = resolveVariableValue(mockVariables, ref);
      expect(value).toBeUndefined();
    });
  });

  describe('validateVariableReferences', () => {
    it('should return no errors for valid references', () => {
      const text = '{{system.botName}} {{session.userName}}';
      const errors = validateVariableReferences(text, mockVariables);
      expect(errors).toHaveLength(0);
    });

    it('should return error for non-existent variable', () => {
      const text = '{{session.nonExistent}}';
      const errors = validateVariableReferences(text, mockVariables);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].errorType).toBe('PATH_NOT_FOUND');
    });

    it('should return error for invalid scope', () => {
      const text = '{{invalid.variable}}';
      const errors = validateVariableReferences(text, mockVariables);
      expect(errors.length).toBeGreaterThan(0);
    });
  });

  describe('interpolateVariables', () => {
    it('should interpolate single variable', () => {
      const result = interpolateVariables('Hello {{session.userName}}!', mockVariables);
      expect(result.result).toBe('Hello 홍길동!');
      expect(result.success).toBe(true);
    });

    it('should interpolate multiple variables', () => {
      const result = interpolateVariables(
        '{{system.botName}}: {{session.userName}}님 안녕하세요!',
        mockVariables
      );
      expect(result.result).toBe('테스트봇: 홍길동님 안녕하세요!');
      expect(result.success).toBe(true);
    });

    it('should keep original reference when not found', () => {
      const result = interpolateVariables('Hello {{session.unknown}}!', mockVariables);
      expect(result.result).toContain('{{session.unknown}}');
      expect(result.success).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('should handle text without variables', () => {
      const result = interpolateVariables('No variables here', mockVariables);
      expect(result.result).toBe('No variables here');
      expect(result.success).toBe(true);
      expect(result.references).toHaveLength(0);
    });
  });

  describe('getAvailableVariables', () => {
    it('should return all available variables', () => {
      const available = getAvailableVariables(mockVariables);
      expect(available.length).toBeGreaterThan(0);
    });

    it('should include system variables', () => {
      const available = getAvailableVariables(mockVariables);
      const systemVars = available.filter(v => v.scope === 'system');
      expect(systemVars.length).toBeGreaterThan(0);
      expect(systemVars.some(v => v.path === 'botName')).toBe(true);
    });

    it('should include session variables', () => {
      const available = getAvailableVariables(mockVariables);
      const sessionVars = available.filter(v => v.scope === 'session');
      expect(sessionVars.length).toBeGreaterThan(0);
      expect(sessionVars.some(v => v.path === 'userName')).toBe(true);
    });

    it('should include nodes variables', () => {
      const available = getAvailableVariables(mockVariables);
      const nodesVars = available.filter(v => v.scope === 'nodes');
      expect(nodesVars.length).toBeGreaterThan(0);
    });
  });
});
