import { NextRequest, NextResponse } from 'next/server';
// import { prisma } from '@/lib/prisma';
import { mockPrompts, mockPromptVersions } from '@/lib/mock-data';
import type { PromptVersion } from '@/types';

// GET: 프롬프트의 모든 버전 조회
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ projectId: string; promptId: string }> }
) {
  try {
    const { promptId } = await params;

    // TODO: Prisma로 대체
    // const versions = await prisma.promptVersion.findMany({
    //   where: { promptId },
    //   orderBy: { version: 'desc' },
    // });

    // Mock 데이터 사용
    const versions = mockPromptVersions
      .filter(v => v.promptId === promptId)
      .sort((a, b) => b.version - a.version);

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

    // TODO: Prisma로 대체
    // Mock 데이터 사용
    const prompt = mockPrompts.find(p => p.id === promptId);
    if (!prompt) {
      return NextResponse.json(
        { error: 'Prompt not found' },
        { status: 404 }
      );
    }

    const promptVersions = mockPromptVersions
      .filter(v => v.promptId === promptId)
      .sort((a, b) => b.version - a.version);

    const latestVersion = promptVersions[0];

    // 내용이 동일하면 새 버전 생성하지 않음
    if (latestVersion && latestVersion.content === content) {
      return NextResponse.json(latestVersion);
    }

    const newVersionNumber = latestVersion ? latestVersion.version + 1 : 1;

    const version: PromptVersion = {
      id: `ver-${Date.now()}`,
      version: newVersionNumber,
      content,
      promptId,
      createdAt: new Date(),
    };

    return NextResponse.json(version, { status: 201 });
  } catch (error) {
    console.error('Failed to create prompt version:', error);
    return NextResponse.json(
      { error: 'Failed to create prompt version' },
      { status: 500 }
    );
  }
}
