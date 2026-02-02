import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import type { Node, Edge } from '@xyflow/react';
import type { FlowNodeData } from '@/types/flow-nodes';
import { FlowEngine, type FlowDefinition } from '@/lib/execution/flow-engine';
import { getSessionManager } from '@/lib/session/session-manager';

interface RouteParams {
  params: Promise<{ sessionId: string }>;
}

// Helper to load flow definition
async function loadFlowDefinition(flowId: string): Promise<FlowDefinition | null> {
  const flow = await prisma.flow.findUnique({
    where: { id: flowId },
    include: {
      nodes: true,
      edges: true,
    },
  });

  if (!flow) return null;

  return {
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
}

// GET /api/chat/:sessionId - Get session status
export async function GET(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { sessionId } = await params;
    const sessionManager = getSessionManager();

    // Try to get active session from memory
    const activeSession = await sessionManager.get(sessionId);
    if (activeSession) {
      return NextResponse.json({
        sessionId: activeSession.id,
        status: activeSession.status,
        currentNodeId: activeSession.currentNodeId,
        messages: activeSession.messages,
        messageCount: activeSession.messages.length,
      });
    }

    // Try to get persisted session from database
    const persistedSession = await prisma.chatSession.findUnique({
      where: { id: sessionId },
      include: {
        messages: {
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    if (!persistedSession) {
      return NextResponse.json(
        { error: 'Session not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      sessionId: persistedSession.id,
      status: persistedSession.status,
      currentNodeId: persistedSession.currentNodeId,
      messages: persistedSession.messages.map((m) => ({
        id: m.id,
        direction: m.direction,
        content: m.content,
        contentType: m.contentType,
        createdAt: m.createdAt,
      })),
      messageCount: persistedSession.messages.length,
      endedAt: persistedSession.endedAt,
    });
  } catch (error) {
    console.error('Failed to get session:', error);
    return NextResponse.json(
      { error: 'Failed to get session' },
      { status: 500 }
    );
  }
}

// POST /api/chat/:sessionId - Send message
export async function POST(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { sessionId } = await params;
    const body = await request.json();
    const { message } = body;

    if (!message || typeof message !== 'string') {
      return NextResponse.json(
        { error: 'message is required' },
        { status: 400 }
      );
    }

    const sessionManager = getSessionManager();

    // Get active session
    const session = await sessionManager.get(sessionId);
    if (!session) {
      return NextResponse.json(
        { error: 'Session not found or already ended' },
        { status: 404 }
      );
    }

    // Check if session can receive messages
    if (session.status === 'COMPLETED' || session.status === 'ERROR' || session.status === 'TIMEOUT') {
      return NextResponse.json(
        { error: 'Session is ' + session.status.toLowerCase() + ', cannot send messages' },
        { status: 400 }
      );
    }

    // Load flow definition
    const flowDefinition = await loadFlowDefinition(session.flowId);
    if (!flowDefinition) {
      return NextResponse.json(
        { error: 'Flow not found' },
        { status: 404 }
      );
    }

    // Create engine and execute turn
    const engine = new FlowEngine(flowDefinition, sessionManager);
    const result = await engine.executeTurn(sessionId, {
      type: 'user_message',
      payload: { message },
    });

    return NextResponse.json({
      sessionId,
      status: result.sessionStatus,
      messages: result.messages,
      currentNodeId: result.currentNodeId,
      success: result.success,
      error: result.error,
    });
  } catch (error) {
    console.error('Failed to process message:', error);
    return NextResponse.json(
      { error: 'Failed to process message' },
      { status: 500 }
    );
  }
}

// DELETE /api/chat/:sessionId - End session
export async function DELETE(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { sessionId } = await params;
    const sessionManager = getSessionManager();

    // Get active session
    const session = await sessionManager.get(sessionId);
    if (!session) {
      return NextResponse.json(
        { error: 'Session not found or already ended' },
        { status: 404 }
      );
    }

    // End the session
    await sessionManager.endSession(sessionId);

    return NextResponse.json({
      success: true,
      message: 'Session ended',
    });
  } catch (error) {
    console.error('Failed to end session:', error);
    return NextResponse.json(
      { error: 'Failed to end session' },
      { status: 500 }
    );
  }
}
