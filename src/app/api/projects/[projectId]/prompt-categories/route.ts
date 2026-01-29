import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { DEFAULT_PROMPT_CATEGORIES } from '@/lib/mock-data';

// GET: 프로젝트의 모든 프롬프트 카테고리 조회
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  try {
    const { projectId } = await params;

    const categories = await prisma.promptCategory.findMany({
      where: { projectId },
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
      orderBy: { createdAt: 'asc' },
    });

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

    const category = await prisma.promptCategory.create({
      data: {
        name,
        description,
        isDefault: false,
        projectId,
      },
      include: {
        prompts: true,
      },
    });

    return NextResponse.json(category, { status: 201 });
  } catch (error) {
    console.error('Failed to create prompt category:', error);
    return NextResponse.json(
      { error: 'Failed to create prompt category' },
      { status: 500 }
    );
  }
}

// PUT: 프로젝트에 기본 카테고리 초기화
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  try {
    const { projectId } = await params;

    // 프로젝트 존재 여부 확인
    const project = await prisma.project.findUnique({
      where: { id: projectId },
    });

    if (!project) {
      return NextResponse.json(
        { error: 'Project not found. Please run db:seed first.' },
        { status: 404 }
      );
    }

    // 이미 카테고리가 있는지 확인
    const existingCategories = await prisma.promptCategory.findFirst({
      where: { projectId },
    });

    if (existingCategories) {
      return NextResponse.json(
        { message: 'Categories already initialized' },
        { status: 200 }
      );
    }

    // 기본 프리셋 카테고리 생성
    const categories = await prisma.$transaction(
      DEFAULT_PROMPT_CATEGORIES.map((cat) =>
        prisma.promptCategory.create({
          data: {
            name: cat.name,
            description: cat.description,
            isDefault: true,
            projectId,
          },
          include: {
            prompts: true,
          },
        })
      )
    );

    return NextResponse.json(categories, { status: 201 });
  } catch (error) {
    console.error('Failed to initialize prompt categories:', error);
    return NextResponse.json(
      { error: 'Failed to initialize prompt categories' },
      { status: 500 }
    );
  }
}
