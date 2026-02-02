// =============================================================================
// OpenAI Compatible LLM Provider
// =============================================================================
// OpenAI API 호환 프로바이더 (OpenAI, Azure, local 등)
// =============================================================================

import type {
  LLMProvider,
  LLMMessage,
  CompletionOptions,
  CompletionResult,
  StreamCallback,
  OpenAIConfig,
} from './types';

// -----------------------------------------------------------------------------
// OpenAI Provider
// -----------------------------------------------------------------------------

export class OpenAIProvider implements LLMProvider {
  name = 'openai';
  private config: OpenAIConfig;

  constructor(config: OpenAIConfig) {
    this.config = {
      baseUrl: 'https://api.openai.com/v1',
      defaultModel: 'gpt-4o-mini',
      ...config,
    };
  }

  isAvailable(): boolean {
    return Boolean(this.config.apiKey);
  }

  async complete(
    messages: LLMMessage[],
    options: CompletionOptions = {}
  ): Promise<CompletionResult> {
    if (!this.isAvailable()) {
      throw new Error('OpenAI API key not configured');
    }

    const model = options.model || this.config.defaultModel || 'gpt-4o-mini';

    const requestBody: Record<string, unknown> = {
      model,
      messages: messages.map((m) => ({
        role: m.role,
        content: m.content,
      })),
      max_tokens: options.maxTokens || 1024,
      temperature: options.temperature ?? 0.7,
    };

    if (options.topP !== undefined) {
      requestBody.top_p = options.topP;
    }

    if (options.stop) {
      requestBody.stop = options.stop;
    }

    if (options.jsonMode) {
      requestBody.response_format = { type: 'json_object' };
    }

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${this.config.apiKey}`,
    };

    if (this.config.organization) {
      headers['OpenAI-Organization'] = this.config.organization;
    }

    const response = await fetch(`${this.config.baseUrl}/chat/completions`, {
      method: 'POST',
      headers,
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`OpenAI API error: ${response.status} - ${error}`);
    }

    const data = await response.json();

    const choice = data.choices?.[0];
    if (!choice) {
      throw new Error('No completion returned from OpenAI');
    }

    return {
      content: choice.message?.content || '',
      finishReason: this.mapFinishReason(choice.finish_reason),
      usage: data.usage
        ? {
            promptTokens: data.usage.prompt_tokens,
            completionTokens: data.usage.completion_tokens,
            totalTokens: data.usage.total_tokens,
          }
        : undefined,
      model: data.model,
    };
  }

  async completeStream(
    messages: LLMMessage[],
    options: CompletionOptions = {},
    onChunk?: StreamCallback
  ): Promise<CompletionResult> {
    if (!this.isAvailable()) {
      throw new Error('OpenAI API key not configured');
    }

    const model = options.model || this.config.defaultModel || 'gpt-4o-mini';

    const requestBody: Record<string, unknown> = {
      model,
      messages: messages.map((m) => ({
        role: m.role,
        content: m.content,
      })),
      max_tokens: options.maxTokens || 1024,
      temperature: options.temperature ?? 0.7,
      stream: true,
    };

    if (options.topP !== undefined) {
      requestBody.top_p = options.topP;
    }

    if (options.stop) {
      requestBody.stop = options.stop;
    }

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${this.config.apiKey}`,
    };

    if (this.config.organization) {
      headers['OpenAI-Organization'] = this.config.organization;
    }

    const response = await fetch(`${this.config.baseUrl}/chat/completions`, {
      method: 'POST',
      headers,
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`OpenAI API error: ${response.status} - ${error}`);
    }

    const reader = response.body?.getReader();
    if (!reader) {
      throw new Error('No response body');
    }

    const decoder = new TextDecoder();
    let fullContent = '';
    let finishReason: CompletionResult['finishReason'] = 'stop';

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n').filter((line) => line.trim());

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            if (data === '[DONE]') continue;

            try {
              const parsed = JSON.parse(data);
              const delta = parsed.choices?.[0]?.delta?.content || '';
              const reason = parsed.choices?.[0]?.finish_reason;

              if (delta) {
                fullContent += delta;
                onChunk?.({ content: delta, done: false });
              }

              if (reason) {
                finishReason = this.mapFinishReason(reason);
              }
            } catch {
              // Skip malformed JSON
            }
          }
        }
      }
    } finally {
      reader.releaseLock();
    }

    onChunk?.({ content: '', done: true });

    return {
      content: fullContent,
      finishReason,
      model,
    };
  }

  private mapFinishReason(
    reason: string | null
  ): CompletionResult['finishReason'] {
    switch (reason) {
      case 'stop':
        return 'stop';
      case 'length':
        return 'length';
      case 'content_filter':
        return 'content_filter';
      default:
        return 'stop';
    }
  }
}

// -----------------------------------------------------------------------------
// Factory
// -----------------------------------------------------------------------------

export function createOpenAIProvider(config: OpenAIConfig): LLMProvider {
  return new OpenAIProvider(config);
}
