import { NextRequest, NextResponse } from 'next/server';
// import { prisma } from '@/lib/prisma';
import { mockPrompts, mockPromptCategories } from '@/lib/mock-data';
import type { Prompt } from '@/types';

// GET: 프로젝트의 모든 프롬프트 조회
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  try {
    const { projectId } = await params;
    const { searchParams } = new URL(request.url);
    const categoryId = searchParams.get('categoryId');

    // TODO: Prisma로 대체
    // const prompts = await prisma.prompt.findMany({
    //   where: {
    //     category: {
    //       projectId,
    //       ...(categoryId && { id: categoryId }),
    //     },
    //   },
    //   include: {
    //     category: true,
    //     versions: {
    //       orderBy: { version: 'desc' },
    //       take: 1,
    //     },
    //   },
    //   orderBy: { createdAt: 'asc' },
    // });

    // Mock 데이터 사용
    const projectCategoryIds = mockPromptCategories
      .filter(c => c.projectId === projectId || projectId === 'project-1')
      .map(c => c.id);

    let prompts = mockPrompts.filter(p => projectCategoryIds.includes(p.categoryId));

    if (categoryId) {
      prompts = prompts.filter(p => p.categoryId === categoryId);
    }

    return NextResponse.json(prompts);
  } catch (error) {
    console.error('Failed to fetch prompts:', error);
    return NextResponse.json(
      { error: 'Failed to fetch prompts' },
      { status: 500 }
    );
  }
}

// POST: 새 프롬프트 생성
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  try {
    await params;
    const body = await request.json();
    const { name, categoryId, content, isActive } = body;

    if (!name || !categoryId) {
      return NextResponse.json(
        { error: 'Name and categoryId are required' },
        { status: 400 }
      );
    }

    // TODO: Prisma로 대체
    // Mock 응답
    const prompt: Prompt = {
      id: `prompt-${Date.now()}`,
      name,
      categoryId,
      isActive: isActive ?? false,
      createdAt: new Date(),
      updatedAt: new Date(),
      versions: content
        ? [
            {
              id: `ver-${Date.now()}`,
              version: 1,
              content,
              promptId: `prompt-${Date.now()}`,
              createdAt: new Date(),
            },
          ]
        : [],
    };

    return NextResponse.json(prompt, { status: 201 });
  } catch (error) {
    console.error('Failed to create prompt:', error);
    return NextResponse.json(
      { error: 'Failed to create prompt' },
      { status: 500 }
    );
  }
}
