import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { processDocument } from '@/lib/document-processor';

type RouteParams = {
  params: Promise<{ projectId: string; documentId: string }>;
};

// POST: 문서 처리 (파싱 + 청킹 + 임베딩) 트리거
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { projectId, documentId } = await params;

    // 문서 조회
    const document = await prisma.document.findFirst({
      where: {
        id: documentId,
        projectId,
      },
    });

    if (!document) {
      return NextResponse.json(
        { error: 'Document not found' },
        { status: 404 }
      );
    }

    // 이미 처리 중인 경우
    if (document.status === 'PROCESSING' || document.status === 'EMBEDDING') {
      return NextResponse.json(
        { error: 'Document is already being processed' },
        { status: 409 }
      );
    }

    // 상태를 PROCESSING으로 변경
    await prisma.document.update({
      where: { id: documentId },
      data: { status: 'PROCESSING' },
    });

    // 비동기 처리 시작 (백그라운드에서 실행)
    processDocument(documentId).catch((error) => {
      console.error(`Document processing failed for ${documentId}:`, error);
    });

    return NextResponse.json({
      message: 'Document processing started',
      documentId,
      status: 'PROCESSING',
    });
  } catch (error) {
    console.error('Failed to start document processing:', error);
    return NextResponse.json(
      { error: 'Failed to start document processing' },
      { status: 500 }
    );
  }
}

// GET: 문서 처리 상태 조회
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { projectId, documentId } = await params;

    const document = await prisma.document.findFirst({
      where: {
        id: documentId,
        projectId,
      },
      select: {
        id: true,
        status: true,
        _count: {
          select: {
            chunks: true,
          },
        },
      },
    });

    if (!document) {
      return NextResponse.json(
        { error: 'Document not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      documentId: document.id,
      status: document.status,
      chunkCount: document._count.chunks,
    });
  } catch (error) {
    console.error('Failed to get document status:', error);
    return NextResponse.json(
      { error: 'Failed to get document status' },
      { status: 500 }
    );
  }
}
