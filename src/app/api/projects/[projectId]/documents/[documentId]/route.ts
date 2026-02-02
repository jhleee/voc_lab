import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { deleteFile } from '@/lib/upload';

type RouteParams = {
  params: Promise<{ projectId: string; documentId: string }>;
};

// GET: 단일 문서 조회
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { projectId, documentId } = await params;

    const document = await prisma.document.findFirst({
      where: {
        id: documentId,
        projectId,
      },
      include: {
        chunks: {
          select: {
            id: true,
            chunkIndex: true,
            content: true,
            startChar: true,
            endChar: true,
            metadata: true,
          },
          orderBy: { chunkIndex: 'asc' },
        },
      },
    });

    if (!document) {
      return NextResponse.json(
        { error: 'Document not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(document);
  } catch (error) {
    console.error('Failed to fetch document:', error);
    return NextResponse.json(
      { error: 'Failed to fetch document' },
      { status: 500 }
    );
  }
}

// PUT: 문서 업데이트
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const { projectId, documentId } = await params;
    const body = await request.json();
    const { title, content } = body;

    // 문서 존재 확인
    const existing = await prisma.document.findFirst({
      where: {
        id: documentId,
        projectId,
      },
    });

    if (!existing) {
      return NextResponse.json(
        { error: 'Document not found' },
        { status: 404 }
      );
    }

    // 업데이트할 필드만 포함
    const updateData: Record<string, unknown> = {};
    if (title !== undefined) updateData.title = title;
    if (content !== undefined) {
      updateData.content = content;
      updateData.fileSize = Buffer.byteLength(content, 'utf8');
      // 내용이 변경되면 재처리 필요
      updateData.status = 'PENDING';
    }

    const document = await prisma.document.update({
      where: { id: documentId },
      data: updateData,
    });

    return NextResponse.json(document);
  } catch (error) {
    console.error('Failed to update document:', error);
    return NextResponse.json(
      { error: 'Failed to update document' },
      { status: 500 }
    );
  }
}

// DELETE: 문서 삭제
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { projectId, documentId } = await params;

    // 문서 조회 (파일 경로 포함)
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

    // DB에서 삭제 (cascade로 chunks도 삭제됨)
    await prisma.document.delete({
      where: { id: documentId },
    });

    // 파일 시스템에서 삭제
    if (document.filePath) {
      await deleteFile(document.filePath);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to delete document:', error);
    return NextResponse.json(
      { error: 'Failed to delete document' },
      { status: 500 }
    );
  }
}
