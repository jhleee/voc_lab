'use client';

// =============================================================================
// Session History Hook
// =============================================================================

import { useState, useCallback, useEffect } from 'react';
import type { PersistedSession } from '@/lib/session/types';

interface UseSessionsOptions {
  projectId: string;
}

interface ActiveSession {
  id: string;
  flowId: string;
  status: string;
  currentNodeId: string | null;
  messageCount: number;
  startedAt: string;
}

interface UseSessionsReturn {
  sessions: PersistedSession[];
  activeSessions: ActiveSession[];
  isLoading: boolean;
  error: string | null;
  refreshSessions: () => Promise<void>;
  getSessionDetail: (sessionId: string) => Promise<SessionDetail | null>;
}

interface SessionDetail {
  type: 'active' | 'persisted';
  session: PersistedSession | ActiveSessionDetail;
}

interface ActiveSessionDetail {
  id: string;
  projectId: string;
  flowId: string;
  status: string;
  currentNodeId: string | null;
  messages: Array<{
    id: string;
    direction: 'inbound' | 'outbound';
    content: string;
    contentType: string;
    createdAt: string;
  }>;
  executionHistory: Array<{
    nodeId: string;
    nodeType: string;
    startedAt: string;
    endedAt?: string;
    status: string;
    output?: unknown;
    error?: string;
  }>;
  createdAt: string;
  updatedAt: string;
}

export function useSessions({ projectId }: UseSessionsOptions): UseSessionsReturn {
  const [sessions, setSessions] = useState<PersistedSession[]>([]);
  const [activeSessions, setActiveSessions] = useState<ActiveSession[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refreshSessions = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch(`/api/projects/${projectId}/sessions`);
      if (!response.ok) {
        throw new Error('Failed to fetch sessions');
      }

      const data = await response.json();
      setSessions(data.sessions || []);
      setActiveSessions(data.activeSessions || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setIsLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    refreshSessions();
  }, [refreshSessions]);

  const getSessionDetail = useCallback(
    async (sessionId: string): Promise<SessionDetail | null> => {
      try {
        const response = await fetch(
          `/api/projects/${projectId}/sessions/${sessionId}`
        );
        if (!response.ok) {
          if (response.status === 404) return null;
          throw new Error('Failed to fetch session');
        }

        return await response.json();
      } catch (err) {
        console.error('Failed to get session detail:', err);
        return null;
      }
    },
    [projectId]
  );

  return {
    sessions,
    activeSessions,
    isLoading,
    error,
    refreshSessions,
    getSessionDetail,
  };
}
