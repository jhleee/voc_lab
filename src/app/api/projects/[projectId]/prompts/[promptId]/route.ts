import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET: 특정 프롬프트 조회
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ projectId: string; promptId: string }> }
) {
  try {
    const { promptId } = await params;

    const prompt = await prisma.prompt.findUnique({
      where: { id: promptId },
      include: {
        category: true,
        versions: {
          orderBy: { version: 'desc' },
        },
      },
    });

    if (!prompt) {
      return NextResponse.json(
        { error: 'Prompt not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(prompt);
  } catch (error) {
    console.error('Failed to fetch prompt:', error);
    return NextResponse.json(
      { error: 'Failed to fetch prompt' },
      { status: 500 }
    );
  }
}

// PATCH: 프롬프트 수정 (이름, 활성화 상태)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ projectId: string; promptId: string }> }
) {
  try {
    const { promptId } = await params;
    const body = await request.json();
    const { name, isActive } = body;

    // 활성화 상태 변경 시 같은 카테고리 내 다른 프롬프트 비활성화
    if (isActive === true) {
      const prompt = await prisma.prompt.findUnique({
        where: { id: promptId },
        select: { categoryId: true },
      });

      if (prompt) {
        await prisma.prompt.updateMany({
          where: {
            categoryId: prompt.categoryId,
            isActive: true,
            id: { not: promptId },
          },
          data: { isActive: false },
        });
      }
    }

    const updatedPrompt = await prisma.prompt.update({
      where: { id: promptId },
      data: {
        ...(name && { name }),
        ...(isActive !== undefined && { isActive }),
      },
      include: {
        versions: {
          orderBy: { version: 'desc' },
        },
      },
    });

    return NextResponse.json(updatedPrompt);
  } catch (error) {
    console.error('Failed to update prompt:', error);
    return NextResponse.json(
      { error: 'Failed to update prompt' },
      { status: 500 }
    );
  }
}

// DELETE: 프롬프트 삭제
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ projectId: string; promptId: string }> }
) {
  try {
    const { promptId } = await params;

    await prisma.prompt.delete({
      where: { id: promptId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to delete prompt:', error);
    return NextResponse.json(
      { error: 'Failed to delete prompt' },
      { status: 500 }
    );
  }
}
