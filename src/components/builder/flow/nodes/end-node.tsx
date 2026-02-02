'use client';

import { memo } from 'react';
import type { NodeProps } from '@xyflow/react';
import { BaseNode } from './base-node';
import type { EndNodeData, FlowNode } from '@/types/flow-nodes';

function EndNodeComponent({ data, selected }: NodeProps<FlowNode>) {
  const nodeData = data as EndNodeData;

  return (
    <BaseNode data={nodeData} selected={selected}>
      <div className="text-xs text-muted-foreground">
        {nodeData.preserveSession ? '세션 데이터 보관' : '세션 데이터 삭제'}
      </div>
    </BaseNode>
  );
}

export const EndNode = memo(EndNodeComponent);
