'use client';

import { memo } from 'react';
import type { NodeProps } from '@xyflow/react';
import { Clock } from 'lucide-react';
import { BaseNode } from './base-node';
import type { ApprovalNodeData, FlowNode } from '@/types/flow-nodes';

function ApprovalNodeComponent({ data, selected }: NodeProps<FlowNode>) {
  const nodeData = data as ApprovalNodeData;

  return (
    <BaseNode data={nodeData} selected={selected} className="min-w-[200px]">
      <div className="space-y-1 text-xs text-muted-foreground">
        {nodeData.approvalRequestInfo ? (
          <p className="line-clamp-2">{nodeData.approvalRequestInfo}</p>
        ) : (
          <p>승인 요청 정보를 설정하세요</p>
        )}
        {nodeData.timeout && (
          <div className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            <span>타임아웃: {nodeData.timeout}분</span>
          </div>
        )}
      </div>
    </BaseNode>
  );
}

export const ApprovalNode = memo(ApprovalNodeComponent);
