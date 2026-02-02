// =============================================================================
// Vector Search
// =============================================================================
// pgvector를 사용한 유사도 검색
// =============================================================================

import { prisma } from '@/lib/prisma';
import { createQueryEmbedding } from './embeddings';

// -----------------------------------------------------------------------------
// Types
// -----------------------------------------------------------------------------

export interface SearchResult {
  chunkId: string;
  documentId: string;
  documentTitle: string;
  content: string;
  score: number;
  metadata?: Record<string, unknown>;
}

export interface SearchOptions {
  /** 반환할 최대 결과 수 (기본: 5) */
  limit?: number;
  /** 최소 유사도 점수 (0-1, 기본: 0.5) */
  minScore?: number;
  /** 특정 프로젝트로 제한 */
  projectId?: string;
  /** 특정 문서들로 제한 */
  documentIds?: string[];
}

// -----------------------------------------------------------------------------
// Vector Search Functions
// -----------------------------------------------------------------------------

/**
 * 쿼리와 유사한 문서 청크를 검색합니다.
 */
export async function searchSimilarChunks(
  query: string,
  options?: SearchOptions
): Promise<SearchResult[]> {
  const limit = options?.limit ?? 5;
  const minScore = options?.minScore ?? 0.5;

  // 쿼리 임베딩 생성
  const queryEmbedding = await createQueryEmbedding(query);

  if (!queryEmbedding) {
    // 임베딩 생성 실패 시 키워드 검색으로 폴백
    return keywordSearch(query, options);
  }

  // 벡터 유사도 검색 (코사인 유사도 사용)
  const vectorString = `[${queryEmbedding.join(',')}]`;

  let whereClause = '';
  const params: unknown[] = [vectorString, limit];

  if (options?.projectId) {
    whereClause = `AND d."projectId" = $3`;
    params.push(options.projectId);
  }

  if (options?.documentIds && options.documentIds.length > 0) {
    const placeholders = options.documentIds.map((_, i) => `$${params.length + i + 1}`).join(', ');
    whereClause += ` AND dc."documentId" IN (${placeholders})`;
    params.push(...options.documentIds);
  }

  try {
    const results = await prisma.$queryRawUnsafe<
      Array<{
        chunk_id: string;
        document_id: string;
        document_title: string;
        content: string;
        similarity: number;
        metadata: Record<string, unknown> | null;
      }>
    >(
      `
      SELECT
        dc.id as chunk_id,
        dc."documentId" as document_id,
        d.title as document_title,
        dc.content,
        1 - (dc.embedding <=> $1::vector) as similarity,
        dc.metadata
      FROM "DocumentChunk" dc
      JOIN "Document" d ON dc."documentId" = d.id
      WHERE dc.embedding IS NOT NULL
        AND d.status = 'READY'
        ${whereClause}
      ORDER BY dc.embedding <=> $1::vector
      LIMIT $2
      `,
      ...params
    );

    // 최소 점수 필터링
    return results
      .filter((r) => r.similarity >= minScore)
      .map((r) => ({
        chunkId: r.chunk_id,
        documentId: r.document_id,
        documentTitle: r.document_title,
        content: r.content,
        score: r.similarity,
        metadata: r.metadata || undefined,
      }));
  } catch (error) {
    console.error('Vector search failed:', error);
    // 벡터 검색 실패 시 키워드 검색으로 폴백
    return keywordSearch(query, options);
  }
}

/**
 * 키워드 기반 검색 (폴백)
 */
async function keywordSearch(
  query: string,
  options?: SearchOptions
): Promise<SearchResult[]> {
  const limit = options?.limit ?? 5;

  // 쿼리를 키워드로 분리
  const keywords = query
    .toLowerCase()
    .split(/\s+/)
    .filter((k) => k.length > 1);

  if (keywords.length === 0) {
    return [];
  }

  // 조건 구성
  const where: Record<string, unknown> = {
    document: {
      status: 'READY',
    },
  };

  if (options?.projectId) {
    where.document = {
      ...(where.document as object),
      projectId: options.projectId,
    };
  }

  if (options?.documentIds && options.documentIds.length > 0) {
    where.documentId = { in: options.documentIds };
  }

  // 각 키워드에 대해 검색
  const chunks = await prisma.documentChunk.findMany({
    where: {
      ...where,
      OR: keywords.map((keyword) => ({
        content: {
          contains: keyword,
          mode: 'insensitive' as const,
        },
      })),
    },
    include: {
      document: {
        select: {
          id: true,
          title: true,
        },
      },
    },
    take: limit * 2, // 점수 계산 후 필터링하므로 여유 있게
  });

  // 키워드 매칭 점수 계산
  const results: SearchResult[] = chunks.map((chunk) => {
    const contentLower = chunk.content.toLowerCase();
    const matchCount = keywords.filter((k) => contentLower.includes(k)).length;
    const score = matchCount / keywords.length;

    return {
      chunkId: chunk.id,
      documentId: chunk.document.id,
      documentTitle: chunk.document.title,
      content: chunk.content,
      score,
      metadata: chunk.metadata as Record<string, unknown> | undefined,
    };
  });

  // 점수순 정렬 및 제한
  return results.sort((a, b) => b.score - a.score).slice(0, limit);
}

/**
 * 프로젝트의 문서에서 컨텍스트를 검색합니다.
 */
export async function getDocumentContext(
  query: string,
  projectId: string,
  maxChunks: number = 3
): Promise<string> {
  const results = await searchSimilarChunks(query, {
    projectId,
    limit: maxChunks,
    minScore: 0.3, // 낮은 임계값으로 더 많은 결과
  });

  if (results.length === 0) {
    return '';
  }

  // 검색된 청크들을 컨텍스트로 조합
  const context = results
    .map((r) => `[문서: ${r.documentTitle}]\n${r.content}`)
    .join('\n\n---\n\n');

  return context;
}
