import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET: 프로젝트의 모든 프롬프트 조회
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  try {
    const { projectId } = await params;
    const { searchParams } = new URL(request.url);
    const categoryId = searchParams.get('categoryId');

    const prompts = await prisma.prompt.findMany({
      where: {
        category: {
          projectId,
          ...(categoryId && { id: categoryId }),
        },
      },
      include: {
        category: true,
        versions: {
          orderBy: { version: 'desc' },
        },
      },
      orderBy: { createdAt: 'asc' },
    });

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

    // 같은 카테고리에 활성화된 프롬프트가 있으면 비활성화
    if (isActive) {
      await prisma.prompt.updateMany({
        where: { categoryId, isActive: true },
        data: { isActive: false },
      });
    }

    const prompt = await prisma.prompt.create({
      data: {
        name,
        categoryId,
        isActive: isActive ?? false,
        versions: content
          ? {
              create: {
                version: 1,
                content,
              },
            }
          : undefined,
      },
      include: {
        versions: {
          orderBy: { version: 'desc' },
        },
      },
    });

    return NextResponse.json(prompt, { status: 201 });
  } catch (error) {
    console.error('Failed to create prompt:', error);
    return NextResponse.json(
      { error: 'Failed to create prompt' },
      { status: 500 }
    );
  }
}
