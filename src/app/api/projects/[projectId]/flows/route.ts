import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET: 프로젝트의 모든 플로우 조회
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  try {
    const { projectId } = await params;

    const flows = await prisma.flow.findMany({
      where: { projectId },
      include: {
        _count: {
          select: {
            nodes: true,
            edges: true,
          },
        },
      },
      orderBy: { updatedAt: 'desc' },
    });

    return NextResponse.json(flows);
  } catch (error) {
    console.error('Failed to fetch flows:', error);
    return NextResponse.json(
      { error: 'Failed to fetch flows' },
      { status: 500 }
    );
  }
}

// POST: 새 플로우 생성
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
        { error: 'Name is required' },
        { status: 400 }
      );
    }

    // 기본 시작 노드와 함께 생성
    const flow = await prisma.flow.create({
      data: {
        name,
        description,
        projectId,
        nodes: {
          create: {
            nodeId: 'start-1',
            type: 'start',
            posX: 250,
            posY: 50,
            data: {
              type: 'start',
              label: '시작',
              triggerType: 'user_message',
            },
          },
        },
      },
      include: {
        nodes: true,
        edges: true,
      },
    });

    return NextResponse.json(flow, { status: 201 });
  } catch (error) {
    console.error('Failed to create flow:', error);
    return NextResponse.json(
      { error: 'Failed to create flow' },
      { status: 500 }
    );
  }
}
