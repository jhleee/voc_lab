'use client';

import { memo } from 'react';
import type { NodeProps } from '@xyflow/react';
import { BaseNode } from './base-node';
import type { EscalationNodeData, FlowNode } from '@/types/flow-nodes';

function EscalationNodeComponent({ data, selected }: NodeProps<FlowNode>) {
  const nodeData = data as EscalationNodeData;

  return (
    <BaseNode data={nodeData} selected={selected}>
      <div className="text-xs text-muted-foreground">
        {nodeData.summaryTemplate ? (
          <p className="line-clamp-2">요약 템플릿 설정됨</p>
        ) : (
          <p>AI 자동 요약</p>
        )}
        <p className="text-[10px] mt-1">* 상담원 종료 시 세션 종료</p>
      </div>
    </BaseNode>
  );
}

export const EscalationNode = memo(EscalationNodeComponent);
