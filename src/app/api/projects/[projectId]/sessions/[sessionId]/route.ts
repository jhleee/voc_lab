import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { sessionManager } from '@/lib/session/session-manager';

// GET /api/projects/:projectId/sessions/:sessionId - Get session detail
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ projectId: string; sessionId: string }> }
) {
  try {
    const { projectId, sessionId } = await params;

    // First check in-memory store for active session
    const activeSession = await sessionManager.get(sessionId);
    if (activeSession && activeSession.projectId === projectId) {
      return NextResponse.json({
        type: 'active',
        session: {
          id: activeSession.id,
          projectId: activeSession.projectId,
          flowId: activeSession.flowId,
          status: activeSession.status,
          currentNodeId: activeSession.currentNodeId,
          messages: activeSession.messages.map(m => ({
            id: m.id,
            direction: m.direction,
            content: m.content,
            contentType: m.contentType,
            createdAt: m.createdAt,
          })),
          executionHistory: activeSession.executionHistory.map(e => ({
            nodeId: e.nodeId,
            nodeType: e.nodeType,
            startedAt: e.startedAt,
            endedAt: e.endedAt,
            status: e.status,
            output: e.output,
            error: e.error,
          })),
          createdAt: activeSession.createdAt,
          updatedAt: activeSession.updatedAt,
        },
      });
    }

    // Check persisted sessions in database
    const session = await prisma.chatSession.findFirst({
      where: {
        id: sessionId,
        projectId,
      },
      include: {
        messages: {
          orderBy: { createdAt: 'asc' },
        },
        nodeExecutions: {
          orderBy: { startedAt: 'asc' },
        },
      },
    });

    if (!session) {
      return NextResponse.json(
        { error: 'Session not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      type: 'persisted',
      session: {
        id: session.id,
        projectId: session.projectId,
        flowId: session.flowId,
        channel: session.channel,
        status: session.status,
        currentNodeId: session.currentNodeId,
        summary: session.summary,
        startedAt: session.startedAt,
        endedAt: session.endedAt,
        messages: session.messages.map(m => ({
          id: m.id,
          direction: m.direction,
          content: m.content,
          contentType: m.contentType,
          createdAt: m.createdAt,
        })),
        nodeExecutions: session.nodeExecutions.map(e => ({
          id: e.id,
          nodeId: e.nodeId,
          nodeType: e.nodeType,
          turnNumber: e.turnNumber,
          startedAt: e.startedAt,
          endedAt: e.endedAt,
          status: e.status,
          outputSnapshot: e.outputSnapshot,
          errorDetail: e.errorDetail,
        })),
      },
    });
  } catch (error) {
    console.error('Failed to fetch session detail:', error);
    return NextResponse.json(
      { error: 'Failed to fetch session detail' },
      { status: 500 }
    );
  }
}
