// =============================================================================
// API Connector Helper
// =============================================================================
// HTTP API 호출 로직
// =============================================================================

import type { APIConnectorNodeData, AuthConfig, RetryPolicy } from '@/types/flow-nodes';
import type { FlowVariables } from '@/types/variables';
import { interpolateVariables } from '@/lib/variable-resolver';

// -----------------------------------------------------------------------------
// Types
// -----------------------------------------------------------------------------

export interface APICallResult {
  success: boolean;
  statusCode: number;
  response: unknown;
  headers?: Record<string, string>;
  error?: string;
  duration: number;
}

// -----------------------------------------------------------------------------
// API Call
// -----------------------------------------------------------------------------

/**
 * API 호출을 실행합니다.
 */
export async function executeAPICall(
  config: APIConnectorNodeData,
  variables: FlowVariables
): Promise<APICallResult> {
  const startTime = Date.now();

  try {
    // URL 변수 치환
    const url = interpolate(config.url, variables);

    // Headers 준비
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    // 변수 치환된 헤더 추가
    for (const [key, value] of Object.entries(config.headers || {})) {
      headers[key] = interpolate(value, variables);
    }

    // 인증 헤더 추가
    applyAuth(headers, config.auth, variables);

    // Body 준비
    let body: string | undefined;
    if (config.body && config.method !== 'GET') {
      body = interpolate(config.body, variables);
    }

    // 재시도 로직
    const retryPolicy = config.retryPolicy || { maxRetries: 0, retryDelay: 1000 };
    let lastError: Error | null = null;

    for (let attempt = 0; attempt <= retryPolicy.maxRetries; attempt++) {
      try {
        const response = await fetch(url, {
          method: config.method,
          headers,
          body,
        });

        // 응답 파싱
        let responseData: unknown;
        const contentType = response.headers.get('content-type') || '';

        if (contentType.includes('application/json')) {
          responseData = await response.json();
        } else {
          responseData = await response.text();
        }

        // 응답 헤더 수집
        const responseHeaders: Record<string, string> = {};
        response.headers.forEach((value, key) => {
          responseHeaders[key] = value;
        });

        // JSONPath 매핑 (선택사항)
        let mappedResponse = responseData;
        if (config.responseMapping && typeof responseData === 'object') {
          mappedResponse = extractByPath(responseData, config.responseMapping);
        }

        return {
          success: response.ok,
          statusCode: response.status,
          response: mappedResponse,
          headers: responseHeaders,
          duration: Date.now() - startTime,
        };
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));

        // 재시도 대기
        if (attempt < retryPolicy.maxRetries) {
          await sleep(retryPolicy.retryDelay * Math.pow(2, attempt)); // Exponential backoff
        }
      }
    }

    return {
      success: false,
      statusCode: 0,
      response: null,
      error: lastError?.message || 'API call failed',
      duration: Date.now() - startTime,
    };
  } catch (error) {
    return {
      success: false,
      statusCode: 0,
      response: null,
      error: error instanceof Error ? error.message : 'Unknown error',
      duration: Date.now() - startTime,
    };
  }
}

// -----------------------------------------------------------------------------
// Helper Functions
// -----------------------------------------------------------------------------

function interpolate(text: string, variables: FlowVariables): string {
  const result = interpolateVariables(text, variables);
  return result.result;
}

function applyAuth(
  headers: Record<string, string>,
  auth: AuthConfig,
  variables: FlowVariables
): void {
  if (!auth || auth.type === 'none') {
    return;
  }

  switch (auth.type) {
    case 'api_key':
      if (auth.apiKey) {
        const headerName = auth.headerName || 'X-API-Key';
        headers[headerName] = interpolate(auth.apiKey, variables);
      }
      break;

    case 'bearer':
      if (auth.token) {
        headers['Authorization'] = `Bearer ${interpolate(auth.token, variables)}`;
      }
      break;

    case 'basic':
      if (auth.username && auth.password) {
        const credentials = btoa(
          `${interpolate(auth.username, variables)}:${interpolate(auth.password, variables)}`
        );
        headers['Authorization'] = `Basic ${credentials}`;
      }
      break;

    case 'oauth2':
      // OAuth2는 token 필드 사용 (액세스 토큰 저장)
      if (auth.token) {
        headers['Authorization'] = `Bearer ${interpolate(auth.token, variables)}`;
      }
      break;
  }
}

function extractByPath(obj: unknown, path: string): unknown {
  // 간단한 JSONPath 구현 (예: $.data.items[0].name)
  if (!path || path === '$') {
    return obj;
  }

  // $. 접두사 제거
  const normalizedPath = path.startsWith('$.') ? path.slice(2) : path;
  const parts = normalizedPath.split(/\.|\[|\]/).filter(Boolean);

  let current: unknown = obj;

  for (const part of parts) {
    if (current === null || current === undefined) {
      return undefined;
    }

    if (Array.isArray(current)) {
      const index = parseInt(part, 10);
      if (isNaN(index)) {
        return undefined;
      }
      current = current[index];
    } else if (typeof current === 'object') {
      current = (current as Record<string, unknown>)[part];
    } else {
      return undefined;
    }
  }

  return current;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
