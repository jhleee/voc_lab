import { NextRequest, NextResponse } from 'next/server';
// import { prisma } from '@/lib/prisma';
import { mockPromptCategories, mockPrompts } from '@/lib/mock-data';
import type { PromptCategory } from '@/types';

// GET: 특정 카테고리 조회
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ projectId: string; categoryId: string }> }
) {
  try {
    const { categoryId } = await params;

    // TODO: Prisma로 대체
    // const category = await prisma.promptCategory.findUnique({
    //   where: { id: categoryId },
    //   include: {
    //     prompts: {
    //       include: {
    //         versions: {
    //           orderBy: { version: 'desc' },
    //         },
    //       },
    //       orderBy: { createdAt: 'asc' },
    //     },
    //   },
    // });

    // Mock 데이터 사용
    const category = mockPromptCategories.find(c => c.id === categoryId);

    if (!category) {
      return NextResponse.json(
        { error: 'Category not found' },
        { status: 404 }
      );
    }

    const categoryWithPrompts: PromptCategory = {
      ...category,
      prompts: mockPrompts.filter(p => p.categoryId === categoryId),
    };

    return NextResponse.json(categoryWithPrompts);
  } catch (error) {
    console.error('Failed to fetch prompt category:', error);
    return NextResponse.json(
      { error: 'Failed to fetch prompt category' },
      { status: 500 }
    );
  }
}

// PATCH: 카테고리 수정
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ projectId: string; categoryId: string }> }
) {
  try {
    const { categoryId } = await params;
    const body = await request.json();
    const { name, description } = body;

    // TODO: Prisma로 대체
    // const category = await prisma.promptCategory.update({
    //   where: { id: categoryId },
    //   data: {
    //     ...(name && { name }),
    //     ...(description !== undefined && { description }),
    //   },
    // });

    // Mock 응답
    const existingCategory = mockPromptCategories.find(c => c.id === categoryId);
    if (!existingCategory) {
      return NextResponse.json(
        { error: 'Category not found' },
        { status: 404 }
      );
    }

    const category: PromptCategory = {
      ...existingCategory,
      ...(name && { name }),
      ...(description !== undefined && { description }),
      updatedAt: new Date(),
    };

    return NextResponse.json(category);
  } catch (error) {
    console.error('Failed to update prompt category:', error);
    return NextResponse.json(
      { error: 'Failed to update prompt category' },
      { status: 500 }
    );
  }
}

// DELETE: 카테고리 삭제
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ projectId: string; categoryId: string }> }
) {
  try {
    const { categoryId } = await params;

    // TODO: Prisma로 대체
    // await prisma.promptCategory.delete({
    //   where: { id: categoryId },
    // });

    // Mock 응답
    const category = mockPromptCategories.find(c => c.id === categoryId);
    if (!category) {
      return NextResponse.json(
        { error: 'Category not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to delete prompt category:', error);
    return NextResponse.json(
      { error: 'Failed to delete prompt category' },
      { status: 500 }
    );
  }
}
