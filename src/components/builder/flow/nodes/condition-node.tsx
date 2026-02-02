'use client';

import { memo } from 'react';
import type { NodeProps } from '@xyflow/react';
import { BaseNode } from './base-node';
import type { ConditionNodeData, FlowNode } from '@/types/flow-nodes';

function ConditionNodeComponent({ id, data, selected }: NodeProps<FlowNode>) {
  const nodeData = data as ConditionNodeData;
  const conditions = nodeData.conditions || [];

  return (
    <BaseNode id={id} data={nodeData} selected={selected} className="min-w-[200px]">
      <div className="space-y-1 text-xs text-muted-foreground">
        {conditions.length > 0 ? (
          <>
            <p>{conditions.length}개 조건</p>
            {conditions.slice(0, 2).map((cond) => (
              <div key={cond.id} className="truncate max-w-[160px]">
                • {cond.label}
              </div>
            ))}
            {conditions.length > 2 && (
              <div>+{conditions.length - 2}개 더</div>
            )}
          </>
        ) : (
          <p>조건을 추가하세요</p>
        )}
      </div>
    </BaseNode>
  );
}

export const ConditionNode = memo(ConditionNodeComponent);
