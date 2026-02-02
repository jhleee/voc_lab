'use client';

import { useEffect, useRef, useState } from 'react';
import { X, RotateCcw, AlertCircle, Bug } from 'lucide-react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ChatInput } from './chat-input';
import { ExecutionDebugPanel } from './execution-debug-panel';
import { useChatDrawer } from '@/hooks/use-chat-drawer';
import { useFlowStore } from '@/hooks/use-flow-store';
import { useFlowExecution } from '@/hooks/use-flow-execution';
import type { FlowDefinition } from '@/lib/execution/flow-engine';
import { cn } from '@/lib/utils';

export function ChatDrawer() {
  const { isOpen, close } = useChatDrawer();
  const { nodes, edges, flowId, projectId, setCurrentExecutingNode } = useFlowStore();
  const {
    session,
    messages,
    isRunning,
    isLoading,
    error,
    startSession,
    sendMessage,
    stopSession,
  } = useFlowExecution();

  const scrollRef = useRef<HTMLDivElement>(null);
  const [debugPanelOpen, setDebugPanelOpen] = useState(false);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  // Highlight current executing node in the flow canvas
  useEffect(() => {
    if (session?.currentNodeId && setCurrentExecutingNode) {
      setCurrentExecutingNode(session.currentNodeId);
    } else if (setCurrentExecutingNode) {
      setCurrentExecutingNode(null);
    }
  }, [session?.currentNodeId, setCurrentExecutingNode]);

  // Start session when drawer opens
  useEffect(() => {
    console.log('[ChatDrawer] useEffect triggered', {
      isOpen,
      hasSession: !!session,
      isLoading,
      flowId,
      projectId,
      nodesCount: nodes.length,
    });
    if (isOpen && !session && !isLoading && flowId && projectId && nodes.length > 0) {
      console.log('[ChatDrawer] Starting session...');
      const flow: FlowDefinition = {
        id: flowId,
        nodes,
        edges,
      };
      startSession(flow, projectId);
    }
  }, [isOpen, session, isLoading, flowId, projectId, nodes, edges, startSession]);

  const handleSend = async (content: string) => {
    await sendMessage(content);
  };

  const handleRestart = () => {
    stopSession();
    if (flowId && projectId && nodes.length > 0) {
      const flow: FlowDefinition = {
        id: flowId,
        nodes,
        edges,
      };
      startSession(flow, projectId);
    }
  };

  const handleClose = () => {
    stopSession();
    close();
  };

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <SheetContent className="w-[400px] sm:w-[540px] flex flex-col p-0">
        <SheetHeader className="px-4 py-3 border-b">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <SheetTitle>챗봇 테스트</SheetTitle>
              {session && (
                <Badge variant={isRunning ? 'default' : 'secondary'}>
                  {isRunning ? '실행 중' : '종료됨'}
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setDebugPanelOpen(!debugPanelOpen)}
                title="디버그 패널"
                className={cn(debugPanelOpen && 'bg-muted')}
              >
                <Bug className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleRestart}
                title="다시 시작"
              >
                <RotateCcw className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon" onClick={handleClose}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </SheetHeader>

        {!flowId && (
          <div className="px-4 py-2 bg-yellow-500/10 border-b border-yellow-500/20">
            <div className="flex items-center gap-2 text-sm text-yellow-700">
              <AlertCircle className="h-4 w-4" />
              플로우가 저장되지 않았습니다. 플로우를 저장한 후 테스트하세요.
            </div>
          </div>
        )}

        {error && (
          <div className="px-4 py-2 bg-destructive/10 border-b border-destructive/20">
            <div className="flex items-center gap-2 text-sm text-destructive">
              <AlertCircle className="h-4 w-4" />
              {error}
            </div>
          </div>
        )}

        <ScrollArea className="flex-1 p-4" ref={scrollRef}>
          <div className="space-y-4">
            {messages.length === 0 && !isLoading && (
              <div className="text-center text-muted-foreground text-sm py-8">
                플로우가 시작되었습니다. 메시지를 입력하세요.
              </div>
            )}
            {messages.map((message) => (
              <div
                key={message.id}
                className={cn(
                  'flex',
                  message.direction === 'inbound' ? 'justify-end' : 'justify-start'
                )}
              >
                <div
                  className={cn(
                    'max-w-[80%] rounded-lg px-4 py-2',
                    message.direction === 'inbound'
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted'
                  )}
                >
                  <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                  <p className="text-xs opacity-70 mt-1">
                    {new Date(message.createdAt).toLocaleTimeString('ko-KR', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </p>
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-muted rounded-lg px-4 py-2">
                  <div className="flex items-center gap-2">
                    <span className="animate-pulse">●</span>
                    <span className="text-sm text-muted-foreground">처리 중...</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </ScrollArea>

        {/* Debug Panel */}
        <ExecutionDebugPanel
          session={session}
          isExpanded={debugPanelOpen}
          onToggle={() => setDebugPanelOpen(!debugPanelOpen)}
        />

        <ChatInput
          onSend={handleSend}
          disabled={isLoading || !isRunning || !flowId}
        />
      </SheetContent>
    </Sheet>
  );
}
