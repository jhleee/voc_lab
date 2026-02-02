'use client';

// =============================================================================
// Flow Validation Panel
// =============================================================================
// 플로우 유효성 검사 결과를 표시하는 패널
// =============================================================================

import { useMemo, useState } from 'react';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  AlertCircle,
  AlertTriangle,
  Info,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  RefreshCw,
} from 'lucide-react';
import { useFlowStore } from '@/hooks/use-flow-store';
import {
  validateFlow,
  type ValidationIssue,
  type ValidationSeverity,
} from '@/lib/flow-validator';
import { cn } from '@/lib/utils';

// -----------------------------------------------------------------------------
// Constants
// -----------------------------------------------------------------------------

const SEVERITY_ICONS: Record<ValidationSeverity, React.ComponentType<{ className?: string }>> = {
  error: AlertCircle,
  warning: AlertTriangle,
  info: Info,
};

const SEVERITY_COLORS: Record<ValidationSeverity, string> = {
  error: 'text-red-500',
  warning: 'text-yellow-500',
  info: 'text-blue-500',
};

const SEVERITY_BG: Record<ValidationSeverity, string> = {
  error: 'bg-red-500/10 border-red-500/20',
  warning: 'bg-yellow-500/10 border-yellow-500/20',
  info: 'bg-blue-500/10 border-blue-500/20',
};

// -----------------------------------------------------------------------------
// Component
// -----------------------------------------------------------------------------

export function ValidationPanel() {
  const [isOpen, setIsOpen] = useState(false);
  const nodes = useFlowStore((state) => state.nodes);
  const edges = useFlowStore((state) => state.edges);
  const selectNode = useFlowStore((state) => state.selectNode);

  // Run validation
  const validationResult = useMemo(() => {
    return validateFlow(nodes, edges);
  }, [nodes, edges]);

  const errorCount = validationResult.issues.filter((i) => i.severity === 'error').length;
  const warningCount = validationResult.issues.filter((i) => i.severity === 'warning').length;

  const handleIssueClick = (issue: ValidationIssue) => {
    if (issue.nodeId) {
      selectNode(issue.nodeId);
    }
  };

  // Determine overall status
  const getStatusInfo = () => {
    if (errorCount > 0) {
      return {
        icon: AlertCircle,
        color: 'text-red-500',
        bgColor: 'bg-red-500/10',
        label: `${errorCount}개 오류`,
      };
    }
    if (warningCount > 0) {
      return {
        icon: AlertTriangle,
        color: 'text-yellow-500',
        bgColor: 'bg-yellow-500/10',
        label: `${warningCount}개 경고`,
      };
    }
    return {
      icon: CheckCircle2,
      color: 'text-green-500',
      bgColor: 'bg-green-500/10',
      label: '유효함',
    };
  };

  const status = getStatusInfo();
  const StatusIcon = status.icon;

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <div className="bg-background/95 backdrop-blur-sm rounded-lg shadow-lg border overflow-hidden">
        {/* Header */}
        <CollapsibleTrigger asChild>
          <Button
            variant="ghost"
            className={cn(
              'w-full justify-between px-4 py-2 h-auto rounded-none',
              status.bgColor
            )}
          >
            <div className="flex items-center gap-2">
              <StatusIcon className={cn('h-4 w-4', status.color)} />
              <span className="font-medium">플로우 검증</span>
              <Badge variant="secondary" className="ml-2">
                {status.label}
              </Badge>
            </div>
            {isOpen ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </Button>
        </CollapsibleTrigger>

        {/* Content */}
        <CollapsibleContent>
          <div className="border-t">
            {/* Stats */}
            <div className="px-4 py-2 border-b bg-muted/30 text-xs text-muted-foreground">
              노드 {validationResult.stats.nodeCount}개 ·
              연결 {validationResult.stats.edgeCount}개 ·
              도달 가능 {validationResult.stats.reachableNodeCount}개
              {validationResult.stats.orphanedNodeCount > 0 && (
                <span className="text-yellow-600">
                  {' '}· 고립 {validationResult.stats.orphanedNodeCount}개
                </span>
              )}
            </div>

            {/* Issues list */}
            {validationResult.issues.length > 0 ? (
              <ScrollArea className="max-h-60">
                <div className="p-2 space-y-1">
                  {validationResult.issues.map((issue) => {
                    const Icon = SEVERITY_ICONS[issue.severity];
                    return (
                      <button
                        key={issue.id}
                        onClick={() => handleIssueClick(issue)}
                        className={cn(
                          'w-full text-left p-2 rounded-md border transition-colors',
                          'hover:bg-accent',
                          SEVERITY_BG[issue.severity],
                          issue.nodeId && 'cursor-pointer'
                        )}
                      >
                        <div className="flex items-start gap-2">
                          <Icon
                            className={cn('h-4 w-4 mt-0.5 shrink-0', SEVERITY_COLORS[issue.severity])}
                          />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm">{issue.message}</p>
                            {issue.nodeLabel && (
                              <p className="text-xs text-muted-foreground mt-0.5">
                                노드: {issue.nodeLabel}
                              </p>
                            )}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </ScrollArea>
            ) : (
              <div className="p-4 text-center text-sm text-muted-foreground">
                <CheckCircle2 className="h-8 w-8 mx-auto mb-2 text-green-500" />
                모든 검증을 통과했습니다.
              </div>
            )}
          </div>
        </CollapsibleContent>
      </div>
    </Collapsible>
  );
}
