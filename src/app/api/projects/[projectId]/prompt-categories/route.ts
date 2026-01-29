import { NextRequest, NextResponse } from 'next/server';
// import { prisma } from '@/lib/prisma';
import { DEFAULT_PROMPT_CATEGORIES, mockPromptCategories, mockPrompts } from '@/lib/mock-data';
import type { PromptCategory } from '@/types';

// GET: 프로젝트의 모든 프롬프트 카테고리 조회
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  try {
    const { projectId } = await params;

    // TODO: Prisma로 대체
    // const categories = await prisma.promptCategory.findMany({
    //   where: { projectId },
    //   include: {
    //     prompts: {
    //       include: {
    //         versions: {
    //           orderBy: { version: 'desc' },
    //           take: 1,
    //         },
    //       },
    //       orderBy: { createdAt: 'asc' },
    //     },
    //   },
    //   orderBy: { createdAt: 'asc' },
    // });

    // Mock 데이터 사용
    const categories: PromptCategory[] = mockPromptCategories
      .filter(c => c.projectId === projectId || projectId === 'project-1')
      .map(cat => ({
        ...cat,
        prompts: mockPrompts.filter(p => p.categoryId === cat.id),
      }));

    return NextResponse.json(categories);
  } catch (error) {
    console.error('Failed to fetch prompt categories:', error);
    return NextResponse.json(
      { error: 'Failed to fetch prompt categories' },
      { status: 500 }
    );
  }
}

// POST: 새 프롬프트 카테고리 생성
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  try {
    const { projectId } = await params;
    const body = await request.json();
    const { name, description } = body;

    if (!name) {
      return NextResponse.json(
        { error: 'Category name is required' },
        { status: 400 }
      );
    }

    // TODO: Prisma로 대체
    // const category = await prisma.promptCategory.create({
    //   data: {
    //     name,
    //     description,
    //     isDefault: false,
    //     projectId,
    //   },
    // });

    // Mock 응답
    const category: PromptCategory = {
      id: `cat-${Date.now()}`,
      name,
      description,
      isDefault: false,
      projectId,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    return NextResponse.json(category, { status: 201 });
  } catch (error) {
    console.error('Failed to create prompt category:', error);
    return NextResponse.json(
      { error: 'Failed to create prompt category' },
      { status: 500 }
    );
  }
}

// 프로젝트에 기본 카테고리 초기화 (별도 엔드포인트로 호출)
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  try {
    const { projectId } = await params;

    // TODO: Prisma로 대체
    // Mock: 기본 프리셋 카테고리 반환
    const categories: PromptCategory[] = DEFAULT_PROMPT_CATEGORIES.map((cat, index) => ({
      id: `cat-init-${index}`,
      name: cat.name,
      description: cat.description,
      isDefault: true,
      projectId,
      createdAt: new Date(),
      updatedAt: new Date(),
    }));

    return NextResponse.json(categories, { status: 201 });
  } catch (error) {
    console.error('Failed to initialize prompt categories:', error);
    return NextResponse.json(
      { error: 'Failed to initialize prompt categories' },
      { status: 500 }
    );
  }
}
