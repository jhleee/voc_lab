'use client';

import { memo } from 'react';
import type { NodeProps } from '@xyflow/react';
import { BaseNode } from './base-node';
import type { ParallelNodeData, FlowNode } from '@/types/flow-nodes';

function ParallelNodeComponent({ data, selected }: NodeProps<FlowNode>) {
  const nodeData = data as ParallelNodeData;
  const branches = nodeData.branches || [];

  return (
    <BaseNode data={nodeData} selected={selected} className="min-w-[180px]">
      <div className="text-xs text-muted-foreground">
        {branches.length}개 병렬 분기
        <div className="flex gap-1 mt-1">
          {branches.slice(0, 4).map((branch) => (
            <span
              key={branch.id}
              className="px-1 py-0.5 bg-cyan-100 dark:bg-cyan-900 rounded text-[10px]"
            >
              {branch.label}
            </span>
          ))}
        </div>
      </div>
    </BaseNode>
  );
}

export const ParallelNode = memo(ParallelNodeComponent);
