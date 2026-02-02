import { NextRequest, NextResponse } from 'next/server';
import { getSessionManager } from '@/lib/session';

type RouteParams = {
  params: Promise<{ projectId: string }>;
};

// GET: 프로젝트의 세션 이력 조회
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { projectId } = await params;
    const searchParams = request.nextUrl.searchParams;

    const limit = parseInt(searchParams.get('limit') || '50', 10);
    const offset = parseInt(searchParams.get('offset') || '0', 10);
    const status = searchParams.get('status') || undefined;

    const sessionManager = getSessionManager();

    // 저장된 세션 이력 조회
    const sessions = await sessionManager.getSessionHistory(projectId, {
      limit,
      offset,
      status,
    });

    // 현재 활성 세션도 포함
    const activeSessions = await sessionManager.listByProject(projectId);

    return NextResponse.json({
      sessions,
      activeSessions: activeSessions.map((s) => ({
        id: s.id,
        flowId: s.flowId,
        status: s.status,
        currentNodeId: s.currentNodeId,
        messageCount: s.messages.length,
        startedAt: s.createdAt,
      })),
      total: sessions.length,
      limit,
      offset,
    });
  } catch (error) {
    console.error('Failed to fetch sessions:', error);
    return NextResponse.json(
      { error: 'Failed to fetch sessions' },
      { status: 500 }
    );
  }
}
