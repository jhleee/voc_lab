import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import type { Node, Edge } from '@xyflow/react';
import type { FlowNodeData } from '@/types/flow-nodes';
import { FlowEngine, type FlowDefinition } from '@/lib/execution/flow-engine';
import { getSessionManager } from '@/lib/session/session-manager';

// POST /api/chat - Start a new chat session
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { projectId, flowId } = body;

    if (!projectId) {
      return NextResponse.json(
        { error: 'projectId is required' },
        { status: 400 }
      );
    }

    // Find the flow to use
    let flow;
    if (flowId) {
      // Use specific flow
      flow = await prisma.flow.findFirst({
        where: {
          id: flowId,
          projectId,
        },
        include: {
          nodes: true,
          edges: true,
        },
      });
    } else {
      // Use the first published flow, or first flow if none published
      flow = await prisma.flow.findFirst({
        where: {
          projectId,
          isPublished: true,
        },
        include: {
          nodes: true,
          edges: true,
        },
      });

      if (!flow) {
        // Fall back to first flow
        flow = await prisma.flow.findFirst({
          where: { projectId },
          include: {
            nodes: true,
            edges: true,
          },
        });
      }
    }

    if (!flow) {
      return NextResponse.json(
        { error: 'No flow found for this project' },
        { status: 404 }
      );
    }

    // Convert database nodes/edges to flow definition
    const flowDefinition: FlowDefinition = {
      id: flow.id,
      nodes: flow.nodes.map((n) => ({
        id: n.nodeId,
        type: n.type,
        position: { x: n.posX, y: n.posY },
        data: n.data as FlowNodeData,
      })) as Node<FlowNodeData>[],
      edges: flow.edges.map((e) => ({
        id: e.edgeId,
        source: e.source,
        target: e.target,
        sourceHandle: e.sourceHandle || undefined,
        targetHandle: e.targetHandle || undefined,
      })) as Edge[],
    };

    // Create session using SessionManager
    const sessionManager = getSessionManager();
    const engine = new FlowEngine(flowDefinition, sessionManager);
    const session = await engine.startSession(projectId);

    // Execute initial turn (start node)
    const result = await engine.executeTurn(session.id, {
      type: 'user_message',
      payload: { message: '' },
    });

    return NextResponse.json({
      sessionId: session.id,
      status: result.sessionStatus,
      messages: result.messages,
    });
  } catch (error) {
    console.error('Failed to start chat session:', error);
    return NextResponse.json(
      { error: 'Failed to start chat session' },
      { status: 500 }
    );
  }
}
