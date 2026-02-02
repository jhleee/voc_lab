'use client';

import { useState, useEffect, useCallback } from 'react';

interface ProjectStats {
  summary: {
    totalSessions: number;
    recentSessions: number;
    activeSessions: number;
    totalMessages: number;
    avgMessagesPerSession: number;
  };
  sessionsByStatus: Record<string, number>;
  sessionsPerDay: Array<{ date: string; count: number }>;
  recentSessions: Array<{
    id: string;
    status: string;
    messageCount: number;
    createdAt: string;
    endedAt: string | null;
  }>;
  flows: Array<{
    id: string;
    name: string;
    isPublished: boolean;
    version: number;
    sessionCount: number;
  }>;
}

interface UseProjectStatsOptions {
  projectId: string;
}

interface UseProjectStatsReturn {
  stats: ProjectStats | null;
  isLoading: boolean;
  error: string | null;
  refreshStats: () => Promise<void>;
}

export function useProjectStats({ projectId }: UseProjectStatsOptions): UseProjectStatsReturn {
  const [stats, setStats] = useState<ProjectStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refreshStats = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch(`/api/projects/${projectId}/stats`);
      if (!response.ok) {
        throw new Error('Failed to fetch project stats');
      }

      const data = await response.json();
      setStats(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setIsLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    refreshStats();
  }, [refreshStats]);

  return {
    stats,
    isLoading,
    error,
    refreshStats,
  };
}
