import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET: 프롬프트의 모든 버전 조회
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ projectId: string; promptId: string }> }
) {
  try {
    const { promptId } = await params;

    const versions = await prisma.promptVersion.findMany({
      where: { promptId },
      orderBy: { version: 'desc' },
    });

    return NextResponse.json(versions);
  } catch (error) {
    console.error('Failed to fetch prompt versions:', error);
    return NextResponse.json(
      { error: 'Failed to fetch prompt versions' },
      { status: 500 }
    );
  }
}

// POST: 새 버전 생성 (저장)
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ projectId: string; promptId: string }> }
) {
  try {
    const { promptId } = await params;
    const body = await request.json();
    const { content } = body;

    if (content === undefined) {
      return NextResponse.json(
        { error: 'Content is required' },
        { status: 400 }
      );
    }

    // 가장 최근 버전 조회
    const latestVersion = await prisma.promptVersion.findFirst({
      where: { promptId },
      orderBy: { version: 'desc' },
    });

    // 내용이 동일하면 새 버전 생성하지 않음
    if (latestVersion && latestVersion.content === content) {
      return NextResponse.json(latestVersion);
    }

    const newVersion = latestVersion ? latestVersion.version + 1 : 1;

    const version = await prisma.promptVersion.create({
      data: {
        version: newVersion,
        content,
        promptId,
      },
    });

    // 프롬프트의 updatedAt 갱신
    await prisma.prompt.update({
      where: { id: promptId },
      data: { updatedAt: new Date() },
    });

    return NextResponse.json(version, { status: 201 });
  } catch (error) {
    console.error('Failed to create prompt version:', error);
    return NextResponse.json(
      { error: 'Failed to create prompt version' },
      { status: 500 }
    );
  }
}
