// =============================================================================
// Variable Resolver
// =============================================================================
// 변수 참조 파싱, 해석, 보간 기능
// 형식: {{scope.path}} (e.g., {{session.userName}}, {{nodes.api_1.output}})
// =============================================================================

import type {
  FlowVariables,
  VariableReference,
  VariableValue,
  VariableValidationError,
  VariableValidationErrorType,
  VariableScope,
  InterpolationResult,
  AvailableVariable,
} from '@/types/variables';

// -----------------------------------------------------------------------------
// Constants
// -----------------------------------------------------------------------------

const VARIABLE_REGEX = /\{\{([^}]+)\}\}/g;
const VALID_SCOPES: VariableScope[] = ['system', 'session', 'nodes'];

// -----------------------------------------------------------------------------
// Parse Variable Reference
// -----------------------------------------------------------------------------

/**
 * 변수 참조 문자열을 파싱합니다.
 * @param ref 변수 참조 문자열 (e.g., "{{session.userName}}")
 * @returns 파싱된 VariableReference 또는 null
 */
export function parseVariableReference(ref: string): VariableReference | null {
  const match = ref.match(/^\{\{(.+)\}\}$/);
  if (!match) return null;

  const fullPath = match[1].trim();
  const [scope, ...pathParts] = fullPath.split('.');

  if (!VALID_SCOPES.includes(scope as VariableScope)) {
    return null;
  }

  return {
    raw: ref,
    scope: scope as VariableScope,
    path: pathParts.join('.'),
    fullPath,
  };
}

// -----------------------------------------------------------------------------
// Extract Variable References
// -----------------------------------------------------------------------------

/**
 * 텍스트에서 모든 변수 참조를 추출합니다.
 * @param text 변수 참조를 포함한 텍스트
 * @returns 변수 참조 배열
 */
export function extractVariableReferences(text: string): VariableReference[] {
  const matches = text.match(VARIABLE_REGEX) || [];
  return matches
    .map(parseVariableReference)
    .filter((ref): ref is VariableReference => ref !== null);
}

// -----------------------------------------------------------------------------
// Resolve Variable Value
// -----------------------------------------------------------------------------

/**
 * 객체에서 중첩된 경로의 값을 가져옵니다.
 * @param obj 대상 객체
 * @param path 점으로 구분된 경로 (e.g., "user.profile.name")
 * @returns 해당 경로의 값 또는 undefined
 */
function getNestedValue(obj: unknown, path: string): VariableValue | undefined {
  if (!path) return obj as VariableValue;

  const parts = path.split('.');
  let current: unknown = obj;

  for (const part of parts) {
    if (current === null || current === undefined) {
      return undefined;
    }
    if (typeof current !== 'object') {
      return undefined;
    }
    current = (current as Record<string, unknown>)[part];
  }

  return current as VariableValue;
}

/**
 * 변수 참조를 해석하여 값을 반환합니다.
 * @param variables 플로우 변수 컨텍스트
 * @param reference 변수 참조
 * @returns 해석된 값 또는 undefined
 */
export function resolveVariableValue(
  variables: FlowVariables,
  reference: VariableReference
): VariableValue | undefined {
  const scopeData = variables[reference.scope];
  if (!scopeData) return undefined;

  return getNestedValue(scopeData, reference.path);
}

// -----------------------------------------------------------------------------
// Validate Variable References
// -----------------------------------------------------------------------------

/**
 * 텍스트 내 변수 참조들의 유효성을 검사합니다.
 * @param text 변수 참조를 포함한 텍스트
 * @param variables 플로우 변수 컨텍스트
 * @returns 검증 에러 배열
 */
export function validateVariableReferences(
  text: string,
  variables: FlowVariables
): VariableValidationError[] {
  const errors: VariableValidationError[] = [];
  let match: RegExpExecArray | null;

  // Reset regex lastIndex
  VARIABLE_REGEX.lastIndex = 0;

  while ((match = VARIABLE_REGEX.exec(text)) !== null) {
    const raw = match[0];
    const position = { start: match.index, end: match.index + raw.length };

    const ref = parseVariableReference(raw);

    if (!ref) {
      errors.push({
        reference: raw,
        errorType: 'INVALID_SYNTAX',
        message: `잘못된 변수 구문입니다: ${raw}`,
        position,
      });
      continue;
    }

    if (!VALID_SCOPES.includes(ref.scope)) {
      errors.push({
        reference: raw,
        errorType: 'INVALID_SCOPE',
        message: `유효하지 않은 스코프입니다: ${ref.scope}. 사용 가능: system, session, nodes`,
        position,
      });
      continue;
    }

    const value = resolveVariableValue(variables, ref);
    if (value === undefined) {
      errors.push({
        reference: raw,
        errorType: 'PATH_NOT_FOUND',
        message: `변수를 찾을 수 없습니다: ${ref.fullPath}`,
        position,
      });
    }
  }

  return errors;
}

