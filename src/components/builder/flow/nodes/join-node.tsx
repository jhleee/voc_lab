'use client';

import { memo } from 'react';
import type { NodeProps } from '@xyflow/react';
import { BaseNode } from './base-node';
import type { JoinNodeData, FlowNode } from '@/types/flow-nodes';

function JoinNodeComponent({ id, data, selected }: NodeProps<FlowNode>) {
  const nodeData = data as JoinNodeData;

  return (
    <BaseNode id={id} data={nodeData} selected={selected}>
      <div className="text-xs text-muted-foreground">
        대기: {nodeData.expectedBranches}개 분기
      </div>
    </BaseNode>
  );
}

export const JoinNode = memo(JoinNodeComponent);
