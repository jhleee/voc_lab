'use client';

import {
  MessageSquare,
  Users,
  TrendingUp,
  Activity,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Rocket,
  RefreshCw,
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useProjectStats } from '@/hooks/use-project-stats';
import { cn } from '@/lib/utils';

interface ProjectDashboardProps {
  projectId: string;
}

export function ProjectDashboard({ projectId }: ProjectDashboardProps) {
  const { stats, isLoading, error, refreshStats } = useProjectStats({ projectId });

  if (isLoading) {
    return (
      <div className="h-full p-6 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4" />
          <p className="text-muted-foreground">통계 불러오는 중...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-full p-6">
        <div className="text-center py-12 text-destructive">
          <AlertCircle className="h-12 w-12 mx-auto mb-4" />
          <p>{error}</p>
          <Button variant="outline" className="mt-4" onClick={refreshStats}>
            <RefreshCw className="h-4 w-4 mr-2" />
            다시 시도
          </Button>
        </div>
      </div>
    );
  }

  if (!stats) {
    return null;
  }

  const statusConfig: Record<string, { label: string; color: string; icon: typeof CheckCircle2 }> = {
    COMPLETED: { label: '완료', color: 'text-green-600', icon: CheckCircle2 },
    ACTIVE: { label: '진행 중', color: 'text-blue-600', icon: Activity },
    WAITING_INPUT: { label: '입력 대기', color: 'text-yellow-600', icon: Clock },
    ERROR: { label: '오류', color: 'text-red-600', icon: XCircle },
    TIMEOUT: { label: '타임아웃', color: 'text-orange-600', icon: AlertCircle },
  };

  return (
    <div className="h-full p-6 overflow-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold mb-2">대시보드</h1>
          <p className="text-muted-foreground">
            프로젝트 현황 및 통계를 확인합니다.
          </p>
        </div>
        <Button variant="outline" onClick={refreshStats}>
          <RefreshCw className="h-4 w-4 mr-2" />
          새로고침
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">총 세션</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.summary.totalSessions}</div>
            <p className="text-xs text-muted-foreground">
              최근 7일: {stats.summary.recentSessions}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">활성 세션</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {stats.summary.activeSessions}
            </div>
            <p className="text-xs text-muted-foreground">
              현재 진행 중인 대화
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">총 메시지</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.summary.totalMessages}</div>
            <p className="text-xs text-muted-foreground">
              평균 {stats.summary.avgMessagesPerSession}개/세션
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">플로우</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.flows.length}</div>
            <p className="text-xs text-muted-foreground">
              {stats.flows.filter((f) => f.isPublished).length}개 배포됨
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Sessions by Status */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">세션 상태 분포</CardTitle>
            <CardDescription>상태별 세션 수</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {Object.entries(stats.sessionsByStatus).map(([status, count]) => {
                const config = statusConfig[status] || { label: status, color: 'text-gray-600', icon: Clock };
                const StatusIcon = config.icon;
                const percentage = stats.summary.totalSessions > 0
                  ? Math.round((count / stats.summary.totalSessions) * 100)
                  : 0;

                return (
                  <div key={status} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <StatusIcon className={cn('h-4 w-4', config.color)} />
                      <span className="text-sm">{config.label}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-24 h-2 bg-muted rounded-full overflow-hidden">
                        <div
                          className={cn('h-full bg-current rounded-full', config.color)}
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                      <span className="text-sm text-muted-foreground w-12 text-right">
                        {count}
                      </span>
                    </div>
                  </div>
                );
              })}
              {Object.keys(stats.sessionsByStatus).length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-4">
                  아직 세션이 없습니다.
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Flows */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">플로우 현황</CardTitle>
            <CardDescription>등록된 플로우 목록</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {stats.flows.map((flow) => (
                <div key={flow.id} className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/50">
                  <div className="flex items-center gap-3">
                    {flow.isPublished ? (
                      <Rocket className="h-4 w-4 text-green-500" />
                    ) : (
                      <Rocket className="h-4 w-4 text-muted-foreground" />
                    )}
                    <div>
                      <p className="text-sm font-medium">{flow.name}</p>
                      <p className="text-xs text-muted-foreground">
                        v{flow.version} · {flow.sessionCount}개 세션
                      </p>
                    </div>
                  </div>
                  <Badge variant={flow.isPublished ? 'default' : 'secondary'}>
                    {flow.isPublished ? '배포됨' : '미배포'}
                  </Badge>
                </div>
              ))}
              {stats.flows.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-4">
                  등록된 플로우가 없습니다.
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Recent Sessions */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="text-lg">최근 세션</CardTitle>
            <CardDescription>가장 최근에 생성된 세션 5개</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {stats.recentSessions.map((session) => {
                const config = statusConfig[session.status] || { label: session.status, color: 'text-gray-600', icon: Clock };
                const StatusIcon = config.icon;

                return (
                  <div
                    key={session.id}
                    className="flex items-center justify-between p-3 rounded-lg border"
                  >
                    <div className="flex items-center gap-3">
                      <StatusIcon className={cn('h-5 w-5', config.color)} />
                      <div>
                        <p className="text-sm font-medium">
                          세션 #{session.id.slice(-6)}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(session.createdAt).toLocaleString('ko-KR')}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <p className="text-sm">{session.messageCount}개 메시지</p>
                        {session.endedAt && (
                          <p className="text-xs text-muted-foreground">
                            종료: {new Date(session.endedAt).toLocaleTimeString('ko-KR')}
                          </p>
                        )}
                      </div>
                      <Badge variant="outline" className={config.color}>
                        {config.label}
                      </Badge>
                    </div>
                  </div>
                );
              })}
              {stats.recentSessions.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-8">
                  아직 세션이 없습니다.
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
