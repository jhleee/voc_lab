import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { sessionManager } from '@/lib/session/session-manager';

interface RouteParams {
  params: Promise<{ projectId: string }>;
}

// GET /api/projects/:projectId/stats - Get project statistics
export async function GET(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { projectId } = await params;

    // Get date for last 7 days
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    // Get total session count
    const totalSessions = await prisma.chatSession.count({
      where: { projectId },
    });

    // Get sessions in last 7 days
    const recentSessions = await prisma.chatSession.count({
      where: {
        projectId,
        createdAt: { gte: sevenDaysAgo },
      },
    });

    // Get sessions by status
    const sessionsByStatus = await prisma.chatSession.groupBy({
      by: ['status'],
      where: { projectId },
      _count: { status: true },
    });

    // Get total message count
    const totalMessages = await prisma.chatMessage.count({
      where: {
        session: { projectId },
      },
    });

    // Get average messages per session
    const avgMessagesResult = await prisma.chatMessage.groupBy({
      by: ['sessionId'],
      where: {
        session: { projectId },
      },
      _count: { id: true },
    });
    const avgMessagesPerSession = avgMessagesResult.length > 0
      ? avgMessagesResult.reduce((sum, s) => sum + s._count.id, 0) / avgMessagesResult.length
      : 0;

    // Get sessions per day for last 7 days
    const sessionsPerDay = await prisma.$queryRaw<Array<{ date: Date; count: bigint }>>`
      SELECT DATE(created_at) as date, COUNT(*) as count
      FROM "ChatSession"
      WHERE project_id = ${projectId}
        AND created_at >= ${sevenDaysAgo}
      GROUP BY DATE(created_at)
      ORDER BY date ASC
    `;

    // Get recent sessions (last 5)
    const recentSessionsList = await prisma.chatSession.findMany({
      where: { projectId },
      orderBy: { createdAt: 'desc' },
      take: 5,
      include: {
        _count: {
          select: { messages: true },
        },
      },
    });

    // Get flow stats
    const flowStats = await prisma.flow.findMany({
      where: { projectId },
      select: {
        id: true,
        name: true,
        isPublished: true,
        version: true,
        _count: {
          select: { chatSessions: true },
        },
      },
    });

    // Get active sessions from memory
    const activeSessions = sessionManager.getActiveSessionsByProject(projectId);

    return NextResponse.json({
      summary: {
        totalSessions,
        recentSessions,
        activeSessions: activeSessions.length,
        totalMessages,
        avgMessagesPerSession: Math.round(avgMessagesPerSession * 10) / 10,
      },
      sessionsByStatus: sessionsByStatus.reduce((acc, s) => {
        acc[s.status] = s._count.status;
        return acc;
      }, {} as Record<string, number>),
      sessionsPerDay: sessionsPerDay.map((d) => ({
        date: d.date.toISOString().split('T')[0],
        count: Number(d.count),
      })),
      recentSessions: recentSessionsList.map((s) => ({
        id: s.id,
        status: s.status,
        messageCount: s._count.messages,
        createdAt: s.createdAt,
        endedAt: s.endedAt,
      })),
      flows: flowStats.map((f) => ({
        id: f.id,
        name: f.name,
        isPublished: f.isPublished,
        version: f.version,
        sessionCount: f._count.chatSessions,
      })),
    });
  } catch (error) {
    console.error('Failed to fetch project stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch project stats' },
      { status: 500 }
    );
  }
}
