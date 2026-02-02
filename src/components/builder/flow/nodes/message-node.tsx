'use client';

import { memo } from 'react';
import type { NodeProps } from '@xyflow/react';
import { Clock } from 'lucide-react';
import { BaseNode } from './base-node';
import type { MessageNodeData, FlowNode } from '@/types/flow-nodes';

function MessageNodeComponent({ id, data, selected }: NodeProps<FlowNode>) {
  const nodeData = data as MessageNodeData;
  const messageCount = nodeData.messages?.length || 0;
  const firstMessage = nodeData.messages?.[0];

  return (
    <BaseNode id={id} data={nodeData} selected={selected}>
      <div className="space-y-1">
        {firstMessage?.content && (
          <p className="text-xs text-muted-foreground line-clamp-2">
            {firstMessage.content}
          </p>
        )}
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span>{messageCount}개 메시지</span>
          {nodeData.waitForResponse && (
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              응답 대기
            </span>
          )}
        </div>
      </div>
    </BaseNode>
  );
}

export const MessageNode = memo(MessageNodeComponent);
