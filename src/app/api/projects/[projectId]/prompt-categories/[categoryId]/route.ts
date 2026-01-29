import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET: 특정 카테고리 조회
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ projectId: string; categoryId: string }> }
) {
  try {
    const { categoryId } = await params;

    const category = await prisma.promptCategory.findUnique({
      where: { id: categoryId },
      include: {
        prompts: {
          include: {
            versions: {
              orderBy: { version: 'desc' },
            },
          },
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    if (!category) {
      return NextResponse.json(
        { error: 'Category not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(category);
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

    const category = await prisma.promptCategory.update({
      where: { id: categoryId },
      data: {
        ...(name && { name }),
        ...(description !== undefined && { description }),
      },
      include: {
        prompts: true,
      },
    });

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

    await prisma.promptCategory.delete({
      where: { id: categoryId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to delete prompt category:', error);
    return NextResponse.json(
      { error: 'Failed to delete prompt category' },
      { status: 500 }
    );
  }
}
