// =============================================================================
// Session Persistence Adapter
// =============================================================================
// PostgreSQL 기반 세션 영속화
// =============================================================================

import { prisma } from '@/lib/prisma';
import type { Session, SessionMessage, NodeExecutionRecord } from '@/types/session';
import type {
  SessionPersistenceAdapter,
  PersistedSession,
  PersistedMessage,
  PersistedNodeExecution,
  SessionHistoryOptions,
} from './types';

// -----------------------------------------------------------------------------
// PostgreSQL Persistence Adapter
// -----------------------------------------------------------------------------

export class PostgreSQLPersistenceAdapter implements SessionPersistenceAdapter {
  /**
   * 종료된 세션을 PostgreSQL에 저장합니다.
   */
  async persistSession(session: Session): Promise<void> {
    // 세션 기본 정보 저장
    const chatSession = await prisma.chatSession.create({
      data: {
        id: session.id,
        projectId: session.projectId,
        flowId: session.flowId,
        channel: 'chat', // TODO: 채널 정보 추가
        status: this.mapSessionStatus(session.status),
        currentNodeId: session.currentNodeId,
        variables: session.variables as object,
        checkpoint: session.checkpoint ? (session.checkpoint as object) : undefined,
        startedAt: new Date(session.createdAt),
        endedAt: new Date(session.updatedAt),
      },
    });

    // 메시지 저장
    if (session.messages.length > 0) {
      await prisma.chatMessage.createMany({
        data: session.messages.map((msg) => ({
          id: msg.id,
          sessionId: chatSession.id,
          direction: this.mapMessageDirection(msg.direction),
          content: msg.content,
          contentType: msg.contentType,
          metadata: msg.metadata as object | undefined,
          createdAt: new Date(msg.createdAt),
        })),
      });
    }

    // 노드 실행 이력 저장
    if (session.executionHistory.length > 0) {
      await prisma.nodeExecution.createMany({
        data: session.executionHistory.map((exec, index) => ({
          sessionId: chatSession.id,
          nodeId: exec.nodeId,
          nodeType: exec.nodeType,
          turnNumber: Math.floor(index / 10) + 1, // 대략적인 턴 번호
          inputSnapshot: exec.input as object | undefined,
          outputSnapshot: exec.output as object | undefined,
          status: this.mapExecutionStatus(exec.status),
          errorDetail: exec.error,
          startedAt: new Date(exec.startedAt),
          endedAt: exec.endedAt ? new Date(exec.endedAt) : null,
        })),
      });
    }
  }

  /**
   * 저장된 세션을 조회합니다.
   */
  async getPersistedSession(sessionId: string): Promise<PersistedSession | null> {
    const session = await prisma.chatSession.findUnique({
      where: { id: sessionId },
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
      return null;
    }

    return this.mapToPersistedSession(session);
  }

  /**
   * 프로젝트의 세션 이력을 조회합니다.
   */
  async getSessionHistory(
    projectId: string,
    options?: SessionHistoryOptions
  ): Promise<PersistedSession[]> {
    const sessions = await prisma.chatSession.findMany({
      where: {
        projectId,
        ...(options?.status && { status: options.status as never }),
        ...(options?.startDate && { startedAt: { gte: options.startDate } }),
        ...(options?.endDate && { startedAt: { lte: options.endDate } }),
      },
      include: {
        messages: {
          orderBy: { createdAt: 'asc' },
        },
        nodeExecutions: {
          orderBy: { startedAt: 'asc' },
        },
      },
      orderBy: { startedAt: 'desc' },
      take: options?.limit || 50,
      skip: options?.offset || 0,
    });

    return sessions.map((s) => this.mapToPersistedSession(s));
  }

  // -----------------------------------------------------------------------------
  // Helper Methods
  // -----------------------------------------------------------------------------

  private mapSessionStatus(status: Session['status']): 'INIT' | 'ACTIVE' | 'WAITING_INPUT' | 'WAITING_HUMAN' | 'COMPLETED' | 'TIMEOUT' | 'ERROR' {
    return status as 'INIT' | 'ACTIVE' | 'WAITING_INPUT' | 'WAITING_HUMAN' | 'COMPLETED' | 'TIMEOUT' | 'ERROR';
  }

  private mapMessageDirection(direction: SessionMessage['direction']): 'inbound' | 'outbound' {
    return direction;
  }

  private mapExecutionStatus(
    status: NodeExecutionRecord['status']
  ): 'RUNNING' | 'SUCCESS' | 'ERROR' {
    switch (status) {
      case 'running':
        return 'RUNNING';
      case 'success':
        return 'SUCCESS';
      case 'error':
        return 'ERROR';
      default:
        return 'RUNNING';
    }
  }

  private mapToPersistedSession(session: {
    id: string;
    projectId: string;
    flowId: string;
    channel: string;
    status: string;
    summary: string | null;
    variables: unknown;
    startedAt: Date;
    endedAt: Date | null;
    messages: Array<{
      id: string;
      direction: string;
      content: string;
      contentType: string;
      metadata: unknown;
      createdAt: Date;
    }>;
    nodeExecutions: Array<{
      id: string;
      nodeId: string;
      nodeType: string;
      turnNumber: number;
      inputSnapshot: unknown;
      outputSnapshot: unknown;
      status: string;
      errorDetail: string | null;
      startedAt: Date;
      endedAt: Date | null;
    }>;
  }): PersistedSession {
    return {
      id: session.id,
      projectId: session.projectId,
      flowId: session.flowId,
      channel: session.channel,
      status: session.status,
      summary: session.summary || undefined,
      variables: session.variables as Record<string, unknown> | undefined,
      startedAt: session.startedAt,
      endedAt: session.endedAt || undefined,
      messages: session.messages.map((m): PersistedMessage => ({
        id: m.id,
        direction: m.direction as 'inbound' | 'outbound',
        content: m.content,
        contentType: m.contentType,
        metadata: m.metadata as Record<string, unknown> | undefined,
        createdAt: m.createdAt,
      })),
      nodeExecutions: session.nodeExecutions.map((e): PersistedNodeExecution => ({
        id: e.id,
        nodeId: e.nodeId,
        nodeType: e.nodeType,
        turnNumber: e.turnNumber,
        inputSnapshot: e.inputSnapshot as Record<string, unknown> | undefined,
        outputSnapshot: e.outputSnapshot as Record<string, unknown> | undefined,
        status: e.status as 'RUNNING' | 'SUCCESS' | 'ERROR',
        errorDetail: e.errorDetail || undefined,
        startedAt: e.startedAt,
        endedAt: e.endedAt || undefined,
      })),
    };
  }
}

// -----------------------------------------------------------------------------
// Singleton Instance
// -----------------------------------------------------------------------------

let persistenceAdapterInstance: PostgreSQLPersistenceAdapter | null = null;

export function getPersistenceAdapter(): SessionPersistenceAdapter {
  if (!persistenceAdapterInstance) {
    persistenceAdapterInstance = new PostgreSQLPersistenceAdapter();
  }
  return persistenceAdapterInstance;
}
