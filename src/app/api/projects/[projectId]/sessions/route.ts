import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { sessionManager } from '@/lib/session/session-manager';

// GET /api/projects/:projectId/sessions - List sessions
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  try {
    const { projectId } = await params;

    // Get persisted sessions from database
    const sessions = await prisma.chatSession.findMany({
      where: { projectId },
      include: {
        messages: {
          orderBy: { createdAt: 'asc' },
        },
        _count: {
          select: { messages: true, nodeExecutions: true },
        },
      },
      orderBy: { startedAt: 'desc' },
      take: 50,
    });

    // Get active sessions from memory
    const activeSessions = sessionManager.getActiveSessionsByProject(projectId);

    return NextResponse.json({
      sessions: sessions.map(s => ({
        id: s.id,
        projectId: s.projectId,
        flowId: s.flowId,
        channel: s.channel,
        status: s.status,
        currentNodeId: s.currentNodeId,
        summary: s.summary,
        startedAt: s.startedAt,
        endedAt: s.endedAt,
        messages: s.messages.map(m => ({
          id: m.id,
          direction: m.direction,
          content: m.content,
          contentType: m.contentType,
          createdAt: m.createdAt,
        })),
        messageCount: s._count.messages,
        executionCount: s._count.nodeExecutions,
      })),
      activeSessions: activeSessions.map(s => ({
        id: s.id,
        flowId: s.flowId,
        status: s.status,
        currentNodeId: s.currentNodeId,
        messageCount: s.messages.length,
        startedAt: s.createdAt,
      })),
    });
  } catch (error) {
    console.error('Failed to fetch sessions:', error);
    return NextResponse.json(
      { error: 'Failed to fetch sessions' },
      { status: 500 }
    );
  }
}
