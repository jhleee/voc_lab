// =============================================================================
// Intent Classifier Helper
// =============================================================================
// LLM 기반 의도 분류 로직
// =============================================================================

import { getLLMService } from '@/lib/llm';
import type { IntentDefinition } from '@/types/flow-nodes';

// -----------------------------------------------------------------------------
// Types
// -----------------------------------------------------------------------------

export interface IntentClassificationResult {
  intentId: string | null;
  intentName: string;
  confidence: number;
  reasoning?: string;
}

// -----------------------------------------------------------------------------
// Intent Classification
// -----------------------------------------------------------------------------

/**
 * LLM을 사용하여 사용자 입력의 의도를 분류합니다.
 */
export async function classifyIntent(
  userInput: string,
  intents: IntentDefinition[]
): Promise<IntentClassificationResult> {
  const llm = getLLMService();

  // LLM이 없으면 키워드 매칭으로 폴백
  if (!llm.isAvailable()) {
    return classifyIntentByKeyword(userInput, intents);
  }

  // 의도 목록 생성
  const intentList = intents
    .map((intent, idx) => {
      let desc = `${idx + 1}. "${intent.name}"`;
      if (intent.description) {
        desc += `: ${intent.description}`;
      }
      if (intent.examples && intent.examples.length > 0) {
        desc += `\n   예시: ${intent.examples.slice(0, 3).join(', ')}`;
      }
      return desc;
    })
    .join('\n');

  const systemPrompt = `당신은 사용자 의도 분류 전문가입니다. 사용자의 입력을 분석하여 가장 적합한 의도를 선택하세요.

다음 의도 중에서 선택하세요:
${intentList}

JSON 형식으로 응답하세요:
{
  "intentIndex": <1부터 시작하는 의도 번호, 확실하지 않으면 0>,
  "confidence": <0.0-1.0 사이의 신뢰도>,
  "reasoning": "<선택 이유 간단히>"
}`;

  const userPrompt = `사용자 입력: "${userInput}"

위 입력의 의도를 분류하세요.`;

  try {
    const result = await llm.generateJSON<{
      intentIndex: number;
      confidence: number;
      reasoning: string;
    }>(userPrompt, systemPrompt, {
      temperature: 0.3,
      maxTokens: 256,
    });

    if (!result) {
      return classifyIntentByKeyword(userInput, intents);
    }

    const intentIndex = result.intentIndex - 1; // 1-based to 0-based
    if (intentIndex >= 0 && intentIndex < intents.length) {
      const matchedIntent = intents[intentIndex];
      return {
        intentId: matchedIntent.id,
        intentName: matchedIntent.name,
        confidence: Math.min(Math.max(result.confidence, 0), 1),
        reasoning: result.reasoning,
      };
    }

    // 매칭 없음 - 마지막 의도 (보통 '기타')
    const fallbackIntent = intents[intents.length - 1];
    return {
      intentId: fallbackIntent?.id || null,
      intentName: fallbackIntent?.name || 'unknown',
      confidence: 0.5,
      reasoning: result.reasoning,
    };
  } catch (error) {
    console.error('Intent classification error:', error);
    return classifyIntentByKeyword(userInput, intents);
  }
}

/**
 * 키워드 매칭 기반 의도 분류 (폴백)
 */
function classifyIntentByKeyword(
  userInput: string,
  intents: IntentDefinition[]
): IntentClassificationResult {
  const inputLower = userInput.toLowerCase();

  // 예시 문장에서 키워드 매칭
  for (const intent of intents) {
    if (intent.examples) {
      for (const example of intent.examples) {
        if (inputLower.includes(example.toLowerCase())) {
          return {
            intentId: intent.id,
            intentName: intent.name,
            confidence: 0.7,
            reasoning: `키워드 매칭: "${example}"`,
          };
        }
      }
    }
  }

  // 의도 이름에서 키워드 매칭
  for (const intent of intents) {
    if (inputLower.includes(intent.name.toLowerCase())) {
      return {
        intentId: intent.id,
        intentName: intent.name,
        confidence: 0.6,
        reasoning: `의도 이름 매칭`,
      };
    }
  }

  // 매칭 없음 - 마지막 의도 (보통 '기타')
  const fallbackIntent = intents[intents.length - 1];
  return {
    intentId: fallbackIntent?.id || null,
    intentName: fallbackIntent?.name || 'unknown',
    confidence: 0.3,
    reasoning: '매칭되는 의도 없음',
  };
}
