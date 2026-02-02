// =============================================================================
// Document Processor
// =============================================================================
// 문서 파싱, 청킹, 임베딩 생성 파이프라인
// =============================================================================

import { prisma } from '@/lib/prisma';
import { parseDocument } from './parsers';
import { chunkText, type ChunkingOptions } from './chunker';
import { generateEmbeddings } from './embeddings';

// -----------------------------------------------------------------------------
// Types
// -----------------------------------------------------------------------------

export interface ProcessingResult {
  success: boolean;
  documentId: string;
  chunkCount: number;
  error?: string;
}

// -----------------------------------------------------------------------------
// Document Processing Pipeline
// -----------------------------------------------------------------------------

/**
 * 문서를 처리합니다 (파싱 → 청킹 → 임베딩).
 */
export async function processDocument(
  documentId: string,
  options?: ChunkingOptions
): Promise<ProcessingResult> {
  try {
    // 1. 문서 조회
    const document = await prisma.document.findUnique({
      where: { id: documentId },
    });

    if (!document) {
      return {
        success: false,
        documentId,
        chunkCount: 0,
        error: 'Document not found',
      };
    }

    // 2. 문서 파싱 (파일에서 텍스트 추출)
    let textContent = document.content;

    if (document.filePath && !textContent) {
      try {
        textContent = await parseDocument(document.filePath, document.fileType);

        // 파싱된 내용 저장
        await prisma.document.update({
          where: { id: documentId },
          data: { content: textContent },
        });
      } catch (parseError) {
        console.error('Document parsing failed:', parseError);
        await prisma.document.update({
          where: { id: documentId },
          data: { status: 'ERROR' },
        });
        return {
          success: false,
          documentId,
          chunkCount: 0,
          error: `Parsing failed: ${parseError instanceof Error ? parseError.message : 'Unknown error'}`,
        };
      }
    }

    if (!textContent) {
      await prisma.document.update({
        where: { id: documentId },
        data: { status: 'ERROR' },
      });
      return {
        success: false,
        documentId,
        chunkCount: 0,
        error: 'No content to process',
      };
    }

    // 3. 기존 청크 삭제 (재처리 시)
    await prisma.documentChunk.deleteMany({
      where: { documentId },
    });

    // 4. 텍스트 청킹
    const chunks = chunkText(textContent, options);

    // 5. 청크 저장
    await prisma.documentChunk.createMany({
      data: chunks.map((chunk, index) => ({
        documentId,
        content: chunk.content,
        chunkIndex: index,
        startChar: chunk.startChar,
        endChar: chunk.endChar,
        metadata: chunk.metadata as object | undefined,
      })),
    });

    // 6. 상태를 EMBEDDING으로 변경
    await prisma.document.update({
      where: { id: documentId },
      data: { status: 'EMBEDDING' },
    });

    // 7. 임베딩 생성
    const chunkRecords = await prisma.documentChunk.findMany({
      where: { documentId },
      orderBy: { chunkIndex: 'asc' },
    });

    try {
      await generateEmbeddings(chunkRecords);
    } catch (embeddingError) {
      console.error('Embedding generation failed:', embeddingError);
      // 임베딩 실패해도 문서는 사용 가능 (검색만 안됨)
    }

    // 8. 완료 상태로 변경
    await prisma.document.update({
      where: { id: documentId },
      data: { status: 'READY' },
    });

    return {
      success: true,
      documentId,
      chunkCount: chunks.length,
    };
  } catch (error) {
    console.error('Document processing failed:', error);

    // 에러 상태로 변경
    await prisma.document.update({
      where: { id: documentId },
      data: { status: 'ERROR' },
    }).catch(() => {});

    return {
      success: false,
      documentId,
      chunkCount: 0,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}
