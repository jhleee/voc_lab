'use client';

import { memo } from 'react';
import type { NodeProps } from '@xyflow/react';
import { BaseNode } from './base-node';
import type { ErrorFallbackNodeData, FlowNode } from '@/types/flow-nodes';

const RESTART_LABELS: Record<ErrorFallbackNodeData['restartOption'], string> = {
  last_success: '마지막 성공 노드',
  failed_node: '실패한 노드',
};

function ErrorFallbackNodeComponent({ data, selected }: NodeProps<FlowNode>) {
  const nodeData = data as ErrorFallbackNodeData;

  return (
    <BaseNode data={nodeData} selected={selected}>
      <div className="space-y-1">
        {nodeData.fallbackMessage && (
          <p className="text-xs text-muted-foreground line-clamp-2">
            {nodeData.fallbackMessage}
          </p>
        )}
        <div className="text-xs text-muted-foreground">
          재시작: {RESTART_LABELS[nodeData.restartOption]}
        </div>
      </div>
    </BaseNode>
  );
}

export const ErrorFallbackNode = memo(ErrorFallbackNodeComponent);
