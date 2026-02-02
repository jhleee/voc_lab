'use client';

import { memo } from 'react';
import type { NodeProps } from '@xyflow/react';
import { BaseNode } from './base-node';
import { Badge } from '@/components/ui/badge';
import type { APIConnectorNodeData, FlowNode } from '@/types/flow-nodes';

function APIConnectorNodeComponent({ data, selected }: NodeProps<FlowNode>) {
  const nodeData = data as APIConnectorNodeData;

  return (
    <BaseNode data={nodeData} selected={selected} className="min-w-[200px]">
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-xs font-mono">
            {nodeData.method}
          </Badge>
          <span className="text-xs text-muted-foreground truncate max-w-[120px]">
            {nodeData.url || 'URL 미설정'}
          </span>
        </div>
        {nodeData.auth.type !== 'none' && (
          <div className="text-xs text-muted-foreground">
            인증: {nodeData.auth.type.toUpperCase()}
          </div>
        )}
      </div>
    </BaseNode>
  );
}

export const APIConnectorNode = memo(APIConnectorNodeComponent);
