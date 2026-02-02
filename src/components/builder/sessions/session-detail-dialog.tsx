'use client';

import {
  MessageSquare,
  Bot,
  User,
  Clock,
  CheckCircle2,
  XCircle,
  Loader2,
  Play,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';

interface SessionDetailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sessionDetail: unknown;
  isLoading: boolean;
}

interface Message {
  id: string;
  direction: 'inbound' | 'outbound';
  content: string;
  contentType: string;
  createdAt: string | Date;
}

interface NodeExecution {
  id?: string;
  nodeId: string;
  nodeType: string;
  turnNumber?: number;
  startedAt: string | Date;
  endedAt?: string | Date | null;
  status: string;
  outputSnapshot?: unknown;
  output?: unknown;
  errorDetail?: string;
  error?: string;
}

interface SessionData {
  id: string;
  status: string;
  messages: Message[];
  nodeExecutions?: NodeExecution[];
  executionHistory?: NodeExecution[];
  startedAt?: string | Date;
  createdAt?: string | Date;
  endedAt?: string | Date;
  updatedAt?: string | Date;
}

export function SessionDetailDialog({
  open,
  onOpenChange,
  sessionDetail,
  isLoading,
}: SessionDetailDialogProps) {
  if (!open) return null;

  const detail = sessionDetail as { type: string; session: SessionData } | null;
  const session = detail?.session;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            세션 상세 정보
            {session && (
              <Badge variant="outline" className="ml-2">
                #{session.id.slice(-6)}
              </Badge>
            )}
          </DialogTitle>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : !session ? (
          <div className="text-center py-12 text-muted-foreground">
            세션을 찾을 수 없습니다.
          </div>
        ) : (
          <Tabs defaultValue="messages" className="w-full">
            <TabsList className="w-full grid grid-cols-2">
              <TabsTrigger value="messages">
                대화 내용 ({session.messages?.length || 0})
              </TabsTrigger>
              <TabsTrigger value="executions">
                실행 이력 ({(session.nodeExecutions || session.executionHistory)?.length || 0})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="messages" className="mt-4">
              <ScrollArea className="h-[400px] pr-4">
                <div className="space-y-4">
                  {session.messages?.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      메시지가 없습니다.
                    </div>
                  ) : (
                    session.messages?.map((msg: Message) => (
                      <div
                        key={msg.id}
                        className={cn(
                          'flex gap-3',
                          msg.direction === 'inbound' ? 'justify-start' : 'justify-end'
                        )}
                      >
                        {msg.direction === 'inbound' && (
                          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100">
                            <User className="h-4 w-4 text-blue-600" />
                          </div>
                        )}
                        <div
                          className={cn(
                            'max-w-[70%] rounded-lg px-4 py-2',
                            msg.direction === 'inbound'
                              ? 'bg-muted'
                              : 'bg-primary text-primary-foreground'
                          )}
                        >
                          <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                          <p
                            className={cn(
                              'text-xs mt-1',
                              msg.direction === 'inbound'
                                ? 'text-muted-foreground'
                                : 'text-primary-foreground/70'
                            )}
                          >
                            {new Date(msg.createdAt).toLocaleTimeString('ko-KR')}
                          </p>
                        </div>
                        {msg.direction === 'outbound' && (
                          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
                            <Bot className="h-4 w-4 text-primary" />
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </ScrollArea>
            </TabsContent>

            <TabsContent value="executions" className="mt-4">
              <ScrollArea className="h-[400px] pr-4">
                <div className="space-y-2">
                  {(session.nodeExecutions || session.executionHistory)?.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      실행 이력이 없습니다.
                    </div>
                  ) : (
                    (session.nodeExecutions || session.executionHistory)?.map(
                      (exec: NodeExecution, index: number) => (
                        <div
                          key={exec.id || index}
                          className="flex items-start gap-3 p-3 rounded-lg border"
                        >
                          <div
                            className={cn(
                              'flex h-8 w-8 items-center justify-center rounded-full',
                              exec.status === 'SUCCESS' || exec.status === 'success'
                                ? 'bg-green-100'
                                : exec.status === 'ERROR' || exec.status === 'error'
                                ? 'bg-red-100'
                                : 'bg-blue-100'
                            )}
                          >
                            {exec.status === 'SUCCESS' || exec.status === 'success' ? (
                              <CheckCircle2 className="h-4 w-4 text-green-600" />
                            ) : exec.status === 'ERROR' || exec.status === 'error' ? (
                              <XCircle className="h-4 w-4 text-red-600" />
                            ) : (
                              <Play className="h-4 w-4 text-blue-600" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-sm">{exec.nodeId}</span>
                              <Badge variant="outline" className="text-xs">
                                {exec.nodeType}
                              </Badge>
                              {exec.turnNumber !== undefined && (
                                <Badge variant="secondary" className="text-xs">
                                  턴 {exec.turnNumber}
                                </Badge>
                              )}
                            </div>
                            <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                              <Clock className="h-3 w-3" />
                              {new Date(exec.startedAt).toLocaleTimeString('ko-KR')}
                              {exec.endedAt && (
                                <span>
                                  → {new Date(exec.endedAt).toLocaleTimeString('ko-KR')}
                                </span>
                              )}
                            </div>
                            {(exec.errorDetail || exec.error) && (
                              <p className="text-xs text-destructive mt-1">
                                {exec.errorDetail || exec.error}
                              </p>
                            )}
                          </div>
                        </div>
                      )
                    )
                  )}
                </div>
              </ScrollArea>
            </TabsContent>
          </Tabs>
        )}
      </DialogContent>
    </Dialog>
  );
}
