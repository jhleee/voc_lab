// =============================================================================
// LLM Service
// =============================================================================
// LLM 프로바이더를 관리하고 통합 API 제공
// =============================================================================

import type {
  LLMProvider,
  LLMMessage,
  CompletionOptions,
  CompletionResult,
  StreamCallback,
} from './types';
import { createOpenAIProvider } from './openai-provider';

// -----------------------------------------------------------------------------
// LLM Service
// -----------------------------------------------------------------------------

class LLMService {
  private provider: LLMProvider | null = null;
  private initialized = false;

  /**
   * LLM 서비스 초기화
   */
  initialize(apiKey?: string, baseUrl?: string): void {
    const key = apiKey || process.env.OPENAI_API_KEY || '';

    if (!key) {
      console.warn('LLM API key not configured. LLM features will be disabled.');
      this.provider = null;
      this.initialized = true;
      return;
    }

    this.provider = createOpenAIProvider({
      apiKey: key,
      baseUrl: baseUrl || process.env.OPENAI_BASE_URL,
      defaultModel: process.env.OPENAI_MODEL || 'gpt-4o-mini',
    });

    this.initialized = true;
  }

  /**
   * 사용 가능 여부
   */
  isAvailable(): boolean {
    if (!this.initialized) {
      this.initialize();
    }
    return this.provider?.isAvailable() ?? false;
  }

  /**
   * 텍스트 완성
   */
  async complete(
    messages: LLMMessage[],
    options?: CompletionOptions
  ): Promise<CompletionResult> {
    if (!this.initialized) {
      this.initialize();
    }

    if (!this.provider) {
      return {
        content: '[LLM 서비스가 설정되지 않았습니다. OPENAI_API_KEY 환경 변수를 확인하세요.]',
        finishReason: 'error',
      };
    }

    return this.provider.complete(messages, options);
  }

  /**
   * 스트리밍 텍스트 완성
   */
  async completeStream(
    messages: LLMMessage[],
    options?: CompletionOptions,
    onChunk?: StreamCallback
  ): Promise<CompletionResult> {
    if (!this.initialized) {
      this.initialize();
    }

    if (!this.provider) {
      return {
        content: '[LLM 서비스가 설정되지 않았습니다.]',
        finishReason: 'error',
      };
    }

    if (this.provider.completeStream) {
      return this.provider.completeStream(messages, options, onChunk);
    }

    // Fallback to non-streaming
    return this.provider.complete(messages, options);
  }

  /**
   * 간단한 텍스트 생성
   */
  async generate(
    prompt: string,
    systemPrompt?: string,
    options?: CompletionOptions
  ): Promise<string> {
    const messages: LLMMessage[] = [];

    if (systemPrompt) {
      messages.push({ role: 'system', content: systemPrompt });
    }

    messages.push({ role: 'user', content: prompt });

    const result = await this.complete(messages, options);
    return result.content;
  }

  /**
   * JSON 응답 생성
   */
  async generateJSON<T = unknown>(
    prompt: string,
    systemPrompt?: string,
    options?: CompletionOptions
  ): Promise<T | null> {
    const result = await this.generate(prompt, systemPrompt, {
      ...options,
      jsonMode: true,
    });

    try {
      return JSON.parse(result) as T;
    } catch {
      console.error('Failed to parse LLM JSON response:', result);
      return null;
    }
  }
}

// -----------------------------------------------------------------------------
// Singleton Instance
// -----------------------------------------------------------------------------

let llmServiceInstance: LLMService | null = null;

export function getLLMService(): LLMService {
  if (!llmServiceInstance) {
    llmServiceInstance = new LLMService();
  }
  return llmServiceInstance;
}

// For testing
export function createLLMService(): LLMService {
  return new LLMService();
}

// Re-export types
export type { LLMMessage, CompletionOptions, CompletionResult };
