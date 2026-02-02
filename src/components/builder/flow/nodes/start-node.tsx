'use client';

import { memo } from 'react';
import type { NodeProps } from '@xyflow/react';
import { BaseNode } from './base-node';
import type { StartNodeData, FlowNode } from '@/types/flow-nodes';

const TRIGGER_LABELS: Record<StartNodeData['triggerType'], string> = {
  user_message: '사용자 메시지',
  chat_open: '채팅창 오픈',
  api_call: 'API 호출',
  email_received: '이메일 수신',
};

function StartNodeComponent({ data, selected }: NodeProps<FlowNode>) {
  const nodeData = data as StartNodeData;

  return (
    <BaseNode data={nodeData} selected={selected}>
      <div className="text-xs text-muted-foreground">
        트리거: {TRIGGER_LABELS[nodeData.triggerType]}
      </div>
    </BaseNode>
  );
}

export const StartNode = memo(StartNodeComponent);