// -----------------------------------------------------------------------------
// Interpolate Variables
// -----------------------------------------------------------------------------

/**
 * 텍스트 내 변수 참조를 실제 값으로 치환합니다.
 * @param text 변수 참조를 포함한 텍스트
 * @param variables 플로우 변수 컨텍스트
 * @returns 보간 결과
 */
export function interpolateVariables(
  text: string,
  variables: FlowVariables
): InterpolationResult {
  const references: VariableReference[] = [];
  const errors: VariableValidationError[] = [];

  const result = text.replace(VARIABLE_REGEX, (match, _) => {
    const ref = parseVariableReference(match);

    if (!ref) {
      errors.push({
        reference: match,
        errorType: 'INVALID_SYNTAX',
        message: `잘못된 변수 구문입니다: ${match}`,
      });
      return match;
    }

    references.push(ref);

    const value = resolveVariableValue(variables, ref);

    if (value === undefined) {
      errors.push({
        reference: match,
        errorType: 'PATH_NOT_FOUND',
        message: `변수를 찾을 수 없습니다: ${ref.fullPath}`,
      });
      return match;
    }

    // 값을 문자열로 변환
    if (typeof value === 'object') {
      return JSON.stringify(value);
    }
    return String(value);
  });

  return {
    result,
    references,
    errors,
    success: errors.length === 0,
  };
}

// -----------------------------------------------------------------------------
// Get Available Variables
// -----------------------------------------------------------------------------

/**
 * 사용 가능한 모든 변수 목록을 반환합니다.
 * @param variables 플로우 변수 컨텍스트
 * @returns 사용 가능한 변수 배열
 */
export function getAvailableVariables(variables: FlowVariables): AvailableVariable[] {
  const available: AvailableVariable[] = [];

  // Helper: 값의 타입 문자열 반환
  const getValueType = (value: VariableValue): AvailableVariable['valueType'] => {
    if (value === null) return 'null';
    if (value === undefined) return 'null';
    if (Array.isArray(value)) return 'array';
    if (typeof value === 'object') return 'object';
    if (typeof value === 'number') return 'number';
    if (typeof value === 'boolean') return 'boolean';
    return 'string';
  };

  // Helper: 객체를 평탄화하여 변수 목록 생성
  const flattenObject = (
    obj: Record<string, VariableValue>,
    scope: VariableScope,
    prefix: string = '',
    nodeLabel?: string
  ) => {
    Object.entries(obj).forEach(([key, value]) => {
      // 내부 속성 스킵
      if (key.startsWith('_')) return;

      const fullKey = prefix ? `${prefix}.${key}` : key;

      if (value !== null && typeof value === 'object' && !Array.isArray(value)) {
        // 중첩 객체는 재귀 처리
        flattenObject(value as Record<string, VariableValue>, scope, fullKey, nodeLabel);
      } else {
        available.push({
          scope,
          path: fullKey,
          label: `${scope}.${fullKey}`,
          value,
          valueType: getValueType(value),
          nodeLabel,
        });
      }
    });
  };

  // System variables
  flattenObject(variables.system as Record<string, VariableValue>, 'system');

  // Session variables
  flattenObject(variables.session as Record<string, VariableValue>, 'session');

  // Node variables
  Object.entries(variables.nodes).forEach(([nodeId, nodeVar]) => {
    available.push({
      scope: 'nodes',
      path: `${nodeId}.output`,
      label: `nodes.${nodeVar.nodeLabel || nodeId}.output`,
      value: nodeVar.output,
      valueType: getValueType(nodeVar.output),
      nodeLabel: nodeVar.nodeLabel,
      description: `${nodeVar.nodeLabel || nodeId} 노드의 출력값`,
    });
  });

  return available;
}

// -----------------------------------------------------------------------------
// Utility Functions
// -----------------------------------------------------------------------------

/**
 * 변수 참조 문자열인지 확인합니다.
 * @param text 확인할 텍스트
 * @returns 변수 참조 포함 여부
 */
export function containsVariableReference(text: string): boolean {
  return VARIABLE_REGEX.test(text);
}

/**
 * 변수 참조를 생성합니다.
 * @param scope 스코프
 * @param path 경로
 * @returns 변수 참조 문자열
 */
export function createVariableReference(scope: VariableScope, path: string): string {
  return `{{${scope}.${path}}}`;
}
