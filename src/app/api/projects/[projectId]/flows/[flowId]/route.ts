import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

type RouteParams = { params: Promise<{ projectId: string; flowId: string }> };

// GET: 단일 플로우 조회 (노드, 엣지 포함)
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { projectId, flowId } = await params;

    const flow = await prisma.flow.findFirst({
      where: {
        id: flowId,
        projectId,
      },
      include: {
        nodes: {
          orderBy: { createdAt: 'asc' },
        },
        edges: {
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    if (!flow) {
      return NextResponse.json(
        { error: 'Flow not found' },
        { status: 404 }
      );
    }

    // ReactFlow 형식으로 변환
    const formattedFlow = {
      id: flow.id,
      name: flow.name,
      description: flow.description,
      version: flow.version,
      isPublished: flow.isPublished,
      projectId: flow.projectId,
      createdAt: flow.createdAt,
      updatedAt: flow.updatedAt,
      nodes: flow.nodes.map((node) => ({
        id: node.nodeId,
        type: node.type,
        position: { x: node.posX, y: node.posY },
        data: node.data,
      })),
      edges: flow.edges.map((edge) => ({
        id: edge.edgeId,
        source: edge.source,
        target: edge.target,
        sourceHandle: edge.sourceHandle,
        targetHandle: edge.targetHandle,
        label: edge.label,
        animated: edge.animated,
      })),
    };

    return NextResponse.json(formattedFlow);
  } catch (error) {
    console.error('Failed to fetch flow:', error);
    return NextResponse.json(
      { error: 'Failed to fetch flow' },
      { status: 500 }
    );
  }
}

// PUT: 플로우 업데이트 (노드, 엣지 전체 교체)
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const { projectId, flowId } = await params;
    const body = await request.json();
    const { name, description, nodes, edges, variables } = body;

    // 플로우 존재 확인
    const existingFlow = await prisma.flow.findFirst({
      where: { id: flowId, projectId },
    });

    if (!existingFlow) {
      return NextResponse.json(
        { error: 'Flow not found' },
        { status: 404 }
      );
    }

    // 트랜잭션으로 플로우 업데이트
    const updatedFlow = await prisma.$transaction(async (tx) => {
      // 기존 노드/엣지 삭제
      await tx.flowNode.deleteMany({ where: { flowId } });
      await tx.flowEdge.deleteMany({ where: { flowId } });

      // 플로우 업데이트 및 새 노드/엣지 생성
      return tx.flow.update({
        where: { id: flowId },
        data: {
          name: name ?? existingFlow.name,
          description: description ?? existingFlow.description,
          variables: variables ?? existingFlow.variables,
          version: { increment: 1 },
          nodes: nodes
            ? {
                create: nodes.map((node: {
                  id: string;
                  type: string;
                  position: { x: number; y: number };
                  data: Record<string, unknown>;
                }) => ({
                  nodeId: node.id,
                  type: node.type,
                  posX: node.position.x,
                  posY: node.position.y,
                  data: node.data,
                })),
              }
            : undefined,
          edges: edges
            ? {
                create: edges.map((edge: {
                  id: string;
                  source: string;
                  target: string;
                  sourceHandle?: string;
                  targetHandle?: string;
                  label?: string;
                  animated?: boolean;
                }) => ({
                  edgeId: edge.id,
                  source: edge.source,
                  target: edge.target,
                  sourceHandle: edge.sourceHandle,
                  targetHandle: edge.targetHandle,
                  label: edge.label,
                  animated: edge.animated ?? false,
                })),
              }
            : undefined,
        },
        include: {
          nodes: true,
          edges: true,
        },
      });
    });

    // ReactFlow 형식으로 변환하여 반환
    const formattedFlow = {
      ...updatedFlow,
      nodes: updatedFlow.nodes.map((node) => ({
        id: node.nodeId,
        type: node.type,
        position: { x: node.posX, y: node.posY },
        data: node.data,
      })),
      edges: updatedFlow.edges.map((edge) => ({
        id: edge.edgeId,
        source: edge.source,
        target: edge.target,
        sourceHandle: edge.sourceHandle,
        targetHandle: edge.targetHandle,
        label: edge.label,
        animated: edge.animated,
      })),
    };

    return NextResponse.json(formattedFlow);
  } catch (error) {
    console.error('Failed to update flow:', error);
    return NextResponse.json(
      { error: 'Failed to update flow' },
      { status: 500 }
    );
  }
}

// PATCH: 플로우 배포 상태 변경
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const { projectId, flowId } = await params;
    const body = await request.json();
    const { isPublished } = body;

    if (typeof isPublished !== 'boolean') {
      return NextResponse.json(
        { error: 'isPublished must be a boolean' },
        { status: 400 }
      );
    }

    // 플로우 존재 확인
    const existingFlow = await prisma.flow.findFirst({
      where: { id: flowId, projectId },
    });

    if (!existingFlow) {
      return NextResponse.json(
        { error: 'Flow not found' },
        { status: 404 }
      );
    }

    // 배포 상태 업데이트
    const updatedFlow = await prisma.flow.update({
      where: { id: flowId },
      data: { isPublished },
    });

    return NextResponse.json({
      id: updatedFlow.id,
      name: updatedFlow.name,
      version: updatedFlow.version,
      isPublished: updatedFlow.isPublished,
      message: isPublished ? 'Flow published successfully' : 'Flow unpublished',
    });
  } catch (error) {
    console.error('Failed to update flow publish status:', error);
    return NextResponse.json(
      { error: 'Failed to update flow publish status' },
      { status: 500 }
    );
  }
}

// DELETE: 플로우 삭제
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { projectId, flowId } = await params;

    // 플로우 존재 확인
    const existingFlow = await prisma.flow.findFirst({
      where: { id: flowId, projectId },
    });

    if (!existingFlow) {
      return NextResponse.json(
        { error: 'Flow not found' },
        { status: 404 }
      );
    }

    await prisma.flow.delete({
      where: { id: flowId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to delete flow:', error);
    return NextResponse.json(
      { error: 'Failed to delete flow' },
      { status: 500 }
    );
  }
}
