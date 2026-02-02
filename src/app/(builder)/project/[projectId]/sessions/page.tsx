'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import {
  MessageSquare,
  Clock,
  CheckCircle2,
  AlertCircle,
  Loader2,
  RefreshCw,
  ChevronRight,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useSessions } from '@/hooks/use-sessions';
import { SessionDetailDialog } from '@/components/builder/sessions/session-detail-dialog';
import { cn } from '@/lib/utils';

const statusConfig: Record<string, { label: string; color: string; icon: typeof CheckCircle2 }> = {
  INIT: { label: '초기화', color: 'bg-gray-500/10 text-gray-600', icon: Clock },
  ACTIVE: { label: '진행 중', color: 'bg-blue-500/10 text-blue-600', icon: Loader2 },
  WAITING_INPUT: { label: '입력 대기', color: 'bg-yellow-500/10 text-yellow-600', icon: Clock },
  WAITING_HUMAN: { label: '상담원 대기', color: 'bg-purple-500/10 text-purple-600', icon: Clock },
  COMPLETED: { label: '완료', color: 'bg-green-500/10 text-green-600', icon: CheckCircle2 },
  TIMEOUT: { label: '타임아웃', color: 'bg-orange-500/10 text-orange-600', icon: AlertCircle },
  ERROR: { label: '오류', color: 'bg-red-500/10 text-red-600', icon: AlertCircle },
};

export default function SessionsPage() {
  const params = useParams();
  const projectId = params.projectId as string;

  const { sessions, activeSessions, isLoading, error, refreshSessions, getSessionDetail } =
    useSessions({ projectId });

  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);
  const [sessionDetail, setSessionDetail] = useState<unknown>(null);
  const [isLoadingDetail, setIsLoadingDetail] = useState(false);

  const handleViewSession = async (sessionId: string) => {
    setSelectedSessionId(sessionId);
    setIsLoadingDetail(true);
    try {
      const detail = await getSessionDetail(sessionId);
      setSessionDetail(detail);
    } finally {
      setIsLoadingDetail(false);
    }
  };

  const handleCloseDialog = () => {
    setSelectedSessionId(null);
    setSessionDetail(null);
  };

  return (
    <div className="h-full p-6 overflow-auto">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold mb-2">대화 기록</h1>
          <p className="text-muted-foreground">
            챗봇 대화 세션 및 실행 이력을 확인합니다.
          </p>
        </div>
        <Button variant="outline" onClick={refreshSessions} disabled={isLoading}>
          <RefreshCw className={cn('h-4 w-4 mr-2', isLoading && 'animate-spin')} />
          새로고침
        </Button>
      </div>

      {error && (
        <div className="mb-4 p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
          {error}
        </div>
      )}

      {/* Active Sessions */}
      {activeSessions.length > 0 && (
        <div className="mb-8">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin text-blue-500" />
            진행 중인 세션 ({activeSessions.length})
          </h2>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {activeSessions.map((session) => {
              const status = statusConfig[session.status] || statusConfig.ACTIVE;
              const StatusIcon = status.icon;
              return (
                <Card
                  key={session.id}
                  className="cursor-pointer hover:shadow-md transition-shadow"
                  onClick={() => handleViewSession(session.id)}
                >
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-sm font-medium">
                        세션 #{session.id.slice(-6)}
                      </CardTitle>
                      <Badge variant="secondary" className={cn('text-xs', status.color)}>
                        <StatusIcon className="h-3 w-3 mr-1" />
                        {status.label}
                      </Badge>
                    </div>
                    <CardDescription className="text-xs">
                      {new Date(session.startedAt).toLocaleString('ko-KR')}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <MessageSquare className="h-3 w-3" />
                        {session.messageCount} 메시지
                      </span>
                      <ChevronRight className="h-4 w-4" />
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {/* Session History */}
      <div>
        <h2 className="text-lg font-semibold mb-4">세션 히스토리</h2>
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : sessions.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>저장된 세션이 없습니다.</p>
            <p className="text-sm mt-1">
              채팅 테스트를 통해 세션을 생성해보세요.
            </p>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {sessions.map((session) => {
              const status = statusConfig[session.status] || statusConfig.COMPLETED;
              const StatusIcon = status.icon;
              return (
                <Card
                  key={session.id}
                  className="cursor-pointer hover:shadow-md transition-shadow"
                  onClick={() => handleViewSession(session.id)}
                >
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-sm font-medium">
                        세션 #{session.id.slice(-6)}
                      </CardTitle>
                      <Badge variant="secondary" className={cn('text-xs', status.color)}>
                        <StatusIcon className="h-3 w-3 mr-1" />
                        {status.label}
                      </Badge>
                    </div>
                    <CardDescription className="text-xs">
                      {new Date(session.startedAt).toLocaleString('ko-KR')}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <MessageSquare className="h-3 w-3" />
                        {session.messages.length} 메시지
                      </span>
                      <ChevronRight className="h-4 w-4" />
                    </div>
                    {session.summary && (
                      <p className="text-xs text-muted-foreground mt-2 line-clamp-2">
                        {session.summary}
                      </p>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* Session Detail Dialog */}
      <SessionDetailDialog
        open={!!selectedSessionId}
        onOpenChange={(open) => !open && handleCloseDialog()}
        sessionDetail={sessionDetail}
        isLoading={isLoadingDetail}
      />
    </div>
  );
}
