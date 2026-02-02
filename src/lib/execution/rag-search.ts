// =============================================================================
// RAG Search Helper
// =============================================================================
// 문서 검색 및 AI 응답 생성
// =============================================================================

import { getLLMService } from '@/lib/llm';
import type { RAGSearchNodeData } from '@/types/flow-nodes';
import { searchSimilarChunks, type SearchResult } from '@/lib/document-processor/vector-search';

// -----------------------------------------------------------------------------
// Types
// -----------------------------------------------------------------------------

export interface RAGSearchResult {
  answer: string;
  confidence: number;
  sources: RAGSource[];
  searchQuery?: string;
}

export interface RAGSource {
  documentId: string;
  documentTitle: string;
  snippet: string;
  score: number;
}

// -----------------------------------------------------------------------------
// RAG Search
// -----------------------------------------------------------------------------

/**
 * RAG 검색을 수행하고 AI 응답을 생성합니다.
 */
export async function executeRAGSearch(
  query: string,
  config: RAGSearchNodeData,
  documentContext?: string // 외부에서 문서 컨텍스트 직접 제공 시
): Promise<RAGSearchResult> {
  const llm = getLLMService();
  let sources: RAGSource[] = [];
  let context = documentContext;

  // 벡터 검색 수행 (documentContext가 없는 경우)
  if (!context && config.documentIds && config.documentIds.length > 0) {
    try {
      const searchResults = await searchSimilarChunks(query, {
        documentIds: config.documentIds,
        limit: config.maxResults || 3,
        minScore: config.minScore || 0.5,
      });

      sources = searchResults.map((r: SearchResult) => ({
        documentId: r.documentId,
        documentTitle: r.documentTitle,
        snippet: r.content.slice(0, 200) + (r.content.length > 200 ? '...' : ''),
        score: r.score,
      }));

      // 검색 결과를 컨텍스트로 조합
      if (searchResults.length > 0) {
        context = searchResults
          .map((r) => `[문서: ${r.documentTitle}]\n${r.content}`)
          .join('\n\n---\n\n');
      }
    } catch (error) {
      console.error('Vector search failed:', error);
    }
  }

  // LLM이 없으면 기본 응답 반환
  if (!llm.isAvailable()) {
    return {
      answer: context
        ? `검색된 문서 내용을 기반으로 답변드립니다:\n\n${context}`
        : '죄송합니다. 해당 질문에 대한 정보를 찾을 수 없습니다.',
      confidence: sources.length > 0 ? 0.6 : (context ? 0.5 : 0.0),
      sources,
      searchQuery: query,
    };
  }

  // 시스템 프롬프트 구성
  let systemPrompt = `당신은 친절하고 정확한 고객 지원 AI 어시스턴트입니다.`;

  if (config.persona) {
    systemPrompt = config.persona;
  }

  systemPrompt += `

다음 지침을 따르세요:
1. 제공된 문서 컨텍스트를 기반으로 질문에 답변하세요.
2. 문서에서 관련 정보를 찾을 수 없으면 솔직히 모른다고 말하세요.
3. 답변은 간결하고 명확하게 작성하세요.
4. 확실하지 않은 정보는 추측하지 마세요.`;

  // 사용자 프롬프트 구성
  let userPrompt = `사용자 질문: ${query}`;

  if (context) {
    userPrompt = `참고 문서:
---
${context}
---

${userPrompt}

위 문서를 참고하여 질문에 답변해주세요.`;
  } else {
    userPrompt += `

(참고할 문서가 없습니다. 일반적인 지식을 기반으로 답변하거나, 정보를 찾을 수 없다고 안내해주세요.)`;
  }

  try {
    const answer = await llm.generate(userPrompt, systemPrompt, {
      temperature: 0.5,
      maxTokens: 1024,
    });

    // 신뢰도 계산
    let confidence = 0.5;
    if (sources.length > 0) {
      // 검색된 소스의 평균 점수 기반
      const avgScore = sources.reduce((sum, s) => sum + s.score, 0) / sources.length;
      confidence = Math.min(0.9, 0.5 + avgScore * 0.4);
    } else if (context) {
      confidence = 0.7;
    }
    if (answer.includes('모르') || answer.includes('찾을 수 없')) {
      confidence = Math.min(confidence, 0.3);
    }

    return {
      answer,
      confidence,
      sources,
      searchQuery: query,
    };
  } catch (error) {
    console.error('RAG search error:', error);
    return {
      answer: '죄송합니다. 응답 생성 중 오류가 발생했습니다.',
      confidence: 0.0,
      sources,
      searchQuery: query,
    };
  }
}

/**
 * LLM을 사용하여 대화 응답을 생성합니다.
 * (RAG 없이 일반 대화용)
 */
export async function generateConversationalResponse(
  userMessage: string,
  conversationHistory: Array<{ role: 'user' | 'assistant'; content: string }>,
  systemPrompt?: string
): Promise<string> {
  const llm = getLLMService();

  if (!llm.isAvailable()) {
    return '죄송합니다. AI 응답 기능이 현재 사용할 수 없습니다.';
  }

  const defaultSystemPrompt = `당신은 친절하고 도움이 되는 고객 지원 AI 어시스턴트입니다.
사용자의 질문에 간결하고 정확하게 답변하세요.`;

  const messages = [
    { role: 'system' as const, content: systemPrompt || defaultSystemPrompt },
    ...conversationHistory.map((msg) => ({
      role: msg.role as 'user' | 'assistant',
      content: msg.content,
    })),
    { role: 'user' as const, content: userMessage },
  ];

  try {
    const result = await llm.complete(messages, {
      temperature: 0.7,
      maxTokens: 512,
    });
    return result.content;
  } catch (error) {
    console.error('Conversation generation error:', error);
    return '죄송합니다. 응답 생성 중 오류가 발생했습니다.';
  }
}
