// =============================================================================
// Embeddings Generator
// =============================================================================
// OpenAI API를 사용한 텍스트 임베딩 생성
// =============================================================================

import { prisma } from '@/lib/prisma';

// -----------------------------------------------------------------------------
// Types
// -----------------------------------------------------------------------------

interface DocumentChunk {
  id: string;
  content: string;
}

// -----------------------------------------------------------------------------
// Configuration
// -----------------------------------------------------------------------------

const EMBEDDING_MODEL = process.env.EMBEDDING_MODEL || 'text-embedding-ada-002';
const EMBEDDING_DIMENSION = 1536; // ada-002 dimension
const BATCH_SIZE = 100; // OpenAI batch limit

// -----------------------------------------------------------------------------
// Embedding Functions
// -----------------------------------------------------------------------------

/**
 * 청크들에 대한 임베딩을 생성하고 저장합니다.
 */
export async function generateEmbeddings(
  chunks: DocumentChunk[]
): Promise<void> {
  const apiKey = process.env.OPENAI_API_KEY;
  const baseUrl = process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1';

  if (!apiKey) {
    console.warn('OPENAI_API_KEY not set, skipping embedding generation');
    return;
  }

  // 배치 단위로 처리
  for (let i = 0; i < chunks.length; i += BATCH_SIZE) {
    const batch = chunks.slice(i, i + BATCH_SIZE);
    const texts = batch.map((chunk) => chunk.content);

    try {
      const embeddings = await createEmbeddings(texts, apiKey, baseUrl);

      // 임베딩 저장 (raw SQL 사용 - Prisma는 vector 타입 미지원)
      for (let j = 0; j < batch.length; j++) {
        const chunk = batch[j];
        const embedding = embeddings[j];

        if (embedding) {
          await saveEmbedding(chunk.id, embedding);
        }
      }
    } catch (error) {
      console.error(`Embedding batch ${i / BATCH_SIZE + 1} failed:`, error);
      throw error;
    }
  }
}

/**
 * OpenAI API를 호출하여 임베딩을 생성합니다.
 */
async function createEmbeddings(
  texts: string[],
  apiKey: string,
  baseUrl: string
): Promise<number[][]> {
  const response = await fetch(`${baseUrl}/embeddings`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: EMBEDDING_MODEL,
      input: texts,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`OpenAI embedding API error: ${response.status} - ${error}`);
  }

  const data = await response.json();
  return data.data.map((item: { embedding: number[] }) => item.embedding);
}

/**
 * 임베딩을 데이터베이스에 저장합니다.
 */
async function saveEmbedding(chunkId: string, embedding: number[]): Promise<void> {
  // PostgreSQL의 vector 타입으로 저장
  const vectorString = `[${embedding.join(',')}]`;

  await prisma.$executeRawUnsafe(
    `UPDATE "DocumentChunk" SET embedding = $1::vector WHERE id = $2`,
    vectorString,
    chunkId
  );
}

/**
 * 단일 텍스트에 대한 임베딩을 생성합니다 (검색용).
 */
export async function createQueryEmbedding(text: string): Promise<number[] | null> {
  const apiKey = process.env.OPENAI_API_KEY;
  const baseUrl = process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1';

  if (!apiKey) {
    console.warn('OPENAI_API_KEY not set, cannot create query embedding');
    return null;
  }

  try {
    const embeddings = await createEmbeddings([text], apiKey, baseUrl);
    return embeddings[0] || null;
  } catch (error) {
    console.error('Query embedding creation failed:', error);
    return null;
  }
}

/**
 * 임베딩 차원을 반환합니다.
 */
export function getEmbeddingDimension(): number {
  return EMBEDDING_DIMENSION;
}
