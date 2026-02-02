// =============================================================================
// LLM Types
// =============================================================================
// LLM 서비스 관련 타입 정의
// =============================================================================

// -----------------------------------------------------------------------------
// Message Types
// -----------------------------------------------------------------------------

export type MessageRole = 'system' | 'user' | 'assistant';

export interface LLMMessage {
  role: MessageRole;
  content: string;
}

// -----------------------------------------------------------------------------
// Completion Options
// -----------------------------------------------------------------------------

export interface CompletionOptions {
  /** 모델 ID */
  model?: string;
  /** 최대 토큰 수 */
  maxTokens?: number;
  /** 온도 (0-2) */
  temperature?: number;
  /** Top P (0-1) */
  topP?: number;
  /** 스트리밍 여부 */
  stream?: boolean;
  /** 정지 시퀀스 */
  stop?: string[];
  /** JSON 모드 (구조화된 출력) */
  jsonMode?: boolean;
}

// -----------------------------------------------------------------------------
// Completion Result
// -----------------------------------------------------------------------------

export interface CompletionResult {
  /** 생성된 텍스트 */
  content: string;
  /** 완료 이유 */
  finishReason: 'stop' | 'length' | 'content_filter' | 'error';
  /** 사용된 토큰 수 */
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  /** 모델 ID */
  model?: string;
}

// -----------------------------------------------------------------------------
// Streaming Types
// -----------------------------------------------------------------------------

export interface StreamChunk {
  content: string;
  done: boolean;
}

export type StreamCallback = (chunk: StreamChunk) => void;

// -----------------------------------------------------------------------------
// LLM Provider Interface
// -----------------------------------------------------------------------------

export interface LLMProvider {
  /** 프로바이더 이름 */
  name: string;

  /** 텍스트 완성 */
  complete(
    messages: LLMMessage[],
    options?: CompletionOptions
  ): Promise<CompletionResult>;

  /** 스트리밍 텍스트 완성 */
  completeStream?(
    messages: LLMMessage[],
    options?: CompletionOptions,
    onChunk?: StreamCallback
  ): Promise<CompletionResult>;

  /** 사용 가능 여부 확인 */
  isAvailable(): boolean;
}

// -----------------------------------------------------------------------------
// Provider Configuration
// -----------------------------------------------------------------------------

export interface OpenAIConfig {
  apiKey: string;
  baseUrl?: string;
  defaultModel?: string;
  organization?: string;
}

export interface AnthropicConfig {
  apiKey: string;
  defaultModel?: string;
}

export type LLMConfig = OpenAIConfig | AnthropicConfig;
