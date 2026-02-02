'use client';

import { memo } from 'react';
import type { NodeProps } from '@xyflow/react';
import { BaseNode } from './base-node';
import { Badge } from '@/components/ui/badge';
import type { IntentClassifierNodeData, FlowNode } from '@/types/flow-nodes';

function IntentClassifierNodeComponent({ id, data, selected }: NodeProps<FlowNode>) {
  const nodeData = data as IntentClassifierNodeData;
  const intents = nodeData.intents || [];

  return (
    <BaseNode id={id} data={nodeData} selected={selected} className="min-w-[220px]">
      <div className="space-y-2">
        {intents.length > 0 ? (
          <div className="flex flex-wrap gap-1">
            {intents.slice(0, 3).map((intent) => (
              <Badge key={intent.id} variant="secondary" className="text-xs">
                {intent.name}
              </Badge>
            ))}
            {intents.length > 3 && (
              <Badge variant="outline" className="text-xs">
                +{intents.length - 3}
              </Badge>
            )}
          </div>
        ) : (
          <p className="text-xs text-muted-foreground">의도를 추가하세요</p>
        )}
        {nodeData.confidenceThreshold && (
          <div className="text-xs text-muted-foreground">
            신뢰도 임계값: {(nodeData.confidenceThreshold * 100).toFixed(0)}%
          </div>
        )}
      </div>
    </BaseNode>
  );
}

export const IntentClassifierNode = memo(IntentClassifierNodeComponent);
