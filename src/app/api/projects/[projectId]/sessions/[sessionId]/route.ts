import { NextRequest, NextResponse } from 'next/server';
import { getSessionManager } from '@/lib/session';

type RouteParams = {
  params: Promise<{ projectId: string; sessionId: string }>;
};

// GET: 단일 세션 상세 조회
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { projectId, sessionId } = await params;
    const sessionManager = getSessionManager();

    // 먼저 활성 세션에서 찾기
    const activeSession = await sessionManager.get(sessionId);
    if (activeSession && activeSession.projectId === projectId) {
      return NextResponse.json({
        type: 'active',
        session: activeSession,
      });
    }

    // 저장된 세션에서 찾기
    const persistedSession = await sessionManager.getPersistedSession(sessionId);
    if (persistedSession && persistedSession.projectId === projectId) {
      return NextResponse.json({
        type: 'persisted',
        session: persistedSession,
      });
    }

    return NextResponse.json(
      { error: 'Session not found' },
      { status: 404 }
    );
  } catch (error) {
    console.error('Failed to fetch session:', error);
    return NextResponse.json(
      { error: 'Failed to fetch session' },
      { status: 500 }
    );
  }
}

// DELETE: 세션 삭제 (활성 세션만)
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { projectId, sessionId } = await params;
    const sessionManager = getSessionManager();

    const session = await sessionManager.get(sessionId);
    if (!session) {
      return NextResponse.json(
        { error: 'Active session not found' },
        { status: 404 }
      );
    }

    if (session.projectId !== projectId) {
      return NextResponse.json(
        { error: 'Session does not belong to this project' },
        { status: 403 }
      );
    }

    await sessionManager.delete(sessionId);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to delete session:', error);
    return NextResponse.json(
      { error: 'Failed to delete session' },
      { status: 500 }
    );
  }
}
