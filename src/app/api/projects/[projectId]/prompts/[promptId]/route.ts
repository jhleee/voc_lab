import { NextRequest, NextResponse } from 'next/server';
// import { prisma } from '@/lib/prisma';
import { mockPrompts } from '@/lib/mock-data';
import type { Prompt } from '@/types';

// GET: 특정 프롬프트 조회
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ projectId: string; promptId: string }> }
) {
  try {
    const { promptId } = await params;

    // TODO: Prisma로 대체
    // const prompt = await prisma.prompt.findUnique({
    //   where: { id: promptId },
    //   include: {
    //     category: true,
    //     versions: {
    //       orderBy: { version: 'desc' },
    //     },
    //   },
    // });

    // Mock 데이터 사용
    const prompt = mockPrompts.find(p => p.id === promptId);

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

    // TODO: Prisma로 대체
    // Mock 응답
    const existingPrompt = mockPrompts.find(p => p.id === promptId);
    if (!existingPrompt) {
      return NextResponse.json(
        { error: 'Prompt not found' },
        { status: 404 }
      );
    }

    const updatedPrompt: Prompt = {
      ...existingPrompt,
      ...(name && { name }),
      ...(isActive !== undefined && { isActive }),
      updatedAt: new Date(),
    };

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

    // TODO: Prisma로 대체
    // Mock 응답
    const prompt = mockPrompts.find(p => p.id === promptId);
    if (!prompt) {
      return NextResponse.json(
        { error: 'Prompt not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to delete prompt:', error);
    return NextResponse.json(
      { error: 'Failed to delete prompt' },
      { status: 500 }
    );
  }
}
