'use client';

import { useState } from 'react';
import { ChevronDown, ChevronRight, Bug, Play, Clock, CheckCircle2, XCircle, Variable } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import type { Session, NodeExecutionRecord } from '@/types/session';
import { cn } from '@/lib/utils';

interface ExecutionDebugPanelProps {
  session: Session | null;
  isExpanded: boolean;
  onToggle: () => void;
}

export function ExecutionDebugPanel({
  session,
  isExpanded,
  onToggle,
}: ExecutionDebugPanelProps) {
  const [variablesOpen, setVariablesOpen] = useState(true);
  const [historyOpen, setHistoryOpen] = useState(true);

  if (!session) {
    return null;
  }

  const executionHistory = session.executionHistory || [];
  const variables = session.variables;

  return (
    <div className="border-t bg-muted/30">
      <Button
        variant="ghost"
        size="sm"
        onClick={onToggle}
        className="w-full flex items-center justify-between px-4 py-2 h-auto hover:bg-muted/50"
      >
        <div className="flex items-center gap-2">
          <Bug className="h-4 w-4" />
          <span className="text-sm font-medium">디버그 패널</span>
        </div>
        {isExpanded ? (
          <ChevronDown className="h-4 w-4" />
        ) : (
          <ChevronRight className="h-4 w-4" />
        )}
      </Button>

      {isExpanded && (
        <ScrollArea className="h-[200px] px-4 pb-4">
          {/* Current Node */}
          <div className="mb-3">
            <div className="text-xs font-medium text-muted-foreground mb-1">
              현재 노드
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-xs">
                {session.currentNodeId || '없음'}
              </Badge>
              <Badge
                variant="secondary"
                className={cn(
                  'text-xs',
                  session.status === 'ACTIVE' && 'bg-green-500/10 text-green-600',
                  session.status === 'WAITING_INPUT' && 'bg-yellow-500/10 text-yellow-600',
                  session.status === 'COMPLETED' && 'bg-blue-500/10 text-blue-600',
                  session.status === 'ERROR' && 'bg-red-500/10 text-red-600'
                )}
              >
                {session.status}
              </Badge>
            </div>
          </div>

          {/* Variables */}
          <Collapsible open={variablesOpen} onOpenChange={setVariablesOpen}>
            <CollapsibleTrigger className="flex items-center gap-1 text-xs font-medium text-muted-foreground mb-1 hover:text-foreground">
              {variablesOpen ? (
                <ChevronDown className="h-3 w-3" />
              ) : (
                <ChevronRight className="h-3 w-3" />
              )}
              <Variable className="h-3 w-3 mr-1" />
              변수
            </CollapsibleTrigger>
            <CollapsibleContent>
              <div className="bg-muted/50 rounded p-2 mb-3 text-xs font-mono">
                <div className="space-y-1">
                  <div className="text-muted-foreground">session:</div>
                  <div className="pl-2">
                    <div>lastUserInput: {JSON.stringify(variables.session?.lastUserInput || '')}</div>
                    <div>currentIntent: {JSON.stringify(variables.session?.currentIntent || '')}</div>
                    <div>sessionId: {variables.session?.sessionId}</div>
                  </div>
                  {Object.keys(variables.nodes || {}).length > 0 && (
                    <>
                      <div className="text-muted-foreground mt-2">node outputs:</div>
                      <div className="pl-2">
                        {Object.entries(variables.nodes || {}).map(([nodeId, nodeResult]) => (
                          <div key={nodeId} className="truncate">
                            {nodeId}: {JSON.stringify(nodeResult?.output).slice(0, 50)}
                          </div>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              </div>
            </CollapsibleContent>
          </Collapsible>

          {/* Execution History */}
          <Collapsible open={historyOpen} onOpenChange={setHistoryOpen}>
            <CollapsibleTrigger className="flex items-center gap-1 text-xs font-medium text-muted-foreground mb-1 hover:text-foreground">
              {historyOpen ? (
                <ChevronDown className="h-3 w-3" />
              ) : (
                <ChevronRight className="h-3 w-3" />
              )}
              <Clock className="h-3 w-3 mr-1" />
              실행 이력 ({executionHistory.length})
            </CollapsibleTrigger>
            <CollapsibleContent>
              <div className="space-y-1">
                {executionHistory.length === 0 ? (
                  <div className="text-xs text-muted-foreground py-2">
                    실행 이력이 없습니다.
                  </div>
                ) : (
                  executionHistory.slice(-10).map((record, index) => (
                    <ExecutionRecordItem key={index} record={record} />
                  ))
                )}
              </div>
            </CollapsibleContent>
          </Collapsible>
        </ScrollArea>
      )}
    </div>
  );
}

function ExecutionRecordItem({ record }: { record: NodeExecutionRecord }) {
  const isSuccess = record.status === 'success';
  const isError = record.status === 'error';

  return (
    <div className="flex items-center gap-2 py-1 px-2 bg-muted/30 rounded text-xs">
      {isSuccess ? (
        <CheckCircle2 className="h-3 w-3 text-green-500 flex-shrink-0" />
      ) : isError ? (
        <XCircle className="h-3 w-3 text-red-500 flex-shrink-0" />
      ) : (
        <Play className="h-3 w-3 text-blue-500 flex-shrink-0" />
      )}
      <span className="font-medium truncate">{record.nodeId}</span>
      <Badge variant="outline" className="text-[10px] h-4">
        {record.nodeType}
      </Badge>
      {record.error && (
        <span className="text-red-500 truncate">{record.error}</span>
      )}
    </div>
  );
}
